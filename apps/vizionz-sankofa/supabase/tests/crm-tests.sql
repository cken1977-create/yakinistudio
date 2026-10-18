-- VIZIONZ SANKOFA · Office CRM RLS / audit tests (FAKE data).
-- Runs after rls-audit-tests.sql (reuses vs_test.ok / vs_test.login) and
-- obr-coalition-tests.sql (reuses its fake partner + funder orgs).
\set ON_ERROR_STOP on
SET client_min_messages = notice;

-- Fixtures as DB owner
INSERT INTO organizations (id, name, slug, relationship_kind, type) VALUES
  ('00000000-0000-0000-0000-0000000000b3', 'Test Agency Org', 'test-agency-org', 'agency', 'county');
INSERT INTO donors (id, display_name) VALUES ('00000000-0000-0000-0000-00000000d001', 'Test Donor');
INSERT INTO grants (id, name, slug, status, amount_requested) VALUES
  ('00000000-0000-0000-0000-00000000a001', 'Test Grant', 'test-grant', 'drafting', 50000);

-- ── Operator: contacts, timeline, tasks, files ──────────────────────────────
SET ROLE authenticated;
SELECT vs_test.login('00000000-0000-0000-0000-0000000000a1', 'test.operator@example.test');
INSERT INTO vs_contacts (id, display_name, kind, organization_id) VALUES
  ('00000000-0000-0000-0000-00000000c0a1', 'Fake Partner Person', 'partner', '00000000-0000-0000-0000-0000000000b1'),
  ('00000000-0000-0000-0000-00000000c0f1', 'Fake Funder Officer', 'funder', '00000000-0000-0000-0000-0000000000b2'),
  ('00000000-0000-0000-0000-00000000c0d1', 'Fake Donor Contact', 'donor', NULL);
INSERT INTO vs_activities (subject_type, subject_id, kind, summary, logged_by_name) VALUES
  ('contact', '00000000-0000-0000-0000-00000000c0a1', 'call', 'Fake call with partner', 'Spoofed Name'),
  ('organization', '00000000-0000-0000-0000-0000000000b2', 'meeting', 'Fake funder meeting', NULL),
  ('grant', '00000000-0000-0000-0000-00000000a001', 'note', 'Fake grant note', NULL),
  ('donor', '00000000-0000-0000-0000-00000000d001', 'email', 'Fake donor email', NULL);
SELECT vs_test.ok((SELECT logged_by_name FROM vs_activities WHERE summary = 'Fake call with partner') = 'Test Operator',
  'timeline author name is stamped by the database, not the client');
INSERT INTO vs_tasks (id, title, due_on, assigned_to) VALUES
  ('00000000-0000-0000-0000-0000000071a1', 'Fake task for CM A', current_date - 1, '00000000-0000-0000-0000-0000000000c1');
INSERT INTO vs_tasks (id, title, due_on, assigned_to, subject_type, subject_id) VALUES
  ('00000000-0000-0000-0000-0000000071a2', 'Fake grant task', current_date + 3, '00000000-0000-0000-0000-0000000000a1', 'grant', '00000000-0000-0000-0000-00000000a001'),
  ('00000000-0000-0000-0000-0000000071a3', 'Fake task about client 003', current_date, '00000000-0000-0000-0000-0000000000a1', 'participant', '00000000-0000-0000-0000-000000000003');
DO $$ BEGIN
  INSERT INTO vs_tasks (title, assigned_to) VALUES ('Assigned to pending user', '00000000-0000-0000-0000-0000000000f1');
  RAISE EXCEPTION 'FAIL: task assigned to a pending account';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: tasks can only be assigned to active staff with a role';
END $$;
INSERT INTO vs_attachments (subject_type, subject_id, storage_path, file_name) VALUES
  ('grant', '00000000-0000-0000-0000-00000000a001', 'grant/00000000-0000-0000-0000-00000000a001/1-budget.pdf', 'budget.pdf'),
  ('contact', '00000000-0000-0000-0000-00000000c0a1', 'contact/00000000-0000-0000-0000-00000000c0a1/1-mou.pdf', 'mou.pdf');
DO $$ BEGIN
  INSERT INTO vs_attachments (subject_type, subject_id, storage_path, file_name)
  VALUES ('grant', '00000000-0000-0000-0000-00000000a001', 'donor/00000000-0000-0000-0000-00000000d001/x.pdf', 'x.pdf');
  RAISE EXCEPTION 'FAIL: attachment path outside its record accepted';
EXCEPTION WHEN check_violation THEN RAISE NOTICE 'PASS: an attachment path must sit under its own record';
END $$;
SELECT vs_test.ok((SELECT count(*) FROM vs_global_search('Fake')) >= 5, 'operator search finds contacts, tasks and more');
SELECT vs_test.ok((SELECT count(*) FROM vs_global_search('Test Grant') WHERE kind = 'grant') = 1, 'operator search finds grants');
SELECT vs_test.ok((SELECT count(*) FROM vs_staff_directory()) >= 5, 'staff directory lists active staff for the assign picker');
SELECT vs_test.ok(NOT EXISTS (SELECT 1 FROM vs_staff_directory() WHERE display_name = 'Test Pending'), 'pending accounts are not in the staff directory');

-- ── Case manager A: no donors, no finances, own tasks only ─────────────────
SELECT vs_test.login('00000000-0000-0000-0000-0000000000c1', 'test.cm.a@example.test');
SELECT vs_test.ok((SELECT count(*) FROM donors) = 0, 'case manager sees no donors');
SELECT vs_test.ok((SELECT count(*) FROM donor_gifts) = 0, 'case manager sees no donor gifts');
SELECT vs_test.ok((SELECT count(*) FROM grants) = 0, 'case manager sees no grants');
SELECT vs_test.ok(NOT EXISTS (SELECT 1 FROM organizations WHERE relationship_kind = 'funder'), 'case manager sees no funder-only organizations');
SELECT vs_test.ok(EXISTS (SELECT 1 FROM organizations WHERE id = '00000000-0000-0000-0000-0000000000b3'), 'case manager sees agency organizations');
SELECT vs_test.ok((SELECT array_agg(display_name ORDER BY display_name) FROM vs_contacts) = ARRAY['Fake Partner Person'],
  'case manager sees partner contacts but not funder or donor contacts');
SELECT vs_test.ok((SELECT count(*) FROM vs_activities) = 1, 'case manager timeline excludes funder, grant and donor activity');
SELECT vs_test.ok((SELECT count(*) FROM vs_attachments) = 1, 'case manager cannot see grant files');
SELECT vs_test.ok((SELECT array_agg(title) FROM vs_tasks) = ARRAY['Fake task for CM A'],
  'case manager sees own tasks, not grant tasks or tasks about other caseloads');
SELECT vs_test.ok(NOT EXISTS (SELECT 1 FROM vs_global_search('Test') WHERE kind IN ('donor', 'grant')), 'case manager search never returns donors or grants');
SELECT vs_test.ok(NOT EXISTS (SELECT 1 FROM vs_global_search('Client 003')), 'case manager search does not find other caseloads');
SELECT vs_test.ok(EXISTS (SELECT 1 FROM vs_global_search('Client 001') WHERE kind = 'participant'), 'case manager search finds own clients');
UPDATE vs_tasks SET status = 'done' WHERE id = '00000000-0000-0000-0000-0000000071a1';
SELECT vs_test.ok((SELECT completed_at IS NOT NULL AND completed_by = '00000000-0000-0000-0000-0000000000c1' FROM vs_tasks
                   WHERE id = '00000000-0000-0000-0000-0000000071a1'), 'completing a task stamps who and when');
INSERT INTO vs_activities (subject_type, subject_id, kind, summary) VALUES
  ('organization', '00000000-0000-0000-0000-0000000000b3', 'call', 'Fake call with agency');
INSERT INTO vs_tasks (title, assigned_to, subject_type, subject_id) VALUES
  ('Fake follow-up for client 001', '00000000-0000-0000-0000-0000000000e1', 'participant', '00000000-0000-0000-0000-000000000001');
DO $$ BEGIN
  INSERT INTO vs_activities (subject_type, subject_id, kind, summary)
  VALUES ('donor', '00000000-0000-0000-0000-00000000d001', 'note', 'x');
  RAISE EXCEPTION 'FAIL: case manager logged donor activity';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: case manager cannot log donor activity';
END $$;
DO $$ BEGIN
  INSERT INTO vs_tasks (title, assigned_to, subject_type, subject_id)
  VALUES ('x', '00000000-0000-0000-0000-0000000000c1', 'participant', '00000000-0000-0000-0000-000000000003');
  RAISE EXCEPTION 'FAIL: case manager created a task about another caseload';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: case manager cannot add tasks about other caseloads';
END $$;
DO $$ BEGIN
  INSERT INTO vs_contacts (display_name, kind) VALUES ('x', 'donor');
  RAISE EXCEPTION 'FAIL: case manager created a donor contact';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: case manager cannot create donor contacts';
END $$;
DO $$ BEGIN
  INSERT INTO donors (display_name) VALUES ('x');
  RAISE EXCEPTION 'FAIL: case manager created a donor';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: case manager cannot create donors';
END $$;
DO $$ BEGIN
  UPDATE vs_contacts SET kind = 'funder' WHERE id = '00000000-0000-0000-0000-00000000c0a1';
  RAISE EXCEPTION 'FAIL: case manager turned a partner contact into a funder contact';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: case manager cannot move a contact out of their view';
END $$;
UPDATE organizations SET name = 'Hacked' WHERE id = '00000000-0000-0000-0000-0000000000b3';
SELECT vs_test.ok((SELECT name FROM organizations WHERE id = '00000000-0000-0000-0000-0000000000b3') = 'Test Agency Org',
  'case manager cannot edit organizations');

-- ── Leadership: reads all, writes nothing ───────────────────────────────────
SELECT vs_test.login('00000000-0000-0000-0000-0000000000d1', 'test.leadership@example.test');
SELECT vs_test.ok((SELECT count(*) FROM donors) = 1 AND (SELECT count(*) FROM grants) = 1, 'leadership can read donors and grants');
SELECT vs_test.ok((SELECT count(*) FROM vs_contacts) = 3 AND (SELECT count(*) FROM vs_activities) = 5, 'leadership reads all contacts and timeline');
DO $$ BEGIN
  INSERT INTO vs_activities (subject_type, subject_id, kind, summary)
  VALUES ('contact', '00000000-0000-0000-0000-00000000c0a1', 'note', 'x');
  RAISE EXCEPTION 'FAIL: leadership logged activity';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: leadership cannot log activity';
END $$;
DO $$ BEGIN
  INSERT INTO vs_tasks (title, assigned_to) VALUES ('x', '00000000-0000-0000-0000-0000000000d1');
  RAISE EXCEPTION 'FAIL: leadership created a task';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: leadership cannot create tasks';
END $$;
DO $$ BEGIN
  INSERT INTO vs_contacts (display_name, kind) VALUES ('x', 'partner');
  RAISE EXCEPTION 'FAIL: leadership created a contact';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: leadership cannot create contacts';
END $$;
UPDATE donors SET display_name = 'Hacked';
UPDATE vs_tasks SET status = 'cancelled';
SELECT vs_test.ok((SELECT display_name FROM donors) = 'Test Donor' AND NOT EXISTS (SELECT 1 FROM vs_tasks WHERE status = 'cancelled'),
  'leadership updates change nothing');

-- ── Pending / no role: nothing ──────────────────────────────────────────────
SELECT vs_test.login('00000000-0000-0000-0000-0000000000f1', 'test.pending@example.test');
SELECT vs_test.ok((SELECT count(*) FROM vs_contacts) + (SELECT count(*) FROM vs_tasks) + (SELECT count(*) FROM vs_activities)
                  + (SELECT count(*) FROM organizations) + (SELECT count(*) FROM vs_global_search('Fake')) = 0,
  'an account without a role sees no CRM data');

-- ── Author / creator can't be rewritten ─────────────────────────────────────
SELECT vs_test.login('00000000-0000-0000-0000-0000000000e1', 'test.exec@example.test');
UPDATE vs_activities SET logged_by = '00000000-0000-0000-0000-0000000000e1', logged_by_name = 'Someone else',
  subject_type = 'donor', subject_id = '00000000-0000-0000-0000-00000000d001'
  WHERE summary = 'Fake call with partner';
SELECT vs_test.ok((SELECT logged_by_name = 'Test Operator' AND subject_type = 'contact' FROM vs_activities WHERE summary = 'Fake call with partner'),
  'timeline author and record can not be changed after the fact');
DELETE FROM vs_attachments WHERE file_name = 'mou.pdf';
RESET ROLE;

-- ── Audit trail ─────────────────────────────────────────────────────────────
SELECT vs_test.ok(EXISTS (SELECT 1 FROM vs_audit_log WHERE table_name = 'vs_contacts' AND action = 'INSERT' AND actor_role = 'operator'),
  'contacts are audited');
SELECT vs_test.ok(EXISTS (SELECT 1 FROM vs_audit_log WHERE table_name = 'vs_activities' AND action = 'INSERT' AND actor_role = 'case_manager'),
  'timeline entries are audited with the author role');
SELECT vs_test.ok(EXISTS (SELECT 1 FROM vs_audit_log WHERE table_name = 'vs_tasks' AND action = 'UPDATE'
                   AND before_json->>'status' = 'open' AND after_json->>'status' = 'done'), 'task completion is audited with old and new values');
SELECT vs_test.ok(EXISTS (SELECT 1 FROM vs_audit_log WHERE table_name = 'vs_attachments' AND action = 'DELETE' AND actor_role = 'executive'),
  'file removal is audited');
SELECT vs_test.ok(EXISTS (SELECT 1 FROM vs_audit_log WHERE table_name = 'grants' AND action = 'INSERT'), 'grants are now audited');
SELECT vs_test.ok(EXISTS (SELECT 1 FROM vs_audit_log WHERE table_name = 'donors' AND action = 'INSERT'), 'donors are now audited');
SELECT vs_test.ok(EXISTS (SELECT 1 FROM vs_audit_log WHERE table_name = 'organizations' AND action = 'INSERT'), 'organizations are now audited');

\echo ALL VS OFFICE CRM DB TESTS PASSED
