-- FAKE intake only. Apply stores the program and a private file.
\set ON_ERROR_STOP on
SET client_min_messages = notice;

INSERT INTO public.programs (id, slug, name, is_public, is_active) VALUES
  ('00000000-0000-0000-0000-00000000f201', 'test-housing-stability', 'Test Housing Stability', true, true);

INSERT INTO public.intake_requests (id, full_name, email, request_type, consent_given, program_id, details) VALUES
  ('00000000-0000-0000-0000-00000000f101', 'Test Applicant', 'applicant@example.test', 'housing', true,
   '00000000-0000-0000-0000-00000000f201', 'Applying for: Test Housing Stability');

SELECT vs_test.ok((SELECT program_id = '00000000-0000-0000-0000-00000000f201' FROM intake_requests WHERE id = '00000000-0000-0000-0000-00000000f101'),
  'an application can be stored against its program');

DO $$ BEGIN
  INSERT INTO public.intake_requests (id, full_name, email, request_type, consent_given) VALUES
    ('00000000-0000-0000-0000-00000000f101', 'Again', 'again@example.test', 'housing', true);
  RAISE EXCEPTION 'FAIL: duplicate request id created a second row';
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE 'PASS: repeating the same request id does not create a second row';
END $$;

SET ROLE anon;
SELECT set_config('request.jwt.claims', '{"role":"anon"}', false);
DO $$ BEGIN
  IF public.vs_intake_upload_ok('not-a-path') THEN
    RAISE EXCEPTION 'FAIL: a file path without a request was allowed';
  END IF;
  IF NOT public.vs_intake_upload_ok('00000000-0000-0000-0000-00000000f101/lease.pdf') THEN
    RAISE EXCEPTION 'FAIL: a file path for a saved request was refused';
  END IF;
  RAISE NOTICE 'PASS: application file paths are checked against the saved request';
END $$;
INSERT INTO storage.objects (bucket_id, name) VALUES
  ('vs-intake-files', '00000000-0000-0000-0000-00000000f101/lease.pdf');
DO $$ BEGIN
  IF (public.vs_attach_intake_file(
    '00000000-0000-0000-0000-00000000f101',
    '00000000-0000-0000-0000-00000000f101/lease.pdf',
    'lease.pdf', 'application/pdf', 1200)->>'ok')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'FAIL: supporting file was not recorded';
  END IF;
  RAISE NOTICE 'PASS: the supporting file is recorded on that request';
END $$;
DO $$ BEGIN
  PERFORM 1 FROM intake_request_files;
  RAISE EXCEPTION 'FAIL: anon read the file list';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'PASS: anonymous visitors cannot read stored application files';
END $$;
DO $$ BEGIN
  INSERT INTO storage.objects (bucket_id, name) VALUES ('vs-intake-files', '00000000-0000-0000-0000-00000000f999/x.pdf');
  RAISE EXCEPTION 'FAIL: file stored for a missing request';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'PASS: a file cannot be stored for a request that does not exist';
END $$;
RESET ROLE;
SELECT vs_test.ok(NOT (SELECT b.public FROM storage.buckets b WHERE b.id = 'vs-intake-files'),
  'application files bucket is private');
SELECT vs_test.ok((SELECT count(*) FROM intake_request_files WHERE intake_request_id = '00000000-0000-0000-0000-00000000f101') = 1,
  'the file row stayed with the original request');
