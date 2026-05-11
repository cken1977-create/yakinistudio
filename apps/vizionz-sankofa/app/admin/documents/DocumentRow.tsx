// VIZIONZ SANKOFA · /admin/documents · DocumentRow (Wave 3.2)
// Expandable row showing one document. Collapsed: title + category +
// status badge + date. Expanded: full metadata + edit + delete actions.

'use client'

import { useState, useTransition } from 'react'
import {
  updateDocumentMetadata,
  deleteDocument,
  DOCUMENT_CATEGORY_LABELS,
  type DocumentCategory,
} from '../actions/documents'

type DocumentRecord = {
  id: string
  title: string
  category: DocumentCategory
  description: string | null
  document_date: string | null
  storage_path: string
  file_name: string
  file_size_bytes: number
  mime_type: string
  processing_status: 'pending' | 'processing' | 'ready' | 'error'
  processing_error: string | null
  chunk_count: number
  related_program: string | null
  related_intake: string | null
  uploaded_by: string
  uploaded_at: string
  created_at: string
}

const STATUS_LABELS: Record<DocumentRecord['processing_status'], string> = {
  pending: 'Pending',
  processing: 'Processing',
  ready: 'Ready',
  error: 'Error',
}

const STATUS_COLORS: Record<DocumentRecord['processing_status'], string> = {
  pending: 'rgba(10, 10, 10, 0.5)',
  processing: '#0A2548',
  ready: '#007A33',
  error: '#CE1126',
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function DocumentRow({
  document: doc,
  uploaderName,
}: {
  document: DocumentRecord
  uploaderName: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Editable fields
  const [title, setTitle] = useState(doc.title)
  const [category, setCategory] = useState<DocumentCategory>(doc.category)
  const [documentDate, setDocumentDate] = useState(doc.document_date ?? '')
  const [description, setDescription] = useState(doc.description ?? '')
  const [relatedProgram, setRelatedProgram] = useState(doc.related_program ?? '')

  const statusLabel = STATUS_LABELS[doc.processing_status]
  const statusColor = STATUS_COLORS[doc.processing_status]

  function handleSaveEdits() {
    setError(null)
    startTransition(async () => {
      const result = await updateDocumentMetadata(doc.id, {
        title,
        category,
        document_date: documentDate || null,
        description: description.trim() || null,
        related_program: relatedProgram.trim() || null,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setEditing(false)
    })
  }

  function handleCancelEdit() {
    setTitle(doc.title)
    setCategory(doc.category)
    setDocumentDate(doc.document_date ?? '')
    setDescription(doc.description ?? '')
    setRelatedProgram(doc.related_program ?? '')
    setEditing(false)
    setError(null)
  }

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = await deleteDocument(doc.id)
      if (!result.ok) {
        setError(result.error)
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
      }}
    >
      {/* Collapsed scan view */}
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
            minWidth: '200px',
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
            {doc.title}
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
            {DOCUMENT_CATEGORY_LABELS[doc.category]}
            {doc.document_date ? ` · ${formatDate(doc.document_date)}` : ''} ·{' '}
            {formatBytes(doc.file_size_bytes)}
          </div>
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

      {/* Expanded panel */}
      {expanded && (
        <div
          style={{
            padding: '20px 16px',
            borderTop: '1px solid rgba(10, 10, 10, 0.06)',
            background: 'rgba(10, 10, 10, 0.015)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Audit strip */}
          <div
            style={{
              padding: '8px 12px',
              background: 'rgba(10, 36, 72, 0.04)',
              borderLeft: '3px solid rgba(10, 36, 72, 0.3)',
              fontSize: '11px',
              color: 'rgba(10, 10, 10, 0.65)',
              lineHeight: 1.5,
              fontFamily:
                'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
              letterSpacing: '0.04em',
            }}
          >
            <strong style={{ color: '#0A2548', letterSpacing: '0.14em' }}>
              UPLOADED BY ·
            </strong>{' '}
            {uploaderName} on {formatTimestamp(doc.uploaded_at)}
            <br />
            <strong style={{ color: 'rgba(10, 10, 10, 0.5)' }}>FILE ·</strong>{' '}
            {doc.file_name} ({doc.mime_type})
          </div>

          {/* Metadata view OR edit form */}
          {!editing ? (
            <>
              <DetailGrid>
                <DetailRow label="Category">
                  {DOCUMENT_CATEGORY_LABELS[doc.category]}
                </DetailRow>
                <DetailRow label="Document date">
                  {formatDate(doc.document_date)}
                </DetailRow>
                {doc.related_program && (
                  <DetailRow label="Related program">
                    {doc.related_program}
                  </DetailRow>
                )}
              </DetailGrid>

              {doc.description && (
                <div>
                  <SectionLabel>Description</SectionLabel>
                  <div
                    style={{
                      padding: '12px 14px',
                      background: '#FFFFFF',
                      borderLeft: '3px solid rgba(10, 10, 10, 0.15)',
                      fontSize: '14px',
                      lineHeight: 1.6,
                      color: '#0A0A0A',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {doc.description}
                  </div>
                </div>
              )}

              {doc.processing_status === 'error' && doc.processing_error && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(206, 17, 38, 0.08)',
                    borderLeft: '3px solid #CE1126',
                    fontSize: '13px',
                    color: '#0A0A0A',
                  }}
                >
                  <strong>Processing error:</strong> {doc.processing_error}
                </div>
              )}

              {doc.processing_status === 'ready' && doc.chunk_count > 0 && (
                <div
                  style={{
                    fontSize: '12px',
                    color: 'rgba(10, 10, 10, 0.55)',
                    fontFamily:
                      'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
                    letterSpacing: '0.04em',
                  }}
                >
                  Indexed into {doc.chunk_count}{' '}
                  {doc.chunk_count === 1 ? 'chunk' : 'chunks'} for Yakini
                  Intelligence
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Field label="Title">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isPending}
                  style={inputStyle}
                />
              </Field>

              <Field label="Category">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                  disabled={isPending}
                  style={inputStyle}
                >
                  {(Object.keys(DOCUMENT_CATEGORY_LABELS) as DocumentCategory[]).map(
                    (c) => (
                      <option key={c} value={c}>
                        {DOCUMENT_CATEGORY_LABELS[c]}
                      </option>
                    )
                  )}
                </select>
              </Field>

              <Field label="Document date (optional)">
                <input
                  type="date"
                  value={documentDate}
                  onChange={(e) => setDocumentDate(e.target.value)}
                  disabled={isPending}
                  style={inputStyle}
                />
              </Field>

              <Field label="Related program (optional)">
                <input
                  type="text"
                  value={relatedProgram}
                  onChange={(e) => setRelatedProgram(e.target.value)}
                  disabled={isPending}
                  placeholder="e.g. Sankofa Soul Care"
                  style={inputStyle}
                />
              </Field>

              <Field label="Description (optional)">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isPending}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </Field>
            </div>
          )}

          {/* Action row */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            {!editing && !confirmingDelete && (
              <>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  disabled={isPending}
                  style={primaryButtonStyle}
                >
                  Edit metadata
                </button>
                <div style={{ flex: 1 }} />
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  disabled={isPending}
                  style={dangerOutlineButtonStyle}
                >
                  Delete
                </button>
              </>
            )}

            {editing && (
              <>
                <button
                  type="button"
                  onClick={handleSaveEdits}
                  disabled={isPending}
                  style={primaryButtonStyle}
                >
                  {isPending ? 'Saving…' : 'Save changes'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isPending}
                  style={outlineButtonStyle}
                >
                  Cancel
                </button>
              </>
            )}

            {confirmingDelete && (
              <>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  style={dangerSolidButtonStyle}
                >
                  {isPending ? 'Deleting…' : 'Yes, delete permanently'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={isPending}
                  style={outlineButtonStyle}
                >
                  Cancel
                </button>
              </>
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

// ─── Helper components ─────────────────────────────────────────────

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
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px 24px',
      }}
    >
      {children}
    </div>
  )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: '10px',
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
      </div>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
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

const primaryButtonStyle: React.CSSProperties = {
  padding: '10px 16px',
  fontSize: '12px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#FFFFFF',
  background: '#0A2548',
  border: 'none',
  borderRadius: '2px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const outlineButtonStyle: React.CSSProperties = {
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
  fontFamily: 'inherit',
}

const dangerOutlineButtonStyle: React.CSSProperties = {
  padding: '10px 14px',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#CE1126',
  background: 'transparent',
  border: '1px solid rgba(206, 17, 38, 0.3)',
  borderRadius: '2px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const dangerSolidButtonStyle: React.CSSProperties = {
  padding: '10px 14px',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#FFFFFF',
  background: '#CE1126',
  border: 'none',
  borderRadius: '2px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}
