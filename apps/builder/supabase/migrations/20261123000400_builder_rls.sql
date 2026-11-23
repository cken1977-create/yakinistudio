-- Yakini Builder, Phase 0: grants + RLS (spec v1.1 Section 9.3, written as specified).
-- Model: anon gets nothing. authenticated gets SELECT only where a policy allows, plus the few
-- column-limited UPDATEs below. Every other write goes through server routes (service role).

-- ---------------------------------------------------------------- schema + default privileges
revoke all on schema builder from public, anon;
grant usage on schema builder to authenticated, service_role;

revoke all on all tables in schema builder from public, anon, authenticated;
revoke all on all sequences in schema builder from public, anon, authenticated;
revoke all on all functions in schema builder from public, anon, authenticated;
alter default privileges in schema builder revoke all on tables from public, anon, authenticated;
alter default privileges in schema builder revoke all on functions from public, anon, authenticated;
alter default privileges in schema builder revoke all on sequences from public, anon, authenticated;

grant all on all tables in schema builder to service_role;
grant all on all sequences in schema builder to service_role;

-- Helpers callable by signed-in users (used inside policies and by the editor).
grant execute on function builder.is_member(uuid), builder.has_role(uuid, text[]), builder.is_operator(),
  builder.path_tenant(text), builder.invite_member(uuid, uuid, text), builder.remove_member(uuid, uuid)
  to authenticated, service_role;
-- Server-only functions.
grant execute on function builder.hit_rate_limit(text, int, int), builder.published_doc_for_host(text),
  builder.record_visit(uuid, text, text, text), builder.ai_usage_today() to service_role;

-- ---------------------------------------------------------------- enable RLS everywhere
do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'builder' loop
    execute format('alter table builder.%I enable row level security', r.tablename);
  end loop;
end $$;

-- ---------------------------------------------------------------- tenants
grant select on builder.tenants to authenticated;
grant update (name) on builder.tenants to authenticated;
create policy tenants_select on builder.tenants for select to authenticated
  using (builder.is_member(id) or builder.is_operator());
create policy tenants_owner_rename on builder.tenants for update to authenticated
  using (builder.has_role(id, array['owner'])) with check (builder.has_role(id, array['owner']));

-- ---------------------------------------------------------------- operators (staff list visible to staff only)
grant select on builder.operators to authenticated;
create policy operators_select on builder.operators for select to authenticated
  using (builder.is_operator());

-- ---------------------------------------------------------------- memberships (writes only via invite/remove RPCs)
grant select on builder.memberships to authenticated;
create policy memberships_select on builder.memberships for select to authenticated
  using (builder.is_member(tenant_id) or builder.is_operator());

-- ---------------------------------------------------------------- sites (draft saves only)
grant select on builder.sites to authenticated;
grant update (draft_doc, draft_rev) on builder.sites to authenticated;
create policy sites_select on builder.sites for select to authenticated
  using (builder.has_role(tenant_id, array['owner','editor']) or builder.is_operator());
create policy sites_draft_update on builder.sites for update to authenticated
  using ((builder.has_role(tenant_id, array['owner','editor']) or builder.is_operator()) and takedown_at is null and deleted_at is null)
  with check (builder.has_role(tenant_id, array['owner','editor']) or builder.is_operator());

-- ---------------------------------------------------------------- member/operator read-only tables
do $$
declare t text;
begin
  foreach t in array array['site_versions','assets','forms','form_submissions','chat_messages','site_edits',
                           'share_links','today_updates','site_visits_daily'] loop
    execute format('grant select on builder.%I to authenticated', t);
    execute format('create policy %I on builder.%I for select to authenticated using (builder.is_member(tenant_id) or builder.is_operator())', t || '_select', t);
  end loop;
end $$;

-- ---------------------------------------------------------------- owner/operator read-only tables
do $$
declare t text;
begin
  foreach t in array array['domains','subscriptions','audit_log','exports','client_deployments'] loop
    execute format('grant select on builder.%I to authenticated', t);
    execute format('create policy %I on builder.%I for select to authenticated using (builder.has_role(tenant_id, array[''owner'']) or builder.is_operator())', t || '_select', t);
  end loop;
end $$;

-- ai_runs may have no tenant (anonymous drafts): owners see their tenant's rows, operators see all.
grant select on builder.ai_runs to authenticated;
create policy ai_runs_select on builder.ai_runs for select to authenticated
  using ((tenant_id is not null and builder.has_role(tenant_id, array['owner'])) or builder.is_operator());

-- ---------------------------------------------------------------- operator-only tables (no reporter details to owners)
do $$
declare t text;
begin
  foreach t in array array['abuse_reports','publish_reviews','runtime_releases'] loop
    execute format('grant select on builder.%I to authenticated', t);
    execute format('create policy %I on builder.%I for select to authenticated using (builder.is_operator())', t || '_select', t);
  end loop;
end $$;

-- ---------------------------------------------------------------- tutorial_progress: your own steps on sites you belong to
grant select, insert, update on builder.tutorial_progress to authenticated;
create policy tutorial_select on builder.tutorial_progress for select to authenticated
  using (user_id = auth.uid());
create policy tutorial_insert on builder.tutorial_progress for insert to authenticated
  with check (user_id = auth.uid() and exists (
    select 1 from builder.sites s where s.id = site_id and builder.is_member(s.tenant_id)));
create policy tutorial_update on builder.tutorial_progress for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------- no client access at all (operators included)
-- stripe_events, rate_limits, runtime_links, visit_hashes, visit_salts:
-- RLS on, no policies, no grants to authenticated/anon. Service role only.
