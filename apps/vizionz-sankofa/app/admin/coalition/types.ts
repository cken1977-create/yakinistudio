// VIZIONZ SANKOFA · Coalition Partners types
// Mirrors supabase/migrations/20261017000700_vs_coalition_partners.sql

export type AgreementType = 'mou' | 'data_sharing' | 'referral' | 'subcontract' | 'letter_of_support' | 'other'
export const AGREEMENT_TYPE_LABELS: Record<AgreementType, string> = {
  mou: 'MOU',
  data_sharing: 'Data-sharing agreement',
  referral: 'Referral agreement',
  subcontract: 'Subcontract',
  letter_of_support: 'Letter of support',
  other: 'Other',
}

export type AgreementStatus = 'drafting' | 'in_review' | 'sent' | 'signed' | 'active' | 'expired' | 'terminated'
export const AGREEMENT_STATUS_LABELS: Record<AgreementStatus, string> = {
  drafting: 'Drafting',
  in_review: 'In review',
  sent: 'Sent for signature',
  signed: 'Signed',
  active: 'Active',
  expired: 'Expired',
  terminated: 'Terminated',
}
export const LIVE_AGREEMENT_STATUSES: AgreementStatus[] = ['signed', 'active']

export type Agreement = {
  id: string
  organization_id: string
  title: string
  agreement_type: AgreementType
  status: AgreementStatus
  signed_on: string | null
  effective_date: string | null
  expires_on: string | null
  vs_signatory: string | null
  partner_signatory: string | null
  covers_participant_data: boolean
  document_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}
export const AGREEMENT_COLUMNS =
  'id, organization_id, title, agreement_type, status, signed_on, effective_date, expires_on, ' +
  'vs_signatory, partner_signatory, covers_participant_data, document_id, notes, created_at, updated_at'

export type CheckinMethod = 'in_person' | 'phone' | 'video' | 'email' | 'meeting' | 'event' | 'other'
export const CHECKIN_METHOD_LABELS: Record<CheckinMethod, string> = {
  in_person: 'In person',
  phone: 'Phone',
  video: 'Video call',
  email: 'Email',
  meeting: 'Meeting',
  event: 'Event',
  other: 'Other',
}

export type Checkin = {
  id: string
  organization_id: string
  occurred_on: string
  method: CheckinMethod
  attendees: string | null
  summary: string
  next_steps: string | null
  next_checkin_due: string | null
  logged_by_name: string | null
  created_at: string
}
export const CHECKIN_COLUMNS =
  'id, organization_id, occurred_on, method, attendees, summary, next_steps, next_checkin_due, logged_by_name, created_at'

export type PartnerRole = 'co_delivery' | 'referral_partner' | 'host_site' | 'in_kind' | 'shared_staff' | 'other'
export const PARTNER_ROLE_LABELS: Record<PartnerRole, string> = {
  co_delivery: 'Co-delivers',
  referral_partner: 'Referral partner',
  host_site: 'Host site',
  in_kind: 'In-kind support',
  shared_staff: 'Shared staff',
  other: 'Other',
}

export type SharedProgramStatus = 'planned' | 'active' | 'paused' | 'ended'
export const SHARED_PROGRAM_STATUS_LABELS: Record<SharedProgramStatus, string> = {
  planned: 'Planned',
  active: 'Active',
  paused: 'Paused',
  ended: 'Ended',
}

export type SharedProgram = {
  id: string
  organization_id: string
  program_id: string
  cohort_id: string | null
  partner_role: PartnerRole
  status: SharedProgramStatus
  start_date: string | null
  end_date: string | null
  partner_contact: string | null
  notes: string | null
  created_at: string
}
export const SHARED_PROGRAM_COLUMNS =
  'id, organization_id, program_id, cohort_id, partner_role, status, start_date, end_date, partner_contact, notes, created_at'

export type PartnerOrg = {
  id: string
  name: string
  short_name: string | null
  relationship_kind: 'funder' | 'partner' | 'both'
  type: string
  status: string | null
  primary_contact_name: string | null
  primary_contact_email: string | null
  primary_contact_phone: string | null
  primary_contact_role: string | null
  website: string | null
  notes: string | null
  next_touch_due: string | null
}
export const PARTNER_ORG_COLUMNS =
  'id, name, short_name, relationship_kind, type, status, primary_contact_name, primary_contact_email, ' +
  'primary_contact_phone, primary_contact_role, website, notes, next_touch_due'

export type ProgramOption = { id: string; name: string }
export type CohortOption = { id: string; name: string; program_id: string }
export type DocumentOption = { id: string; title: string; category: string }

/** Days from today (local) to an ISO date; negative = in the past. */
export function daysUntil(iso: string | null, today: string): number | null {
  if (!iso) return null
  const a = new Date(today + 'T00:00:00').getTime()
  const b = new Date(iso.slice(0, 10) + 'T00:00:00').getTime()
  return Math.round((b - a) / 86400000)
}

export const EXPIRING_WINDOW_DAYS = 60
