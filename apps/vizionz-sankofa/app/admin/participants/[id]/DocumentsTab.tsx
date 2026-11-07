'use client'

// VIZIONZ SANKOFA · /admin/participants/[id] · DocumentsTab
//
// Per-participant document vault. Uploads to vs-participant-documents bucket
// scoped by participant_id folder. Each document tracked in
// participant_documents table with category, description, expiration,
// confidentiality flag. Download via signed URL (15-minute TTL).

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { UploadStatus } from '@/components/admin/UploadStatus'
import {
  beginUpload,
  finishUpload,
  idleUpload,
  isPreviewableImage,
  isUploadActive,
  markUploadFile,
  pathsToRemoveAfterFailure,
  retryFailedUpload,
  selectUploadFiles,
  uploadStatusText,
  type UploadSession,
} from '@/lib/media/picture-upload'
import type {
  ParticipantDocumentWithStaff,
  DocumentCategory,
} from './types'
import {
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_CATEGORY_ICONS,
  STORAGE_BUCKET_PARTICIPANT_DOCS,
  getDocumentStoragePath,
  formatFileSize,
} from './types'
import { decideParticipantDocument } from '@/lib/documents/files'
import type { StaffRecord } from '../types'
import { formatDateTimeValue, formatDateValue } from '@/lib/format/datetime'
import { useCanEdit } from '@/components/admin/CanEdit'

const SIGNED_URL_TTL_SECONDS = 900 // 15 minutes
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB

export function DocumentsTab({
  participantId,
  initialDocuments,
  staff,
  defaultUploaderId,
}: {
  participantId: string
  initialDocuments: ParticipantDocumentWithStaff[]
  staff: StaffRecord[]
  defaultUploaderId: string | null
}) {
  const canEdit = useCanEdit()
  const [documents, setDocuments] =
    useState<ParticipantDocumentWithStaff[]>(initialDocuments)
  const [uploading, setUploading] = useState(false)
  const [showConfidential, setShowConfidential] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const visible = useMemo(() => {
    if (showConfidential) return documents
    return documents.filter((d) => !d.is_confidential)
  }, [documents, showConfidential])

  const confidentialCount = documents.filter((d) => d.is_confidential).length

  // Rollup stats
  const totalSize = documents.reduce(
    (sum, d) => sum + (d.file_size_bytes ?? 0),
    0,
  )
  const expiringSoon = documents.filter((d) => {
    if (!d.expires_at) return false
    const exp = new Date(d.expires_at)
    const ninetyDays = new Date()
    ninetyDays.setDate(ninetyDays.getDate() + 90)
    return exp <= ninetyDays && exp >= new Date()
  }).length

  return (
    <div>
      {/* Rollup strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1px',
          background: 'rgba(10, 10, 10, 0.08)',
          border: '1px solid rgba(10, 10, 10, 0.08)',
          marginBottom: '28px',
        }}
      >
        <DocStat label="Documents" value={documents.length.toString()} />
        <DocStat label="Total Size" value={formatFileSize(totalSize)} />
        <DocStat
          label="Confidential"
          value={confidentialCount.toString()}
          accent="#B45F00"
        />
        <DocStat
          label="Expiring Soon"
          value={expiringSoon.toString()}
          accent={expiringSoon > 0 ? '#CE1126' : '#0A0A0A'}
        />
      </div>

      {/* Header + actions */}
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
            Document Vault
          </div>
          <div
            style={{
              fontSize: '14px',
              color: 'rgba(10, 10, 10, 0.65)',
            }}
          >
            IDs, leases, court paperwork, intake forms. Per-participant only.
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
                checked={showConfidential}
                onChange={(e) => setShowConfidential(e.target.checked)}
              />
              Show confidential
            </label>
          )}
          {canEdit && (
            <UploadButton
              participantId={participantId}
              defaultUploaderId={defaultUploaderId}
              staff={staff}
              uploading={uploading}
              setUploading={setUploading}
              onUploaded={(newDoc) => {
                setDocuments((prev) => [newDoc, ...prev])
                setErrorMsg(null)
              }}
              onError={setErrorMsg}
            />
          )}
        </div>
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(206, 17, 38, 0.08)',
            color: '#CE1126',
            borderRadius: '6px',
            fontSize: '13px',
            marginBottom: '20px',
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Document list */}
      {visible.length === 0 ? (
        <EmptyState
          hasHidden={confidentialCount > 0 && !showConfidential}
          totalCount={documents.length}
        />
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {visible.map((doc) => (
            <DocumentRow
              key={doc.id}
              document={doc}
              participantId={participantId}
              onDeleted={() => {
                setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function DocumentImage({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let cancel = false
    const supabase = createBrowserClient()
    void supabase.storage.from(STORAGE_BUCKET_PARTICIPANT_DOCS).createSignedUrl(path, SIGNED_URL_TTL_SECONDS).then(({ data, error }) => {
      if (cancel) return
      if (error || !data?.signedUrl) setFailed(true)
      else setUrl(data.signedUrl)
    })
    return () => { cancel = true }
  }, [path])
  if (failed) return <span style={{ fontSize: '12px', color: '#CE1126' }}>Saved, but the picture could not be shown.</span>
  if (!url) return <span role="status" style={{ fontSize: '12px' }}>Loading picture…</span>
  return <img src={url} alt="" onError={() => setFailed(true)} style={{ width: '72px', height: '54px', objectFit: 'cover', display: 'block' }} />
}

const hiddenFileInput: CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
}

function DocStat({
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
        padding: '16px 20px',
      }}
    >
      <div
        style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(10, 10, 10, 0.5)',
          marginBottom: '6px',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '20px',
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

function UploadButton({
  participantId,
  defaultUploaderId,
  staff,
  uploading,
  setUploading,
  onUploaded,
  onError,
}: {
  participantId: string
  defaultUploaderId: string | null
  staff: StaffRecord[]
  uploading: boolean
  setUploading: (b: boolean) => void
  onUploaded: (doc: ParticipantDocumentWithStaff) => void
  onError: (msg: string) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE_BYTES) {
      onError(`File too large. Maximum size is 50 MB.`)
      e.target.value = ''
      return
    }

    setPendingFile(file)
    e.target.value = ''
  }

  return (
    <>
      <label
        htmlFor={`participant-doc-${participantId}`}
        style={{
          padding: '10px 18px',
          border: '1px solid #0A0A0A',
          background: '#0A0A0A',
          color: '#FFFFFF',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: uploading ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          opacity: uploading ? 0.6 : 1,
        }}
      >
        {uploading ? 'Uploading…' : '+ Upload Document'}
        <input
          ref={fileInputRef}
          id={`participant-doc-${participantId}`}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/bmp,.jpg,.jpeg,.jfif,.png,.gif,.webp,.bmp,.pdf,.doc,.docx,.txt,image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          style={hiddenFileInput}
        />
      </label>

      {pendingFile && (
        <UploadDetailsModal
          file={pendingFile}
          participantId={participantId}
          defaultUploaderId={defaultUploaderId}
          staff={staff}
          onClose={() => setPendingFile(null)}
          onUploadStart={() => setUploading(true)}
          onUploadEnd={() => setUploading(false)}
          onUploaded={(doc) => {
            setPendingFile(null)
            onUploaded(doc)
          }}
          onError={onError}
        />
      )}
    </>
  )
}

function UploadDetailsModal({
  file,
  participantId,
  defaultUploaderId,
  staff,
  onClose,
  onUploadStart,
  onUploadEnd,
  onUploaded,
  onError,
}: {
  file: File
  participantId: string
  defaultUploaderId: string | null
  staff: StaffRecord[]
  onClose: () => void
  onUploadStart: () => void
  onUploadEnd: () => void
  onUploaded: (doc: ParticipantDocumentWithStaff) => void
  onError: (msg: string) => void
}) {
  const [category, setCategory] = useState<DocumentCategory>('id')
  const [description, setDescription] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [isConfidential, setIsConfidential] = useState(false)
  const [uploaderId, setUploaderId] = useState<string>(defaultUploaderId ?? '')
  const sessionRef = useRef<UploadSession>(selectUploadFiles(idleUpload(), [file.name]))
  const [uploadSession, setUploadSession] = useState<UploadSession>(sessionRef.current)
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  function commitUpload(next: UploadSession) {
    sessionRef.current = next
    setUploadSession(next)
  }

  function save() {
    if (isUploadActive(sessionRef.current.phase) && sessionRef.current.phase !== 'selected') return
    const base = sessionRef.current.phase === 'failed'
      ? retryFailedUpload(sessionRef.current).session
      : sessionRef.current.phase === 'selected'
        ? beginUpload(sessionRef.current).session
        : beginUpload(selectUploadFiles(idleUpload(), [file.name])).session
    if (!isUploadActive(base.phase)) return
    commitUpload(base)
    void (async () => {
      onUploadStart()
      let current = markUploadFile(sessionRef.current, 0, 'preparing')
      commitUpload(current)
      const decided = decideParticipantDocument({ name: file.name, type: file.type, size: file.size })
      if (!decided.ok) {
        current = finishUpload(markUploadFile(current, 0, 'failed', decided.reason))
        commitUpload(current)
        onUploadEnd()
        onError(decided.reason)
        return
      }
      const supabase = createBrowserClient()
      const contentType = decided.contentType
      const path = getDocumentStoragePath(participantId, file.name)
      current = markUploadFile(current, 0, 'uploading')
      commitUpload(current)
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET_PARTICIPANT_DOCS)
        .upload(path, file, {
          contentType,
          upsert: false,
        })

      if (uploadError) {
        current = finishUpload(markUploadFile(current, 0, 'failed', `Upload failed: ${uploadError.message}. The documents already on this record were not changed.`))
        commitUpload(current)
        onUploadEnd()
        onError(current.files[0]?.reason ?? 'Upload failed.')
        return
      }

      current = markUploadFile(current, 0, 'saving')
      commitUpload(current)
      const insertPayload = {
        participant_id: participantId,
        uploaded_by_id: uploaderId || null,
        filename: file.name,
        storage_path: path,
        file_size_bytes: file.size,
        mime_type: contentType,
        category,
        description: description.trim() || null,
        is_confidential: isConfidential,
        expires_at: expiresAt || null,
        uploaded_at: new Date().toISOString(),
      }

      const { data, error: insertError } = await supabase
        .from('participant_documents')
        .insert(insertPayload)
        .select()
        .single()

      if (insertError || !data) {
        const cleanup = pathsToRemoveAfterFailure(path, false)
        if (cleanup.length > 0) {
          await supabase.storage.from(STORAGE_BUCKET_PARTICIPANT_DOCS).remove(cleanup)
        }
        current = finishUpload(markUploadFile(current, 0, 'failed', `Could not save the file record: ${insertError?.message ?? 'unknown'}. The documents already on this record were not changed.`))
        commitUpload(current)
        onUploadEnd()
        onError(current.files[0]?.reason ?? 'Could not save the file record.')
        return
      }

      const uploader = staff.find((s) => s.id === uploaderId)
      const decorated: ParticipantDocumentWithStaff = {
        ...(data as unknown as ParticipantDocumentWithStaff),
        uploaded_by_name: uploader?.full_name ?? null,
      }
      if (isPreviewableImage(file.name, contentType)) setLocalPreview(URL.createObjectURL(file))
      current = finishUpload(markUploadFile(current, 0, 'done'))
      commitUpload(current)
      onUploadEnd()
      onUploaded(decorated)
    })
  }

  const uploadActive = isUploadActive(uploadSession.phase) && uploadSession.phase !== 'selected'

  return (
    <div
      onClick={() => { if (!uploadActive) onClose() }}
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
          Upload Document
        </h2>
        <p
          style={{
            fontSize: '13px',
            color: 'rgba(10, 10, 10, 0.6)',
            marginBottom: '20px',
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          }}
        >
          {file.name} · {formatFileSize(file.size)}
        </p>
        <UploadStatus text={uploadSession.phase === 'selected' ? null : uploadStatusText(uploadSession)} active={uploadActive} percent={null} />
        {localPreview && (
          <img src={localPreview} alt="" style={{ width: '160px', height: '120px', objectFit: 'cover', display: 'block', marginBottom: '12px' }} />
        )}

        <Field label="Category *">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as DocumentCategory)}
            style={inputStyle}
          >
            {(Object.keys(DOCUMENT_CATEGORY_LABELS) as DocumentCategory[]).map(
              (c) => (
                <option key={c} value={c}>
                  {DOCUMENT_CATEGORY_ICONS[c]} {DOCUMENT_CATEGORY_LABELS[c]}
                </option>
              ),
            )}
          </select>
        </Field>

        <Field label="Uploaded By">
          <select
            value={uploaderId}
            onChange={(e) => setUploaderId(e.target.value)}
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

        <Field label="Description (optional)">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Brief context — what is this document, why is it here?"
            style={{ ...inputStyle, fontFamily: 'inherit' }}
          />
        </Field>

        <Field label="Expires (optional)">
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
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
              background: isConfidential
                ? 'rgba(180, 95, 0, 0.06)'
                : '#FFFFFF',
            }}
          >
            <input
              type="checkbox"
              checked={isConfidential}
              onChange={(e) => setIsConfidential(e.target.checked)}
            />
            <span style={{ fontSize: '14px', color: '#0A0A0A' }}>
              Mark as confidential
            </span>
          </label>
        </Field>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end',
            marginTop: '8px',
          }}
        >
          <button onClick={onClose} disabled={uploadActive} style={cancelBtn(uploadActive)}>
            {uploadSession.phase === 'completed' ? 'Close' : 'Cancel'}
          </button>
          {uploadSession.phase === 'failed' ? (
            <button onClick={save} style={saveBtn(false)}>Retry</button>
          ) : (
            <button onClick={save} disabled={uploadActive || uploadSession.phase === 'completed'} style={saveBtn(uploadActive || uploadSession.phase === 'completed')}>
              {uploadActive ? 'Uploading…' : 'Upload'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function DocumentRow({
  document,
  participantId,
  onDeleted,
}: {
  document: ParticipantDocumentWithStaff
  participantId: string
  onDeleted: () => void
}) {
  const [downloading, setDownloading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const category = (document.category ?? 'other') as DocumentCategory
  const icon = DOCUMENT_CATEGORY_ICONS[category] ?? '📄'
  const categoryLabel = DOCUMENT_CATEGORY_LABELS[category] ?? document.category

  const expirationWarning = useMemo(() => {
    if (!document.expires_at) return null
    const exp = new Date(document.expires_at)
    const now = new Date()
    const ninetyDays = new Date()
    ninetyDays.setDate(now.getDate() + 90)
    if (exp < now) return 'expired'
    if (exp <= ninetyDays) return 'soon'
    return null
  }, [document.expires_at])

  async function handleDownload() {
    setDownloading(true)
    const supabase = createBrowserClient()
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET_PARTICIPANT_DOCS)
      .createSignedUrl(document.storage_path, SIGNED_URL_TTL_SECONDS)

    setDownloading(false)
    if (error || !data) {
      alert(`Could not generate download link: ${error?.message ?? 'unknown'}`)
      return
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  async function handleDelete() {
    setDeleting(true)
    const supabase = createBrowserClient()

    // Delete metadata row first (RLS will protect)
    const { error: deleteError } = await supabase
      .from('participant_documents')
      .delete()
      .eq('id', document.id)

    if (deleteError) {
      setDeleting(false)
      alert(`Could not delete: ${deleteError.message}`)
      return
    }

    // Best-effort delete from storage (don't block on this)
    await supabase.storage
      .from(STORAGE_BUCKET_PARTICIPANT_DOCS)
      .remove([document.storage_path])

    setDeleting(false)
    onDeleted()
  }

  return (
    <article
      style={{
        border: '1px solid rgba(10, 10, 10, 0.1)',
        borderLeft: document.is_confidential
          ? '4px solid #B45F00'
          : '1px solid rgba(10, 10, 10, 0.1)',
        borderRadius: '6px',
        padding: '16px 20px',
        background: document.is_confidential ? '#FFFAF0' : '#FFFFFF',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '14px',
        }}
      >
        <div style={{ fontSize: '28px', lineHeight: 1 }}>
          {isPreviewableImage(document.filename, document.mime_type ?? '') ? (
            <DocumentImage path={document.storage_path} />
          ) : icon}
        </div>
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              marginBottom: '4px',
            }}
          >
            <div
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#0A0A0A',
                wordBreak: 'break-word',
              }}
            >
              {document.filename}
            </div>
            {document.is_confidential && (
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
            )}
            {expirationWarning === 'expired' && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: 'rgba(206, 17, 38, 0.12)',
 color: '#CE1126',
                  fontFamily:
                    'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
                }}
              >
                Expired
              </span>
            )}
            {expirationWarning === 'soon' && (
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
                Expiring Soon
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: 'rgba(10, 10, 10, 0.55)',
              fontFamily:
                'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
              marginBottom: document.description ? '8px' : 0,
            }}
          >
            {categoryLabel} · {formatFileSize(document.file_size_bytes)} ·{' '}
            {formatDateTime(document.uploaded_at)}
            {document.uploaded_by_name && ` · ${document.uploaded_by_name}`}
            {document.expires_at && ` · Expires ${formatDate(document.expires_at)}`}
          </div>
          {document.description && (
            <div
              style={{
                fontSize: '13px',
                lineHeight: 1.55,
                color: 'rgba(10, 10, 10, 0.8)',
                marginBottom: '12px',
              }}
            >
              {document.description}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handleDownload}
              disabled={downloading || deleting}
              style={miniBtn(downloading || deleting)}
            >
              {downloading ? 'Loading…' : 'Download'}
            </button>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={downloading || deleting}
                style={miniBtnDanger(downloading || deleting)}
              >
                Delete
              </button>
            ) : (
              <>
                <button
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  style={miniBtn(deleting)}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={miniBtnDanger(deleting)}
                >
                  {deleting ? 'Deleting…' : 'Confirm Delete'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

function EmptyState({
  hasHidden,
  totalCount,
}: {
  hasHidden: boolean
  totalCount: number
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
          marginBottom: hasHidden ? '8px' : 0,
        }}
      >
        {totalCount === 0
          ? 'No documents uploaded yet. Click + Upload Document to add the first file.'
          : hasHidden
            ? 'All documents are confidential and hidden.'
            : 'No visible documents.'}
      </div>
      {hasHidden && (
        <div
          style={{
            fontSize: '12px',
            color: 'rgba(10, 10, 10, 0.5)',
          }}
        >
          Toggle "Show confidential" above to view.
        </div>
      )}
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

function miniBtn(disabled: boolean): React.CSSProperties {
  return {
    padding: '6px 12px',
    border: '1px solid rgba(10, 10, 10, 0.18)',
    background: '#FFFFFF',
    color: '#0A0A0A',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    opacity: disabled ? 0.5 : 1,
  }
}

function miniBtnDanger(disabled: boolean): React.CSSProperties {
  return {
    padding: '6px 12px',
    border: '1px solid rgba(206, 17, 38, 0.4)',
    background: '#FFFFFF',
    color: '#CE1126',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    opacity: disabled ? 0.5 : 1,
  }
}

function formatDateTime(iso: string): string {
  return formatDateTimeValue(iso)
}

function formatDate(d: string | null): string {
  if (!d) return ''
  return formatDateValue(d)
}
