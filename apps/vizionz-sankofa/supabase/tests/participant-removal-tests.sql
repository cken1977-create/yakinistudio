-- FAKE participants only. Removal is reversible. Hard delete stays blocked.
\set ON_ERROR_STOP on
SET client_min_messages = notice;

INSERT INTO public.organizations (id, name, slug, relationship_kind, type) VALUES
  ('00000000-0000-0000-0000-00000000e301', 'Test Partner A', 'test-partner-a-removal', 'partner', 'nonprofit'),
  ('00000000-0000-0000-0000-00000000e302', 'Test Partner B', 'test-partner-b-removal', 'funder', 'foundation');

INSERT INTO public.participants (id, first_name, last_name, email, phone_primary, primary_case_manager_id) VALUES
  ('00000000-0000-0000-0000-00000000e101', 'Test', 'Duplicate Empty', 'empty@example.test', '505-555-0191', '00000000-0000-0000-0000-00000000aaaa'),
  ('00000000-0000-0000-0000-00000000e102', 'Test', 'Duplicate Noted', 'noted@example.test', '505-555-0192', '00000000-0000-0000-0000-00000000aaaa'),
  ('00000000-0000-0000-0000-00000000e103', 'Test', 'Duplicate Enrolled', 'enrolled@example.test', '505-555-0193', '00000000-0000-0000-0000-00000000aaaa'),
  ('00000000-0000-0000-0000-00000000e104', 'Test', 'Duplicate Tasked', 'tasked@example.test', '505-555-0194', '00000000-0000-0000-0000-00000000bbbb'),
  ('00000000-0000-0000-0000-00000000e105', 'Test', 'Duplicate Empty', 'empty-two@example.test', '505-555-0195', '00000000-0000-0000-0000-00000000aaaa');

INSERT INTO public.case_notes (participant_id, staff_id, contact_method, content) VALUES
  ('00000000-0000-0000-0000-00000000e102', '00000000-0000-0000-0000-00000000aaaa', 'phone', 'Fake note that must survive removal');
INSERT INTO public.participant_addresses (participant_id, address_line1) VALUES
  ('00000000-0000-0000-0000-00000000e102', '1 Fake Street');
INSERT INTO public.participant_documents (participant_id, filename, storage_path) VALUES
  ('00000000-0000-0000-0000-00000000e102', 'id-photo.png', '00000000-0000-0000-0000-00000000e102/id-photo.png');

INSERT INTO public.programs (id, slug, name) VALUES
  ('00000000-0000-0000-0000-00000000e201', 'test-removal-program', 'Test Removal Program');
INSERT INTO public.cohorts (id, program_id, name, start_date) VALUES
  ('00000000-0000-0000-0000-00000000e202', '00000000-0000-0000-0000-00000000e201', 'Test Removal Cohort', CURRENT_DATE);
INSERT INTO public.enrollments (participant_id, cohort_id, status) VALUES
  ('00000000-0000-0000-0000-00000000e103', '00000000-0000-0000-0000-00000000e202', 'enrolled');
INSERT INTO public.vs_tasks (title, assigned_to, subject_type, subject_id, created_by) VALUES
  ('Call Test Duplicate Tasked', '00000000-0000-0000-0000-0000000000e1', 'participant', '00000000-0000-0000-0000-00000000e104', '00000000-0000-0000-0000-0000000000e1');

-- Unauthorized roles, including another caseload, cannot preview or remove.
SET ROLE authenticated;
SELECT vs_test.login('00000000-0000-0000-0000-0000000000c1', 'test.cm.a@example.test');
DO $$ BEGIN
  PERFORM public.vs_participant_removal_preview('00000000-0000-0000-0000-00000000e104');
  RAISE EXCEPTION 'FAIL: case manager previewed another caseload';
EXCEPTION WHEN insufficient_privilege THEN
  IF SQLERRM ILIKE '%Duplicate Tasked%' THEN RAISE EXCEPTION 'FAIL: error leaked the other participant name'; END IF;
  RAISE NOTICE 'PASS: case manager cannot preview removal across caseloads';
END $$;
DO $$ BEGIN
  PERFORM public.vs_soft_delete_participant('00000000-0000-0000-0000-00000000e101', now(), 'no');
  RAISE EXCEPTION 'FAIL: case manager removed their own participant';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'PASS: case manager cannot remove even their own participant';
END $$;
SELECT vs_test.login('00000000-0000-0000-0000-0000000000d1', 'test.leadership@example.test');
DO $$ BEGIN
  PERFORM public.vs_restore_participant('00000000-0000-0000-0000-00000000e101');
  RAISE EXCEPTION 'FAIL: leadership restored a participant';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'PASS: leadership cannot restore a participant';
END $$;
RESET ROLE;
SET ROLE anon;
DO $$ BEGIN
  PERFORM public.vs_soft_delete_participant('00000000-0000-0000-0000-00000000e101', now(), 'no');
  RAISE EXCEPTION 'FAIL: anon removed a participant';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'PASS: anonymous cannot remove a participant';
END $$;
RESET ROLE;

-- Operator reviews, is blocked by an active enrollment and an open task, and
-- those linked rows stay.
SET ROLE authenticated;
SELECT vs_test.login('00000000-0000-0000-0000-0000000000a1', 'test.operator@example.test');
SELECT vs_test.ok((vs_participant_removal_preview('00000000-0000-0000-0000-00000000e103')->>'code') = 'blocked',
  'active enrollment blocks removal');
SELECT vs_test.ok((vs_participant_removal_preview('00000000-0000-0000-0000-00000000e104')->>'code') = 'blocked',
  'open task blocks removal');
SELECT vs_test.ok((vs_soft_delete_participant('00000000-0000-0000-0000-00000000e103',
  (SELECT updated_at FROM participants WHERE id = '00000000-0000-0000-0000-00000000e103'), NULL)->>'code') = 'blocked',
  'blocked removal does not change the participant');
RESET ROLE;
SELECT vs_test.ok((SELECT deleted_at IS NULL FROM participants WHERE id = '00000000-0000-0000-0000-00000000e103'),
  'blocked participant is still on the roster');
SELECT vs_test.ok((SELECT status = 'enrolled' FROM enrollments WHERE participant_id = '00000000-0000-0000-0000-00000000e103'),
  'enrollment row was not withdrawn or deleted');
SELECT vs_test.ok((SELECT status = 'open' FROM vs_tasks WHERE subject_id = '00000000-0000-0000-0000-00000000e104'),
  'open task was not cancelled');

-- Confirmed removal keeps history. A repeat call is already_removed.
SET ROLE authenticated;
SELECT vs_test.login('00000000-0000-0000-0000-0000000000a1', 'test.operator@example.test');
SELECT vs_test.ok((vs_participant_removal_preview('00000000-0000-0000-0000-00000000e102')->>'code') = 'ready',
  'participant with notes can be removed because the notes stay');
SELECT vs_test.ok(jsonb_array_length(vs_participant_removal_preview('00000000-0000-0000-0000-00000000e101')->'possible_duplicates') >= 1,
  'preview reports the other same-name record and does not remove it');
SELECT vs_test.ok((vs_soft_delete_participant('00000000-0000-0000-0000-00000000e102',
  (SELECT updated_at FROM participants WHERE id = '00000000-0000-0000-0000-00000000e102'), 'fake duplicate')->>'code') = 'removed',
  'operator removed the noted duplicate');
SELECT vs_test.ok((vs_soft_delete_participant('00000000-0000-0000-0000-00000000e102', now(), 'again')->>'code') = 'already_removed',
  'repeating the removal does not delete the row again');
RESET ROLE;
SELECT vs_test.ok((SELECT deleted_at IS NOT NULL AND deleted_by = '00000000-0000-0000-0000-0000000000a1'
                   FROM participants WHERE id = '00000000-0000-0000-0000-00000000e102'),
  'removal stamps who removed them');
SELECT vs_test.ok((SELECT count(*) FROM case_notes WHERE participant_id = '00000000-0000-0000-0000-00000000e102') = 1,
  'case note was preserved');
SELECT vs_test.ok((SELECT count(*) FROM participant_addresses WHERE participant_id = '00000000-0000-0000-0000-00000000e102') = 1,
  'address was preserved');
SELECT vs_test.ok((SELECT count(*) FROM participant_documents WHERE participant_id = '00000000-0000-0000-0000-00000000e102') = 1,
  'document row was preserved');
SELECT vs_test.ok(EXISTS (SELECT 1 FROM vs_audit_log WHERE table_name = 'participants' AND action = 'UPDATE'
  AND record_id = '00000000-0000-0000-0000-00000000e102' AND after_json->>'deleted_at' IS NOT NULL),
  'removal is an audited update');
SELECT vs_test.ok((SELECT count(*) FROM organizations WHERE id IN (
  '00000000-0000-0000-0000-00000000e301', '00000000-0000-0000-0000-00000000e302')) = 2,
  'removing a participant does not change organization records');
SELECT vs_test.ok((SELECT deleted_at IS NULL FROM participants WHERE id = '00000000-0000-0000-0000-00000000e105'),
  'the other same-name participant was not removed');

-- A changed row refuses a stale confirmation.
SET ROLE authenticated;
SELECT vs_test.login('00000000-0000-0000-0000-0000000000a1', 'test.operator@example.test');
SELECT updated_at AS stale_at FROM participants WHERE id = '00000000-0000-0000-0000-00000000e101' \gset
UPDATE participants SET intake_notes = 'edited after preview' WHERE id = '00000000-0000-0000-0000-00000000e101';
SELECT vs_test.ok((vs_soft_delete_participant('00000000-0000-0000-0000-00000000e101', :'stale_at', NULL)->>'code') = 'conflict',
  'stale confirmation does not remove the participant');
RESET ROLE;
SELECT vs_test.ok((SELECT deleted_at IS NULL FROM participants WHERE id = '00000000-0000-0000-0000-00000000e101'),
  'participant is unchanged after a conflicting request');

-- Direct delete and direct deleted_at edits are refused. Restore works.
DO $$ BEGIN
  DELETE FROM participants WHERE id = '00000000-0000-0000-0000-00000000e101';
  RAISE EXCEPTION 'FAIL: hard delete succeeded';
EXCEPTION WHEN insufficient_privilege THEN
  IF SQLERRM NOT LIKE '%cannot be permanently deleted%' THEN RAISE; END IF;
  RAISE NOTICE 'PASS: hard delete is refused';
END $$;
SET ROLE authenticated;
SELECT vs_test.login('00000000-0000-0000-0000-0000000000a1', 'test.operator@example.test');
DO $$ BEGIN
  UPDATE participants SET deleted_at = now() WHERE id = '00000000-0000-0000-0000-00000000e101';
  RAISE EXCEPTION 'FAIL: direct deleted_at edit';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'PASS: deleted_at cannot be edited directly';
END $$;
SELECT vs_test.ok((vs_restore_participant('00000000-0000-0000-0000-00000000e102')->>'code') = 'restored',
  'operator can restore a removed participant');
SELECT vs_test.ok((vs_restore_participant('00000000-0000-0000-0000-00000000e102')->>'code') = 'already_active',
  'restoring twice reports that they are already on the roster');
RESET ROLE;
SELECT vs_test.ok((SELECT deleted_at IS NULL FROM participants WHERE id = '00000000-0000-0000-0000-00000000e102'),
  'restored participant is back on the roster');
SELECT vs_test.ok((SELECT count(*) FROM case_notes WHERE participant_id = '00000000-0000-0000-0000-00000000e102') = 1,
  'case note is still there after restore');

-- Hidden from case managers and leadership while removed; visible to the operator.
SET ROLE authenticated;
SELECT vs_test.login('00000000-0000-0000-0000-0000000000a1', 'test.operator@example.test');
SELECT vs_soft_delete_participant('00000000-0000-0000-0000-00000000e101',
  (SELECT updated_at FROM participants WHERE id = '00000000-0000-0000-0000-00000000e101'), NULL);
SELECT vs_test.login('00000000-0000-0000-0000-0000000000c1', 'test.cm.a@example.test');
SELECT vs_test.ok(NOT EXISTS (SELECT 1 FROM participants WHERE id = '00000000-0000-0000-0000-00000000e101'),
  'case manager no longer sees a removed participant');
SELECT vs_test.login('00000000-0000-0000-0000-0000000000d1', 'test.leadership@example.test');
SELECT vs_test.ok(NOT EXISTS (SELECT 1 FROM participants WHERE id = '00000000-0000-0000-0000-00000000e101'),
  'leadership does not see a removed participant');
SELECT vs_test.login('00000000-0000-0000-0000-0000000000a1', 'test.operator@example.test');
SELECT vs_test.ok(EXISTS (SELECT 1 FROM participants WHERE id = '00000000-0000-0000-0000-00000000e101'),
  'operator can still open a removed participant to restore them');
RESET ROLE;

-- Picture storage: gallery upload is executive/operator only. Participant
-- files stay private and follow the caseload. A new object does not replace
-- an older one.
SELECT vs_test.ok((SELECT b.public FROM storage.buckets b WHERE b.id = 'media'), 'gallery bucket is public');
SELECT vs_test.ok(NOT (SELECT b.public FROM storage.buckets b WHERE b.id = 'vs-participant-documents'),
  'participant document bucket is private');
SET ROLE authenticated;
SELECT vs_test.login('00000000-0000-0000-0000-0000000000a1', 'test.operator@example.test');
INSERT INTO storage.objects (bucket_id, name) VALUES ('media', 'prior-laptop-photo.jpg');
INSERT INTO storage.objects (bucket_id, name) VALUES ('media', 'new-laptop-photo.jpg');
DELETE FROM storage.objects WHERE bucket_id = 'media' AND name = 'new-laptop-photo.jpg';
SELECT vs_test.ok(EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'media' AND name = 'prior-laptop-photo.jpg'),
  'removing a failed new gallery upload leaves the earlier photo');
SELECT vs_test.ok(NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'media' AND name = 'new-laptop-photo.jpg'),
  'only the new gallery object was removed');
INSERT INTO storage.objects (bucket_id, name) VALUES
  ('vs-participant-documents', '00000000-0000-0000-0000-00000000e105/photo.jpg');
SELECT vs_test.login('00000000-0000-0000-0000-0000000000c1', 'test.cm.a@example.test');
INSERT INTO storage.objects (bucket_id, name) VALUES
  ('vs-participant-documents', '00000000-0000-0000-0000-00000000e105/case-manager-photo.jpg');
SELECT vs_test.ok(true, 'case manager can store a photo on their own participant');
DO $$ BEGIN
  INSERT INTO storage.objects (bucket_id, name) VALUES
    ('vs-participant-documents', '00000000-0000-0000-0000-000000000003/other-caseload.jpg');
  RAISE EXCEPTION 'FAIL: case manager stored a photo on another caseload';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'PASS: case manager cannot store a photo on another caseload';
END $$;
DO $$ BEGIN
  INSERT INTO storage.objects (bucket_id, name) VALUES ('media', 'case-manager-gallery.jpg');
  RAISE EXCEPTION 'FAIL: case manager uploaded a gallery photo';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'PASS: case manager cannot upload a public gallery photo';
END $$;
DO $$ BEGIN
  DELETE FROM storage.objects WHERE bucket_id = 'vs-participant-documents'
    AND name = '00000000-0000-0000-0000-00000000e105/photo.jpg';
  IF FOUND THEN RAISE EXCEPTION 'FAIL: case manager deleted an existing participant photo'; END IF;
  RAISE NOTICE 'PASS: case manager cannot delete an existing participant photo';
END $$;
SELECT vs_test.login('00000000-0000-0000-0000-0000000000d1', 'test.leadership@example.test');
DO $$ BEGIN
  INSERT INTO storage.objects (bucket_id, name) VALUES ('media', 'leadership.jpg');
  RAISE EXCEPTION 'FAIL: leadership uploaded a gallery photo';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'PASS: leadership cannot upload a gallery photo';
END $$;
RESET ROLE;
SET ROLE anon;
DO $$ BEGIN
  INSERT INTO storage.objects (bucket_id, name) VALUES ('media', 'anon.jpg');
  RAISE EXCEPTION 'FAIL: anon uploaded a gallery photo';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'PASS: anonymous visitors cannot upload a gallery photo';
END $$;
RESET ROLE;
SELECT vs_test.ok(EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'vs-participant-documents'
  AND name = '00000000-0000-0000-0000-00000000e105/photo.jpg'),
  'existing participant photo is still stored');
