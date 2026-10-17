-- VIZIONZ SANKOFA · OBR (Organizational Behavioral Readiness)
--
-- OBR is VS's OWN onboarding / intake that measures Vizionz Sankofa's
-- organizational behavioral readiness for Yakini (BRSA standard). VS staff
-- complete the intake and upload the evidence documents here; Clarence
-- monitors progress from his side through vs_obr_monitor_summary() (below).
-- The rating itself is issued by a certified evaluator and recorded here as
-- an append-only decision record with the standard version.
--
--   vs_obr_profiles        the intake (VS's own profile, is_self = true):
--                          governance, staff, policy, financial
--   vs_obr_evidence        evidence checklist (bylaws, org chart, audit, ...)
--                          with who attested and when
--   vs_obr_evidence_files  files uploaded for a checklist item; the bytes
--                          live in the private storage bucket vs-obr-evidence
--   vs_obr_ratings         append-only evaluator decision records
--
-- Access: executive + operator read/write (and upload/download files);
-- leadership_readonly reads the records but cannot download files; case
-- managers and users without an access_role see nothing.
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

-- ─── Uploaded evidence files (metadata; bytes are in storage) ──────────────

CREATE TABLE IF NOT EXISTS public.vs_obr_evidence_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.vs_obr_profiles(id) ON DELETE RESTRICT,
  evidence_id uuid NOT NULL REFERENCES public.vs_obr_evidence(id) ON DELETE CASCADE,
  storage_path text NOT NULL UNIQUE,
  file_name text NOT NULL CHECK (length(trim(file_name)) > 0),
  mime_type text,
  size_bytes bigint CHECK (size_bytes IS NULL OR size_bytes >= 0),
  uploaded_by uuid DEFAULT auth.uid(),
  uploaded_by_name text,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  -- files sit under <profile_id>/ in the bucket
  CHECK (storage_path LIKE profile_id::text || '/%')
);

CREATE INDEX IF NOT EXISTS vs_obr_evidence_files_evidence_idx ON public.vs_obr_evidence_files (evidence_id);

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
ALTER TABLE public.vs_obr_evidence_files ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.vs_obr_profiles, public.vs_obr_evidence, public.vs_obr_ratings,
  public.vs_obr_evidence_files FROM anon;
REVOKE UPDATE, TRUNCATE ON public.vs_obr_evidence_files FROM authenticated;
REVOKE UPDATE, DELETE, TRUNCATE ON public.vs_obr_ratings FROM authenticated;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['vs_obr_profiles', 'vs_obr_evidence', 'vs_obr_ratings', 'vs_obr_evidence_files']
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

-- A wrongly uploaded file can be removed by executive / operator (audited).
DROP POLICY IF EXISTS vs_obr_evidence_files_delete ON public.vs_obr_evidence_files;
CREATE POLICY vs_obr_evidence_files_delete ON public.vs_obr_evidence_files FOR DELETE TO authenticated
  USING (public.vs_has_role('executive', 'operator'));

-- ─── Private storage bucket for the evidence files ──────────────────────────
-- Same pattern as vs-documents: private bucket, access through RLS on
-- storage.objects, downloads by short-lived signed URL. Executive and
-- operator only (upload, read, delete). Skipped where storage is absent.

DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NULL OR to_regclass('storage.objects') IS NULL THEN
    RAISE NOTICE 'storage schema not present; skipping vs-obr-evidence bucket';
    RETURN;
  END IF;
  INSERT INTO storage.buckets (id, name, public, file_size_limit)
  VALUES ('vs-obr-evidence', 'vs-obr-evidence', false, 26214400)
  ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit;

  EXECUTE 'DROP POLICY IF EXISTS vs_obr_evidence_objects_select ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS vs_obr_evidence_objects_insert ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS vs_obr_evidence_objects_delete ON storage.objects';
  EXECUTE $p$CREATE POLICY vs_obr_evidence_objects_select ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'vs-obr-evidence' AND public.vs_has_role('executive', 'operator'))$p$;
  EXECUTE $p$CREATE POLICY vs_obr_evidence_objects_insert ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'vs-obr-evidence' AND public.vs_has_role('executive', 'operator'))$p$;
  EXECUTE $p$CREATE POLICY vs_obr_evidence_objects_delete ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'vs-obr-evidence' AND public.vs_has_role('executive', 'operator'))$p$;
END $$;

-- ─── Audit trail ────────────────────────────────────────────────────────────

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['vs_obr_profiles', 'vs_obr_evidence', 'vs_obr_ratings', 'vs_obr_evidence_files']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS vs_audit ON public.%I', t);
    EXECUTE format('CREATE TRIGGER vs_audit AFTER INSERT OR UPDATE OR DELETE ON public.%I
      FOR EACH ROW EXECUTE FUNCTION vs_private.audit_row_change()', t);
  END LOOP;
END $$;

-- ─── Monitoring export (read-only, for Clarence's side) ────────────────────
-- One JSON document: OBR status, checklist completion %, uploaded-evidence
-- metadata (file name, type, size, who/when) and the latest evaluator
-- decision. No participant data, no free-text notes, no storage paths and
-- no file contents. Callable by service_role only.

CREATE OR REPLACE FUNCTION public.vs_obr_monitor_summary()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  WITH items(item_key, label, ord) AS (
    VALUES ('bylaws', 'Bylaws or operating agreement', 1),
           ('org_chart', 'Organizational chart', 2),
           ('audit', 'Most recent audit', 3),
           ('policy_manual', 'Policy manual', 4),
           ('strategic_plan', 'Strategic plan', 5),
           ('board_minutes', 'Board minutes', 6),
           ('budget', 'Operating budget', 7)
  ),
  p AS (SELECT id, status, submitted_at, created_at, updated_at
          FROM public.vs_obr_profiles WHERE is_self LIMIT 1),
  ev AS (SELECT e.id, e.item_key, e.label, e.status, e.attested_by_name, e.attested_at
           FROM public.vs_obr_evidence e JOIN p ON e.profile_id = p.id),
  files AS (
    SELECT f.evidence_id,
           jsonb_agg(jsonb_build_object(
             'file_name', f.file_name, 'mime_type', f.mime_type, 'size_bytes', f.size_bytes,
             'uploaded_by_name', f.uploaded_by_name, 'uploaded_at', f.uploaded_at)
             ORDER BY f.uploaded_at) AS list,
           count(*) AS n
      FROM public.vs_obr_evidence_files f JOIN p ON f.profile_id = p.id
     GROUP BY f.evidence_id
  ),
  done AS (
    SELECT count(*) FILTER (WHERE ev.status IN ('on_file', 'verified')) AS complete,
           count(*) FILTER (WHERE ev.status = 'verified') AS verified,
           (SELECT count(*) FROM items) AS total
      FROM items i LEFT JOIN ev ON ev.item_key = i.item_key
  ),
  r AS (SELECT certification_status, rating_label, overall_score, domain_scores, standard_version,
               evaluator_name, reviewed_on, expires_on, created_at
          FROM public.vs_obr_ratings WHERE profile_id = (SELECT id FROM p)
         ORDER BY created_at DESC LIMIT 1)
  SELECT jsonb_build_object(
    'schema_version', 1,
    'generated_at', now(),
    'organization', 'Vizionz Sankofa',
    'profile', (SELECT jsonb_build_object('id', id, 'status', status, 'submitted_at', submitted_at,
                                          'started_at', created_at, 'updated_at', updated_at) FROM p),
    'checklist', (SELECT jsonb_build_object(
                    'total', total, 'complete', complete, 'verified', verified,
                    'percent_complete', round(100.0 * complete / nullif(total, 0), 1)) FROM done),
    'items', (SELECT jsonb_agg(jsonb_build_object(
                'item_key', i.item_key, 'label', i.label,
                'status', coalesce(ev.status, 'missing'),
                'attested_by_name', ev.attested_by_name, 'attested_at', ev.attested_at,
                'file_count', coalesce(files.n, 0),
                'files', coalesce(files.list, '[]'::jsonb)) ORDER BY i.ord)
                FROM items i LEFT JOIN ev ON ev.item_key = i.item_key
                LEFT JOIN files ON files.evidence_id = ev.id),
    'other_evidence', (SELECT coalesce(jsonb_agg(jsonb_build_object(
                'label', ev.label, 'status', ev.status, 'attested_at', ev.attested_at,
                'file_count', coalesce(files.n, 0), 'files', coalesce(files.list, '[]'::jsonb))), '[]'::jsonb)
                FROM ev LEFT JOIN files ON files.evidence_id = ev.id WHERE ev.item_key = 'other'),
    'latest_decision', (SELECT to_jsonb(r) FROM r)
  )
$$;

REVOKE ALL ON FUNCTION public.vs_obr_monitor_summary() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.vs_obr_monitor_summary() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.vs_obr_monitor_summary() TO service_role;
