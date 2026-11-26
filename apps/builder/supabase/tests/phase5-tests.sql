-- YAKINI BUILDER · Phase 5a custom domain checks. FAKE data.
\set ON_ERROR_STOP on
SET client_min_messages = notice;

SET ROLE authenticated;
SELECT bt.login('a0000000-0000-0000-0000-0000000000a1');
DO $$ BEGIN
  PERFORM bt.ok(bt.raises($q$SELECT builder.add_custom_domain(gen_random_uuid(), null, array['x.example.com'], null)$q$), 'signed-in users cannot add domains directly');
  PERFORM bt.ok(bt.raises($q$SELECT builder.set_domain_status('x.example.com', 'active', null, true)$q$), 'signed-in users cannot mark a domain active');
  PERFORM bt.ok(bt.raises($q$SELECT * FROM builder.remove_custom_domain(gen_random_uuid(), null)$q$), 'signed-in users cannot remove domains directly');
END $$;
RESET ROLE;

SET ROLE service_role;
DO $$
DECLARE v_t uuid := gen_random_uuid(); v_s uuid := gen_random_uuid(); v_s2 uuid := gen_random_uuid(); v_user uuid := 'a0000000-0000-0000-0000-0000000000a1'; v record; n int;
BEGIN
  INSERT INTO builder.tenants (id, name, kit_id, status) VALUES (v_t, 'Domain Test', 'service', 'active');
  INSERT INTO builder.sites (id, tenant_id, slug, kit_id, draft_doc) VALUES (v_s, v_t, 'draft-domtest01', 'service', '{"schemaVersion":1}'), (v_s2, v_t, 'draft-domtest02', 'service', '{"schemaVersion":1}');
  SELECT * INTO v FROM builder.publish_site(v_s, '{"schemaVersion":1}', repeat('5',64), v_user, 'dom-test', 'dom-test.yakini.digital', 'active', '[]', 'operator', 'test');

  PERFORM builder.add_custom_domain(v_s, v_user, array['example-shop.com','www.example-shop.com'], 'prj_x');
  PERFORM bt.ok((SELECT count(*) FROM builder.domains WHERE site_id = v_s AND kind = 'custom' AND status = 'pending') = 2, 'a whole domain adds the name and www, waiting');
  PERFORM bt.ok((SELECT hostname FROM builder.domains WHERE site_id = v_s AND is_primary) = 'dom-test.yakini.digital', 'the subdomain stays primary until the domain works');
  PERFORM bt.ok(NOT EXISTS (SELECT 1 FROM builder.site_for_host('example-shop.com')), 'a waiting domain serves nothing');
  PERFORM bt.ok(bt.raises(format($q$SELECT builder.add_custom_domain(%L, null, array['other.com'], null)$q$, v_s)), 'one custom domain per site');
  PERFORM bt.ok(bt.raises(format($q$SELECT builder.add_custom_domain(%L, null, array['example-shop.com'], null)$q$, v_s2)), 'another site cannot take the same name');

  PERFORM builder.set_domain_status('example-shop.com', 'misconfigured', '{"a":"216.150.1.1"}', true);
  PERFORM bt.ok((SELECT is_primary FROM builder.domains WHERE hostname = 'example-shop.com') = false, 'a misconfigured domain does not become primary');
  PERFORM builder.set_domain_status('example-shop.com', 'active', null, true);
  PERFORM builder.set_domain_status('www.example-shop.com', 'active', null, false);
  PERFORM bt.ok((SELECT hostname FROM builder.domains WHERE site_id = v_s AND is_primary AND deleted_at IS NULL) = 'example-shop.com', 'once active, the domain is the primary address');
  PERFORM bt.ok((SELECT primary_host FROM builder.site_for_host('dom-test.yakini.digital')) = 'example-shop.com', 'the old address points at the domain (and redirects)');
  PERFORM bt.ok((SELECT state FROM builder.site_for_host('www.example-shop.com')) = 'live', 'www serves too');
  PERFORM bt.ok((SELECT verified_at FROM builder.domains WHERE hostname = 'example-shop.com') IS NOT NULL, 'the first success time is kept');

  SELECT count(*) INTO n FROM builder.remove_custom_domain(v_s, v_user);
  PERFORM bt.ok(n = 2, 'remove returns both names');
  PERFORM bt.ok((SELECT hostname FROM builder.domains WHERE site_id = v_s AND is_primary AND deleted_at IS NULL) = 'dom-test.yakini.digital', 'the subdomain is primary again');
  PERFORM bt.ok(NOT EXISTS (SELECT 1 FROM builder.site_for_host('example-shop.com')), 'the domain no longer serves the site');
  PERFORM bt.ok((SELECT count(*) FROM builder.audit_log WHERE target_id = v_s::text AND action IN ('domain.add','domain.remove')) = 2, 'add and remove are audited');
  PERFORM builder.add_custom_domain(v_s2, v_user, array['example-shop.com'], 'prj_x');
  PERFORM bt.ok((SELECT site_id FROM builder.domains WHERE hostname = 'example-shop.com' AND deleted_at IS NULL) = v_s2, 'a removed name can be used again');
END $$;
RESET ROLE;

DO $$ BEGIN RAISE NOTICE 'ALL PHASE 5 TESTS PASSED'; END $$;
