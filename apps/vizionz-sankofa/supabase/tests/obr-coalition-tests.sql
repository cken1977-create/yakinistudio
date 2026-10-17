-- VIZIONZ SANKOFA · OBR + Coalition Partners RLS / audit tests (FAKE data).
-- Runs after rls-audit-tests.sql (reuses vs_test.ok / vs_test.login).
\set ON_ERROR_STOP on
SET client_min_messages = notice;

-- Fake partner org, funder org and program (as DB owner)
INSERT INTO organizations (id, name, slug, relationship_kind, type) VALUES
  ('00000000-0000-0000-0000-0000000000b1', 'Test Partner Org', 'test-partner-org', 'partner', 'nonprofit'),
  ('00000000-0000-0000-0000-0000000000b2', 'Test Funder Org', 'test-funder-org', 'funder', 'foundation');
INSERT INTO programs (id, slug, name) VALUES
  ('00000000-0000-0000-0000-0000000000f7', 'test-program', 'Test Program');

-- ── Executive: OBR ──────────────────────────────────────────────────────────
SET ROLE authenticated;
SELECT vs_test.login('00000000-0000-0000-0000-0000000000e1', 'test.exec@example.test');
INSERT INTO vs_obr_profiles (id, is_self, display_name, staff_count, annual_budget)
VALUES ('00000000-0000-0000-0000-00000000ab01', true, 'Test VS Self', 12, 250000);
SELECT vs_test.ok((SELECT count(*) FROM vs_obr_profiles) = 1, 'executive can create the OBR profile for VS itself');
DO $$ BEGIN
  INSERT INTO vs_obr_profiles (is_self, display_name) VALUES (true, 'Second self');
  RAISE EXCEPTION 'FAIL: two self OBR profiles allowed';
EXCEPTION WHEN unique_violation THEN RAISE NOTICE 'PASS: only one OBR profile can be VS itself';
END $$;
UPDATE vs_obr_profiles SET board_structure = 'Fake 7-member board' WHERE id = '00000000-0000-0000-0000-00000000ab01';
INSERT INTO vs_obr_evidence (profile_id, item_key, status, source, attested_by_name)
VALUES ('00000000-0000-0000-0000-00000000ab01', 'bylaws', 'on_file', 'Fake board binder', 'Test Exec');
DO $$ BEGIN
  INSERT INTO vs_obr_ratings (profile_id, certification_status, standard_version, evaluator_name, rationale)
  VALUES ('00000000-0000-0000-0000-00000000ab01', 'certified', '', 'Test Evaluator', 'x');
  RAISE EXCEPTION 'FAIL: rating without a standard version accepted';
EXCEPTION WHEN check_violation THEN RAISE NOTICE 'PASS: an OBR rating must carry the standard version';
END $$;
DO $$ BEGIN
  INSERT INTO vs_obr_ratings (profile_id, certification_status, standard_version, evaluator_name, rationale, is_override)
  VALUES ('00000000-0000-0000-0000-00000000ab01', 'certified', 'TEST-1.0', 'Test Evaluator', 'x', true);
  RAISE EXCEPTION 'FAIL: override without a reason accepted';
EXCEPTION WHEN check_violation THEN RAISE NOTICE 'PASS: an override must give a reason';
END $$;
INSERT INTO vs_obr_ratings (profile_id, certification_status, rating_label, standard_version, ruleset_hash,
  evaluator_name, rationale, domain_scores)
VALUES ('00000000-0000-0000-0000-00000000ab01', 'certified', 'Fake rating', 'TEST-1.0', 'fakehash',
  'Test Evaluator', 'Fake rationale', '{"governance": 3.5}');
SELECT vs_test.ok((SELECT status = 'rated' FROM vs_obr_profiles WHERE id = '00000000-0000-0000-0000-00000000ab01'),
  'recording a final rating marks the OBR profile rated');
DO $$ BEGIN
  UPDATE vs_obr_ratings SET rating_label = 'tampered';
  RAISE EXCEPTION 'FAIL: OBR rating edited';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: OBR ratings cannot be edited (append-only)';
END $$;
DO $$ BEGIN
  DELETE FROM vs_obr_ratings;
  RAISE EXCEPTION 'FAIL: OBR rating deleted';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: OBR ratings cannot be deleted';
END $$;
DO $$ BEGIN
  DELETE FROM vs_obr_profiles;
  RAISE EXCEPTION 'FAIL: OBR profile deleted';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: OBR profiles cannot be deleted through the API';
END $$;

-- ── Executive: coalition ────────────────────────────────────────────────────
INSERT INTO vs_partner_agreements (organization_id, title, agreement_type, status, effective_date, expires_on)
VALUES ('00000000-0000-0000-0000-0000000000b1', 'Fake MOU', 'mou', 'active', '2026-01-01', '2027-01-01');
INSERT INTO vs_partner_checkins (organization_id, occurred_on, method, summary, next_checkin_due)
VALUES ('00000000-0000-0000-0000-0000000000b1', '2026-10-01', 'phone', 'Fake check-in summary', '2026-11-15');
INSERT INTO vs_partner_programs (organization_id, program_id, partner_role)
VALUES ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000f7', 'host_site');
SELECT vs_test.ok((SELECT next_touch_due = '2026-11-15' FROM organizations WHERE id = '00000000-0000-0000-0000-0000000000b1'),
  'a partner check-in sets the partner next-touch date');
DO $$ BEGIN
  INSERT INTO vs_partner_agreements (organization_id, title, effective_date, expires_on)
  VALUES ('00000000-0000-0000-0000-0000000000b1', 'Bad dates', '2027-01-01', '2026-01-01');
  RAISE EXCEPTION 'FAIL: agreement expiring before it starts accepted';
EXCEPTION WHEN check_violation THEN RAISE NOTICE 'PASS: an agreement cannot expire before it starts';
END $$;

-- ── Operator ────────────────────────────────────────────────────────────────
SELECT vs_test.login('00000000-0000-0000-0000-0000000000a1', 'test.operator@example.test');
UPDATE vs_partner_agreements SET status = 'signed' WHERE title = 'Fake MOU';
SELECT vs_test.ok((SELECT status = 'signed' FROM vs_partner_agreements WHERE title = 'Fake MOU'),
  'operator can update a partner agreement');
UPDATE vs_obr_evidence SET status = 'verified' WHERE item_key = 'bylaws';
SELECT vs_test.ok((SELECT status = 'verified' FROM vs_obr_evidence WHERE item_key = 'bylaws'),
  'operator can update OBR evidence');

-- ── Leadership read-only ────────────────────────────────────────────────────
SELECT vs_test.login('00000000-0000-0000-0000-0000000000d1', 'test.leadership@example.test');
SELECT vs_test.ok((SELECT count(*) FROM vs_obr_profiles) = 1 AND (SELECT count(*) FROM vs_obr_ratings) = 1,
  'leadership can read OBR profile and ratings');
SELECT vs_test.ok((SELECT count(*) FROM vs_partner_checkins) = 1, 'leadership can read partner check-ins');
UPDATE vs_obr_profiles SET board_structure = 'leadership edit';
UPDATE vs_partner_agreements SET title = 'leadership edit';
SELECT vs_test.ok(NOT EXISTS (SELECT 1 FROM vs_obr_profiles WHERE board_structure = 'leadership edit')
  AND NOT EXISTS (SELECT 1 FROM vs_partner_agreements WHERE title = 'leadership edit'),
  'leadership cannot edit OBR or partner records');
DO $$ BEGIN
  INSERT INTO vs_partner_checkins (organization_id, summary) VALUES ('00000000-0000-0000-0000-0000000000b1', 'x');
  RAISE EXCEPTION 'FAIL: leadership logged a check-in';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: leadership cannot log partner check-ins';
END $$;
DO $$ BEGIN
  INSERT INTO vs_obr_ratings (profile_id, certification_status, standard_version, evaluator_name, rationale)
  VALUES ('00000000-0000-0000-0000-00000000ab01', 'revoked', 'TEST-1.0', 'x', 'x');
  RAISE EXCEPTION 'FAIL: leadership recorded a rating';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: leadership cannot record OBR ratings';
END $$;

-- ── Case manager ────────────────────────────────────────────────────────────
SELECT vs_test.login('00000000-0000-0000-0000-0000000000c1', 'test.cm.a@example.test');
SELECT vs_test.ok((SELECT count(*) FROM vs_obr_profiles) = 0 AND (SELECT count(*) FROM vs_obr_ratings) = 0
  AND (SELECT count(*) FROM vs_obr_evidence) = 0, 'case manager sees no OBR records');
SELECT vs_test.ok((SELECT count(*) FROM vs_partner_agreements) = 1 AND (SELECT count(*) FROM vs_partner_programs) = 1,
  'case manager can read partner agreements and shared programs');
SELECT vs_test.ok((SELECT count(*) FROM vs_partner_checkins) = 0, 'case manager cannot read partner check-in notes');
DO $$ BEGIN
  INSERT INTO vs_partner_agreements (organization_id, title) VALUES ('00000000-0000-0000-0000-0000000000b1', 'x');
  RAISE EXCEPTION 'FAIL: case manager created an agreement';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: case manager cannot create partner agreements';
END $$;
DELETE FROM vs_partner_programs;
SELECT vs_test.ok(true, 'case manager delete attempt on shared programs ran');
RESET ROLE;
SELECT vs_test.ok((SELECT count(*) FROM vs_partner_programs) = 1, 'case manager cannot delete shared programs');

-- ── Anonymous ───────────────────────────────────────────────────────────────
SET ROLE anon;
SELECT set_config('request.jwt.claims', '{"role":"anon"}', false);
DO $$ BEGIN
  PERFORM 1 FROM vs_partner_agreements;
  RAISE EXCEPTION 'FAIL: anon can query partner agreements';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: anonymous visitors cannot query partner agreements';
END $$;
DO $$ BEGIN
  PERFORM 1 FROM vs_obr_profiles;
  RAISE EXCEPTION 'FAIL: anon can query OBR profiles';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: anonymous visitors cannot query OBR profiles';
END $$;
RESET ROLE;

-- ── Audit trail ─────────────────────────────────────────────────────────────
SELECT vs_test.ok(EXISTS (SELECT 1 FROM vs_audit_log WHERE table_name = 'vs_obr_ratings' AND action = 'INSERT'
                   AND actor_email = 'test.exec@example.test'), 'OBR ratings are audited with who recorded them');
SELECT vs_test.ok(EXISTS (SELECT 1 FROM vs_audit_log WHERE table_name = 'vs_obr_profiles' AND action = 'UPDATE'),
  'OBR profile edits are audited');
SELECT vs_test.ok(EXISTS (SELECT 1 FROM vs_audit_log WHERE table_name = 'vs_partner_agreements' AND action = 'UPDATE'
                   AND actor_role = 'operator' AND before_json->>'status' = 'active' AND after_json->>'status' = 'signed'),
  'partner agreement changes are audited with old and new values');
SELECT vs_test.ok(EXISTS (SELECT 1 FROM vs_audit_log WHERE table_name = 'vs_partner_checkins' AND action = 'INSERT'),
  'partner check-ins are audited');

\echo ALL VS OBR + COALITION DB TESTS PASSED
