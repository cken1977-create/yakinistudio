-- VIZIONZ SANKOFA · Picture storage for the public gallery and participant files
--
-- Gallery photos (bucket "media") are the public website gallery. This file
-- does not change an existing bucket's public flag. It adds an insert and
-- delete policy so an executive or operator can upload and remove gallery
-- files. It does not grant anonymous uploads and it does not drop policies
-- that already exist under other names.
--
-- Participant pictures and documents (bucket vs-participant-documents) are
-- private. The app reads them with short-lived signed URLs. Paths are
-- <participant_id>/<file>. A caller can upload or read a file only when they
-- can write or see that participant. The bucket is forced private if it
-- already exists.
--
-- This does not upload, replace, or delete any live object. Upserts are not
-- granted: a failed new upload must not overwrite a file that is already there.
--
-- APPLY with the other reviewed migrations. Do not apply from the app deploy.
-- ROLLBACK (manual): DROP POLICY the vs_media_* and vs_participant_docs_* policies. Do not set
-- vs-participant-documents.public = true.

CREATE OR REPLACE FUNCTION public.vs_participant_storage_ok(p_name text, p_write boolean)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_id uuid;
BEGIN
  BEGIN
    v_id := split_part(p_name, '/', 1)::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    RETURN false;
  END;
  IF v_id IS NULL OR split_part(p_name, '/', 2) = '' THEN
    RETURN false;
  END IF;
  IF p_write THEN
    RETURN public.vs_can_write_participant(v_id);
  END IF;
  RETURN public.vs_can_see_participant(v_id);
END $$;

REVOKE ALL ON FUNCTION public.vs_participant_storage_ok(text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vs_participant_storage_ok(text, boolean) TO authenticated;

DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NULL OR to_regclass('storage.objects') IS NULL THEN
    RAISE NOTICE 'storage schema not present; skipping picture buckets';
    RETURN;
  END IF;

  INSERT INTO storage.buckets (id, name, public, file_size_limit)
  VALUES ('media', 'media', true, 52428800)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO storage.buckets (id, name, public, file_size_limit)
  VALUES ('vs-participant-documents', 'vs-participant-documents', false, 52428800)
  ON CONFLICT (id) DO UPDATE
    SET public = false,
        file_size_limit = COALESCE(storage.buckets.file_size_limit, EXCLUDED.file_size_limit);

  EXECUTE 'DROP POLICY IF EXISTS vs_media_objects_select ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS vs_media_objects_insert ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS vs_media_objects_delete ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS vs_participant_docs_select ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS vs_participant_docs_insert ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS vs_participant_docs_delete ON storage.objects';

  -- SELECT is required for an operator to remove a file they uploaded.
  -- It does not grant anonymous reads. The public gallery URL depends on
  -- the bucket's existing public flag, which this file does not change.
  EXECUTE $p$CREATE POLICY vs_media_objects_select ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'media' AND public.vs_has_role('executive', 'operator'))$p$;
  EXECUTE $p$CREATE POLICY vs_media_objects_insert ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'media' AND public.vs_has_role('executive', 'operator'))$p$;
  EXECUTE $p$CREATE POLICY vs_media_objects_delete ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'media' AND public.vs_has_role('executive', 'operator'))$p$;

  EXECUTE $p$CREATE POLICY vs_participant_docs_select ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'vs-participant-documents' AND public.vs_participant_storage_ok(name, false))$p$;
  EXECUTE $p$CREATE POLICY vs_participant_docs_insert ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'vs-participant-documents' AND public.vs_participant_storage_ok(name, true))$p$;
  EXECUTE $p$CREATE POLICY vs_participant_docs_delete ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'vs-participant-documents' AND public.vs_has_role('executive', 'operator')
           AND public.vs_participant_storage_ok(name, false))$p$;
END $$;
