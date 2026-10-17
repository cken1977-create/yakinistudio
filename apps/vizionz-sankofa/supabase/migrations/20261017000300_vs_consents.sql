-- VIZIONZ SANKOFA · Pilot protection 3/5 · Consent records
--
-- One row per consent a person gives (or a guardian gives for them).
-- Terms are immutable once recorded; the only allowed change is revocation.
-- Consents are never deleted (revoke instead). vs_has_active_consent() is
-- the single check the app (and later the Kamili auto-push) must call.

CREATE TABLE IF NOT EXISTS public.vs_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid REFERENCES public.participants(id) ON DELETE RESTRICT,
  intake_request_id uuid REFERENCES public.intake_requests(id) ON DELETE SET NULL,
  scope text NOT NULL CHECK (scope IN (
    'services',            -- receive services from VS
    'share_kamili',        -- send minimum readiness data to Kamili
    'share_funder',        -- participant-level data to a named funder
    'medicaid_billing',    -- bill Medicaid for services
    'photos_media',        -- photos / stories
    'contact_text_email'   -- texts and emails to the participant
  )),
  language text NOT NULL DEFAULT 'en',
  form_version text NOT NULL,
  signed_by_name text NOT NULL,
  is_guardian boolean NOT NULL DEFAULT false,
  guardian_relationship text,
  interpreter_used boolean NOT NULL DEFAULT false,
  interpreter_name text,
  signed_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  captured_by uuid DEFAULT auth.uid(),
  document_id uuid REFERENCES public.participant_documents(id) ON DELETE SET NULL,
  revoked_at timestamptz,
  revoked_by uuid,
  revocation_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (participant_id IS NOT NULL OR intake_request_id IS NOT NULL),
  CHECK (NOT is_guardian OR guardian_relationship IS NOT NULL),
  CHECK (expires_at IS NULL OR expires_at > signed_at),
  CHECK (revoked_at IS NULL OR revoked_at >= signed_at)
);

CREATE INDEX IF NOT EXISTS vs_consents_participant_idx ON public.vs_consents (participant_id, scope);

ALTER TABLE public.vs_consents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.vs_consents FROM anon;

DROP POLICY IF EXISTS vs_consents_select ON public.vs_consents;
CREATE POLICY vs_consents_select ON public.vs_consents
  FOR SELECT TO authenticated USING (
    (participant_id IS NOT NULL AND public.vs_can_see_participant(participant_id))
    OR (participant_id IS NULL AND public.vs_has_role('executive', 'operator')));
DROP POLICY IF EXISTS vs_consents_insert ON public.vs_consents;
CREATE POLICY vs_consents_insert ON public.vs_consents
  FOR INSERT TO authenticated WITH CHECK (
    (participant_id IS NOT NULL AND public.vs_can_write_participant(participant_id))
    OR (participant_id IS NULL AND public.vs_has_role('executive', 'operator')));
DROP POLICY IF EXISTS vs_consents_update ON public.vs_consents;
CREATE POLICY vs_consents_update ON public.vs_consents
  FOR UPDATE TO authenticated
  USING ((participant_id IS NOT NULL AND public.vs_can_write_participant(participant_id))
    OR public.vs_has_role('executive', 'operator'))
  WITH CHECK ((participant_id IS NOT NULL AND public.vs_can_write_participant(participant_id))
    OR public.vs_has_role('executive', 'operator'));
-- No DELETE policy: nobody can delete a consent through the API.
REVOKE DELETE, TRUNCATE ON public.vs_consents FROM authenticated;

-- Only revocation fields (and linking an intake consent to the participant
-- it became) may change after a consent is recorded.
CREATE OR REPLACE FUNCTION vs_private.consent_only_revocable()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF OLD.revoked_at IS NOT NULL THEN
    RAISE EXCEPTION 'Consent % is already revoked and cannot change', OLD.id;
  END IF;
  IF (to_jsonb(NEW) - ARRAY['revoked_at', 'revoked_by', 'revocation_reason', 'participant_id'])
     IS DISTINCT FROM
     (to_jsonb(OLD) - ARRAY['revoked_at', 'revoked_by', 'revocation_reason', 'participant_id']) THEN
    RAISE EXCEPTION 'Consent terms cannot be edited. Revoke it and record a new consent.';
  END IF;
  IF OLD.participant_id IS NOT NULL AND NEW.participant_id IS DISTINCT FROM OLD.participant_id THEN
    RAISE EXCEPTION 'Consent cannot be moved to a different participant';
  END IF;
  IF NEW.revoked_at IS NOT NULL AND NEW.revoked_by IS NULL THEN
    NEW.revoked_by := auth.uid();
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS vs_consents_only_revocable ON public.vs_consents;
CREATE TRIGGER vs_consents_only_revocable BEFORE UPDATE ON public.vs_consents
  FOR EACH ROW EXECUTE FUNCTION vs_private.consent_only_revocable();

DROP TRIGGER IF EXISTS vs_audit ON public.vs_consents;
CREATE TRIGGER vs_audit AFTER INSERT OR UPDATE OR DELETE ON public.vs_consents
  FOR EACH ROW EXECUTE FUNCTION vs_private.audit_row_change();

-- Is there a signed, unexpired, unrevoked consent for this scope right now?
-- SECURITY INVOKER: the caller's RLS applies, so a case manager cannot probe
-- another caseload's consents.
CREATE OR REPLACE FUNCTION public.vs_has_active_consent(p_participant_id uuid, p_scope text)
RETURNS boolean LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.vs_consents c
    WHERE c.participant_id = p_participant_id
      AND c.scope = p_scope
      AND c.revoked_at IS NULL
      AND c.signed_at <= now()
      AND (c.expires_at IS NULL OR c.expires_at > now()))
$$;
REVOKE ALL ON FUNCTION public.vs_has_active_consent(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vs_has_active_consent(uuid, text) TO authenticated, service_role;
