'use client'

// VIZIONZ SANKOFA · /admin/cohorts/[id] · EnrollmentsClient
//
// Enrollment roster for one cohort. Three interactive surfaces:
//   1. List of enrolled participants with status pills + per-row edit
//   2. "+ Enroll Participant" modal with searchable participant picker
//      (filters out already-enrolled participants client-side)
//   3. Per-enrollment status editor (mark withdrew, mark completed, add notes)

import { useMemo, useState, useTransition } from 'react'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type {
  EnrollmentWithParticipant,
  EnrollmentStatus,
  EnrollmentEditableFields,
  AvailableParticipant,
} from './types'
import {
  ENROLLMENT_STATUS_LABELS,
  ENROLLMENT_STATUS_COLORS,
} from './types'

const STATUS_TABS: { key: 'all' | EnrollmentStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'enrolled', label: 'Enrolled' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'withdrew', label: 'Withdrew' },
  { key: 'transferred', label: 'Transferred' },
]

export function EnrollmentsClient({
  cohortId,
  cohortCapacity,
  initialEnrollments,
  allParticipants,
}: {
  cohortId: string
  cohortCapacity: number | null
  initialEnrollments: EnrollmentWithParticipant[]
  allParticipants: AvailableParticipant[]
}) {
  const [enrollments, setEnrollments] =
    useState<EnrollmentWithParticipant[]>(initialEnrollments)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [tab, setTab] = useState<'all' | EnrollmentStatus>('all')

  const filtered = useMemo(() => {
    if (tab === 'all') return enrollments
    return enrollments.filter((e) => e.status === tab)
  }, [enrollments, tab])

  const activeCount = enrollments.filter((e) =>
    ['enrolled', 'active', 'completed'].includes(e.status),
  ).length
  const atCapacity = cohortCapacity !== null && activeCount >= cohortCapacity

  // Participants who are NOT yet enrolled (any status) in this cohort
  const enrolledIds = useMemo(
    () => new Set(enrollments.map((e) => e.participant_id)),
    [enrollments],
  )
  const availableForEnrollment = useMemo(
    () => allParticipants.filter((p) => !enrolledIds.has(p.id)),
    [allParticipants, enrolledIds],
  )

  const editingEnrollment = editingId
    ? enrollments.find((e) => e.id === editingId)
    : null

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(10, 10, 10, 0.55)',
              marginBottom: '4px',
              fontFamily:
                'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
            }}
          >
            Roster
          </div>
          <div
            style={{
              fontSize: '14px',
              color: 'rgba(10, 10, 10, 0.65)',
            }}
          >
            {enrollments.length}{' '}
            {enrollments.length === 1 ? 'enrollment' : 'enrollments'} total ·{' '}
            {activeCount} active
            {cohortCapacity !== null && ` of ${cohortCapacity}`}
          </div>
        </div>
        <button
          onClick={() => setAdding(true)}
          disabled={availableForEnrollment.length === 0}
          style={{
            padding: '10px 18px',
            border: '1px solid #0A0A0A',
            background: atCapacity ? 'rgba(206, 17, 38, 0.9)' : '#0A0A0A',
            color: '#FFFFFF',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor:
              availableForEnrollment.length === 0 ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            opacity: availableForEnrollment.length === 0 ? 0.5 : 1,
          }}
        >
          {atCapacity ? '+ Enroll (Over Capacity)' : '+ Enroll Participant'}
        </button>
      </div>

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
              ? enrollments.length
              : enrollments.filter((e) => e.status === t.key).length
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

      {/* Roster list */}
      {filtered.length === 0 ? (
        <EmptyState hasAny={enrollments.length > 0} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map((enrollment) => (
            <EnrollmentRow
              key={enrollment.id}
              enrollment={enrollment}
              onEdit={() => setEditingId(enrollment.id)}
            />
          ))}
        </div>
      )}

      {/* Enroll modal */}
      {adding && (
        <EnrollModal
          cohortId={cohortId}
          availableParticipants={availableForEnrollment}
          atCapacity={atCapacity}
          onClose={() => setAdding(false)}
          onEnrolled={(newEnrollment) => {
            setEnrollments((prev) => [...prev, newEnrollment])
            setAdding(false)
          }}
        />
      )}

      {/* Edit modal */}
      {editingEnrollment && (
        <EditEnrollmentModal
          enrollment={editingEnrollment}
          onClose={() => setEditingId(null)}
          onSaved={(updated) => {
            setEnrollments((prev) =>
              prev.map((e) => (e.id === updated.id ? updated : e)),
            )
            setEditingId(null)
          }}
        />
      )}
    </div>
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

function EnrollmentRow({
  enrollment,
  onEdit,
}: {
  enrollment: EnrollmentWithParticipant
  onEdit: () => void
}) {
  const displayName =
    enrollment.participant_preferred_name &&
    enrollment.participant_preferred_name.trim().length > 0
      ? `${enrollment.participant_preferred_name} (${enrollment.participant_first_name} ${enrollment.participant_last_name})`
      : `${enrollment.participant_first_name} ${enrollment.participant_last_name}`

  return (
    <article
      style={{
        border: '1px solid rgba(10, 10, 10, 0.1)',
        borderRadius: '6px',
        padding: '16px 20px',
        background: '#FFFFFF',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '14px',
        alignItems: 'center',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '4px',
          }}
        >
          <h3
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#0A0A0A',
              margin: 0,
            }}
          >
            {displayName}
          </h3>
          <StatusPill status={enrollment.status} />
        </div>
        <div
          style={{
            fontSize: '12px',
            color: 'rgba(10, 10, 10, 0.55)',
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          }}
        >
          Enrolled {formatDate(enrollment.enrolled_at)}
          {enrollment.completed_at &&
            ` · Completed ${formatDate(enrollment.completed_at)}`}
          {enrollment.withdrew_at &&
            ` · Withdrew ${formatDate(enrollment.withdrew_at)}`}
        </div>
        {enrollment.withdrawal_reason && (
          <div
            style={{
              fontSize: '12px',
              color: '#CE1126',
              marginTop: '6px',
              lineHeight: 1.5,
            }}
          >
            Reason: {enrollment.withdrawal_reason}
          </div>
        )}
        {enrollment.notes && (
          <div
            style={{
              fontSize: '13px',
              color: 'rgba(10, 10, 10, 0.7)',
              marginTop: '6px',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
            }}
          >
            {enrollment.notes}
          </div>
        )}
      </div>
      <button
        onClick={onEdit}
        style={{
          padding: '6px 14px',
          border: '1px solid rgba(10, 10, 10, 0.18)',
          background: '#FFFFFF',
          color: '#0A0A0A',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        Edit
      </button>
    </article>
  )
}

function StatusPill({ status }: { status: EnrollmentStatus }) {
  const c = ENROLLMENT_STATUS_COLORS[status]
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
      {ENROLLMENT_STATUS_LABELS[status]}
    </span>
  )
}

function EmptyState({ hasAny }: { hasAny: boolean }) {
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
        {hasAny
          ? 'No enrollments in this status.'
          : 'No participants enrolled yet. Click + Enroll Participant to add the first one.'}
      </div>
    </div>
  )
}

function EnrollModal({
  cohortId,
  availableParticipants,
  atCapacity,
  onClose,
  onEnrolled,
}: {
  cohortId: string
  availableParticipants: AvailableParticipant[]
  atCapacity: boolean
  onClose: () => void
  onEnrolled: (e: EnrollmentWithParticipant) => void
}) {
  const today = new Date().toISOString().slice(0, 10)

  const [search, setSearch] = useState('')
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>('')
  const [enrolledAt, setEnrolledAt] = useState(today)
  const [status, setStatus] = useState<EnrollmentStatus>('enrolled')
  const [notes, setNotes] = useState('')
  const [pending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const filteredParticipants = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return availableParticipants
    return availableParticipants.filter((p) => {
      const haystack = [
        p.first_name,
        p.last_name,
        p.preferred_name ?? '',
        p.city ?? '',
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [availableParticipants, search])

  const selected = availableParticipants.find(
    (p) => p.id === selectedParticipantId,
  )

  function save() {
    if (!selectedParticipantId) {
      setErrorMsg('Select a participant.')
      return
    }
    setErrorMsg(null)

    startTransition(async () => {
      const supabase = createBrowserClient()
      const insertPayload = {
        cohort_id: cohortId,
        participant_id: selectedParticipantId,
        status,
        enrolled_at: enrolledAt,
        notes: notes.trim() || null,
      }

      const { data, error } = await supabase
        .from('enrollments')
        .insert(insertPayload)
        .select()
        .single()

      if (error || !data) {
        setErrorMsg(error?.message ?? 'Failed to enroll.')
        return
      }

      const decorated: EnrollmentWithParticipant = {
        ...(data as unknown as EnrollmentWithParticipant),
        participant_first_name: selected?.first_name ?? '',
        participant_last_name: selected?.last_name ?? '',
        participant_preferred_name: selected?.preferred_name ?? null,
        participant_status: selected?.status ?? null,
      }
      onEnrolled(decorated)
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
          Enroll Participant
        </h2>
        <p
          style={{
            fontSize: '13px',
            color: 'rgba(10, 10, 10, 0.6)',
            marginBottom: '20px',
          }}
        >
          {atCapacity
            ? 'This cohort is at capacity — enrolling will exceed the limit.'
            : `${availableParticipants.length} participant${availableParticipants.length === 1 ? '' : 's'} not yet enrolled.`}
        </p>

        {atCapacity && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(206, 17, 38, 0.08)',
              color: '#CE1126',
              borderRadius: '6px',
              fontSize: '13px',
              marginBottom: '20px',
            }}
          >
            Over-capacity enrollment allowed but flagged. Increase capacity or
            move someone before adding more.
          </div>
        )}

        <Field label="Search Participants">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, preferred name, or city…"
            style={inputStyle}
          />
        </Field>

        <Field label="Select Participant *">
          <div
            style={{
              maxHeight: '240px',
              overflowY: 'auto',
              border: '1px solid rgba(10, 10, 10, 0.16)',
              borderRadius: '6px',
              background: '#FFFFFF',
            }}
          >
            {filteredParticipants.length === 0 ? (
              <div
                style={{
                  padding: '20px',
                  textAlign: 'center',
                  fontSize: '13px',
                  color: 'rgba(10, 10, 10, 0.5)',
                }}
              >
                No participants match your search.
              </div>
            ) : (
              filteredParticipants.map((p) => {
                const name =
                  p.preferred_name && p.preferred_name.trim().length > 0
                    ? `${p.preferred_name} (${p.first_name} ${p.last_name})`
                    : `${p.first_name} ${p.last_name}`
                const isSelected = selectedParticipantId === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedParticipantId(p.id)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px 14px',
                      border: 'none',
                      borderBottom: '1px solid rgba(10, 10, 10, 0.06)',
                      background: isSelected
                        ? 'rgba(91, 44, 143, 0.08)'
                        : '#FFFFFF',
                      color: '#0A0A0A',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: '14px',
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{name}</div>
                    {p.city && (
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'rgba(10, 10, 10, 0.55)',
                          marginTop: '2px',
                          fontFamily:
                            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
                        }}
                      >
                        {p.city} · {p.status ?? '—'}
                      </div>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </Field>

        <Row>
          <Field label="Enrolled Date *">
            <input
              type="date"
              value={enrolledAt}
              onChange={(e) => setEnrolledAt(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Initial Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as EnrollmentStatus)}
              style={inputStyle}
            >
              <option value="enrolled">Enrolled</option>
              <option value="active">Active</option>
            </select>
          </Field>
        </Row>

        <Field label="Notes (optional)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Anything worth recording about this enrollment?"
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
            {pending ? 'Enrolling…' : 'Enroll'}
          </button>
        </div>
      </div>
    </div>
  )
}

function EditEnrollmentModal({
  enrollment,
  onClose,
  onSaved,
}: {
  enrollment: EnrollmentWithParticipant
  onClose: () => void
  onSaved: (e: EnrollmentWithParticipant) => void
}) {
  const [draft, setDraft] = useState<EnrollmentEditableFields>({
    status: enrollment.status,
    completed_at: enrollment.completed_at,
    withdrew_at: enrollment.withdrew_at,
    withdrawal_reason: enrollment.withdrawal_reason,
    notes: enrollment.notes,
  })
  const [pending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function update<K extends keyof EnrollmentEditableFields>(
    key: K,
    value: EnrollmentEditableFields[K],
  ) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function save() {
    setErrorMsg(null)

    // Auto-set lifecycle timestamps based on status transitions
    const today = new Date().toISOString().slice(0, 10)
    const payload: EnrollmentEditableFields = { ...draft }

    if (draft.status === 'completed' && !draft.completed_at) {
      payload.completed_at = today
    }
    if (draft.status === 'withdrew' && !draft.withdrew_at) {
      payload.withdrew_at = today
    }

    startTransition(async () => {
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from('enrollments')
        .update(payload)
        .eq('id', enrollment.id)
        .select()
        .single()

      if (error || !data) {
        setErrorMsg(error?.message ?? 'Failed to save.')
        return
      }

      const decorated: EnrollmentWithParticipant = {
        ...(data as unknown as EnrollmentWithParticipant),
        participant_first_name: enrollment.participant_first_name,
        participant_last_name: enrollment.participant_last_name,
        participant_preferred_name: enrollment.participant_preferred_name,
        participant_status: enrollment.participant_status,
      }
      onSaved(decorated)
    })
  }

  const displayName =
    enrollment.participant_preferred_name &&
    enrollment.participant_preferred_name.trim().length > 0
      ? `${enrollment.participant_preferred_name} (${enrollment.participant_first_name} ${enrollment.participant_last_name})`
      : `${enrollment.participant_first_name} ${enrollment.participant_last_name}`

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
          maxWidth: '560px',
          background: '#FFFFFF',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 24px 64px rgba(10, 10, 10, 0.25)',
        }}
      >
        <h2
          style={{
            fontSize: '22px',
            fontWeight: 600,
            color: '#0A0A0A',
            marginBottom: '6px',
            fontFamily: '"DM Serif Display", Georgia, serif',
          }}
        >
          Edit Enrollment
        </h2>
        <p
          style={{
            fontSize: '13px',
            color: 'rgba(10, 10, 10, 0.6)',
            marginBottom: '20px',
          }}
        >
          {displayName}
        </p>

        <Field label="Status *">
          <select
            value={draft.status}
            onChange={(e) =>
              update('status', e.target.value as EnrollmentStatus)
            }
            style={inputStyle}
          >
            {(
              Object.keys(ENROLLMENT_STATUS_LABELS) as EnrollmentStatus[]
            ).map((s) => (
              <option key={s} value={s}>
                {ENROLLMENT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>

        {draft.status === 'completed' && (
          <Field label="Completed Date">
            <input
              type="date"
              value={draft.completed_at ?? ''}
              onChange={(e) => update('completed_at', e.target.value || null)}
              style={inputStyle}
            />
          </Field>
        )}

        {draft.status === 'withdrew' && (
          <>
            <Field label="Withdrew Date">
              <input
                type="date"
                value={draft.withdrew_at ?? ''}
                onChange={(e) => update('withdrew_at', e.target.value || null)}
                style={inputStyle}
              />
            </Field>
            <Field label="Withdrawal Reason">
              <textarea
                value={draft.withdrawal_reason ?? ''}
                onChange={(e) =>
                  update('withdrawal_reason', e.target.value || null)
                }
                rows={2}
                placeholder="Why did this participant leave?"
                style={{ ...inputStyle, fontFamily: 'inherit' }}
              />
            </Field>
          </>
        )}

        <Field label="Notes">
          <textarea
            value={draft.notes ?? ''}
            onChange={(e) => update('notes', e.target.value || null)}
            rows={3}
            placeholder="General notes about this enrollment."
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
            {pending ? 'Saving…' : 'Save Changes'}
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
