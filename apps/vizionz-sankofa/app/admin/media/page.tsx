// VIZIONZ SANKOFA · /admin/media
// Single-button photo + video upload. Native file picker (mobile + desktop).
// Files upload to Supabase Storage, then media_items rows are inserted.
// Metadata editing (caption, date, order) deferred to Step 8 media list.

'use client'

import { useState, useRef, type ChangeEvent } from 'react'
import { createClient } from '@/lib/supabase/client'

type UploadState =
  | { kind: 'idle' }
  | { kind: 'uploading'; current: number; total: number; currentName: string }
  | { kind: 'complete'; succeeded: number; failed: number }
  | { kind: 'error'; message: string }

const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/webp', 'image/gif']
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']

function classifyFile(file: File): 'photo' | 'video' | null {
  if (PHOTO_TYPES.includes(file.type)) return 'photo'
  if (VIDEO_TYPES.includes(file.type)) return 'video'
  return null
}

function safeFileName(name: string): string {
  // Strip path components, lowercase extension, replace unsafe chars
  const base = name.split('/').pop()!.split('\\').pop()!
  return base
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, '-')
    .replace(/-+/g, '-')
}

export default function MediaAdminPage() {
  const [state, setState] = useState<UploadState>({ kind: 'idle' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return

    const supabase = createClient()
    const timestamp = Date.now()
    let succeeded = 0
    let failed = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setState({
        kind: 'uploading',
        current: i + 1,
        total: files.length,
        currentName: file.name,
      })

      const kind = classifyFile(file)
      if (!kind) {
        failed++
        continue
      }

      const storagePath = `${timestamp}-${i}-${safeFileName(file.name)}`

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        failed++
        continue
      }

      const { error: insertError } = await supabase.from('media_items').insert({
        storage_path: storagePath,
        kind,
        display_order: 0,
      })

      if (insertError) {
        // Storage upload succeeded but DB row failed — orphan file.
        // Acceptable for tonight; Step 8 will surface orphan cleanup.
        failed++
        continue
      }

      succeeded++
    }

    setState({ kind: 'complete', succeeded, failed })

    // Reset the file input so the same files can be re-uploaded if needed
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function reset() {
    setState({ kind: 'idle' })
  }

  return (
    <div>
      <section style={{ marginBottom: '32px' }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#CE1126',
            marginBottom: '12px',
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          }}
        >
          Media · Wave 1.5
        </div>

        <h1
          style={{
            fontSize: '32px',
            lineHeight: 1.15,
            fontWeight: 600,
            color: '#0A0A0A',
            marginBottom: '12px',
            fontFamily: '"DM Serif Display", Georgia, serif',
          }}
        >
          Photos &amp; Videos
        </h1>

        <p
          style={{
            fontSize: '15px',
            lineHeight: 1.6,
            color: 'rgba(10, 10, 10, 0.65)',
            maxWidth: '640px',
          }}
        >
          Upload event photos and program videos for the public Gallery on
          vizionz-sankofa.org. Select one or many files — they upload together.
        </p>
      </section>

      <section
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(10, 10, 10, 0.08)',
          borderRadius: '2px',
          padding: '32px 24px',
          position: 'relative',
          marginBottom: '24px',
        }}
      >
        {/* Tri-color rule along top edge */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background:
              'linear-gradient(90deg, #CE1126 0%, #CE1126 33.33%, #0A0A0A 33.33%, #0A0A0A 66.66%, #007A33 66.66%, #007A33 100%)',
          }}
        />

        {state.kind === 'idle' && <IdleState onClickUpload={() => fileInputRef.current?.click()} />}
        {state.kind === 'uploading' && <UploadingState state={state} />}
        {state.kind === 'complete' && <CompleteState state={state} onReset={reset} />}
        {state.kind === 'error' && <ErrorState message={state.message} onReset={reset} />}

        {/* Hidden file input — triggered by the visible button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileSelection}
          style={{ display: 'none' }}
        />
      </section>

      <section
        style={{
          padding: '20px 24px',
          background: 'rgba(10, 10, 10, 0.02)',
          borderLeft: '3px solid rgba(10, 10, 10, 0.2)',
          fontSize: '13px',
          lineHeight: 1.6,
          color: 'rgba(10, 10, 10, 0.65)',
        }}
      >
        <strong style={{ color: '#0A0A0A' }}>Coming in next update:</strong>{' '}
        manage uploaded media — add captions, set event dates, reorder, and
        delete. For now, every upload appears in the Gallery in chronological
        order.
      </section>
    </div>
  )
}

function IdleState({ onClickUpload }: { onClickUpload: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '24px 0' }}>
      <button
        type="button"
        onClick={onClickUpload}
        style={{
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
        }}
      >
        Select photos &amp; videos
      </button>
      <p
        style={{
          marginTop: '16px',
          fontSize: '13px',
          color: 'rgba(10, 10, 10, 0.55)',
        }}
      >
        Photos: JPG, PNG, HEIC, WebP, GIF · Videos: MP4, MOV, WebM
      </p>
    </div>
  )
}

function UploadingState({
  state,
}: {
  state: { kind: 'uploading'; current: number; total: number; currentName: string }
}) {
  const percent = Math.round((state.current / state.total) * 100)
  return (
    <div style={{ padding: '24px 0' }}>
      <div
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#0A0A0A',
          marginBottom: '12px',
          textAlign: 'center',
        }}
      >
        Uploading {state.current} of {state.total}…
      </div>
      <div
        style={{
          fontSize: '12px',
          color: 'rgba(10, 10, 10, 0.55)',
          marginBottom: '20px',
          textAlign: 'center',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {state.currentName}
      </div>
      <div
        style={{
          height: '6px',
          background: 'rgba(10, 10, 10, 0.08)',
          borderRadius: '3px',
          overflow: 'hidden',
          maxWidth: '480px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percent}%`,
            background: '#007A33',
            transition: 'width 0.2s ease',
          }}
        />
      </div>
    </div>
  )
}

function CompleteState({
  state,
  onReset,
}: {
  state: { kind: 'complete'; succeeded: number; failed: number }
  onReset: () => void
}) {
  return (
    <div style={{ padding: '24px 0', textAlign: 'center' }}>
      <div
        style={{
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#007A33',
          marginBottom: '12px',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        }}
      >
        Upload Complete
      </div>

      <div
        style={{
          fontSize: '28px',
          fontWeight: 600,
          color: '#0A0A0A',
          marginBottom: '8px',
          fontFamily: '"DM Serif Display", Georgia, serif',
        }}
      >
        {state.succeeded} {state.succeeded === 1 ? 'file' : 'files'} uploaded
      </div>

      {state.failed > 0 && (
        <div
          style={{
            fontSize: '14px',
            color: '#CE1126',
            marginBottom: '16px',
          }}
        >
          {state.failed} failed — usually unsupported file types
        </div>
      )}

      <p
        style={{
          fontSize: '14px',
          color: 'rgba(10, 10, 10, 0.65)',
          marginBottom: '24px',
        }}
      >
        Files are now stored. They&apos;ll appear on the public Gallery once
        the next update ships.
      </p>

      <button
        type="button"
        onClick={onReset}
        style={{
          padding: '14px 28px',
          fontSize: '14px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#FFFFFF',
          background: '#0A2548',
          border: 'none',
          borderRadius: '2px',
          cursor: 'pointer',
        }}
      >
        Upload more
      </button>
    </div>
  )
}

function ErrorState({
  message,
  onReset,
}: {
  message: string
  onReset: () => void
}) {
  return (
    <div style={{ padding: '24px 0', textAlign: 'center' }}>
      <div
        style={{
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#CE1126',
          marginBottom: '12px',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        }}
      >
        Upload Failed
      </div>
      <p
        style={{
          fontSize: '15px',
          color: '#0A0A0A',
          marginBottom: '24px',
          maxWidth: '480px',
          margin: '0 auto 24px',
        }}
      >
        {message}
      </p>
      <button
        type="button"
        onClick={onReset}
        style={{
          padding: '14px 28px',
          fontSize: '14px',
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
        Try again
      </button>
    </div>
  )
}
