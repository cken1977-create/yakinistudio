-- VIZIONZ SANKOFA · tighten write access on reference + integration tables
--
-- Before: six tables had a single "authenticated, USING (true)" FOR ALL
-- policy, so ANY signed-in account (case managers, leadership read-only,
-- even a signed-in account with no VS role yet) could create, edit and
-- delete cohorts, programs and service types, and could read and change
-- funder portal tokens and the Google connection / sheet-mapping rows.
--
-- After (uses the existing role helpers from 20261017000100):
--   cohorts, programs, service_types
--     read:  any VS staff role (executive, operator, case_manager,
--            leadership_readonly). The public site's anon read of active
--            public programs is unchanged.
--     write: executive / operator only.
--   funder_access_tokens, google_oauth_connections, google_sheet_mappings
--     read + write: executive / operator only. (The public funder portal
--     reads tokens with the service-role client, which bypasses RLS, so
--     /funder/[token] is unaffected.)
--
-- Enrollments, services, assessments etc. keep their own participant-scoped
-- policies, so case managers can still enroll and log services for their
-- own caseload.

BEGIN;

-- ─── cohorts ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS authenticated_full_access_cohorts ON public.cohorts;
DROP POLICY IF EXISTS vs_cohorts_select ON public.cohorts;
DROP POLICY IF EXISTS vs_cohorts_insert ON public.cohorts;
DROP POLICY IF EXISTS vs_cohorts_update ON public.cohorts;
DROP POLICY IF EXISTS vs_cohorts_delete ON public.cohorts;
CREATE POLICY vs_cohorts_select ON public.cohorts FOR SELECT TO authenticated
  USING (public.vs_has_role('executive', 'operator', 'case_manager', 'leadership_readonly'));
CREATE POLICY vs_cohorts_insert ON public.cohorts FOR INSERT TO authenticated
  WITH CHECK (public.vs_has_role('executive', 'operator'));
CREATE POLICY vs_cohorts_update ON public.cohorts FOR UPDATE TO authenticated
  USING (public.vs_has_role('executive', 'operator'))
  WITH CHECK (public.vs_has_role('executive', 'operator'));
CREATE POLICY vs_cohorts_delete ON public.cohorts FOR DELETE TO authenticated
  USING (public.vs_has_role('executive', 'operator'));

-- ─── programs (public_read_active_programs for anon is kept) ──────────
DROP POLICY IF EXISTS authenticated_full_access_programs ON public.programs;
DROP POLICY IF EXISTS vs_programs_select ON public.programs;
DROP POLICY IF EXISTS vs_programs_insert ON public.programs;
DROP POLICY IF EXISTS vs_programs_update ON public.programs;
DROP POLICY IF EXISTS vs_programs_delete ON public.programs;
CREATE POLICY vs_programs_select ON public.programs FOR SELECT TO authenticated
  USING (
    public.vs_has_role('executive', 'operator', 'case_manager', 'leadership_readonly')
    OR (is_active = true AND is_public = true)
  );
CREATE POLICY vs_programs_insert ON public.programs FOR INSERT TO authenticated
  WITH CHECK (public.vs_has_role('executive', 'operator'));
CREATE POLICY vs_programs_update ON public.programs FOR UPDATE TO authenticated
  USING (public.vs_has_role('executive', 'operator'))
  WITH CHECK (public.vs_has_role('executive', 'operator'));
CREATE POLICY vs_programs_delete ON public.programs FOR DELETE TO authenticated
  USING (public.vs_has_role('executive', 'operator'));

-- ─── service_types ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS authenticated_full_access_service_types ON public.service_types;
DROP POLICY IF EXISTS vs_service_types_select ON public.service_types;
DROP POLICY IF EXISTS vs_service_types_insert ON public.service_types;
DROP POLICY IF EXISTS vs_service_types_update ON public.service_types;
DROP POLICY IF EXISTS vs_service_types_delete ON public.service_types;
CREATE POLICY vs_service_types_select ON public.service_types FOR SELECT TO authenticated
  USING (public.vs_has_role('executive', 'operator', 'case_manager', 'leadership_readonly'));
CREATE POLICY vs_service_types_insert ON public.service_types FOR INSERT TO authenticated
  WITH CHECK (public.vs_has_role('executive', 'operator'));
CREATE POLICY vs_service_types_update ON public.service_types FOR UPDATE TO authenticated
  USING (public.vs_has_role('executive', 'operator'))
  WITH CHECK (public.vs_has_role('executive', 'operator'));
CREATE POLICY vs_service_types_delete ON public.service_types FOR DELETE TO authenticated
  USING (public.vs_has_role('executive', 'operator'));

-- ─── funder_access_tokens (secrets: exec/op only) ─────────────────────
DROP POLICY IF EXISTS funder_tokens_staff_access ON public.funder_access_tokens;
DROP POLICY IF EXISTS vs_funder_tokens_exec_op ON public.funder_access_tokens;
CREATE POLICY vs_funder_tokens_exec_op ON public.funder_access_tokens FOR ALL TO authenticated
  USING (public.vs_has_role('executive', 'operator'))
  WITH CHECK (public.vs_has_role('executive', 'operator'));

-- ─── google_oauth_connections (OAuth tokens: exec/op only) ────────────
DROP POLICY IF EXISTS google_oauth_staff_access ON public.google_oauth_connections;
DROP POLICY IF EXISTS vs_google_oauth_exec_op ON public.google_oauth_connections;
CREATE POLICY vs_google_oauth_exec_op ON public.google_oauth_connections FOR ALL TO authenticated
  USING (public.vs_has_role('executive', 'operator'))
  WITH CHECK (public.vs_has_role('executive', 'operator'));

-- ─── google_sheet_mappings (exec/op only) ─────────────────────────────
DROP POLICY IF EXISTS sheet_mappings_staff_access ON public.google_sheet_mappings;
DROP POLICY IF EXISTS vs_sheet_mappings_exec_op ON public.google_sheet_mappings;
CREATE POLICY vs_sheet_mappings_exec_op ON public.google_sheet_mappings FOR ALL TO authenticated
  USING (public.vs_has_role('executive', 'operator'))
  WITH CHECK (public.vs_has_role('executive', 'operator'));

COMMIT;
