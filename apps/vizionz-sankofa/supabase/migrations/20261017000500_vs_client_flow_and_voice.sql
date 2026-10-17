-- VIZIONZ SANKOFA · Pilot 5/5 · Client flow stages, returning-client flag,
-- per-user voice settings.

-- ─── Stage pipeline ─────────────────────────────────────────────────────────
ALTER TABLE public.participants
  ADD COLUMN IF NOT EXISTS current_stage text NOT NULL DEFAULT 'intake'
    CHECK (current_stage IN ('intake', 'review', 'consent_signed', 'enrolled',
      'receiving_services', 'readiness_evaluation', 'certified', 'exited')),
  ADD COLUMN IF NOT EXISTS stage_changed_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS is_returning boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS returning_flagged_at timestamptz;

CREATE TABLE IF NOT EXISTS public.participant_stage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  from_stage text,
  to_stage text NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by uuid DEFAULT auth.uid(),
  changed_by_email text DEFAULT (auth.jwt()->>'email')
);
CREATE INDEX IF NOT EXISTS participant_stage_events_pid_idx
  ON public.participant_stage_events (participant_id, changed_at);

ALTER TABLE public.participant_stage_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.participant_stage_events FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.participant_stage_events FROM authenticated;
DROP POLICY IF EXISTS vs_stage_events_select ON public.participant_stage_events;
CREATE POLICY vs_stage_events_select ON public.participant_stage_events
  FOR SELECT TO authenticated USING (public.vs_can_see_participant(participant_id));

CREATE INDEX IF NOT EXISTS participants_stage_idx ON public.participants (current_stage);
CREATE INDEX IF NOT EXISTS participants_cm_idx ON public.participants (primary_case_manager_id);

CREATE OR REPLACE FUNCTION vs_private.participants_stage_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.stage_changed_at := now();
    INSERT INTO public.participant_stage_events (participant_id, from_stage, to_stage)
      VALUES (NEW.id, NULL, NEW.current_stage);
  ELSIF NEW.current_stage IS DISTINCT FROM OLD.current_stage THEN
    NEW.stage_changed_at := now();
    INSERT INTO public.participant_stage_events (participant_id, from_stage, to_stage)
      VALUES (NEW.id, OLD.current_stage, NEW.current_stage);
    -- Someone who exited and comes back is a returning client.
    IF OLD.current_stage = 'exited' AND NEW.current_stage <> 'exited' THEN
      NEW.is_returning := true;
      NEW.returning_flagged_at := now();
    END IF;
  END IF;
  RETURN NEW;
END $$;

-- The stage event row references the participant, so the FK must be
-- checked at commit (BEFORE INSERT runs before the participant row exists).
ALTER TABLE public.participant_stage_events
  DROP CONSTRAINT IF EXISTS participant_stage_events_participant_id_fkey,
  ADD CONSTRAINT participant_stage_events_participant_id_fkey
    FOREIGN KEY (participant_id) REFERENCES public.participants(id)
    ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;

DROP TRIGGER IF EXISTS vs_participants_stage ON public.participants;
CREATE TRIGGER vs_participants_stage BEFORE INSERT OR UPDATE OF current_stage ON public.participants
  FOR EACH ROW EXECUTE FUNCTION vs_private.participants_stage_change();

-- Stage summary for the executive home (RLS of the caller applies).
CREATE OR REPLACE VIEW public.vs_stage_summary WITH (security_invoker = true) AS
SELECT current_stage,
       count(*)::int AS participants,
       round(avg(extract(epoch FROM now() - stage_changed_at) / 86400)::numeric, 1) AS avg_days_in_stage,
       count(*) FILTER (WHERE now() - stage_changed_at > interval '30 days')::int AS stalled_over_30_days,
       count(*) FILTER (WHERE is_returning)::int AS returning_clients
FROM public.participants
GROUP BY current_stage;
REVOKE ALL ON public.vs_stage_summary FROM anon;
GRANT SELECT ON public.vs_stage_summary TO authenticated;

-- ─── Returning client on a new intake ───────────────────────────────────────
ALTER TABLE public.intake_requests
  ADD COLUMN IF NOT EXISTS is_returning boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS matched_participant_id uuid REFERENCES public.participants(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION vs_private.digits(p text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT nullif(right(regexp_replace(coalesce(p, ''), '[^0-9]', '', 'g'), 10), '')
$$;

CREATE OR REPLACE FUNCTION vs_private.intake_flag_returning()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_pid uuid;
BEGIN
  SELECT p.id INTO v_pid FROM public.participants p
  WHERE (NEW.email IS NOT NULL AND lower(p.email) = lower(btrim(NEW.email)))
     OR (vs_private.digits(NEW.phone) IS NOT NULL AND length(vs_private.digits(NEW.phone)) >= 7
         AND (vs_private.digits(p.phone_primary) = vs_private.digits(NEW.phone)
              OR vs_private.digits(p.phone_secondary) = vs_private.digits(NEW.phone)))
  ORDER BY p.created_at LIMIT 1;

  IF v_pid IS NULL THEN
    SELECT i.matched_participant_id INTO v_pid FROM public.intake_requests i
    WHERE i.id <> NEW.id AND (lower(i.email) = lower(btrim(NEW.email))
      OR (vs_private.digits(NEW.phone) IS NOT NULL AND vs_private.digits(i.phone) = vs_private.digits(NEW.phone)))
    LIMIT 1;
    IF FOUND THEN NEW.is_returning := true; END IF;
  END IF;

  IF v_pid IS NOT NULL THEN
    NEW.is_returning := true;
    NEW.matched_participant_id := v_pid;
    UPDATE public.participants SET is_returning = true,
      returning_flagged_at = coalesce(returning_flagged_at, now())
      WHERE id = v_pid;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS vs_intake_flag_returning ON public.intake_requests;
CREATE TRIGGER vs_intake_flag_returning BEFORE INSERT ON public.intake_requests
  FOR EACH ROW EXECUTE FUNCTION vs_private.intake_flag_returning();

-- ─── Voice settings (wake phrase OFF by default) ────────────────────────────
ALTER TABLE public.vs_operators
  ADD COLUMN IF NOT EXISTS wake_phrase_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wake_phrase text,
  ADD COLUMN IF NOT EXISTS speak_answers boolean NOT NULL DEFAULT true;

-- Users can change only their own voice settings.
CREATE OR REPLACE FUNCTION public.vs_set_my_voice_settings(
  p_wake_phrase_enabled boolean, p_wake_phrase text, p_speak_answers boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'must be signed in'; END IF;
  UPDATE public.vs_operators SET
    wake_phrase_enabled = coalesce(p_wake_phrase_enabled, false),
    wake_phrase = nullif(left(btrim(p_wake_phrase), 40), ''),
    speak_answers = coalesce(p_speak_answers, true)
  WHERE user_id = auth.uid();
END $$;
REVOKE ALL ON FUNCTION public.vs_set_my_voice_settings(boolean, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vs_set_my_voice_settings(boolean, text, boolean) TO authenticated;

DROP TRIGGER IF EXISTS vs_audit ON public.participant_stage_events;
CREATE TRIGGER vs_audit AFTER INSERT OR UPDATE OR DELETE ON public.participant_stage_events
  FOR EACH ROW EXECUTE FUNCTION vs_private.audit_row_change();
