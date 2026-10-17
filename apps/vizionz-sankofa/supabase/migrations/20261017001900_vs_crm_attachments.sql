-- VIZIONZ SANKOFA · Office CRM 6/7 · Files on any record
--
-- vs_attachments: files attached to a contact, organization, grant or donor.
-- (Client files keep using the participant Documents tab.) Bytes live in the
-- private storage bucket vs-crm-files under <subject_type>/<subject_id>/...;
-- downloads use short-lived signed URLs. Access follows the record
-- (vs_crm_can_see / _write), in the table AND on the storage objects.
-- Uploader or executive / operator may remove a file. Audited.

CREATE TABLE IF NOT EXISTS public.vs_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type text NOT NULL CHECK (subject_type IN ('contact', 'organization', 'grant', 'donor')),
  subject_id uuid NOT NULL,
  storage_path text NOT NULL UNIQUE,
  file_name text NOT NULL CHECK (length(trim(file_name)) > 0),
  mime_type text,
  size_bytes bigint CHECK (size_bytes IS NULL OR size_bytes >= 0),
  note text,
  uploaded_by uuid NOT NULL DEFAULT auth.uid(),
  uploaded_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (storage_path LIKE subject_type || '/' || subject_id::text || '/%')
);
CREATE INDEX IF NOT EXISTS vs_attachments_subject_idx ON public.vs_attachments (subject_type, subject_id, created_at DESC);

CREATE OR REPLACE FUNCTION vs_private.crm_stamp_uploader()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    NEW.uploaded_by := auth.uid();
    NEW.uploaded_by_name := (SELECT coalesce(nullif(trim(o.display_name), ''), o.email)
                               FROM public.vs_operators o WHERE o.user_id = auth.uid());
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS vs_attachments_stamp ON public.vs_attachments;
CREATE TRIGGER vs_attachments_stamp BEFORE INSERT ON public.vs_attachments
  FOR EACH ROW EXECUTE FUNCTION vs_private.crm_stamp_uploader();

ALTER TABLE public.vs_attachments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.vs_attachments FROM anon;
REVOKE UPDATE ON public.vs_attachments FROM authenticated;
DROP POLICY IF EXISTS vs_attachments_select ON public.vs_attachments;
DROP POLICY IF EXISTS vs_attachments_insert ON public.vs_attachments;
DROP POLICY IF EXISTS vs_attachments_delete ON public.vs_attachments;
CREATE POLICY vs_attachments_select ON public.vs_attachments FOR SELECT TO authenticated
  USING (public.vs_crm_can_see(subject_type, subject_id));
CREATE POLICY vs_attachments_insert ON public.vs_attachments FOR INSERT TO authenticated
  WITH CHECK (public.vs_crm_can_write(subject_type, subject_id));
CREATE POLICY vs_attachments_delete ON public.vs_attachments FOR DELETE TO authenticated
  USING (public.vs_crm_can_write(subject_type, subject_id)
         AND (uploaded_by = auth.uid() OR public.vs_has_role('executive', 'operator')));

DROP TRIGGER IF EXISTS vs_audit ON public.vs_attachments;
CREATE TRIGGER vs_audit AFTER INSERT OR UPDATE OR DELETE ON public.vs_attachments
  FOR EACH ROW EXECUTE FUNCTION vs_private.audit_row_change();

-- Storage object path "<type>/<uuid>/<file>" → may the caller see / write it?
CREATE OR REPLACE FUNCTION public.vs_crm_path_ok(p_name text, p_write boolean)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_type text := split_part(p_name, '/', 1);
  v_id text := split_part(p_name, '/', 2);
BEGIN
  IF v_type NOT IN ('contact', 'organization', 'grant', 'donor')
     OR v_id !~ '^[0-9a-fA-F-]{36}$' OR split_part(p_name, '/', 3) = '' THEN
    RETURN false;
  END IF;
  IF p_write THEN RETURN public.vs_crm_can_write(v_type, v_id::uuid); END IF;
  RETURN public.vs_crm_can_see(v_type, v_id::uuid);
END $$;
REVOKE ALL ON FUNCTION public.vs_crm_path_ok(text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vs_crm_path_ok(text, boolean) TO authenticated;

DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NULL OR to_regclass('storage.objects') IS NULL THEN
    RAISE NOTICE 'storage schema not present; skipping vs-crm-files bucket';
    RETURN;
  END IF;
  INSERT INTO storage.buckets (id, name, public, file_size_limit)
  VALUES ('vs-crm-files', 'vs-crm-files', false, 26214400)
  ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit;

  EXECUTE 'DROP POLICY IF EXISTS vs_crm_files_select ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS vs_crm_files_insert ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS vs_crm_files_delete ON storage.objects';
  EXECUTE $p$CREATE POLICY vs_crm_files_select ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'vs-crm-files' AND public.vs_crm_path_ok(name, false))$p$;
  EXECUTE $p$CREATE POLICY vs_crm_files_insert ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'vs-crm-files' AND public.vs_crm_path_ok(name, true))$p$;
  EXECUTE $p$CREATE POLICY vs_crm_files_delete ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'vs-crm-files' AND public.vs_crm_path_ok(name, true))$p$;
END $$;
