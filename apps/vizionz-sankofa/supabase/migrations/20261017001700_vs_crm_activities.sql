-- VIZIONZ SANKOFA · Office CRM 4/7 · Activity timeline (calls, emails, meetings, notes)
--
-- One row per logged call / email / meeting / note on a contact,
-- organization, grant or donor. Client contacts keep going to case_notes
-- (caseload rules, already audited); the timeline screen merges both.
-- Access follows the record it is attached to (vs_crm_can_see / _write).
-- Authors may correct their own entries; executives / operators may edit or
-- delete any. Every change is in the audit log.

CREATE TABLE IF NOT EXISTS public.vs_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type text NOT NULL CHECK (subject_type IN ('contact', 'organization', 'grant', 'donor')),
  subject_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('call', 'email', 'meeting', 'note')),
  direction text CHECK (direction IN ('inbound', 'outbound')),
  summary text NOT NULL CHECK (length(trim(summary)) > 0),
  details text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  duration_minutes integer CHECK (duration_minutes IS NULL OR duration_minutes BETWEEN 0 AND 1440),
  logged_by uuid NOT NULL DEFAULT auth.uid(),
  logged_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vs_activities_subject_idx ON public.vs_activities (subject_type, subject_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS vs_activities_logged_by_idx ON public.vs_activities (logged_by, occurred_at DESC);

DROP TRIGGER IF EXISTS set_updated_at_vs_activities ON public.vs_activities;
CREATE TRIGGER set_updated_at_vs_activities BEFORE UPDATE ON public.vs_activities
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

ALTER TABLE public.vs_activities ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.vs_activities FROM anon;
DROP POLICY IF EXISTS vs_activities_select ON public.vs_activities;
DROP POLICY IF EXISTS vs_activities_insert ON public.vs_activities;
DROP POLICY IF EXISTS vs_activities_update ON public.vs_activities;
DROP POLICY IF EXISTS vs_activities_delete ON public.vs_activities;
CREATE POLICY vs_activities_select ON public.vs_activities FOR SELECT TO authenticated
  USING (public.vs_crm_can_see(subject_type, subject_id));
CREATE POLICY vs_activities_insert ON public.vs_activities FOR INSERT TO authenticated
  WITH CHECK (logged_by = auth.uid() AND public.vs_crm_can_write(subject_type, subject_id));
CREATE POLICY vs_activities_update ON public.vs_activities FOR UPDATE TO authenticated
  USING ((logged_by = auth.uid() OR public.vs_has_role('executive', 'operator'))
         AND public.vs_crm_can_write(subject_type, subject_id))
  WITH CHECK (public.vs_crm_can_write(subject_type, subject_id));
CREATE POLICY vs_activities_delete ON public.vs_activities FOR DELETE TO authenticated
  USING (public.vs_has_role('executive', 'operator'));

DROP TRIGGER IF EXISTS vs_audit ON public.vs_activities;
CREATE TRIGGER vs_audit AFTER INSERT OR UPDATE OR DELETE ON public.vs_activities
  FOR EACH ROW EXECUTE FUNCTION vs_private.audit_row_change();

-- The author is stamped by the database (name from vs_operators) and can't
-- be changed afterwards, so "logged by" in the timeline is trustworthy.
CREATE OR REPLACE FUNCTION vs_private.crm_stamp_activity_author()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NOT NULL THEN
      NEW.logged_by := auth.uid();
      NEW.logged_by_name := (SELECT coalesce(nullif(trim(o.display_name), ''), o.email)
                               FROM public.vs_operators o WHERE o.user_id = auth.uid());
    END IF;
  ELSE
    NEW.logged_by := OLD.logged_by;
    NEW.logged_by_name := OLD.logged_by_name;
    NEW.subject_type := OLD.subject_type;
    NEW.subject_id := OLD.subject_id;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS vs_activities_stamp_author ON public.vs_activities;
CREATE TRIGGER vs_activities_stamp_author BEFORE INSERT OR UPDATE ON public.vs_activities
  FOR EACH ROW EXECUTE FUNCTION vs_private.crm_stamp_activity_author();
