-- VIZIONZ SANKOFA · RLS / audit / consent / encryption tests (FAKE data).
-- Each check raises an exception on failure; the script stops at the first.
\set ON_ERROR_STOP on
SET client_min_messages = notice;

CREATE SCHEMA IF NOT EXISTS vs_test;
GRANT USAGE ON SCHEMA vs_test TO authenticated;
CREATE OR REPLACE FUNCTION vs_test.ok(cond boolean, label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF cond IS NOT TRUE THEN RAISE EXCEPTION 'FAIL: %', label; END IF;
  RAISE NOTICE 'PASS: %', label;
END $$;
GRANT EXECUTE ON FUNCTION vs_test.ok(boolean, text) TO authenticated;
CREATE OR REPLACE FUNCTION vs_test.login(p_uid uuid, p_email text) RETURNS void LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'email', p_email, 'role', 'authenticated')::text, false);
$$;
GRANT EXECUTE ON FUNCTION vs_test.login(uuid, text) TO authenticated;

-- ── Encryption at rest (checked as DB owner) ────────────────────────────────
SELECT vs_test.ok((SELECT count(*) FROM participants WHERE date_of_birth IS NOT NULL) = 0,
  'plaintext participants.date_of_birth is never stored');
SELECT vs_test.ok((SELECT dob_enc IS NOT NULL AND dob_year = 1990 AND medicaid_id_last4 = '7766'
                     AND ssn_last4 = '1234' FROM participant_sensitive
                   WHERE participant_id = '00000000-0000-0000-0000-000000000001'),
  'DOB, Medicaid ID and SSN were moved into encrypted columns');
SELECT vs_test.ok((SELECT position('99887766' in encode(medicaid_id_enc, 'escape')) = 0
                   FROM participant_sensitive WHERE participant_id = '00000000-0000-0000-0000-000000000001'),
  'Medicaid ID ciphertext does not contain the clear value');
SELECT vs_test.ok((SELECT bool_and(identifier_value LIKE '•%') FROM participant_identifiers
                   WHERE lower(identifier_type) IN ('ssn', 'medicaid_id')),
  'participant_identifiers keeps only masked SSN / Medicaid values');
SELECT vs_test.ok(NOT EXISTS (SELECT 1 FROM vs_audit_log WHERE after_json::text LIKE '%99887766%'
                   OR after_json::text LIKE '%000-00-1234%' OR after_json::text LIKE '%1990-01-01%'),
  'audit log never contains clear SSN / Medicaid ID / DOB');

-- ── Case manager A ──────────────────────────────────────────────────────────
SET ROLE authenticated;
SELECT vs_test.login('00000000-0000-0000-0000-0000000000c1', 'test.cm.a@example.test');
SELECT vs_test.ok((SELECT count(*) FROM participants) = 2, 'case manager A sees only own caseload (2 of 3)');
SELECT vs_test.ok(NOT EXISTS (SELECT 1 FROM participants WHERE last_name = 'Client 003'),
  'case manager A cannot see Test Client 003 (case manager B)');
SELECT vs_test.ok((SELECT count(*) FROM case_notes WHERE participant_id = '00000000-0000-0000-0000-000000000003') = 0,
  'case manager A cannot read case notes from another caseload');
UPDATE participants SET intake_notes = 'hijack' WHERE id = '00000000-0000-0000-0000-000000000003';
SELECT vs_test.ok(NOT EXISTS (SELECT 1 FROM participants WHERE intake_notes = 'hijack'),
  'case manager A update on another caseload affects 0 rows');
DO $$ BEGIN
  INSERT INTO case_notes (participant_id, staff_id, contact_method, content)
  VALUES ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-00000000aaaa', 'phone', 'x');
  RAISE EXCEPTION 'FAIL: case manager A inserted a note on another caseload';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: case manager A cannot add notes to another caseload';
END $$;
DO $$ BEGIN
  UPDATE participants SET primary_case_manager_id = '00000000-0000-0000-0000-00000000bbbb'
  WHERE id = '00000000-0000-0000-0000-000000000002';
  RAISE EXCEPTION 'FAIL: case manager A handed a participant to another caseload';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: case manager A cannot move a participant to another caseload';
END $$;
DO $$ BEGIN
  UPDATE staff SET auth_user_id = '00000000-0000-0000-0000-0000000000c1' WHERE id = '00000000-0000-0000-0000-00000000bbbb';
  IF FOUND THEN RAISE EXCEPTION 'FAIL: case manager A re-pointed staff row'; END IF;
  RAISE NOTICE 'PASS: case manager A cannot take over another staff row';
END $$;
DO $$ BEGIN
  UPDATE vs_operators SET access_role = 'executive' WHERE user_id = '00000000-0000-0000-0000-0000000000c1';
  IF FOUND THEN RAISE EXCEPTION 'FAIL: case manager self-promoted'; END IF;
  RAISE NOTICE 'PASS: case manager cannot promote themselves';
END $$;
INSERT INTO case_notes (participant_id, staff_id, contact_method, content)
VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000aaaa', 'text', 'Fake contact logged by CM A');
SELECT vs_test.ok(true, 'case manager A can log a contact on own participant');
SELECT vs_test.ok((SELECT (vs_get_sensitive('00000000-0000-0000-0000-000000000001'))->>'medicaid_id') = '••••7766',
  'sensitive fields are masked by default');
SELECT vs_test.ok((SELECT (vs_get_sensitive('00000000-0000-0000-0000-000000000001', true))->>'medicaid_id') = 'FAKE-MCD-99887766',
  'case manager can reveal Medicaid ID for own participant');
SELECT vs_test.ok((SELECT (vs_get_sensitive('00000000-0000-0000-0000-000000000001', true))->>'ssn') = '•••-••-1234',
  'case manager cannot reveal SSN');
DO $$ BEGIN
  PERFORM vs_get_sensitive('00000000-0000-0000-0000-000000000003', true);
  RAISE EXCEPTION 'FAIL: case manager A read sensitive fields of another caseload';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: case manager A cannot read sensitive fields of another caseload';
END $$;
DO $$ BEGIN
  PERFORM 1 FROM participant_sensitive;
  RAISE EXCEPTION 'FAIL: direct SELECT on participant_sensitive allowed';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: nobody can SELECT participant_sensitive directly';
END $$;
SELECT vs_test.ok((SELECT count(*) FROM vs_audit_log) = 0, 'case manager cannot read the audit log');

-- consent
INSERT INTO vs_consents (participant_id, scope, language, form_version, signed_by_name, expires_at)
VALUES ('00000000-0000-0000-0000-000000000002', 'share_kamili', 'en', 'TEST-v0', 'Test Client 002', now() + interval '1 year');
SELECT vs_test.ok(vs_has_active_consent('00000000-0000-0000-0000-000000000002', 'share_kamili'), 'active consent is detected');
SELECT vs_test.ok(NOT vs_has_active_consent('00000000-0000-0000-0000-000000000002', 'medicaid_billing'), 'consent is per scope');
DO $$ BEGIN
  UPDATE vs_consents SET scope = 'share_funder' WHERE participant_id = '00000000-0000-0000-0000-000000000002';
  RAISE EXCEPTION 'FAIL: consent terms were edited';
EXCEPTION WHEN raise_exception THEN
  IF SQLERRM LIKE 'FAIL%' THEN RAISE; END IF;
  RAISE NOTICE 'PASS: consent terms cannot be edited';
END $$;
UPDATE vs_consents SET revoked_at = now(), revocation_reason = 'Fake test revoke'
WHERE participant_id = '00000000-0000-0000-0000-000000000002';
SELECT vs_test.ok(NOT vs_has_active_consent('00000000-0000-0000-0000-000000000002', 'share_kamili'), 'revoked consent is no longer active');
DO $$ BEGIN
  DELETE FROM vs_consents;
  RAISE EXCEPTION 'FAIL: staff deleted a consent';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: staff cannot delete consents';
END $$;
RESET ROLE;
SELECT vs_test.ok((SELECT count(*) FROM vs_consents) = 1, 'consents cannot be deleted by staff');
SELECT vs_test.ok((SELECT revoked_by = '00000000-0000-0000-0000-0000000000c1' FROM vs_consents), 'revocation records who revoked');

-- ── Case manager B ──────────────────────────────────────────────────────────
SET ROLE authenticated;
SELECT vs_test.login('00000000-0000-0000-0000-0000000000c2', 'test.cm.b@example.test');
SELECT vs_test.ok((SELECT array_agg(last_name) FROM participants) = ARRAY['Client 003'],
  'case manager B sees only Test Client 003');

-- ── Leadership read-only ────────────────────────────────────────────────────
SELECT vs_test.login('00000000-0000-0000-0000-0000000000d1', 'test.leadership@example.test');
SELECT vs_test.ok((SELECT count(*) FROM participants) = 3, 'leadership can read all participants');
SELECT vs_test.ok((SELECT count(*) FROM case_notes WHERE is_confidential) = 0, 'leadership cannot read confidential notes');
UPDATE participants SET intake_notes = 'leadership edit';
SELECT vs_test.ok(NOT EXISTS (SELECT 1 FROM participants WHERE intake_notes = 'leadership edit'), 'leadership cannot edit participants');
SELECT vs_test.ok((SELECT (vs_get_sensitive('00000000-0000-0000-0000-000000000001', true))->>'masked') = 'true',
  'leadership always gets masked sensitive fields');

-- ── No access role / pending ────────────────────────────────────────────────
SELECT vs_test.login('00000000-0000-0000-0000-0000000000f1', 'test.pending@example.test');
SELECT vs_test.ok((SELECT count(*) FROM participants) = 0, 'pending user sees no participants');
RESET ROLE;
SET ROLE anon;
SELECT set_config('request.jwt.claims', '{"role":"anon"}', false);
DO $$ BEGIN
  PERFORM 1 FROM participants;
  RAISE EXCEPTION 'FAIL: anon can query participants';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: anonymous visitors cannot query participants';
END $$;
-- public get-help form still works, and a repeat visitor is flagged returning
INSERT INTO intake_requests (full_name, email, phone, request_type) VALUES
  ('Test Client 003', 'other@example.test', '(505) 555-0103', 'housing');
RESET ROLE;
SELECT vs_test.ok((SELECT is_returning AND matched_participant_id = '00000000-0000-0000-0000-000000000003'
                   FROM intake_requests WHERE email = 'other@example.test'),
  'public intake still accepted; matching phone flags a returning client');
SELECT vs_test.ok((SELECT is_returning FROM participants WHERE id = '00000000-0000-0000-0000-000000000003'),
  'matched participant is flagged returning');

-- ── Executive ───────────────────────────────────────────────────────────────
SET ROLE authenticated;
SELECT vs_test.login('00000000-0000-0000-0000-0000000000e1', 'test.exec@example.test');
SELECT vs_test.ok((SELECT (vs_get_sensitive('00000000-0000-0000-0000-000000000001', true))->>'ssn') = '000-00-1234',
  'executive can reveal SSN');
UPDATE participants SET current_stage = 'review' WHERE id = '00000000-0000-0000-0000-000000000001';
UPDATE participants SET current_stage = 'exited' WHERE id = '00000000-0000-0000-0000-000000000002';
UPDATE participants SET current_stage = 'intake' WHERE id = '00000000-0000-0000-0000-000000000002';
SELECT vs_test.ok((SELECT count(*) FROM participant_stage_events WHERE participant_id = '00000000-0000-0000-0000-000000000002') = 3,
  'every stage change is timestamped in participant_stage_events');
SELECT vs_test.ok((SELECT is_returning FROM participants WHERE id = '00000000-0000-0000-0000-000000000002'),
  'exited client who re-enters is flagged returning');
SELECT vs_test.ok((SELECT sum(participants) FROM vs_stage_summary) = 3, 'stage summary view works');
UPDATE vs_operators SET access_role = 'leadership_readonly' WHERE user_id = '00000000-0000-0000-0000-0000000000f1';
RESET ROLE;
SELECT vs_test.ok((SELECT access_role = 'leadership_readonly' FROM vs_operators WHERE user_id = '00000000-0000-0000-0000-0000000000f1'),
  'executive can assign access roles from the app');
SET ROLE authenticated;
UPDATE vs_operators SET last_active_at = now() WHERE user_id = '00000000-0000-0000-0000-0000000000e1';
SELECT vs_test.ok((SELECT count(*) FROM vs_audit_log WHERE table_name = 'vs_operators' AND action = 'UPDATE') = 1,
  'role change is audited; activity timestamps are not');
SELECT vs_log_event('intelligence_query', 'intelligence', NULL, '{"question_redacted":"How many clients?"}');

-- ── Audit trail ─────────────────────────────────────────────────────────────
SELECT vs_test.ok((SELECT count(*) FROM vs_audit_log WHERE action = 'REVEAL_SENSITIVE') >= 2, 'every sensitive reveal is logged');
SELECT vs_test.ok(EXISTS (SELECT 1 FROM vs_audit_log WHERE table_name = 'case_notes' AND action = 'INSERT'
                   AND actor_email = 'test.cm.a@example.test' AND actor_role = 'case_manager'),
  'audit log records who inserted a case note');
SELECT vs_test.ok(EXISTS (SELECT 1 FROM vs_audit_log WHERE table_name = 'participants' AND action = 'UPDATE'
                   AND before_json->>'current_stage' = 'intake' AND after_json->>'current_stage' = 'review'),
  'audit log records old and new values');
SELECT vs_test.ok(EXISTS (SELECT 1 FROM vs_audit_log WHERE table_name = 'vs_consents' AND action = 'UPDATE'),
  'consent revocation is audited');
SELECT vs_test.ok(EXISTS (SELECT 1 FROM vs_audit_log WHERE action = 'INTELLIGENCE_QUERY' AND actor_email = 'test.exec@example.test'),
  'Intelligence queries are logged with the asker');
DO $$ BEGIN
  INSERT INTO vs_audit_log (actor_email, action, table_name) VALUES ('forged@example.test', 'INSERT', 'x');
  RAISE EXCEPTION 'FAIL: staff forged an audit row';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: staff cannot write audit rows directly';
END $$;
DO $$ BEGIN
  UPDATE vs_audit_log SET action = 'tampered';
  RAISE EXCEPTION 'FAIL: audit log UPDATE allowed';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: audit log rejects UPDATE (executive)';
END $$;
DO $$ BEGIN
  DELETE FROM vs_audit_log;
  RAISE EXCEPTION 'FAIL: audit log DELETE allowed';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: audit log rejects DELETE (executive)';
END $$;
RESET ROLE;
SET ROLE service_role;
DO $$ BEGIN
  DELETE FROM vs_audit_log;
  RAISE EXCEPTION 'FAIL: service_role DELETE allowed';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: audit log rejects DELETE (service_role)';
END $$;
RESET ROLE;
DO $$ BEGIN
  UPDATE vs_audit_log SET action = 'tampered';
  RAISE EXCEPTION 'FAIL: owner UPDATE allowed';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: audit log rejects UPDATE even for the table owner';
END $$;
DO $$ BEGIN
  TRUNCATE vs_audit_log;
  RAISE EXCEPTION 'FAIL: owner TRUNCATE allowed';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: audit log rejects TRUNCATE even for the table owner';
END $$;
SELECT vs_test.ok((SELECT count(*) FROM vs_audit_log) > 10, 'audit rows survived all tamper attempts');

\echo ALL VS PILOT DB TESTS PASSED
