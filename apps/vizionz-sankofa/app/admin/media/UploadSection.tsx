'use client'

// Gallery photo upload. The file control is a real label, not a scripted
// click on a display:none input, so a laptop browser can open the picker.
// Status stays visible from the moment files are accepted until each file
// is saved or refused. Byte percentage is shown only when it is measured;
// this storage client does not report that, so the status is a spinner.

import { useRef, useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UploadStatus } from '@/components/admin/UploadStatus'
import {
  GALLERY_ACCEPT,
  beginUpload,
  decideGalleryFile,
  explainHeicFailure,
  explainStorageError,
  finishUpload,
  idleUpload,
  isUploadActive,
  markUploadFile,
  measuredUploadPercent,
  pathsToRemoveAfterFailure,
  retryFailedUpload,
  safeStorageName,
  selectUploadFiles,
  uploadStatusText,
  type UploadSession,
} from '@/lib/media/picture-upload'

const hiddenInput: CSSProperties = {
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

async function convertHeicToJpeg(file: File): Promise<File> {
  const heic2anyModule = await import('heic2any')
  const heic2any = heic2anyModule.default
  const converted = (await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 })) as Blob
  const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg')
  return new File([converted], newName, { type: 'image/jpeg', lastModified: Date.now() })
}

export function UploadSection() {
  const router = useRouter()
  const sessionRef = useRef<UploadSession>(idleUpload())
  const filesRef = useRef<File[]>([])
  const [session, setSession] = useState<UploadSession>(idleUpload())
  const [previews, setPreviews] = useState<{ name: string; url: string }[]>([])
  const [measured, setMeasured] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function commit(next: UploadSession) {
    sessionRef.current = next
    setSession(next)
  }

  async function pump(files: File[]) {
    await new Promise((resolve) => setTimeout(resolve, 0))
    let current = sessionRef.current
    for (let index = current.activeIndex ?? 0; index < files.length; index++) {
      if (current.files[index]?.status === 'done') continue
      const file = files[index]
      current = markUploadFile(current, index, 'preparing')
      commit(current)
      setMeasured(measuredUploadPercent(null))
      const decision = decideGalleryFile(file)
      if (!decision.ok) {
        current = markUploadFile(current, index, 'failed', decision.reason)
        commit(current)
        continue
      }
      let body: File = file
      let contentType = decision.contentType
      if (decision.heic) {
        try {
          body = await convertHeicToJpeg(file)
          contentType = 'image/jpeg'
        } catch {
          current = markUploadFile(current, index, 'failed', explainHeicFailure(file.name))
          commit(current)
          continue
        }
      }
      current = markUploadFile(current, index, 'uploading')
      commit(current)
      const path = `${Date.now()}-${index}-${safeStorageName(body.name)}`
      const supabase = createClient()
      const { error: uploadError } = await supabase.storage.from('media').upload(path, body, {
        cacheControl: '3600',
        upsert: false,
        contentType,
      })
      if (uploadError) {
        current = markUploadFile(current, index, 'failed', explainStorageError(uploadError.message))
        commit(current)
        continue
      }
      current = markUploadFile(current, index, 'saving')
      commit(current)
      const { error: insertError } = await supabase.from('media_items').insert({
        storage_path: path,
        kind: decision.kind,
        display_order: 0,
      })
      if (insertError) {
        const cleanup = pathsToRemoveAfterFailure(path, false)
        if (cleanup.length > 0) await supabase.storage.from('media').remove(cleanup)
        current = markUploadFile(current, index, 'failed', explainStorageError(insertError.message))
        commit(current)
        continue
      }
      if (decision.kind === 'photo') {
        const url = URL.createObjectURL(body)
        setPreviews((prev) => [...prev, { name: file.name, url }])
      }
      current = markUploadFile(current, index, 'done')
      commit(current)
    }
    current = finishUpload(sessionRef.current)
    commit(current)
    if (current.files.some((file) => file.status === 'done')) router.refresh()
  }

  function acceptFiles(list: FileList | File[] | null) {
    const files = Array.from(list ?? [])
    if (files.length === 0 || isUploadActive(sessionRef.current.phase)) return
    filesRef.current = files
    setPreviews((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.url))
      return []
    })
    const started = beginUpload(selectUploadFiles(idleUpload(), files.map((file) => file.name)))
    if (!started.accepted) return
    commit(started.session)
    void pump(files)
  }

  function retry() {
    const next = retryFailedUpload(sessionRef.current)
    if (!next.accepted) return
    commit(next.session)
    void pump(filesRef.current)
  }

  function reset() {
    setPreviews((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.url))
      return []
    })
    commit(idleUpload())
    if (inputRef.current) inputRef.current.value = ''
  }

  const active = isUploadActive(session.phase)
  const status = uploadStatusText(session)
  const failed = session.files.filter((file) => file.status === 'failed')

  return (
    <section
      data-testid="media-upload"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        acceptFiles(event.dataTransfer.files)
      }}
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(10, 10, 10, 0.08)',
        borderRadius: '2px',
        padding: '32px 24px',
        position: 'relative',
        marginBottom: '40px',
      }}
    >
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          background: 'linear-gradient(90deg, #CE1126 0%, #CE1126 33.33%, #0A0A0A 33.33%, #0A0A0A 66.66%, #007A33 66.66%, #007A33 100%)',
        }}
      />
      {session.phase === 'idle' && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <label htmlFor="vs-media-files" style={selectBtn}>
            Select photos &amp; videos
          </label>
          <p style={{ marginTop: '16px', fontSize: '13px', color: 'rgba(10, 10, 10, 0.55)' }}>
            Photos: JPG, PNG, WebP, GIF · Videos: MP4 (H.264) recommended. You can also drop files here.
          </p>
        </div>
      )}
      {session.phase !== 'idle' && (
        <div style={{ padding: '24px 0', textAlign: 'center' }}>
          <UploadStatus text={status} active={active} percent={measured} />
          {previews.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginBottom: '16px' }}>
              {previews.map((preview) => (
                <figure key={preview.url} style={{ margin: 0, width: '160px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview.url} alt="" style={{ width: '160px', height: '120px', objectFit: 'cover', display: 'block', background: '#0A0A0A' }} />
                  <figcaption style={{ fontSize: '12px', marginTop: '6px' }}>Saved · {preview.name}</figcaption>
                </figure>
              ))}
            </div>
          )}
          {failed.length > 0 && (
            <ul style={{ textAlign: 'left', maxWidth: '520px', margin: '0 auto 16px', color: '#CE1126', fontSize: '14px' }}>
              {failed.map((file) => <li key={file.name}>{file.name}: {file.reason}</li>)}
            </ul>
          )}
          {!active && failed.length > 0 && (
            <button type="button" onClick={retry} style={selectBtn}>Retry failed</button>
          )}
          {!active && session.phase === 'completed' && (
            <button type="button" onClick={reset} style={{ ...selectBtn, marginTop: '8px' }}>Upload more</button>
          )}
          {!active && failed.length > 0 && (
            <button type="button" onClick={reset} style={{ ...selectBtn, marginTop: '8px', marginLeft: '8px', background: 'transparent', color: '#0A0A0A', border: '1px solid rgba(10,10,10,0.2)' }}>
              Start over
            </button>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        id="vs-media-files"
        type="file"
        accept={GALLERY_ACCEPT}
        multiple
        disabled={active}
        onChange={(event) => {
          acceptFiles(event.target.files)
          event.target.value = ''
        }}
        style={hiddenInput}
      />
    </section>
  )
}

const selectBtn: CSSProperties = {
  display: 'inline-block',
  padding: '18px 32px',
  fontSize: '15px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#FFFFFF',
  background: '#0A2548',
  border: 'none',
  borderRadius: '2px',
  cursor: 'pointer',
  width: '100%',
  maxWidth: '480px',
  fontFamily: 'inherit',
}
