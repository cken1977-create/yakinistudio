-- Fake enrollments only. Ending an enrollment keeps the row and the person.
\set ON_ERROR_STOP on
SET client_min_messages = notice;

CREATE TEMP TABLE vs_end_case AS
SELECT id AS enroll_id, updated_at AS enroll_updated, enrolled_at AS enrolled_on
FROM public.enrollments
WHERE participant_id = '00000000-0000-0000-0000-00000000e103';
GRANT SELECT ON vs_end_case TO authenticated;

-- Still blocked, and the preview names the enrollment. The row is not ended.
SET ROLE authenticated;
SELECT vs_test.login('00000000-0000-0000-0000-0000000000a1', 'test.operator@example.test');
SELECT vs_test.ok((vs_participant_removal_preview('00000000-0000-0000-0000-00000000e103')->>'code') = 'blocked',
  'active enrollment still blocks removal');
SELECT vs_test.ok(EXISTS (
  SELECT 1
  FROM jsonb_array_elements(vs_participant_removal_preview('00000000-0000-0000-0000-00000000e103')->'blockers') b
  JOIN vs_end_case c ON b->>'id' = c.enroll_id::text
  WHERE b->>'kind' = 'enrollment'
), 'the block names the enrollment to end');
RESET ROLE;

-- Leadership and another case manager cannot end it.
SET ROLE authenticated;
SELECT vs_test.login('00000000-0000-0000-0000-0000000000d1', 'test.leadership@example.test');
DO $$ BEGIN
  PERFORM public.vs_end_enrollment(c.enroll_id, 'completed', c.enroll_updated, NULL)
  FROM vs_end_case c;
  RAISE EXCEPTION 'FAIL: leadership ended an enrollment';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'PASS: leadership cannot end an enrollment';
END $$;
SELECT vs_test.login('00000000-0000-0000-0000-0000000000c2', 'test.cm.b@example.test');
DO $$ BEGIN
  PERFORM public.vs_end_enrollment(c.enroll_id, 'withdrew', c.enroll_updated, 'no')
  FROM vs_end_case c;
  RAISE EXCEPTION 'FAIL: other case manager ended an enrollment';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'PASS: a case manager cannot end another caseload enrollment';
END $$;
RESET ROLE;
SELECT vs_test.ok((
  SELECT e.status = 'enrolled' AND e.enrolled_at = c.enrolled_on
  FROM public.enrollments e JOIN vs_end_case c ON c.enroll_id = e.id
), 'refused attempts left the enrollment enrolled');

-- Withdrawal without a reason changes nothing.
SET ROLE authenticated;
SELECT vs_test.login('00000000-0000-0000-0000-0000000000c1', 'test.cm.a@example.test');
SELECT vs_test.ok((
  SELECT vs_end_enrollment(c.enroll_id, 'withdrew', c.enroll_updated, '  ')->>'code'
  FROM vs_end_case c
) = 'reason_required', 'withdrawal without a reason is refused');
RESET ROLE;
SELECT vs_test.ok((
  SELECT e.status = 'enrolled' FROM public.enrollments e JOIN vs_end_case c ON c.enroll_id = e.id
), 'a refused withdrawal did not change the status');

-- The assigned case manager completes it. The row, date, and person remain.
SET ROLE authenticated;
SELECT vs_test.login('00000000-0000-0000-0000-0000000000c1', 'test.cm.a@example.test');
SELECT vs_test.ok((
  SELECT vs_end_enrollment(c.enroll_id, 'completed', c.enroll_updated, NULL)->>'code'
  FROM vs_end_case c
) = 'ended', 'assigned case manager completed the enrollment');
SELECT vs_test.ok((
  SELECT vs_end_enrollment(c.enroll_id, 'completed', c.enroll_updated, NULL)->>'code'
  FROM vs_end_case c
) = 'already_ended', 'completing again does not change the enrollment');
RESET ROLE;
SELECT vs_test.ok((
  SELECT e.status = 'completed' AND e.completed_at IS NOT NULL AND e.enrolled_at = c.enrolled_on
  FROM public.enrollments e JOIN vs_end_case c ON c.enroll_id = e.id
), 'the same enrollment row is now completed and the start date remains');
SELECT vs_test.ok((SELECT deleted_at IS NULL FROM public.participants WHERE id = '00000000-0000-0000-0000-00000000e103'),
  'completing an enrollment does not remove the person');
SELECT vs_test.ok(EXISTS (
  SELECT 1 FROM public.vs_audit_log a
  JOIN vs_end_case c ON a.record_id = c.enroll_id::text
  WHERE a.table_name = 'enrollments' AND a.action = 'UPDATE' AND a.after_json->>'status' = 'completed'
), 'the enrollment change is audited');

-- With the enrollment ended, an operator can remove the person. History stays.
SET ROLE authenticated;
SELECT vs_test.login('00000000-0000-0000-0000-0000000000a1', 'test.operator@example.test');
SELECT vs_test.ok((vs_participant_removal_preview('00000000-0000-0000-0000-00000000e103')->>'code') = 'ready',
  'a completed enrollment no longer blocks removal');
SELECT vs_test.ok((vs_soft_delete_participant('00000000-0000-0000-0000-00000000e103',
  (SELECT updated_at FROM public.participants WHERE id = '00000000-0000-0000-0000-00000000e103'), 'ended program')->>'code') = 'removed',
  'operator removed the person after the enrollment was completed');
RESET ROLE;
SELECT vs_test.ok((SELECT deleted_at IS NOT NULL FROM public.participants WHERE id = '00000000-0000-0000-0000-00000000e103'),
  'the person is off the active roster');
SELECT vs_test.ok((
  SELECT e.status = 'completed' FROM public.enrollments e JOIN vs_end_case c ON c.enroll_id = e.id
), 'removing the person did not delete the completed enrollment');

-- An open task still blocks after its enrollment is completed, and the task stays open.
INSERT INTO public.enrollments (id, participant_id, cohort_id, status)
VALUES ('00000000-0000-0000-0000-00000000e401', '00000000-0000-0000-0000-00000000e104',
  '00000000-0000-0000-0000-00000000e202', 'active');
SET ROLE authenticated;
SELECT vs_test.login('00000000-0000-0000-0000-0000000000a1', 'test.operator@example.test');
SELECT vs_test.ok((
  SELECT vs_end_enrollment(id, 'completed', updated_at, NULL)->>'code'
  FROM public.enrollments WHERE id = '00000000-0000-0000-0000-00000000e401'
) = 'ended', 'the tasked participant enrollment was completed');
SELECT vs_test.ok((vs_participant_removal_preview('00000000-0000-0000-0000-00000000e104')->>'code') = 'blocked',
  'an open task still blocks removal');
SELECT vs_test.ok(EXISTS (
  SELECT 1 FROM jsonb_array_elements(vs_participant_removal_preview('00000000-0000-0000-0000-00000000e104')->'blockers') b
  WHERE b->>'kind' = 'task'
), 'the block names the open task');
SELECT vs_test.ok((vs_soft_delete_participant('00000000-0000-0000-0000-00000000e104',
  (SELECT updated_at FROM public.participants WHERE id = '00000000-0000-0000-0000-00000000e104'), NULL)->>'code') = 'blocked',
  'removal stays blocked while a task is open');
RESET ROLE;
SELECT vs_test.ok((SELECT status = 'open' FROM public.vs_tasks WHERE subject_id = '00000000-0000-0000-0000-00000000e104'),
  'ending the enrollment did not close the task');
SELECT vs_test.ok((SELECT deleted_at IS NULL FROM public.participants WHERE id = '00000000-0000-0000-0000-00000000e104'),
  'the person with an open task is still on the roster');
