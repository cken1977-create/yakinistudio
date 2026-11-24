-- YAKINI BUILDER · Phase 2 (editor): claiming an anonymous draft, and numbered versions.
-- Both are server-only (service role). Nothing here changes an existing table or policy.

-- Flow B (spec 5.4 step 3): the signed-in person who holds the draft cookie becomes its owner.
-- p_token_hash is the HMAC of the cookie token (the token itself never reaches the database).
-- Returns 'ok', 'not_found' (wrong site/token, deleted), 'expired', 'already_claimed', or 'changed'
-- when p_doc was built from draft_rev p_base_rev and the draft has moved on since (the caller
-- re-reads and tries once more, so details typed on the claim screen are never written over an edit).
create or replace function builder.claim_draft(
  p_site uuid, p_token_hash text, p_user uuid, p_ip_hash text, p_timezone text, p_doc jsonb, p_base_rev int default null
) returns text
language plpgsql security definer set search_path = pg_catalog as $$
declare s record;
begin
  if p_token_hash !~ '^[0-9a-f]{64}$' then return 'not_found'; end if;
  if p_ip_hash is not null and p_ip_hash !~ '^[0-9a-f]{64}$' then raise exception 'bad ip hash'; end if;
  select id, tenant_id, draft_token_hash, draft_expires_at, draft_rev, deleted_at into s
    from builder.sites where id = p_site for update;
  if not found or s.deleted_at is not null then return 'not_found'; end if;
  if s.draft_token_hash is null then return 'already_claimed'; end if;
  if s.draft_token_hash <> p_token_hash then return 'not_found'; end if;
  if s.draft_expires_at is not null and s.draft_expires_at < now() then return 'expired'; end if;
  if p_doc is not null and p_base_rev is distinct from s.draft_rev then return 'changed'; end if;

  insert into builder.memberships (tenant_id, user_id, role) values (s.tenant_id, p_user, 'owner')
    on conflict (tenant_id, user_id) do nothing;
  update builder.tenants
     set status = 'trial', ownership_attested_at = now(), ownership_attested_ip_hash = p_ip_hash,
         timezone = coalesce(nullif(p_timezone, ''), timezone)
   where id = s.tenant_id and status = 'prospect';
  update builder.sites
     set draft_token_hash = null, draft_expires_at = null,
         draft_doc = coalesce(p_doc, draft_doc),
         draft_rev = draft_rev + case when p_doc is null then 0 else 1 end
   where id = s.id;
  return 'ok';
end $$;

-- Versions (spec 10.5): numbered per site without races; rows stay immutable (existing trigger).
create or replace function builder.create_version(
  p_site uuid, p_kind text, p_doc jsonb, p_sha text, p_user uuid, p_note text
) returns table (id uuid, number int)
language plpgsql security definer set search_path = pg_catalog as $$
declare t uuid; n int;
begin
  select tenant_id into t from builder.sites where sites.id = p_site and deleted_at is null for update;
  if not found then raise exception 'site not found'; end if;
  select coalesce(max(v.number), 0) + 1 into n from builder.site_versions v where v.site_id = p_site;
  return query
    insert into builder.site_versions (tenant_id, site_id, number, kind, doc, doc_sha256, created_by, note)
    values (t, p_site, n, p_kind, p_doc, p_sha, p_user, nullif(left(p_note, 200), ''))
    returning site_versions.id, site_versions.number;
end $$;

revoke all on function builder.claim_draft(uuid, text, uuid, text, text, jsonb, int) from public, anon, authenticated;
revoke all on function builder.create_version(uuid, text, jsonb, text, uuid, text) from public, anon, authenticated;
grant execute on function builder.claim_draft(uuid, text, uuid, text, text, jsonb, int), builder.create_version(uuid, text, jsonb, text, uuid, text) to service_role;
