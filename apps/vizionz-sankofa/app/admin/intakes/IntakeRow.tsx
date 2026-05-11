// VIZIONZ SANKOFA · /admin/intakes · IntakeRow
// Expandable row for a single intake request.
// Collapsed: at-a-glance scan view.
// Expanded: full details + operator actions.

'use client'

import { useState, useTransition } from 'react'
import {
  markIntakeContacted,
  updateIntakeStatus,
  saveIntakeNotes,
  deleteIntake,
  promoteIntakeToLegacyline,
} from '../actions/intakes'
import { splitFullNameForPromotion } from '@/lib/legacyline/client'

export type IntakeRecord = {
  id: string
  full_name: string
  email: string
  phone: string | null
  request_type: string
  details: string | null
  consent_given: boolean
  status:
    | 'new'
    | 'contacted'
    | 'in_progress'
    | 'resolved'
    | 'promoted_to_legacyline'
    | 'closed_no_response'
  notes: string | null
  contacted_at: string | null
  assigned_to: string | null
  created_at: string
  legacyline_participant_id: string | null
  legacyline_registry_id: string | null
  legacyline_promoted_at: string | null
  legacyline_error: string | null
}

const REQUEST_TYPE_LABELS: Record<string, string> = {
  food_assistance: 'Food assistance',
  family_support: 'Family support',
  refugee_immigrant_services: 'Refugee & immigrant services',
  education: 'Education support',
  housing: 'Housing',
  other: 'Other',
}

const STATUS_LABELS: Record<IntakeRecord['status'], string> = {
  new: 'New',
  contacted: 'Contacted',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  promoted_to_legacyline: 'Legacyline',
  closed_no_response: 'Closed',
}

const STATUS_COLORS: Record<IntakeRecord['status'], string> = {
  new: '#CE1126',
  contacted: '#0A2548',
  in_progress: '#0A2548',
  resolved: '#007A33',
  promoted_to_legacyline: '#007A33',
  closed_no_response: 'rgba(10, 10, 10, 0.4)',
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatRelative(iso: string): string {
  const date = new Date(iso)
  const ms = Date.now() - date.getTime()
  const minutes = Math.floor(ms / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return formatTimestamp(iso).split(',')[0]
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max).trim() + '…'
}

export function IntakeRow({
  intake,
  defaultExpanded = false,
}: {
  intake: IntakeRecord
  defaultExpanded?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [notes, setNotes] = useState(intake.notes ?? '')
  const [notesSaved, setNotesSaved] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const requestTypeLabel =
    REQUEST_TYPE_LABELS[intake.request_type] ?? intake.request_type
  const statusLabel = STATUS_LABELS[intake.status]
  const statusColor = STATUS_COLORS[intake.status]

  function handleMarkContacted() {
    setError(null)
    startTransition(async () => {
      const result = await markIntakeContacted(intake.id)
      if (!result.ok) {
        setError(result.error ?? 'Could not mark contacted')
      }
    })
  }

  function handleStatusChange(newStatus: string) {
    setError(null)
    startTransition(async () => {
      const result = await updateIntakeStatus(intake.id, newStatus)
      if (!result.ok) {
        setError(result.error ?? 'Status update failed')
      }
    })
  }

  function handleSaveNotes() {
    setError(null)
    setNotesSaved(null)
    startTransition(async () => {
      const result = await saveIntakeNotes(intake.id, notes)
      if (!result.ok) {
        setError(result.error ?? 'Notes save failed')
        return
      }
      setNotesSaved(true)
      setTimeout(() => setNotesSaved(null), 2500)
    })
  }

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = await deleteIntake(intake.id)
      if (!result.ok) {
        setError(result.error ?? 'Delete failed')
      }
    })
  }

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(10, 10, 10, 0.08)',
        borderLeft: `3px solid ${statusColor}`,
        borderRadius: '2px',
        overflow: 'hidden',
        transition: 'box-shadow 0.15s ease',
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          padding: '14px 16px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <StatusBadge label={statusLabel} color={statusColor} />

        <div
          style={{
            flex: 1,
            minWidth: '180px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#0A0A0A',
              fontFamily: '"DM Serif Display", Georgia, serif',
              lineHeight: 1.2,
            }}
          >
            {intake.full_name}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: 'rgba(10, 10, 10, 0.6)',
              fontFamily:
                'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
              letterSpacing: '0.04em',
            }}
          >
            {requestTypeLabel} · {formatRelative(intake.created_at)}
          </div>
          {intake.details && !expanded && (
            <div
              style={{
                fontSize: '13px',
                color: 'rgba(10, 10, 10, 0.55)',
                lineHeight: 1.4,
                marginTop: '2px',
              }}
            >
              {truncate(intake.details, 120)}
            </div>
          )}
        </div>

        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(10, 10, 10, 0.4)',
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
            flexShrink: 0,
          }}
        >
          {expanded ? '— Close' : 'Open →'}
        </span>
      </button>

      {expanded && (
        <div
          style={{
            padding: '20px 16px 20px 16px',
            borderTop: '1px solid rgba(10, 10, 10, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            background: 'rgba(10, 10, 10, 0.015)',
          }}
        >
          <DetailGrid>
            <DetailRow label="Email">
              <a
                href={`mailto:${intake.email}`}
                style={{
                  color: '#0A2548',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                {intake.email}
              </a>
            </DetailRow>

            {intake.phone && (
              <DetailRow label="Phone">
                <a
                  href={`tel:${intake.phone}`}
                  style={{
                    color: '#0A2548',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  {intake.phone}
                </a>
              </DetailRow>
            )}

            <DetailRow label="Submitted">
              {formatTimestamp(intake.created_at)}
            </DetailRow>

            {intake.contacted_at && (
              <DetailRow label="First contacted">
                {formatTimestamp(intake.contacted_at)}
              </DetailRow>
            )}
          </DetailGrid>

          {intake.details && (
            <div>
              <SectionLabel>What they shared</SectionLabel>
              <div
                style={{
                  padding: '14px 16px',
                  background: '#FFFFFF',
                  borderLeft: '3px solid rgba(10, 10, 10, 0.15)',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  color: '#0A0A0A',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {intake.details}
              </div>
            </div>
          )}

          <div>
            <SectionLabel>Operator notes</SectionLabel>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isPending}
              rows={3}
              placeholder="Internal notes — who's working on this, what's been tried, next steps…"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                color: '#0A0A0A',
                background: '#FFFFFF',
                border: '1px solid rgba(10, 10, 10, 0.2)',
                borderRadius: '2px',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '8px',
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={isPending || notes === (intake.notes ?? '')}
                style={{
                  padding: '8px 16px',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#FFFFFF',
                  background: '#0A2548',
                  border: 'none',
                  borderRadius: '2px',
                  cursor: isPending ? 'wait' : 'pointer',
                  opacity:
                    isPending || notes === (intake.notes ?? '') ? 0.5 : 1,
                }}
              >
                {isPending ? 'Saving…' : 'Save notes'}
              </button>
              {notesSaved && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#007A33',
                    fontFamily:
                      'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
                  }}
                >
                  Saved
                </span>
              )}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            {!intake.contacted_at && (
              <button
                type="button"
                onClick={handleMarkContacted}
                disabled={isPending}
                style={{
                  padding: '10px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#FFFFFF',
                  background: '#007A33',
                  border: 'none',
                  borderRadius: '2px',
                  cursor: isPending ? 'wait' : 'pointer',
                }}
              >
                Mark contacted
              </button>
            )}

            <select
              value={intake.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={isPending}
              style={{
                padding: '10px 12px',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#0A0A0A',
                background: '#FFFFFF',
                border: '1px solid rgba(10, 10, 10, 0.2)',
                borderRadius: '2px',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed_no_response">Closed — No Response</option>
            </select>

            <PromoteToLegacyline
              intake={intake}
              disabled={isPending}
            />

            <div style={{ flex: 1 }} />

            {!confirmingDelete ? (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                disabled={isPending}
                style={{
                  padding: '10px 14px',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#CE1126',
                  background: 'transparent',
                  border: '1px solid rgba(206, 17, 38, 0.3)',
                  borderRadius: '2px',
                  cursor: isPending ? 'wait' : 'pointer',
                }}
              >
                Delete
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  style={{
                    padding: '10px 14px',
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#FFFFFF',
                    background: '#CE1126',
                    border: 'none',
                    borderRadius: '2px',
                    cursor: isPending ? 'wait' : 'pointer',
                  }}
                >
                  {isPending ? 'Deleting…' : 'Yes, delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={isPending}
                  style={{
                    padding: '10px 14px',
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#0A0A0A',
                    background: 'transparent',
                    border: '1px solid rgba(10, 10, 10, 0.2)',
                    borderRadius: '2px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {error && (
            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(206, 17, 38, 0.08)',
                borderLeft: '3px solid #CE1126',
                fontSize: '13px',
                color: '#0A0A0A',
              }}
            >
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: '#FFFFFF',
        background: color,
        borderRadius: '2px',
        fontFamily:
          'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  )
}

function DetailGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '12px 24px',
      }}
    >
      {children}
    </div>
  )
}

function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div
        style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(10, 10, 10, 0.55)',
          marginBottom: '4px',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: '14px', color: '#0A0A0A', lineHeight: 1.4 }}>
        {children}
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'rgba(10, 10, 10, 0.55)',
        marginBottom: '8px',
        fontFamily:
          'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
      }}
    >
      {children}
    </div>
  )
}

// ─── Promote to Legacyline (Wave 2.3) ────────────────────────────────
// Three states:
//   - already promoted → green confirmation strip, no form
//   - idle → "Open promotion form" button
//   - form open → inline form with pre-filled name fields, required DOB

function PromoteToLegacyline({
  intake,
  disabled,
}: {
  intake: IntakeRecord
  disabled: boolean
}) {
  const [formOpen, setFormOpen] = useState(false)
  const seed = splitFullNameForPromotion(intake.full_name)
  const [firstName, setFirstName] = useState(seed.first_name)
  const [lastName, setLastName] = useState(seed.last_name)
  const [dob, setDob] = useState('')
  const [orgId, setOrgId] = useState('')
  const [submitting, startSubmit] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [errorField, setErrorField] = useState<string | undefined>(undefined)

  // ─── Already promoted: show registry ID + timestamp ───────────────
  if (intake.legacyline_participant_id) {
    return (
      <div
        style={{
          padding: '10px 14px',
          background: 'rgba(0, 122, 51, 0.08)',
          borderLeft: '3px solid #007A33',
          borderRadius: '2px',
          fontSize: '12px',
          color: '#0A0A0A',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <div
          style={{
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#007A33',
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          }}
        >
          Promoted to Legacyline
        </div>
        <div style={{ fontSize: '13px', fontWeight: 600 }}>
          {intake.legacyline_registry_id ?? intake.legacyline_participant_id}
        </div>
        {intake.legacyline_promoted_at && (
          <div
            style={{
              fontSize: '11px',
              color: 'rgba(10, 10, 10, 0.55)',
              fontFamily:
                'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
            }}
          >
            {new Date(intake.legacyline_promoted_at).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>
    )
  }

  // ─── Idle: show button to open form ────────────────────────────────
  if (!formOpen) {
    return (
      <button
        type="button"
        onClick={() => setFormOpen(true)}
        disabled={disabled}
        style={{
          padding: '10px 16px',
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#0A2548',
          background: 'transparent',
          border: '1px solid #0A2548',
          borderRadius: '2px',
          cursor: disabled ? 'wait' : 'pointer',
        }}
      >
        Promote to Legacyline →
      </button>
    )
  }

  // ─── Form open: inline promotion form ──────────────────────────────
  function handleSubmit() {
    setError(null)
    setErrorField(undefined)

    startSubmit(async () => {
      const result = await promoteIntakeToLegacyline(intake.id, {
        first_name: firstName,
        last_name: lastName,
        dob,
        organization_id: orgId.trim() || null,
      })

      if (!result.ok) {
        setError(result.error)
        setErrorField(result.field)
        return
      }

      // Success — form will disappear when the row re-renders with
      // the new legacyline_participant_id from revalidatePath.
      setFormOpen(false)
    })
  }

  return (
    <div
      style={{
        flexBasis: '100%',
        marginTop: '12px',
        padding: '14px 16px',
        background: '#FFFFFF',
        border: '1px solid rgba(10, 36, 72, 0.2)',
        borderLeft: '3px solid #0A2548',
        borderRadius: '2px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div
        style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#0A2548',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        }}
      >
        Promote to Legacyline
      </div>

      <div
        style={{
          fontSize: '13px',
          color: 'rgba(10, 10, 10, 0.65)',
          lineHeight: 1.5,
        }}
      >
        Confirm the participant&apos;s legal name and date of birth from your
        conversation. Email and phone come from the original request.
      </div>

      <FormField label="First name" required field="first_name" errorField={errorField}>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          disabled={submitting}
          style={promoteInputStyle}
        />
      </FormField>

      <FormField label="Last name" required field="last_name" errorField={errorField}>
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          disabled={submitting}
          style={promoteInputStyle}
        />
      </FormField>

      <FormField label="Date of birth" required field="dob" errorField={errorField}>
        <DobPicker value={dob} onChange={setDob} disabled={submitting} />
      </FormField>

      <FormField label="Organization (optional)" field="organization_id" errorField={errorField}>
        <input
          type="text"
          value={orgId}
          onChange={(e) => setOrgId(e.target.value)}
          disabled={submitting}
          placeholder="Leave blank for individual track"
          style={promoteInputStyle}
        />
      </FormField>

      {error && (
        <div
          style={{
            padding: '10px 12px',
            background: 'rgba(206, 17, 38, 0.08)',
            borderLeft: '3px solid #CE1126',
            fontSize: '13px',
            color: '#0A0A0A',
            lineHeight: 1.5,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !firstName.trim() || !lastName.trim() || !dob}
          style={{
            padding: '10px 18px',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#FFFFFF',
            background: '#0A2548',
            border: 'none',
            borderRadius: '2px',
            cursor:
              submitting || !firstName.trim() || !lastName.trim() || !dob
                ? 'not-allowed'
                : 'pointer',
            opacity:
              submitting || !firstName.trim() || !lastName.trim() || !dob
                ? 0.5
                : 1,
          }}
        >
          {submitting ? 'Promoting…' : 'Create Legacyline participant'}
        </button>
        <button
          type="button"
          onClick={() => {
            setFormOpen(false)
            setError(null)
            setErrorField(undefined)
          }}
          disabled={submitting}
          style={{
            padding: '10px 14px',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#0A0A0A',
            background: 'transparent',
            border: '1px solid rgba(10, 10, 10, 0.2)',
            borderRadius: '2px',
            cursor: submitting ? 'wait' : 'pointer',
          }}
        >
          Cancel
        </button>
      </div>

      {intake.legacyline_error && (
        <div
          style={{
            marginTop: '8px',
            padding: '10px 12px',
            background: 'rgba(206, 17, 38, 0.04)',
            border: '1px dashed rgba(206, 17, 38, 0.3)',
            borderRadius: '2px',
            fontSize: '11px',
            color: 'rgba(10, 10, 10, 0.65)',
            lineHeight: 1.5,
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          }}
        >
          Last attempt failed: {intake.legacyline_error}
        </div>
      )}
    </div>
  )
}

function FormField({
  label,
  required,
  field,
  errorField,
  children,
}: {
  label: string
  required?: boolean
  field: string
  errorField?: string
  children: React.ReactNode
}) {
  const hasError = errorField === field

  return (
    <div>
      <div
        style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: hasError ? '#CE1126' : 'rgba(10, 10, 10, 0.55)',
          marginBottom: '6px',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        }}
      >
        {label}
        {required && <span style={{ color: '#CE1126' }}> *</span>}
      </div>
      {children}
    </div>
  )
}

const promoteInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  fontSize: '14px',
  color: '#0A0A0A',
  background: '#FFFFFF',
  border: '1px solid rgba(10, 10, 10, 0.2)',
  borderRadius: '2px',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
}

// ─── DOB Picker (Wave 2.3 polish) ────────────────────────────────────
// Three dropdowns: Month / Day / Year. Mobile-friendly, prevents invalid
// dates (Feb 30 impossible), produces YYYY-MM-DD string that matches what
// Legacyline's Go handler expects from r.FormValue("dob"). Year range:
// current year back to 1900.

function DobPicker({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (next: string) => void
  disabled: boolean
}) {
  // Parse current value (YYYY-MM-DD) into parts; empty if invalid
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  const currentYear = parts ? parts[1] : ''
  const currentMonth = parts ? parts[2] : ''
  const currentDay = parts ? parts[3] : ''

  const thisYear = new Date().getFullYear()
  const years: string[] = []
  for (let y = thisYear; y >= 1900; y--) {
    years.push(String(y))
  }

  const months = [
    { v: '01', l: 'January' },
    { v: '02', l: 'February' },
    { v: '03', l: 'March' },
    { v: '04', l: 'April' },
    { v: '05', l: 'May' },
    { v: '06', l: 'June' },
    { v: '07', l: 'July' },
    { v: '08', l: 'August' },
    { v: '09', l: 'September' },
    { v: '10', l: 'October' },
    { v: '11', l: 'November' },
    { v: '12', l: 'December' },
  ]

  // Days adjust to selected month + year (Feb in leap year etc.)
  const maxDay = currentMonth && currentYear
    ? new Date(parseInt(currentYear, 10), parseInt(currentMonth, 10), 0).getDate()
    : 31

  const days: string[] = []
  for (let d = 1; d <= maxDay; d++) {
    days.push(String(d).padStart(2, '0'))
  }

  function commit(nextMonth: string, nextDay: string, nextYear: string) {
    if (!nextMonth || !nextDay || !nextYear) {
      onChange('')
      return
    }
    // Re-validate day against new month/year combination
    const validMaxDay = new Date(
      parseInt(nextYear, 10),
      parseInt(nextMonth, 10),
      0
    ).getDate()
    const correctedDay =
      parseInt(nextDay, 10) > validMaxDay
        ? String(validMaxDay).padStart(2, '0')
        : nextDay
    onChange(`${nextYear}-${nextMonth}-${correctedDay}`)
  }

  const selectStyle: React.CSSProperties = {
    flex: 1,
    padding: '10px 8px',
    fontSize: '14px',
    color: '#0A0A0A',
    background: '#FFFFFF',
    border: '1px solid rgba(10, 10, 10, 0.2)',
    borderRadius: '2px',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    cursor: disabled ? 'wait' : 'pointer',
  }

  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
      <select
        value={currentMonth}
        onChange={(e) => commit(e.target.value, currentDay, currentYear)}
        disabled={disabled}
        style={{ ...selectStyle, minWidth: '120px', flex: '2 1 120px' }}
        aria-label="Month"
      >
        <option value="">Month</option>
        {months.map((m) => (
          <option key={m.v} value={m.v}>
            {m.l}
          </option>
        ))}
      </select>

      <select
        value={currentDay}
        onChange={(e) => commit(currentMonth, e.target.value, currentYear)}
        disabled={disabled || !currentMonth}
        style={{ ...selectStyle, minWidth: '70px', flex: '1 1 70px' }}
        aria-label="Day"
      >
        <option value="">Day</option>
        {days.map((d) => (
          <option key={d} value={d}>
            {parseInt(d, 10)}
          </option>
        ))}
      </select>

      <select
        value={currentYear}
        onChange={(e) => commit(currentMonth, currentDay, e.target.value)}
        disabled={disabled}
        style={{ ...selectStyle, minWidth: '90px', flex: '1 1 90px' }}
        aria-label="Year"
      >
        <option value="">Year</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  )
}

