-- VIZIONZ SANKOFA · Pilot protection 2/5 · Append-only audit trail
--
-- Every INSERT / UPDATE / DELETE on participant-related tables writes a row
-- to vs_audit_log (who, what, old row, new row, when). The log is
-- append-only: UPDATE / DELETE / TRUNCATE are revoked from every API role
-- AND blocked by trigger (so even the table owner gets an error).
-- Staff can't insert directly either; rows come only from the trigger and
-- the vs_log_event() function, which stamps the real caller identity.

ALTER TABLE public.vs_audit_log
  ADD COLUMN IF NOT EXISTS actor_user_id uuid,
  ADD COLUMN IF NOT EXISTS actor_role text,
  ADD COLUMN IF NOT EXISTS details jsonb;

-- Existing CHECK allowed only INSERT/UPDATE/DELETE; widen it for app events.
ALTER TABLE public.vs_audit_log DROP CONSTRAINT IF EXISTS vs_audit_log_action_check;
ALTER TABLE public.vs_audit_log ADD CONSTRAINT vs_audit_log_action_check CHECK (action IN (
  'INSERT', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'INTELLIGENCE_QUERY', 'REVEAL_SENSITIVE', 'LOGIN'));

CREATE INDEX IF NOT EXISTS vs_audit_log_record_idx ON public.vs_audit_log (table_name, record_id);
CREATE INDEX IF NOT EXISTS vs_audit_log_occurred_idx ON public.vs_audit_log (occurred_at DESC);
CREATE INDEX IF NOT EXISTS vs_audit_log_actor_idx ON public.vs_audit_log (actor_user_id, occurred_at DESC);

-- Who is acting: the signed-in user's email from the JWT; otherwise the DB
-- role (e.g. service_role for server jobs, postgres for migrations).
CREATE OR REPLACE FUNCTION vs_private.audit_actor_email()
RETURNS text LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT coalesce(nullif(auth.jwt()->>'email', ''),
                  'system:' || coalesce(nullif(auth.jwt()->>'role', ''), session_user::text))
$$;

CREATE OR REPLACE FUNCTION vs_private.audit_row_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_before jsonb;
  v_after  jsonb;
  v_id     text;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN v_before := to_jsonb(OLD); END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') THEN v_after := to_jsonb(NEW); END IF;

  -- Never copy ciphertext of sensitive fields into the log.
  IF TG_TABLE_NAME = 'participant_sensitive' THEN
    v_before := v_before - ARRAY['medicaid_id_enc', 'ssn_enc', 'dob_enc'];
    v_after  := v_after  - ARRAY['medicaid_id_enc', 'ssn_enc', 'dob_enc'];
  END IF;

  -- Skip no-op updates and pure bookkeeping (activity timestamps).
  IF TG_OP = 'UPDATE' AND (v_before - ARRAY['updated_at', 'last_active_at'])
                        = (v_after  - ARRAY['updated_at', 'last_active_at']) THEN
    RETURN NULL;
  END IF;

  v_id := coalesce(v_after->>'id', v_before->>'id',
                   v_after->>'participant_id', v_before->>'participant_id');

  INSERT INTO public.vs_audit_log
    (actor_email, actor_user_id, actor_role, action, table_name, record_id,
     before_json, after_json)
  VALUES
    (vs_private.audit_actor_email(), auth.uid(), public.vs_current_access_role(),
     TG_OP, TG_TABLE_NAME, v_id, v_before, v_after);
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION vs_private.audit_log_is_append_only()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'vs_audit_log is append-only: % is not allowed', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END $$;

DROP TRIGGER IF EXISTS vs_audit_log_no_update_delete ON public.vs_audit_log;
CREATE TRIGGER vs_audit_log_no_update_delete
  BEFORE UPDATE OR DELETE ON public.vs_audit_log
  FOR EACH ROW EXECUTE FUNCTION vs_private.audit_log_is_append_only();
DROP TRIGGER IF EXISTS vs_audit_log_no_truncate ON public.vs_audit_log;
CREATE TRIGGER vs_audit_log_no_truncate
  BEFORE TRUNCATE ON public.vs_audit_log
  FOR EACH STATEMENT EXECUTE FUNCTION vs_private.audit_log_is_append_only();

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.vs_audit_log
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON public.vs_audit_log FROM anon;
GRANT SELECT ON public.vs_audit_log TO authenticated, service_role;

-- Readers: principals (existing policy stays) plus executives and operators.
DROP POLICY IF EXISTS vs_audit_log_exec_read ON public.vs_audit_log;
DROP POLICY IF EXISTS vs_audit_log_exec_read ON public.vs_audit_log;
CREATE POLICY vs_audit_log_exec_read ON public.vs_audit_log
  FOR SELECT TO authenticated USING (public.vs_has_role('executive', 'operator'));

-- App-level events that are not row changes: Intelligence questions,
-- record views, exports, sensitive-field reveals. The caller identity is
-- taken from the session, never from the arguments.
CREATE OR REPLACE FUNCTION public.vs_log_event(
  p_action text, p_table_name text, p_record_id text DEFAULT NULL, p_details jsonb DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF upper(p_action) NOT IN ('VIEW', 'EXPORT', 'INTELLIGENCE_QUERY', 'REVEAL_SENSITIVE', 'LOGIN') THEN
    RAISE EXCEPTION 'vs_log_event: action % not allowed', p_action;
  END IF;
  IF auth.uid() IS NULL AND coalesce(auth.jwt()->>'role', '') <> 'service_role' THEN
    RAISE EXCEPTION 'vs_log_event: must be signed in';
  END IF;
  INSERT INTO public.vs_audit_log
    (actor_email, actor_user_id, actor_role, action, table_name, record_id, details)
  VALUES
    (vs_private.audit_actor_email(), auth.uid(), public.vs_current_access_role(),
     upper(p_action), left(p_table_name, 100), left(p_record_id, 200), p_details);
END $$;
REVOKE ALL ON FUNCTION public.vs_log_event(text, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vs_log_event(text, text, text, jsonb) TO authenticated, service_role;

-- Attach the change trigger to every participant-related table.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['participants', 'case_notes', 'services_delivered',
    'participant_documents', 'participant_addresses', 'participant_family_members',
    'participant_identifiers', 'enrollments', 'assessments', 'assessment_scores',
    'intake_requests', 'historical_archive', 'vs_operators', 'staff']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS vs_audit ON public.%I', t);
    EXECUTE format('CREATE TRIGGER vs_audit AFTER INSERT OR UPDATE OR DELETE ON public.%I
      FOR EACH ROW EXECUTE FUNCTION vs_private.audit_row_change()', t);
  END LOOP;
END $$;
