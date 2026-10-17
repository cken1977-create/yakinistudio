-- VIZIONZ SANKOFA · staff.full_name
--
-- The app selects staff.full_name in many places (case notes author,
-- services "delivered by", cohort facilitator, case-manager pickers), but
-- the live staff table only has first_name / last_name. Every one of those
-- queries currently errors, which leaves the Cohorts list empty, cohort and
-- participant detail pages without their staff joins, and the case-manager
-- dropdowns blank. A generated column fixes all of them without code changes.

ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS full_name text
  GENERATED ALWAYS AS (btrim(first_name || ' ' || last_name)) STORED;

COMMENT ON COLUMN public.staff.full_name IS 'first_name + last_name (generated; read-only).';
