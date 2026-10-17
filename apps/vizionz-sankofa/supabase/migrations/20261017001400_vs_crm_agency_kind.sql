-- VIZIONZ SANKOFA · Office CRM 1/7 · "agency" organizations
--
-- Adds 'agency' to organizations.relationship_kind for referral and service
-- agencies (county, state, nonprofit) that are neither funders nor coalition
-- partners. Kept alone in its own file: a new enum value can't be used in
-- the same transaction that adds it. Paste this file on its own.

ALTER TYPE public.organization_relationship_kind ADD VALUE IF NOT EXISTS 'agency';
