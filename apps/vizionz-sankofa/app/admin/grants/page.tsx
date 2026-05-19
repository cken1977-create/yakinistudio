// VIZIONZ SANKOFA · /admin/grants (Wave 3 — final surface)
//
// Grant pipeline tracker. Server component fetches grants joined with
// funder + program + cohort + owner. Substrate strip surfaces urgency:
// what's due this week, due this month, total awarded YTD, pending
// decisions. Delegates interactivity to GrantsListClient.

import {
  requireOperatorOrEmployee,
  touchLastActive,
  getOperatorDisplayName,
} from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { GrantsListClient } from './GrantsListClient'
import type {
  GrantRecord,
  GrantWithJoins,
  FunderOption,
  ProgramOption,
  CohortOption,
  StaffOption,
} from './types'
import { getRelevantDeadline, getDeadlineUrgency } from './types'

export const dynamic = 'force-dynamic'

export default async function GrantsPage() {
  const user = await requireOperatorOrEmployee()
  void touchLastActive(user.id)

  const supabase = await createClient()

  // Fetch grants joined with funder, program, cohort, owner
  const { data: grantsData } = await supabase
    .from('grants')
    .select(
      'id, name, slug, funder_id, program_id, cohort_id, status, ' +
        'amount_requested, amount_awarded, amount_spent, ' +
        'application_opens_at, application_due_at, submitted_at, ' +
        'decided_at, period_start, period_end, next_report_due, ' +
        'description, proposal_summary, decline_reason, internal_notes, ' +
        'external_grant_id, primary_owner_id, created_at, updated_at, ' +
        'funder:funder_id (name, short_name), ' +
        'program:program_id (name, icon_emoji), ' +
        'cohort:cohort_id (name), ' +
        'owner:primary_owner_id (full_name)',
    )
    .order('updated_at', { ascending: false })

  type GrantJoin = GrantRecord & {
    funder: { name: string | null; short_name: string | null } | null
    program: { name: string | null; icon_emoji: string | null } | null
    cohort: { name: string | null } | null
    owner: { full_name: string | null } | null
  }

  const grants: GrantWithJoins[] = (
    (grantsData ?? []) as unknown as GrantJoin[]
  ).map((g) => ({
    ...g,
    funder_name: g.funder?.name ?? null,
    funder_short_name: g.funder?.short_name ?? null,
    program_name: g.program?.name ?? null,
    program_icon: g.program?.icon_emoji ?? null,
    cohort_name: g.cohort?.name ?? null,
    owner_name: g.owner?.full_name ?? null,
  }))

  // Fetch funder organizations for the add modal dropdown
  const { data: fundersData } = await supabase
    .from('organizations')
    .select('id, name, short_name')
    .in('relationship_kind', ['funder', 'both'])
    .order('name', { ascending: true })

  const funders = (fundersData ?? []) as unknown as FunderOption[]

  // Fetch active programs for the program dropdown
  const { data: programsData } = await supabase
    .from('programs')
    .select('id, name, icon_emoji')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  const programs = (programsData ?? []) as unknown as ProgramOption[]

  // Fetch active+recruiting cohorts for cohort dropdown
  const { data: cohortsData } = await supabase
    .from('cohorts')
    .select('id, name, program_id')
    .in('status', ['planned', 'recruiting', 'active'])
    .order('start_date', { ascending: false })

  const cohorts = (cohortsData ?? []) as unknown as CohortOption[]

  // Fetch active staff for owner dropdown
  const { data: staffData } = await supabase
    .from('staff')
    .select('id, full_name, role')
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  const staff = (staffData ?? []) as unknown as StaffOption[]

  // Substrate urgency math
  const dueThisWeek = grants.filter((g) => {
    const d = getRelevantDeadline(g)
    const u = getDeadlineUrgency(d.date)
    return u === 'urgent' || u === 'overdue'
  }).length

  const dueThisMonth = grants.filter((g) => {
    const d = getRelevantDeadline(g)
    const u = getDeadlineUrgency(d.date)
    return u === 'urgent' || u === 'overdue' || u === 'soon'
  }).length

  const pendingDecision = grants.filter((g) => g.status === 'submitted').length

  const totalAwarded = grants
    .filter((g) => g.status === 'awarded' || g.status === 'closed')
    .reduce((sum, g) => sum + Number(g.amount_awarded ?? 0), 0)

  const totalRequested = grants
    .filter((g) => g.status === 'drafting' || g.status === 'submitted')
    .reduce((sum, g) => sum + Number(g.amount_requested ?? 0), 0)

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
          Grants Pipeline
        </h1>
        <p
          style={{
            fontSize: '16px',
            lineHeight: 1.6,
            color: 'rgba(10, 10, 10, 0.65)',
            maxWidth: '640px',
          }}
        >
          Every grant application from draft through award through close,
          {greetingName ? ` ${greetingName}` : ''}. Deadlines surface as
          urgency. Awards surface as money. Declines surface as learning.
        </p>
      </section>

      {/* Substrate readiness strip */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '1px',
          background: 'rgba(10, 10, 10, 0.08)',
          marginBottom: '32px',
          border: '1px solid rgba(10, 10, 10, 0.08)',
        }}
      >
        <UrgencyStat
          label="Due This Week"
          value={dueThisWeek.toString()}
          accent={dueThisWeek > 0 ? '#CE1126' : '#0A0A0A'}
        />
        <UrgencyStat
          label="Due This Month"
          value={dueThisMonth.toString()}
          accent={dueThisMonth > 0 ? '#B45F00' : '#0A0A0A'}
        />
        <UrgencyStat
          label="Pending Decision"
          value={pendingDecision.toString()}
          accent="#5B2C8F"
        />
        <UrgencyStat
          label="Total Awarded"
          value={
            totalAwarded > 0
              ? `$${totalAwarded.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
              : '—'
          }
          accent="#007A33"
        />
        <UrgencyStat
          label="Active Requests"
          value={
            totalRequested > 0
              ? `$${totalRequested.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
              : '—'
          }
        />
      </section>

      {/* Client list */}
      <GrantsListClient
        initialGrants={grants}
        funders={funders}
        programs={programs}
        cohorts={cohorts}
        staff={staff}
      />
    </div>
  )
}

function UrgencyStat({
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
        padding: '20px 22px',
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
          fontSize: '22px',
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
