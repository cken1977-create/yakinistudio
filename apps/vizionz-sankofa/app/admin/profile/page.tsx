// VIZIONZ SANKOFA · /admin/profile — My Profile (every signed-in role)
// Name and voice settings are changed through the self-service functions
// (vs_update_my_profile, vs_set_my_voice_settings): each can only touch the
// caller's own row, and neither can change a role.

import { requireOperatorOrEmployee, touchLastActive, getAccessRole, getOperatorDisplayName, roleBadgeLabel } from '@/lib/supabase/auth'
import { AdminCrumbs } from '@/components/admin/nav/AdminCrumbs'
import { Card, PageIntro, SectionLabel } from '@/components/admin/ui'
import { formatMountain } from '../team/types'
import { ProfileClient } from './ProfileClient'
import { MyHrRecords } from './MyHrRecords'
import { createClient } from '@/lib/supabase/server'
import {
  HANDBOOK_VERSION_COLUMNS, JD_ASSIGNMENT_COLUMNS, JD_COLUMNS, latestVersion,
  type Handbook, type HandbookAck, type HandbookVersion, type JdAssignment, type JobDescription,
} from '@/lib/hr/model'

export const dynamic = 'force-dynamic'

const ROLE_SCOPE: Record<string, string> = {
  executive: 'Full access to every participant, including revealing sensitive fields. Manages the team.',
  operator: 'Full access to every participant. Manages the team.',
  case_manager: 'Your own caseload only. Funder reports cover your caseload.',
  leadership_readonly: 'Reads everything, changes nothing. Intelligence is your landing page.',
}

export default async function ProfilePage() {
  const user = await requireOperatorOrEmployee()
  void touchLastActive(user.id)
  const role = getAccessRole(user)
  const op = user.operator

  // My HR records. Staff only get their own rows from RLS; executives/operators
  // can read everyone's, so filter to "assigned to me" (directly or via my accepted invite).
  const supabase = await createClient()
  const [jdA, hbA, myInvites, hbs, versions, acks] = await Promise.all([
    supabase.from('vs_jd_assignments').select(JD_ASSIGNMENT_COLUMNS).is('ended_at', null).order('assigned_at', { ascending: false }),
    supabase.from('vs_handbook_assignments').select('handbook_id, user_id, invite_id').is('ended_at', null),
    supabase.from('vs_invites').select('id').eq('accepted_user_id', user.id),
    supabase.from('vs_handbooks').select('id, title, description, archived_at').is('archived_at', null).order('title'),
    supabase.from('vs_handbook_versions').select(HANDBOOK_VERSION_COLUMNS),
    supabase.from('vs_handbook_acks').select('version_id, user_id, read_at, signed_at, signed_name').eq('user_id', user.id),
  ])
  const inviteIds = new Set(((myInvites.data ?? []) as { id: string }[]).map((i) => i.id))
  const canSeeAll = role === 'executive' || role === 'operator'
  const mine = (a: { user_id: string | null; invite_id: string | null }) =>
    a.user_id === user.id || (!!a.invite_id && (inviteIds.has(a.invite_id) || (!canSeeAll && !a.user_id)))
  const assignment = ((jdA.data ?? []) as JdAssignment[]).find(mine) ?? null
  const jd = assignment
    ? (((await supabase.from('vs_job_descriptions').select(JD_COLUMNS).eq('id', assignment.job_description_id).maybeSingle()).data ?? null) as JobDescription | null)
    : null
  const myHandbookIds = new Set(((hbA.data ?? []) as { handbook_id: string; user_id: string | null; invite_id: string | null }[]).filter(mine).map((a) => a.handbook_id))
  const hbList = ((hbs.data ?? []) as Handbook[]).filter((h) => myHandbookIds.has(h.id)).map((h) => {
    const latest = latestVersion((versions.data ?? []) as HandbookVersion[], h.id)
    return { handbook: h, latest, ack: latest ? ((acks.data ?? []) as HandbookAck[]).find((a) => a.version_id === latest.id) : undefined }
  })

  return (
    <div>
      <AdminCrumbs trail={[{ label: 'My Profile' }]} fallbackHref="/admin" fallbackLabel="Operations" />
      <PageIntro kicker="My Profile" title={getOperatorDisplayName(user)} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'start' }}>
        <Card>
          <SectionLabel>Account</SectionLabel>
          <dl style={{ margin: 0, fontSize: '14px', lineHeight: 1.6 }}>
            <dt style={{ fontWeight: 600 }}>Email</dt>
            <dd style={{ margin: '0 0 10px' }} data-testid="profile-email">{user.email}</dd>
            <dt style={{ fontWeight: 600 }}>Role</dt>
            <dd style={{ margin: '0 0 4px' }} data-testid="profile-role">{roleBadgeLabel(user)}</dd>
            <dd style={{ margin: '0 0 10px', color: 'rgba(10,10,10,0.6)' }}>
              {role ? ROLE_SCOPE[role] : 'No participant access yet. Ask an operator to assign your role.'}
            </dd>
            <dt style={{ fontWeight: 600 }}>Active since</dt>
            <dd style={{ margin: '0 0 10px' }}>{formatMountain(op.activated_at ?? op.created_at)}</dd>
          </dl>
          <p style={{ fontSize: '12px', color: 'rgba(10,10,10,0.55)', margin: 0 }}>
            Your role and email are set by an executive or operator on the Team screen.
          </p>
        </Card>
        <MyHrRecords jd={jd} assignment={assignment} handbooks={hbList} displayName={op.display_name ?? ''} />
        <ProfileClient
          displayName={op.display_name ?? ''}
          voice={{
            wakePhraseEnabled: !!op.wake_phrase_enabled,
            wakePhrase: op.wake_phrase ?? null,
            speakAnswers: op.speak_answers ?? true,
          }}
        />
      </div>
    </div>
  )
}
