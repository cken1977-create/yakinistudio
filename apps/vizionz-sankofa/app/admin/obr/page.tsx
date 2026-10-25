// VIZIONZ SANKOFA · /admin/obr — Organizational Behavioral Readiness (OBR)
//
// OBR is VS's own onboarding / intake that measures Vizionz Sankofa's
// organizational behavioral readiness for Yakini (BRSA standard). VS staff
// complete the intake and upload evidence for the checklist; Clarence
// monitors it from his side through the read-only export
// public.vs_obr_monitor_summary(). A certified evaluator issues the rating,
// recorded as an append-only decision (standard version, rationale).
// Executive / operator edit; leadership_readonly reads; case managers have
// no access (RLS enforces the same).

import Link from 'next/link'
import {
  requireOperatorOrEmployee,
  touchLastActive,
  getAccessRole,
} from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { AdminCrumbs } from '@/components/admin/nav/AdminCrumbs'
import {
  Card,
  Meta,
  Notice,
  PageIntro,
  Pill,
  SectionLabel,
  SERIF,
  Stat,
  StatStrip,
  TONES,
  formatDay,
  isMissingTable,
} from '@/components/admin/ui'
import { ObrStartClient } from './ObrStartClient'
import {
  CERTIFICATION_LABELS,
  EVIDENCE_ITEMS,
  EVIDENCE_STATUS_LABELS,
  OBR_FULL_NAME,
  OBR_STATUS_LABELS,
  type CertificationStatus,
  type EvidenceStatus,
  type ObrStatus,
} from './types'

export const dynamic = 'force-dynamic'

type ProfileRow = { id: string; status: ObrStatus; updated_at: string; submitted_at: string | null }
type RatingRow = {
  certification_status: CertificationStatus
  rating_label: string | null
  standard_version: string
  reviewed_on: string
  expires_on: string | null
}
type EvidenceRow = { id: string; item_key: string; status: EvidenceStatus }

export default async function ObrPage() {
  const user = await requireOperatorOrEmployee()
  void touchLastActive(user.id)
  const role = getAccessRole(user)
  const canSeeObr = role === 'executive' || role === 'operator' || role === 'leadership_readonly'
  const canEdit = role === 'executive' || role === 'operator'

  const crumbs = <AdminCrumbs trail={[{ label: 'OBR' }]} fallbackHref="/admin" fallbackLabel="Operations" />

  if (!canSeeObr) {
    return (
      <div>
        {crumbs}
        <PageIntro kicker="OBR" title={OBR_FULL_NAME} />
        <Notice>OBR is available to executives, operators and leadership.</Notice>
      </div>
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('vs_obr_profiles')
    .select('id, status, updated_at, submitted_at')
    .eq('is_self', true)
    .maybeSingle()
  const missing = isMissingTable(error)
  const profile = (data ?? null) as ProfileRow | null

  let evidence: EvidenceRow[] = []
  const filesByEvidence = new Map<string, number>()
  let latest: RatingRow | null = null
  if (profile) {
    const [{ data: ev }, { data: files }, { data: ratings }] = await Promise.all([
      supabase.from('vs_obr_evidence').select('id, item_key, status').eq('profile_id', profile.id),
      supabase.from('vs_obr_evidence_files').select('evidence_id').eq('profile_id', profile.id),
      supabase
        .from('vs_obr_ratings')
        .select('certification_status, rating_label, standard_version, reviewed_on, expires_on')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1),
    ])
    evidence = (ev ?? []) as EvidenceRow[]
    for (const f of (files ?? []) as { evidence_id: string }[]) {
      filesByEvidence.set(f.evidence_id, (filesByEvidence.get(f.evidence_id) ?? 0) + 1)
    }
    latest = ((ratings ?? [])[0] ?? null) as RatingRow | null
  }

  const byKey = new Map(evidence.map((e) => [e.item_key, e]))
  const complete = EVIDENCE_ITEMS.filter((i) => {
    const s = byKey.get(i.key)?.status
    return s === 'on_file' || s === 'verified'
  }).length
  const pct = Math.round((1000 * complete) / EVIDENCE_ITEMS.length) / 10
  const fileCount = [...filesByEvidence.values()].reduce((a, b) => a + b, 0)

  return (
    <div>
      {crumbs}
      <PageIntro kicker="OBR · Vizionz Sankofa" title={OBR_FULL_NAME}>
        VS&apos;s own OBR intake under the BRSA standard. Staff complete the intake sections and
        upload evidence for each checklist item; the Yakini team can follow progress to support you. A
        certified evaluator issues the rating. Nothing here is scored automatically.
      </PageIntro>

      {missing ? (
        <Notice>
          The OBR tables are not in the database yet. Apply migration{' '}
          <code>20261017000600_vs_obr_readiness.sql</code> to turn this section on.
        </Notice>
      ) : !profile ? (
        <Card>
          <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: SERIF, marginBottom: '6px' }}>
            Start the VS OBR intake
          </div>
          <p style={{ fontSize: '14px', color: 'rgba(10, 10, 10, 0.65)', margin: '0 0 14px', lineHeight: 1.55 }}>
            Governance, staff, policy and financial sections, plus the evidence checklist with
            document uploads.
          </p>
          {canEdit ? <ObrStartClient /> : <Meta>Not started yet. An executive or operator can start it.</Meta>}
        </Card>
      ) : (
        <>
          <StatStrip>
            <Stat label="Status" value={OBR_STATUS_LABELS[profile.status]} accent="#5B2C8F" />
            <Stat label="Checklist complete" value={`${pct}%`} accent="#007A33" />
            <Stat label="Evidence files" value={fileCount} />
            <Stat
              label="Evaluator decision"
              value={latest ? CERTIFICATION_LABELS[latest.certification_status] : 'None yet'}
              accent="#B45F00"
            />
          </StatStrip>

          <Link href={`/admin/obr/${profile.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <Card style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
              <div style={{ minWidth: 0, flex: '1 1 260px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '17px', fontWeight: 600, margin: 0, fontFamily: SERIF }}>Vizionz Sankofa OBR intake</h3>
                  <Pill>{OBR_STATUS_LABELS[profile.status]}</Pill>
                  {latest && (
                    <Pill {...(latest.certification_status === 'certified' ? TONES.green : TONES.grey)}>
                      {CERTIFICATION_LABELS[latest.certification_status]}
                    </Pill>
                  )}
                </div>
                <Meta>
                  Evidence {complete}/{EVIDENCE_ITEMS.length} on file · {fileCount} file{fileCount === 1 ? '' : 's'} uploaded
                  {latest ? ` · Standard ${latest.standard_version} · Reviewed ${formatDay(latest.reviewed_on)}` : ''}
                  {latest?.expires_on ? ` · Expires ${formatDay(latest.expires_on)}` : ''}
                  {' · '}Updated {formatDay(profile.updated_at)}
                </Meta>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#CE1126' }}>
                Open →
              </span>
            </Card>
          </Link>

          <SectionLabel>Evidence checklist</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {EVIDENCE_ITEMS.map((item) => {
              const row = byKey.get(item.key)
              const status: EvidenceStatus = row?.status ?? 'missing'
              const n = row ? filesByEvidence.get(row.id) ?? 0 : 0
              const tone = status === 'verified' ? TONES.green : status === 'on_file' ? TONES.purple : TONES.grey
              return (
                <Link
                  key={item.key}
                  href={`/admin/obr/${profile.id}?tab=evidence`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <Card style={{ padding: '12px 18px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '15px', fontWeight: 600 }}>{item.label}</span>
                    <span style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Meta>{n} file{n === 1 ? '' : 's'}</Meta>
                      <Pill {...tone}>{EVIDENCE_STATUS_LABELS[status]}</Pill>
                    </span>
                  </Card>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
