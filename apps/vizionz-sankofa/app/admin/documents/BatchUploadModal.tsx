// VIZIONZ SANKOFA · /admin/documents · BatchUploadModal (Wave 3.2)
// Multi-file picker + per-row metadata editing + parallel upload to
// Supabase Storage + per-row status tracking.
//
// Flow:
//   1. Operator taps Upload Documents → modal opens
//   2. Files selected via native picker (multiple allowed)
//   3. Each file gets a row with auto-filled title + category + date
//   4. Operator edits per-row metadata, taps Upload All
//   5. Each file uploads to Storage in parallel
//   6. After Storage success, metadata row inserts to vs_documents
//   7. Per-row status badge updates: queued → uploading → ready / error
//   8. When all complete, modal stays open showing summary; close to refresh

'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  DOCUMENT_CATEGORY_LABELS,
  type DocumentCategory,
  type UploadDocumentInput,
} from '../actions/documents'

type RowStatus = 'queued' | 'uploading' | 'ready' | 'error'

type UploadRow = {
  id: string  // local-only client id for keying
  file: File
  title: string
  category: DocumentCategory
  documentDate: string
  description: string
  relatedProgram: string
  status: RowStatus
  errorMessage: string | null
  storagePath: string | null
}

function autoTitleFromFilename(filename: string): string {
  // Strip extension, replace separators with spaces, title-case roughly
  const noExt = filename.replace(/\.[^.]+$/, '')
  const spaced = noExt.replace(/[-_]+/g, ' ').trim()
  // Title-case first letter of each word, but don't lowercase the rest
  // (preserves things like "Q3" or "ACF")
  return spaced
    .split(/\s+/)
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
}

function makeRowId(): string {
  return Math.random().toString(36).slice(2, 11)
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  // 50 MB per file

export function BatchUploadModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<UploadRow[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [summaryShown, setSummaryShown] = useState(false)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    const newRows: UploadRow[] = files.map((file) => ({
      id: makeRowId(),
      file,
      title: autoTitleFromFilename(file.name),
      category: 'other' as DocumentCategory,
      documentDate: '',
      description: '',
      relatedProgram: '',
      status: 'queued',
      errorMessage: null,
      storagePath: null,
    }))

    setRows((prev) => [...prev, ...newRows])
    // Reset the input so re-selecting the same file works
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function updateRow(id: string, updates: Partial<UploadRow>) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    )
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  async function handleUploadAll() {
    setSubmitting(true)

    // Validate first
    const invalid = rows.find((r) => !r.title.trim())
    if (invalid) {
      updateRow(invalid.id, {
        status: 'error',
        errorMessage: 'Title is required',
      })
      setSubmitting(false)
      return
    }

    const oversized = rows.find((r) => r.file.size > MAX_FILE_SIZE_BYTES)
    if (oversized) {
      updateRow(oversized.id, {
        status: 'error',
        errorMessage: `File exceeds 50 MB limit (${formatBytes(oversized.file.size)})`,
      })
      setSubmitting(false)
      return
    }

    const supabase = createClient()

    // Get current user id for storage path prefix
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setSubmitting(false)
      alert('Session expired. Please sign in again.')
      return
    }

    // Upload all files in parallel
    const uploadPromises = rows
      .filter((r) => r.status === 'queued')
      .map(async (row) => {
        updateRow(row.id, { status: 'uploading', errorMessage: null })

        // Sanitize filename for storage path
        const safeName = row.file.name
          .replace(/[^a-zA-Z0-9._-]/g, '-')
          .replace(/-+/g, '-')
          .slice(0, 100)
        const path = `${user.id}/${Date.now()}-${row.id}-${safeName}`

        // Upload binary to Storage
        const { error: uploadError } = await supabase.storage
          .from('vs-documents')
          .upload(path, row.file, {
            contentType: row.file.type || 'application/octet-stream',
            upsert: false,
          })

        if (uploadError) {
          updateRow(row.id, {
            status: 'error',
            errorMessage: `Upload failed: ${uploadError.message}`,
          })
          return null
        }

        updateRow(row.id, { storagePath: path })
        return { rowId: row.id, storagePath: path, row }
      })

    const uploadResults = await Promise.all(uploadPromises)

    // Collect successful uploads for metadata registration
    const successfulUploads = uploadResults.filter(
      (r): r is { rowId: string; storagePath: string; row: UploadRow } =>
        r !== null
    )

    if (successfulUploads.length === 0) {
      setSubmitting(false)
      setSummaryShown(true)
      return
    }

    // Register metadata for all successful uploads
    const inputs: UploadDocumentInput[] = successfulUploads.map((u) => ({
      title: u.row.title,
      category: u.row.category,
      description: u.row.description.trim() || null,
      document_date: u.row.documentDate || null,
      related_intake: null,
      related_program: u.row.relatedProgram.trim() || null,
      file_name: u.row.file.name,
      file_size_bytes: u.row.file.size,
      mime_type: u.row.file.type || 'application/octet-stream',
      storage_path: u.storagePath,
    }))

    // Call server action to insert vs_documents rows
    const { registerUploadedDocuments } = await import('../actions/documents')
    const results = await registerUploadedDocuments(inputs)

    // Map results back to rows
    results.forEach((result, idx) => {
      const upload = successfulUploads[idx]
      if (result.ok) {
        updateRow(upload.rowId, { status: 'ready', errorMessage: null })
      } else {
        updateRow(upload.rowId, {
          status: 'error',
          errorMessage: result.error,
        })
      }
    })

    setSubmitting(false)
    setSummaryShown(true)
    router.refresh()
  }

  const readyCount = rows.filter((r) => r.status === 'ready').length
  const errorCount = rows.filter((r) => r.status === 'error').length
  const queuedCount = rows.filter((r) => r.status === 'queued').length
  const hasUploads = rows.length > 0
  const allInTerminalState = rows.every(
    (r) => r.status === 'ready' || r.status === 'error'
  )

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 10, 10, 0.6)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '24px 16px',
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) {
          if (allInTerminalState && summaryShown) onClose()
        }
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '900px',
          background: '#FFFFFF',
          borderRadius: '4px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 48px)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(10, 10, 10, 0.08)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#CE1126',
                marginBottom: '6px',
                fontFamily:
                  'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
              }}
            >
              Document Upload
            </div>
            <h2
              style={{
                fontSize: '22px',
                lineHeight: 1.2,
                fontWeight: 600,
                color: '#0A0A0A',
                margin: 0,
                fontFamily: '"DM Serif Display", Georgia, serif',
              }}
            >
              {summaryShown
                ? 'Upload complete'
                : hasUploads
                  ? `Upload ${rows.length} ${rows.length === 1 ? 'file' : 'files'}`
                  : 'Select files to upload'}
            </h2>
            {summaryShown && (
              <div
                style={{
                  fontSize: '13px',
                  color: 'rgba(10, 10, 10, 0.65)',
                  marginTop: '6px',
                  fontFamily:
                    'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
                  letterSpacing: '0.04em',
                }}
              >
                {readyCount} ready · {errorCount}{' '}
                {errorCount === 1 ? 'error' : 'errors'}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: '8px',
              fontSize: '20px',
              color: 'rgba(10, 10, 10, 0.6)',
              background: 'transparent',
              border: 'none',
              cursor: submitting ? 'wait' : 'pointer',
              lineHeight: 1,
              flexShrink: 0,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body — scrollable */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
          }}
        >
          {/* File picker */}
          {!summaryShown && (
            <div
              style={{
                marginBottom: rows.length > 0 ? '20px' : '0',
                padding: '20px',
                background: 'rgba(10, 36, 72, 0.04)',
                border: '1px dashed rgba(10, 36, 72, 0.3)',
                borderRadius: '2px',
                textAlign: 'center',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                disabled={submitting}
                style={{ display: 'none' }}
                id="vs-batch-upload-input"
              />
              <label
                htmlFor="vs-batch-upload-input"
                style={{
                  display: 'inline-block',
                  padding: '12px 20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#FFFFFF',
                  background: '#0A2548',
                  borderRadius: '2px',
                  cursor: submitting ? 'wait' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {rows.length === 0 ? 'Choose files' : 'Add more files'}
              </label>
              <div
                style={{
                  marginTop: '10px',
                  fontSize: '12px',
                  color: 'rgba(10, 10, 10, 0.55)',
                  lineHeight: 1.5,
                }}
              >
                Select one or many. 50 MB per file maximum. PDFs, Word docs,
                Excel sheets, images — anything organizational.
              </div>
            </div>
          )}

          {/* Per-file rows */}
          {rows.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {rows.map((row) => (
                <UploadRowEditor
                  key={row.id}
                  row={row}
                  disabled={submitting || row.status !== 'queued'}
                  onUpdate={(updates) => updateRow(row.id, updates)}
                  onRemove={() => removeRow(row.id)}
                  showRemove={!submitting && row.status === 'queued'}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer — action buttons */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(10, 10, 10, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              color: 'rgba(10, 10, 10, 0.6)',
              fontFamily:
                'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
              letterSpacing: '0.04em',
            }}
          >
            {submitting
              ? 'Uploading…'
              : summaryShown
                ? 'Close to refresh your library'
                : `${queuedCount} queued`}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {!summaryShown && (
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                style={{
                  padding: '10px 16px',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#0A0A0A',
                  background: 'transparent',
                  border: '1px solid rgba(10, 10, 10, 0.2)',
                  borderRadius: '2px',
                  cursor: submitting ? 'wait' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
            )}

            {!summaryShown && queuedCount > 0 && (
              <button
                type="button"
                onClick={handleUploadAll}
                disabled={submitting || queuedCount === 0}
                style={{
                  padding: '10px 20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#FFFFFF',
                  background: '#007A33',
                  border: 'none',
                  borderRadius: '2px',
                  cursor: submitting ? 'wait' : 'pointer',
                  fontFamily: 'inherit',
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? 'Uploading…' : `Upload ${queuedCount} ${queuedCount === 1 ? 'file' : 'files'}`}
              </button>
            )}

            {summaryShown && (
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 20px',
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
                }}
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Per-row editor ────────────────────────────────────────────────

const STATUS_BADGE_COLORS: Record<RowStatus, string> = {
  queued: 'rgba(10, 10, 10, 0.5)',
  uploading: '#0A2548',
  ready: '#007A33',
  error: '#CE1126',
}

const STATUS_BADGE_LABELS: Record<RowStatus, string> = {
  queued: 'Queued',
  uploading: 'Uploading',
  ready: 'Ready',
  error: 'Error',
}

function UploadRowEditor({
  row,
  disabled,
  onUpdate,
  onRemove,
  showRemove,
}: {
  row: UploadRow
  disabled: boolean
  onUpdate: (updates: Partial<UploadRow>) => void
  onRemove: () => void
  showRemove: boolean
}) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(10, 10, 10, 0.1)',
        borderLeft: `3px solid ${STATUS_BADGE_COLORS[row.status]}`,
        borderRadius: '2px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      {/* Top strip: filename + size + status badge + remove */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            padding: '3px 9px',
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#FFFFFF',
            background: STATUS_BADGE_COLORS[row.status],
            borderRadius: '2px',
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          }}
        >
          {STATUS_BADGE_LABELS[row.status]}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '12px',
              color: 'rgba(10, 10, 10, 0.7)',
              fontFamily:
                'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
              letterSpacing: '0.04em',
              wordBreak: 'break-all',
            }}
          >
            {row.file.name} · {formatBytes(row.file.size)}
          </div>
        </div>

        {showRemove && (
          <button
            type="button"
            onClick={onRemove}
            style={{
              padding: '4px 10px',
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(206, 17, 38, 0.8)',
              background: 'transparent',
              border: '1px solid rgba(206, 17, 38, 0.2)',
              borderRadius: '2px',
              cursor: 'pointer',
              fontFamily:
                'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
              flexShrink: 0,
            }}
          >
            Remove
          </button>
        )}
      </div>

      {/* Metadata grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
        }}
      >
        <MiniField label="Title">
          <input
            type="text"
            value={row.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            disabled={disabled}
            style={miniInputStyle}
          />
        </MiniField>

        <MiniField label="Category">
          <select
            value={row.category}
  onChange={(e) => onUpdate({ category: e.target.value as DocumentCategory })}
            disabled={disabled}
            style={miniInputStyle}
          >
            {(Object.keys(DOCUMENT_CATEGORY_LABELS) as DocumentCategory[]).map((c) => (
              <option key={c} value={c}>
                {DOCUMENT_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </MiniField>

        <MiniField label="Doc date (optional)">
          <input
            type="date"
            value={row.documentDate}
            onChange={(e) => onUpdate({ documentDate: e.target.value })}
            disabled={disabled}
            style={miniInputStyle}
          />
        </MiniField>
      </div>

      {/* Error message */}
      {row.status === 'error' && row.errorMessage && (
        <div
          style={{
            padding: '8px 10px',
            background: 'rgba(206, 17, 38, 0.08)',
            borderLeft: '3px solid #CE1126',
            fontSize: '12px',
            color: '#0A0A0A',
            lineHeight: 1.4,
          }}
        >
          {row.errorMessage}
        </div>
      )}
    </div>
  )
}

function MiniField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: '9px',
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
      {children}
    </div>
  )
}

const miniInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '7px 9px',
  fontSize: '13px',
  color: '#0A0A0A',
  background: '#FFFFFF',
  border: '1px solid rgba(10, 10, 10, 0.18)',
  borderRadius: '2px',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
}
