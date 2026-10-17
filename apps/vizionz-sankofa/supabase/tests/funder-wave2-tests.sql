-- VIZIONZ SANKOFA · Funder reporting + invites + role audit + profile tests (FAKE data).
-- Runs after rls-audit-tests.sql (reuses vs_test.ok / vs_test.login).
\set ON_ERROR_STOP on
SET client_min_messages = notice;

INSERT INTO service_types (id, slug, name, category, countable_unit) VALUES
  ('00000000-0000-0000-0000-0000000057a1', 'test-housing-nav', 'Test Housing Navigation', 'housing', 'session');
INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-0000000000c9', 'test.invitee@example.test'),
  ('00000000-0000-0000-0000-0000000000c8', 'test.stranger@example.test');
INSERT INTO staff (id, first_name, last_name, email, role) VALUES
  ('00000000-0000-0000-0000-00000000cccc', 'Test', 'CaseMgr C', 'test.invitee@example.test', 'case_manager');

-- ── Funder tags + service county ────────────────────────────────────────────
SET ROLE authenticated;
SELECT vs_test.login('00000000-0000-0000-0000-0000000000a1', 'test.operator@example.test');
UPDATE participants SET service_county = 'lea' WHERE id = '00000000-0000-0000-0000-000000000003';
INSERT INTO services_delivered (participant_id, service_type_id, delivered_at, units, funder_key, service_county) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000057a1', now(), 2, 'housing_nm', 'bernalillo'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000057a1', now(), 1, 'housing_nm', NULL),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000057a1', now(), 1, 'medicaid', NULL);
SELECT vs_test.ok((SELECT count(*) FROM services_delivered WHERE funder_key = 'housing_nm') = 2,
  'one logged service carries its funder tag and county');
DO $$ BEGIN
  INSERT INTO services_delivered (participant_id, service_type_id, delivered_at, funder_key)
  VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000057a1', now(), 'mfa');
  RAISE EXCEPTION 'FAIL: unknown funder key accepted';
EXCEPTION WHEN check_violation THEN RAISE NOTICE 'PASS: only the six funder keys are accepted';
END $$;
DO $$ BEGIN
  UPDATE participants SET service_county = 'santa_fe' WHERE id = '00000000-0000-0000-0000-000000000001';
  RAISE EXCEPTION 'FAIL: unknown service county accepted';
EXCEPTION WHEN check_violation THEN RAISE NOTICE 'PASS: service county is Bernalillo, Lea or other';
END $$;
SELECT vs_test.ok((SELECT count(*) FROM vs_report_flags(ARRAY['00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000003']::uuid[])) = 2, 'operator gets report flags for all participants');
SELECT vs_test.ok((SELECT medicaid_last4 = '7766' AND dob_year = 1990 FROM vs_report_flags(
  ARRAY['00000000-0000-0000-0000-000000000001']::uuid[])), 'report flags give birth year + last-4 only');

SELECT vs_test.login('00000000-0000-0000-0000-0000000000c1', 'test.cm.a@example.test');
SELECT vs_test.ok((SELECT count(*) FROM vs_report_flags(ARRAY['00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000003']::uuid[])) = 1, 'case manager report flags cover own caseload only');
SELECT vs_test.ok((SELECT count(*) FROM services_delivered WHERE funder_key IS NOT NULL) = 1,
  'case manager sees only own caseload services in reports');
RESET ROLE;
SET ROLE anon;
DO $$ BEGIN
  PERFORM vs_report_flags(ARRAY['00000000-0000-0000-0000-000000000001']::uuid[]);
  RAISE EXCEPTION 'FAIL: anon can call vs_report_flags';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: anon cannot call vs_report_flags';
END $$;
RESET ROLE;

-- ── Invites ─────────────────────────────────────────────────────────────────
SET ROLE authenticated;
SELECT vs_test.login('00000000-0000-0000-0000-0000000000c1', 'test.cm.a@example.test');
DO $$ BEGIN
  INSERT INTO vs_invites (email, access_role) VALUES ('test.sneaky@example.test', 'executive');
  RAISE EXCEPTION 'FAIL: case manager created an invite';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: case managers cannot invite';
END $$;
SELECT vs_test.login('00000000-0000-0000-0000-0000000000d1', 'test.leadership@example.test');
DO $$ BEGIN
  INSERT INTO vs_invites (email, access_role) VALUES ('test.sneaky@example.test', 'executive');
  RAISE EXCEPTION 'FAIL: leadership created an invite';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: leadership cannot invite';
END $$;

SELECT vs_test.login('00000000-0000-0000-0000-0000000000a1', 'test.operator@example.test');
INSERT INTO vs_invites (id, email, display_name, access_role, staff_id) VALUES
  ('00000000-0000-0000-0000-0000000019a1', 'test.invitee@example.test', 'Test CaseMgr C', 'case_manager',
   '00000000-0000-0000-0000-00000000cccc');
DO $$ BEGIN
  INSERT INTO vs_invites (email, access_role) VALUES ('test.invitee@example.test', 'operator');
  RAISE EXCEPTION 'FAIL: two open invites for one email';
EXCEPTION WHEN unique_violation THEN RAISE NOTICE 'PASS: one open invite per email';
END $$;
DO $$ BEGIN
  INSERT INTO vs_invites (email, access_role) VALUES ('Test.Upper@Example.test', 'operator');
  RAISE EXCEPTION 'FAIL: mixed-case invite email accepted';
EXCEPTION WHEN check_violation THEN RAISE NOTICE 'PASS: invite emails are stored lowercase';
END $$;
SELECT vs_test.ok((SELECT invited_by = '00000000-0000-0000-0000-0000000000a1' FROM vs_invites
  WHERE id = '00000000-0000-0000-0000-0000000019a1'), 'invite records who invited');

SELECT vs_test.login('00000000-0000-0000-0000-0000000000c8', 'test.stranger@example.test');
SELECT vs_test.ok(vs_accept_invite() IS NULL, 'a user with no invite gets nothing');
SELECT vs_test.ok(vs_current_access_role() IS NULL, 'uninvited user still has no role');

SELECT vs_test.login('00000000-0000-0000-0000-0000000000c9', 'test.invitee@example.test');
SELECT vs_test.ok(vs_accept_invite() = 'case_manager', 'invitee signs in and gets the pre-assigned role');
SELECT vs_test.ok(vs_current_access_role() = 'case_manager', 'invitee access role is active');
SELECT vs_test.ok(vs_accept_invite() IS NULL, 'an invite can only be used once');
SELECT vs_test.ok((SELECT count(*) FROM participants) = 0, 'new case manager starts with an empty caseload');
DO $$ BEGIN
  UPDATE vs_operators SET access_role = 'executive' WHERE user_id = auth.uid();
  IF EXISTS (SELECT 1 FROM vs_operators WHERE user_id = auth.uid() AND access_role = 'executive') THEN
    RAISE EXCEPTION 'FAIL: invitee promoted self';
  END IF;
  RAISE NOTICE 'PASS: invitee cannot promote self (no rows changed)';
EXCEPTION WHEN raise_exception THEN
  IF SQLERRM LIKE 'FAIL%' THEN RAISE; END IF;
  RAISE NOTICE 'PASS: invitee cannot promote self (guard)';
END $$;
SELECT vs_test.ok(vs_accept_invite() IS NULL, 'replaying accept cannot change the role');
RESET ROLE;
SELECT vs_test.ok((SELECT role = 'employee' AND access_role = 'case_manager' AND activated_at IS NOT NULL
  FROM vs_operators WHERE user_id = '00000000-0000-0000-0000-0000000000c9'), 'invitee row: employee / case_manager');
SELECT vs_test.ok((SELECT auth_user_id = '00000000-0000-0000-0000-0000000000c9' FROM staff
  WHERE id = '00000000-0000-0000-0000-00000000cccc'), 'invite links the staff record');
SELECT vs_test.ok((SELECT accepted_at IS NOT NULL FROM vs_invites WHERE id = '00000000-0000-0000-0000-0000000019a1'),
  'invite is marked accepted');
SELECT vs_test.ok(EXISTS (SELECT 1 FROM vs_audit_log WHERE table_name = 'vs_invites' AND action = 'INSERT'),
  'invites are audited');

-- ── Role-change audit ───────────────────────────────────────────────────────
SELECT vs_test.ok(EXISTS (SELECT 1 FROM vs_audit_log WHERE action = 'ROLE_CHANGE'
  AND record_id = '00000000-0000-0000-0000-0000000000c9' AND details->>'via_invite' IS NOT NULL
  AND details->'to'->>'access_role' = 'case_manager'), 'accepting an invite writes ROLE_CHANGE');
SET ROLE authenticated;
SELECT vs_test.login('00000000-0000-0000-0000-0000000000e1', 'test.exec@example.test');
UPDATE vs_operators SET access_role = 'leadership_readonly' WHERE user_id = '00000000-0000-0000-0000-0000000000c9';
UPDATE vs_operators SET display_name = 'Test CaseMgr C2' WHERE user_id = '00000000-0000-0000-0000-0000000000c9';
UPDATE vs_operators SET revoked_at = now(), revoked_reason = 'test' WHERE user_id = '00000000-0000-0000-0000-0000000000c9';
SELECT vs_test.ok((SELECT count(*) FROM vs_audit_log WHERE action = 'ROLE_CHANGE'
  AND record_id = '00000000-0000-0000-0000-0000000000c9') = 3, 'role and revoke changes log ROLE_CHANGE; name edits do not');
SELECT vs_test.ok(EXISTS (SELECT 1 FROM vs_audit_log WHERE action = 'ROLE_CHANGE' AND actor_role = 'executive'
  AND details->'from'->>'access_role' = 'case_manager' AND details->'to'->>'access_role' = 'leadership_readonly'),
  'ROLE_CHANGE shows who changed it, from and to');
SELECT vs_test.login('00000000-0000-0000-0000-0000000000c1', 'test.cm.a@example.test');
SELECT vs_test.ok((SELECT count(*) FROM vs_audit_log WHERE action = 'ROLE_CHANGE') = 0,
  'case managers cannot read the role-change audit');
DO $$ BEGIN
  INSERT INTO vs_audit_log (action, table_name) VALUES ('ROLE_CHANGE', 'vs_operators');
  RAISE EXCEPTION 'FAIL: case manager forged a ROLE_CHANGE row';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: nobody can forge a ROLE_CHANGE row';
END $$;
RESET ROLE;

-- Revoked invitee is not restored by a fresh invite
INSERT INTO vs_invites (email, access_role) VALUES ('test.invitee@example.test', 'executive');
SET ROLE authenticated;
SELECT vs_test.login('00000000-0000-0000-0000-0000000000c9', 'test.invitee@example.test');
SELECT vs_test.ok(vs_accept_invite() IS NULL, 'a revoked account cannot use a new invite');
RESET ROLE;
SELECT vs_test.ok((SELECT revoked_at IS NOT NULL AND access_role = 'leadership_readonly' FROM vs_operators
  WHERE user_id = '00000000-0000-0000-0000-0000000000c9'), 'revoked account unchanged');

-- ── Profile + activity ──────────────────────────────────────────────────────
SET ROLE authenticated;
SELECT vs_test.login('00000000-0000-0000-0000-0000000000c2', 'test.cm.b@example.test');
SELECT vs_update_my_profile('  Test CaseMgr B Renamed  ');
SELECT vs_touch_last_active();
RESET ROLE;
SELECT vs_test.ok((SELECT display_name = 'Test CaseMgr B Renamed' AND access_role = 'case_manager'
  AND last_active_at IS NOT NULL FROM vs_operators WHERE user_id = '00000000-0000-0000-0000-0000000000c2'),
  'anyone can update their own display name and last-active');
SELECT vs_test.ok((SELECT display_name = 'Test CaseMgr A' FROM vs_operators
  WHERE user_id = '00000000-0000-0000-0000-0000000000c1'), 'profile update touches only the caller');
SET ROLE authenticated;
SELECT vs_test.login('00000000-0000-0000-0000-0000000000a1', 'test.operator@example.test');
SELECT vs_test.ok((SELECT actions_30d > 0 FROM vs_operator_activity
  WHERE actor_user_id = '00000000-0000-0000-0000-0000000000a1'), 'operators see the activity dashboard');
SELECT vs_test.login('00000000-0000-0000-0000-0000000000d1', 'test.leadership@example.test');
SELECT vs_test.ok((SELECT count(*) FROM vs_operator_activity) = 0, 'leadership gets no activity rows');
SELECT vs_test.login('00000000-0000-0000-0000-0000000000c1', 'test.cm.a@example.test');
SELECT vs_test.ok((SELECT count(*) FROM vs_operator_activity) = 0, 'case managers get no activity rows');
RESET ROLE;

\echo ALL VS FUNDER + WAVE 2 DB TESTS PASSED
