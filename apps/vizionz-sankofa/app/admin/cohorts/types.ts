// VIZIONZ SANKOFA · /admin/cohorts · shared types

export type CohortStatus =
  | 'planned'
  | 'recruiting'
  | 'active'
  | 'completed'
  | 'cancelled'

export type EnrollmentStatus =
  | 'enrolled'
  | 'active'
  | 'completed'
  | 'withdrew'
  | 'transferred'

export type CohortRecord = {
  id: string
  program_id: string
  name: string
  slug: string | null
  cohort_number: number | null
  start_date: string
  end_date: string | null
  meeting_schedule: string | null
  capacity: number | null
  status: CohortStatus
  primary_facilitator_id: string | null
  internal_notes: string | null
  created_at: string
  updated_at: string
}

export type CohortWithJoins = CohortRecord & {
  program_name: string | null
  program_icon: string | null
  facilitator_name: string | null
  enrollment_count: number
}

export type CohortEditableFields = {
  program_id: string
  name: string
  cohort_number: number | null
  start_date: string
  end_date: string | null
  meeting_schedule: string | null
  capacity: number | null
  status: CohortStatus
  primary_facilitator_id: string | null
  internal_notes: string | null
}

export type ProgramOption = {
  id: string
  name: string
  icon_emoji: string | null
  is_active: boolean
}

export type StaffOption = {
  id: string
  full_name: string
  role: string | null
}

export const COHORT_STATUS_LABELS: Record<CohortStatus, string> = {
  planned: 'Planned',
  recruiting: 'Recruiting',
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const COHORT_STATUS_COLORS: Record<
  CohortStatus,
  { bg: string; fg: string }
> = {
  planned: { bg: 'rgba(91, 44, 143, 0.12)', fg: '#5B2C8F' },
  recruiting: { bg: 'rgba(180, 95, 0, 0.12)', fg: '#B45F00' },
  active: { bg: 'rgba(0, 122, 51, 0.12)', fg: '#007A33' },
  completed: { bg: 'rgba(10, 10, 10, 0.08)', fg: 'rgba(10, 10, 10, 0.55)' },
  cancelled: { bg: 'rgba(206, 17, 38, 0.12)', fg: '#CE1126' },
}

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  enrolled: 'Enrolled',
  active: 'Active',
  completed: 'Completed',
  withdrew: 'Withdrew',
  transferred: 'Transferred',
}
