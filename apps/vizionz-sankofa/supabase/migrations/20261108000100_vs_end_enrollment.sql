-- End a program enrollment without deleting it and without removing the person.
-- Active enrollments (enrolled, active) still block roster removal.
-- This function only changes one enrollment, after an authorized person
-- chooses completed or withdrew. Open tasks are not closed.

CREATE OR REPLACE FUNCTION vs_private.participant_removal_blockers(p_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT coalesce(jsonb_agg(item), '[]'::jsonb)
  FROM (
    SELECT jsonb_build_object(
      'kind', 'enrollment',
      'id', e.id,
      'label', concat_ws(' · ', pr.name, c.name),
      'status', e.status::text
    ) AS item
    FROM public.enrollments e
    JOIN public.cohorts c ON c.id = e.cohort_id
    JOIN public.programs pr ON pr.id = c.program_id
    WHERE e.participant_id = p_id
      AND e.status IN ('enrolled', 'active')
    UNION ALL
    SELECT jsonb_build_object(
      'kind', 'task',
      'id', t.id,
      'label', t.title,
      'status', t.status
    )
    FROM public.vs_tasks t
    WHERE t.subject_type = 'participant'
      AND t.subject_id = p_id
      AND t.status = 'open'
  ) rows
$$;

REVOKE ALL ON FUNCTION vs_private.participant_removal_blockers(uuid) FROM PUBLIC, anon;

CREATE OR REPLACE FUNCTION public.vs_participant_removal_preview(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_row public.participants%ROWTYPE;
  v_counts jsonb;
  v_dupes jsonb;
BEGIN
  PERFORM vs_private.require_roster_admin();
  IF p_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found');
  END IF;
  SELECT * INTO v_row FROM public.participants WHERE id = p_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found');
  END IF;
  v_counts := vs_private.participant_link_counts(p_id);
  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'id', d.id,
           'name', concat_ws(' ', d.first_name, d.last_name),
           'removed', d.deleted_at IS NOT NULL)), '[]'::jsonb)
    INTO v_dupes
  FROM (
    SELECT p.id, p.first_name, p.last_name, p.deleted_at
    FROM public.participants p
    WHERE p.id <> v_row.id
      AND (
        (nullif(btrim(v_row.email), '') IS NOT NULL AND lower(p.email) = lower(btrim(v_row.email)))
        OR (vs_private.digits(v_row.phone_primary) IS NOT NULL AND (
              vs_private.digits(p.phone_primary) = vs_private.digits(v_row.phone_primary)
              OR vs_private.digits(p.phone_secondary) = vs_private.digits(v_row.phone_primary)))
        OR (lower(p.first_name) = lower(v_row.first_name) AND lower(p.last_name) = lower(v_row.last_name))
      )
    ORDER BY p.deleted_at NULLS FIRST, p.created_at
    LIMIT 5
  ) d;
  RETURN jsonb_build_object(
    'ok', true,
    'code', CASE
      WHEN v_row.deleted_at IS NOT NULL THEN 'already_removed'
      WHEN (v_counts->>'active_enrollments')::int > 0 OR (v_counts->>'open_tasks')::int > 0 THEN 'blocked'
      ELSE 'ready' END,
    'semantics', 'reversible_roster_removal',
    'participant', jsonb_build_object(
      'id', v_row.id,
      'first_name', v_row.first_name,
      'last_name', v_row.last_name,
      'preferred_name', v_row.preferred_name,
      'status', v_row.status,
      'updated_at', v_row.updated_at,
      'deleted_at', v_row.deleted_at),
    'counts', v_counts,
    'blockers', vs_private.participant_removal_blockers(p_id),
    'possible_duplicates', v_dupes
  );
END $$;

CREATE OR REPLACE FUNCTION public.vs_end_enrollment(
  p_enrollment_id uuid,
  p_outcome text,
  p_expected_updated_at timestamptz,
  p_reason text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_row public.enrollments%ROWTYPE;
  v_program text;
  v_cohort text;
  v_enrolled date;
BEGIN
  IF p_outcome IS DISTINCT FROM 'completed' AND p_outcome IS DISTINCT FROM 'withdrew' THEN
    RETURN jsonb_build_object(
      'ok', false, 'code', 'invalid',
      'error', 'Choose complete or withdraw. Nothing was changed.');
  END IF;
  IF p_enrollment_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found', 'error', 'That enrollment was not found. Nothing was changed.');
  END IF;
  SELECT * INTO v_row FROM public.enrollments WHERE id = p_enrollment_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found', 'error', 'That enrollment was not found. Nothing was changed.');
  END IF;
  IF NOT public.vs_can_write_participant(v_row.participant_id) THEN
    RAISE EXCEPTION 'You cannot change this enrollment.'
      USING ERRCODE = '42501';
  END IF;
  IF v_row.status IN ('completed', 'withdrew', 'transferred') THEN
    RETURN jsonb_build_object(
      'ok', true, 'code', 'already_ended', 'status', v_row.status::text,
      'enrollment_id', v_row.id,
      'error', 'This enrollment is already ended. It was not changed.');
  END IF;
  IF v_row.status NOT IN ('enrolled', 'active') THEN
    RETURN jsonb_build_object(
      'ok', false, 'code', 'invalid', 'status', v_row.status::text,
      'error', 'This enrollment cannot be ended from its current status. Nothing was changed.');
  END IF;
  IF p_expected_updated_at IS NULL
     OR date_trunc('milliseconds', v_row.updated_at)
        IS DISTINCT FROM date_trunc('milliseconds', p_expected_updated_at) THEN
    RETURN jsonb_build_object(
      'ok', false, 'code', 'conflict',
      'error', 'This enrollment changed. Review it again. Nothing was changed.');
  END IF;
  IF p_outcome = 'withdrew' AND nullif(btrim(coalesce(p_reason, '')), '') IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false, 'code', 'reason_required',
      'error', 'A withdrawal needs a reason. Nothing was changed.');
  END IF;
  v_enrolled := v_row.enrolled_at;
  UPDATE public.enrollments SET
    status = p_outcome::public.enrollment_status,
    completed_at = CASE WHEN p_outcome = 'completed' THEN coalesce(completed_at, CURRENT_DATE) ELSE completed_at END,
    withdrew_at = CASE WHEN p_outcome = 'withdrew' THEN coalesce(withdrew_at, CURRENT_DATE) ELSE withdrew_at END,
    withdrawal_reason = CASE WHEN p_outcome = 'withdrew' THEN left(btrim(p_reason), 500) ELSE withdrawal_reason END
  WHERE id = p_enrollment_id
  RETURNING * INTO v_row;
  SELECT pr.name, c.name INTO v_program, v_cohort
  FROM public.cohorts c
  JOIN public.programs pr ON pr.id = c.program_id
  WHERE c.id = v_row.cohort_id;
  RETURN jsonb_build_object(
    'ok', true,
    'code', 'ended',
    'status', v_row.status::text,
    'enrollment_id', v_row.id,
    'participant_id', v_row.participant_id,
    'program_name', v_program,
    'cohort_name', v_cohort,
    'enrolled_at', v_enrolled,
    'completed_at', v_row.completed_at,
    'withdrew_at', v_row.withdrew_at);
END $$;

REVOKE ALL ON FUNCTION public.vs_end_enrollment(uuid, text, timestamptz, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vs_end_enrollment(uuid, text, timestamptz, text) TO authenticated, service_role;
