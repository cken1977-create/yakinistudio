// VIZIONZ SANKOFA · /admin/cohorts (Wave 3)
//
// Cohorts management surface. Server component pulls cohorts joined with
// programs, facilitator, and live enrollment counts. Client wrapper handles
// search, status filter, add modal.

import {
  requireOperatorOrEmployee,
  touchLastActive,
  getOperatorDisplayName,
} from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { CohortsListClient } from './CohortsListClient'
import type {
  CohortRecord,
  CohortWithJoins,
  ProgramOption,
  StaffOption,
} from './types'

export const dynamic = 'force-dynamic'

export default async function CohortsPage() {
  const user = await requireOperatorOrEmployee()
  void touchLastActive(user.id)

  const supabase = await createClient()

  // Fetch cohorts joined with programs + facilitator staff
  const { data: cohortsData, error: cohortsError } = await supabase
    .from('cohorts')
    .select(
      'id, program_id, name, slug, cohort_number, start_date, end_date, ' +
        'meeting_schedule, capacity, status, primary_facilitator_id, ' +
        'internal_notes, created_at, updated_at, ' +
        'program:program_id (name, icon_emoji), ' +
        'facilitator:primary_facilitator_id (full_name)',
    )
    .order('start_date', { ascending: false })

  type CohortJoin = CohortRecord & {
    program: { name: string | null; icon_emoji: string | null } | null
    facilitator: { full_name: string | null } | null
  }

  const rawCohorts = (
    cohortsError ? [] : (cohortsData ?? [])
  ) as unknown as CohortJoin[]

  // Fetch enrollment counts per cohort (one round-trip)
  const cohortIds = rawCohorts.map((c) => c.id)
  const enrollmentCounts = new Map<string, number>()

  if (cohortIds.length > 0) {
    const { data: enrollmentData } = await supabase
      .from('enrollments')
      .select('cohort_id, status')
      .in('cohort_id', cohortIds)
      .in('status', ['enrolled', 'active', 'completed'])

    if (enrollmentData) {
      for (const row of enrollmentData as { cohort_id: string }[]) {
        enrollmentCounts.set(
          row.cohort_id,
          (enrollmentCounts.get(row.cohort_id) ?? 0) + 1,
        )
      }
    }
  }

  const cohorts: CohortWithJoins[] = rawCohorts.map((c) => ({
    ...c,
    program_name: c.program?.name ?? null,
    program_icon: c.program?.icon_emoji ?? null,
    facilitator_name: c.facilitator?.full_name ?? null,
    enrollment_count: enrollmentCounts.get(c.id) ?? 0,
  }))

  // Fetch active programs for the program dropdown in add modal
  const { data: programsData } = await supabase
    .from('programs')
    .select('id, name, icon_emoji, is_active')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  const programs = (programsData ?? []) as unknown as ProgramOption[]

  // Fetch active staff for facilitator dropdown
  const { data: staffData } = await supabase
    .from('staff')
    .select('id, full_name, role')
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  const staff = (staffData ?? []) as unknown as StaffOption[]

  // Substrate counts
  const totalCount = cohorts.length
  const activeCount = cohorts.filter((c) => c.status === 'active').length
  const recruitingCount = cohorts.filter(
    (c) => c.status === 'recruiting',
  ).length
  const totalEnrollments = cohorts.reduce(
    (sum, c) => sum + c.enrollment_count,
    0,
  )

  const greetingName = getOperatorDisplayName(user)

  return (
    <div>
      {/* Welcome strip */}
      <section style={{ marginBottom: '40px' }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#5B2C8F',
            marginBottom: '12px',
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          }}
        >
          Substrate · Wave 3
        </div>
        <h1
          style={{
            fontSize: '36px',
            lineHeight: 1.15,
            fontWeight: 600,
            color: '#0A0A0A',
            marginBottom: '12px',
            fontFamily: '"DM Serif Display", Georgia, serif',
          }}
        >
          Cohorts
        </h1>
        <p
          style={{
            fontSize: '16px',
            lineHeight: 1.6,
            color: 'rgba(10, 10, 10, 0.65)',
            maxWidth: '640px',
          }}
        >
          Specific instances of every program — when it runs, who facilitates,
          who's enrolled, {greetingName}. The operational layer between
          programs (what we do) and participants (who we serve).
        </p>
      </section>

      {/* Substrate readiness strip */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1px',
          background: 'rgba(10, 10, 10, 0.08)',
          marginBottom: '32px',
          border: '1px solid rgba(10, 10, 10, 0.08)',
        }}
      >
        <SubstrateStat label="Total Cohorts" value={totalCount.toString()} />
        <SubstrateStat
          label="Active Now"
          value={activeCount.toString()}
          accent="#007A33"
        />
        <SubstrateStat
          label="Recruiting"
          value={recruitingCount.toString()}
          accent="#B45F00"
        />
        <SubstrateStat
          label="Total Enrollments"
          value={totalEnrollments.toString()}
          accent="#5B2C8F"
        />
      </section>

      {/* Client-side list + add modal */}
      <CohortsListClient
        initialCohorts={cohorts}
        programs={programs}
        staff={staff}
      />
    </div>
  )
}

function SubstrateStat({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: string
}) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        padding: '20px 24px',
      }}
    >
      <div
        style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(10, 10, 10, 0.5)',
          marginBottom: '8px',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '24px',
          fontWeight: 600,
          color: accent ?? '#0A0A0A',
          fontFamily: '"DM Serif Display", Georgia, serif',
        }}
      >
        {value}
      </div>
    </div>
  )
}
