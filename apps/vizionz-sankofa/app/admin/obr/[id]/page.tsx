// VIZIONZ SANKOFA · /admin/obr/[id] — one OBR profile
// Intake sections, evidence checklist, and the rating history.

import { notFound } from 'next/navigation'
import {
  requireOperatorOrEmployee,
  touchLastActive,
  getAccessRole,
  getOperatorDisplayName,
} from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { AdminCrumbs } from '@/components/admin/nav/AdminCrumbs'
import { Notice, PageIntro, isMissingTable } from '@/components/admin/ui'
import { ObrDetailClient } from './ObrDetailClient'
import {
  OBR_PROFILE_COLUMNS,
  type DocumentOption,
  type ObrEvidence,
  type ObrProfile,
  type ObrRating,
} from '../types'

export const dynamic = 'force-dynamic'

export default async function ObrProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireOperatorOrEmployee()
  void touchLastActive(user.id)
  const role = getAccessRole(user)
  const canEdit = role === 'executive' || role === 'operator'

  const supabase = await createClient()
  const { data, error } = await supabase.from('vs_obr_profiles').select(OBR_PROFILE_COLUMNS).eq('id', id).maybeSingle()

  if (isMissingTable(error)) {
    return (
      <div>
        <AdminCrumbs trail={[{ label: 'OBR & Readiness', href: '/admin/obr' }, { label: 'OBR profile' }]} fallbackHref="/admin/obr" fallbackLabel="OBR & Readiness" />
        <PageIntro kicker="Readiness · OBR" title="OBR profile" />
        <Notice>
          The OBR tables are not in the database yet. Apply migration <code>20261017000600_vs_obr_readiness.sql</code>.
        </Notice>
      </div>
    )
  }
  if (error || !data) notFound()
  const profile = data as unknown as ObrProfile

  const [{ data: evidence }, { data: ratings }, { data: docs }] = await Promise.all([
    supabase
      .from('vs_obr_evidence')
      .select('id, profile_id, item_key, label, status, document_id, source, notes, attested_by_name, attested_at, updated_at')
      .eq('profile_id', id),
    supabase
      .from('vs_obr_ratings')
      .select(
        'id, profile_id, certification_status, rating_label, overall_score, domain_scores, standard_version, ' +
          'ruleset_hash, evaluation_run_id, evaluator_name, reviewed_on, evidence_reviewed, rationale, ' +
          'is_override, override_reason, expires_on, recorded_by_name, created_at',
      )
      .eq('profile_id', id)
      .order('created_at', { ascending: false }),
    canEdit || role === 'leadership_readonly'
      ? supabase
          .from('vs_documents')
          .select('id, title, category, document_date')
          .order('uploaded_at', { ascending: false })
          .limit(300)
      : Promise.resolve({ data: [] }),
  ])

  return (
    <div>
      <AdminCrumbs
        trail={[{ label: 'OBR & Readiness', href: '/admin/obr' }, { label: profile.display_name }]}
        fallbackHref="/admin/obr"
        fallbackLabel="OBR & Readiness"
      />
      <ObrDetailClient
        profile={profile}
        evidence={(evidence ?? []) as unknown as ObrEvidence[]}
        ratings={(ratings ?? []) as unknown as ObrRating[]}
        documents={(docs ?? []) as unknown as DocumentOption[]}
        canEdit={canEdit}
        operatorName={getOperatorDisplayName(user)}
      />
    </div>
  )
}
