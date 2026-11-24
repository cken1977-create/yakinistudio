-- YAKINI BUILDER · Phase 2 database checks: claim_draft and create_version. FAKE data.
\set ON_ERROR_STOP on
SET client_min_messages = notice;

-- Signed-in users and anon cannot call the server-only functions.
SET ROLE authenticated;
SELECT bt.login('a0000000-0000-0000-0000-0000000000a1');
DO $$ BEGIN
  PERFORM bt.ok(bt.raises($q$SELECT builder.claim_draft(gen_random_uuid(), repeat('a', 64), gen_random_uuid(), null, null, null)$q$), 'signed-in users cannot call claim_draft');
  PERFORM bt.ok(bt.raises($q$SELECT * FROM builder.create_version(gen_random_uuid(), 'checkpoint', '{}', repeat('a', 64), null, null)$q$), 'signed-in users cannot call create_version');
END $$;
RESET ROLE;
SET ROLE anon;
DO $$ BEGIN
  PERFORM bt.ok(bt.raises($q$SELECT builder.claim_draft(gen_random_uuid(), repeat('a', 64), gen_random_uuid(), null, null, null)$q$), 'anon cannot call claim_draft');
END $$;
RESET ROLE;

SET ROLE service_role;
DO $$
DECLARE v_tenant uuid := gen_random_uuid(); v_site uuid := gen_random_uuid(); v_user uuid := 'a0000000-0000-0000-0000-0000000000a2'; r text; v record;
BEGIN
  INSERT INTO builder.tenants (id, name, kit_id) VALUES (v_tenant, 'Claim Test', 'food-truck');
  INSERT INTO builder.sites (id, tenant_id, slug, kit_id, draft_doc, draft_token_hash, draft_expires_at)
    VALUES (v_site, v_tenant, 'draft-claimtest01', 'food-truck', '{"schemaVersion":1}', repeat('c', 64), now() + interval '1 day');

  PERFORM bt.ok(builder.claim_draft(v_site, repeat('d', 64), v_user, null, null, null) = 'not_found', 'claim with the wrong token is refused');
  PERFORM bt.ok(NOT EXISTS (SELECT 1 FROM builder.memberships WHERE tenant_id = v_tenant), 'a refused claim adds no member');
  PERFORM bt.ok(builder.claim_draft(v_site, repeat('c', 64), v_user, null, null, '{"schemaVersion":1,"stale":true}', 7) = 'changed', 'details built on an older draft are refused (no edit is written over)');
  PERFORM bt.ok(NOT EXISTS (SELECT 1 FROM builder.memberships WHERE tenant_id = v_tenant) AND (SELECT draft_token_hash FROM builder.sites WHERE id = v_site) IS NOT NULL, 'a stale claim changes nothing');
  r := builder.claim_draft(v_site, repeat('c', 64), v_user, repeat('e', 64), 'America/Chicago', '{"schemaVersion":1,"claimed":true}', 0);
  PERFORM bt.ok(r = 'ok', 'claim with the right token works');
  PERFORM bt.ok(EXISTS (SELECT 1 FROM builder.memberships WHERE tenant_id = v_tenant AND user_id = v_user AND role = 'owner'), 'claimer becomes the owner');
  SELECT status, ownership_attested_at, ownership_attested_ip_hash, timezone INTO v FROM builder.tenants WHERE id = v_tenant;
  PERFORM bt.ok(v.status = 'trial' AND v.ownership_attested_at IS NOT NULL AND v.ownership_attested_ip_hash = repeat('e', 64) AND v.timezone = 'America/Chicago', 'tenant moves to trial with the ownership attestation and time zone');
  SELECT draft_token_hash, draft_expires_at, draft_rev, draft_doc INTO v FROM builder.sites WHERE id = v_site;
  PERFORM bt.ok(v.draft_token_hash IS NULL AND v.draft_expires_at IS NULL AND v.draft_rev = 1 AND (v.draft_doc ->> 'claimed') = 'true', 'draft token cleared, details saved, rev bumped');
  PERFORM bt.ok(builder.claim_draft(v_site, repeat('c', 64), 'b0000000-0000-0000-0000-0000000000b1', null, null, null) = 'already_claimed', 'a draft can only be claimed once');

  SELECT * INTO v FROM builder.create_version(v_site, 'checkpoint', '{"a":1}', repeat('f', 64), v_user, 'First');
  PERFORM bt.ok(v.number = 1, 'versions start at 1');
  SELECT * INTO v FROM builder.create_version(v_site, 'checkpoint', '{"a":2}', repeat('f', 64), v_user, null);
  PERFORM bt.ok(v.number = 2, 'versions count up');
  PERFORM bt.ok(bt.raises(format('UPDATE builder.site_versions SET note = %L WHERE site_id = %L', 'x', v_site)), 'versions stay immutable');
END $$;
RESET ROLE;

DO $$ BEGIN RAISE NOTICE 'ALL PHASE 2 TESTS PASSED'; END $$;
