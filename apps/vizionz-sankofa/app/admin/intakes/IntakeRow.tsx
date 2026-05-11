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
} from '../actions/intakes'

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

            <button
              type="button"
              disabled
              title="Promote to Legacyline ships in Wave 2.3"
              style={{
                padding: '10px 16px',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(10, 10, 10, 0.4)',
                background: 'transparent',
                border: '1px dashed rgba(10, 10, 10, 0.2)',
                borderRadius: '2px',
                cursor: 'not-allowed',
              }}
            >
              Promote to Legacyline · Wave 2.3
            </button>

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
