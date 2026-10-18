-- VIZIONZ SANKOFA · New-hire onboarding checklist (HR batch 3 of 3)
-- One row per new hire bundles their invite, job description and handbook.
-- The checklist itself (invite accepted, job description acknowledged, handbook
-- signed) is read live from those tables, so it can't drift. Executives and
-- operators manage it; the new hire can see their own row. Idempotent.

CREATE TABLE IF NOT EXISTS public.vs_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL CHECK (length(btrim(full_name)) BETWEEN 1 AND 200),
  email text NOT NULL CHECK (email = lower(btrim(email)) AND email LIKE '%_@_%'),
  start_date date,
  invite_id uuid REFERENCES public.vs_invites(id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.vs_operators(user_id) ON DELETE SET NULL,
  job_description_id uuid REFERENCES public.vs_job_descriptions(id) ON DELETE SET NULL,
  handbook_id uuid REFERENCES public.vs_handbooks(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'complete', 'cancelled')),
  notes text,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vs_onboarding_open ON public.vs_onboarding (created_at DESC) WHERE status = 'open';

CREATE OR REPLACE FUNCTION vs_private.hr_onboarding_stamp() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := coalesce(auth.uid(), NEW.created_by);
  ELSE
    NEW.created_by := OLD.created_by; NEW.created_at := OLD.created_at;
  END IF;
  NEW.completed_at := CASE WHEN NEW.status = 'complete' THEN coalesce(NEW.completed_at, now()) ELSE NULL END;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS vs_hr_onboarding_stamp ON public.vs_onboarding;
CREATE TRIGGER vs_hr_onboarding_stamp BEFORE INSERT OR UPDATE ON public.vs_onboarding
  FOR EACH ROW EXECUTE FUNCTION vs_private.hr_onboarding_stamp();

ALTER TABLE public.vs_onboarding ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS vs_onboarding_select ON public.vs_onboarding;
CREATE POLICY vs_onboarding_select ON public.vs_onboarding FOR SELECT TO authenticated
  USING (public.vs_has_role('executive', 'operator') OR public.vs_hr_is_me(user_id, invite_id));
DROP POLICY IF EXISTS vs_onboarding_write ON public.vs_onboarding;
CREATE POLICY vs_onboarding_write ON public.vs_onboarding FOR ALL TO authenticated
  USING (public.vs_has_role('executive', 'operator')) WITH CHECK (public.vs_has_role('executive', 'operator'));
REVOKE ALL ON public.vs_onboarding FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vs_onboarding TO authenticated;

DROP TRIGGER IF EXISTS vs_audit ON public.vs_onboarding;
CREATE TRIGGER vs_audit AFTER INSERT OR UPDATE OR DELETE ON public.vs_onboarding
  FOR EACH ROW EXECUTE FUNCTION vs_private.audit_row_change();
