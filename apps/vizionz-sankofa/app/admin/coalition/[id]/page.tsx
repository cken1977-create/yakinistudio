// VIZIONZ SANKOFA · /admin/coalition/[id] — one coalition partner
// Agreements (MOUs), check-ins and shared programs for one partner org.

import { notFound } from 'next/navigation'
import {
  requireOperatorOrEmployee,
  touchLastActive,
  getAccessRole,
  getOperatorDisplayName,
} from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { AdminCrumbs } from '@/components/admin/nav/AdminCrumbs'
import { isMissingTable, todayMountain } from '@/components/admin/ui'
import { PartnerDetailClient } from './PartnerDetailClient'
import {
  AGREEMENT_COLUMNS,
  CHECKIN_COLUMNS,
  PARTNER_ORG_COLUMNS,
  SHARED_PROGRAM_COLUMNS,
  type Agreement,
  type Checkin,
  type CohortOption,
  type DocumentOption,
  type PartnerOrg,
  type ProgramOption,
  type SharedProgram,
} from '../types'

export const dynamic = 'force-dynamic'

export default async function PartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireOperatorOrEmployee()
  void touchLastActive(user.id)
  const role = getAccessRole(user)
  const canEdit = role === 'executive' || role === 'operator'
  const canSeeCheckins = canEdit || role === 'leadership_readonly'

  const supabase = await createClient()
  const { data: orgData } = await supabase
    .from('organizations')
    .select(PARTNER_ORG_COLUMNS)
    .eq('id', id)
    .in('relationship_kind', ['partner', 'both'])
    .maybeSingle()
  if (!orgData) notFound()
  const org = orgData as unknown as PartnerOrg

  const [ag, ck, sp, programs, cohorts, docs] = await Promise.all([
    supabase.from('vs_partner_agreements').select(AGREEMENT_COLUMNS).eq('organization_id', id).order('created_at', { ascending: false }),
    canSeeCheckins
      ? supabase.from('vs_partner_checkins').select(CHECKIN_COLUMNS).eq('organization_id', id).order('occurred_on', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    supabase.from('vs_partner_programs').select(SHARED_PROGRAM_COLUMNS).eq('organization_id', id).order('created_at', { ascending: true }),
    supabase.from('programs').select('id, name').order('name', { ascending: true }),
    supabase.from('cohorts').select('id, name, program_id').order('start_date', { ascending: false }),
    canEdit
      ? supabase.from('vs_documents').select('id, title, category').order('uploaded_at', { ascending: false }).limit(300)
      : Promise.resolve({ data: [], error: null }),
  ])
  const missing = isMissingTable(ag.error) || isMissingTable(sp.error) || isMissingTable(ck.error)

  return (
    <div>
      <AdminCrumbs
        trail={[{ label: 'Coalition Partners', href: '/admin/coalition' }, { label: org.short_name || org.name }]}
        fallbackHref="/admin/coalition"
        fallbackLabel="Coalition Partners"
      />
      <PartnerDetailClient
        org={org}
        agreements={(ag.data ?? []) as unknown as Agreement[]}
        checkins={(ck.data ?? []) as unknown as Checkin[]}
        sharedPrograms={(sp.data ?? []) as unknown as SharedProgram[]}
        programs={(programs.data ?? []) as unknown as ProgramOption[]}
        cohorts={(cohorts.data ?? []) as unknown as CohortOption[]}
        documents={(docs.data ?? []) as unknown as DocumentOption[]}
        canEdit={canEdit}
        canSeeCheckins={canSeeCheckins}
        tablesMissing={missing}
        operatorName={getOperatorDisplayName(user)}
        today={todayMountain()}
      />
    </div>
  )
}
