'use client'

// VIZIONZ SANKOFA · files on a contact / organization / grant / donor.
// Private bucket vs-crm-files; access follows the record (RLS on the table
// and on the storage objects). Opens via a 60-second signed URL.

import { useState } from 'react'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import {
  ATTACHMENT_COLUMNS, CRM_FILES_BUCKET, MAX_ATTACHMENT_BYTES, attachmentPath, formatBytes,
  type AttachmentRow, type TimelineSubject,
} from '@/lib/crm/model'
import { EmptyState, Meta, formatDay, miniBtn, secondaryBtn } from '../ui'

export function Attachments({
  subject, initial, canUpload, canRemoveAny, currentUserId,
}: {
  subject: { type: TimelineSubject; id: string }
  initial: AttachmentRow[]
  canUpload: boolean
  canRemoveAny: boolean
  currentUserId: string
}) {
  const [files, setFiles] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function upload(list: FileList | null) {
    if (!list || list.length === 0) return
    setBusy(true); setErr(null)
    const supabase = createBrowserClient()
    const added: AttachmentRow[] = []
    try {
      for (const file of Array.from(list)) {
        if (file.size > MAX_ATTACHMENT_BYTES) throw new Error(`${file.name} is over 25 MB.`)
        const path = attachmentPath(subject.type, subject.id, file.name)
        const { error: upErr } = await supabase.storage.from(CRM_FILES_BUCKET)
          .upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false })
        if (upErr) throw new Error(`Upload failed: ${upErr.message}`)
        const { data, error } = await supabase.from('vs_attachments').insert({
          subject_type: subject.type, subject_id: subject.id, storage_path: path,
          file_name: file.name, mime_type: file.type || null, size_bytes: file.size,
        }).select(ATTACHMENT_COLUMNS).single()
        if (error || !data) {
          await supabase.storage.from(CRM_FILES_BUCKET).remove([path])
          throw new Error(error?.message ?? 'Could not save the file record.')
        }
        added.push(data as unknown as AttachmentRow)
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Upload failed.')
    } finally {
      setFiles((f) => [...added, ...f])
      setBusy(false)
    }
  }

  async function open(f: AttachmentRow) {
    const supabase = createBrowserClient()
    const { data, error } = await supabase.storage.from(CRM_FILES_BUCKET).createSignedUrl(f.storage_path, 60)
    if (error || !data?.signedUrl) { setErr(error?.message ?? 'Could not open the file.'); return }
    window.open(data.signedUrl, '_blank', 'noopener')
  }

  async function remove(f: AttachmentRow) {
    if (!window.confirm(`Remove ${f.file_name}?`)) return
    const supabase = createBrowserClient()
    const { data, error } = await supabase.from('vs_attachments').delete().eq('id', f.id).select('id')
    if (error || !data?.length) { setErr(error?.message ?? "You can't remove this file."); return }
    await supabase.storage.from(CRM_FILES_BUCKET).remove([f.storage_path])
    setFiles((x) => x.filter((y) => y.id !== f.id))
  }

  return (
    <div data-testid="attachments">
      {canUpload && (
        <label style={{ ...secondaryBtn(busy), minHeight: '44px', marginBottom: '12px', cursor: busy ? 'wait' : 'pointer' }}>
          {busy ? 'Uploading…' : '+ Attach files'}
          <input type="file" multiple disabled={busy} data-testid="attach-input" onChange={(e) => { void upload(e.target.files); e.target.value = '' }}
            style={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' }} />
        </label>
      )}
      {err && <p role="alert" style={{ color: '#CE1126', fontSize: '13px', margin: '0 0 10px' }}>{err}</p>}
      {files.length === 0 ? (
        <EmptyState title="No files yet">{canUpload ? 'Attach agreements, letters, budgets or photos (up to 25 MB each).' : null}</EmptyState>
      ) : (
        <ul style={{ margin: 0, padding: 0, display: 'grid', gap: '8px' }}>
          {files.map((f) => (
            <li key={f.id} style={{ listStyle: 'none', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', background: '#FFFFFF', border: '1px solid rgba(10,10,10,0.1)', borderRadius: '8px', padding: '10px 14px' }}>
              <div style={{ minWidth: 0 }}>
                <button type="button" onClick={() => void open(f)} style={{ background: 'none', border: 'none', padding: 0, color: '#0A2548',
                  fontWeight: 600, fontSize: '14px', cursor: 'pointer', textAlign: 'left', overflowWrap: 'anywhere' }}>{f.file_name}</button>
                <Meta>{[formatBytes(f.size_bytes), f.uploaded_by_name, formatDay(f.created_at)].filter(Boolean).join(' · ')}</Meta>
              </div>
              {(canRemoveAny || (canUpload && f.uploaded_by === currentUserId)) && (
                <button type="button" onClick={() => void remove(f)} style={miniBtn(false, true)}>Remove</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
