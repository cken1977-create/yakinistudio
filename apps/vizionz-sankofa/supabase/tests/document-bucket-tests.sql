-- Document buckets stay private and separate from the public gallery.
-- Fake ids only. No objects are deleted except the ones this test creates.
\set ON_ERROR_STOP on
SET client_min_messages = notice;

SELECT vs_test.ok(NOT (SELECT public FROM storage.buckets WHERE id = 'vs-documents'),
  'the staff document library bucket is private');
SELECT vs_test.ok(NOT (SELECT public FROM storage.buckets WHERE id = 'vs-participant-documents'),
  'the participant document bucket is private');
SELECT vs_test.ok(NOT (SELECT public FROM storage.buckets WHERE id = 'vs-intake-files'),
  'the application file bucket is private');
SELECT vs_test.ok((SELECT public FROM storage.buckets WHERE id = 'media'),
  'the gallery bucket stays public and is a different bucket');

-- An existing library object is left in place.
INSERT INTO storage.objects (bucket_id, name)
VALUES ('vs-documents', '00000000-0000-0000-0000-0000000000e1/kept-sample.pdf');

SET ROLE anon;
DO $$ BEGIN
  PERFORM 1 FROM storage.objects WHERE bucket_id = 'vs-documents';
  IF FOUND THEN RAISE EXCEPTION 'FAIL: anonymous visitor listed library documents'; END IF;
  RAISE NOTICE 'PASS: anonymous visitors cannot list the document library';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'PASS: anonymous visitors cannot list the document library';
END $$;
DO $$ BEGIN
  INSERT INTO storage.objects (bucket_id, name)
  VALUES ('vs-participant-documents', '00000000-0000-0000-0000-000000000001/lease.pdf');
  RAISE EXCEPTION 'FAIL: anonymous visitor stored a participant document';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'PASS: anonymous visitors cannot store a participant document';
END $$;
DO $$ BEGIN
  INSERT INTO storage.objects (bucket_id, name)
  VALUES ('vs-documents', '00000000-0000-0000-0000-0000000000e1/anon.pdf');
  RAISE EXCEPTION 'FAIL: anonymous visitor stored a library document';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'PASS: anonymous visitors cannot store a library document';
END $$;
RESET ROLE;

SET ROLE authenticated;
SELECT vs_test.login('00000000-0000-0000-0000-0000000000c1', 'test.cm.a@example.test');
INSERT INTO storage.objects (bucket_id, name)
VALUES ('vs-participant-documents', '00000000-0000-0000-0000-000000000001/sample-lease.pdf');
SELECT vs_test.ok(EXISTS (
  SELECT 1 FROM storage.objects
  WHERE bucket_id = 'vs-participant-documents'
    AND name = '00000000-0000-0000-0000-000000000001/sample-lease.pdf'),
  'a case manager can store a document for their own participant');
DO $$ BEGIN
  INSERT INTO storage.objects (bucket_id, name)
  VALUES ('vs-participant-documents', '00000000-0000-0000-0000-000000000003/other.pdf');
  RAISE EXCEPTION 'FAIL: case manager stored a document on another caseload';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'PASS: a case manager cannot store a document on another caseload';
END $$;
DO $$ BEGIN
  INSERT INTO storage.objects (bucket_id, name)
  VALUES ('vs-documents', '00000000-0000-0000-0000-0000000000c1/library.pdf');
  RAISE EXCEPTION 'FAIL: case manager stored a library document';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'PASS: a case manager cannot store a library document';
END $$;
SELECT vs_test.ok(NOT EXISTS (
  SELECT 1 FROM storage.objects WHERE bucket_id = 'vs-documents'),
  'a case manager cannot list the staff document library');

SELECT vs_test.login('00000000-0000-0000-0000-0000000000e1', 'test.exec@example.test');
SELECT vs_test.ok(EXISTS (
  SELECT 1 FROM storage.objects
  WHERE bucket_id = 'vs-documents' AND name = '00000000-0000-0000-0000-0000000000e1/kept-sample.pdf'),
  'an executive can still read a library file that was already stored');
INSERT INTO storage.objects (bucket_id, name)
VALUES ('vs-documents', '00000000-0000-0000-0000-0000000000e1/new-sample.pdf');
SELECT vs_test.ok(EXISTS (
  SELECT 1 FROM storage.objects
  WHERE bucket_id = 'vs-documents' AND name = '00000000-0000-0000-0000-0000000000e1/new-sample.pdf'),
  'an executive can store a new library file under their own id');
DO $$ BEGIN
  INSERT INTO storage.objects (bucket_id, name)
  VALUES ('vs-documents', '00000000-0000-0000-0000-0000000000a1/someone-else.pdf');
  RAISE EXCEPTION 'FAIL: executive wrote into another person library folder';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'PASS: a library upload cannot be written into someone else folder';
END $$;
RESET ROLE;
INSERT INTO storage.objects (bucket_id, name)
VALUES ('vs-participant-documents', 'private/old-sample.pdf');
SET ROLE authenticated;
SELECT vs_test.login('00000000-0000-0000-0000-0000000000e1', 'test.exec@example.test');
SELECT vs_test.ok(EXISTS (
  SELECT 1 FROM storage.objects
  WHERE bucket_id = 'vs-participant-documents' AND name = 'private/old-sample.pdf'),
  'an executive can still read a leftover file under the old private folder');

SELECT vs_test.login('00000000-0000-0000-0000-0000000000d1', 'test.leadership@example.test');
SELECT vs_test.ok(NOT EXISTS (
  SELECT 1 FROM storage.objects
  WHERE bucket_id = 'vs-participant-documents' AND name = 'private/old-sample.pdf'),
  'leadership cannot browse the old private document folder');

RESET ROLE;
SET ROLE anon;
INSERT INTO storage.objects (bucket_id, name)
VALUES ('vs-intake-files', '00000000-0000-0000-0000-00000000f101/sample-lease.pdf');
DO $$ BEGIN
  PERFORM 1 FROM storage.objects WHERE bucket_id = 'vs-intake-files';
  IF FOUND THEN RAISE EXCEPTION 'FAIL: anonymous visitor listed application files'; END IF;
  RAISE NOTICE 'PASS: anonymous visitors cannot list application files';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'PASS: anonymous visitors cannot list application files';
END $$;
DO $$ BEGIN
  INSERT INTO storage.objects (bucket_id, name)
  VALUES ('vs-intake-files', 'not-a-request/sample.pdf');
  RAISE EXCEPTION 'FAIL: application file stored without a request';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'PASS: an application file path must name a saved request';
END $$;
DELETE FROM storage.objects
WHERE bucket_id = 'vs-intake-files'
  AND name = '00000000-0000-0000-0000-00000000f101/sample-lease.pdf';
RESET ROLE;
SELECT vs_test.ok(EXISTS (
  SELECT 1 FROM storage.objects
  WHERE bucket_id = 'vs-documents' AND name = '00000000-0000-0000-0000-0000000000e1/kept-sample.pdf'),
  'the library file that was already stored is still there');

\echo ALL VS DOCUMENT BUCKET TESTS PASSED
