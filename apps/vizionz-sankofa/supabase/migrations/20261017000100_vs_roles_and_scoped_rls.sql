-- VIZIONZ SANKOFA · Pilot protection 1/5 · Roles + role/caseload-scoped RLS
--
-- Adds an access_role to vs_operators (executive, operator, case_manager,
-- leadership_readonly) and replaces the "any signed-in user sees everything"
-- policies on participant data with role- and caseload-scoped policies.
--
--   executive            read + write all participant data, sees audit log
--   operator             same as executive, plus deletes and user admin (Carly)
--   case_manager         read + write ONLY participants where
--                        participants.primary_case_manager_id = their staff row
--   leadership_readonly  read all (non-confidential) participant data, no writes
--   (no access_role)     no participant data at all (deny by default)
--
-- A case manager is linked to their caseload through staff.auth_user_id.

CREATE SCHEMA IF NOT EXISTS vs_private;
REVOKE ALL ON SCHEMA vs_private FROM PUBLIC, anon, authenticated;

ALTER TABLE public.vs_operators
  ADD COLUMN IF NOT EXISTS access_role text
    CHECK (access_role IN ('executive', 'operator', 'case_manager', 'leadership_readonly'));

COMMENT ON COLUMN public.vs_operators.access_role IS
  'Pilot data-access role. NULL = no participant data. Set by an operator.';

-- Existing principals keep full access until Clarence assigns real roles.
UPDATE public.vs_operators SET access_role = 'executive'
  WHERE role = 'principal' AND access_role IS NULL;
UPDATE public.vs_operators SET access_role = 'operator'
  WHERE role = 'operator' AND access_role IS NULL;

-- ─── Helper functions (SECURITY DEFINER so policies can read vs_operators/staff
--     without recursive RLS; search_path pinned) ───────────────────────────────

CREATE OR REPLACE FUNCTION public.vs_current_access_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT o.access_role
  FROM public.vs_operators o
  WHERE o.user_id = auth.uid()
    AND o.revoked_at IS NULL
    AND o.role <> 'pending'
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.vs_current_staff_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT s.id FROM public.staff s
  WHERE s.auth_user_id = auth.uid() AND s.is_active
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.vs_has_role(VARIADIC roles text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT coalesce(public.vs_current_access_role() = ANY (roles), false)
$$;

CREATE OR REPLACE FUNCTION public.vs_can_see_participant(p_participant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT CASE public.vs_current_access_role()
    WHEN 'executive' THEN true
    WHEN 'operator' THEN true
    WHEN 'leadership_readonly' THEN true
    WHEN 'case_manager' THEN EXISTS (
      SELECT 1 FROM public.participants p
      WHERE p.id = p_participant_id
        AND p.primary_case_manager_id IS NOT NULL
        AND p.primary_case_manager_id = public.vs_current_staff_id())
    ELSE false
  END
$$;

CREATE OR REPLACE FUNCTION public.vs_can_write_participant(p_participant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT CASE public.vs_current_access_role()
    WHEN 'executive' THEN true
    WHEN 'operator' THEN true
    WHEN 'case_manager' THEN EXISTS (
      SELECT 1 FROM public.participants p
      WHERE p.id = p_participant_id
        AND p.primary_case_manager_id IS NOT NULL
        AND p.primary_case_manager_id = public.vs_current_staff_id())
    ELSE false
  END
$$;

REVOKE ALL ON FUNCTION public.vs_current_access_role(), public.vs_current_staff_id(),
  public.vs_has_role(text[]), public.vs_can_see_participant(uuid),
  public.vs_can_write_participant(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vs_current_access_role(), public.vs_current_staff_id(),
  public.vs_has_role(text[]), public.vs_can_see_participant(uuid),
  public.vs_can_write_participant(uuid) TO authenticated, service_role;

-- ─── Drop the over-broad policies ────────────────────────────────────────────

DROP POLICY IF EXISTS authenticated_full_access_participants ON public.participants;
DROP POLICY IF EXISTS authenticated_full_access_case_notes ON public.case_notes;
DROP POLICY IF EXISTS authenticated_full_access_services_delivered ON public.services_delivered;
DROP POLICY IF EXISTS authenticated_full_access_documents ON public.participant_documents;
DROP POLICY IF EXISTS authenticated_full_access_enrollments ON public.enrollments;
DROP POLICY IF EXISTS authenticated_full_access_assessments ON public.assessments;
DROP POLICY IF EXISTS authenticated_full_access_assessment_scores ON public.assessment_scores;
DROP POLICY IF EXISTS authenticated_full_access_staff ON public.staff;
DROP POLICY IF EXISTS participant_addresses_principal_full ON public.participant_addresses;
DROP POLICY IF EXISTS participant_family_principal_full ON public.participant_family_members;
DROP POLICY IF EXISTS participant_identifiers_principal_full ON public.participant_identifiers;
DROP POLICY IF EXISTS historical_archive_principal_full ON public.historical_archive;
DROP POLICY IF EXISTS migration_log_principal_full ON public.migration_log;
DROP POLICY IF EXISTS "Authenticated operators can read intake_requests" ON public.intake_requests;
DROP POLICY IF EXISTS "Authenticated operators can update intake_requests" ON public.intake_requests;
DROP POLICY IF EXISTS "Authenticated operators can delete intake_requests" ON public.intake_requests;

-- Anonymous visitors never touch participant tables directly.
REVOKE ALL ON public.participants, public.case_notes, public.services_delivered,
  public.participant_documents, public.enrollments, public.assessments,
  public.assessment_scores, public.participant_addresses,
  public.participant_family_members, public.participant_identifiers,
  public.historical_archive, public.migration_log
  FROM anon;

-- ─── participants ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS vs_participants_select ON public.participants;
CREATE POLICY vs_participants_select ON public.participants
  FOR SELECT TO authenticated USING (
    public.vs_has_role('executive', 'operator', 'leadership_readonly')
    OR (public.vs_has_role('case_manager')
        AND primary_case_manager_id = public.vs_current_staff_id()));

-- Executives/operators may create anyone; a case manager may only create a
-- participant assigned to themselves.
DROP POLICY IF EXISTS vs_participants_insert ON public.participants;
CREATE POLICY vs_participants_insert ON public.participants
  FOR INSERT TO authenticated WITH CHECK (
    public.vs_has_role('executive', 'operator')
    OR (public.vs_has_role('case_manager')
        AND primary_case_manager_id = public.vs_current_staff_id()));

-- A case manager can edit their own participants but cannot hand them to
-- someone else's caseload (WITH CHECK keeps the row in their caseload).
DROP POLICY IF EXISTS vs_participants_update ON public.participants;
CREATE POLICY vs_participants_update ON public.participants
  FOR UPDATE TO authenticated
  USING (public.vs_can_write_participant(id))
  WITH CHECK (
    public.vs_has_role('executive', 'operator')
    OR (public.vs_has_role('case_manager')
        AND primary_case_manager_id = public.vs_current_staff_id()));

DROP POLICY IF EXISTS vs_participants_delete ON public.participants;
CREATE POLICY vs_participants_delete ON public.participants
  FOR DELETE TO authenticated USING (public.vs_has_role('executive', 'operator'));

-- ─── Child tables keyed by participant_id ───────────────────────────────────

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['services_delivered', 'participant_documents',
    'enrollments', 'assessments', 'participant_addresses',
    'participant_family_members', 'participant_identifiers']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS vs_%1$s_select ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS vs_%1$s_insert ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS vs_%1$s_update ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS vs_%1$s_delete ON public.%1$I', t);
    EXECUTE format($f$CREATE POLICY vs_%1$s_select ON public.%1$I
      FOR SELECT TO authenticated USING (public.vs_can_see_participant(participant_id))$f$, t);
    EXECUTE format($f$CREATE POLICY vs_%1$s_insert ON public.%1$I
      FOR INSERT TO authenticated WITH CHECK (public.vs_can_write_participant(participant_id))$f$, t);
    EXECUTE format($f$CREATE POLICY vs_%1$s_update ON public.%1$I
      FOR UPDATE TO authenticated USING (public.vs_can_write_participant(participant_id))
      WITH CHECK (public.vs_can_write_participant(participant_id))$f$, t);
    EXECUTE format($f$CREATE POLICY vs_%1$s_delete ON public.%1$I
      FOR DELETE TO authenticated USING (public.vs_has_role('executive', 'operator'))$f$, t);
  END LOOP;
END $$;

-- case_notes: confidential notes are hidden from read-only leadership.
DROP POLICY IF EXISTS vs_case_notes_select ON public.case_notes;
CREATE POLICY vs_case_notes_select ON public.case_notes
  FOR SELECT TO authenticated USING (
    public.vs_can_see_participant(participant_id)
    AND (NOT coalesce(is_confidential, false) OR NOT public.vs_has_role('leadership_readonly')));
DROP POLICY IF EXISTS vs_case_notes_insert ON public.case_notes;
CREATE POLICY vs_case_notes_insert ON public.case_notes
  FOR INSERT TO authenticated WITH CHECK (public.vs_can_write_participant(participant_id));
DROP POLICY IF EXISTS vs_case_notes_update ON public.case_notes;
CREATE POLICY vs_case_notes_update ON public.case_notes
  FOR UPDATE TO authenticated USING (public.vs_can_write_participant(participant_id))
  WITH CHECK (public.vs_can_write_participant(participant_id));
DROP POLICY IF EXISTS vs_case_notes_delete ON public.case_notes;
CREATE POLICY vs_case_notes_delete ON public.case_notes
  FOR DELETE TO authenticated USING (public.vs_has_role('executive', 'operator'));

-- assessment_scores: scoped through the parent assessment.
DROP POLICY IF EXISTS vs_assessment_scores_select ON public.assessment_scores;
CREATE POLICY vs_assessment_scores_select ON public.assessment_scores
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.assessments a WHERE a.id = assessment_id
      AND public.vs_can_see_participant(a.participant_id)));
DROP POLICY IF EXISTS vs_assessment_scores_write ON public.assessment_scores;
CREATE POLICY vs_assessment_scores_write ON public.assessment_scores
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.assessments a WHERE a.id = assessment_id
      AND public.vs_can_write_participant(a.participant_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.assessments a WHERE a.id = assessment_id
      AND public.vs_can_write_participant(a.participant_id)));

-- Raw import tables (whole spreadsheet rows): executives/operators only.
DROP POLICY IF EXISTS vs_historical_archive_all ON public.historical_archive;
CREATE POLICY vs_historical_archive_all ON public.historical_archive
  FOR ALL TO authenticated USING (public.vs_has_role('executive', 'operator'))
  WITH CHECK (public.vs_has_role('executive', 'operator'));
DROP POLICY IF EXISTS vs_migration_log_all ON public.migration_log;
CREATE POLICY vs_migration_log_all ON public.migration_log
  FOR ALL TO authenticated USING (public.vs_has_role('executive', 'operator'))
  WITH CHECK (public.vs_has_role('executive', 'operator'));

-- ─── intake_requests (public form still inserts; staff reads are scoped) ────

DROP POLICY IF EXISTS vs_intake_select ON public.intake_requests;
CREATE POLICY vs_intake_select ON public.intake_requests
  FOR SELECT TO authenticated USING (
    public.vs_has_role('executive', 'operator', 'leadership_readonly')
    OR (public.vs_has_role('case_manager') AND assigned_to = auth.uid()));
DROP POLICY IF EXISTS vs_intake_update ON public.intake_requests;
CREATE POLICY vs_intake_update ON public.intake_requests
  FOR UPDATE TO authenticated
  USING (public.vs_has_role('executive', 'operator')
    OR (public.vs_has_role('case_manager') AND assigned_to = auth.uid()))
  WITH CHECK (public.vs_has_role('executive', 'operator')
    OR (public.vs_has_role('case_manager') AND assigned_to = auth.uid()));
DROP POLICY IF EXISTS vs_intake_delete ON public.intake_requests;
CREATE POLICY vs_intake_delete ON public.intake_requests
  FOR DELETE TO authenticated USING (public.vs_has_role('executive', 'operator'));

-- ─── staff: everyone signed in can read the directory; only exec/operator
--     can change it (stops a case manager re-pointing staff.auth_user_id to
--     take over another caseload) ─────────────────────────────────────────

DROP POLICY IF EXISTS vs_staff_select ON public.staff;
CREATE POLICY vs_staff_select ON public.staff
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS vs_staff_write ON public.staff;
CREATE POLICY vs_staff_write ON public.staff
  FOR ALL TO authenticated USING (public.vs_has_role('executive', 'operator'))
  WITH CHECK (public.vs_has_role('executive', 'operator'));

-- The existing vs_operators write policies only recognise role = 'operator',
-- but all live accounts are 'principal', so nobody could assign roles from
-- the app. Executives and operators may now manage staff accounts.
DROP POLICY IF EXISTS vs_operators_admin_select ON public.vs_operators;
CREATE POLICY vs_operators_admin_select ON public.vs_operators
  FOR SELECT TO authenticated USING (public.vs_has_role('executive', 'operator'));
DROP POLICY IF EXISTS vs_operators_admin_insert ON public.vs_operators;
CREATE POLICY vs_operators_admin_insert ON public.vs_operators
  FOR INSERT TO authenticated WITH CHECK (public.vs_has_role('executive', 'operator'));
DROP POLICY IF EXISTS vs_operators_admin_update ON public.vs_operators;
CREATE POLICY vs_operators_admin_update ON public.vs_operators
  FOR UPDATE TO authenticated USING (public.vs_has_role('executive', 'operator'))
  WITH CHECK (public.vs_has_role('executive', 'operator'));

-- Case managers must not be able to promote themselves.
CREATE OR REPLACE FUNCTION vs_private.guard_access_role_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.access_role IS DISTINCT FROM OLD.access_role
     AND auth.uid() IS NOT NULL
     AND NOT public.vs_has_role('operator', 'executive') THEN
    RAISE EXCEPTION 'Only an operator or executive can change access_role';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS vs_operators_guard_access_role ON public.vs_operators;
CREATE TRIGGER vs_operators_guard_access_role BEFORE UPDATE ON public.vs_operators
  FOR EACH ROW EXECUTE FUNCTION vs_private.guard_access_role_change();
