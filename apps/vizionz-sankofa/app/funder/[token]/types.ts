// VIZIONZ SANKOFA · /funder/[token] · shared types
//
// Public funder portal — read-only, token-gated, scoped by org name match
// against services_delivered.cost_funded_by field.

export type FunderTokenResolved = {
  token_id: string
  organization_id: string
  organization_name: string
  organization_short_name: string | null
  organization_type: string
  is_revoked: boolean
  view_count: number
  last_viewed_at: string | null
  token_note: string | null
}

export type FunderServiceRow = {
  id: string
  service_name: string | null
  service_category: string | null
  service_unit: string | null
  delivered_at: string
  units: number | null
  outcome: string | null
  cost_amount: string | null
  notes: string | null
  participant_first_name: string
  participant_last_name: string
  participant_preferred_name: string | null
}

export type FunderParticipantSummary = {
  participant_id: string
  first_name: string
  last_name: string
  preferred_name: string | null
  city: string | null
  status: string | null
  intake_date: string | null
  service_count: number
  total_units: number
  total_cost: number
  baseline_composite: number | null
  most_recent_composite: number | null
  trajectory: number | null
}

export type FunderCohortSummary = {
  cohort_id: string
  cohort_name: string
  program_name: string | null
  program_icon: string | null
  start_date: string
  end_date: string | null
  status: string
  funded_participant_count: number
}

export type FunderCategoryRollup = {
  category: string
  service_count: number
  unit_count: number
  total_cost: number
  outcomes: {
    completed: number
    partial: number
    no_show: number
    cancelled: number
    in_progress: number
  }
}

export type FunderPortalData = {
  funder: FunderTokenResolved
  participants: FunderParticipantSummary[]
  services: FunderServiceRow[]
  cohorts: FunderCohortSummary[]
  category_rollups: FunderCategoryRollup[]
  totals: {
    participant_count: number
    service_count: number
    unit_count: number
    total_cost: number
    cohort_count: number
  }
  last_updated_at: string
}
