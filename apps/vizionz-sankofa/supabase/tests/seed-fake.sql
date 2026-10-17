-- FAKE seed data for local tests only. No real people.
-- Users: one per role, plus two case managers with separate caseloads.
INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-0000000000e1', 'test.exec@example.test'),
  ('00000000-0000-0000-0000-0000000000a1', 'test.operator@example.test'),
  ('00000000-0000-0000-0000-0000000000c1', 'test.cm.a@example.test'),
  ('00000000-0000-0000-0000-0000000000c2', 'test.cm.b@example.test'),
  ('00000000-0000-0000-0000-0000000000d1', 'test.leadership@example.test'),
  ('00000000-0000-0000-0000-0000000000f1', 'test.pending@example.test');

INSERT INTO public.vs_operators (user_id, email, display_name, role, access_role) VALUES
  ('00000000-0000-0000-0000-0000000000e1', 'test.exec@example.test', 'Test Exec', 'principal', 'executive'),
  ('00000000-0000-0000-0000-0000000000a1', 'test.operator@example.test', 'Test Operator', 'operator', 'operator'),
  ('00000000-0000-0000-0000-0000000000c1', 'test.cm.a@example.test', 'Test CaseMgr A', 'employee', 'case_manager'),
  ('00000000-0000-0000-0000-0000000000c2', 'test.cm.b@example.test', 'Test CaseMgr B', 'employee', 'case_manager'),
  ('00000000-0000-0000-0000-0000000000d1', 'test.leadership@example.test', 'Test Leadership', 'employee', 'leadership_readonly'),
  ('00000000-0000-0000-0000-0000000000f1', 'test.pending@example.test', 'Test Pending', 'pending', NULL);

INSERT INTO public.staff (id, auth_user_id, first_name, last_name, email, role) VALUES
  ('00000000-0000-0000-0000-00000000aaaa', '00000000-0000-0000-0000-0000000000c1', 'Test', 'CaseMgr A', 'test.cm.a@example.test', 'case_manager'),
  ('00000000-0000-0000-0000-00000000bbbb', '00000000-0000-0000-0000-0000000000c2', 'Test', 'CaseMgr B', 'test.cm.b@example.test', 'case_manager');

INSERT INTO public.participants (id, first_name, last_name, email, phone_primary, date_of_birth, primary_case_manager_id) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Test', 'Client 001', 'client001@example.test', '505-555-0101', '1990-01-01', '00000000-0000-0000-0000-00000000aaaa'),
  ('00000000-0000-0000-0000-000000000002', 'Test', 'Client 002', 'client002@example.test', '505-555-0102', NULL, '00000000-0000-0000-0000-00000000aaaa'),
  ('00000000-0000-0000-0000-000000000003', 'Test', 'Client 003', 'client003@example.test', '505-555-0103', '1985-06-15', '00000000-0000-0000-0000-00000000bbbb');

INSERT INTO public.case_notes (participant_id, staff_id, contact_method, content) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000aaaa', 'phone', 'Fake note for Test Client 001'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-00000000bbbb', 'in_person', 'Fake note for Test Client 003');
INSERT INTO public.case_notes (participant_id, staff_id, contact_method, content, is_confidential) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000aaaa', 'phone', 'Fake CONFIDENTIAL note', true);

INSERT INTO public.participant_identifiers (participant_id, identifier_type, identifier_value) VALUES
  ('00000000-0000-0000-0000-000000000001', 'medicaid_id', 'FAKE-MCD-99887766'),
  ('00000000-0000-0000-0000-000000000001', 'SSN', '000-00-1234'),
  ('00000000-0000-0000-0000-000000000003', 'hmis_id', 'HMIS-FAKE-3');
