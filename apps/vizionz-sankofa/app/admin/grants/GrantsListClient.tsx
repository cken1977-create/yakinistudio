'use client'

// VIZIONZ SANKOFA · /admin/grants · GrantsListClient
//
// Grant pipeline list with deadline urgency surfaced first-class. Each
// row shows the most-relevant date for its lifecycle state (drafting →
// application due; submitted → expected decision; awarded → next report
// due) with color-coded urgency border. Add modal captures the full
// lifecycle in one form — 20+ fields, organized by phase.

import { useMemo, useState, useTransition } from 'react'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type {
  GrantWithJoins,
  GrantEditableFields,
  GrantStatus,
  DeadlineUrgency,
  FunderOption,
  ProgramOption,
  CohortOption,
  StaffOption,
} from './types'
import {
  GRANT_STATUS_LABELS,
  GRANT_STATUS_COLORS,
  URGENCY_COLORS,
  generateSlug,
  getRelevantDeadline,
  getDeadlineUrgency,
} from './types'

const STATUS_TABS: { key: 'all' | GrantStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'drafting', label: 'Drafting' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'awarded', label: 'Awarded' },
  { key: 'declined', label: 'Declined' },
  { key: 'withdrawn', label: 'Withdrawn' },
  { key: 'closed', label: 'Closed' },
]

const URGENCY_TABS: { key: 'any' | 'urgent_only' | 'this_month'; label: string }[] = [
  { key: 'any', label: 'Any Timing' },
  { key: 'urgent_only', label: 'Urgent (≤7 days)' },
  { key: 'this_month', label: 'This Month (≤30 days)' },
]

export function GrantsListClient({
  initialGrants,
  funders,
  programs,
  cohorts,
  staff,
}: {
  initialGrants: GrantWithJoins[]
  funders: FunderOption[]
  programs: ProgramOption[]
  cohorts: CohortOption[]
  staff: StaffOption[]
}) {
  const [grants, setGrants] = useState<GrantWithJoins[]>(initialGrants)
  const [search, setSearch] = useState('')
  const [statusTab, setStatusTab] = useState<'all' | GrantStatus>('all')
  const [urgencyTab, setUrgencyTab] =
    useState<'any' | 'urgent_only' | 'this_month'>('any')
  const [adding, setAdding] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return grants.filter((g) => {
      if (statusTab !== 'all' && g.status !== statusTab) return false
      if (urgencyTab !== 'any') {
        const d = getRelevantDeadline(g)
        const u = getDeadlineUrgency(d.date)
        if (urgencyTab === 'urgent_only' && u !== 'urgent' && u !== 'overdue')
          return false
        if (
          urgencyTab === 'this_month' &&
          u !== 'urgent' &&
          u !== 'overdue' &&
          u !== 'soon'
        )
          return false
      }
      if (!q) return true
      const haystack = [
        g.name,
        g.funder_name ?? '',
        g.funder_short_name ?? '',
        g.program_name ?? '',
        g.external_grant_id ?? '',
        g.description ?? '',
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [grants, search, statusTab, urgencyTab])

  // Sort: overdue + urgent first, then by relevant deadline ascending
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const da = getRelevantDeadline(a)
      const db = getRelevantDeadline(b)
      const ua = getDeadlineUrgency(da.date)
      const ub = getDeadlineUrgency(db.date)
      const order: Record<DeadlineUrgency, number> = {
        overdue: 0,
        urgent: 1,
        soon: 2,
        comfortable: 3,
        none: 4,
      }
      if (order[ua] !== order[ub]) return order[ua] - order[ub]
      if (da.date && db.date) return da.date.localeCompare(db.date)
      return b.updated_at.localeCompare(a.updated_at)
    })
  }, [filtered])

  return (
    <>
      {/* Controls */}
      <section
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <input
          type="text"
          placeholder="Search by name, funder, program, grant ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: '1 1 240px',
            padding: '10px 14px',
            border: '1px solid rgba(10, 10, 10, 0.16)',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#0A0A0A',
            background: '#FFFFFF',
          }}
        />
        <button
          onClick={() => setAdding(true)}
          style={{
            padding: '10px 18px',
            border: '1px solid #0A0A0A',
            background: '#0A0A0A',
            color: '#FFFFFF',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          + Add Grant
        </button>
      </section>

      {/* Status tabs */}
      <section
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '12px',
        }}
      >
        {STATUS_TABS.map((t) => {
          const count =
            t.key === 'all'
              ? grants.length
              : grants.filter((g) => g.status === t.key).length
          return (
            <TabButton
              key={t.key}
              label={`${t.label} · ${count}`}
              active={statusTab === t.key}
              onClick={() => setStatusTab(t.key)}
            />
          )
        })}
      </section>

      {/* Urgency sub-filter */}
      <section
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '24px',
        }}
      >
        {URGENCY_TABS.map((t) => (
          <TabButton
            key={t.key}
            label={t.label}
            active={urgencyTab === t.key}
            onClick={() => setUrgencyTab(t.key)}
            small
          />
        ))}
      </section>

      {/* List */}
      {sorted.length === 0 ? (
        <EmptyState
          search={search}
          hasAny={grants.length > 0}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sorted.map((g) => (
            <GrantRow key={g.id} grant={g} />
          ))}
        </div>
      )}

      {/* Add modal */}
      {adding && (
        <GrantModal
          funders={funders}
          programs={programs}
          cohorts={cohorts}
          staff={staff}
          onClose={() => setAdding(false)}
          onSaved={(created) => {
            setGrants((prev) =>
              [created, ...prev].sort((a, b) =>
                b.updated_at.localeCompare(a.updated_at),
              ),
            )
            setAdding(false)
          }}
        />
      )}
    </>
  )
}

function TabButton({
  label,
  active,
  onClick,
  small,
}: {
  label: string
  active: boolean
  onClick: () => void
  small?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: small ? '6px 12px' : '8px 14px',
        border: active
          ? '1px solid #0A0A0A'
          : '1px solid rgba(10, 10, 10, 0.16)',
        background: active ? '#0A0A0A' : '#FFFFFF',
        color: active ? '#FFFFFF' : '#0A0A0A',
        borderRadius: '6px',
        fontSize: small ? '12px' : '13px',
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  )
}

function GrantRow({ grant }: { grant: GrantWithJoins }) {
  const deadline = getRelevantDeadline(grant)
  const urgency = getDeadlineUrgency(deadline.date)
  const urgencyColor = URGENCY_COLORS[urgency]

  return (
    <article
      style={{
        border: '1px solid rgba(10, 10, 10, 0.1)',
        borderLeft: `4px solid ${urgencyColor}`,
        borderRadius: '6px',
        padding: '16px 20px',
        background: '#FFFFFF',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '6px',
        }}
      >
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#0A0A0A',
            margin: 0,
            fontFamily: '"DM Serif Display", Georgia, serif',
          }}
        >
          {grant.name}
        </h3>
        <StatusPill status={grant.status} />
        {deadline.date && (
          <DeadlinePill
            label={deadline.label}
            date={deadline.date}
            urgency={urgency}
          />
        )}
      </div>
      <div
        style={{
          fontSize: '12px',
          color: 'rgba(10, 10, 10, 0.55)',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          marginBottom: '6px',
        }}
      >
        {grant.funder_name && `${grant.funder_name}`}
        {grant.funder_short_name && ` (${grant.funder_short_name})`}
        {grant.program_name && ` · ${grant.program_icon ?? ''} ${grant.program_name}`}
        {grant.cohort_name && ` · ${grant.cohort_name}`}
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '12px',
          color: 'rgba(10, 10, 10, 0.7)',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        }}
      >
        {grant.amount_requested && Number(grant.amount_requested) > 0 && (
          <span>
            Requested ${Number(grant.amount_requested).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        )}
        {grant.amount_awarded && Number(grant.amount_awarded) > 0 && (
          <span style={{ color: '#007A33', fontWeight: 600 }}>
            Awarded ${Number(grant.amount_awarded).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        )}
        {grant.amount_spent && Number(grant.amount_spent) > 0 && (
          <span>
            Spent ${Number(grant.amount_spent).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        )}
        {grant.external_grant_id && (
          <span style={{ color: 'rgba(10, 10, 10, 0.5)' }}>
            ID {grant.external_grant_id}
          </span>
        )}
        {grant.owner_name && (
          <span style={{ marginLeft: 'auto', color: 'rgba(10, 10, 10, 0.55)' }}>
            Owner: {grant.owner_name}
          </span>
        )}
      </div>
      {grant.status === 'declined' && grant.decline_reason && (
        <div
          style={{
            marginTop: '10px',
            padding: '8px 12px',
            background: 'rgba(206, 17, 38, 0.06)',
            border: '1px solid rgba(206, 17, 38, 0.18)',
            borderRadius: '4px',
            fontSize: '12px',
            color: 'rgba(10, 10, 10, 0.75)',
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: '#CE1126' }}>Decline reason:</strong>{' '}
          {grant.decline_reason}
        </div>
      )}
    </article>
  )
}

function StatusPill({ status }: { status: GrantStatus }) {
  const c = GRANT_STATUS_COLORS[status]
  return (
    <span
      style={{
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        padding: '3px 8px',
        borderRadius: '4px',
        background: c.bg,
        color: c.fg,
        fontFamily:
          'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
      }}
    >
      {GRANT_STATUS_LABELS[status]}
    </span>
  )
}

function DeadlinePill({
  label,
  date,
  urgency,
}: {
  label: string
  date: string
  urgency: DeadlineUrgency
}) {
  const color = URGENCY_COLORS[urgency]
  return (
    <span
      style={{
        fontSize: '11px',
        fontWeight: 600,
        padding: '3px 8px',
        borderRadius: '4px',
        background: urgency === 'overdue'
          ? 'rgba(206, 17, 38, 0.12)'
          : urgency === 'urgent'
            ? 'rgba(180, 95, 0, 0.12)'
            : urgency === 'soon'
              ? 'rgba(91, 44, 143, 0.08)'
              : 'rgba(10, 10, 10, 0.04)',
        color,
        fontFamily:
          'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
      }}
    >
      {label}: {formatDate(date)}
      {urgency === 'overdue' && ' ⚠'}
    </span>
  )
}

function EmptyState({
  search,
  hasAny,
}: {
  search: string
  hasAny: boolean
}) {
  return (
    <div
      style={{
        padding: '60px 24px',
        textAlign: 'center',
        border: '1px dashed rgba(10, 10, 10, 0.18)',
        borderRadius: '8px',
        background: '#FAFAF8',
      }}
    >
      <div
        style={{
          fontSize: '14px',
          color: 'rgba(10, 10, 10, 0.6)',
        }}
      >
        {search
          ? `No grants match "${search}".`
          : hasAny
            ? 'No grants match this filter combination.'
            : 'No grants yet. Click + Add Grant to track the first application.'}
      </div>
    </div>
  )
}

function GrantModal({
  funders,
  programs,
  cohorts,
  staff,
  onClose,
  onSaved,
}: {
  funders: FunderOption[]
  programs: ProgramOption[]
  cohorts: CohortOption[]
  staff: StaffOption[]
  onClose: () => void
  onSaved: (record: GrantWithJoins) => void
}) {
  const [draft, setDraft] = useState<GrantEditableFields>({
    name: '',
    slug: '',
    funder_id: funders[0]?.id ?? null,
    program_id: null,
    cohort_id: null,
    status: 'drafting',
    amount_requested: null,
    amount_awarded: null,
    amount_spent: null,
    application_opens_at: null,
    application_due_at: null,
    submitted_at: null,
    decided_at: null,
    period_start: null,
    period_end: null,
    next_report_due: null,
    description: null,
    proposal_summary: null,
    decline_reason: null,
    internal_notes: null,
    external_grant_id: null,
    primary_owner_id: staff[0]?.id ?? null,
  })
  const [pending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function update<K extends keyof GrantEditableFields>(
    key: K,
    value: GrantEditableFields[K],
  ) {
    setDraft((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'name' && (!prev.slug || prev.slug === generateSlug(prev.name))) {
        next.slug = generateSlug(value as string)
      }
      // Clear cohort if program changes
      if (key === 'program_id') {
        next.cohort_id = null
      }
      return next
    })
  }

  const filteredCohorts = useMemo(() => {
    if (!draft.program_id) return cohorts
    return cohorts.filter((c) => c.program_id === draft.program_id)
  }, [cohorts, draft.program_id])

  function save() {
    if (!draft.name.trim()) {
      setErrorMsg('Grant name is required.')
      return
    }
    if (!draft.slug.trim()) {
      setErrorMsg('Slug is required.')
      return
    }
    setErrorMsg(null)

    startTransition(async () => {
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from('grants')
        .insert(draft)
        .select()
        .single()

      if (error || !data) {
        setErrorMsg(error?.message ?? 'Failed to save.')
        return
      }

      // Decorate with joined fields
      const funder = funders.find((f) => f.id === draft.funder_id)
      const program = programs.find((p) => p.id === draft.program_id)
      const cohort = cohorts.find((c) => c.id === draft.cohort_id)
      const owner = staff.find((s) => s.id === draft.primary_owner_id)

      const decorated: GrantWithJoins = {
        ...(data as unknown as GrantWithJoins),
        funder_name: funder?.name ?? null,
        funder_short_name: funder?.short_name ?? null,
        program_name: program?.name ?? null,
        program_icon: program?.icon_emoji ?? null,
        cohort_name: cohort?.name ?? null,
        owner_name: owner?.full_name ?? null,
      }
      onSaved(decorated)
    })
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 10, 10, 0.45)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '40px 16px',
        zIndex: 100,
        overflowY: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '720px',
          background: '#FFFFFF',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 24px 64px rgba(10, 10, 10, 0.25)',
        }}
      >
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 600,
            color: '#0A0A0A',
            marginBottom: '6px',
            fontFamily: '"DM Serif Display", Georgia, serif',
          }}
        >
          Add Grant
        </h2>
        <p
          style={{
            fontSize: '13px',
            color: 'rgba(10, 10, 10, 0.6)',
            marginBottom: '24px',
          }}
        >
          Track a grant from application through close. Fields fill in as the
          lifecycle progresses.
        </p>

        <SectionHeader label="Identity" />
        <Row>
          <Field label="Grant Name *">
            <input
              type="text"
              value={draft.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder='e.g. "ACS Community Reentry Q3 2026"'
              style={inputStyle}
            />
          </Field>
          <Field label="External Grant ID">
            <input
              type="text"
              value={draft.external_grant_id ?? ''}
              onChange={(e) =>
                update('external_grant_id', e.target.value || null)
              }
              placeholder="Funder's contract / award number"
              style={inputStyle}
            />
          </Field>
        </Row>

        <Field label="Slug *">
          <input
            type="text"
            value={draft.slug}
            onChange={(e) => update('slug', e.target.value)}
            placeholder="auto-generated from name"
            style={{ ...inputStyle, fontFamily: 'ui-monospace, monospace' }}
          />
        </Field>

        <SectionHeader label="Relationships" />
        <Row>
          <Field label="Funder">
            <select
              value={draft.funder_id ?? ''}
              onChange={(e) => update('funder_id', e.target.value || null)}
              style={inputStyle}
            >
              <option value="">— None —</option>
              {funders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.short_name ? `${f.short_name} · ${f.name}` : f.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status *">
            <select
              value={draft.status}
              onChange={(e) =>
                update('status', e.target.value as GrantStatus)
              }
              style={inputStyle}
            >
              {(Object.keys(GRANT_STATUS_LABELS) as GrantStatus[]).map((s) => (
                <option key={s} value={s}>
                  {GRANT_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
        </Row>

        <Row>
          <Field label="Program">
            <select
              value={draft.program_id ?? ''}
              onChange={(e) => update('program_id', e.target.value || null)}
              style={inputStyle}
            >
              <option value="">— General Operating —</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.icon_emoji ?? '📋'} {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Cohort (optional)">
            <select
              value={draft.cohort_id ?? ''}
              onChange={(e) => update('cohort_id', e.target.value || null)}
              style={inputStyle}
              disabled={!draft.program_id}
            >
              <option value="">— None —</option>
              {filteredCohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </Row>

        <Field label="Primary Owner">
          <select
            value={draft.primary_owner_id ?? ''}
            onChange={(e) =>
              update('primary_owner_id', e.target.value || null)
            }
            style={inputStyle}
          >
            <option value="">— Unassigned —</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
                {s.role ? ` (${s.role})` : ''}
              </option>
            ))}
          </select>
        </Field>

        <SectionHeader label="Money" />
        <Row>
          <Field label="Requested ($)">
            <input
              type="number"
              min="0"
              step="100"
              value={draft.amount_requested ?? ''}
              onChange={(e) =>
                update(
                  'amount_requested',
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              style={inputStyle}
            />
          </Field>
          <Field label="Awarded ($)">
            <input
              type="number"
              min="0"
              step="100"
              value={draft.amount_awarded ?? ''}
              onChange={(e) =>
                update(
                  'amount_awarded',
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              style={inputStyle}
            />
          </Field>
          <Field label="Spent ($)">
            <input
              type="number"
              min="0"
              step="100"
              value={draft.amount_spent ?? ''}
              onChange={(e) =>
                update(
                  'amount_spent',
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              style={inputStyle}
            />
          </Field>
        </Row>

        <SectionHeader label="Application Dates" />
        <Row>
          <Field label="Application Opens">
            <input
              type="date"
              value={draft.application_opens_at ?? ''}
              onChange={(e) =>
                update('application_opens_at', e.target.value || null)
              }
              style={inputStyle}
            />
          </Field>
          <Field label="Application Due">
            <input
              type="date"
              value={draft.application_due_at ?? ''}
              onChange={(e) =>
                update('application_due_at', e.target.value || null)
              }
              style={inputStyle}
            />
          </Field>
        </Row>

        <Row>
          <Field label="Submitted On">
            <input
              type="date"
              value={draft.submitted_at ?? ''}
              onChange={(e) => update('submitted_at', e.target.value || null)}
              style={inputStyle}
            />
          </Field>
          <Field label="Decided On">
            <input
              type="date"
              value={draft.decided_at ?? ''}
              onChange={(e) => update('decided_at', e.target.value || null)}
              style={inputStyle}
            />
          </Field>
        </Row>

        <SectionHeader label="Award Period & Reporting" />
        <Row>
          <Field label="Period Start">
            <input
              type="date"
              value={draft.period_start ?? ''}
              onChange={(e) => update('period_start', e.target.value || null)}
              style={inputStyle}
            />
          </Field>
          <Field label="Period End">
            <input
              type="date"
              value={draft.period_end ?? ''}
              onChange={(e) => update('period_end', e.target.value || null)}
              style={inputStyle}
            />
          </Field>
          <Field label="Next Report Due">
            <input
              type="date"
              value={draft.next_report_due ?? ''}
              onChange={(e) =>
                update('next_report_due', e.target.value || null)
              }
              style={inputStyle}
            />
          </Field>
        </Row>

        <SectionHeader label="Narrative" />
        <Field label="Description">
          <textarea
            value={draft.description ?? ''}
            onChange={(e) => update('description', e.target.value || null)}
            rows={2}
            placeholder="One-line context — what this grant is for."
            style={{ ...inputStyle, fontFamily: 'inherit' }}
          />
        </Field>

        <Field label="Proposal Summary">
          <textarea
            value={draft.proposal_summary ?? ''}
            onChange={(e) =>
              update('proposal_summary', e.target.value || null)
            }
            rows={3}
            placeholder="The pitch — what we proposed to do with the money."
            style={{ ...inputStyle, fontFamily: 'inherit' }}
          />
        </Field>

        {draft.status === 'declined' && (
          <Field label="Decline Reason">
            <textarea
              value={draft.decline_reason ?? ''}
              onChange={(e) =>
                update('decline_reason', e.target.value || null)
              }
              rows={2}
              placeholder="Why was this declined? Learning for future applications."
              style={{ ...inputStyle, fontFamily: 'inherit' }}
            />
          </Field>
        )}

        <Field label="Internal Notes">
          <textarea
            value={draft.internal_notes ?? ''}
            onChange={(e) => update('internal_notes', e.target.value || null)}
            rows={3}
            placeholder="Anything else worth recording — contacts, history, gotchas."
            style={{ ...inputStyle, fontFamily: 'inherit' }}
          />
        </Field>

        {errorMsg && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(206, 17, 38, 0.08)',
              color: '#CE1126',
              borderRadius: '6px',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {errorMsg}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end',
            marginTop: '8px',
          }}
        >
          <button onClick={onClose} disabled={pending} style={cancelBtn(pending)}>
            Cancel
          </button>
          <button onClick={save} disabled={pending} style={saveBtn(pending)}>
            {pending ? 'Saving…' : 'Add Grant'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div
      style={{
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: '#5B2C8F',
        marginTop: '20px',
        marginBottom: '12px',
        fontFamily:
          'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
      }}
    >
      {label}
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
      }}
    >
      {children}
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(10, 10, 10, 0.55)',
            marginBottom: '6px',
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          }}
        >
          {label}
        </label>
      )}
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid rgba(10, 10, 10, 0.16)',
  borderRadius: '6px',
  fontSize: '14px',
  color: '#0A0A0A',
  background: '#FFFFFF',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

function cancelBtn(pending: boolean): React.CSSProperties {
  return {
    padding: '10px 18px',
    border: '1px solid rgba(10, 10, 10, 0.16)',
    background: '#FFFFFF',
    color: '#0A0A0A',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: pending ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
  }
}

function saveBtn(pending: boolean): React.CSSProperties {
  return {
    padding: '10px 18px',
    border: '1px solid #0A0A0A',
    background: '#0A0A0A',
    color: '#FFFFFF',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: pending ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
  }
}

function formatDate(d: string | null): string {
  if (!d) return ''
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
