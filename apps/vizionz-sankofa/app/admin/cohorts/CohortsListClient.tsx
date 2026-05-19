'use client'

// VIZIONZ SANKOFA · /admin/cohorts · interactive list + add modal
//
// Handles: search by name or program, status filter tabs, add new cohort,
// optimistic UI refresh on save. Cohorts deep-link to /admin/cohorts/[id]
// for enrollment management (ships next as File 12).

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type {
  CohortEditableFields,
  CohortStatus,
  CohortWithJoins,
  ProgramOption,
  StaffOption,
} from './types'
import {
  COHORT_STATUS_LABELS,
  COHORT_STATUS_COLORS,
} from './types'

const STATUS_TABS: { key: 'all' | CohortStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'planned', label: 'Planned' },
  { key: 'recruiting', label: 'Recruiting' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

export function CohortsListClient({
  initialCohorts,
  programs,
  staff,
}: {
  initialCohorts: CohortWithJoins[]
  programs: ProgramOption[]
  staff: StaffOption[]
}) {
  const [cohorts, setCohorts] = useState<CohortWithJoins[]>(initialCohorts)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'all' | CohortStatus>('all')
  const [adding, setAdding] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return cohorts.filter((c) => {
      if (tab !== 'all' && c.status !== tab) return false
      if (!q) return true
      const haystack = [
        c.name,
        c.program_name ?? '',
        c.facilitator_name ?? '',
        c.meeting_schedule ?? '',
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [cohorts, search, tab])

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
          placeholder="Search by cohort name, program, facilitator…"
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
          disabled={programs.length === 0}
          style={{
            padding: '10px 18px',
            border: '1px solid #0A0A0A',
            background: '#0A0A0A',
            color: '#FFFFFF',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: programs.length === 0 ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            opacity: programs.length === 0 ? 0.5 : 1,
          }}
        >
          + Add Cohort
        </button>
      </section>

      {/* Status tabs */}
      <section
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '20px',
        }}
      >
        {STATUS_TABS.map((t) => {
          const count =
            t.key === 'all'
              ? cohorts.length
              : cohorts.filter((c) => c.status === t.key).length
          return (
            <TabButton
              key={t.key}
              label={`${t.label} · ${count}`}
              active={tab === t.key}
              onClick={() => setTab(t.key)}
            />
          )
        })}
      </section>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState search={search} hasData={cohorts.length > 0} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((c) => (
            <CohortRow key={c.id} cohort={c} />
          ))}
        </div>
      )}

      {/* Add modal */}
      {adding && (
        <CohortModal
          programs={programs}
          staff={staff}
          onClose={() => setAdding(false)}
          onSaved={(created) => {
            setCohorts((prev) => [created, ...prev])
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
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 14px',
        border: active
          ? '1px solid #0A0A0A'
          : '1px solid rgba(10, 10, 10, 0.16)',
        background: active ? '#0A0A0A' : '#FFFFFF',
        color: active ? '#FFFFFF' : '#0A0A0A',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  )
}

function CohortRow({ cohort }: { cohort: CohortWithJoins }) {
  const dateRange =
    cohort.end_date && cohort.end_date !== cohort.start_date
      ? `${formatDate(cohort.start_date)} – ${formatDate(cohort.end_date)}`
      : formatDate(cohort.start_date)

  const capacityLabel = cohort.capacity
    ? `${cohort.enrollment_count} / ${cohort.capacity}`
    : `${cohort.enrollment_count} enrolled`

  const isOverCapacity =
    cohort.capacity !== null && cohort.enrollment_count > cohort.capacity

  return (
    <article
      style={{
        border: '1px solid rgba(10, 10, 10, 0.1)',
        borderRadius: '8px',
        padding: '20px 22px',
        background: '#FFFFFF',
        display: 'grid',
        gridTemplateColumns: '40px 1fr auto',
        gap: '16px',
        alignItems: 'center',
      }}
    >
      <div style={{ fontSize: '28px', lineHeight: 1 }}>
        {cohort.program_icon ?? '📋'}
      </div>
      <div style={{ minWidth: 0 }}>
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
              fontSize: '17px',
              fontWeight: 600,
              color: '#0A0A0A',
              margin: 0,
              fontFamily: '"DM Serif Display", Georgia, serif',
            }}
          >
            {cohort.name}
          </h3>
          <StatusPill status={cohort.status} />
          <CapacityPill
            label={capacityLabel}
            over={isOverCapacity}
          />
        </div>
        <div
          style={{
            fontSize: '12px',
            color: 'rgba(10, 10, 10, 0.55)',
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
            marginBottom: '4px',
          }}
        >
          {cohort.program_name && `${cohort.program_name} · `}
          {dateRange}
          {cohort.meeting_schedule && ` · ${cohort.meeting_schedule}`}
        </div>
        {cohort.facilitator_name && (
          <div
            style={{
              fontSize: '12px',
              color: 'rgba(10, 10, 10, 0.5)',
              fontFamily:
                'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
              letterSpacing: '0.04em',
            }}
          >
            Facilitator: {cohort.facilitator_name}
          </div>
        )}
      </div>
      <Link
        href={`/admin/cohorts/${cohort.id}`}
        style={{
          padding: '8px 16px',
          border: '1px solid #0A0A0A',
          background: '#FFFFFF',
          color: '#0A0A0A',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: 500,
          textDecoration: 'none',
          fontFamily: 'inherit',
          display: 'inline-block',
        }}
      >
        Open
      </Link>
    </article>
  )
}

function StatusPill({ status }: { status: CohortStatus }) {
  const c = COHORT_STATUS_COLORS[status]
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
      {COHORT_STATUS_LABELS[status]}
    </span>
  )
}

function CapacityPill({ label, over }: { label: string; over: boolean }) {
  return (
    <span
      style={{
        fontSize: '11px',
        fontWeight: 600,
        padding: '3px 8px',
        borderRadius: '4px',
        background: over ? 'rgba(206, 17, 38, 0.12)' : 'rgba(10, 10, 10, 0.05)',
        color: over ? '#CE1126' : 'rgba(10, 10, 10, 0.7)',
        fontFamily:
          'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
      }}
    >
      {label}
    </span>
  )
}

function EmptyState({
  search,
  hasData,
}: {
  search: string
  hasData: boolean
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
          ? `No cohorts match "${search}".`
          : hasData
            ? 'No cohorts in this status.'
            : 'No cohorts yet. Click + Add Cohort to create the first cohort.'}
      </div>
    </div>
  )
}

function CohortModal({
  programs,
  staff,
  onClose,
  onSaved,
}: {
  programs: ProgramOption[]
  staff: StaffOption[]
  onClose: () => void
  onSaved: (record: CohortWithJoins) => void
}) {
  const today = new Date().toISOString().slice(0, 10)

  const [draft, setDraft] = useState<CohortEditableFields>({
    program_id: programs[0]?.id ?? '',
    name: '',
    cohort_number: null,
    start_date: today,
    end_date: null,
    meeting_schedule: null,
    capacity: null,
    status: 'planned',
    primary_facilitator_id: null,
    internal_notes: null,
  })
  const [pending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function update<K extends keyof CohortEditableFields>(
    key: K,
    value: CohortEditableFields[K],
  ) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function save() {
    if (!draft.program_id) {
      setErrorMsg('Select a program.')
      return
    }
    if (!draft.name.trim()) {
      setErrorMsg('Cohort name is required.')
      return
    }
    setErrorMsg(null)

    startTransition(async () => {
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from('cohorts')
        .insert(draft)
        .select()
        .single()

      if (error || !data) {
        setErrorMsg(error?.message ?? 'Failed to save.')
        return
      }

      // Decorate with join data for display
      const program = programs.find((p) => p.id === draft.program_id)
      const facilitator = draft.primary_facilitator_id
        ? staff.find((s) => s.id === draft.primary_facilitator_id)
        : undefined

      const decorated: CohortWithJoins = {
        ...(data as unknown as CohortWithJoins),
        program_name: program?.name ?? null,
        program_icon: program?.icon_emoji ?? null,
        facilitator_name: facilitator?.full_name ?? null,
        enrollment_count: 0,
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
          maxWidth: '640px',
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
          Add Cohort
        </h2>
        <p
          style={{
            fontSize: '13px',
            color: 'rgba(10, 10, 10, 0.6)',
            marginBottom: '24px',
          }}
        >
          A specific instance of a program — when it runs, who facilitates,
          who can enroll.
        </p>

        <Field label="Program *">
          <select
            value={draft.program_id}
            onChange={(e) => update('program_id', e.target.value)}
            style={inputStyle}
          >
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.icon_emoji ?? '📋'} {p.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Cohort Name *">
          <input
            type="text"
            value={draft.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder='e.g. "Summer Youth 2026 - Cohort A"'
            style={inputStyle}
          />
        </Field>

        <Row>
          <Field label="Cohort Number">
            <input
              type="number"
              min="1"
              value={draft.cohort_number ?? ''}
              onChange={(e) =>
                update(
                  'cohort_number',
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              style={inputStyle}
            />
          </Field>
          <Field label="Status">
            <select
              value={draft.status}
              onChange={(e) =>
                update('status', e.target.value as CohortStatus)
              }
              style={inputStyle}
            >
              {(Object.keys(COHORT_STATUS_LABELS) as CohortStatus[]).map(
                (s) => (
                  <option key={s} value={s}>
                    {COHORT_STATUS_LABELS[s]}
                  </option>
                ),
              )}
            </select>
          </Field>
        </Row>

        <Row>
          <Field label="Start Date *">
            <input
              type="date"
              value={draft.start_date}
              onChange={(e) => update('start_date', e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="End Date">
            <input
              type="date"
              value={draft.end_date ?? ''}
              onChange={(e) => update('end_date', e.target.value || null)}
              style={inputStyle}
            />
          </Field>
        </Row>

        <Field label="Meeting Schedule">
          <input
            type="text"
            value={draft.meeting_schedule ?? ''}
            onChange={(e) =>
              update('meeting_schedule', e.target.value || null)
            }
            placeholder='e.g. "Mondays 6-8pm" or "Tues/Thurs 4-5pm"'
            style={inputStyle}
          />
        </Field>

        <Row>
          <Field label="Capacity">
            <input
              type="number"
              min="1"
              value={draft.capacity ?? ''}
              onChange={(e) =>
                update(
                  'capacity',
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              placeholder="Max participants"
              style={inputStyle}
            />
          </Field>
          <Field label="Facilitator">
            <select
              value={draft.primary_facilitator_id ?? ''}
              onChange={(e) =>
                update('primary_facilitator_id', e.target.value || null)
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
        </Row>

        <Field label="Internal Notes">
          <textarea
            value={draft.internal_notes ?? ''}
            onChange={(e) => update('internal_notes', e.target.value || null)}
            rows={3}
            placeholder="Operational context — not visible to participants."
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
            {pending ? 'Saving…' : 'Add Cohort'}
          </button>
        </div>
      </div>
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
