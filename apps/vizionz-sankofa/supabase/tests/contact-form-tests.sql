-- Public contact messages and admin contact removal. Fake data only.
\set ON_ERROR_STOP on
SET client_min_messages = notice;

-- Anonymous visitor saves a website message. No file is stored with it.
SET ROLE anon;
INSERT INTO public.intake_requests (id, full_name, email, phone, request_type, details, consent_given)
VALUES (
  '00000000-0000-0000-0000-00000000e901',
  'Nia Mensah',
  'nia.mensah@example.test',
  '505-555-0101',
  'housing',
  E'Website contact form.\nService interest: Housing Stability\n\nNeed a hotel voucher this week.',
  true
);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM intake_requests WHERE email = 'nia.mensah@example.test') THEN
    RAISE EXCEPTION 'FAIL: anonymous visitor read the contact message';
  END IF;
  RAISE NOTICE 'PASS: anonymous visitors cannot read contact messages';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'PASS: anonymous visitors cannot read contact messages';
END $$;
DO $$ BEGIN
  INSERT INTO vs_contacts (display_name, kind) VALUES ('Public Person', 'partner');
  RAISE EXCEPTION 'FAIL: anonymous visitor created a contact';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'PASS: anonymous visitors cannot create admin contacts';
END $$;
RESET ROLE;
SET ROLE authenticated;

SELECT vs_test.login('00000000-0000-0000-0000-0000000000a1', 'test.operator@example.test');
SELECT vs_test.ok(
  (SELECT details LIKE '%Need a hotel voucher this week.%' AND request_type = 'housing'
   FROM intake_requests WHERE id = '00000000-0000-0000-0000-00000000e901'),
  'an operator can read the saved website message');
SELECT vs_test.ok(
  NOT EXISTS (SELECT 1 FROM intake_request_files WHERE intake_request_id = '00000000-0000-0000-0000-00000000e901'),
  'a website message does not create a public file');

SELECT vs_test.login('00000000-0000-0000-0000-0000000000c1', 'test.cm.a@example.test');
SELECT vs_test.ok(
  NOT EXISTS (SELECT 1 FROM intake_requests WHERE id = '00000000-0000-0000-0000-00000000e901'),
  'a case manager does not see an unassigned website message');
DO $$ BEGIN
  UPDATE vs_contacts SET archived_at = now() WHERE id = '00000000-0000-0000-0000-00000000c0a1';
  IF EXISTS (SELECT 1 FROM vs_contacts WHERE id = '00000000-0000-0000-0000-00000000c0a1' AND archived_at IS NOT NULL) THEN
    RAISE EXCEPTION 'FAIL: case manager archived a contact';
  END IF;
  RAISE NOTICE 'PASS: a case manager archive does not remove the contact';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'PASS: a case manager cannot archive a contact';
END $$;

SELECT vs_test.login('00000000-0000-0000-0000-0000000000e1', 'test.exec@example.test');
SELECT vs_test.ok(
  EXISTS (SELECT 1 FROM intake_requests WHERE id = '00000000-0000-0000-0000-00000000e901'),
  'an executive can read the saved website message');
UPDATE vs_contacts SET archived_at = now() WHERE id = '00000000-0000-0000-0000-00000000c0a1';
SELECT vs_test.ok(
  (SELECT archived_at IS NOT NULL FROM vs_contacts WHERE id = '00000000-0000-0000-0000-00000000c0a1')
  AND EXISTS (SELECT 1 FROM vs_activities WHERE subject_id = '00000000-0000-0000-0000-00000000c0a1'),
  'removing a contact from the active list keeps their timeline');
SELECT vs_test.ok(
  (SELECT name FROM organizations WHERE slug = 'test-agency-org') = 'Test Agency Org',
  'saving a website message does not rename an organization');
RESET ROLE;

\echo ALL VS CONTACT FORM DB TESTS PASSED
