-- YAKINI BUILDER · Phase 3 database checks: publish, review, rollback, takedown, reports, share links. FAKE data.
\set ON_ERROR_STOP on
SET client_min_messages = notice;

-- Signed-in users and anon cannot call any Phase 3 function.
SET ROLE authenticated;
SELECT bt.login('a0000000-0000-0000-0000-0000000000a1');
DO $$ BEGIN
  PERFORM bt.ok(bt.raises($q$SELECT * FROM builder.site_for_host('x.yakini.digital')$q$), 'signed-in users cannot call site_for_host');
  PERFORM bt.ok(bt.raises($q$SELECT * FROM builder.publish_site(gen_random_uuid(), '{}', repeat('a',64), null, 'abc', 'abc.yakini.digital', 'active', '[]', 'owner')$q$), 'signed-in users cannot publish directly');
  PERFORM bt.ok(bt.raises($q$SELECT builder.takedown_site(gen_random_uuid(), 'operator', 'other', null, null)$q$), 'signed-in users cannot take a site down');
  PERFORM bt.ok(bt.raises($q$SELECT * FROM builder.file_abuse_report(gen_random_uuid(), 'x', 'other', 'x', null, false, null, 3, 24)$q$), 'signed-in users cannot file reports directly');
  PERFORM bt.ok(bt.raises($q$SELECT * FROM builder.use_share_link(repeat('a',64))$q$), 'signed-in users cannot read share links by token');
END $$;
RESET ROLE;
SET ROLE anon;
DO $$ BEGIN
  PERFORM bt.ok(bt.raises($q$SELECT * FROM builder.site_for_host('x.yakini.digital')$q$), 'anon cannot call site_for_host');
  PERFORM bt.ok(bt.raises($q$SELECT * FROM builder.file_abuse_report(gen_random_uuid(), 'x', 'other', 'x', null, false, null, 3, 24)$q$), 'anon cannot file reports directly');
END $$;
RESET ROLE;

SET ROLE service_role;
DO $$
DECLARE
  v_tenant uuid := gen_random_uuid(); v_site uuid := gen_random_uuid(); v_paid uuid := gen_random_uuid(); v_paid_site uuid := gen_random_uuid();
  v_user uuid := 'a0000000-0000-0000-0000-0000000000a1'; v_op uuid := 'c0000000-0000-0000-0000-0000000000c1';
  v record; v1 uuid; v2 uuid; r record; ok boolean; i int; forms jsonb := '[{"formKey":"contact","kind":"contact","fields":["name","email","message"]}]';
BEGIN
  INSERT INTO builder.tenants (id, name, kit_id, status) VALUES (v_tenant, 'Publish Test', 'food-truck', 'trial');
  INSERT INTO builder.sites (id, tenant_id, slug, kit_id, draft_doc) VALUES (v_site, v_tenant, 'draft-pubtest01', 'food-truck', '{"schemaVersion":1,"draft":true}');

  -- Nothing is served before publish.
  PERFORM bt.ok(NOT EXISTS (SELECT 1 FROM builder.site_for_host('pub-test.yakini.digital')), 'an unpublished address is unknown');

  -- Publish 1.
  SELECT * INTO v FROM builder.publish_site(v_site, '{"schemaVersion":1,"n":1}', repeat('1',64), v_user, 'pub-test', 'pub-test.yakini.digital', 'active', forms, 'owner');
  v1 := v.version_id;
  PERFORM bt.ok(v.version_number = 1, 'first publish is version 1');
  PERFORM bt.ok((SELECT published_version_id FROM builder.sites WHERE id = v_site) = v1, 'the site points at the published version');
  PERFORM bt.ok((SELECT slug FROM builder.sites WHERE id = v_site) = 'pub-test', 'the chosen address becomes the site slug');
  PERFORM bt.ok(EXISTS (SELECT 1 FROM builder.domains WHERE site_id = v_site AND hostname = 'pub-test.yakini.digital' AND kind = 'subdomain' AND is_primary AND status = 'active'), 'the subdomain is registered as the primary address');
  PERFORM bt.ok(EXISTS (SELECT 1 FROM builder.forms WHERE site_id = v_site AND form_key = 'contact' AND kind = 'contact'), 'every form gets a forms row');
  PERFORM bt.ok((SELECT first_live_at FROM builder.tenants WHERE id = v_tenant) IS NOT NULL, 'first_live_at is set');
  PERFORM bt.ok(EXISTS (SELECT 1 FROM builder.audit_log WHERE target_id = v_site::text AND action = 'publish'), 'publish is audited');
  SELECT * INTO r FROM builder.site_for_host('PUB-TEST.yakini.digital');
  PERFORM bt.ok(r.state = 'live' AND r.version_id = v1 AND (r.doc->>'n') = '1' AND r.primary_host = 'pub-test.yakini.digital', 'the host serves the published doc (case-insensitive)');
  PERFORM bt.ok((r.doc->>'draft') IS NULL, 'the host never serves the draft');
  PERFORM bt.ok(r.has_plan = false, 'a trial tenant has no plan');

  -- Draft edits after publish do not change the live doc.
  UPDATE builder.sites SET draft_doc = '{"schemaVersion":1,"edited":true}' WHERE id = v_site;
  PERFORM bt.ok((SELECT doc->>'edited' FROM builder.site_for_host('pub-test.yakini.digital')) IS NULL, 'draft edits do not reach the live site');

  -- Publish 2, then roll back to 1.
  SELECT * INTO v FROM builder.publish_site(v_site, '{"schemaVersion":1,"n":2}', repeat('2',64), v_user, 'pub-test', 'pub-test.yakini.digital', 'active', forms, 'owner');
  v2 := v.version_id;
  PERFORM bt.ok((SELECT doc->>'n' FROM builder.site_for_host('pub-test.yakini.digital')) = '2', 'republish serves the new version');
  PERFORM bt.ok((SELECT count(*) FROM builder.domains WHERE site_id = v_site AND deleted_at IS NULL) = 1, 'republishing keeps one address');
  PERFORM bt.ok(builder.rollback_site(v_site, v1, v_user, 'owner') = 1, 'rollback to version 1');
  PERFORM bt.ok((SELECT doc->>'n' FROM builder.site_for_host('pub-test.yakini.digital')) = '1', 'the host serves the rolled-back version');
  PERFORM bt.ok(bt.raises(format('SELECT builder.rollback_site(%L, %L, null, %L)', v_site, (SELECT id FROM builder.site_versions WHERE site_id = v_site AND kind <> 'published' LIMIT 1), 'owner'))
                OR NOT EXISTS (SELECT 1 FROM builder.site_versions WHERE site_id = v_site AND kind <> 'published'), 'rollback only to a published version');
  PERFORM bt.ok(bt.raises(format('SELECT builder.rollback_site(%L, %L, null, %L)', v_site, gen_random_uuid(), 'owner')), 'rollback to an unknown version is refused');

  -- A new address retires the old one.
  PERFORM builder.publish_site(v_site, '{"schemaVersion":1,"n":3}', repeat('3',64), v_user, 'pub-test-two', 'pub-test-two.yakini.digital', 'pending', forms, 'owner');
  PERFORM bt.ok(EXISTS (SELECT 1 FROM builder.domains WHERE hostname = 'pub-test.yakini.digital' AND status = 'removed' AND deleted_at IS NOT NULL), 'the old address is kept but marked removed');
  PERFORM bt.ok(NOT EXISTS (SELECT 1 FROM builder.site_for_host('pub-test.yakini.digital')), 'the old address no longer serves');
  PERFORM bt.ok(NOT EXISTS (SELECT 1 FROM builder.site_for_host('pub-test-two.yakini.digital')), 'a pending address does not serve yet');
  UPDATE builder.domains SET status = 'active' WHERE hostname = 'pub-test-two.yakini.digital';
  PERFORM bt.ok((SELECT state FROM builder.site_for_host('pub-test-two.yakini.digital')) = 'live', 'it serves once active');

  -- Unpublish → the address answers "unpublished" with no doc.
  PERFORM bt.ok(builder.unpublish_site(v_site, v_user, 'owner'), 'unpublish works');
  SELECT * INTO r FROM builder.site_for_host('pub-test-two.yakini.digital');
  PERFORM bt.ok(r.state = 'unpublished' AND r.doc IS NULL, 'an unpublished site shows no doc');
  PERFORM builder.rollback_site(v_site, v2, v_user, 'owner');

  -- Takedown: neutral, nothing deleted, share links revoked, publish refused; restore brings the same version back.
  PERFORM builder.create_share_link(v_site, null, repeat('9',64), v_user, 7, 20);
  PERFORM bt.ok(EXISTS (SELECT 1 FROM builder.use_share_link(repeat('9',64))), 'a share link works before takedown');
  PERFORM bt.ok(builder.takedown_site(v_site, 'operator', 'impersonation', 'test', v_op), 'operator takedown');
  PERFORM bt.ok(builder.takedown_site(v_site, 'operator', 'impersonation', 'again', v_op) = false, 'a second takedown is a no-op');
  SELECT * INTO r FROM builder.site_for_host('pub-test-two.yakini.digital');
  PERFORM bt.ok(r.state = 'taken_down' AND r.doc IS NULL AND r.version_id IS NULL, 'a taken-down site serves no doc');
  PERFORM bt.ok(NOT EXISTS (SELECT 1 FROM builder.use_share_link(repeat('9',64))), 'share links stop working');
  PERFORM bt.ok((SELECT revoked_at FROM builder.share_links WHERE token_hash = repeat('9',64)) IS NOT NULL, 'share links are revoked');
  PERFORM bt.ok(bt.raises(format('SELECT * FROM builder.publish_site(%L, %L, %L, null, %L, %L, %L, %L, %L)', v_site, '{"schemaVersion":1}', repeat('4',64), 'pub-test-two', 'pub-test-two.yakini.digital', 'active', '[]', 'owner')), 'publish is refused under takedown');
  PERFORM bt.ok(bt.raises(format('SELECT builder.rollback_site(%L, %L, null, %L)', v_site, v1, 'owner')), 'rollback is refused under takedown');
  PERFORM bt.ok(bt.raises(format('SELECT builder.create_share_link(%L, null, %L, %L, 7, 20)', v_site, repeat('8',64), v_user)), 'new share links are refused under takedown');
  PERFORM bt.ok((SELECT count(*) FROM builder.site_versions WHERE site_id = v_site) >= 3 AND (SELECT published_version_id FROM builder.sites WHERE id = v_site) = v2, 'nothing is deleted');
  PERFORM bt.ok(EXISTS (SELECT 1 FROM builder.audit_log WHERE target_id = v_site::text AND action = 'takedown'), 'takedown is audited');
  PERFORM bt.ok(builder.lift_takedown(v_site, v_op, 'restored'), 'restore');
  SELECT * INTO r FROM builder.site_for_host('pub-test-two.yakini.digital');
  PERFORM bt.ok(r.state = 'live' AND r.version_id = v2, 'restore brings back the same published version');
  PERFORM bt.ok(EXISTS (SELECT 1 FROM builder.audit_log WHERE target_id = v_site::text AND action = 'takedown.lift'), 'restore is audited');
  PERFORM bt.ok(NOT EXISTS (SELECT 1 FROM builder.use_share_link(repeat('9',64))), 'revoked share links stay revoked after restore');

  -- Share links: expiry, revoke, max active.
  PERFORM builder.create_share_link(v_site, v1, repeat('7',64), v_user, 1, 20);
  PERFORM bt.ok((SELECT version_id FROM builder.use_share_link(repeat('7',64))) = v1, 'a share link can point at a version');
  UPDATE builder.share_links SET expires_at = now() - interval '1 second', created_at = now() - interval '1 day' WHERE token_hash = repeat('7',64);
  PERFORM bt.ok(NOT EXISTS (SELECT 1 FROM builder.use_share_link(repeat('7',64))), 'an expired share link stops working');
  SELECT builder.create_share_link(v_site, null, repeat('6',64), v_user, 30, 20) INTO v1;
  PERFORM bt.ok(builder.revoke_share_link(v_site, v1, v_user, 'owner'), 'revoke');
  PERFORM bt.ok(NOT EXISTS (SELECT 1 FROM builder.use_share_link(repeat('6',64))), 'a revoked share link stops working');
  PERFORM bt.ok(bt.raises(format('SELECT builder.create_share_link(%L, null, %L, %L, 31, 20)', v_site, repeat('5',64), v_user)), 'share links last at most 30 days');
  FOR i IN 1..2 LOOP PERFORM builder.create_share_link(v_site, null, lpad(i::text, 64, 'c'), v_user, 7, 2); END LOOP;
  PERFORM bt.ok(bt.raises(format('SELECT builder.create_share_link(%L, null, %L, %L, 7, 2)', v_site, repeat('d',64), v_user)), 'active share links are capped');

  -- Review gate.
  SELECT * INTO r FROM builder.request_review(v_site, '{"schemaVersion":1,"n":"review"}', repeat('e',64), v_user, 'override', '[]');
  PERFORM bt.ok((SELECT review_status FROM builder.sites WHERE id = v_site) = 'pending', 'review request marks the site pending');
  PERFORM bt.ok((SELECT kind FROM builder.site_versions WHERE id = r.version_id) = 'review', 'the reviewed doc is frozen as a review version');
  PERFORM bt.ok((SELECT doc->>'n' FROM builder.site_for_host('pub-test-two.yakini.digital')) = '2', 'a review does not change the live site');
  PERFORM bt.ok(builder.decide_review(r.review_id, v_op, false, 'no'), 'reject');
  PERFORM bt.ok((SELECT review_status FROM builder.sites WHERE id = v_site) = 'rejected' AND (SELECT doc->>'n' FROM builder.site_for_host('pub-test-two.yakini.digital')) = '2', 'a rejected review stays off the live site');
  PERFORM bt.ok(builder.decide_review(r.review_id, v_op, true, 'late') = false, 'a decided review cannot be decided again');
  PERFORM bt.ok(EXISTS (SELECT 1 FROM builder.audit_log WHERE target_id = v_site::text AND action = 'review.reject'), 'review decisions are audited');

  -- Reports and auto-hold: unpaid site, 3 distinct IPs in 24 h.
  PERFORM builder.file_abuse_report(v_site, 'pub-test-two.yakini.digital', 'impersonation', 'one', null, false, repeat('a',64), 3, 24);
  PERFORM builder.file_abuse_report(v_site, 'pub-test-two.yakini.digital', 'impersonation', 'same ip', null, false, repeat('a',64), 3, 24);
  SELECT * INTO r FROM builder.file_abuse_report(v_site, 'pub-test-two.yakini.digital', 'other', 'two', null, false, repeat('b',64), 3, 24);
  PERFORM bt.ok(r.held = false AND (SELECT takedown_at FROM builder.sites WHERE id = v_site) IS NULL, 'two distinct reporters do not hold the site');
  SELECT * INTO r FROM builder.file_abuse_report(v_site, 'pub-test-two.yakini.digital', 'copyright', 'three', 'r@example.test', true, repeat('c',64), 3, 24);
  PERFORM bt.ok(r.held AND (SELECT takedown_kind FROM builder.sites WHERE id = v_site) = 'auto_hold', 'the third distinct reporter holds an unpaid site');
  PERFORM bt.ok(EXISTS (SELECT 1 FROM builder.audit_log WHERE target_id = v_site::text AND action = 'takedown.auto_hold'), 'auto-hold is audited');
  PERFORM bt.ok((SELECT count(*) FROM builder.abuse_reports WHERE site_id = v_site) = 4, 'every report is stored');
  PERFORM bt.ok(builder.decide_report(r.report_id, v_op, 'dismissed', 'fine'), 'an operator can dismiss a report');
  PERFORM bt.ok(builder.decide_report(r.report_id, v_op, 'actioned', 'late') = false, 'a decided report cannot be decided again');

  -- Paid site: never auto-held, not even on phishing.
  INSERT INTO builder.tenants (id, name, kit_id, status) VALUES (v_paid, 'Paid Test', 'restaurant', 'active');
  INSERT INTO builder.sites (id, tenant_id, slug, kit_id, draft_doc) VALUES (v_paid_site, v_paid, 'paid-test', 'restaurant', '{"schemaVersion":1}');
  FOR i IN 1..5 LOOP
    PERFORM builder.file_abuse_report(v_paid_site, 'paid-test.yakini.digital', 'impersonation', 'x', null, false, lpad(i::text, 64, 'f'), 3, 24);
  END LOOP;
  PERFORM builder.file_abuse_report(v_paid_site, 'paid-test.yakini.digital', 'phishing', 'x', null, false, repeat('9',64), 3, 24);
  PERFORM bt.ok((SELECT takedown_at FROM builder.sites WHERE id = v_paid_site) IS NULL, 'a site with an active plan is never auto-held');

  -- Unpaid site: one phishing report holds it.
  UPDATE builder.tenants SET status = 'trial' WHERE id = v_paid;
  SELECT * INTO r FROM builder.file_abuse_report(v_paid_site, 'paid-test.yakini.digital', 'phishing', 'x', null, false, repeat('8',64), 3, 24);
  PERFORM bt.ok(r.held, 'any phishing report holds an unpaid site');
END $$;
RESET ROLE;

DO $$ BEGIN RAISE NOTICE 'ALL PHASE 3 TESTS PASSED'; END $$;
