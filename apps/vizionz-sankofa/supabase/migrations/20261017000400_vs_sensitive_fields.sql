-- VIZIONZ SANKOFA · Pilot protection 4/5 · Encrypted sensitive fields
--
-- Medicaid ID, SSN and date of birth live ONLY in participant_sensitive,
-- encrypted with pgcrypto (AES-256, pgp_sym_encrypt). The key is a Supabase
-- Vault secret named 'vs_pii_key', created here if missing, so it never
-- appears in code, env vars or git.
--
-- Nobody can SELECT the table directly. Reads go through
-- vs_get_sensitive(), which returns masked values unless the caller's role
-- permits the field AND they ask to reveal it; every reveal is logged.
--   SSN:              executive, operator
--   Medicaid ID, DOB: executive, operator, case_manager (own caseload)
--   leadership_readonly: always masked
--
-- Any write of participants.date_of_birth, or of an SSN / Medicaid ID into
-- participant_identifiers, is moved into the encrypted table automatically
-- (so the Google Sheets import and existing forms stay safe).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'vs_pii_key') THEN
    PERFORM vault.create_secret(encode(extensions.gen_random_bytes(32), 'base64'), 'vs_pii_key');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.participant_sensitive (
  participant_id uuid PRIMARY KEY
    REFERENCES public.participants(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
  medicaid_id_enc bytea,
  medicaid_id_last4 text,
  ssn_enc bytea,
  ssn_last4 text,
  dob_enc bytea,
  dob_year smallint,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid DEFAULT auth.uid()
);

ALTER TABLE public.participant_sensitive ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.participant_sensitive FROM PUBLIC, anon, authenticated, service_role;
-- (no policies: direct access is denied to every API role)

DROP TRIGGER IF EXISTS vs_audit ON public.participant_sensitive;
CREATE TRIGGER vs_audit AFTER INSERT OR UPDATE OR DELETE ON public.participant_sensitive
  FOR EACH ROW EXECUTE FUNCTION vs_private.audit_row_change();

CREATE OR REPLACE FUNCTION vs_private.pii_key()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'vs_pii_key' LIMIT 1
$$;
REVOKE ALL ON FUNCTION vs_private.pii_key() FROM PUBLIC;

CREATE OR REPLACE FUNCTION vs_private.enc(p text)
RETURNS bytea LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = '' AS $$
  SELECT CASE WHEN p IS NULL OR btrim(p) = '' THEN NULL
    ELSE extensions.pgp_sym_encrypt(btrim(p), vs_private.pii_key(), 'cipher-algo=aes256') END
$$;
CREATE OR REPLACE FUNCTION vs_private.dec(p bytea)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT CASE WHEN p IS NULL THEN NULL
    ELSE extensions.pgp_sym_decrypt(p, vs_private.pii_key()) END
$$;
REVOKE ALL ON FUNCTION vs_private.enc(text), vs_private.dec(bytea) FROM PUBLIC;

CREATE OR REPLACE FUNCTION vs_private.last4(p text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT CASE WHEN p IS NULL OR btrim(p) = '' THEN NULL
    ELSE right(regexp_replace(p, '[^0-9A-Za-z]', '', 'g'), 4) END
$$;

-- Internal upsert; NULL argument = leave that field unchanged.
CREATE OR REPLACE FUNCTION vs_private.store_sensitive(
  p_participant_id uuid, p_medicaid_id text, p_ssn text, p_dob date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.participant_sensitive AS s
    (participant_id, medicaid_id_enc, medicaid_id_last4, ssn_enc, ssn_last4, dob_enc, dob_year)
  VALUES (p_participant_id,
    vs_private.enc(p_medicaid_id), vs_private.last4(p_medicaid_id),
    vs_private.enc(p_ssn), vs_private.last4(p_ssn),
    vs_private.enc(p_dob::text), extract(year FROM p_dob)::smallint)
  ON CONFLICT (participant_id) DO UPDATE SET
    medicaid_id_enc   = coalesce(EXCLUDED.medicaid_id_enc, s.medicaid_id_enc),
    medicaid_id_last4 = coalesce(EXCLUDED.medicaid_id_last4, s.medicaid_id_last4),
    ssn_enc           = coalesce(EXCLUDED.ssn_enc, s.ssn_enc),
    ssn_last4         = coalesce(EXCLUDED.ssn_last4, s.ssn_last4),
    dob_enc           = coalesce(EXCLUDED.dob_enc, s.dob_enc),
    dob_year          = coalesce(EXCLUDED.dob_year, s.dob_year),
    updated_at = now(), updated_by = auth.uid();
END $$;
REVOKE ALL ON FUNCTION vs_private.store_sensitive(uuid, text, text, date) FROM PUBLIC;

-- Public write API for the app.
CREATE OR REPLACE FUNCTION public.vs_set_sensitive(
  p_participant_id uuid, p_medicaid_id text DEFAULT NULL, p_ssn text DEFAULT NULL, p_dob date DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.vs_can_write_participant(p_participant_id) THEN
    RAISE EXCEPTION 'Not allowed to update this participant' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF p_ssn IS NOT NULL AND NOT public.vs_has_role('executive', 'operator') THEN
    RAISE EXCEPTION 'Only an executive or operator can record an SSN' USING ERRCODE = 'insufficient_privilege';
  END IF;
  PERFORM vs_private.store_sensitive(p_participant_id, p_medicaid_id, p_ssn, p_dob);
END $$;

-- Public read API. Masked by default; p_reveal = true returns clear values
-- for the fields the caller's role allows, and logs the reveal.
CREATE OR REPLACE FUNCTION public.vs_get_sensitive(p_participant_id uuid, p_reveal boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  s public.participant_sensitive%ROWTYPE;
  v_role text := public.vs_current_access_role();
  v_can_ssn boolean;
  v_can_mid boolean;
  v_out jsonb;
BEGIN
  IF NOT public.vs_can_see_participant(p_participant_id) THEN
    RAISE EXCEPTION 'Not allowed to view this participant' USING ERRCODE = 'insufficient_privilege';
  END IF;
  SELECT * INTO s FROM public.participant_sensitive WHERE participant_id = p_participant_id;

  v_can_ssn := v_role IN ('executive', 'operator');
  v_can_mid := v_role IN ('executive', 'operator', 'case_manager');

  v_out := jsonb_build_object(
    'medicaid_id', CASE WHEN s.medicaid_id_last4 IS NULL THEN NULL ELSE '••••' || s.medicaid_id_last4 END,
    'ssn',         CASE WHEN s.ssn_last4 IS NULL THEN NULL ELSE '•••-••-' || s.ssn_last4 END,
    'dob',         CASE WHEN s.dob_year IS NULL THEN NULL ELSE '••/••/' || s.dob_year END,
    'masked', true,
    'can_reveal', jsonb_build_object('medicaid_id', v_can_mid, 'ssn', v_can_ssn, 'dob', v_can_mid));

  IF p_reveal AND (v_can_mid OR v_can_ssn) AND s.participant_id IS NOT NULL THEN
    v_out := v_out || jsonb_build_object(
      'medicaid_id', CASE WHEN v_can_mid THEN vs_private.dec(s.medicaid_id_enc) ELSE v_out->>'medicaid_id' END,
      'ssn',         CASE WHEN v_can_ssn THEN vs_private.dec(s.ssn_enc) ELSE v_out->>'ssn' END,
      'dob',         CASE WHEN v_can_mid THEN vs_private.dec(s.dob_enc) ELSE v_out->>'dob' END,
      'masked', false);
    PERFORM public.vs_log_event('reveal_sensitive', 'participant_sensitive', p_participant_id::text,
      jsonb_build_object('fields', array_remove(ARRAY[
        CASE WHEN v_can_mid THEN 'medicaid_id' END,
        CASE WHEN v_can_ssn THEN 'ssn' END,
        CASE WHEN v_can_mid THEN 'dob' END], NULL)));
  END IF;
  RETURN v_out;
END $$;

REVOKE ALL ON FUNCTION public.vs_set_sensitive(uuid, text, text, date),
  public.vs_get_sensitive(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vs_set_sensitive(uuid, text, text, date),
  public.vs_get_sensitive(uuid, boolean) TO authenticated, service_role;

-- ─── Auto-move plaintext writes into the encrypted table ───────────────────

CREATE OR REPLACE FUNCTION vs_private.participants_move_dob()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.date_of_birth IS NOT NULL THEN
    PERFORM vs_private.store_sensitive(NEW.id, NULL, NULL, NEW.date_of_birth);
    NEW.date_of_birth := NULL;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS vs_participants_move_dob ON public.participants;
CREATE TRIGGER vs_participants_move_dob BEFORE INSERT OR UPDATE OF date_of_birth ON public.participants
  FOR EACH ROW EXECUTE FUNCTION vs_private.participants_move_dob();

CREATE OR REPLACE FUNCTION vs_private.identifiers_move_sensitive()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_type text := lower(regexp_replace(NEW.identifier_type, '[^a-zA-Z]', '', 'g'));
BEGIN
  IF v_type IN ('ssn', 'socialsecurity', 'socialsecuritynumber') THEN
    IF NEW.identifier_value !~ '^•' THEN
      PERFORM vs_private.store_sensitive(NEW.participant_id, NULL, NEW.identifier_value, NULL);
      NEW.identifier_value := '•••-••-' || vs_private.last4(NEW.identifier_value);
    END IF;
  ELSIF v_type IN ('medicaid', 'medicaidid', 'medicaidnumber') THEN
    IF NEW.identifier_value !~ '^•' THEN
      PERFORM vs_private.store_sensitive(NEW.participant_id, NEW.identifier_value, NULL, NULL);
      NEW.identifier_value := '••••' || vs_private.last4(NEW.identifier_value);
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS vs_identifiers_move_sensitive ON public.participant_identifiers;
CREATE TRIGGER vs_identifiers_move_sensitive BEFORE INSERT OR UPDATE ON public.participant_identifiers
  FOR EACH ROW EXECUTE FUNCTION vs_private.identifiers_move_sensitive();

-- Move anything already stored (tables are empty today; safe no-op).
UPDATE public.participants SET date_of_birth = date_of_birth WHERE date_of_birth IS NOT NULL;
UPDATE public.participant_identifiers SET identifier_value = identifier_value
  WHERE lower(identifier_type) ~ '(ssn|social|medicaid)';

-- Belt and braces: plaintext DOB can never persist on participants.
ALTER TABLE public.participants DROP CONSTRAINT IF EXISTS participants_dob_encrypted_only;
ALTER TABLE public.participants ADD CONSTRAINT participants_dob_encrypted_only
  CHECK (date_of_birth IS NULL);
