// VIZIONZ SANKOFA · /admin/profile — My Profile (every signed-in role)
// Name and voice settings are changed through the self-service functions
// (vs_update_my_profile, vs_set_my_voice_settings): each can only touch the
// caller's own row, and neither can change a role.

import { requireOperatorOrEmployee, touchLastActive, getAccessRole, getOperatorDisplayName, roleBadgeLabel } from '@/lib/supabase/auth'
import { AdminCrumbs } from '@/components/admin/nav/AdminCrumbs'
import { Card, PageIntro, SectionLabel } from '@/components/admin/ui'
import { formatMountain } from '../team/types'
import { ProfileClient } from './ProfileClient'

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
