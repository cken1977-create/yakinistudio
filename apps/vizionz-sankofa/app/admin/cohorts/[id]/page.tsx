// VIZIONZ SANKOFA · /admin/cohorts/[id] (Wave 3)
//
// Cohort detail page. Server component fetches cohort joined with program +
// facilitator, all enrollments joined with participants, and ALL active
// participants (for the enroll modal picker). Delegates to EnrollmentsClient.

import {
  requireOperatorOrEmployee,
  touchLastActive,
  getOperatorDisplayName,
} from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { EnrollmentsClient } from './EnrollmentsClient'
import type {
  CohortDetailWithJoins,
  CohortRecord,
  EnrollmentRecord,
  EnrollmentWithParticipant,
  AvailableParticipant,
} from './types'
import { COHORT_STATUS_LABELS, COHORT_STATUS_COLORS } from './types'

export const dynamic = 'force-dynamic'

export default async function CohortDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireOperatorOrEmployee()
  void touchLastActive(user.id)

  const supabase = await createClient()

  // Fetch cohort joined with program and facilitator
  const { data: cohortData, error: cohortError } = await supabase
    .from('cohorts')
    .select(
      'id, program_id, name, slug, cohort_number, start_date, end_date, ' +
        'meeting_schedule, capacity, status, primary_facilitator_id, ' +
        'internal_notes, created_at, updated_at, ' +
        'program:program_id (name, icon_emoji, slug), ' +
        'facilitator:primary_facilitator_id (full_name)',
    )
    .eq('id', id)
    .maybeSingle()

  if (cohortError || !cohortData) {
    notFound()
  }

  type CohortJoin = CohortRecord & {
    program: {
      name: string | null
      icon_emoji: string | null
      slug: string | null
    } | null
    facilitator: { full_name: string | null } | null
  }

  const cj = cohortData as unknown as CohortJoin
  const cohort: CohortDetailWithJoins = {
    ...cj,
    program_name: cj.program?.name ?? null,
    program_icon: cj.program?.icon_emoji ?? null,
    program_slug: cj.program?.slug ?? null,
    facilitator_name: cj.facilitator?.full_name ?? null,
  }

  // Fetch enrollments for this cohort, joined with participants
  const { data: enrollmentsData } = await supabase
    .from('enrollments')
    .select(
      'id, participant_id, cohort_id, status, enrolled_at, completed_at, ' +
        'withdrew_at, withdrawal_reason, notes, created_at, updated_at, ' +
        'participant:participant_id (first_name, last_name, preferred_name, status)',
    )
    .eq('cohort_id', id)
    .order('enrolled_at', { ascending: true })

  type EnrollmentJoin = EnrollmentRecord & {
    participant: {
      first_name: string
      last_name: string
      preferred_name: string | null
      status: string | null
    } | null
  }

  const enrollments: EnrollmentWithParticipant[] = (
    (enrollmentsData ?? []) as unknown as EnrollmentJoin[]
  ).map((e) => ({
    ...e,
    participant_first_name: e.participant?.first_name ?? '',
    participant_last_name: e.participant?.last_name ?? '',
    participant_preferred_name: e.participant?.preferred_name ?? null,
    participant_status: e.participant?.status ?? null,
  }))

  // Fetch ALL active participants (Option A — client filters in the modal).
  // VS scale is dozens-to-hundreds; one bulk query is cheaper than search-as-
  // you-type round trips. Wave 4 can upgrade if list grows past a few thousand.
  const { data: participantsData } = await supabase
    .from('participants')
    .select('id, first_name, last_name, preferred_name, status, city')
    .order('last_name', { ascending: true })

  const allParticipants = (participantsData ??
    []) as unknown as AvailableParticipant[]

  const greetingName = getOperatorDisplayName(user)

  // Capacity math
  const activeEnrollments = enrollments.filter((e) =>
    ['enrolled', 'active', 'completed'].includes(e.status),
  ).length
  const isOverCapacity =
    cohort.capacity !== null && activeEnrollments > cohort.capacity

  return (
    <div>
      {/* Back link */}
      <Link
        href="/admin/cohorts"
        style={{
          display: 'inline-block',
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#5B2C8F',
          textDecoration: 'none',
          marginBottom: '24px',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        }}
      >
        ← All Cohorts
      </Link>

      {/* Substrate eyebrow */}
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
        Cohort · Enrollment Roster
      </div>

      {/* Hero */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div style={{ fontSize: '40px', lineHeight: 1 }}>
          {cohort.program_icon ?? '📋'}
        </div>
        <div>
          <h1
            style={{
              fontSize: '32px',
              lineHeight: 1.15,
              fontWeight: 600,
              color: '#0A0A0A',
              margin: 0,
              fontFamily: '"DM Serif Display", Georgia, serif',
            }}
          >
            {cohort.name}
          </h1>
          {cohort.program_name && (
            <div
              style={{
                fontSize: '14px',
                color: 'rgba(10, 10, 10, 0.6)',
                marginTop: '4px',
                fontFamily:
                  'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
              }}
            >
              {cohort.program_name}
            </div>
          )}
        </div>
        <StatusPill status={cohort.status} />
      </div>

      {/* Quick facts */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1px',
          background: 'rgba(10, 10, 10, 0.08)',
          marginBottom: '32px',
          border: '1px solid rgba(10, 10, 10, 0.08)',
        }}
      >
        <QuickFact
          label="Start Date"
          value={formatDate(cohort.start_date)}
        />
        <QuickFact
          label="End Date"
          value={cohort.end_date ? formatDate(cohort.end_date) : '—'}
        />
        <QuickFact
          label="Schedule"
          value={cohort.meeting_schedule ?? '—'}
        />
        <QuickFact
          label="Facilitator"
          value={cohort.facilitator_name ?? 'Unassigned'}
        />
        <QuickFact
          label="Capacity"
          value={
            cohort.capacity
              ? `${activeEnrollments} / ${cohort.capacity}`
              : `${activeEnrollments} enrolled`
          }
          accent={isOverCapacity ? '#CE1126' : undefined}
        />
      </div>

      {/* Internal notes if present */}
      {cohort.internal_notes && (
        <div
          style={{
            padding: '14px 18px',
            background: 'rgba(91, 44, 143, 0.04)',
            border: '1px solid rgba(91, 44, 143, 0.18)',
            borderRadius: '6px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#5B2C8F',
              marginBottom: '6px',
              fontFamily:
                'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
            }}
          >
            Internal Notes
          </div>
          <div
            style={{
              fontSize: '14px',
              lineHeight: 1.6,
              color: 'rgba(10, 10, 10, 0.85)',
              whiteSpace: 'pre-wrap',
            }}
          >
            {cohort.internal_notes}
          </div>
        </div>
      )}

      {/* Enrollments client */}
      <EnrollmentsClient
        cohortId={cohort.id}
        cohortCapacity={cohort.capacity}
        initialEnrollments={enrollments}
        allParticipants={allParticipants}
      />

      {/* Operator footer */}
      <footer
        style={{
          marginTop: '48px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(10, 10, 10, 0.08)',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(10, 10, 10, 0.45)',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        }}
      >
        Signed in as {greetingName}
      </footer>
    </div>
  )
}

function StatusPill({
  status,
}: {
  status: CohortDetailWithJoins['status']
}) {
  const c = COHORT_STATUS_COLORS[status]
  return (
    <span
      style={{
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        padding: '4px 10px',
        borderRadius: '4px',
        background: c.bg,
        color: c.fg,
        fontFamily:
          'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
      }}
    >
      {COHORT_STATUS_LABELS[status]}
    </span>
  )
}

function QuickFact({
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
        padding: '16px 20px',
      }}
    >
      <div
        style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(10, 10, 10, 0.5)',
          marginBottom: '6px',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '15px',
          fontWeight: 500,
          color: accent ?? '#0A0A0A',
          lineHeight: 1.4,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  try {
    const date = new Date(d + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return d
  }
}
