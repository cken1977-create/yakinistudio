// VIZIONZ SANKOFA · /admin/obr — OBR & Readiness
//
// Two parts:
//   1. Organizational readiness (OBR): VS is the first organization to go
//      through the BRSA OBR standard. VS keeps the org intake + evidence
//      checklist here; a certified evaluator issues the rating, which is
//      recorded as an append-only decision record (standard version, rationale).
//   2. Individual readiness: where participants are in the readiness stages
//      (read from the client-flow stage data; scoped by RLS to what the
//      signed-in person may see).
// No readiness-vendor branding in VS operations (build brief v3, section 2).

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
  EmptyState,
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
  OBR_STATUS_LABELS,
  type CertificationStatus,
  type ObrStatus,
} from './types'

export const dynamic = 'force-dynamic'

type ProfileRow = {
  id: string
  is_self: boolean
  organization_id: string | null
  display_name: string
  status: ObrStatus
  updated_at: string
}
type RatingRow = {
  profile_id: string
  certification_status: CertificationStatus
  rating_label: string | null
  standard_version: string
  reviewed_on: string
  expires_on: string | null
  created_at: string
}
type ReadinessParticipant = {
  id: string
  first_name: string
  last_name: string
  preferred_name: string | null
  current_stage: string
  stage_changed_at: string | null
}

export default async function ObrPage() {
  const user = await requireOperatorOrEmployee()
  void touchLastActive(user.id)
  const role = getAccessRole(user)
  const canSeeObr = role === 'executive' || role === 'operator' || role === 'leadership_readonly'
  const canEdit = role === 'executive' || role === 'operator'

  const supabase = await createClient()

  // ── Organizational readiness ──────────────────────────────────────────
  let obrMissing = false
  let profiles: ProfileRow[] = []
  const latestRating = new Map<string, RatingRow>()
  const evidenceOnFile = new Map<string, number>()
  let partnerOptions: { id: string; name: string }[] = []

  if (canSeeObr) {
    const { data, error } = await supabase
      .from('vs_obr_profiles')
      .select('id, is_self, organization_id, display_name, status, updated_at')
      .order('is_self', { ascending: false })
      .order('display_name', { ascending: true })
    if (isMissingTable(error)) obrMissing = true
    profiles = (data ?? []) as unknown as ProfileRow[]

    if (!obrMissing && profiles.length > 0) {
      const ids = profiles.map((p) => p.id)
      const [{ data: ratings }, { data: evidence }] = await Promise.all([
        supabase
          .from('vs_obr_ratings')
          .select('profile_id, certification_status, rating_label, standard_version, reviewed_on, expires_on, created_at')
          .in('profile_id', ids)
          .order('created_at', { ascending: false }),
        supabase.from('vs_obr_evidence').select('profile_id, status').in('profile_id', ids),
      ])
      for (const r of (ratings ?? []) as unknown as RatingRow[]) {
        if (!latestRating.has(r.profile_id)) latestRating.set(r.profile_id, r)
      }
      for (const e of (evidence ?? []) as { profile_id: string; status: string }[]) {
        if (e.status !== 'missing') evidenceOnFile.set(e.profile_id, (evidenceOnFile.get(e.profile_id) ?? 0) + 1)
      }
    }

    if (!obrMissing && canEdit) {
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name, relationship_kind')
        .in('relationship_kind', ['partner', 'both'])
        .order('name', { ascending: true })
      const taken = new Set(profiles.map((p) => p.organization_id).filter(Boolean))
      partnerOptions = ((orgs ?? []) as { id: string; name: string }[]).filter((o) => !taken.has(o.id))
    }
  }

  const selfProfile = profiles.find((p) => p.is_self) ?? null
  const certifiedCount = profiles.filter((p) => latestRating.get(p.id)?.certification_status === 'certified').length

  // ── Individual readiness (client-flow stages) ─────────────────────────
  let stageMissing = false
  let readinessPeople: ReadinessParticipant[] = []
  {
    const { data, error } = await supabase
      .from('participants')
      .select('id, first_name, last_name, preferred_name, current_stage, stage_changed_at')
      .in('current_stage', ['readiness_evaluation', 'certified'])
      .order('stage_changed_at', { ascending: true })
      .limit(200)
    if (error) stageMissing = true
    readinessPeople = (data ?? []) as unknown as ReadinessParticipant[]
  }
  const { count: sentToReadiness } = await supabase
    .from('participants')
    .select('id', { count: 'exact', head: true })
    .not('legacyline_subject_id', 'is', null)

  const inEvaluation = readinessPeople.filter((p) => p.current_stage === 'readiness_evaluation')
  const certifiedPeople = readinessPeople.filter((p) => p.current_stage === 'certified')

  return (
    <div>
      <AdminCrumbs trail={[{ label: 'OBR & Readiness' }]} fallbackHref="/admin" fallbackLabel="Operations" />
      <PageIntro kicker="Readiness · OBR" title="OBR & Readiness">
        Organizational readiness (OBR) under the BRSA standard — Vizionz Sankofa is the first
        organization to go through it — and where participants stand in individual readiness.
        A certified evaluator issues every rating. Nothing here is scored automatically.
      </PageIntro>

      {canSeeObr && (
        <>
          <StatStrip>
            <Stat label="OBR profiles" value={obrMissing ? '—' : profiles.length} accent="#5B2C8F" />
            <Stat label="OBR certified" value={obrMissing ? '—' : certifiedCount} accent="#007A33" />
            <Stat label="In readiness evaluation" value={stageMissing ? '—' : inEvaluation.length} accent="#B45F00" />
            <Stat label="Participants certified" value={stageMissing ? '—' : certifiedPeople.length} />
          </StatStrip>

          <section style={{ marginBottom: '48px' }}>
            <SectionLabel>Organizational readiness (OBR)</SectionLabel>

            {obrMissing ? (
              <Notice>
                The OBR tables are not in the database yet. Apply migration{' '}
                <code>20261017000600_vs_obr_readiness.sql</code> to turn this section on.
              </Notice>
            ) : (
              <>
                {!selfProfile && (
                  <Card style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: SERIF, marginBottom: '6px' }}>
                      Vizionz Sankofa OBR
                    </div>
                    <p style={{ fontSize: '14px', color: 'rgba(10, 10, 10, 0.65)', margin: '0 0 14px', lineHeight: 1.55 }}>
                      Start the organizational readiness intake for VS: governance, staff, policy and
                      financial sections, plus the evidence checklist.
                    </p>
                    {canEdit ? (
                      <ObrStartClient mode="self" />
                    ) : (
                      <Meta>Not started yet. An executive or operator can start it.</Meta>
                    )}
                  </Card>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {profiles.map((p) => {
                    const r = latestRating.get(p.id)
                    const onFile = evidenceOnFile.get(p.id) ?? 0
                    const certTone =
                      r?.certification_status === 'certified'
                        ? TONES.green
                        : r?.certification_status === 'not_certified' || r?.certification_status === 'revoked'
                        ? TONES.red
                        : r?.certification_status === 'expired'
                        ? TONES.amber
                        : TONES.grey
                    return (
                      <Link key={p.id} href={`/admin/obr/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <Card style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ minWidth: 0, flex: '1 1 260px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
                              <h3 style={{ fontSize: '17px', fontWeight: 600, margin: 0, fontFamily: SERIF }}>{p.display_name}</h3>
                              {p.is_self && <Pill {...TONES.navy}>Vizionz Sankofa</Pill>}
                              <Pill>{OBR_STATUS_LABELS[p.status]}</Pill>
                              {r && <Pill {...certTone}>{CERTIFICATION_LABELS[r.certification_status]}</Pill>}
                            </div>
                            <Meta>
                              Evidence {onFile}/{EVIDENCE_ITEMS.length} on file
                              {r ? ` · ${r.rating_label ? r.rating_label + ' · ' : ''}Standard ${r.standard_version} · Reviewed ${formatDay(r.reviewed_on)}` : ' · No rating yet'}
                              {r?.expires_on ? ` · Expires ${formatDay(r.expires_on)}` : ''}
                            </Meta>
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#CE1126' }}>
                            Open →
                          </span>
                        </Card>
                      </Link>
                    )
                  })}
                </div>

                {canEdit && partnerOptions.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <ObrStartClient mode="partner" partners={partnerOptions} />
                  </div>
                )}
              </>
            )}
          </section>
        </>
      )}

      <section style={{ marginBottom: '32px' }}>
        <SectionLabel>Individual readiness</SectionLabel>
        <p style={{ fontSize: '14px', color: 'rgba(10, 10, 10, 0.65)', margin: '0 0 16px', lineHeight: 1.55, maxWidth: '680px' }}>
          Participants in the readiness evaluation or certified stage{role === 'case_manager' ? ' on your caseload' : ''}.
          {typeof sentToReadiness === 'number' ? ` ${sentToReadiness} participant${sentToReadiness === 1 ? '' : 's'} sent to readiness so far.` : ''}{' '}
          Scores and certification come back from the evaluator and show on each participant&apos;s file.
        </p>
        {stageMissing ? (
          <Notice>
            Client-flow stages are not in the database yet. Apply migration{' '}
            <code>20261017000500_vs_client_flow_and_voice.sql</code> to see readiness stages here.
          </Notice>
        ) : readinessPeople.length === 0 ? (
          <EmptyState title="No one in readiness yet">
            When a participant moves to the readiness evaluation stage they appear here.
          </EmptyState>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {readinessPeople.map((p) => (
              <Link key={p.id} href={`/admin/participants/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Card style={{ padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '15px', fontWeight: 600 }}>
                      {p.preferred_name || p.first_name} {p.last_name}
                    </span>
                    {p.current_stage === 'certified' ? (
                      <Pill {...TONES.green}>Certified</Pill>
                    ) : (
                      <Pill {...TONES.amber}>Readiness evaluation</Pill>
                    )}
                  </div>
                  <Meta>Since {formatDay(p.stage_changed_at)}</Meta>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
