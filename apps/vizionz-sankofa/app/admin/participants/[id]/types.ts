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
