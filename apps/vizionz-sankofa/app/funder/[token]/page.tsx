// VIZIONZ SANKOFA · /funder/[token] (Wave 3 — closes Wave 3)
//
// Public funder portal. Token IS the auth. Uses service-role client to
// bypass RLS, validates token, increments view count, fetches data scoped
// to this funder's name/short_name via cost_funded_by match.
//
// Truth-as-aesthetic: shows every service including no-shows and
// withdrawals. Substrate eyebrows, monospace metadata, dense numerical
// presentation. Funder sees what Khadijah sees.

import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { FunderPortalClient } from './FunderPortalClient'
import type {
  FunderTokenResolved,
  FunderServiceRow,
  FunderParticipantSummary,
  FunderCohortSummary,
  FunderCategoryRollup,
  FunderPortalData,
} from './types'

export const dynamic = 'force-dynamic'

export default async function FunderPortalPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const admin = createAdminClient()

  // 1. Resolve token → organization
  const { data: tokenData, error: tokenError } = await admin
    .from('funder_access_tokens')
    .select(
      'id, organization_id, view_count, last_viewed_at, is_revoked, notes, ' +
        'organization:organization_id (name, short_name, type)',
    )
    .eq('token', token)
    .maybeSingle()

  if (tokenError || !tokenData) {
    notFound()
  }

  type TokenJoin = {
    id: string
    organization_id: string
    view_count: number
    last_viewed_at: string | null
    is_revoked: boolean
    notes: string | null
    organization: {
      name: string
      short_name: string | null
      type: string
    } | null
  }

  const t = tokenData as unknown as TokenJoin

  if (t.is_revoked) {
    return <RevokedScreen />
  }

  if (!t.organization) {
    notFound()
  }

  const funder: FunderTokenResolved = {
    token_id: t.id,
    organization_id: t.organization_id,
    organization_name: t.organization.name,
    organization_short_name: t.organization.short_name,
    organization_type: t.organization.type,
    is_revoked: t.is_revoked,
    view_count: t.view_count,
    last_viewed_at: t.last_viewed_at,
    token_note: t.notes,
  }

  // 2. Increment view count + update last_viewed_at (fire-and-forget)
  void admin
    .from('funder_access_tokens')
    .update({
      view_count: t.view_count + 1,
      last_viewed_at: new Date().toISOString(),
    })
    .eq('id', t.id)
    .then(() => {})

  // 3. Build matching patterns for cost_funded_by
  // Match against name OR short_name, case-insensitive
  const matchPatterns: string[] = [funder.organization_name]
  if (
    funder.organization_short_name &&
    funder.organization_short_name.trim().length > 0
  ) {
    matchPatterns.push(funder.organization_short_name)
  }

  // 4. Fetch services scoped to this funder
  const { data: servicesData } = await admin
    .from('services_delivered')
    .select(
      'id, participant_id, delivered_at, units, outcome, cost_amount, notes, ' +
        'cost_funded_by, ' +
        'service_type:service_type_id (name, category, countable_unit), ' +
        'participant:participant_id (first_name, last_name, preferred_name)',
    )
    .or(
      matchPatterns
        .map((p) => `cost_funded_by.ilike.${escapeForOr(p)}`)
        .join(','),
    )
    .order('delivered_at', { ascending: false })

  type ServiceJoin = {
    id: string
    participant_id: string
    delivered_at: string
    units: number | null
    outcome: string | null
    cost_amount: string | null
    notes: string | null
    cost_funded_by: string | null
    service_type: {
      name: string | null
      category: string | null
      countable_unit: string | null
    } | null
    participant: {
      first_name: string
      last_name: string
      preferred_name: string | null
    } | null
  }

  const rawServices = (servicesData ?? []) as unknown as ServiceJoin[]

  const services: FunderServiceRow[] = rawServices.map((s) => ({
    id: s.id,
    service_name: s.service_type?.name ?? null,
    service_category: s.service_type?.category ?? null,
    service_unit: s.service_type?.countable_unit ?? null,
    delivered_at: s.delivered_at,
    units: s.units,
    outcome: s.outcome,
    cost_amount: s.cost_amount,
    notes: s.notes,
    participant_first_name: s.participant?.first_name ?? '',
    participant_last_name: s.participant?.last_name ?? '',
    participant_preferred_name: s.participant?.preferred_name ?? null,
  }))

  // 5. Aggregate participants from services
  const participantIdsSet = new Set(rawServices.map((s) => s.participant_id))
  const participantIds = Array.from(participantIdsSet)

  const participantsById = new Map<string, FunderParticipantSummary>()

  // Initialize from services
  for (const s of rawServices) {
    if (!participantsById.has(s.participant_id)) {
      participantsById.set(s.participant_id, {
        participant_id: s.participant_id,
        first_name: s.participant?.first_name ?? '',
        last_name: s.participant?.last_name ?? '',
        preferred_name: s.participant?.preferred_name ?? null,
        city: null,
        status: null,
        intake_date: null,
        service_count: 0,
        total_units: 0,
        total_cost: 0,
        baseline_composite: null,
        most_recent_composite: null,
        trajectory: null,
      })
    }
    const p = participantsById.get(s.participant_id)!
    p.service_count += 1
    p.total_units += s.units ?? 0
    p.total_cost += Number(s.cost_amount ?? 0)
  }

  // Enrich participants with profile + assessment data
  if (participantIds.length > 0) {
    const { data: pData } = await admin
      .from('participants')
      .select('id, city, status, intake_date')
      .in('id', participantIds)

    if (pData) {
      for (const row of pData as {
        id: string
        city: string | null
        status: string | null
        intake_date: string | null
      }[]) {
        const p = participantsById.get(row.id)
        if (p) {
          p.city = row.city
          p.status = row.status
          p.intake_date = row.intake_date
        }
      }
    }

    // Pull assessments for trajectory
    const { data: assessData } = await admin
      .from('assessments')
      .select('participant_id, assessed_at, composite_score')
      .in('participant_id', participantIds)
      .order('assessed_at', { ascending: true })

    if (assessData) {
      const byParticipant = new Map<
        string,
        { date: string; score: number }[]
      >()
      for (const a of assessData as {
        participant_id: string
        assessed_at: string
        composite_score: string | null
      }[]) {
        if (a.composite_score === null) continue
        const score = Number(a.composite_score)
        const existing = byParticipant.get(a.participant_id) ?? []
        existing.push({ date: a.assessed_at, score })
        byParticipant.set(a.participant_id, existing)
      }

      for (const [pid, history] of byParticipant.entries()) {
        const p = participantsById.get(pid)
        if (!p || history.length === 0) continue
        p.baseline_composite = history[0].score
        p.most_recent_composite = history[history.length - 1].score
        if (history.length > 1) {
          p.trajectory = p.most_recent_composite - p.baseline_composite
        }
      }
    }
  }

  const participants = Array.from(participantsById.values()).sort((a, b) =>
    a.last_name.localeCompare(b.last_name),
  )

  // 6. Aggregate category rollups
  const categoryMap = new Map<string, FunderCategoryRollup>()
  for (const s of rawServices) {
    const cat = s.service_type?.category ?? 'Other'
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, {
        category: cat,
        service_count: 0,
        unit_count: 0,
        total_cost: 0,
        outcomes: {
          completed: 0,
          partial: 0,
          no_show: 0,
          cancelled: 0,
          in_progress: 0,
        },
      })
    }
    const rollup = categoryMap.get(cat)!
    rollup.service_count += 1
    rollup.unit_count += s.units ?? 0
    rollup.total_cost += Number(s.cost_amount ?? 0)
    if (s.outcome && s.outcome in rollup.outcomes) {
      rollup.outcomes[s.outcome as keyof typeof rollup.outcomes] += 1
    }
  }
  const category_rollups = Array.from(categoryMap.values()).sort((a, b) =>
    b.service_count - a.service_count,
  )

  // 7. Fetch cohorts where funded participants were enrolled
  const cohorts: FunderCohortSummary[] = []
  if (participantIds.length > 0) {
    const { data: enrollData } = await admin
      .from('enrollments')
      .select(
        'participant_id, cohort_id, ' +
          'cohort:cohort_id (name, start_date, end_date, status, ' +
          '  program:program_id (name, icon_emoji))',
      )
      .in('participant_id', participantIds)

    type EnrollJoin = {
      participant_id: string
      cohort_id: string
      cohort: {
        name: string
        start_date: string
        end_date: string | null
        status: string
        program: { name: string | null; icon_emoji: string | null } | null
      } | null
    }

    const cohortMap = new Map<string, FunderCohortSummary>()
    for (const e of (enrollData ?? []) as unknown as EnrollJoin[]) {
      if (!e.cohort) continue
      const existing = cohortMap.get(e.cohort_id)
      if (existing) {
        existing.funded_participant_count += 1
      } else {
        cohortMap.set(e.cohort_id, {
          cohort_id: e.cohort_id,
          cohort_name: e.cohort.name,
          program_name: e.cohort.program?.name ?? null,
          program_icon: e.cohort.program?.icon_emoji ?? null,
          start_date: e.cohort.start_date,
          end_date: e.cohort.end_date,
          status: e.cohort.status,
          funded_participant_count: 1,
        })
      }
    }
    cohorts.push(
      ...Array.from(cohortMap.values()).sort((a, b) =>
        b.start_date.localeCompare(a.start_date),
      ),
    )
  }

  // 8. Totals
  const totalCost = services.reduce(
    (sum, s) => sum + Number(s.cost_amount ?? 0),
    0,
  )
  const totalUnits = services.reduce((sum, s) => sum + (s.units ?? 0), 0)

  const data: FunderPortalData = {
    funder,
    participants,
    services,
    cohorts,
    category_rollups,
    totals: {
      participant_count: participants.length,
      service_count: services.length,
      unit_count: totalUnits,
      total_cost: totalCost,
      cohort_count: cohorts.length,
    },
    last_updated_at: new Date().toISOString(),
  }

  return <FunderPortalClient data={data} />
}

function escapeForOr(value: string): string {
  // Escape commas and parens in the value for Supabase .or() syntax
  const escaped = value.replace(/([(),])/g, '\\$1')
  return `%${escaped}%`
}

function RevokedScreen() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#FAFAF8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          textAlign: 'center',
          padding: '40px',
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid rgba(10, 10, 10, 0.1)',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#CE1126',
            marginBottom: '12px',
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          }}
        >
          Link Revoked
        </div>
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 600,
            color: '#0A0A0A',
            marginBottom: '12px',
            fontFamily: '"DM Serif Display", Georgia, serif',
          }}
        >
          This portal link is no longer active
        </h1>
        <p
          style={{
            fontSize: '14px',
            lineHeight: 1.6,
            color: 'rgba(10, 10, 10, 0.65)',
            marginBottom: '24px',
          }}
        >
          Vizionz Sankofa has revoked this access link. Please contact Khadijah
          Asili directly for an updated link or to request access.
        </p>
        <a
          href="mailto:khadijahasili@vizionz.org"
          style={{
            display: 'inline-block',
            padding: '10px 18px',
            border: '1px solid #0A0A0A',
            background: '#0A0A0A',
            color: '#FFFFFF',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Contact Vizionz Sankofa
        </a>
      </div>
    </main>
  )
}
