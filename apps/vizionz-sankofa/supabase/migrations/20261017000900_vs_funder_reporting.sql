-- VIZIONZ SANKOFA · Funder reporting (one entry, six funders)
-- Adds a service county (Housing NM reports split Bernalillo / Lea) and a
-- funder tag on each logged service. Reports are built from these rows.

ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS service_county text;
ALTER TABLE public.services_delivered
  ADD COLUMN IF NOT EXISTS service_county text,
  ADD COLUMN IF NOT EXISTS funder_key text;

DO $$ BEGIN
  ALTER TABLE public.participants ADD CONSTRAINT participants_service_county_check
    CHECK (service_county IN ('bernalillo', 'lea', 'other'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.services_delivered ADD CONSTRAINT services_delivered_service_county_check
    CHECK (service_county IN ('bernalillo', 'lea', 'other'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.services_delivered ADD CONSTRAINT services_delivered_funder_key_check
    CHECK (funder_key IN ('acf', 'bernalillo_county', 'state_nm', 'city_abq', 'medicaid', 'housing_nm'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS services_delivered_funder_idx ON public.services_delivered (funder_key, delivered_at);

-- Birth year and masked Medicaid last-4 for report rows the caller may see.
-- Nothing is decrypted; same exposure as the masked profile view.
CREATE OR REPLACE FUNCTION public.vs_report_flags(p_ids uuid[])
RETURNS TABLE (participant_id uuid, dob_year smallint, medicaid_last4 text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT s.participant_id, s.dob_year, s.medicaid_id_last4
  FROM public.participant_sensitive s
  WHERE s.participant_id = ANY (p_ids) AND public.vs_can_see_participant(s.participant_id)
$$;
REVOKE ALL ON FUNCTION public.vs_report_flags(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vs_report_flags(uuid[]) TO authenticated;
