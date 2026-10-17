-- VIZIONZ SANKOFA · Coalition Partners
--
-- Coalition partners are the organizations VS works alongside
-- (organizations.relationship_kind = 'partner' or 'both'). This adds the
-- three things the admin "Coalition Partners" surface tracks:
--
--   vs_partner_agreements   MOUs and other agreements: type, status, dates,
--                           signatories, link to the signed copy in vs_documents
--   vs_partner_checkins     dated partner check-ins with next steps; the next
--                           check-in date is copied to organizations.next_touch_due
--   vs_partner_programs     which VS programs / cohorts a partner helps run
--                           and in what role (shared program coordination)
--
-- These are organization records, not participant records. Check-in notes
-- must not contain client names or details (the UI says so).
-- Access: executive + operator read/write; leadership_readonly read-only;
-- case managers can read partner agreements and shared programs (to know
-- where to point people) but not check-in notes. No access_role = nothing.

CREATE TABLE IF NOT EXISTS public.vs_partner_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  title text NOT NULL CHECK (length(trim(title)) > 0),
  agreement_type text NOT NULL DEFAULT 'mou' CHECK (agreement_type IN (
    'mou', 'data_sharing', 'referral', 'subcontract', 'letter_of_support', 'other')),
  status text NOT NULL DEFAULT 'drafting' CHECK (status IN (
    'drafting', 'in_review', 'sent', 'signed', 'active', 'expired', 'terminated')),
  signed_on date,
  effective_date date,
  expires_on date,
  vs_signatory text,
  partner_signatory text,
  covers_participant_data boolean NOT NULL DEFAULT false,
  document_id uuid REFERENCES public.vs_documents(id) ON DELETE SET NULL,
  notes text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_on IS NULL OR effective_date IS NULL OR expires_on >= effective_date)
);

CREATE TABLE IF NOT EXISTS public.vs_partner_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  occurred_on date NOT NULL DEFAULT CURRENT_DATE,
  method text NOT NULL DEFAULT 'meeting' CHECK (method IN (
    'in_person', 'phone', 'video', 'email', 'meeting', 'event', 'other')),
  attendees text,
  summary text NOT NULL CHECK (length(trim(summary)) > 0),
  next_steps text,
  next_checkin_due date,
  logged_by uuid DEFAULT auth.uid(),
  logged_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (next_checkin_due IS NULL OR next_checkin_due >= occurred_on)
);

CREATE TABLE IF NOT EXISTS public.vs_partner_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE RESTRICT,
  cohort_id uuid REFERENCES public.cohorts(id) ON DELETE SET NULL,
  partner_role text NOT NULL DEFAULT 'co_delivery' CHECK (partner_role IN (
    'co_delivery', 'referral_partner', 'host_site', 'in_kind', 'shared_staff', 'other')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('planned', 'active', 'paused', 'ended')),
  start_date date,
  end_date date,
  partner_contact text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, program_id, partner_role),
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS vs_partner_agreements_org_idx ON public.vs_partner_agreements (organization_id);
CREATE INDEX IF NOT EXISTS vs_partner_agreements_expiry_idx ON public.vs_partner_agreements (expires_on)
  WHERE status IN ('signed', 'active');
CREATE INDEX IF NOT EXISTS vs_partner_checkins_org_idx ON public.vs_partner_checkins (organization_id, occurred_on DESC);
CREATE INDEX IF NOT EXISTS vs_partner_programs_org_idx ON public.vs_partner_programs (organization_id);
CREATE INDEX IF NOT EXISTS vs_partner_programs_program_idx ON public.vs_partner_programs (program_id);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['vs_partner_agreements', 'vs_partner_checkins', 'vs_partner_programs']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at_%1$s ON public.%1$I', t);
    EXECUTE format('CREATE TRIGGER set_updated_at_%1$s BEFORE UPDATE ON public.%1$I
      FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at()', t);
  END LOOP;
END $$;

-- Keep the partner's "next touch" date in step with the latest check-in.
CREATE OR REPLACE FUNCTION vs_private.partner_checkin_next_touch()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.next_checkin_due IS NOT NULL THEN
    UPDATE public.organizations SET next_touch_due = NEW.next_checkin_due
     WHERE id = NEW.organization_id
       AND next_touch_due IS DISTINCT FROM NEW.next_checkin_due;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS vs_partner_checkins_next_touch ON public.vs_partner_checkins;
CREATE TRIGGER vs_partner_checkins_next_touch AFTER INSERT OR UPDATE OF next_checkin_due
  ON public.vs_partner_checkins
  FOR EACH ROW EXECUTE FUNCTION vs_private.partner_checkin_next_touch();

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.vs_partner_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vs_partner_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vs_partner_programs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.vs_partner_agreements, public.vs_partner_checkins, public.vs_partner_programs FROM anon;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['vs_partner_agreements', 'vs_partner_checkins', 'vs_partner_programs']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %1$s_select ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS %1$s_insert ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS %1$s_update ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS %1$s_delete ON public.%1$I', t);
    IF t = 'vs_partner_checkins' THEN
      EXECUTE format($f$CREATE POLICY %1$s_select ON public.%1$I FOR SELECT TO authenticated
        USING (public.vs_has_role('executive', 'operator', 'leadership_readonly'))$f$, t);
    ELSE
      EXECUTE format($f$CREATE POLICY %1$s_select ON public.%1$I FOR SELECT TO authenticated
        USING (public.vs_has_role('executive', 'operator', 'leadership_readonly', 'case_manager'))$f$, t);
    END IF;
    EXECUTE format($f$CREATE POLICY %1$s_insert ON public.%1$I FOR INSERT TO authenticated
      WITH CHECK (public.vs_has_role('executive', 'operator'))$f$, t);
    EXECUTE format($f$CREATE POLICY %1$s_update ON public.%1$I FOR UPDATE TO authenticated
      USING (public.vs_has_role('executive', 'operator'))
      WITH CHECK (public.vs_has_role('executive', 'operator'))$f$, t);
    EXECUTE format($f$CREATE POLICY %1$s_delete ON public.%1$I FOR DELETE TO authenticated
      USING (public.vs_has_role('executive', 'operator'))$f$, t);
  END LOOP;
END $$;

-- ─── Audit trail ────────────────────────────────────────────────────────────

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['vs_partner_agreements', 'vs_partner_checkins', 'vs_partner_programs']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS vs_audit ON public.%I', t);
    EXECUTE format('CREATE TRIGGER vs_audit AFTER INSERT OR UPDATE OR DELETE ON public.%I
      FOR EACH ROW EXECUTE FUNCTION vs_private.audit_row_change()', t);
  END LOOP;
END $$;
