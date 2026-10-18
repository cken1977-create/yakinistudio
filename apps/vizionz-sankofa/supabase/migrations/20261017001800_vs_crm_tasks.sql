-- VIZIONZ SANKOFA · Office CRM 5/7 · Tasks and reminders + staff directory
--
-- vs_tasks: a to-do with an owner (assigned_to), a due date, an optional
-- reminder date and priority, optionally about one record (contact,
-- organization, grant, donor or participant). Shown on each person's My Day
-- and on the record. Reminders are in-app (My Day), nothing is emailed.
--
-- Who sees what:
--   executive / operator   all tasks; create, assign, edit, delete
--   leadership_readonly    all tasks they could see the record for; read-only
--   case_manager           tasks assigned to them or created by them, and
--                          tasks about their own caseload clients; may create
--                          tasks (about records they may write) and assign
--                          them to anyone on staff; may edit their own
-- A task about a record is only visible to people who may see that record.
--
-- vs_staff_directory(): names of active staff with a data-access role, for
-- the "assign to" picker (vs_operators itself stays locked down).

CREATE TABLE IF NOT EXISTS public.vs_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(trim(title)) > 0),
  notes text,
  due_on date,
  remind_on date,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'cancelled')),
  assigned_to uuid NOT NULL REFERENCES public.vs_operators(user_id) ON DELETE RESTRICT,
  subject_type text CHECK (subject_type IN ('contact', 'organization', 'grant', 'donor', 'participant')),
  subject_id uuid,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  completed_at timestamptz,
  completed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((subject_type IS NULL) = (subject_id IS NULL))
);
CREATE INDEX IF NOT EXISTS vs_tasks_assignee_idx ON public.vs_tasks (assigned_to, status, due_on);
CREATE INDEX IF NOT EXISTS vs_tasks_subject_idx ON public.vs_tasks (subject_type, subject_id);
CREATE INDEX IF NOT EXISTS vs_tasks_open_due_idx ON public.vs_tasks (due_on) WHERE status = 'open';

DROP TRIGGER IF EXISTS set_updated_at_vs_tasks ON public.vs_tasks;
CREATE TRIGGER set_updated_at_vs_tasks BEFORE UPDATE ON public.vs_tasks
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- Is this user an active staff member with a data-access role?
CREATE OR REPLACE FUNCTION public.vs_is_assignable(p_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.vs_operators o
                 WHERE o.user_id = p_user_id AND o.revoked_at IS NULL
                   AND o.role <> 'pending' AND o.access_role IS NOT NULL)
$$;

-- Creator is the caller; completion is stamped; creator/subject can't be moved.
CREATE OR REPLACE FUNCTION vs_private.crm_task_stamps()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NOT NULL THEN NEW.created_by := auth.uid(); END IF;
  ELSE
    NEW.created_by := OLD.created_by;
    NEW.subject_type := OLD.subject_type;
    NEW.subject_id := OLD.subject_id;
  END IF;
  IF NEW.status = 'done' AND (TG_OP = 'INSERT' OR OLD.status <> 'done') THEN
    NEW.completed_at := now();
    NEW.completed_by := auth.uid();
  ELSIF NEW.status <> 'done' THEN
    NEW.completed_at := NULL;
    NEW.completed_by := NULL;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS vs_tasks_stamps ON public.vs_tasks;
CREATE TRIGGER vs_tasks_stamps BEFORE INSERT OR UPDATE ON public.vs_tasks
  FOR EACH ROW EXECUTE FUNCTION vs_private.crm_task_stamps();

ALTER TABLE public.vs_tasks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.vs_tasks FROM anon;
DROP POLICY IF EXISTS vs_tasks_select ON public.vs_tasks;
DROP POLICY IF EXISTS vs_tasks_insert ON public.vs_tasks;
DROP POLICY IF EXISTS vs_tasks_update ON public.vs_tasks;
DROP POLICY IF EXISTS vs_tasks_delete ON public.vs_tasks;
CREATE POLICY vs_tasks_select ON public.vs_tasks FOR SELECT TO authenticated
  USING ((subject_id IS NULL OR public.vs_crm_can_see(subject_type, subject_id))
         AND (public.vs_has_role('executive', 'operator', 'leadership_readonly')
              OR (public.vs_has_role('case_manager')
                  AND (assigned_to = auth.uid() OR created_by = auth.uid() OR subject_type = 'participant'))));
CREATE POLICY vs_tasks_insert ON public.vs_tasks FOR INSERT TO authenticated
  WITH CHECK (public.vs_has_role('executive', 'operator', 'case_manager')
              AND public.vs_is_assignable(assigned_to)
              AND (subject_id IS NULL OR public.vs_crm_can_write(subject_type, subject_id)));
CREATE POLICY vs_tasks_update ON public.vs_tasks FOR UPDATE TO authenticated
  USING (public.vs_has_role('executive', 'operator')
         OR (public.vs_has_role('case_manager') AND (assigned_to = auth.uid() OR created_by = auth.uid())))
  WITH CHECK (public.vs_is_assignable(assigned_to)
              AND (subject_id IS NULL OR public.vs_crm_can_write(subject_type, subject_id)));
CREATE POLICY vs_tasks_delete ON public.vs_tasks FOR DELETE TO authenticated
  USING (public.vs_has_role('executive', 'operator')
         OR (public.vs_has_role('case_manager') AND created_by = auth.uid()));

DROP TRIGGER IF EXISTS vs_audit ON public.vs_tasks;
CREATE TRIGGER vs_audit AFTER INSERT OR UPDATE OR DELETE ON public.vs_tasks
  FOR EACH ROW EXECUTE FUNCTION vs_private.audit_row_change();

CREATE OR REPLACE FUNCTION public.vs_staff_directory()
RETURNS TABLE (user_id uuid, display_name text, access_role text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT o.user_id, coalesce(nullif(trim(o.display_name), ''), split_part(o.email, '@', 1)), o.access_role::text
  FROM public.vs_operators o
  WHERE public.vs_current_access_role() IS NOT NULL
    AND o.revoked_at IS NULL AND o.role <> 'pending' AND o.access_role IS NOT NULL
  ORDER BY 2
$$;
REVOKE ALL ON FUNCTION public.vs_staff_directory(), public.vs_is_assignable(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vs_staff_directory(), public.vs_is_assignable(uuid) TO authenticated;
