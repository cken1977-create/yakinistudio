-- Yakini Builder, Phase 0: helper functions (9.1), server-only functions and integrity triggers.
-- SECURITY DEFINER functions pin search_path and are never executable by anon/public.

-- ---------------------------------------------------------------- 9.1 helpers
create or replace function builder.is_member(t uuid) returns boolean
language sql stable security definer set search_path = pg_catalog, builder as $$
  select exists (
    select 1 from builder.memberships m
    where m.tenant_id = t and m.user_id = auth.uid() and m.deleted_at is null
  )
$$;

create or replace function builder.has_role(t uuid, roles text[]) returns boolean
language sql stable security definer set search_path = pg_catalog, builder as $$
  select exists (
    select 1 from builder.memberships m
    where m.tenant_id = t and m.user_id = auth.uid() and m.deleted_at is null and m.role = any(roles)
  )
$$;

create or replace function builder.is_operator() returns boolean
language sql stable security definer set search_path = pg_catalog, builder as $$
  select exists (select 1 from builder.operators o where o.user_id = auth.uid())
$$;

-- First folder of a storage object path as a tenant id, or null when it isn't a uuid.
create or replace function builder.path_tenant(object_name text) returns uuid
language plpgsql immutable set search_path = pg_catalog as $$
declare first text := split_part(object_name, '/', 1);
begin
  if first ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return first::uuid; end if;
  return null;
end $$;

-- ---------------------------------------------------------------- memberships RPCs (owners only, never self-promote)
create or replace function builder.invite_member(p_tenant uuid, p_user uuid, p_role text default 'editor') returns uuid
language plpgsql security definer set search_path = pg_catalog, builder as $$
declare v_id uuid;
begin
  if auth.uid() is null or not builder.has_role(p_tenant, array['owner']) then
    raise exception 'Only an owner can invite people to this business' using errcode = '42501';
  end if;
  if p_role <> 'editor' then
    raise exception 'Invites are for editors only' using errcode = '42501';
  end if;
  if p_user = auth.uid() then
    raise exception 'You cannot change your own access' using errcode = '42501';
  end if;
  insert into builder.memberships (tenant_id, user_id, role, invited_by)
  values (p_tenant, p_user, 'editor', auth.uid())
  on conflict (tenant_id, user_id) do update
    set deleted_at = null
    where builder.memberships.role = 'editor'
  returning id into v_id;
  insert into builder.audit_log (tenant_id, actor_user_id, actor_kind, action, target_id, details)
  values (p_tenant, auth.uid(), 'owner', 'member.invite', p_user::text, jsonb_build_object('role', 'editor'));
  return v_id;
end $$;

create or replace function builder.remove_member(p_tenant uuid, p_user uuid) returns void
language plpgsql security definer set search_path = pg_catalog, builder as $$
begin
  if auth.uid() is null or not builder.has_role(p_tenant, array['owner']) then
    raise exception 'Only an owner can remove people from this business' using errcode = '42501';
  end if;
  update builder.memberships set deleted_at = now()
  where tenant_id = p_tenant and user_id = p_user and deleted_at is null;
  insert into builder.audit_log (tenant_id, actor_user_id, actor_kind, action, target_id, details)
  values (p_tenant, auth.uid(), 'owner', 'delete.soft', p_user::text, jsonb_build_object('what', 'membership'));
end $$;

-- ---------------------------------------------------------------- rate limiter (service role only)
-- Returns TRUE when the call is allowed (count within max for the current window).
create or replace function builder.hit_rate_limit(p_key text, p_max int, p_window_seconds int) returns boolean
language plpgsql security definer set search_path = pg_catalog, builder as $$
declare
  v_start timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_count int;
begin
  if p_window_seconds < 1 or p_max < 0 then raise exception 'bad limiter arguments'; end if;
  insert into builder.rate_limits as r (key, window_start, count) values (p_key, v_start, 1)
  on conflict (key, window_start) do update set count = r.count + 1
  returning count into v_count;
  return v_count <= p_max;
end $$;

-- ---------------------------------------------------------------- renderer read (service role only)
-- Only the published doc of an active, non-taken-down site. Never drafts.
create or replace function builder.published_doc_for_host(p_hostname text)
returns table (site_id uuid, tenant_id uuid, version_id uuid, doc jsonb, schema_version int, primary_host text)
language sql stable security definer set search_path = pg_catalog, builder as $$
  select s.id, s.tenant_id, v.id, v.doc, (v.doc->>'schemaVersion')::int,
         (select p.hostname from builder.domains p
           where p.site_id = s.id and p.is_primary and p.status = 'active' and p.deleted_at is null limit 1)
  from builder.domains d
  join builder.sites s on s.id = d.site_id
  join builder.site_versions v on v.id = s.published_version_id
  join builder.tenants t on t.id = s.tenant_id
  where d.hostname = lower(p_hostname)
    and d.status = 'active' and d.deleted_at is null
    and s.deleted_at is null and s.takedown_at is null
    and t.deleted_at is null
$$;

-- ---------------------------------------------------------------- visits (service role only, Q17)
create or replace function builder.record_visit(p_site uuid, p_page_slug text, p_source text, p_visitor_hash text)
returns void language plpgsql security definer set search_path = pg_catalog, builder as $$
declare
  v_tenant uuid; v_tz text; v_day date;
begin
  if p_source not in ('direct','search','social','other') then raise exception 'bad source'; end if;
  select s.tenant_id, coalesce(t.timezone, 'UTC') into v_tenant, v_tz
  from builder.sites s join builder.tenants t on t.id = s.tenant_id where s.id = p_site;
  if v_tenant is null then return; end if;
  v_day := (now() at time zone v_tz)::date;
  insert into builder.site_visits_daily as d (tenant_id, site_id, day, page_slug, views, src_direct, src_search, src_social, src_other, origin)
  select v_tenant, p_site, v_day, slug, 1,
         (p_source = 'direct')::int, (p_source = 'search')::int, (p_source = 'social')::int, (p_source = 'other')::int, 'builder'
  from unnest(array[p_page_slug, '*']) as slug
  on conflict (site_id, day, page_slug, origin) do update set
    views = d.views + 1,
    src_direct = d.src_direct + excluded.src_direct, src_search = d.src_search + excluded.src_search,
    src_social = d.src_social + excluded.src_social, src_other = d.src_other + excluded.src_other;
  if p_visitor_hash is not null then
    insert into builder.visit_hashes (site_id, day, visitor_hash) values (p_site, v_day, p_visitor_hash)
    on conflict do nothing;
  end if;
end $$;

-- ---------------------------------------------------------------- global AI spend cap input (service role only)
create or replace function builder.ai_usage_today()
returns table (input_tokens bigint, output_tokens bigint, runs bigint)
language sql stable security definer set search_path = pg_catalog, builder as $$
  select coalesce(sum(r.input_tokens), 0)::bigint, coalesce(sum(r.output_tokens), 0)::bigint, count(*)::bigint
  from builder.ai_runs r
  where r.created_at >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC'
$$;

-- ---------------------------------------------------------------- triggers
create or replace function builder.touch_updated_at() returns trigger
language plpgsql set search_path = pg_catalog as $$
begin new.updated_at := now(); return new; end $$;

create trigger tenants_touch before update on builder.tenants for each row execute function builder.touch_updated_at();
create trigger sites_touch before update on builder.sites for each row execute function builder.touch_updated_at();
create trigger subscriptions_touch before update on builder.subscriptions for each row execute function builder.touch_updated_at();

-- Client sessions (authenticated) may only save the draft: draft_rev must step by exactly one
-- and the brand block must not change (R6; brand fixes go through the owner-only server route).
create or replace function builder.sites_client_update_guard() returns trigger
language plpgsql set search_path = pg_catalog as $$
begin
  if current_user in ('authenticated', 'anon') then
    if new.draft_rev <> old.draft_rev + 1 then
      raise exception 'This draft changed somewhere else. Reload to get the latest version.' using errcode = '40001';
    end if;
    if (new.draft_doc -> 'brand') is distinct from (old.draft_doc -> 'brand') then
      raise exception 'Brand colors and logo can only be changed by the owner from Brand settings' using errcode = '42501';
    end if;
    if (to_jsonb(new) - array['draft_doc','draft_rev','updated_at']) is distinct from (to_jsonb(old) - array['draft_doc','draft_rev','updated_at']) then
      raise exception 'Only the draft can be saved here' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
create trigger sites_client_update_guard before update on builder.sites for each row execute function builder.sites_client_update_guard();

-- site_versions are immutable. The only escape hatch is an operator hard delete (R15),
-- which runs as the service role with builder.hard_delete = 'on' set for that transaction.
create or replace function builder.block_mutation() returns trigger
language plpgsql set search_path = pg_catalog as $$
begin
  if tg_op = 'DELETE' and current_user not in ('authenticated','anon')
     and coalesce(current_setting('builder.hard_delete', true), '') = 'on' then
    return old;
  end if;
  raise exception '% rows cannot be changed or deleted', tg_table_name using errcode = '42501';
end $$;
create trigger site_versions_immutable before update or delete on builder.site_versions
  for each row execute function builder.block_mutation();

-- today_updates: insert-only history; the only update is setting cleared_at once.
-- Deletes only for retention (older than 24 months) or an operator hard delete.
create or replace function builder.today_updates_guard() returns trigger
language plpgsql set search_path = pg_catalog as $$
begin
  if tg_op = 'UPDATE' then
    if old.cleared_at is null and new.cleared_at is not null
       and (to_jsonb(new) - 'cleared_at') = (to_jsonb(old) - 'cleared_at') then
      return new;
    end if;
    raise exception 'Today history cannot be edited' using errcode = '42501';
  end if;
  if current_user not in ('authenticated','anon')
     and (old.created_at < now() - interval '24 months'
          or coalesce(current_setting('builder.hard_delete', true), '') = 'on') then
    return old;
  end if;
  raise exception 'Today history cannot be deleted' using errcode = '42501';
end $$;
create trigger today_updates_guard before update or delete on builder.today_updates
  for each row execute function builder.today_updates_guard();

-- At least one active owner per tenant once it has one.
create or replace function builder.memberships_keep_owner() returns trigger
language plpgsql set search_path = pg_catalog, builder as $$
begin
  if old.role = 'owner' and old.deleted_at is null
     and (tg_op = 'DELETE' or new.deleted_at is not null or new.role <> 'owner')
     and exists (select 1 from builder.tenants t where t.id = old.tenant_id)
     and not exists (
       select 1 from builder.memberships m
       where m.tenant_id = old.tenant_id and m.role = 'owner' and m.deleted_at is null and m.id <> old.id)
  then
    raise exception 'A business must keep at least one owner' using errcode = '23514';
  end if;
  return coalesce(new, old);
end $$;
create trigger memberships_keep_owner after update or delete on builder.memberships
  for each row execute function builder.memberships_keep_owner();
