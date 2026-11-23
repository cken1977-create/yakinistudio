-- FAKE data only. Two tenants (A, B), one row in every table for each, plus staff.
\set ON_ERROR_STOP on
INSERT INTO auth.users (id, email) VALUES
  ('a0000000-0000-0000-0000-0000000000a1', 'owner-a@example.test'),
  ('a0000000-0000-0000-0000-0000000000a2', 'editor-a@example.test'),
  ('b0000000-0000-0000-0000-0000000000b1', 'owner-b@example.test'),
  ('c0000000-0000-0000-0000-0000000000c1', 'operator@example.test'),
  ('d0000000-0000-0000-0000-0000000000d1', 'stranger@example.test'),
  ('e0000000-0000-0000-0000-0000000000e1', 'invitee@example.test');

INSERT INTO builder.operators (user_id, name, can_takedown) VALUES ('c0000000-0000-0000-0000-0000000000c1', 'Test Operator', true);

INSERT INTO builder.tenants (id, name, kit_id, status, timezone) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Tenant A Tacos', 'food-truck', 'active', 'America/Denver'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'Tenant B Kitchen', 'restaurant', 'trial', NULL);

INSERT INTO builder.memberships (tenant_id, user_id, role) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-0000000000a1', 'owner'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-0000000000a2', 'editor'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-0000000000b1', 'owner');

DO $$
DECLARE
  t record; v_site uuid; v_ver uuid; v_form uuid; v_rel uuid;
  doc jsonb := '{"schemaVersion":1,"kitId":"food-truck","brand":{"colors":{"primary":"#9A3412","secondary":"#15130F","accent":"#F59E0B"}}}';
BEGIN
  INSERT INTO builder.runtime_releases (version, git_sha, min_schema, max_schema) VALUES ('0.1.0', 'abc1234', 1, 1) RETURNING id INTO v_rel;
  FOR t IN SELECT * FROM (VALUES
      ('aaaaaaaa-0000-0000-0000-000000000001'::uuid, 'tenant-a', 'a0000000-0000-0000-0000-0000000000a1'::uuid),
      ('bbbbbbbb-0000-0000-0000-000000000001'::uuid, 'tenant-b', 'b0000000-0000-0000-0000-0000000000b1'::uuid)) AS x(tid, slug, owner) LOOP
    INSERT INTO builder.sites (tenant_id, slug, kit_id, draft_doc) VALUES (t.tid, t.slug, 'food-truck', doc) RETURNING id INTO v_site;
    INSERT INTO builder.site_versions (tenant_id, site_id, number, kind, doc, doc_sha256)
      VALUES (t.tid, v_site, 1, 'published', doc, encode(extensions.digest(doc::text, 'sha256'), 'hex')) RETURNING id INTO v_ver;
    UPDATE builder.sites SET published_version_id = v_ver WHERE id = v_site;
    INSERT INTO builder.site_edits (tenant_id, site_id, actor_kind, source, ops, draft_rev_after) VALUES (t.tid, v_site, 'owner', 'click', '[]', 1);
    INSERT INTO builder.assets (tenant_id, site_id, kind, storage_path, mime, source, license_kind)
      VALUES (t.tid, v_site, 'logo', t.tid || '/' || gen_random_uuid() || '.png', 'image/png', 'upload', 'owner_upload');
    INSERT INTO builder.domains (tenant_id, site_id, hostname, kind, is_primary, status)
      VALUES (t.tid, v_site, t.slug || '.yakini.digital', 'subdomain', true, 'active');
    INSERT INTO builder.forms (tenant_id, site_id, form_key, kind, fields) VALUES (t.tid, v_site, 'contact', 'contact', '[]') RETURNING id INTO v_form;
    INSERT INTO builder.form_submissions (tenant_id, site_id, form_id, payload) VALUES (t.tid, v_site, v_form, '{"message":"hi"}');
    INSERT INTO builder.ai_runs (tenant_id, site_id, kind, model, prompt_version, input_tokens, output_tokens, outcome) VALUES (t.tid, v_site, 'generate', 'test-model', 'g1', 100, 50, 'ok');
    INSERT INTO builder.chat_messages (tenant_id, site_id, role, content) VALUES (t.tid, v_site, 'user', 'make it pop');
    INSERT INTO builder.subscriptions (tenant_id, stripe_subscription_id, product_key, status) VALUES (t.tid, 'sub_test_' || t.slug, 'website-simple', 'active');
    INSERT INTO builder.audit_log (tenant_id, actor_kind, action) VALUES (t.tid, 'system', 'publish');
    INSERT INTO builder.tutorial_progress (user_id, site_id, step) VALUES (t.owner, v_site, 'welcome');
    INSERT INTO builder.share_links (tenant_id, site_id, token_hash, created_by) VALUES (t.tid, v_site, encode(extensions.digest(t.slug, 'sha256'), 'hex'), t.owner);
    INSERT INTO builder.abuse_reports (tenant_id, site_id, host, reason, reporter_email) VALUES (t.tid, v_site, t.slug || '.yakini.digital', 'other', 'reporter@example.test');
    INSERT INTO builder.publish_reviews (tenant_id, site_id, version_id, trigger) VALUES (t.tid, v_site, v_ver, 'risk_check');
    INSERT INTO builder.today_updates (tenant_id, site_id, kind, fields, expires_at) VALUES (t.tid, v_site, 'special', '{"text":"2 for 1"}', now() + interval '8 hours');
    INSERT INTO builder.site_visits_daily (tenant_id, site_id, day, page_slug, views) VALUES (t.tid, v_site, current_date, '', 3);
    INSERT INTO builder.visit_hashes (site_id, day, visitor_hash) VALUES (v_site, current_date, encode(extensions.digest(t.slug || 'v', 'sha256'), 'hex'));
    INSERT INTO builder.exports (tenant_id, site_id, includes, status, storage_path) VALUES (t.tid, v_site, '{site_file}', 'ready', t.tid || '/export.zip');
    INSERT INTO builder.client_deployments (tenant_id, site_id, vercel_team_id, vercel_project_id, runtime_version, rollout_release_id)
      VALUES (t.tid, v_site, 'team_test', 'prj_test', '0.1.0', v_rel);
    INSERT INTO builder.runtime_links (tenant_id, secret_ciphertext, key_id) VALUES (t.tid, extensions.gen_random_bytes(48), 'k1');
    INSERT INTO storage.objects (bucket_id, name) VALUES ('site-assets', t.tid || '/logo.png'), ('site-exports', t.tid || '/export.zip');
  END LOOP;
  INSERT INTO builder.visit_salts (day, salt) VALUES (current_date, extensions.gen_random_bytes(32));
  INSERT INTO builder.stripe_events (id, type) VALUES ('evt_test_1', 'checkout.session.completed');
  INSERT INTO builder.rate_limits (key, window_start, count) VALUES ('ip:test', now(), 1);
END $$;
