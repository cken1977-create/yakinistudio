-- YAKINI BUILDER · Phase 3: publish, rollback, unpublish, review gate, takedown, reports, share links.
-- Every function here is server-only (service role). Each one does its whole job in one transaction
-- and writes its own audit row, so a half-finished publish or takedown can't happen.
-- Tables are unchanged except two new audit actions ('unpublish', 'report.create').

-- ---------------------------------------------------------------- audit actions
alter table builder.audit_log drop constraint audit_log_action_check;
alter table builder.audit_log add constraint audit_log_action_check check (action in (
  'publish','rollback','domain.add','domain.remove','brand.colors.change','override.publish','handoff.start',
  'member.invite','delete.soft','restore','review.approve','review.reject','takedown','takedown.auto_hold',
  'takedown.lift','report.dismiss','report.actioned','share.create','share.revoke','export.create',
  'export.download','forms.csv','today.post','today.clear','fleet.release','fleet.stage','fleet.halt',
  'fleet.rollback','runtime_link.create','runtime_link.rotate','schema.check',
  'unpublish','report.create'));

-- ---------------------------------------------------------------- paid plan (Q10, Q12)
-- A tenant counts as paying when its status is active/past_due or it has a live subscription.
create or replace function builder.tenant_has_plan(p_tenant uuid) returns boolean
language sql stable security definer set search_path = pg_catalog, builder as $$
  select exists (select 1 from builder.tenants t where t.id = p_tenant and t.status in ('active','past_due'))
      or exists (select 1 from builder.subscriptions s where s.tenant_id = p_tenant and s.status in ('active','trialing','past_due'))
$$;

-- ---------------------------------------------------------------- renderer lookup (13.5)
-- What a host should show. Never returns a draft, and never returns the doc of a site under
-- takedown or auto-hold (the renderer shows the neutral page for those).
create or replace function builder.site_for_host(p_hostname text)
returns table (site_id uuid, tenant_id uuid, state text, version_id uuid, doc jsonb, primary_host text,
               indexable boolean, has_plan boolean, report_link_hidden boolean)
language sql stable security definer set search_path = pg_catalog, builder as $$
  select s.id, s.tenant_id,
         case when s.takedown_at is not null then 'taken_down'
              when s.published_version_id is null then 'unpublished' else 'live' end,
         case when s.takedown_at is null then v.id end,
         case when s.takedown_at is null then v.doc end,
         (select p.hostname from builder.domains p
           where p.site_id = s.id and p.is_primary and p.status = 'active' and p.deleted_at is null limit 1),
         s.indexable, builder.tenant_has_plan(s.tenant_id), s.report_link_hidden
  from builder.domains d
  join builder.sites s on s.id = d.site_id
  join builder.tenants t on t.id = s.tenant_id
  left join builder.site_versions v on v.id = s.published_version_id
  where d.hostname = lower(p_hostname)
    and d.status = 'active' and d.deleted_at is null
    and s.deleted_at is null and t.deleted_at is null
$$;

-- ---------------------------------------------------------------- publish (11.2 steps 2, 4-8)
-- p_forms: [{ "formKey": "contact", "kind": "contact"|"catering"|"booking_request", "fields": [...] }]
-- p_domain_status: 'active' once the host accepted the address, else 'pending'.
create or replace function builder.publish_site(
  p_site uuid, p_doc jsonb, p_sha text, p_user uuid, p_slug text, p_hostname text, p_domain_status text,
  p_forms jsonb, p_actor_kind text, p_override_reason text default null
) returns table (version_id uuid, version_number int)
language plpgsql security definer set search_path = pg_catalog, builder as $$
declare s record; n int; v_id uuid; d record; f jsonb;
begin
  if p_domain_status not in ('active','pending') then raise exception 'bad domain status'; end if;
  if p_actor_kind not in ('owner','operator') then raise exception 'bad actor'; end if;
  if split_part(p_hostname, '.', 1) <> p_slug then raise exception 'hostname does not match slug'; end if;
  select * into s from builder.sites where id = p_site for update;
  if not found or s.deleted_at is not null then raise exception 'site_not_found' using errcode = 'P0002'; end if;
  if s.takedown_at is not null then raise exception 'site_taken_down' using errcode = '42501'; end if;

  select coalesce(max(number), 0) + 1 into n from builder.site_versions where site_id = p_site;
  insert into builder.site_versions (tenant_id, site_id, number, kind, doc, doc_sha256, created_by, note)
    values (s.tenant_id, p_site, n, 'published', p_doc, p_sha, p_user, 'Published')
    returning id into v_id;

  -- The address: one subdomain per site. A new slug retires the old address (kept, marked removed).
  if s.slug <> p_slug then
    update builder.sites set slug = p_slug where id = p_site;
  end if;
  update builder.domains set status = 'removed', is_primary = false, deleted_at = now()
   where site_id = p_site and kind = 'subdomain' and hostname <> p_hostname and deleted_at is null;
  -- A removed address that another site once used may be reused (it is config, not customer data).
  delete from builder.domains where hostname = p_hostname and site_id <> p_site and deleted_at is not null;
  select * into d from builder.domains where hostname = p_hostname;
  if found and d.site_id <> p_site then raise exception 'address_taken' using errcode = '23505'; end if;
  if found then
    update builder.domains
       set status = case when d.status = 'active' then 'active' else p_domain_status end,
           deleted_at = null,
           is_primary = not exists (select 1 from builder.domains o where o.site_id = p_site and o.id <> d.id and o.is_primary and o.deleted_at is null)
     where id = d.id;
  else
    insert into builder.domains (tenant_id, site_id, hostname, kind, is_primary, status, verified_at)
    values (s.tenant_id, p_site, p_hostname, 'subdomain',
            not exists (select 1 from builder.domains o where o.site_id = p_site and o.is_primary and o.deleted_at is null),
            p_domain_status, case when p_domain_status = 'active' then now() end);
  end if;

  -- Every form on the site has a forms row (11.1 item 7). Rows are never deleted here, so old
  -- submissions keep their form.
  for f in select * from jsonb_array_elements(coalesce(p_forms, '[]'::jsonb)) loop
    insert into builder.forms (tenant_id, site_id, form_key, kind, fields, portal_target)
    values (s.tenant_id, p_site, f->>'formKey', f->>'kind', coalesce(f->'fields', '[]'::jsonb),
            case when f->>'kind' = 'booking_request' then 'room_request' else 'contact' end)
    on conflict (site_id, form_key) do update set kind = excluded.kind, fields = excluded.fields, portal_target = excluded.portal_target;
  end loop;

  update builder.sites set published_version_id = v_id where id = p_site;
  update builder.tenants set first_live_at = coalesce(first_live_at, now()) where id = s.tenant_id;
  insert into builder.audit_log (tenant_id, actor_user_id, actor_kind, action, target_id, details)
  values (s.tenant_id, p_user, p_actor_kind, 'publish', p_site::text,
          jsonb_build_object('version', n, 'host', p_hostname, 'domain_status', p_domain_status));
  if p_override_reason is not null then
    insert into builder.audit_log (tenant_id, actor_user_id, actor_kind, action, target_id, details)
    values (s.tenant_id, p_user, 'operator', 'override.publish', p_site::text, jsonb_build_object('version', n, 'reason', left(p_override_reason, 500)));
  end if;
  return query select v_id, n;
end $$;

-- ---------------------------------------------------------------- review gate (14.8 #6)
create or replace function builder.request_review(
  p_site uuid, p_doc jsonb, p_sha text, p_user uuid, p_trigger text, p_flags jsonb
) returns table (review_id uuid, version_id uuid, version_number int)
language plpgsql security definer set search_path = pg_catalog, builder as $$
declare s record; n int; v_id uuid; r_id uuid;
begin
  if p_trigger not in ('override','risk_check') then raise exception 'bad trigger'; end if;
  select * into s from builder.sites where id = p_site for update;
  if not found or s.deleted_at is not null then raise exception 'site_not_found' using errcode = 'P0002'; end if;
  if s.takedown_at is not null then raise exception 'site_taken_down' using errcode = '42501'; end if;
  select coalesce(max(number), 0) + 1 into n from builder.site_versions where site_id = p_site;
  insert into builder.site_versions (tenant_id, site_id, number, kind, doc, doc_sha256, created_by, note)
    values (s.tenant_id, p_site, n, 'review', p_doc, p_sha, p_user, 'Waiting for a quick look')
    returning id into v_id;
  -- A newer version replaces any review still waiting for this site.
  update builder.publish_reviews set status = 'rejected', decided_at = now(), decision_note = 'Replaced by a newer version'
   where site_id = p_site and status = 'pending';
  insert into builder.publish_reviews (tenant_id, site_id, version_id, trigger, risk_flags)
    values (s.tenant_id, p_site, v_id, p_trigger, coalesce(p_flags, '[]'::jsonb)) returning id into r_id;
  update builder.sites set review_status = 'pending' where id = p_site;
  return query select r_id, v_id, n;
end $$;

-- Records the decision. On approve the server publishes the reviewed version first (publish_site),
-- then calls this, so a failed publish leaves the review waiting.
create or replace function builder.decide_review(p_review uuid, p_operator uuid, p_approve boolean, p_note text)
returns boolean
language plpgsql security definer set search_path = pg_catalog, builder as $$
declare r record;
begin
  select * into r from builder.publish_reviews where id = p_review for update;
  if not found or r.status <> 'pending' then return false; end if;
  update builder.publish_reviews
     set status = case when p_approve then 'approved' else 'rejected' end, decided_by = p_operator, decided_at = now(),
         decision_note = nullif(left(coalesce(p_note, ''), 500), '')
   where id = p_review;
  update builder.sites set review_status = case when p_approve then 'approved' else 'rejected' end where id = r.site_id;
  insert into builder.audit_log (tenant_id, actor_user_id, actor_kind, action, target_id, details)
  values (r.tenant_id, p_operator, 'operator', case when p_approve then 'review.approve' else 'review.reject' end, r.site_id::text,
          jsonb_build_object('review', p_review, 'version', r.version_id));
  return true;
end $$;

-- ---------------------------------------------------------------- rollback / unpublish (11.2)
create or replace function builder.rollback_site(p_site uuid, p_version uuid, p_user uuid, p_actor_kind text)
returns int
language plpgsql security definer set search_path = pg_catalog, builder as $$
declare s record; v record;
begin
  select * into s from builder.sites where id = p_site for update;
  if not found or s.deleted_at is not null then raise exception 'site_not_found' using errcode = 'P0002'; end if;
  if s.takedown_at is not null then raise exception 'site_taken_down' using errcode = '42501'; end if;
  select id, number into v from builder.site_versions where id = p_version and site_id = p_site and kind = 'published';
  if not found then raise exception 'version_not_found' using errcode = 'P0002'; end if;
  update builder.sites set published_version_id = v.id where id = p_site;
  insert into builder.audit_log (tenant_id, actor_user_id, actor_kind, action, target_id, details)
  values (s.tenant_id, p_user, p_actor_kind, 'rollback', p_site::text, jsonb_build_object('version', v.number));
  return v.number;
end $$;

create or replace function builder.unpublish_site(p_site uuid, p_user uuid, p_actor_kind text)
returns boolean
language plpgsql security definer set search_path = pg_catalog, builder as $$
declare s record;
begin
  select * into s from builder.sites where id = p_site for update;
  if not found or s.deleted_at is not null then raise exception 'site_not_found' using errcode = 'P0002'; end if;
  if s.published_version_id is null then return false; end if;
  update builder.sites set published_version_id = null where id = p_site;
  insert into builder.audit_log (tenant_id, actor_user_id, actor_kind, action, target_id, details)
  values (s.tenant_id, p_user, p_actor_kind, 'unpublish', p_site::text, '{}'::jsonb);
  return true;
end $$;

-- ---------------------------------------------------------------- takedown / auto-hold / restore (14.8 #7-8)
-- Nothing is deleted: the published version, drafts, forms and submissions all stay. Share links are
-- revoked (they must be made again after a restore).
create or replace function builder.takedown_site(p_site uuid, p_kind text, p_reason text, p_note text, p_user uuid)
returns boolean
language plpgsql security definer set search_path = pg_catalog, builder as $$
declare s record;
begin
  if p_kind not in ('operator','auto_hold') then raise exception 'bad takedown kind'; end if;
  select * into s from builder.sites where id = p_site for update;
  if not found or s.deleted_at is not null then raise exception 'site_not_found' using errcode = 'P0002'; end if;
  if s.takedown_at is not null then return false; end if;
  update builder.sites set takedown_at = now(), takedown_kind = p_kind, takedown_reason = p_reason where id = p_site;
  update builder.share_links set revoked_at = now() where site_id = p_site and revoked_at is null;
  insert into builder.audit_log (tenant_id, actor_user_id, actor_kind, action, target_id, details)
  values (s.tenant_id, p_user, case when p_kind = 'operator' then 'operator' else 'system' end,
          case when p_kind = 'operator' then 'takedown' else 'takedown.auto_hold' end, p_site::text,
          jsonb_build_object('reason', p_reason, 'note', nullif(left(coalesce(p_note, ''), 500), '')));
  return true;
end $$;

create or replace function builder.lift_takedown(p_site uuid, p_user uuid, p_note text)
returns boolean
language plpgsql security definer set search_path = pg_catalog, builder as $$
declare s record;
begin
  select * into s from builder.sites where id = p_site for update;
  if not found or s.deleted_at is not null then raise exception 'site_not_found' using errcode = 'P0002'; end if;
  if s.takedown_at is null then return false; end if;
  update builder.sites set takedown_at = null, takedown_kind = null, takedown_reason = null where id = p_site;
  insert into builder.audit_log (tenant_id, actor_user_id, actor_kind, action, target_id, details)
  values (s.tenant_id, p_user, 'operator', 'takedown.lift', p_site::text,
          jsonb_build_object('was', s.takedown_kind, 'note', nullif(left(coalesce(p_note, ''), 500), '')));
  return true;
end $$;

-- ---------------------------------------------------------------- abuse reports (Flow I) + auto-hold (Q12)
-- Stores the report, then holds an UNPAID site on p_threshold reports from distinct reporter IP hashes
-- within p_window_hours, or on any phishing report. Paid sites are only ever taken down by an operator.
create or replace function builder.file_abuse_report(
  p_site uuid, p_host text, p_reason text, p_details text, p_email text, p_says_owner boolean, p_ip_hash text,
  p_threshold int, p_window_hours int
) returns table (report_id uuid, held boolean)
language plpgsql security definer set search_path = pg_catalog, builder as $$
declare s record; r_id uuid; distinct_ips int; do_hold boolean := false; v_held boolean := false;
begin
  if p_threshold < 1 or p_window_hours < 1 then raise exception 'bad auto-hold settings'; end if;
  select id, tenant_id, takedown_at, deleted_at into s from builder.sites where id = p_site for update;
  if not found or s.deleted_at is not null then raise exception 'site_not_found' using errcode = 'P0002'; end if;
  insert into builder.abuse_reports (tenant_id, site_id, host, reason, details, reporter_email, reporter_says_owner, reporter_ip_hash)
  values (s.tenant_id, p_site, left(lower(p_host), 253), p_reason, p_details, nullif(p_email, ''), coalesce(p_says_owner, false), p_ip_hash)
  returning id into r_id;
  insert into builder.audit_log (tenant_id, actor_user_id, actor_kind, action, target_id, details)
  values (s.tenant_id, null, 'anonymous', 'report.create', p_site::text, jsonb_build_object('report', r_id, 'reason', p_reason));

  if s.takedown_at is null and not builder.tenant_has_plan(s.tenant_id) then
    if p_reason = 'phishing' then
      do_hold := true;
    else
      select count(distinct reporter_ip_hash) into distinct_ips from builder.abuse_reports
       where site_id = p_site and reporter_ip_hash is not null and status = 'open'
         and created_at > now() - make_interval(hours => p_window_hours);
      do_hold := distinct_ips >= p_threshold;
    end if;
    if do_hold then
      v_held := builder.takedown_site(p_site, 'auto_hold', p_reason, 'Automatic hold after reports', null);
    end if;
  end if;
  return query select r_id, v_held;
end $$;

create or replace function builder.decide_report(p_report uuid, p_operator uuid, p_status text, p_note text)
returns boolean
language plpgsql security definer set search_path = pg_catalog, builder as $$
declare r record;
begin
  if p_status not in ('dismissed','actioned') then raise exception 'bad report status'; end if;
  select * into r from builder.abuse_reports where id = p_report for update;
  if not found or r.status <> 'open' then return false; end if;
  update builder.abuse_reports set status = p_status, handled_by = p_operator, handled_at = now(),
         operator_note = nullif(left(coalesce(p_note, ''), 1000), '')
   where id = p_report;
  insert into builder.audit_log (tenant_id, actor_user_id, actor_kind, action, target_id, details)
  values (r.tenant_id, p_operator, 'operator', case when p_status = 'dismissed' then 'report.dismiss' else 'report.actioned' end,
          r.site_id::text, jsonb_build_object('report', p_report));
  return true;
end $$;

-- ---------------------------------------------------------------- share links (14.8 #3)
-- Only the token's hash is stored; the token is shown once by the server and never again.
create or replace function builder.create_share_link(
  p_site uuid, p_version uuid, p_token_hash text, p_user uuid, p_days int, p_max_active int
) returns uuid
language plpgsql security definer set search_path = pg_catalog, builder as $$
declare s record; active int; l_id uuid;
begin
  if p_days < 1 or p_days > 30 then raise exception 'share links last 1 to 30 days'; end if;
  select * into s from builder.sites where id = p_site for update;
  if not found or s.deleted_at is not null then raise exception 'site_not_found' using errcode = 'P0002'; end if;
  if s.takedown_at is not null then raise exception 'site_taken_down' using errcode = '42501'; end if;
  if p_version is not null and not exists (select 1 from builder.site_versions where id = p_version and site_id = p_site) then
    raise exception 'version_not_found' using errcode = 'P0002';
  end if;
  select count(*) into active from builder.share_links where site_id = p_site and revoked_at is null and expires_at > now();
  if active >= p_max_active then raise exception 'too_many_share_links' using errcode = '54000'; end if;
  insert into builder.share_links (tenant_id, site_id, version_id, token_hash, created_by, expires_at)
  values (s.tenant_id, p_site, p_version, p_token_hash, p_user, now() + make_interval(days => p_days))
  returning id into l_id;
  insert into builder.audit_log (tenant_id, actor_user_id, actor_kind, action, target_id, details)
  values (s.tenant_id, p_user, 'owner', 'share.create', p_site::text, jsonb_build_object('link', l_id, 'days', p_days));
  return l_id;
end $$;

create or replace function builder.revoke_share_link(p_site uuid, p_link uuid, p_user uuid, p_actor_kind text)
returns boolean
language plpgsql security definer set search_path = pg_catalog, builder as $$
declare l record;
begin
  select * into l from builder.share_links where id = p_link and site_id = p_site for update;
  if not found or l.revoked_at is not null then return false; end if;
  update builder.share_links set revoked_at = now() where id = p_link;
  insert into builder.audit_log (tenant_id, actor_user_id, actor_kind, action, target_id, details)
  values (l.tenant_id, p_user, p_actor_kind, 'share.revoke', p_site::text, jsonb_build_object('link', p_link));
  return true;
end $$;

-- A valid (not expired, not revoked, site not taken down) link for a token hash, or nothing.
create or replace function builder.use_share_link(p_token_hash text)
returns table (site_id uuid, tenant_id uuid, version_id uuid, expires_at timestamptz)
language plpgsql security definer set search_path = pg_catalog, builder as $$
begin
  return query
    update builder.share_links l set last_used_at = now()
      from builder.sites s
     where l.token_hash = p_token_hash and l.revoked_at is null and l.expires_at > now()
       and s.id = l.site_id and s.takedown_at is null and s.deleted_at is null
    returning l.site_id, l.tenant_id, l.version_id, l.expires_at;
end $$;

-- ---------------------------------------------------------------- grants: server only
do $$
declare f text;
begin
  foreach f in array array[
    'builder.tenant_has_plan(uuid)', 'builder.site_for_host(text)',
    'builder.publish_site(uuid, jsonb, text, uuid, text, text, text, jsonb, text, text)',
    'builder.request_review(uuid, jsonb, text, uuid, text, jsonb)', 'builder.decide_review(uuid, uuid, boolean, text)',
    'builder.rollback_site(uuid, uuid, uuid, text)', 'builder.unpublish_site(uuid, uuid, text)',
    'builder.takedown_site(uuid, text, text, text, uuid)', 'builder.lift_takedown(uuid, uuid, text)',
    'builder.file_abuse_report(uuid, text, text, text, text, boolean, text, int, int)',
    'builder.decide_report(uuid, uuid, text, text)',
    'builder.create_share_link(uuid, uuid, text, uuid, int, int)', 'builder.revoke_share_link(uuid, uuid, uuid, text)',
    'builder.use_share_link(text)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
