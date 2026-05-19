// VIZIONZ SANKOFA · /admin/participants · shared types

export type ParticipantStatus =
  | 'intake'
  | 'assessed'
  | 'active'
  | 'on_hold'
  | 'graduated'
  | 'inactive'
  | 'follow_up'
  | 'closed'

export type ReferralSource =
  | 'self'
  | 'court'
  | 'parole_probation'
  | 'family'
  | 'community_org'
  | 'school'
  | 'social_services'
  | 'other_program'
  | 'walk_in'
  | 'event'
  | 'social_media'
  | 'other'

export type ParticipantRecord = {
  id: string
  first_name: string
  last_name: string
  preferred_name: string | null
  date_of_birth: string | null
  phone_primary: string | null
  phone_secondary: string | null
  email: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  zip: string | null
  gender: string | null
  race_ethnicity: string[] | null
  primary_language: string | null
  veteran_status: boolean | null
  disability_status: boolean | null
  household_size: number | null
  children_in_household: number | null
  household_income_range: string | null
  intake_date: string
  referral_source: ReferralSource | null
  referral_source_detail: string | null
  status: ParticipantStatus
  primary_case_manager_id: string | null
  consent_to_services: boolean | null
  consent_to_share_data: boolean | null
  consent_to_photos: boolean | null
  consent_signed_at: string | null
  intake_notes: string | null
  legacyline_subject_id: string | null
  legacyline_pushed_at: string | null
  legacyline_consent_signed: boolean | null
  created_at: string
  updated_at: string
}

export type ParticipantEditableFields = {
  first_name: string
  last_name: string
  preferred_name: string | null
  date_of_birth: string | null
  phone_primary: string | null
  email: string | null
  city: string | null
  state: string | null
  zip: string | null
  intake_date: string
  status: ParticipantStatus
  referral_source: ReferralSource | null
  referral_source_detail: string | null
  primary_case_manager_id: string | null
  intake_notes: string | null
  consent_to_services: boolean | null
  consent_to_share_data: boolean | null
  consent_to_photos: boolean | null
}

export type StaffRecord = {
  id: string
  full_name: string
  role: string | null
}

export const PARTICIPANT_STATUS_LABELS: Record<ParticipantStatus, string> = {
  intake: 'Intake',
  assessed: 'Assessed',
  active: 'Active',
  on_hold: 'On Hold',
  graduated: 'Graduated',
  inactive: 'Inactive',
  follow_up: 'Follow-up',
  closed: 'Closed',
}

export const REFERRAL_SOURCE_LABELS: Record<ReferralSource, string> = {
  self: 'Self-referral',
  court: 'Court',
  parole_probation: 'Parole/Probation',
  family: 'Family',
  community_org: 'Community Organization',
  school: 'School',
  social_services: 'Social Services',
  other_program: 'Other Program',
  walk_in: 'Walk-in',
  event: 'Event',
  social_media: 'Social Media',
  other: 'Other',
}
