-- VIZIONZ SANKOFA · Office CRM 2/7 · Role rules for existing CRM tables
--
-- Before: organizations and grants were readable AND writable by any signed-in
-- user; donors and donor_gifts by anyone with a vs_operators row (so case
-- managers and read-only leadership could read and edit donor records).
-- After:
--   donors, donor_gifts, grants  executive + operator write; leadership read;
--                                case managers nothing (no donors, no finances)
--   organizations                executive + operator write; leadership reads
--                                all; case managers read partner / both /
--                                agency organizations only (not funder-only)
-- All four tables are added to the append-only audit trail.

DROP POLICY IF EXISTS authenticated_full_access_organizations ON public.organizations;
DROP POLICY IF EXISTS grants_staff_access ON public.grants;
DROP POLICY IF EXISTS donors_operator_read ON public.donors;
DROP POLICY IF EXISTS donors_operator_write ON public.donors;
DROP POLICY IF EXISTS donor_gifts_operator_read ON public.donor_gifts;
DROP POLICY IF EXISTS donor_gifts_operator_write ON public.donor_gifts;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donor_gifts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.organizations, public.grants, public.donors, public.donor_gifts FROM anon;

DROP POLICY IF EXISTS vs_organizations_select ON public.organizations;
CREATE POLICY vs_organizations_select ON public.organizations FOR SELECT TO authenticated
  USING (public.vs_has_role('executive', 'operator', 'leadership_readonly')
         OR (public.vs_has_role('case_manager') AND relationship_kind::text IN ('partner', 'both', 'agency')));

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['grants', 'donors', 'donor_gifts']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS vs_%1$s_select ON public.%1$I', t);
    EXECUTE format($f$CREATE POLICY vs_%1$s_select ON public.%1$I FOR SELECT TO authenticated
      USING (public.vs_has_role('executive', 'operator', 'leadership_readonly'))$f$, t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['organizations', 'grants', 'donors', 'donor_gifts']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS vs_%1$s_insert ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS vs_%1$s_update ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS vs_%1$s_delete ON public.%1$I', t);
    EXECUTE format($f$CREATE POLICY vs_%1$s_insert ON public.%1$I FOR INSERT TO authenticated
      WITH CHECK (public.vs_has_role('executive', 'operator'))$f$, t);
    EXECUTE format($f$CREATE POLICY vs_%1$s_update ON public.%1$I FOR UPDATE TO authenticated
      USING (public.vs_has_role('executive', 'operator')) WITH CHECK (public.vs_has_role('executive', 'operator'))$f$, t);
    EXECUTE format($f$CREATE POLICY vs_%1$s_delete ON public.%1$I FOR DELETE TO authenticated
      USING (public.vs_has_role('executive', 'operator'))$f$, t);
    EXECUTE format('DROP TRIGGER IF EXISTS vs_audit ON public.%I', t);
    EXECUTE format('CREATE TRIGGER vs_audit AFTER INSERT OR UPDATE OR DELETE ON public.%I
      FOR EACH ROW EXECUTE FUNCTION vs_private.audit_row_change()', t);
  END LOOP;
END $$;
