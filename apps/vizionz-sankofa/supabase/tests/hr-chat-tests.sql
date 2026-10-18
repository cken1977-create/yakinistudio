-- VIZIONZ SANKOFA · HR (job descriptions, handbooks, onboarding) + chat RLS / audit tests (FAKE data).
-- Runs after rls-audit-tests.sql (reuses vs_test.ok / vs_test.login).
\set ON_ERROR_STOP on
SET client_min_messages = notice;

-- Fixture: a new hire with an open invite (no account yet).
INSERT INTO vs_invites (id, email, display_name, access_role) VALUES
  ('00000000-0000-0000-0000-0000000091a1', 'test.newhire@example.test', 'Test Newhire', 'case_manager');

-- ── Operator writes HR records ──────────────────────────────────────────────
SET ROLE authenticated;
SELECT vs_test.login('00000000-0000-0000-0000-0000000000a1', 'test.operator@example.test');
INSERT INTO vs_job_descriptions (id, title, summary, duties, qualifications, reports_to, version) VALUES
  ('00000000-0000-0000-0000-0000000092a1', 'Case Manager', 'Fake summary', 'Fake duty 1', 'Fake qualification', 'Deputy Director', 99);
SELECT vs_test.ok((SELECT version FROM vs_job_descriptions WHERE id = '00000000-0000-0000-0000-0000000092a1') = 1,
  'a new job description starts at version 1 whatever the client sends');
INSERT INTO vs_jd_assignments (id, job_description_id, user_id, acknowledged_at) VALUES
  ('00000000-0000-0000-0000-0000000093a1', '00000000-0000-0000-0000-0000000092a1', '00000000-0000-0000-0000-0000000000c1', now());
INSERT INTO vs_jd_assignments (id, job_description_id, invite_id) VALUES
  ('00000000-0000-0000-0000-0000000093a2', '00000000-0000-0000-0000-0000000092a1', '00000000-0000-0000-0000-0000000091a1');
SELECT vs_test.ok((SELECT acknowledged_at IS NULL FROM vs_jd_assignments WHERE id = '00000000-0000-0000-0000-0000000093a1'),
  'an operator cannot pre-fill an acknowledgement');
INSERT INTO vs_handbooks (id, title) VALUES ('00000000-0000-0000-0000-0000000094a1', 'Fake Employee Handbook');
INSERT INTO vs_handbook_versions (id, handbook_id, body, version) VALUES
  ('00000000-0000-0000-0000-0000000095a1', '00000000-0000-0000-0000-0000000094a1', 'Fake handbook text v1', 7);
SELECT vs_test.ok((SELECT version FROM vs_handbook_versions WHERE id = '00000000-0000-0000-0000-0000000095a1') = 1,
  'handbook versions are numbered by the database');
INSERT INTO vs_handbook_assignments (handbook_id, user_id) VALUES
  ('00000000-0000-0000-0000-0000000094a1', '00000000-0000-0000-0000-0000000000c1');
INSERT INTO vs_handbook_assignments (handbook_id, invite_id) VALUES
  ('00000000-0000-0000-0000-0000000094a1', '00000000-0000-0000-0000-0000000091a1');
INSERT INTO vs_onboarding (id, full_name, email, invite_id, job_description_id, handbook_id) VALUES
  ('00000000-0000-0000-0000-0000000096a1', 'Test Newhire', 'test.newhire@example.test', '00000000-0000-0000-0000-0000000091a1',
   '00000000-0000-0000-0000-0000000092a1', '00000000-0000-0000-0000-0000000094a1');
DO $$ BEGIN
  UPDATE vs_handbook_versions SET body = 'tampered' WHERE id = '00000000-0000-0000-0000-0000000095a1';
  RAISE EXCEPTION 'FAIL: a published handbook version was edited';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: published handbook versions cannot be edited';
END $$;

-- ── Case manager A: sees only their own HR records, acknowledges ───────────
SELECT vs_test.login('00000000-0000-0000-0000-0000000000c1', 'test.cm.a@example.test');
SELECT vs_test.ok((SELECT count(*) FROM vs_jd_assignments) = 1, 'staff see only their own job description assignment');
SELECT vs_test.ok((SELECT count(*) FROM vs_job_descriptions) = 1, 'staff can read the job description assigned to them');
SELECT vs_test.ok((SELECT count(*) FROM vs_onboarding) = 0, 'staff cannot see other people''s onboarding');
DO $$ BEGIN
  UPDATE vs_job_descriptions SET title = 'Hacked' WHERE id = '00000000-0000-0000-0000-0000000092a1';
  IF FOUND THEN RAISE EXCEPTION 'FAIL: case manager edited a job description'; END IF;
  RAISE NOTICE 'PASS: staff cannot edit job descriptions';
END $$;
SELECT vs_test.ok(vs_acknowledge_job_description('00000000-0000-0000-0000-0000000093a1') IS NOT NULL, 'staff acknowledge their job description');
SELECT vs_test.ok((SELECT acknowledged_version FROM vs_jd_assignments WHERE id = '00000000-0000-0000-0000-0000000093a1') = 1,
  'acknowledgement records the version seen');
DO $$ BEGIN
  PERFORM vs_acknowledge_job_description('00000000-0000-0000-0000-0000000093a2');
  RAISE EXCEPTION 'FAIL: acknowledged someone else''s job description';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: cannot acknowledge someone else''s job description';
END $$;
SELECT vs_test.ok(vs_handbook_mark_read('00000000-0000-0000-0000-0000000095a1') IS NOT NULL, 'staff mark the handbook read');
DO $$ BEGIN
  PERFORM vs_handbook_sign('00000000-0000-0000-0000-0000000095a1', '   ');
  RAISE EXCEPTION 'FAIL: signed with a blank name';
EXCEPTION WHEN invalid_parameter_value THEN RAISE NOTICE 'PASS: signing needs a typed name';
END $$;
SELECT vs_test.ok(vs_handbook_sign('00000000-0000-0000-0000-0000000095a1', 'Test CaseMgr A') IS NOT NULL, 'staff sign the handbook');
DO $$ BEGIN
  INSERT INTO vs_handbook_acks (version_id, user_id, read_at, signed_at, signed_name)
  VALUES ('00000000-0000-0000-0000-0000000095a1', '00000000-0000-0000-0000-0000000000c2', now(), now(), 'Forged');
  RAISE EXCEPTION 'FAIL: forged a signature row';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: signatures can only be made through vs_handbook_sign';
END $$;

-- ── Case manager B and leadership: nothing assigned, nothing visible ───────
SELECT vs_test.login('00000000-0000-0000-0000-0000000000c2', 'test.cm.b@example.test');
SELECT vs_test.ok((SELECT count(*) FROM vs_job_descriptions) + (SELECT count(*) FROM vs_handbooks)
                  + (SELECT count(*) FROM vs_handbook_versions) + (SELECT count(*) FROM vs_handbook_acks) = 0,
  'unassigned staff see no job descriptions, handbooks or signatures');
DO $$ BEGIN
  PERFORM vs_handbook_mark_read('00000000-0000-0000-0000-0000000095a1');
  RAISE EXCEPTION 'FAIL: read an unassigned handbook';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: cannot mark an unassigned handbook read';
END $$;
SELECT vs_test.login('00000000-0000-0000-0000-0000000000d1', 'test.leadership@example.test');
SELECT vs_test.ok((SELECT count(*) FROM vs_jd_assignments) + (SELECT count(*) FROM vs_onboarding) = 0,
  'leadership does not see other staff HR records');

-- ── Operator edits the JD: version bumps, acknowledgement now stale ────────
SELECT vs_test.login('00000000-0000-0000-0000-0000000000a1', 'test.operator@example.test');
UPDATE vs_job_descriptions SET duties = 'Fake duty 1' || chr(10) || 'Fake duty 2' WHERE id = '00000000-0000-0000-0000-0000000092a1';
SELECT vs_test.ok((SELECT version FROM vs_job_descriptions WHERE id = '00000000-0000-0000-0000-0000000092a1') = 2, 'editing duties bumps the version');
SELECT vs_test.ok((SELECT count(*) FROM vs_job_description_versions WHERE job_description_id = '00000000-0000-0000-0000-0000000092a1') = 2,
  'each version is kept as a snapshot');
UPDATE vs_jd_assignments SET acknowledged_version = 2 WHERE id = '00000000-0000-0000-0000-0000000093a1';
SELECT vs_test.ok((SELECT acknowledged_version FROM vs_jd_assignments WHERE id = '00000000-0000-0000-0000-0000000093a1') = 1,
  'an operator cannot fake a re-acknowledgement');
SELECT vs_test.ok((SELECT signed_name FROM vs_handbook_acks WHERE user_id = '00000000-0000-0000-0000-0000000000c1') = 'Test CaseMgr A',
  'operators can see who signed which handbook version');
RESET ROLE;

-- New hire accepts the invite (as the invite flow would), then sees and acknowledges their JD.
INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-0000000000ca', 'test.newhire@example.test');
INSERT INTO vs_operators (user_id, email, display_name, role, access_role) VALUES
  ('00000000-0000-0000-0000-0000000000ca', 'test.newhire@example.test', 'Test Newhire', 'employee', 'case_manager');
UPDATE vs_invites SET accepted_at = now(), accepted_user_id = '00000000-0000-0000-0000-0000000000ca' WHERE id = '00000000-0000-0000-0000-0000000091a1';
SET ROLE authenticated;
SELECT vs_test.login('00000000-0000-0000-0000-0000000000ca', 'test.newhire@example.test');
SELECT vs_test.ok((SELECT count(*) FROM vs_onboarding) = 1, 'the new hire sees their own onboarding checklist');
SELECT vs_test.ok(vs_acknowledge_job_description('00000000-0000-0000-0000-0000000093a2') IS NOT NULL, 'a new hire acknowledges the JD assigned to their invite');
SELECT vs_test.ok((SELECT user_id FROM vs_jd_assignments WHERE id = '00000000-0000-0000-0000-0000000093a2') = '00000000-0000-0000-0000-0000000000ca',
  'the acknowledged assignment links to the new hire''s account');
SELECT vs_test.ok(vs_handbook_sign('00000000-0000-0000-0000-0000000095a1', 'Test Newhire') IS NOT NULL, 'the new hire signs the handbook');

-- ── Chat ───────────────────────────────────────────────────────────────────
SELECT vs_test.login('00000000-0000-0000-0000-0000000000a1', 'test.operator@example.test');
SELECT vs_test.ok((SELECT count(*) FROM vs_chat_channels WHERE slug = 'office') = 1, 'the Office channel exists for staff');
SELECT vs_chat_mark_read((SELECT id FROM vs_chat_channels WHERE slug = 'office'));
INSERT INTO vs_chat_messages (channel_id, body, author_id, author_name, mentions)
SELECT id, 'Fake hello office @Test CaseMgr A', '00000000-0000-0000-0000-0000000000c2', 'Spoofed',
       ARRAY['00000000-0000-0000-0000-0000000000c1'::uuid, '00000000-0000-0000-0000-0000000000f1'::uuid]
FROM vs_chat_channels WHERE slug = 'office';
SELECT vs_test.ok((SELECT author_id = '00000000-0000-0000-0000-0000000000a1' AND author_name = 'Test Operator'
                     AND mentions = ARRAY['00000000-0000-0000-0000-0000000000c1'::uuid] FROM vs_chat_messages WHERE body LIKE 'Fake hello office%'),
  'chat author is stamped by the database and mentions are limited to active staff');
CREATE TEMP TABLE t_dm AS SELECT vs_chat_open_dm('00000000-0000-0000-0000-0000000000c1') AS id;
GRANT SELECT ON t_dm TO authenticated;
SELECT vs_test.ok((SELECT vs_chat_open_dm('00000000-0000-0000-0000-0000000000c1')) = (SELECT id FROM t_dm), 'opening a DM twice reuses the same conversation');
INSERT INTO vs_chat_messages (channel_id, body) SELECT id, 'Fake private DM to CM A' FROM t_dm;
DO $$ BEGIN
  PERFORM vs_chat_open_dm('00000000-0000-0000-0000-0000000000f1');
  RAISE EXCEPTION 'FAIL: opened a DM with a pending account';
EXCEPTION WHEN invalid_parameter_value THEN RAISE NOTICE 'PASS: DMs only with active staff';
END $$;
DO $$ BEGIN
  INSERT INTO vs_chat_channels (kind, dm_key) VALUES ('dm', 'forged:key');
  RAISE EXCEPTION 'FAIL: created a DM channel directly';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: DMs can only be opened through vs_chat_open_dm';
END $$;

SELECT vs_test.login('00000000-0000-0000-0000-0000000000c1', 'test.cm.a@example.test');
SELECT vs_test.ok((SELECT count(*) FROM vs_chat_messages) = 2, 'CM A sees the office message and their DM');
SELECT vs_test.ok((SELECT mentions FROM vs_chat_unread() WHERE channel_id = (SELECT id FROM vs_chat_channels WHERE slug = 'office')) = 1,
  'CM A has an @mention count in Office before joining');
SELECT vs_test.ok((SELECT unread FROM vs_chat_unread() WHERE channel_id = (SELECT id FROM t_dm)) = 1, 'CM A has one unread DM');
SELECT vs_chat_mark_read((SELECT id FROM t_dm));
SELECT vs_test.ok(NOT EXISTS (SELECT 1 FROM vs_chat_unread() WHERE channel_id = (SELECT id FROM t_dm)), 'marking read clears the unread count');
INSERT INTO vs_chat_messages (channel_id, body) SELECT id, 'Fake reply from CM A' FROM t_dm;
DO $$ DECLARE mid uuid; BEGIN
  SELECT id INTO mid FROM vs_chat_messages WHERE body = 'Fake private DM to CM A';
  PERFORM vs_chat_delete_message(mid);
  RAISE EXCEPTION 'FAIL: case manager deleted someone else''s message';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: staff can only delete their own messages';
END $$;
DO $$ BEGIN
  UPDATE vs_chat_messages SET body = 'rewritten' WHERE body = 'Fake private DM to CM A';
  RAISE EXCEPTION 'FAIL: rewrote a chat message directly';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: messages cannot be edited directly';
END $$;
DO $$ BEGIN
  DELETE FROM vs_chat_messages WHERE body = 'Fake reply from CM A';
  RAISE EXCEPTION 'FAIL: hard-deleted a chat message';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: messages cannot be hard-deleted';
END $$;
SELECT vs_chat_edit_message((SELECT id FROM vs_chat_messages WHERE body = 'Fake reply from CM A'), 'Fake reply from CM A (edited)');
SELECT vs_test.ok((SELECT edited_at IS NOT NULL FROM vs_chat_messages WHERE body = 'Fake reply from CM A (edited)'), 'authors can edit their own messages');
SELECT vs_chat_delete_message((SELECT id FROM vs_chat_messages WHERE body = 'Fake reply from CM A (edited)'));
SELECT vs_test.ok((SELECT count(*) FROM vs_chat_messages WHERE deleted_at IS NOT NULL AND body = '') = 1, 'deleting blanks the message in place');

SELECT vs_test.login('00000000-0000-0000-0000-0000000000c2', 'test.cm.b@example.test');
SELECT vs_test.ok((SELECT count(*) FROM vs_chat_messages) = 1, 'CM B sees Office but not the DM between others');
SELECT vs_test.ok((SELECT count(*) FROM vs_chat_channels WHERE kind = 'dm') = 0, 'CM B cannot even see that the DM exists');
DO $$ BEGIN
  INSERT INTO vs_chat_messages (channel_id, body) SELECT id, 'Fake intrusion' FROM t_dm;
  RAISE EXCEPTION 'FAIL: posted into someone else''s DM';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: cannot post into a DM you are not in';
END $$;
DO $$ BEGIN
  INSERT INTO vs_chat_members (channel_id, user_id) SELECT id, '00000000-0000-0000-0000-0000000000c2' FROM t_dm;
  RAISE EXCEPTION 'FAIL: joined someone else''s DM';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: cannot add yourself to a DM';
END $$;

SELECT vs_test.login('00000000-0000-0000-0000-0000000000f1', 'test.pending@example.test');
SELECT vs_test.ok((SELECT count(*) FROM vs_chat_messages) + (SELECT count(*) FROM vs_chat_channels) = 0, 'pending accounts see no chat at all');
DO $$ BEGIN
  INSERT INTO vs_chat_messages (channel_id, body) SELECT id, 'Fake pending post' FROM vs_chat_channels;
  INSERT INTO vs_chat_messages (channel_id, body) VALUES ((SELECT id FROM t_dm), 'x');
  RAISE EXCEPTION 'FAIL: pending account posted';
EXCEPTION WHEN insufficient_privilege OR not_null_violation THEN RAISE NOTICE 'PASS: pending accounts cannot post';
END $$;

SELECT vs_test.login('00000000-0000-0000-0000-0000000000e1', 'test.exec@example.test');
SELECT vs_chat_delete_message((SELECT id FROM vs_chat_messages WHERE body LIKE 'Fake hello office%'));
SELECT vs_test.ok((SELECT deleted_by FROM vs_chat_messages WHERE deleted_at IS NOT NULL AND channel_id = (SELECT id FROM vs_chat_channels WHERE slug = 'office'))
                  = '00000000-0000-0000-0000-0000000000e1', 'an executive can remove a message from Office');
SELECT vs_test.ok(EXISTS (SELECT 1 FROM vs_audit_log WHERE table_name = 'vs_chat_messages' AND action = 'UPDATE'
                   AND before_json->>'body' LIKE 'Fake hello office%' AND after_json->>'deleted_at' IS NOT NULL),
  'the audit log keeps the text of a deleted message');
SELECT vs_test.ok(EXISTS (SELECT 1 FROM vs_audit_log WHERE table_name = 'vs_chat_messages' AND action = 'UPDATE'
                   AND before_json->>'body' = 'Fake reply from CM A' AND after_json->>'edited_at' IS NOT NULL),
  'edits are audited with the old text');
SELECT vs_test.ok(EXISTS (SELECT 1 FROM vs_audit_log WHERE table_name = 'vs_handbook_acks' AND action = 'INSERT'
                   AND actor_user_id = '00000000-0000-0000-0000-0000000000c1'), 'handbook signatures are audited');
SELECT vs_test.ok(EXISTS (SELECT 1 FROM vs_audit_log WHERE table_name = 'vs_jd_assignments' AND action = 'UPDATE'
                   AND after_json->>'acknowledged_at' IS NOT NULL), 'job description acknowledgements are audited');
RESET ROLE;
DO $$ BEGIN
  DELETE FROM vs_audit_log WHERE table_name = 'vs_chat_messages';
  RAISE EXCEPTION 'FAIL: audit log rows deleted';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
  RAISE NOTICE 'PASS: chat audit rows cannot be deleted, even by the DB owner';
END $$;

-- Storage policies on the private buckets (the shim's storage.objects).
SET ROLE authenticated;
SELECT vs_test.login('00000000-0000-0000-0000-0000000000c2', 'test.cm.b@example.test');
DO $$ BEGIN
  INSERT INTO storage.objects (bucket_id, name) SELECT 'vs-chat-files', id::text || '/x/f.txt' FROM t_dm;
  RAISE EXCEPTION 'FAIL: uploaded into someone else''s DM';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: cannot upload files into a DM you are not in';
END $$;
DO $$ BEGIN
  INSERT INTO storage.objects (bucket_id, name) VALUES ('vs-hr-files', 'handbooks/00000000-0000-0000-0000-0000000094a1/x.pdf');
  RAISE EXCEPTION 'FAIL: case manager uploaded a handbook file';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: only executives/operators upload handbook files';
END $$;
RESET ROLE;

\echo ALL VS HR + CHAT DB TESTS PASSED
