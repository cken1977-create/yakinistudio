-- VIZIONZ SANKOFA · OBR (Organizational Readiness) workspace
--
-- OBR is the BRSA organizational readiness domain. Vizionz Sankofa is the
-- first organization to go through it (build brief v3, section 2). VS keeps
-- the org intake and evidence checklist here; the rating itself is issued by
-- a certified evaluator in the separate readiness system and recorded here
-- as an append-only decision record with the standard version.
--
--   vs_obr_profiles   one per organization being assessed (VS itself first);
--                     the intake sections: governance, staff, policy, financial
--   vs_obr_evidence   evidence checklist (bylaws, org chart, audit, ...) with
--                     who attested, source and date; links to vs_documents
--   vs_obr_ratings    append-only rating / certification decision records
--
-- Access: executive + operator read/write; leadership_readonly read-only;
-- case managers and users without an access_role see nothing.
-- No AI scoring here: every rating row is entered by a person and must name
-- the evaluator, the standard version and the rationale.

-- ─── Profiles ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.vs_obr_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_self boolean NOT NULL DEFAULT false,          -- true = Vizionz Sankofa itself
  organization_id uuid REFERENCES public.organizations(id) ON DELETE RESTRICT,
  display_name text NOT NULL,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN (
    'not_started', 'in_progress', 'ready_for_review', 'submitted', 'rated')),
  -- Identity
  ein text,
  legal_structure text,
  year_founded integer CHECK (year_founded IS NULL OR year_founded BETWEEN 1800 AND 2100),
  primary_contact_name text,
  primary_contact_email text,
  -- Governance & leadership
  leadership_composition text,
  board_structure text,
  decision_process text,
  succession_plan text,
  -- Staff
  staff_count integer CHECK (staff_count IS NULL OR staff_count >= 0),
  turnover_rate text,
  training_programs text,
  behavioral_policy_docs text,
  -- Policy & compliance
  active_policies text,
  last_audit_date date,
  compliance_history text,
  documentation_status text,
  -- Financial
  annual_budget numeric(14,2) CHECK (annual_budget IS NULL OR annual_budget >= 0),
  funding_sources text,
  reserves text,
  sustainability_plan text,
  -- Workflow
  submitted_at timestamptz,
  submitted_by uuid,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (is_self OR organization_id IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS vs_obr_profiles_one_self ON public.vs_obr_profiles (is_self) WHERE is_self;
CREATE UNIQUE INDEX IF NOT EXISTS vs_obr_profiles_one_per_org ON public.vs_obr_profiles (organization_id)
  WHERE organization_id IS NOT NULL;

-- ─── Evidence checklist ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.vs_obr_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.vs_obr_profiles(id) ON DELETE CASCADE,
  item_key text NOT NULL CHECK (item_key IN (
    'bylaws', 'org_chart', 'audit', 'policy_manual', 'strategic_plan',
    'board_minutes', 'budget', 'other')),
  label text,
  status text NOT NULL DEFAULT 'missing' CHECK (status IN ('missing', 'on_file', 'verified')),
  document_id uuid REFERENCES public.vs_documents(id) ON DELETE SET NULL,
  source text,
  notes text,
  attested_by uuid DEFAULT auth.uid(),
  attested_by_name text,
  attested_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, item_key)
);

-- ─── Ratings (append-only decision records) ─────────────────────────────────

CREATE TABLE IF NOT EXISTS public.vs_obr_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.vs_obr_profiles(id) ON DELETE RESTRICT,
  certification_status text NOT NULL CHECK (certification_status IN (
    'not_started', 'in_review', 'certified', 'not_certified', 'expired', 'revoked')),
  rating_label text,
  overall_score numeric(6,2),
  domain_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  standard_version text NOT NULL CHECK (length(trim(standard_version)) > 0),
  ruleset_hash text,
  evaluation_run_id text,
  evaluator_name text NOT NULL CHECK (length(trim(evaluator_name)) > 0),
  reviewed_on date NOT NULL DEFAULT CURRENT_DATE,
  evidence_reviewed text,
  rationale text NOT NULL CHECK (length(trim(rationale)) > 0),
  is_override boolean NOT NULL DEFAULT false,
  override_reason text,
  expires_on date,
  recorded_by uuid DEFAULT auth.uid(),
  recorded_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (NOT is_override OR length(trim(coalesce(override_reason, ''))) > 0),
  CHECK (expires_on IS NULL OR expires_on >= reviewed_on)
);

CREATE INDEX IF NOT EXISTS vs_obr_evidence_profile_idx ON public.vs_obr_evidence (profile_id);
CREATE INDEX IF NOT EXISTS vs_obr_ratings_profile_idx ON public.vs_obr_ratings (profile_id, created_at DESC);

-- ─── updated_at ─────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS set_updated_at_vs_obr_profiles ON public.vs_obr_profiles;
CREATE TRIGGER set_updated_at_vs_obr_profiles BEFORE UPDATE ON public.vs_obr_profiles
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_vs_obr_evidence ON public.vs_obr_evidence;
CREATE TRIGGER set_updated_at_vs_obr_evidence BEFORE UPDATE ON public.vs_obr_evidence
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- ─── Ratings are append-only (corrections are a new row) ───────────────────

CREATE OR REPLACE FUNCTION vs_private.obr_rating_is_append_only()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  RAISE EXCEPTION 'vs_obr_ratings is append-only: % is not allowed. Record a new rating instead.', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END $$;

DROP TRIGGER IF EXISTS vs_obr_ratings_no_update_delete ON public.vs_obr_ratings;
CREATE TRIGGER vs_obr_ratings_no_update_delete BEFORE UPDATE OR DELETE ON public.vs_obr_ratings
  FOR EACH ROW EXECUTE FUNCTION vs_private.obr_rating_is_append_only();
DROP TRIGGER IF EXISTS vs_obr_ratings_no_truncate ON public.vs_obr_ratings;
CREATE TRIGGER vs_obr_ratings_no_truncate BEFORE TRUNCATE ON public.vs_obr_ratings
  FOR EACH STATEMENT EXECUTE FUNCTION vs_private.obr_rating_is_append_only();

-- A new rating moves the profile to 'rated'.
CREATE OR REPLACE FUNCTION vs_private.obr_mark_rated()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.vs_obr_profiles SET status = 'rated'
   WHERE id = NEW.profile_id AND status <> 'rated'
     AND NEW.certification_status NOT IN ('not_started', 'in_review');
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS vs_obr_ratings_mark_rated ON public.vs_obr_ratings;
CREATE TRIGGER vs_obr_ratings_mark_rated AFTER INSERT ON public.vs_obr_ratings
  FOR EACH ROW EXECUTE FUNCTION vs_private.obr_mark_rated();

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.vs_obr_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vs_obr_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vs_obr_ratings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.vs_obr_profiles, public.vs_obr_evidence, public.vs_obr_ratings FROM anon;
REVOKE UPDATE, DELETE, TRUNCATE ON public.vs_obr_ratings FROM authenticated;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['vs_obr_profiles', 'vs_obr_evidence', 'vs_obr_ratings']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %1$s_select ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS %1$s_insert ON public.%1$I', t);
    EXECUTE format($f$CREATE POLICY %1$s_select ON public.%1$I FOR SELECT TO authenticated
      USING (public.vs_has_role('executive', 'operator', 'leadership_readonly'))$f$, t);
    EXECUTE format($f$CREATE POLICY %1$s_insert ON public.%1$I FOR INSERT TO authenticated
      WITH CHECK (public.vs_has_role('executive', 'operator'))$f$, t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['vs_obr_profiles', 'vs_obr_evidence']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %1$s_update ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS %1$s_delete ON public.%1$I', t);
    EXECUTE format($f$CREATE POLICY %1$s_update ON public.%1$I FOR UPDATE TO authenticated
      USING (public.vs_has_role('executive', 'operator'))
      WITH CHECK (public.vs_has_role('executive', 'operator'))$f$, t);
  END LOOP;
END $$;

-- Evidence rows can be removed by executive / operator; profiles cannot be
-- deleted through the API once created (ratings point at them).
DROP POLICY IF EXISTS vs_obr_evidence_delete ON public.vs_obr_evidence;
CREATE POLICY vs_obr_evidence_delete ON public.vs_obr_evidence FOR DELETE TO authenticated
  USING (public.vs_has_role('executive', 'operator'));
REVOKE DELETE, TRUNCATE ON public.vs_obr_profiles FROM authenticated;

-- ─── Audit trail ────────────────────────────────────────────────────────────

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['vs_obr_profiles', 'vs_obr_evidence', 'vs_obr_ratings']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS vs_audit ON public.%I', t);
    EXECUTE format('CREATE TRIGGER vs_audit AFTER INSERT OR UPDATE OR DELETE ON public.%I
      FOR EACH ROW EXECUTE FUNCTION vs_private.audit_row_change()', t);
  END LOOP;
END $$;
