// VIZIONZ SANKOFA · /admin/grants · shared types
//
// Grant pipeline tracking. Time-sensitive surface — deadlines drive
// urgency display. Each grant has a lifecycle from drafting through
// closed, with rich money and date fields.

export type GrantStatus =
  | 'drafting'
  | 'submitted'
  | 'awarded'
  | 'declined'
  | 'withdrawn'
  | 'closed'

export type GrantRecord = {
  id: string
  name: string
  slug: string
  funder_id: string | null
  program_id: string | null
  cohort_id: string | null
  status: GrantStatus
  amount_requested: string | null
  amount_awarded: string | null
  amount_spent: string | null
  application_opens_at: string | null
  application_due_at: string | null
  submitted_at: string | null
  decided_at: string | null
  period_start: string | null
  period_end: string | null
  next_report_due: string | null
  description: string | null
  proposal_summary: string | null
  decline_reason: string | null
  internal_notes: string | null
  external_grant_id: string | null
  primary_owner_id: string | null
  created_at: string
  updated_at: string
}

export type GrantWithJoins = GrantRecord & {
  funder_name: string | null
  funder_short_name: string | null
  program_name: string | null
  program_icon: string | null
  cohort_name: string | null
  owner_name: string | null
}

export type GrantEditableFields = {
  name: string
  slug: string
  funder_id: string | null
  program_id: string | null
  cohort_id: string | null
  status: GrantStatus
  amount_requested: number | null
  amount_awarded: number | null
  amount_spent: number | null
  application_opens_at: string | null
  application_due_at: string | null
  submitted_at: string | null
  decided_at: string | null
  period_start: string | null
  period_end: string | null
  next_report_due: string | null
  description: string | null
  proposal_summary: string | null
  decline_reason: string | null
  internal_notes: string | null
  external_grant_id: string | null
  primary_owner_id: string | null
}

export type FunderOption = {
  id: string
  name: string
  short_name: string | null
}

export type ProgramOption = {
  id: string
  name: string
  icon_emoji: string | null
}

export type CohortOption = {
  id: string
  name: string
  program_id: string
}

export type StaffOption = {
  id: string
  full_name: string
  role: string | null
}

export const GRANT_STATUS_LABELS: Record<GrantStatus, string> = {
  drafting: 'Drafting',
  submitted: 'Submitted',
  awarded: 'Awarded',
  declined: 'Declined',
  withdrawn: 'Withdrawn',
  closed: 'Closed',
}

export const GRANT_STATUS_COLORS: Record<
  GrantStatus,
  { bg: string; fg: string }
> = {
  drafting: { bg: 'rgba(180, 95, 0, 0.12)', fg: '#B45F00' },
  submitted: { bg: 'rgba(91, 44, 143, 0.12)', fg: '#5B2C8F' },
  awarded: { bg: 'rgba(0, 122, 51, 0.12)', fg: '#007A33' },
  declined: { bg: 'rgba(206, 17, 38, 0.12)', fg: '#CE1126' },
  withdrawn: { bg: 'rgba(10, 10, 10, 0.08)', fg: 'rgba(10, 10, 10, 0.6)' },
  closed: { bg: 'rgba(10, 10, 10, 0.05)', fg: 'rgba(10, 10, 10, 0.5)' },
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60)
}

// Returns the most-relevant deadline for a grant given its status.
// Drafting → application_due_at (when to submit)
// Submitted → decided_at or expected decision
// Awarded → next_report_due (when to report)
// Others → null
export function getRelevantDeadline(grant: GrantRecord): {
  date: string | null
  label: string
} {
  switch (grant.status) {
    case 'drafting':
      return { date: grant.application_due_at, label: 'Due to Submit' }
    case 'submitted':
      return { date: grant.decided_at, label: 'Expected Decision' }
    case 'awarded':
      return { date: grant.next_report_due, label: 'Next Report Due' }
    default:
      return { date: null, label: '' }
  }
}

// Urgency level for color-coded display
export type DeadlineUrgency = 'overdue' | 'urgent' | 'soon' | 'comfortable' | 'none'

export function getDeadlineUrgency(date: string | null): DeadlineUrgency {
  if (!date) return 'none'
  const due = new Date(date + 'T00:00:00').getTime()
  const now = Date.now()
  const days = Math.floor((due - now) / (1000 * 60 * 60 * 24))
  if (days < 0) return 'overdue'
  if (days <= 7) return 'urgent'
  if (days <= 30) return 'soon'
  return 'comfortable'
}

export const URGENCY_COLORS: Record<DeadlineUrgency, string> = {
  overdue: '#CE1126',
  urgent: '#B45F00',
  soon: '#5B2C8F',
  comfortable: 'rgba(10, 10, 10, 0.5)',
  none: 'rgba(10, 10, 10, 0.3)',
}
