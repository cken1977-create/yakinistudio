-- Only an executive or operator may take a contact off the active list or put one back.
-- A case manager can still edit the fields they are allowed to edit.
-- The row, its notes, tasks, and files stay. This is not a hard delete.
--
-- Rollback:
--   DROP TRIGGER IF EXISTS vs_contacts_archive_guard ON public.vs_contacts;
--   DROP FUNCTION IF EXISTS public.vs_contacts_archive_guard();

CREATE OR REPLACE FUNCTION public.vs_contacts_archive_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.archived_at IS DISTINCT FROM OLD.archived_at
     AND NOT public.vs_has_role('executive', 'operator') THEN
    RAISE EXCEPTION 'only an executive or operator can change the active contact list'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS vs_contacts_archive_guard ON public.vs_contacts;
CREATE TRIGGER vs_contacts_archive_guard
  BEFORE UPDATE ON public.vs_contacts
  FOR EACH ROW EXECUTE FUNCTION public.vs_contacts_archive_guard();

REVOKE ALL ON FUNCTION public.vs_contacts_archive_guard() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vs_contacts_archive_guard() TO authenticated;
