// VIZIONZ SANKOFA · /admin/hr: Staff Records (executives and operators).
// Job descriptions, employee handbooks and the new-hire checklist. Staff see
// and acknowledge their own records in My Profile.

import { redirect } from 'next/navigation'
import { requireOperatorOrEmployee, touchLastActive, getAccessRole } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { AdminCrumbs } from '@/components/admin/nav/AdminCrumbs'
import { Notice, PageIntro, isMissingTable } from '@/components/admin/ui'
import { loadStaff } from '@/lib/crm/load'
import {
  HANDBOOK_VERSION_COLUMNS, JD_ASSIGNMENT_COLUMNS, JD_COLUMNS, ONBOARDING_COLUMNS,
  type Handbook, type HandbookAck, type HandbookAssignment, type HandbookVersion, type InviteLite,
  type JdAssignment, type JobDescription, type Onboarding,
} from '@/lib/hr/model'
import { HrClient } from './HrClient'

export const dynamic = 'force-dynamic'

export default async function HrPage() {
  const user = await requireOperatorOrEmployee()
  void touchLastActive(user.id)
  const role = getAccessRole(user)
  if (role !== 'executive' && role !== 'operator') redirect('/admin/access-denied')
  const supabase = await createClient()

  const [jds, jdAssign, hbs, hbVersions, hbAssign, acks, onboarding, invites, staff] = await Promise.all([
    supabase.from('vs_job_descriptions').select(JD_COLUMNS).order('title'),
    supabase.from('vs_jd_assignments').select(JD_ASSIGNMENT_COLUMNS).is('ended_at', null),
    supabase.from('vs_handbooks').select('id, title, description, archived_at').order('title'),
    supabase.from('vs_handbook_versions').select(HANDBOOK_VERSION_COLUMNS).order('version', { ascending: false }),
    supabase.from('vs_handbook_assignments').select('id, handbook_id, user_id, invite_id, assigned_at, ended_at').is('ended_at', null),
    supabase.from('vs_handbook_acks').select('version_id, user_id, read_at, signed_at, signed_name'),
    supabase.from('vs_onboarding').select(ONBOARDING_COLUMNS).order('created_at', { ascending: false }).limit(100),
    supabase.from('vs_invites').select('id, email, display_name, accepted_at, accepted_user_id, revoked_at').order('invited_at', { ascending: false }).limit(200),
    loadStaff(supabase),
  ])

  const missing = [jds.error, hbs.error, onboarding.error].some((e) => isMissingTable(e))

  return (
    <div>
      <AdminCrumbs trail={[{ label: 'Staff Records' }]} fallbackHref="/admin" fallbackLabel="Operations" />
      <PageIntro kicker="Staff Records" title="Job descriptions, handbooks and onboarding">
        Write job descriptions and handbooks, assign them, and see who has acknowledged and signed. Staff read and sign theirs in My Profile.
      </PageIntro>
      {missing ? (
        <Notice tone="amber">
          Staff records aren&apos;t set up in the database yet. Paste <code>20261017002100</code>, <code>002200</code> and <code>002300</code> in order.
        </Notice>
      ) : (
        <HrClient
          jds={(jds.data ?? []) as JobDescription[]}
          jdAssignments={(jdAssign.data ?? []) as JdAssignment[]}
          handbooks={(hbs.data ?? []) as Handbook[]}
          versions={(hbVersions.data ?? []) as HandbookVersion[]}
          hbAssignments={(hbAssign.data ?? []) as HandbookAssignment[]}
          acks={(acks.data ?? []) as HandbookAck[]}
          onboarding={(onboarding.data ?? []) as Onboarding[]}
          invites={(invites.data ?? []) as (InviteLite & { display_name: string | null })[]}
          staff={staff}
        />
      )}
    </div>
  )
}
