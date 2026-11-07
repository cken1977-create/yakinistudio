-- VIZIONZ SANKOFA · access for the document buckets that already exist
--
-- Live inspection (bucket metadata only, 2026-11-07) found:
--   media                         public   gallery photos. Not used here.
--   vs-documents                  private  staff library. Objects stay where they are.
--   vs-participant-documents      private  case files. No objects were stored.
--   vs-intake-files               absent   created by 20261107000300, not here.
-- This file does not create a second document bucket, does not move or delete
-- objects, and does not change the gallery bucket.
--
-- The participant bucket's previous policies only allowed a folder named
-- "private", so an upload under a participant id was refused. Those policies
-- are removed. A leftover object under private/ stays readable by an executive
-- or operator. New files go under <participant_id>/, which 20261107000200 allows
-- only when the caller can see or write that participant.
--
-- Staff library reads are allowed for an executive or operator. A new upload
-- must sit under that person's own auth id. Existing objects are not rewritten.
-- Upsert is not granted here, so a new upload cannot replace an existing object.
--
-- Rollback: DROP POLICY the vs_documents_staff_* and vs_participant_docs_legacy_select
-- policies. Do not set either bucket public = true. Do not delete storage.objects.

DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NULL OR to_regclass('storage.objects') IS NULL THEN
    RAISE NOTICE 'storage schema not present; skipping document bucket access';
    RETURN;
  END IF;

  INSERT INTO storage.buckets (id, name, public, file_size_limit)
  VALUES
    ('vs-documents', 'vs-documents', false, 52428800),
    ('vs-participant-documents', 'vs-participant-documents', false, 52428800)
  ON CONFLICT (id) DO UPDATE
    SET public = false,
        file_size_limit = COALESCE(storage.buckets.file_size_limit, EXCLUDED.file_size_limit);

  -- Dashboard policies that let every signed-in user use a shared "private" folder.
  EXECUTE 'DROP POLICY IF EXISTS "Give users authenticated access to folder pytnda_0" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Give users authenticated access to folder pytnda_1" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Give users authenticated access to folder pytnda_2" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Give users authenticated access to folder pytnda_3" ON storage.objects';

  EXECUTE 'DROP POLICY IF EXISTS vs_participant_docs_legacy_select ON storage.objects';
  EXECUTE $p$CREATE POLICY vs_participant_docs_legacy_select ON storage.objects
    FOR SELECT TO authenticated
    USING (
      bucket_id = 'vs-participant-documents'
      AND name LIKE 'private/%'
      AND position('..' in name) = 0
      AND public.vs_has_role('executive', 'operator')
    )$p$;

  EXECUTE 'DROP POLICY IF EXISTS vs_documents_staff_select ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS vs_documents_staff_insert ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS vs_documents_staff_delete ON storage.objects';
  EXECUTE $p$CREATE POLICY vs_documents_staff_select ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'vs-documents' AND public.vs_has_role('executive', 'operator'))$p$;
  EXECUTE $p$CREATE POLICY vs_documents_staff_insert ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'vs-documents'
      AND public.vs_has_role('executive', 'operator')
      AND name ~ '^[0-9a-fA-F-]{36}/[^/]+$'
      AND position('..' in name) = 0
      AND split_part(name, '/', 1) = auth.uid()::text
    )$p$;
  EXECUTE $p$CREATE POLICY vs_documents_staff_delete ON storage.objects
    FOR DELETE TO authenticated
    USING (
      bucket_id = 'vs-documents'
      AND public.vs_has_role('executive', 'operator')
      AND split_part(name, '/', 1) = auth.uid()::text
    )$p$;
END $$;
