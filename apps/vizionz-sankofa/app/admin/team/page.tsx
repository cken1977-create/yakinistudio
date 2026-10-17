// VIZIONZ SANKOFA · /admin/team — invites, roles, activity, role-change history
// Executives and operators only (RLS enforces the same on every table here).

import { redirect } from 'next/navigation'
import { requireOperatorOrEmployee, touchLastActive, getAccessRole } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { AdminCrumbs } from '@/components/admin/nav/AdminCrumbs'
import { Notice, PageIntro, Stat, StatStrip, isMissingTable } from '@/components/admin/ui'
import { TeamClient } from './TeamClient'
import type { Activity, Invite, RoleChange, StaffOption, TeamMember } from './types'

export const dynamic = 'force-dynamic'

const ACCENT = '#0A2548'

export default async function TeamPage() {
  const user = await requireOperatorOrEmployee()
  void touchLastActive(user.id)
  const role = getAccessRole(user)
  if (role !== 'executive' && role !== 'operator') redirect('/admin/access-denied')

  const supabase = await createClient()
  const [members, invites, activity, changes, staff] = await Promise.all([
    supabase
      .from('vs_operators')
      .select('user_id, email, display_name, role, access_role, activated_at, last_active_at, revoked_at, created_at')
      .order('display_name', { ascending: true }),
    supabase.from('vs_invites').select('*').order('invited_at', { ascending: false }).limit(100),
    supabase.from('vs_operator_activity').select('*'),
    supabase
      .from('vs_audit_log')
      .select('id, occurred_at, actor_email, actor_role, record_id, details')
      .eq('action', 'ROLE_CHANGE')
      .order('occurred_at', { ascending: false })
      .limit(50),
    supabase.from('staff').select('id, full_name, email').is('auth_user_id', null).order('full_name'),
  ])

  const team = (members.data ?? []) as TeamMember[]
  const invitesMissing = isMissingTable(invites.error)
  const activityMissing = isMissingTable(activity.error)
  // Before 1100 is applied the ROLE_CHANGE filter just returns nothing.
  const roleChanges = (changes.data ?? []) as RoleChange[]
  const active = team.filter((m) => !m.revoked_at && m.role !== 'pending')
  const openInvites = ((invites.data ?? []) as Invite[]).filter((i) => !i.accepted_at && !i.revoked_at)

  return (
    <div>
      <AdminCrumbs trail={[{ label: 'Team' }]} fallbackHref="/admin" fallbackLabel="Operations" accent={ACCENT} />
      <PageIntro kicker="Team" title="Team & access" accent={ACCENT}>
        Invite staff with their role set up front, change roles, and see who is active. Every role change is written to the audit
        log.
      </PageIntro>
      {(invitesMissing || activityMissing) && (
        <Notice tone="amber">
          Some of this screen needs database updates that are not applied yet:{' '}
          {invitesMissing && <code>20261017001000_vs_invites.sql</code>} {activityMissing && <code>20261017001200_vs_profile_and_activity.sql</code>}
          . Ask Clarence to apply them.
        </Notice>
      )}
      <StatStrip>
        <Stat label="Active accounts" value={active.length} accent={ACCENT} />
        <Stat label="Open invites" value={invitesMissing ? '—' : openInvites.length} />
        <Stat label="Waiting for a role" value={team.filter((m) => !m.revoked_at && (m.role === 'pending' || !m.access_role)).length} />
        <Stat label="Role changes (last 50)" value={roleChanges.length} />
      </StatStrip>
      <TeamClient
        selfId={user.id}
        team={team}
        invites={(invites.data ?? []) as Invite[]}
        invitesMissing={invitesMissing}
        activity={(activity.data ?? []) as Activity[]}
        activityMissing={activityMissing}
        roleChanges={roleChanges}
        staff={(staff.data ?? []) as StaffOption[]}
      />
    </div>
  )
}
