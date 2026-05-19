// VIZIONZ SANKOFA · /admin/cohorts/[id] · shared types

import type {
  CohortRecord,
  CohortStatus,
  EnrollmentStatus,
} from '../types'

export type { CohortRecord, CohortStatus, EnrollmentStatus }
export {
  COHORT_STATUS_LABELS,
  COHORT_STATUS_COLORS,
  ENROLLMENT_STATUS_LABELS,
} from '../types'

export type EnrollmentRecord = {
  id: string
  participant_id: string
  cohort_id: string
  status: EnrollmentStatus
  enrolled_at: string
  completed_at: string | null
  withdrew_at: string | null
  withdrawal_reason: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type EnrollmentWithParticipant = EnrollmentRecord & {
  participant_first_name: string
  participant_last_name: string
  participant_preferred_name: string | null
  participant_status: string | null
}

export type CohortDetailWithJoins = CohortRecord & {
  program_name: string | null
  program_icon: string | null
  program_slug: string | null
  facilitator_name: string | null
}

export type AvailableParticipant = {
  id: string
  first_name: string
  last_name: string
  preferred_name: string | null
  status: string | null
  city: string | null
}

export type EnrollmentEditableFields = {
  status: EnrollmentStatus
  completed_at: string | null
  withdrew_at: string | null
  withdrawal_reason: string | null
  notes: string | null
}

export const ENROLLMENT_STATUS_COLORS: Record<
  EnrollmentStatus,
  { bg: string; fg: string }
> = {
  enrolled: { bg: 'rgba(91, 44, 143, 0.12)', fg: '#5B2C8F' },
  active: { bg: 'rgba(0, 122, 51, 0.12)', fg: '#007A33' },
  completed: { bg: 'rgba(0, 85, 34, 0.12)', fg: '#005522' },
  withdrew: { bg: 'rgba(206, 17, 38, 0.12)', fg: '#CE1126' },
  transferred: { bg: 'rgba(180, 95, 0, 0.12)', fg: '#B45F00' },
}
