-- Scratch-DB-only check for 20261029000100_drop_open_policies.sql (never run on a real project).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END $$;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
CREATE TABLE contracts (id int primary key); CREATE TABLE contract_fields (id int primary key);
CREATE TABLE contract_audit (id int primary key); CREATE TABLE auth_tokens (id int primary key);
CREATE TABLE clients (id int primary key); CREATE TABLE invoices (id int primary key); CREATE TABLE projects (id int primary key);
CREATE TABLE partnership_applications (id int primary key);
INSERT INTO contracts VALUES (1); INSERT INTO auth_tokens VALUES (1); INSERT INTO clients VALUES (1);
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['contracts','contract_fields','contract_audit','auth_tokens','clients','invoices','projects'] LOOP
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  EXECUTE format('GRANT ALL ON %I TO anon, authenticated, service_role', t); END LOOP; END $$;
-- worst case: someone re-GRANTs AND the old policies are still there (prod policies as of 2026-10-29)
CREATE POLICY "Allow all on contracts" ON contracts FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on contract_fields" ON contract_fields FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on contract_audit" ON contract_audit FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow public inserts" ON auth_tokens FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public reads" ON auth_tokens FOR SELECT TO public USING (true);
CREATE POLICY "Allow public updates" ON auth_tokens FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public reads" ON clients FOR SELECT TO public USING (true);
CREATE POLICY "Anon read invoices" ON invoices FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read projects" ON projects FOR SELECT TO anon USING (true);

\ir ../migrations/20261029000100_drop_open_policies.sql

DO $$ DECLARE n int; BEGIN
  IF (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename IN ('contracts','contract_fields','contract_audit','auth_tokens','clients','invoices','projects')) <> 0 THEN RAISE EXCEPTION 'FAIL policies remain'; END IF;
  -- even if a future GRANT slips in, RLS with no policies must still deny
  GRANT SELECT, UPDATE ON contracts, auth_tokens, clients TO anon, authenticated;
  SET LOCAL ROLE anon;
  SELECT count(*) INTO n FROM contracts; IF n<>0 THEN RAISE EXCEPTION 'FAIL anon sees contracts'; END IF;
  SELECT count(*) INTO n FROM auth_tokens; IF n<>0 THEN RAISE EXCEPTION 'FAIL anon sees tokens'; END IF;
  UPDATE auth_tokens SET id=id; GET DIAGNOSTICS n = ROW_COUNT; IF n<>0 THEN RAISE EXCEPTION 'FAIL anon updates tokens'; END IF;
  RESET ROLE; SET LOCAL ROLE authenticated;
  SELECT count(*) INTO n FROM clients; IF n<>0 THEN RAISE EXCEPTION 'FAIL authed sees clients'; END IF;
  RESET ROLE; SET LOCAL ROLE service_role;
  SELECT count(*) INTO n FROM contracts; IF n<>1 THEN RAISE EXCEPTION 'FAIL service lost contracts'; END IF;
  RESET ROLE;
  RAISE NOTICE 'ALL CHECKS PASSED';
END $$;
-- idempotency: run again
\ir ../migrations/20261029000100_drop_open_policies.sql
