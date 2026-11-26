-- YAKINI BUILDER · Phase 5a: custom domains (docs/spec/phase-5.md). Repo only: Clarence applies it.
-- Server-only functions; each is one transaction with its audit row. The `domains` table and the
-- 'domain.add' / 'domain.remove' audit actions exist since Phase 0.

-- ---------------------------------------------------------------- add (one custom domain per site)
-- p_names: the main name first (e.g. example.com), then extra names (www.example.com).
create or replace function builder.add_custom_domain(p_site uuid, p_user uuid, p_names text[], p_project text)
returns void
language plpgsql security definer set search_path = pg_catalog, builder as $$
declare s record; n text;
begin
  select * into s from builder.sites where id = p_site for update;
  if not found or s.deleted_at is not null then raise exception 'site_not_found' using errcode = 'P0002'; end if;
  if s.takedown_at is not null then raise exception 'taken_down'; end if;
  if coalesce(array_length(p_names, 1), 0) not between 1 and 2 then raise exception 'bad names'; end if;
  if exists (select 1 from builder.domains where site_id = p_site and kind = 'custom' and deleted_at is null) then
    raise exception 'has_custom_domain';
  end if;
  foreach n in array p_names loop
    if exists (select 1 from builder.domains where hostname = n and deleted_at is null) then raise exception 'address_taken'; end if;
    delete from builder.domains where hostname = n and deleted_at is not null; -- an old, removed row frees the name
    insert into builder.domains (tenant_id, site_id, hostname, kind, is_primary, status, vercel_project_id)
    values (s.tenant_id, p_site, n, 'custom', false, 'pending', p_project);
  end loop;
  insert into builder.audit_log (tenant_id, actor_user_id, actor_kind, action, target_id, details)
  values (s.tenant_id, p_user, 'owner', 'domain.add', p_site::text, jsonb_build_object('names', p_names));
end $$;

-- ---------------------------------------------------------------- record a check
-- p_make_primary: this is the site's main custom name and it is now active.
create or replace function builder.set_domain_status(p_hostname text, p_status text, p_verification jsonb, p_make_primary boolean)
returns void
language plpgsql security definer set search_path = pg_catalog, builder as $$
declare d record;
begin
  if p_status not in ('pending','verifying','active','misconfigured','error') then raise exception 'bad status'; end if;
  select * into d from builder.domains where hostname = p_hostname and deleted_at is null for update;
  if not found then raise exception 'domain_not_found' using errcode = 'P0002'; end if;
  update builder.domains set status = p_status, verification = p_verification, last_checked_at = now(),
         check_attempts = check_attempts + 1,
         verified_at = case when p_status = 'active' then coalesce(verified_at, now()) else verified_at end
   where id = d.id;
  if p_make_primary and p_status = 'active' and not d.is_primary then
    update builder.domains set is_primary = false where site_id = d.site_id and is_primary and deleted_at is null;
    update builder.domains set is_primary = true where id = d.id;
  end if;
end $$;

-- ---------------------------------------------------------------- remove
-- Returns the names that were removed (the server then removes them from Vercel). The site's
-- yakini.digital address becomes the primary again.
create or replace function builder.remove_custom_domain(p_site uuid, p_user uuid)
returns setof text
language plpgsql security definer set search_path = pg_catalog, builder as $$
declare s record; n text;
begin
  select * into s from builder.sites where id = p_site for update;
  if not found or s.deleted_at is not null then raise exception 'site_not_found' using errcode = 'P0002'; end if;
  for n in update builder.domains set status = 'removed', is_primary = false, deleted_at = now()
            where site_id = p_site and kind = 'custom' and deleted_at is null returning hostname loop
    return next n;
  end loop;
  if not exists (select 1 from builder.domains where site_id = p_site and is_primary and deleted_at is null) then
    update builder.domains set is_primary = true
     where id = (select id from builder.domains where site_id = p_site and kind = 'subdomain' and deleted_at is null order by created_at desc limit 1);
  end if;
  insert into builder.audit_log (tenant_id, actor_user_id, actor_kind, action, target_id, details)
  values (s.tenant_id, p_user, 'owner', 'domain.remove', p_site::text, '{}'::jsonb);
end $$;

-- ---------------------------------------------------------------- grants: server only
do $$
declare f text;
begin
  foreach f in array array[
    'builder.add_custom_domain(uuid, uuid, text[], text)',
    'builder.set_domain_status(text, text, jsonb, boolean)',
    'builder.remove_custom_domain(uuid, uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
