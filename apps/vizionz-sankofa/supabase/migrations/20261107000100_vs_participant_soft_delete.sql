-- VIZIONZ SANKOFA · Remove a participant from the active roster (reversible)
--
-- What this is: a soft removal. deleted_at is set, the row stays, and an
-- executive or operator can restore it. It is not a permanent delete and it
-- does not erase case notes, services, enrollments, documents, family,
-- consents, or the audit log.
--
-- What this is not: a merge, a bulk cleanup, or a guess about which
-- duplicate to keep. Hard DELETE is refused (the live foreign keys would
-- CASCADE case history). Direct edits of deleted_at are refused; only
-- vs_soft_delete_participant / vs_restore_participant may change them.
--
-- Who: executive and operator only. Case managers, leadership, pending,
-- and anonymous callers are rejected inside the functions (not only in the
-- UI). Participants have no organization_id — organizations are coalition
-- and funder records, not a second tenant — so scope is role + caseload.
-- A case manager still cannot see or remove another caseload.
--
-- Blocked until someone handles them on purpose:
--   enrollments in status enrolled or active
--   open tasks about this participant
-- Those rows are left untouched and returned to the caller.
-- Other linked rows are reported and kept. Removal still succeeds.
--
-- APPLY (manual, after review — do not apply from the app deploy):
--   1. Confirm a database backup.
--   2. Run this file after the existing VS migrations.
--   3. Deploy the app. The app still loads if this file is not applied yet;
--      the remove button then explains that nothing was changed.
-- ROLLBACK is commented at the bottom of this file. Do not run it casually:
-- it drops the removal columns and restores the previous hard-delete grant.

ALTER TABLE public.participants
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid,
  ADD COLUMN IF NOT EXISTS delete_reason text;

COMMENT ON COLUMN public.participants.deleted_at IS
  'Set when an executive or operator removes the participant from the active roster. The row and its history stay. Null means on the roster. Not a permanent delete.';

CREATE INDEX IF NOT EXISTS participants_on_roster_idx
  ON public.participants (intake_date DESC, id)
  WHERE deleted_at IS NULL;

-- Executives and operators can still open a removed record (to restore it).
-- Everyone else only sees people still on the roster.
CREATE OR REPLACE FUNCTION public.vs_can_see_participant(p_participant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT CASE public.vs_current_access_role()
    WHEN 'executive' THEN true
    WHEN 'operator' THEN true
    WHEN 'leadership_readonly' THEN EXISTS (
      SELECT 1 FROM public.participants p
      WHERE p.id = p_participant_id AND p.deleted_at IS NULL)
    WHEN 'case_manager' THEN EXISTS (
      SELECT 1 FROM public.participants p
      WHERE p.id = p_participant_id
        AND p.deleted_at IS NULL
        AND p.primary_case_manager_id IS NOT NULL
        AND p.primary_case_manager_id = public.vs_current_staff_id())
    ELSE false
  END
$$;

-- No clinical edits while the person is off the roster. Restore first.
CREATE OR REPLACE FUNCTION public.vs_can_write_participant(p_participant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT CASE public.vs_current_access_role()
    WHEN 'executive' THEN EXISTS (
      SELECT 1 FROM public.participants p
      WHERE p.id = p_participant_id AND p.deleted_at IS NULL)
    WHEN 'operator' THEN EXISTS (
      SELECT 1 FROM public.participants p
      WHERE p.id = p_participant_id AND p.deleted_at IS NULL)
    WHEN 'case_manager' THEN EXISTS (
      SELECT 1 FROM public.participants p
      WHERE p.id = p_participant_id
        AND p.deleted_at IS NULL
        AND p.primary_case_manager_id IS NOT NULL
        AND p.primary_case_manager_id = public.vs_current_staff_id())
    ELSE false
  END
$$;

DROP POLICY IF EXISTS vs_participants_select ON public.participants;
CREATE POLICY vs_participants_select ON public.participants
  FOR SELECT TO authenticated USING (public.vs_can_see_participant(id));

-- Authenticated DELETE used to be allowed for executive/operator and would
-- CASCADE case history. Refuse it. The trigger below also blocks the table
-- owner and service_role, who bypass row-level security.
DROP POLICY IF EXISTS vs_participants_delete ON public.participants;
CREATE POLICY vs_participants_delete ON public.participants
  FOR DELETE TO authenticated USING (false);

REVOKE DELETE ON public.participants FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION vs_private.guard_participant_lifecycle()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Participants cannot be permanently deleted. Remove them from the active roster with vs_soft_delete_participant. Case history is kept.'
      USING ERRCODE = '42501';
  END IF;
  IF NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
     OR NEW.deleted_by IS DISTINCT FROM OLD.deleted_by
     OR NEW.delete_reason IS DISTINCT FROM OLD.delete_reason THEN
    IF coalesce(current_setting('vs.participant_lifecycle', true), '') <> 'allow' THEN
      RAISE EXCEPTION 'Participant removal and restore go through the roster actions, not a direct edit.'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS vs_participants_lifecycle ON public.participants;
CREATE TRIGGER vs_participants_lifecycle
  BEFORE UPDATE OR DELETE ON public.participants
  FOR EACH ROW EXECUTE FUNCTION vs_private.guard_participant_lifecycle();

CREATE OR REPLACE FUNCTION vs_private.participant_link_counts(p_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT jsonb_build_object(
    'case_notes', (SELECT count(*) FROM public.case_notes WHERE participant_id = p_id),
    'services', (SELECT count(*) FROM public.services_delivered WHERE participant_id = p_id),
    'enrollments', (SELECT count(*) FROM public.enrollments WHERE participant_id = p_id),
    'active_enrollments', (SELECT count(*) FROM public.enrollments
       WHERE participant_id = p_id AND status IN ('enrolled', 'active')),
    'assessments', (SELECT count(*) FROM public.assessments WHERE participant_id = p_id),
    'documents', (SELECT count(*) FROM public.participant_documents WHERE participant_id = p_id),
    'family_members', (SELECT count(*) FROM public.participant_family_members WHERE participant_id = p_id),
    'consents', (SELECT count(*) FROM public.vs_consents WHERE participant_id = p_id),
    'addresses', (SELECT count(*) FROM public.participant_addresses WHERE participant_id = p_id),
    'identifiers', (SELECT count(*) FROM public.participant_identifiers WHERE participant_id = p_id),
    'open_tasks', (SELECT count(*) FROM public.vs_tasks
       WHERE subject_type = 'participant' AND subject_id = p_id AND status = 'open')
  )
$$;

CREATE OR REPLACE FUNCTION vs_private.require_roster_admin()
RETURNS void LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF public.vs_current_access_role() IS DISTINCT FROM 'executive'
     AND public.vs_current_access_role() IS DISTINCT FROM 'operator' THEN
    RAISE EXCEPTION 'Only an executive or operator can remove or restore a participant.'
      USING ERRCODE = '42501';
  END IF;
END $$;

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
    'possible_duplicates', v_dupes
  );
END $$;

CREATE OR REPLACE FUNCTION public.vs_soft_delete_participant(
  p_id uuid, p_expected_updated_at timestamptz, p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_row public.participants%ROWTYPE;
  v_counts jsonb;
BEGIN
  PERFORM vs_private.require_roster_admin();
  IF p_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found');
  END IF;
  SELECT * INTO v_row FROM public.participants WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found');
  END IF;
  -- A repeated click or a retried request after success is not a second delete.
  IF v_row.deleted_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'ok', true, 'code', 'already_removed', 'semantics', 'reversible_roster_removal',
      'participant', jsonb_build_object(
        'id', v_row.id, 'first_name', v_row.first_name, 'last_name', v_row.last_name,
        'deleted_at', v_row.deleted_at));
  END IF;
  IF p_expected_updated_at IS NULL
     OR date_trunc('milliseconds', v_row.updated_at)
        IS DISTINCT FROM date_trunc('milliseconds', p_expected_updated_at) THEN
    RETURN jsonb_build_object(
      'ok', false, 'code', 'conflict',
      'error', 'This participant changed. Close this and review them again before removing them.');
  END IF;
  v_counts := vs_private.participant_link_counts(p_id);
  IF (v_counts->>'active_enrollments')::int > 0 OR (v_counts->>'open_tasks')::int > 0 THEN
    RETURN jsonb_build_object(
      'ok', false, 'code', 'blocked', 'counts', v_counts,
      'error', 'This participant is still enrolled in a program or has an open task. Those were not changed.');
  END IF;
  PERFORM set_config('vs.participant_lifecycle', 'allow', true);
  UPDATE public.participants SET
    deleted_at = now(),
    deleted_by = auth.uid(),
    delete_reason = nullif(left(btrim(coalesce(p_reason, '')), 500), '')
  WHERE id = p_id
  RETURNING * INTO v_row;
  RETURN jsonb_build_object(
    'ok', true, 'code', 'removed', 'semantics', 'reversible_roster_removal',
    'participant', jsonb_build_object(
      'id', v_row.id, 'first_name', v_row.first_name, 'last_name', v_row.last_name,
      'deleted_at', v_row.deleted_at),
    'counts', v_counts);
END $$;

CREATE OR REPLACE FUNCTION public.vs_restore_participant(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_row public.participants%ROWTYPE;
BEGIN
  PERFORM vs_private.require_roster_admin();
  IF p_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found');
  END IF;
  SELECT * INTO v_row FROM public.participants WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found');
  END IF;
  IF v_row.deleted_at IS NULL THEN
    RETURN jsonb_build_object(
      'ok', true, 'code', 'already_active', 'semantics', 'reversible_roster_removal',
      'participant', jsonb_build_object('id', v_row.id, 'first_name', v_row.first_name, 'last_name', v_row.last_name));
  END IF;
  PERFORM set_config('vs.participant_lifecycle', 'allow', true);
  UPDATE public.participants SET
    deleted_at = NULL, deleted_by = NULL, delete_reason = NULL
  WHERE id = p_id
  RETURNING * INTO v_row;
  RETURN jsonb_build_object(
    'ok', true, 'code', 'restored', 'semantics', 'reversible_roster_removal',
    'participant', jsonb_build_object(
      'id', v_row.id, 'first_name', v_row.first_name, 'last_name', v_row.last_name,
      'deleted_at', v_row.deleted_at));
END $$;

REVOKE ALL ON FUNCTION public.vs_participant_removal_preview(uuid),
  public.vs_soft_delete_participant(uuid, timestamptz, text),
  public.vs_restore_participant(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vs_participant_removal_preview(uuid),
  public.vs_soft_delete_participant(uuid, timestamptz, text),
  public.vs_restore_participant(uuid) TO authenticated;

-- Roster counts and search skip people who were removed.
CREATE OR REPLACE VIEW public.vs_stage_summary WITH (security_invoker = true) AS
SELECT current_stage,
       count(*)::int AS participants,
       round(avg(extract(epoch FROM now() - stage_changed_at) / 86400)::numeric, 1) AS avg_days_in_stage,
       count(*) FILTER (WHERE now() - stage_changed_at > interval '30 days')::int AS stalled_over_30_days,
       count(*) FILTER (WHERE is_returning)::int AS returning_clients
FROM public.participants
WHERE deleted_at IS NULL
GROUP BY current_stage;
REVOKE ALL ON public.vs_stage_summary FROM anon;
GRANT SELECT ON public.vs_stage_summary TO authenticated;

CREATE OR REPLACE FUNCTION public.vs_global_search(p_query text, p_limit integer DEFAULT 8)
RETURNS TABLE (kind text, id uuid, title text, subtitle text)
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  q text := '%' || replace(replace(replace(trim(coalesce(p_query, '')), '\', '\\'), '%', '\%'), '_', '\_') || '%';
  n integer := least(greatest(coalesce(p_limit, 8), 1), 25);
BEGIN
  IF length(trim(coalesce(p_query, ''))) < 2 OR public.vs_current_access_role() IS NULL THEN
    RETURN;
  END IF;
  RETURN QUERY (SELECT 'contact'::text, c.id, c.display_name, concat_ws(' · ', c.title, c.kind)
    FROM public.vs_contacts c
    WHERE c.archived_at IS NULL AND (c.display_name ILIKE q OR c.email ILIKE q OR c.title ILIKE q)
    ORDER BY c.display_name LIMIT n);
  RETURN QUERY (SELECT 'organization'::text, o.id, o.name, concat_ws(' · ', o.relationship_kind::text, o.type::text)
    FROM public.organizations o
    WHERE o.name ILIKE q OR o.short_name ILIKE q OR o.primary_contact_name ILIKE q
    ORDER BY o.name LIMIT n);
  RETURN QUERY (SELECT 'participant'::text, p.id,
      concat_ws(' ', coalesce(nullif(p.preferred_name, ''), p.first_name), p.last_name), p.status::text
    FROM public.participants p
    WHERE p.deleted_at IS NULL
      AND (p.first_name ILIKE q OR p.last_name ILIKE q OR p.preferred_name ILIKE q
       OR concat_ws(' ', p.first_name, p.last_name) ILIKE q)
    ORDER BY p.last_name, p.first_name LIMIT n);
  RETURN QUERY (SELECT 'donor'::text, d.id, d.display_name, d.donor_type::text
    FROM public.donors d
    WHERE d.display_name ILIKE q OR d.email ILIKE q
    ORDER BY d.display_name LIMIT n);
  RETURN QUERY (SELECT 'grant'::text, g.id, g.name, g.status::text
    FROM public.grants g
    WHERE g.name ILIKE q OR g.external_grant_id ILIKE q
    ORDER BY g.name LIMIT n);
  RETURN QUERY (SELECT 'task'::text, t.id, t.title,
      concat_ws(' · ', t.status, CASE WHEN t.due_on IS NOT NULL THEN 'due ' || t.due_on::text END)
    FROM public.vs_tasks t
    WHERE t.title ILIKE q OR t.notes ILIKE q
    ORDER BY (t.status = 'open') DESC, t.due_on NULLS LAST LIMIT n);
  RETURN QUERY (SELECT 'document'::text, v.id, v.title, v.category::text
    FROM public.vs_documents v
    WHERE v.title ILIKE q OR v.file_name ILIKE q
    ORDER BY v.uploaded_at DESC LIMIT n);
END $$;

-- A removed duplicate should not keep flagging new Get Help intakes.
CREATE OR REPLACE FUNCTION vs_private.intake_flag_returning()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_pid uuid;
BEGIN
  SELECT p.id INTO v_pid FROM public.participants p
  WHERE p.deleted_at IS NULL
    AND ((NEW.email IS NOT NULL AND lower(p.email) = lower(btrim(NEW.email)))
     OR (vs_private.digits(NEW.phone) IS NOT NULL AND length(vs_private.digits(NEW.phone)) >= 7
         AND (vs_private.digits(p.phone_primary) = vs_private.digits(NEW.phone)
              OR vs_private.digits(p.phone_secondary) = vs_private.digits(NEW.phone))))
  ORDER BY p.created_at LIMIT 1;

  IF v_pid IS NULL THEN
    SELECT i.matched_participant_id INTO v_pid FROM public.intake_requests i
    WHERE i.id <> NEW.id AND (lower(i.email) = lower(btrim(NEW.email))
      OR (vs_private.digits(NEW.phone) IS NOT NULL AND vs_private.digits(i.phone) = vs_private.digits(NEW.phone)))
    LIMIT 1;
    IF FOUND THEN NEW.is_returning := true; END IF;
  END IF;

  IF v_pid IS NOT NULL THEN
    NEW.is_returning := true;
    NEW.matched_participant_id := v_pid;
    UPDATE public.participants SET is_returning = true,
      returning_flagged_at = coalesce(returning_flagged_at, now())
      WHERE id = v_pid AND deleted_at IS NULL;
  END IF;
  RETURN NEW;
END $$;

-- ROLLBACK (do not run as part of this migration):
-- DROP FUNCTION IF EXISTS public.vs_soft_delete_participant(uuid, timestamptz, text);
-- DROP FUNCTION IF EXISTS public.vs_restore_participant(uuid);
-- DROP FUNCTION IF EXISTS public.vs_participant_removal_preview(uuid);
-- DROP TRIGGER IF EXISTS vs_participants_lifecycle ON public.participants;
-- DROP FUNCTION IF EXISTS vs_private.guard_participant_lifecycle();
-- DROP FUNCTION IF EXISTS vs_private.participant_link_counts(uuid);
-- DROP FUNCTION IF EXISTS vs_private.require_roster_admin();
-- Recreate vs_can_see_participant / vs_can_write_participant / vs_participants_select
--   and the DELETE policy from 20261017000100, then:
-- GRANT DELETE ON public.participants TO authenticated, service_role;
-- ALTER TABLE public.participants DROP COLUMN IF EXISTS delete_reason, DROP COLUMN IF EXISTS deleted_by, DROP COLUMN IF EXISTS deleted_at;
-- Re-apply 20261017000500 and 20261017002000 if the stage summary, search, or returning-client functions must match those files again.
-- Restoring the hard-delete grant brings back ON DELETE CASCADE for case history. Do that only on purpose.
