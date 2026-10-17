import type { VsAccessRole, VsOperatorRole } from '@/lib/supabase/auth'

export type TeamMember = {
  user_id: string
  email: string
  display_name: string | null
  role: VsOperatorRole
  access_role: VsAccessRole | null
  activated_at: string | null
  last_active_at: string | null
  revoked_at: string | null
  created_at: string
}

export type Invite = {
  id: string
  email: string
  display_name: string | null
  access_role: VsAccessRole
  staff_id: string | null
  invited_by: string | null
  invited_at: string
  accepted_at: string | null
  revoked_at: string | null
}

export type Activity = {
  actor_user_id: string
  actor_email: string | null
  actions_7d: number
  actions_30d: number
  contacts_30d: number
  questions_30d: number
  exports_30d: number
  last_action_at: string | null
}

export type RoleChange = {
  id: string
  occurred_at: string
  actor_email: string | null
  actor_role: string | null
  record_id: string | null
  details: {
    email?: string
    from?: { role?: string; access_role?: string | null; revoked?: boolean } | null
    to?: { role?: string; access_role?: string | null; revoked?: boolean }
    via_invite?: string | null
  } | null
}

export type StaffOption = { id: string; full_name: string | null; email: string | null }

export const ROLE_OPTIONS: { value: VsAccessRole; label: string; help: string }[] = [
  { value: 'case_manager', label: 'Case manager', help: 'Own caseload only. No OBR.' },
  { value: 'leadership_readonly', label: 'Leadership (read-only)', help: 'Reads everything, edits nothing. Intelligence first.' },
  { value: 'operator', label: 'Operator', help: 'Full participant access; manages the team.' },
  { value: 'executive', label: 'Executive', help: 'Full access, including sensitive-field reveals.' },
]

/** vs_operators.role that goes with an access role (principal is kept). */
export function accountRoleFor(access: VsAccessRole, current?: VsOperatorRole): VsOperatorRole {
  if (access === 'executive' || access === 'operator') return current === 'principal' ? 'principal' : 'operator'
  return 'employee'
}

export function formatMountain(ts: string | null | undefined): string {
  if (!ts) return '—'
  return (
    new Date(ts).toLocaleString('en-US', {
      timeZone: 'America/Denver',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }) + ' MT'
  )
}
