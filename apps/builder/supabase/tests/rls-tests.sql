-- YAKINI BUILDER · RLS tests (spec v1.1 Section 16.3). FAKE data. Each check raises on failure.
\set ON_ERROR_STOP on
SET client_min_messages = notice;

CREATE SCHEMA bt;
GRANT USAGE ON SCHEMA bt TO anon, authenticated, service_role;
CREATE FUNCTION bt.ok(cond boolean, label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF cond IS NOT TRUE THEN RAISE EXCEPTION 'FAIL: %', label; END IF;
  RAISE NOTICE 'PASS: %', label;
END $$;
CREATE FUNCTION bt.login(p_uid uuid) RETURNS void LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, false);
$$;
CREATE FUNCTION bt.logout() RETURNS void LANGUAGE sql AS $$ SELECT set_config('request.jwt.claims', '', false); $$;
-- Rows visible in a table for the current role; -1 when access is denied outright.
CREATE FUNCTION bt.visible(t text) RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE n bigint;
BEGIN
  EXECUTE format('SELECT count(*) FROM builder.%I', t) INTO n; RETURN n;
EXCEPTION WHEN insufficient_privilege THEN RETURN -1;
END $$;
-- Rows of tenant p visible in a tenant_id table; -1 when denied.
CREATE FUNCTION bt.visible_for(t text, p uuid) RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE n bigint;
BEGIN
  EXECUTE format('SELECT count(*) FROM builder.%I WHERE %s = $1', t, CASE WHEN t = 'tenants' THEN 'id' ELSE 'tenant_id' END) USING p INTO n; RETURN n;
EXCEPTION WHEN insufficient_privilege THEN RETURN -1;
END $$;
-- Attempts UPDATE/DELETE on tenant p rows in every tenant table. Returns writes that landed.
CREATE FUNCTION bt.writes_on(p uuid) RETURNS text[] LANGUAGE plpgsql AS $$
DECLARE t text; key text; n bigint; out text[] := '{}';
BEGIN
  FOR t IN SELECT table_name FROM bt.tenant_tables LOOP
    key := CASE WHEN t = 'tenants' THEN 'id' ELSE 'tenant_id' END;
    BEGIN
      EXECUTE format('UPDATE builder.%I SET %I = %I WHERE %I = $1', t, key, key, key) USING p;
      GET DIAGNOSTICS n = ROW_COUNT; IF n > 0 THEN out := out || ('update:' || t); END IF;
    EXCEPTION WHEN insufficient_privilege OR raise_exception OR serialization_failure THEN NULL;
    END;
    BEGIN
      EXECUTE format('DELETE FROM builder.%I WHERE %I = $1', t, key) USING p;
      GET DIAGNOSTICS n = ROW_COUNT; IF n > 0 THEN out := out || ('delete:' || t); END IF;
    EXCEPTION WHEN insufficient_privilege OR raise_exception OR foreign_key_violation THEN NULL;
    END;
  END LOOP;
  RETURN out;
END $$;
CREATE FUNCTION bt.raises(p_sql text) RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN EXECUTE p_sql; RETURN false;
EXCEPTION WHEN OTHERS THEN RETURN true;
END $$;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA bt TO anon, authenticated, service_role;

CREATE TABLE bt.all_tables AS SELECT tablename::text AS table_name FROM pg_tables WHERE schemaname = 'builder';
CREATE TABLE bt.tenant_tables AS
  SELECT table_name::text FROM information_schema.columns WHERE table_schema = 'builder' AND column_name = 'tenant_id'
  UNION SELECT 'tenants';
CREATE TABLE bt.no_client_tables (table_name text);
INSERT INTO bt.no_client_tables VALUES ('runtime_links'), ('visit_hashes'), ('visit_salts'), ('billing_events'), ('billing_plans'), ('rate_limits');
CREATE TABLE bt.operator_only (table_name text);
INSERT INTO bt.operator_only VALUES ('abuse_reports'), ('publish_reviews'), ('runtime_releases');
CREATE TABLE bt.owner_only (table_name text);
INSERT INTO bt.owner_only VALUES ('domains'), ('subscriptions'), ('audit_log'), ('exports'), ('client_deployments'), ('ai_runs');
GRANT SELECT ON ALL TABLES IN SCHEMA bt TO anon, authenticated, service_role;

\set A '''aaaaaaaa-0000-0000-0000-000000000001'''
\set B '''bbbbbbbb-0000-0000-0000-000000000001'''

-- ===================================================================== structure
DO $$
DECLARE missing text[];
BEGIN
  SELECT array_agg(x) INTO missing FROM unnest(array['tenants','operators','memberships','sites','site_versions','site_edits',
    'assets','domains','forms','form_submissions','ai_runs','chat_messages','subscriptions','billing_events','billing_plans','rate_limits',
    'audit_log','tutorial_progress','share_links','abuse_reports','publish_reviews','today_updates','site_visits_daily',
    'visit_hashes','visit_salts','exports','runtime_releases','client_deployments','runtime_links']) x
  WHERE NOT EXISTS (SELECT 1 FROM bt.all_tables a WHERE a.table_name = x);
  PERFORM bt.ok(missing IS NULL, 'every Section 9 table (incl. 1.1 and Phase 4) exists: 29 tables');
  PERFORM bt.ok(NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'builder' AND NOT rowsecurity), 'RLS enabled on every builder table');
  PERFORM bt.ok((SELECT count(*) FROM storage.buckets WHERE id IN ('site-assets','site-exports') AND NOT public) = 2, 'site-assets and site-exports buckets exist and are private');
  PERFORM bt.ok(NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'builder' AND p.prosecdef AND NOT EXISTS (SELECT 1 FROM unnest(coalesce(p.proconfig, '{}')) c WHERE c LIKE 'search_path=%')),
    'every SECURITY DEFINER function pins search_path');
  PERFORM bt.ok(NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'builder' AND p.prosecdef AND (has_function_privilege('anon', p.oid, 'EXECUTE') OR has_function_privilege('public', p.oid, 'EXECUTE'))),
    'no SECURITY DEFINER function is executable by anon/public');
  PERFORM bt.ok(NOT EXISTS (SELECT 1 FROM bt.all_tables WHERE has_table_privilege('authenticated', 'builder.' || table_name, 'INSERT') AND table_name <> 'tutorial_progress'),
    'authenticated has no INSERT on any table except tutorial_progress (writes go through server routes)');
  PERFORM bt.ok(NOT EXISTS (SELECT 1 FROM bt.all_tables WHERE has_table_privilege('authenticated', 'builder.' || table_name, 'DELETE')),
    'authenticated has no DELETE on any table (R15 soft deletes via server)');
  PERFORM bt.ok(NOT has_column_privilege('authenticated', 'builder.sites', 'published_version_id', 'UPDATE')
            AND NOT has_column_privilege('authenticated', 'builder.sites', 'slug', 'UPDATE')
            AND NOT has_column_privilege('authenticated', 'builder.sites', 'indexable', 'UPDATE')
            AND NOT has_column_privilege('authenticated', 'builder.sites', 'takedown_at', 'UPDATE')
            AND NOT has_column_privilege('authenticated', 'builder.tenants', 'status', 'UPDATE')
            AND NOT has_column_privilege('authenticated', 'builder.tenants', 'agreement_signed_at', 'UPDATE'),
    'publish/slug/indexable/takedown/status/agreement columns are not client-writable');
END $$;

-- ===================================================================== anon
SET ROLE anon;
SELECT bt.logout();
DO $$
DECLARE t text; n bigint;
BEGIN
  FOR t IN SELECT table_name FROM bt.all_tables LOOP
    n := bt.visible(t);
    PERFORM bt.ok(n <= 0, 'anon reads nothing from ' || t);
  END LOOP;
  PERFORM bt.ok((SELECT count(*) FROM storage.objects WHERE bucket_id IN ('site-assets','site-exports')) = 0, 'anon reads no storage objects');
  PERFORM bt.ok(bt.raises($q$SELECT * FROM builder.published_doc_for_host('tenant-a.yakini.digital')$q$), 'anon cannot call published_doc_for_host');
  PERFORM bt.ok(bt.raises($q$SELECT builder.hit_rate_limit('x', 1, 60)$q$), 'anon cannot call hit_rate_limit');
  PERFORM bt.ok(bt.raises($q$SELECT builder.is_member('aaaaaaaa-0000-0000-0000-000000000001')$q$), 'anon cannot call is_member');
  PERFORM bt.ok(bt.raises($q$INSERT INTO builder.tenants (name, kit_id) VALUES ('x', 'food-truck')$q$), 'anon cannot insert');
END $$;
RESET ROLE;

-- ===================================================================== tenant isolation (owner A, editor A, owner B, stranger)
SET ROLE authenticated;
DO $$
DECLARE
  who record; t text; n bigint; w text[];
  ta uuid := 'aaaaaaaa-0000-0000-0000-000000000001'; tb uuid := 'bbbbbbbb-0000-0000-0000-000000000001';
BEGIN
  FOR who IN SELECT * FROM (VALUES
      ('owner A', 'a0000000-0000-0000-0000-0000000000a1'::uuid, tb),
      ('editor A', 'a0000000-0000-0000-0000-0000000000a2'::uuid, tb),
      ('owner B', 'b0000000-0000-0000-0000-0000000000b1'::uuid, ta)) AS x(label, uid, other) LOOP
    PERFORM bt.login(who.uid);
    FOR t IN SELECT table_name FROM bt.tenant_tables LOOP
      n := bt.visible_for(t, who.other);
      PERFORM bt.ok(n <= 0, who.label || ' sees no other-tenant rows in ' || t);
    END LOOP;
    w := bt.writes_on(who.other);
    PERFORM bt.ok(cardinality(w) = 0, who.label || ' cannot update/delete any other-tenant row (landed: ' || array_to_string(w, ',') || ')');
    PERFORM bt.ok((SELECT count(*) FROM storage.objects WHERE builder.path_tenant(name) = who.other) = 0, who.label || ' reads no other-tenant storage objects');
    PERFORM bt.ok(bt.visible('visit_hashes') <= 0 AND bt.visible('runtime_links') <= 0 AND bt.visible('visit_salts') <= 0, who.label || ' cannot read visit_hashes, runtime_links, visit_salts');
  END LOOP;

  -- stranger: member of nothing
  PERFORM bt.login('d0000000-0000-0000-0000-0000000000d1');
  FOR t IN SELECT table_name FROM bt.all_tables LOOP
    PERFORM bt.ok(bt.visible(t) <= 0, 'signed-in stranger reads nothing from ' || t);
  END LOOP;
  PERFORM bt.ok((SELECT count(*) FROM storage.objects) = 0, 'signed-in stranger reads no storage objects');
END $$;

-- ===================================================================== own-tenant access and role limits
DO $$
DECLARE ta uuid := 'aaaaaaaa-0000-0000-0000-000000000001'; t text; v_site uuid; v_rev int; n bigint;
BEGIN
  PERFORM bt.login('a0000000-0000-0000-0000-0000000000a1'); -- owner A
  FOR t IN SELECT table_name FROM bt.tenant_tables WHERE table_name NOT IN (SELECT table_name FROM bt.operator_only) AND table_name NOT IN (SELECT table_name FROM bt.no_client_tables) LOOP
    PERFORM bt.ok(bt.visible_for(t, ta) >= 1, 'owner A can read own ' || t);
  END LOOP;
  FOR t IN SELECT table_name FROM bt.operator_only LOOP
    PERFORM bt.ok(bt.visible(t) <= 0, 'owner A cannot read operator-only ' || t || ' (no reporter details)');
  END LOOP;
  PERFORM bt.ok((SELECT count(*) FROM storage.objects WHERE bucket_id = 'site-exports') = 1, 'owner A reads own export object');
  PERFORM bt.ok((SELECT count(*) FROM storage.objects WHERE bucket_id = 'site-assets') = 1, 'owner A reads own asset object');
  PERFORM bt.ok(bt.raises($q$INSERT INTO storage.objects (bucket_id, name) VALUES ('site-assets', 'aaaaaaaa-0000-0000-0000-000000000001/x.png')$q$), 'owner A cannot upload directly to storage (server route only)');
  PERFORM bt.ok((SELECT count(*) FROM builder.sites WHERE review_status = 'not_required' AND takedown_at IS NULL) = 1, 'owner sees own review/takedown status on sites');

  UPDATE builder.tenants SET name = 'Tenant A Tacos & More' WHERE id = ta;
  PERFORM bt.ok((SELECT name FROM builder.tenants WHERE id = ta) = 'Tenant A Tacos & More', 'owner can rename tenant');
  PERFORM bt.ok(bt.raises($q$UPDATE builder.tenants SET status = 'active'$q$), 'owner cannot change tenant status');

  PERFORM bt.login('a0000000-0000-0000-0000-0000000000a2'); -- editor A
  FOR t IN SELECT table_name FROM bt.owner_only LOOP
    PERFORM bt.ok(bt.visible_for(t, ta) <= 0, 'editor cannot read owner-only ' || t);
  END LOOP;
  PERFORM bt.ok((SELECT count(*) FROM storage.objects WHERE bucket_id = 'site-exports') = 0, 'editor cannot read export objects');
  UPDATE builder.tenants SET name = 'hijack' WHERE id = ta;
  PERFORM bt.ok((SELECT name FROM builder.tenants WHERE id = ta) <> 'hijack', 'editor cannot rename tenant');

  SELECT id, draft_rev INTO v_site, v_rev FROM builder.sites WHERE tenant_id = ta;
  UPDATE builder.sites SET draft_doc = jsonb_set(draft_doc, '{kitId}', '"food-truck"'), draft_rev = v_rev + 1 WHERE id = v_site;
  PERFORM bt.ok((SELECT draft_rev FROM builder.sites WHERE id = v_site) = v_rev + 1, 'editor can save the draft with draft_rev + 1');
  PERFORM bt.ok(bt.raises(format('UPDATE builder.sites SET draft_rev = draft_rev + 2 WHERE id = %L', v_site)), 'stale/skipped draft_rev is refused');
  PERFORM bt.ok(bt.raises(format('UPDATE builder.sites SET draft_doc = jsonb_set(draft_doc, ''{brand,colors,primary}'', ''"#ff0000"''), draft_rev = draft_rev + 1 WHERE id = %L', v_site)), 'editor cannot change brand colors (R6)');
  PERFORM bt.ok(bt.raises(format('UPDATE builder.sites SET published_version_id = NULL WHERE id = %L', v_site)), 'editor cannot publish/unpublish');
  PERFORM bt.ok(bt.raises(format('UPDATE builder.sites SET indexable = true WHERE id = %L', v_site)), 'editor cannot change indexable');
  PERFORM bt.ok(bt.raises($q$SELECT builder.invite_member('aaaaaaaa-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-0000000000e1')$q$), 'editor cannot invite members');
  PERFORM bt.ok(bt.raises(format('UPDATE builder.site_versions SET note = ''x'' WHERE site_id = %L', v_site)), 'site_versions not updatable by clients');

  INSERT INTO builder.tutorial_progress (user_id, site_id, step) VALUES ('a0000000-0000-0000-0000-0000000000a2', v_site, 'first-edit');
  PERFORM bt.ok((SELECT count(*) FROM builder.tutorial_progress) = 1, 'editor records own tutorial step and sees only own steps');
  PERFORM bt.ok(bt.raises(format('INSERT INTO builder.tutorial_progress (user_id, site_id, step) VALUES (%L, %L, ''x'')', 'a0000000-0000-0000-0000-0000000000a1', v_site)), 'cannot write tutorial steps for someone else');
  PERFORM bt.ok(bt.raises($q$INSERT INTO builder.tutorial_progress (user_id, site_id, step) SELECT 'a0000000-0000-0000-0000-0000000000a2', id, 'x' FROM builder.sites WHERE tenant_id = 'bbbbbbbb-0000-0000-0000-000000000001'$q$)
            OR NOT EXISTS (SELECT 1 FROM builder.tutorial_progress WHERE step = 'x'), 'cannot write tutorial steps on another tenant''s site');

  -- memberships: owner invites an editor; never an owner, never self.
  PERFORM bt.login('a0000000-0000-0000-0000-0000000000a1');
  PERFORM builder.invite_member(ta, 'e0000000-0000-0000-0000-0000000000e1');
  PERFORM bt.ok((SELECT role FROM builder.memberships WHERE user_id = 'e0000000-0000-0000-0000-0000000000e1') = 'editor', 'owner can invite an editor');
  PERFORM bt.ok(bt.raises($q$SELECT builder.invite_member('aaaaaaaa-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-0000000000d1', 'owner')$q$), 'owner cannot invite another owner via RPC');
  PERFORM bt.ok(bt.raises($q$SELECT builder.invite_member('aaaaaaaa-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-0000000000a1')$q$), 'owner cannot change own access');
  PERFORM bt.ok(bt.raises($q$SELECT builder.invite_member('bbbbbbbb-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-0000000000d1')$q$), 'owner A cannot invite into tenant B');
  PERFORM bt.ok(bt.raises($q$SELECT builder.remove_member('aaaaaaaa-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-0000000000a1')$q$), 'the last owner cannot be removed');
  PERFORM bt.ok((SELECT count(*) FROM builder.audit_log WHERE action = 'member.invite') = 1, 'invite is audit-logged and visible to the owner');

  PERFORM bt.login('e0000000-0000-0000-0000-0000000000e1');
  PERFORM bt.ok(bt.raises($q$SELECT builder.invite_member('aaaaaaaa-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-0000000000d1')$q$), 'invited editor cannot self-promote or invite');
END $$;

-- ===================================================================== operator
DO $$
DECLARE t text;
BEGIN
  PERFORM bt.login('c0000000-0000-0000-0000-0000000000c1');
  PERFORM bt.ok(bt.visible('tenants') = 2 AND bt.visible('sites') = 2, 'operator sees every tenant and site');
  FOR t IN SELECT table_name FROM bt.operator_only LOOP
    PERFORM bt.ok(bt.visible(t) >= 1, 'operator reads ' || t);
  END LOOP;
  FOR t IN SELECT table_name FROM bt.no_client_tables LOOP
    PERFORM bt.ok(bt.visible(t) <= 0, 'operator CANNOT read ' || t || ' (service role only)');
  END LOOP;
  PERFORM bt.ok((SELECT count(*) FROM storage.objects) = 4, 'operator reads all builder storage objects');
  PERFORM bt.ok(bt.raises($q$SELECT * FROM builder.published_doc_for_host('tenant-a.yakini.digital')$q$), 'operator session cannot call server-only published_doc_for_host');
  PERFORM bt.ok(bt.raises($q$INSERT INTO builder.abuse_reports (tenant_id, site_id, host, reason) SELECT tenant_id, id, 'x', 'other' FROM builder.sites LIMIT 1$q$), 'operator writes go through server routes, not the client');
  PERFORM bt.ok(bt.raises($q$UPDATE builder.sites SET takedown_at = now(), takedown_kind = 'operator'$q$), 'operator cannot take down from a client session (server route + audit only)');
END $$;
RESET ROLE;
SELECT bt.logout();

-- ===================================================================== server-side behaviour (service role)
SET ROLE service_role;
DO $$
DECLARE v_site uuid; v_today uuid; n int;
BEGIN
  PERFORM bt.ok((SELECT count(*) FROM builder.published_doc_for_host('TENANT-A.yakini.digital')) = 1, 'renderer finds the published doc by host (case-insensitive)');
  PERFORM bt.ok((SELECT primary_host FROM builder.published_doc_for_host('tenant-a.yakini.digital')) = 'tenant-a.yakini.digital', 'renderer gets the primary host');
  PERFORM bt.ok((SELECT count(*) FROM builder.published_doc_for_host('unknown.example.com')) = 0, 'unknown host returns nothing');
  SELECT id INTO v_site FROM builder.sites WHERE slug = 'tenant-a';
  UPDATE builder.sites SET takedown_at = now(), takedown_kind = 'operator', takedown_reason = 'other' WHERE id = v_site;
  PERFORM bt.ok((SELECT count(*) FROM builder.published_doc_for_host('tenant-a.yakini.digital')) = 0, 'taken-down site returns nothing (neutral page)');
  UPDATE builder.sites SET takedown_at = NULL, takedown_kind = NULL, takedown_reason = NULL WHERE id = v_site;

  PERFORM bt.ok(bt.raises(format('UPDATE builder.site_versions SET note = ''x'' WHERE site_id = %L', v_site)), 'site_versions immutable even for the service role');
  PERFORM bt.ok(bt.raises(format('DELETE FROM builder.site_versions WHERE site_id = %L', v_site)), 'site_versions cannot be deleted without an operator hard delete');

  SELECT id INTO v_today FROM builder.today_updates WHERE site_id = v_site;
  PERFORM bt.ok(bt.raises(format('UPDATE builder.today_updates SET fields = ''{}'' WHERE id = %L', v_today)), 'Today history cannot be edited');
  UPDATE builder.today_updates SET cleared_at = now() WHERE id = v_today;
  PERFORM bt.ok((SELECT cleared_at IS NOT NULL FROM builder.today_updates WHERE id = v_today), 'Today update can be cleared once');
  PERFORM bt.ok(bt.raises(format('UPDATE builder.today_updates SET cleared_at = now() + interval ''1 hour'' WHERE id = %L', v_today)), 'Today update cannot be cleared twice');
  PERFORM bt.ok(bt.raises(format('DELETE FROM builder.today_updates WHERE id = %L', v_today)), 'recent Today history cannot be deleted');
  INSERT INTO builder.today_updates (tenant_id, site_id, kind, fields, expires_at) SELECT tenant_id, id, 'closed', '{}', now() + interval '1 hour' FROM builder.sites WHERE id = v_site;
  PERFORM bt.ok(bt.raises(format('INSERT INTO builder.today_updates (tenant_id, site_id, kind, fields, expires_at) SELECT tenant_id, id, ''special'', ''{}'', now() + interval ''1 hour'' FROM builder.sites WHERE id = %L', v_site)), 'at most one active Today update per site');

  PERFORM bt.ok(builder.hit_rate_limit('test:key', 2, 3600) AND builder.hit_rate_limit('test:key', 2, 3600) AND NOT builder.hit_rate_limit('test:key', 2, 3600), 'rate limiter allows max then refuses');

  PERFORM builder.record_visit(v_site, 'menu', 'search', encode(extensions.digest('visitor-1', 'sha256'), 'hex'));
  PERFORM builder.record_visit(v_site, 'menu', 'direct', encode(extensions.digest('visitor-1', 'sha256'), 'hex'));
  PERFORM bt.ok((SELECT views FROM builder.site_visits_daily WHERE site_id = v_site AND page_slug = 'menu') = 2
            AND (SELECT src_search FROM builder.site_visits_daily WHERE site_id = v_site AND page_slug = 'menu') = 1
            AND (SELECT views FROM builder.site_visits_daily WHERE site_id = v_site AND page_slug = '*') = 2,
            'record_visit counts page + whole-site views and sources');
  PERFORM bt.ok((SELECT count(*) FROM builder.visit_hashes WHERE site_id = v_site AND visitor_hash = encode(extensions.digest('visitor-1', 'sha256'), 'hex')) = 1, 'repeat visitor hashed once per day');
  PERFORM bt.ok(bt.raises($q$SELECT builder.record_visit(id, 'menu', 'evil', null) FROM builder.sites LIMIT 1$q$), 'record_visit refuses unknown sources');

  PERFORM bt.ok((SELECT input_tokens + output_tokens FROM builder.ai_usage_today()) = 300, 'ai_usage_today sums all tenants for the global spend cap');

  PERFORM bt.ok(bt.raises($q$UPDATE builder.tenants SET hosting_mode = 'client_account' WHERE agreement_signed_at IS NULL$q$), 'client_account hosting needs a signed agreement (R12)');
  PERFORM bt.ok(bt.raises($q$INSERT INTO builder.share_links (tenant_id, site_id, token_hash, created_by, expires_at) SELECT tenant_id, id, repeat('a', 64), 'a0000000-0000-0000-0000-0000000000a1', now() + interval '31 days' FROM builder.sites LIMIT 1$q$), 'share links max 30 days');
  PERFORM bt.ok(bt.raises($q$INSERT INTO builder.assets (tenant_id, kind, storage_path, mime, source) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'image', 'bbbbbbbb-0000-0000-0000-000000000001/aaaaaaaa-0000-0000-0000-000000000009.png', 'image/png', 'upload')$q$), 'asset path must start with its own tenant id');
  PERFORM bt.ok(bt.raises($q$INSERT INTO builder.sites (tenant_id, slug, kit_id, draft_doc) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'Bad_Slug', 'food-truck', '{}')$q$), 'slug format enforced');
  PERFORM bt.ok(bt.raises($q$INSERT INTO builder.sites (tenant_id, slug, kit_id, draft_doc) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'big-doc', 'food-truck', jsonb_build_object('x', repeat('a', 210000)))$q$), 'draft_doc capped at 200 KB');
  PERFORM bt.ok(bt.raises($q$INSERT INTO builder.domains (tenant_id, site_id, hostname, kind) SELECT tenant_id, id, 'Bad Host.com', 'custom' FROM builder.sites LIMIT 1$q$), 'hostname must be a lowercase FQDN');
END $$;
RESET ROLE;

-- R15: hard delete only with the explicit operator flag (runs as table owner, like a typed-confirm operator action).
DO $$
BEGIN
  PERFORM bt.ok(bt.raises($q$DELETE FROM builder.tenants WHERE id = 'bbbbbbbb-0000-0000-0000-000000000001'$q$), 'hard delete of a tenant is refused without the operator flag');
END $$;
BEGIN;
SELECT set_config('builder.hard_delete', 'on', true);
UPDATE builder.sites SET published_version_id = NULL WHERE tenant_id = 'bbbbbbbb-0000-0000-0000-000000000001';
DELETE FROM builder.tenants WHERE id = 'bbbbbbbb-0000-0000-0000-000000000001';
COMMIT;
DO $$ BEGIN
  PERFORM bt.ok(NOT EXISTS (SELECT 1 FROM builder.tenants WHERE id = 'bbbbbbbb-0000-0000-0000-000000000001'), 'operator hard delete (flagged) removes a tenant and its rows');
END $$;

DO $$ BEGIN RAISE NOTICE 'ALL RLS TESTS PASSED'; END $$;
