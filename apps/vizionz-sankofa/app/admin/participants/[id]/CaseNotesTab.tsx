'use client'

// VIZIONZ SANKOFA · /admin/participants/[id] · CaseNotesTab
//
// Timeline of case notes for one participant. Each note shows when, who, how
// (contact method), subject, content, follow-up, and confidentiality flag.
// Add-note modal at the top of the list.

import { useMemo, useState, useTransition } from 'react'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type {
  CaseNoteWithStaff,
  CaseNoteEditableFields,
  ContactMethod,
} from './types'
import {
  CONTACT_METHOD_LABELS,
  CONTACT_METHOD_ICONS,
} from './types'
import type { StaffRecord } from '../types'

export function CaseNotesTab({
  participantId,
  initialNotes,
  staff,
  defaultAuthorId,
}: {
  participantId: string
  initialNotes: CaseNoteWithStaff[]
  staff: StaffRecord[]
  defaultAuthorId: string | null
}) {
  const [notes, setNotes] = useState<CaseNoteWithStaff[]>(initialNotes)
  const [adding, setAdding] = useState(false)
  const [confidentialVisible, setConfidentialVisible] = useState(false)

  const visibleNotes = useMemo(() => {
    if (confidentialVisible) return notes
    return notes.filter((n) => !n.is_confidential)
  }, [notes, confidentialVisible])

  const confidentialCount = notes.filter((n) => n.is_confidential).length

  return (
    <div>
      {/* Header controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
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
            Timeline
          </div>
          <div
            style={{
              fontSize: '14px',
              color: 'rgba(10, 10, 10, 0.65)',
            }}
          >
            {notes.length} {notes.length === 1 ? 'note' : 'notes'} total
            {confidentialCount > 0 &&
              ` · ${confidentialCount} confidential ${confidentialCount === 1 ? 'note' : 'notes'}`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {confidentialCount > 0 && (
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                cursor: 'pointer',
                color: 'rgba(10, 10, 10, 0.7)',
              }}
            >
              <input
                type="checkbox"
                checked={confidentialVisible}
                onChange={(e) => setConfidentialVisible(e.target.checked)}
              />
              Show confidential
            </label>
          )}
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
            + Add Note
          </button>
        </div>
      </div>

      {/* Timeline */}
      {visibleNotes.length === 0 ? (
        <EmptyState hasHiddenConfidential={confidentialCount > 0 && !confidentialVisible} />
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {visibleNotes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}

      {/* Add modal */}
      {adding && defaultAuthorId && (
        <AddNoteModal
          participantId={participantId}
          staff={staff}
          defaultAuthorId={defaultAuthorId}
          onClose={() => setAdding(false)}
          onSaved={(newNote) => {
            setNotes((prev) => [newNote, ...prev])
            setAdding(false)
          }}
        />
      )}

      {adding && !defaultAuthorId && (
        <NoAuthorBlocker onClose={() => setAdding(false)} />
      )}
    </div>
  )
}

function NoteCard({ note }: { note: CaseNoteWithStaff }) {
  const icon = CONTACT_METHOD_ICONS[note.contact_method]
  const methodLabel = CONTACT_METHOD_LABELS[note.contact_method]
  const occurred = formatDateTime(note.occurred_at)

  return (
    <article
      style={{
        border: '1px solid rgba(10, 10, 10, 0.1)',
        borderRadius: '8px',
        padding: '20px 22px',
        background: note.is_confidential ? '#FFFAF0' : '#FFFFFF',
        borderLeft: note.is_confidential
          ? '4px solid #B45F00'
          : '1px solid rgba(10, 10, 10, 0.1)',
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px',
        }}
      >
        <span style={{ fontSize: '24px', lineHeight: 1 }}>{icon}</span>
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          <div
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#0A0A0A',
              marginBottom: '2px',
            }}
          >
            {note.subject ?? methodLabel}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: 'rgba(10, 10, 10, 0.55)',
              fontFamily:
                'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
            }}
          >
            {occurred} · {methodLabel}
            {note.duration_minutes !== null &&
              ` · ${note.duration_minutes} min`}
            {note.staff_full_name && ` · ${note.staff_full_name}`}
          </div>
        </div>
        {note.is_confidential && <ConfidentialBadge />}
      </div>

      {/* Content */}
      <div
        style={{
          fontSize: '14px',
          lineHeight: 1.6,
          color: 'rgba(10, 10, 10, 0.85)',
          whiteSpace: 'pre-wrap',
          marginBottom: note.next_action ? '16px' : 0,
        }}
      >
        {note.content}
      </div>

      {/* Next action callout */}
      {note.next_action && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: '6px',
            background: note.next_action_completed
              ? 'rgba(0, 122, 51, 0.06)'
              : 'rgba(91, 44, 143, 0.06)',
            border: note.next_action_completed
              ? '1px solid rgba(0, 122, 51, 0.2)'
              : '1px solid rgba(91, 44, 143, 0.2)',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: note.next_action_completed ? '#007A33' : '#5B2C8F',
              marginBottom: '4px',
              fontFamily:
                'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
            }}
          >
            {note.next_action_completed ? 'Follow-up Complete' : 'Follow-up'}
            {note.next_action_due && ` · Due ${formatDate(note.next_action_due)}`}
          </div>
          <div
            style={{
              fontSize: '13px',
              color: '#0A0A0A',
              lineHeight: 1.5,
              textDecoration: note.next_action_completed ? 'line-through' : 'none',
            }}
          >
            {note.next_action}
          </div>
        </div>
      )}
    </article>
  )
}

function ConfidentialBadge() {
  return (
    <span
      style={{
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        padding: '3px 8px',
        borderRadius: '4px',
        background: 'rgba(180, 95, 0, 0.12)',
        color: '#B45F00',
        fontFamily:
          'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
      }}
    >
      Confidential
    </span>
  )
}

function EmptyState({
  hasHiddenConfidential,
}: {
  hasHiddenConfidential: boolean
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
          marginBottom: hasHiddenConfidential ? '8px' : 0,
        }}
      >
        {hasHiddenConfidential
          ? 'No visible notes yet.'
          : 'No case notes yet. Click + Add Note to log the first interaction.'}
      </div>
      {hasHiddenConfidential && (
        <div
          style={{
            fontSize: '12px',
            color: 'rgba(10, 10, 10, 0.5)',
          }}
        >
          Toggle "Show confidential" above to view sensitive notes.
        </div>
      )}
    </div>
  )
}

function NoAuthorBlocker({ onClose }: { onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 10, 10, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 16px',
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '460px',
          width: '100%',
          background: '#FFFFFF',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 24px 64px rgba(10, 10, 10, 0.25)',
        }}
      >
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 600,
            color: '#0A0A0A',
            marginBottom: '12px',
            fontFamily: '"DM Serif Display", Georgia, serif',
          }}
        >
          Add staff first
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: 'rgba(10, 10, 10, 0.7)',
            lineHeight: 1.6,
            marginBottom: '20px',
          }}
        >
          You need at least one active staff member to log case notes. Notes
          must be attributed to a real person (legal record).
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
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
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

function AddNoteModal({
  participantId,
  staff,
  defaultAuthorId,
  onClose,
  onSaved,
}: {
  participantId: string
  staff: StaffRecord[]
  defaultAuthorId: string
  onClose: () => void
  onSaved: (note: CaseNoteWithStaff) => void
}) {
  const now = new Date()
  const nowLocal = toLocalDateTimeInputValue(now)

  const [staffId, setStaffId] = useState<string>(defaultAuthorId)
  const [draft, setDraft] = useState<CaseNoteEditableFields>({
    occurred_at: nowLocal,
    duration_minutes: null,
    contact_method: 'in_person',
    subject: null,
    content: '',
    next_action: null,
    next_action_due: null,
    is_confidential: false,
  })
  const [pending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function update<K extends keyof CaseNoteEditableFields>(
    key: K,
    value: CaseNoteEditableFields[K],
  ) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function save() {
    if (!draft.content.trim()) {
      setErrorMsg('Note content is required.')
      return
    }
    if (!staffId) {
      setErrorMsg('Select the staff member who handled this contact.')
      return
    }
    setErrorMsg(null)

    startTransition(async () => {
      const supabase = createBrowserClient()

      // Convert local datetime to ISO timestamptz
      const occurredISO = new Date(draft.occurred_at).toISOString()

      const insertPayload = {
        participant_id: participantId,
        staff_id: staffId,
        occurred_at: occurredISO,
        duration_minutes: draft.duration_minutes,
        contact_method: draft.contact_method,
        subject: draft.subject,
        content: draft.content,
        next_action: draft.next_action,
        next_action_due: draft.next_action_due,
        next_action_completed: false,
        is_confidential: draft.is_confidential,
      }

      const { data, error } = await supabase
        .from('case_notes')
        .insert(insertPayload)
        .select()
        .single()

      if (error || !data) {
        setErrorMsg(error?.message ?? 'Failed to save.')
        return
      }

      // Decorate with staff info for display
      const authorStaff = staff.find((s) => s.id === staffId)
      const decorated: CaseNoteWithStaff = {
        ...(data as unknown as CaseNoteWithStaff),
        staff_full_name: authorStaff?.full_name ?? null,
        staff_role: authorStaff?.role ?? null,
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
          Add Case Note
        </h2>
        <p
          style={{
            fontSize: '13px',
            color: 'rgba(10, 10, 10, 0.6)',
            marginBottom: '24px',
          }}
        >
          Log a real interaction. Be specific. This becomes the legal record.
        </p>

        <Row>
          <Field label="When *">
            <input
              type="datetime-local"
              value={draft.occurred_at}
              onChange={(e) => update('occurred_at', e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Contact Method *">
            <select
              value={draft.contact_method}
              onChange={(e) =>
                update('contact_method', e.target.value as ContactMethod)
              }
              style={inputStyle}
            >
              {(Object.keys(CONTACT_METHOD_LABELS) as ContactMethod[]).map(
                (m) => (
                  <option key={m} value={m}>
                    {CONTACT_METHOD_ICONS[m]} {CONTACT_METHOD_LABELS[m]}
                  </option>
                ),
              )}
            </select>
          </Field>
        </Row>

        <Row>
          <Field label="Staff Member *">
            <select
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              style={inputStyle}
            >
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}
                  {s.role ? ` (${s.role})` : ''}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Duration (min)">
            <input
              type="number"
              min="0"
              value={draft.duration_minutes ?? ''}
              onChange={(e) =>
                update(
                  'duration_minutes',
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              style={inputStyle}
            />
          </Field>
        </Row>

        <Field label="Subject (short title)">
          <input
            type="text"
            value={draft.subject ?? ''}
            onChange={(e) => update('subject', e.target.value || null)}
            placeholder='e.g. "Checked in after housing placement"'
            style={inputStyle}
          />
        </Field>

        <Field label="What happened? *">
          <textarea
            value={draft.content}
            onChange={(e) => update('content', e.target.value)}
            rows={5}
            placeholder="What was discussed, what was provided, what was decided. Be specific."
            style={{ ...inputStyle, fontFamily: 'inherit' }}
          />
        </Field>

        <Field label="Follow-up (optional)">
          <textarea
            value={draft.next_action ?? ''}
            onChange={(e) => update('next_action', e.target.value || null)}
            rows={2}
            placeholder="What needs to happen next?"
            style={{ ...inputStyle, fontFamily: 'inherit' }}
          />
        </Field>

        <Field label="Follow-up due date">
          <input
            type="date"
            value={draft.next_action_due ?? ''}
            onChange={(e) =>
              update('next_action_due', e.target.value || null)
            }
            style={{ ...inputStyle, maxWidth: '200px' }}
          />
        </Field>

        <Field label="">
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              padding: '12px 14px',
              border: '1px solid rgba(10, 10, 10, 0.16)',
              borderRadius: '6px',
              background: draft.is_confidential
                ? 'rgba(180, 95, 0, 0.06)'
                : '#FFFFFF',
            }}
          >
            <input
              type="checkbox"
              checked={draft.is_confidential}
              onChange={(e) => update('is_confidential', e.target.checked)}
            />
            <span style={{ fontSize: '14px', color: '#0A0A0A' }}>
              Mark as confidential (hidden by default; only shown when toggled)
            </span>
          </label>
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
          <button
            onClick={onClose}
            disabled={pending}
            style={cancelBtn(pending)}
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={pending}
            style={saveBtn(pending)}
          >
            {pending ? 'Saving…' : 'Save Note'}
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

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function formatDate(d: string | null): string {
  if (!d) return ''
  try {
    const date = new Date(d)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return d
  }
}

function toLocalDateTimeInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
