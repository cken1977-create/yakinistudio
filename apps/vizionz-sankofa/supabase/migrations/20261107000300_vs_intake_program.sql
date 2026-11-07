-- VIZIONZ SANKOFA · Tie a Get Help request to the program the person applied for,
-- and store an optional supporting file in a private bucket.
--
-- There is still one public application (/get-help). This does not add
-- eligibility questions. program_id is null for a general request.
--
-- APPLY after review. Do not run this from the app deploy.
-- Until it is applied, the form still saves the request and writes
-- "Applying for: {program}" into the details the staff already read.
-- The file upload then reports that the file was not stored.
--
-- ROLLBACK (manual): drop the policies, function, table, and column.
-- Do not set vs-intake-files.public = true.

ALTER TABLE public.intake_requests
  ADD COLUMN IF NOT EXISTS program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS intake_requests_program_idx ON public.intake_requests (program_id);

CREATE TABLE IF NOT EXISTS public.intake_request_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_request_id uuid NOT NULL REFERENCES public.intake_requests(id) ON DELETE RESTRICT,
  storage_path text NOT NULL UNIQUE,
  file_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (storage_path LIKE intake_request_id::text || '/%'),
  CHECK (size_bytes IS NULL OR (size_bytes > 0 AND size_bytes <= 10485760))
);

ALTER TABLE public.intake_request_files ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.intake_request_files FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.intake_request_files TO authenticated;

DROP POLICY IF EXISTS vs_intake_files_select ON public.intake_request_files;
CREATE POLICY vs_intake_files_select ON public.intake_request_files
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.intake_requests i
      WHERE i.id = intake_request_id
        AND (
          public.vs_has_role('executive', 'operator', 'leadership_readonly')
          OR (public.vs_has_role('case_manager') AND i.assigned_to = auth.uid())
        )
    )
  );

CREATE OR REPLACE FUNCTION public.vs_attach_intake_file(
  p_intake uuid, p_path text, p_name text, p_mime text, p_size bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF p_intake IS NULL OR p_path IS NULL OR length(btrim(coalesce(p_name, ''))) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Missing file details.');
  END IF;
  IF p_path NOT LIKE p_intake::text || '/%' OR position('..' in p_path) > 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'That file path is not for this request.');
  END IF;
  IF p_size IS NULL OR p_size <= 0 OR p_size > 10485760 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'The file must be between 1 byte and 10 MB.');
  END IF;
  IF p_mime NOT IN ('image/jpeg', 'image/png', 'application/pdf') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Only a JPG, PNG, or PDF can be stored.');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.intake_requests WHERE id = p_intake) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'That request was not found.');
  END IF;
  INSERT INTO public.intake_request_files (intake_request_id, storage_path, file_name, mime_type, size_bytes)
  VALUES (p_intake, p_path, left(btrim(p_name), 200), p_mime, p_size)
  ON CONFLICT (storage_path) DO NOTHING;
  RETURN jsonb_build_object('ok', true);
END $$;

REVOKE ALL ON FUNCTION public.vs_attach_intake_file(uuid, text, text, text, bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vs_attach_intake_file(uuid, text, text, text, bigint) TO anon, authenticated;

-- Anon cannot SELECT intake_requests, so the storage insert check has to
-- confirm the request exists without exposing the row.
CREATE OR REPLACE FUNCTION public.vs_intake_upload_ok(p_name text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_id uuid;
BEGIN
  IF p_name IS NULL OR p_name !~ '^[0-9a-fA-F-]{36}/[^/]+$' OR position('..' in p_name) > 0 THEN
    RETURN false;
  END IF;
  BEGIN
    v_id := split_part(p_name, '/', 1)::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    RETURN false;
  END;
  RETURN EXISTS (SELECT 1 FROM public.intake_requests WHERE id = v_id);
END $$;
REVOKE ALL ON FUNCTION public.vs_intake_upload_ok(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vs_intake_upload_ok(text) TO anon, authenticated;

DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NULL OR to_regclass('storage.objects') IS NULL THEN
    RAISE NOTICE 'storage schema not present; skipping vs-intake-files bucket';
    RETURN;
  END IF;
  INSERT INTO storage.buckets (id, name, public, file_size_limit)
  VALUES ('vs-intake-files', 'vs-intake-files', false, 10485760)
  ON CONFLICT (id) DO UPDATE
    SET public = false,
        file_size_limit = COALESCE(storage.buckets.file_size_limit, EXCLUDED.file_size_limit);

  EXECUTE 'DROP POLICY IF EXISTS vs_intake_files_objects_select ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS vs_intake_files_objects_insert ON storage.objects';
  EXECUTE $p$CREATE POLICY vs_intake_files_objects_select ON storage.objects
    FOR SELECT TO authenticated
    USING (
      bucket_id = 'vs-intake-files'
      AND EXISTS (
        SELECT 1 FROM public.intake_request_files f
        WHERE f.storage_path = name
          AND (
            public.vs_has_role('executive', 'operator', 'leadership_readonly')
            OR EXISTS (
              SELECT 1 FROM public.intake_requests i
              WHERE i.id = f.intake_request_id
                AND public.vs_has_role('case_manager')
                AND i.assigned_to = auth.uid()
            )
          )
      )
    )$p$;
  EXECUTE $p$CREATE POLICY vs_intake_files_objects_insert ON storage.objects
    FOR INSERT TO anon, authenticated
    WITH CHECK (bucket_id = 'vs-intake-files' AND public.vs_intake_upload_ok(name))$p$;
END $$;
