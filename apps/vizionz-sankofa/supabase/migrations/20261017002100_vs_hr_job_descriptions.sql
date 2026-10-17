-- VIZIONZ SANKOFA · Job descriptions (HR batch 1 of 3)
-- Executives/operators write job descriptions and assign them to staff or to an
-- open invite (new hire). Staff read their own and acknowledge it; the
-- acknowledgement is timestamped and tied to the version they saw. Editing a
-- description bumps its version and keeps a snapshot, so "needs re-acknowledging"
-- is just acknowledged_version < version. Idempotent; paste as one file.

-- Is this assignment row about the signed-in person (directly, or via the invite they accepted)?
CREATE OR REPLACE FUNCTION public.vs_hr_is_me(p_user uuid, p_invite uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT coalesce(auth.uid() IS NOT NULL AND (
    coalesce(p_user = auth.uid(), false)
    OR (p_invite IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.vs_invites i WHERE i.id = p_invite AND i.accepted_user_id = auth.uid()))
  ), false)
$$;
REVOKE ALL ON FUNCTION public.vs_hr_is_me(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vs_hr_is_me(uuid, uuid) TO authenticated;

CREATE TABLE IF NOT EXISTS public.vs_job_descriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 200),
  summary text,
  duties text,
  qualifications text,
  reports_to text,
  version integer NOT NULL DEFAULT 1,
  archived_at timestamptz,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vs_job_description_versions (
  job_description_id uuid NOT NULL REFERENCES public.vs_job_descriptions(id) ON DELETE CASCADE,
  version integer NOT NULL,
  title text NOT NULL,
  summary text,
  duties text,
  qualifications text,
  reports_to text,
  saved_by uuid,
  saved_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (job_description_id, version)
);

CREATE TABLE IF NOT EXISTS public.vs_jd_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_description_id uuid NOT NULL REFERENCES public.vs_job_descriptions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.vs_operators(user_id) ON DELETE CASCADE,
  invite_id uuid REFERENCES public.vs_invites(id) ON DELETE CASCADE,
  assigned_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  acknowledged_at timestamptz,
  acknowledged_version integer,
  ended_at timestamptz,
  CONSTRAINT vs_jd_assignments_who CHECK (user_id IS NOT NULL OR invite_id IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS vs_jd_assignments_one_active_user
  ON public.vs_jd_assignments (user_id) WHERE ended_at IS NULL AND user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS vs_jd_assignments_one_active_invite
  ON public.vs_jd_assignments (invite_id) WHERE ended_at IS NULL AND invite_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS vs_jd_assignments_jd ON public.vs_jd_assignments (job_description_id);

-- Version bump + snapshot.
CREATE OR REPLACE FUNCTION vs_private.hr_jd_version() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.version := 1; NEW.created_by := coalesce(auth.uid(), NEW.created_by); NEW.updated_by := NEW.created_by;
  ELSE
    NEW.created_by := OLD.created_by; NEW.created_at := OLD.created_at; NEW.updated_by := auth.uid(); NEW.updated_at := now();
    IF (NEW.title, NEW.summary, NEW.duties, NEW.qualifications, NEW.reports_to)
       IS DISTINCT FROM (OLD.title, OLD.summary, OLD.duties, OLD.qualifications, OLD.reports_to) THEN
      NEW.version := OLD.version + 1;
    ELSE
      NEW.version := OLD.version;
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION vs_private.hr_jd_snapshot() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.version <> OLD.version THEN
    INSERT INTO public.vs_job_description_versions (job_description_id, version, title, summary, duties, qualifications, reports_to, saved_by)
    VALUES (NEW.id, NEW.version, NEW.title, NEW.summary, NEW.duties, NEW.qualifications, NEW.reports_to, auth.uid())
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS vs_hr_jd_version ON public.vs_job_descriptions;
CREATE TRIGGER vs_hr_jd_version BEFORE INSERT OR UPDATE ON public.vs_job_descriptions
  FOR EACH ROW EXECUTE FUNCTION vs_private.hr_jd_version();
DROP TRIGGER IF EXISTS vs_hr_jd_snapshot ON public.vs_job_descriptions;
CREATE TRIGGER vs_hr_jd_snapshot AFTER INSERT OR UPDATE ON public.vs_job_descriptions
  FOR EACH ROW EXECUTE FUNCTION vs_private.hr_jd_snapshot();

-- Acknowledgement fields can only be set by vs_acknowledge_job_description().
CREATE OR REPLACE FUNCTION vs_private.hr_jd_assignment_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.assigned_by := coalesce(auth.uid(), NEW.assigned_by); NEW.assigned_at := now();
    NEW.acknowledged_at := NULL; NEW.acknowledged_version := NULL;
  ELSIF coalesce(current_setting('vs.hr_ack', true), '') <> 'on' THEN
    NEW.acknowledged_at := OLD.acknowledged_at; NEW.acknowledged_version := OLD.acknowledged_version;
    NEW.assigned_by := OLD.assigned_by; NEW.assigned_at := OLD.assigned_at;
    NEW.job_description_id := OLD.job_description_id;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS vs_hr_jd_assignment_guard ON public.vs_jd_assignments;
CREATE TRIGGER vs_hr_jd_assignment_guard BEFORE INSERT OR UPDATE ON public.vs_jd_assignments
  FOR EACH ROW EXECUTE FUNCTION vs_private.hr_jd_assignment_guard();

CREATE OR REPLACE FUNCTION public.vs_acknowledge_job_description(p_assignment uuid)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE a public.vs_jd_assignments; v integer; t timestamptz := now();
BEGIN
  SELECT * INTO a FROM public.vs_jd_assignments WHERE id = p_assignment;
  IF a.id IS NULL OR a.ended_at IS NOT NULL OR NOT public.vs_hr_is_me(a.user_id, a.invite_id) THEN
    RAISE EXCEPTION 'not your job description' USING ERRCODE = '42501';
  END IF;
  SELECT version INTO v FROM public.vs_job_descriptions WHERE id = a.job_description_id;
  PERFORM set_config('vs.hr_ack', 'on', true);
  UPDATE public.vs_jd_assignments SET acknowledged_at = t, acknowledged_version = v,
    user_id = coalesce(user_id, auth.uid()) WHERE id = p_assignment;
  PERFORM set_config('vs.hr_ack', 'off', true);
  RETURN t;
END $$;
REVOKE ALL ON FUNCTION public.vs_acknowledge_job_description(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vs_acknowledge_job_description(uuid) TO authenticated;

ALTER TABLE public.vs_job_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vs_job_description_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vs_jd_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vs_jd_select ON public.vs_job_descriptions;
CREATE POLICY vs_jd_select ON public.vs_job_descriptions FOR SELECT TO authenticated USING (
  public.vs_has_role('executive', 'operator')
  OR EXISTS (SELECT 1 FROM public.vs_jd_assignments a WHERE a.job_description_id = vs_job_descriptions.id AND a.ended_at IS NULL
             AND public.vs_hr_is_me(a.user_id, a.invite_id)));
DROP POLICY IF EXISTS vs_jd_write ON public.vs_job_descriptions;
CREATE POLICY vs_jd_write ON public.vs_job_descriptions FOR ALL TO authenticated
  USING (public.vs_has_role('executive', 'operator')) WITH CHECK (public.vs_has_role('executive', 'operator'));

DROP POLICY IF EXISTS vs_jd_versions_select ON public.vs_job_description_versions;
CREATE POLICY vs_jd_versions_select ON public.vs_job_description_versions FOR SELECT TO authenticated USING (
  public.vs_has_role('executive', 'operator')
  OR EXISTS (SELECT 1 FROM public.vs_jd_assignments a WHERE a.job_description_id = vs_job_description_versions.job_description_id
             AND a.ended_at IS NULL AND public.vs_hr_is_me(a.user_id, a.invite_id)));

DROP POLICY IF EXISTS vs_jd_assign_select ON public.vs_jd_assignments;
CREATE POLICY vs_jd_assign_select ON public.vs_jd_assignments FOR SELECT TO authenticated
  USING (public.vs_has_role('executive', 'operator') OR public.vs_hr_is_me(user_id, invite_id));
DROP POLICY IF EXISTS vs_jd_assign_write ON public.vs_jd_assignments;
CREATE POLICY vs_jd_assign_write ON public.vs_jd_assignments FOR ALL TO authenticated
  USING (public.vs_has_role('executive', 'operator')) WITH CHECK (public.vs_has_role('executive', 'operator'));

REVOKE ALL ON public.vs_job_description_versions FROM anon, authenticated;
GRANT SELECT ON public.vs_job_description_versions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vs_job_descriptions, public.vs_jd_assignments TO authenticated;
REVOKE ALL ON public.vs_job_descriptions, public.vs_jd_assignments FROM anon;

DROP TRIGGER IF EXISTS vs_audit ON public.vs_job_descriptions;
CREATE TRIGGER vs_audit AFTER INSERT OR UPDATE OR DELETE ON public.vs_job_descriptions
  FOR EACH ROW EXECUTE FUNCTION vs_private.audit_row_change();
DROP TRIGGER IF EXISTS vs_audit ON public.vs_jd_assignments;
CREATE TRIGGER vs_audit AFTER INSERT OR UPDATE OR DELETE ON public.vs_jd_assignments
  FOR EACH ROW EXECUTE FUNCTION vs_private.audit_row_change();
