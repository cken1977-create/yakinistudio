// VIZIONZ SANKOFA · /admin/participants/[id] · shared types

export type ContactMethod =
  | 'in_person'
  | 'phone'
  | 'text'
  | 'email'
  | 'video'
  | 'home_visit'
  | 'court'
  | 'group_session'

export type CaseNoteRecord = {
  id: string
  participant_id: string
  staff_id: string
  occurred_at: string
  duration_minutes: number | null
  contact_method: ContactMethod
  related_cohort_id: string | null
  subject: string | null
  content: string
  next_action: string | null
  next_action_due: string | null
  next_action_completed: boolean | null
  is_confidential: boolean | null
  created_at: string
  updated_at: string
}

export type CaseNoteEditableFields = {
  occurred_at: string
  duration_minutes: number | null
  contact_method: ContactMethod
  subject: string | null
  content: string
  next_action: string | null
  next_action_due: string | null
  is_confidential: boolean
}

export type CaseNoteWithStaff = CaseNoteRecord & {
  staff_full_name: string | null
  staff_role: string | null
}

export type TabKey = 'notes' | 'services' | 'documents' | 'assessments'

export const CONTACT_METHOD_LABELS: Record<ContactMethod, string> = {
  in_person: 'In Person',
  phone: 'Phone Call',
  text: 'Text Message',
  email: 'Email',
  video: 'Video Call',
  home_visit: 'Home Visit',
  court: 'Court Appearance',
  group_session: 'Group Session',
}

export const CONTACT_METHOD_ICONS: Record<ContactMethod, string> = {
  in_person: '🤝',
  phone: '📞',
  text: '💬',
  email: '✉️',
  video: '📹',
  home_visit: '🏠',
  court: '⚖️',
  group_session: '👥',
}

export const TAB_LABELS: Record<TabKey, string> = {
  notes: 'Case Notes',
  services: 'Services',
  documents: 'Documents',
  assessments: 'Assessments',
}


// ─── SERVICES (Wave 3.5) ───────────────────────────────────────────────────

export type ServiceOutcome =
  | 'completed'
  | 'partial'
  | 'no_show'
  | 'cancelled'
  | 'in_progress'

export type ServiceCategory =
  | 'Advocacy'
  | 'Basic Needs'
  | 'Case Management'
  | 'Programming'
  | 'Referral'

export type ServiceTypeRecord = {
  id: string
  slug: string
  name: string
  description: string | null
  category: string | null
  countable_unit: string | null
  is_active: boolean
}

export type ServiceDeliveredRecord = {
  id: string
  participant_id: string
  service_type_id: string
  delivered_by_id: string | null
  delivered_at: string
  units: number | null
  outcome: ServiceOutcome | null
  related_cohort_id: string | null
  notes: string | null
  cost_amount: string | null
  cost_funded_by: string | null
  created_at: string
}

export type ServiceWithJoins = ServiceDeliveredRecord & {
  service_type_name: string | null
  service_type_category: string | null
  service_type_unit: string | null
  delivered_by_name: string | null
}

export type ServiceEditableFields = {
  service_type_id: string
  delivered_at: string
  units: number | null
  outcome: ServiceOutcome | null
  notes: string | null
  cost_amount: string | null
  cost_funded_by: string | null
}

export const SERVICE_OUTCOME_LABELS: Record<ServiceOutcome, string> = {
  completed: 'Completed',
  partial: 'Partial',
  no_show: 'No Show',
  cancelled: 'Cancelled',
  in_progress: 'In Progress',
}

export const SERVICE_OUTCOME_COLORS: Record<
  ServiceOutcome,
  { bg: string; fg: string }
> = {
  completed: { bg: 'rgba(0, 122, 51, 0.12)', fg: '#007A33' },
  partial: { bg: 'rgba(180, 95, 0, 0.12)', fg: '#B45F00' },
  no_show: { bg: 'rgba(206, 17, 38, 0.12)', fg: '#CE1126' },
  cancelled: { bg: 'rgba(10, 10, 10, 0.08)', fg: 'rgba(10, 10, 10, 0.55)' },
  in_progress: { bg: 'rgba(91, 44, 143, 0.12)', fg: '#5B2C8F' },
}

export const SERVICE_CATEGORY_COLORS: Record<string, string> = {
  Advocacy: '#5B2C8F',
  'Basic Needs': '#CE1126',
  'Case Management': '#0A0A0A',
  Programming: '#007A33',
  Referral: '#B45F00',
}
