// VIZIONZ SANKOFA · /admin/intakes
// Operator queue for Get Help Requests. Fetches from Supabase,
// groups by status when filter=all, renders expandable rows.
//
// Layout: hybrid rows-expanding-to-detail (per Wave 2.2 architectural
// call). Scales from zero intakes (empty state) to thousands (pagination
// deferred to TODO_FUTURE per locked Wave 2.2 scope).

import { requireOperatorOrEmployee } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { IntakeRow, type IntakeRecord } from './IntakeRow'

export const dynamic = 'force-dynamic'

type FilterValue =
  | 'all'
  | 'new'
  | 'contacted'
  | 'in_progress'
  | 'resolved'
  | 'promoted_to_legacyline'
  | 'closed_no_response'

const FILTER_VALUES: FilterValue[] = [
  'all',
  'new',
  'contacted',
  'in_progress',
  'resolved',
  'promoted_to_legacyline',
  'closed_no_response',
]

const FILTER_LABELS: Record<FilterValue, string> = {
  all: 'All',
  new: 'New',
  contacted: 'Contacted',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  promoted_to_legacyline: 'Legacyline',
  closed_no_response: 'Closed',
}

const STATUS_GROUP_ORDER: IntakeRecord['status'][] = [
  'new',
  'contacted',
  'in_progress',
  'resolved',
  'promoted_to_legacyline',
  'closed_no_response',
]

const STATUS_GROUP_LABELS: Record<IntakeRecord['status'], string> = {
  new: 'New — needs action',
  contacted: 'Contacted',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  promoted_to_legacyline: 'Promoted to Legacyline',
  closed_no_response: 'Closed — No Response',
}

function isValidFilter(value: string | undefined): value is FilterValue {
  return value !== undefined && (FILTER_VALUES as string[]).includes(value)
}

export default async function IntakesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const viewer = await requireOperatorOrEmployee()

  const params = await searchParams
  const filter: FilterValue = isValidFilter(params.filter)
    ? params.filter
    : 'all'

  const supabase = await createClient()

  // Fetch intakes — filtered if specified, all otherwise
  let query = supabase
    .from('intake_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (filter !== 'all') {
    query = query.eq('status', filter)
  }

  const { data, error } = await query
  const intakes = (data ?? []) as IntakeRecord[]

  // Count for filter pills (independent of current filter)
  const counts = await fetchStatusCounts(supabase)

  return (
    <div>
      {/* Header */}
      <section style={{ marginBottom: '32px' }}>
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
          Intakes · Wave 2
        </div>

        <h1
          style={{
            fontSize: '32px',
            lineHeight: 1.15,
            fontWeight: 600,
            color: '#0A0A0A',
            marginBottom: '12px',
            fontFamily: '"DM Serif Display", Georgia, serif',
          }}
        >
          Get Help Requests
        </h1>

        <p
          style={{
            fontSize: '15px',
            lineHeight: 1.6,
            color: 'rgba(10, 10, 10, 0.65)',
            maxWidth: '640px',
          }}
        >
          Requests submitted from <code style={{ fontSize: '14px' }}>/get-help</code>.
          New requests are highlighted at the top — tap a row to see the full
          context and respond. Mark contacted when you&apos;ve reached out.
        </p>
      </section>

      {/* Filter pills */}
      <section
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          marginBottom: '24px',
        }}
      >
        {FILTER_VALUES.map((value) => {
          const isActive = value === filter
          const href = value === 'all' ? '/admin/intakes' : `/admin/intakes?filter=${value}`
          const count = value === 'all' ? counts.total : counts.byStatus[value as IntakeRecord['status']] ?? 0

          return (
            <a
              key={value}
              href={href}
              style={{
                padding: '8px 14px',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: isActive ? '#FFFFFF' : '#0A0A0A',
                background: isActive ? '#0A2548' : 'transparent',
                border: `1px solid ${isActive ? '#0A2548' : 'rgba(10, 10, 10, 0.15)'}`,
                borderRadius: '2px',
                textDecoration: 'none',
                fontFamily:
                  'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
              }}
            >
              {FILTER_LABELS[value]} · {count}
            </a>
          )
        })}
      </section>

      {/* Error state */}
      {error && (
        <div
          style={{
            padding: '16px',
            background: 'rgba(206, 17, 38, 0.08)',
            borderLeft: '3px solid #CE1126',
            fontSize: '14px',
            color: '#0A0A0A',
            marginBottom: '16px',
          }}
        >
          Could not load intakes: {error.message}
        </div>
      )}

      {/* Content */}
      {!error && intakes.length === 0 && (
        <EmptyState filter={filter} />
      )}

      {!error && intakes.length > 0 && filter === 'all' && (
        <GroupedView intakes={intakes} viewerRole={viewer.role === 'principal' ? 'operator' : viewer.role} />
      )}

      {!error && intakes.length > 0 && filter !== 'all' && (
        <FlatList intakes={intakes} filter={filter} viewerRole={viewer.role === 'principal' ? 'operator' : viewer.role} />
      )}
    </div>
  )
}

// ─── Status counts (single query, aggregated) ──────────────────────────

async function fetchStatusCounts(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const { count: total } = await supabase
    .from('intake_requests')
    .select('*', { count: 'exact', head: true })

  const statuses: IntakeRecord['status'][] = [
    'new',
    'contacted',
    'in_progress',
    'resolved',
    'promoted_to_legacyline',
    'closed_no_response',
  ]

  const byStatus: Partial<Record<IntakeRecord['status'], number>> = {}

  for (const status of statuses) {
    const { count } = await supabase
      .from('intake_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', status)
    byStatus[status] = count ?? 0
  }

  return { total: total ?? 0, byStatus }
}

// ─── Grouped view (when filter=all) ───────────────────────────────────

function GroupedView({
  intakes,
  viewerRole,
}: {
  intakes: IntakeRecord[]
  viewerRole: 'operator' | 'employee'
}) {
  const grouped: Record<IntakeRecord['status'], IntakeRecord[]> = {
    new: [],
    contacted: [],
    in_progress: [],
    resolved: [],
    promoted_to_legacyline: [],
    closed_no_response: [],
  }

  for (const intake of intakes) {
    grouped[intake.status].push(intake)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {STATUS_GROUP_ORDER.map((status) => {
        const rows = grouped[status]
        if (rows.length === 0) return null

        const isNewGroup = status === 'new'

        return (
          <section key={status}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: isNewGroup ? '#CE1126' : 'rgba(10, 10, 10, 0.55)',
                  fontFamily:
                    'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
                }}
              >
                {STATUS_GROUP_LABELS[status]}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.08em',
                  color: 'rgba(10, 10, 10, 0.4)',
                  fontFamily:
                    'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
                }}
              >
                · {rows.length}
              </div>
            </div>

            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              {rows.map((intake) => (
                <IntakeRow
                  key={intake.id}
                  intake={intake}
                  defaultExpanded={isNewGroup}
                  viewerRole={viewerRole}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

// ─── Flat list (when filter is specific) ──────────────────────────────

function FlatList({
  intakes,
  filter,
  viewerRole,
}: {
  intakes: IntakeRecord[]
  filter: FilterValue
  viewerRole: 'operator' | 'employee'
}) {
  const expandFirst = filter === 'new'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {intakes.map((intake, idx) => (
        <IntakeRow
          key={intake.id}
          intake={intake}
          defaultExpanded={expandFirst && idx === 0}
          viewerRole={viewerRole}
        />
      ))}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────

function EmptyState({ filter }: { filter: FilterValue }) {
  const message =
    filter === 'all'
      ? 'No requests have come in yet. When someone submits the /get-help form, it lands here.'
      : `No requests in the "${FILTER_LABELS[filter]}" status.`

  return (
    <div
      style={{
        padding: '64px 24px',
        textAlign: 'center',
        background: 'rgba(10, 10, 10, 0.02)',
        border: '1px dashed rgba(10, 10, 10, 0.15)',
        borderRadius: '2px',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(10, 10, 10, 0.5)',
          marginBottom: '14px',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        }}
      >
        Queue is clear
      </div>
      <p
        style={{
          fontSize: '15px',
          lineHeight: 1.6,
          color: 'rgba(10, 10, 10, 0.55)',
          margin: 0,
          maxWidth: '440px',
          marginInline: 'auto',
        }}
      >
        {message}
      </p>
    </div>
  )
}
