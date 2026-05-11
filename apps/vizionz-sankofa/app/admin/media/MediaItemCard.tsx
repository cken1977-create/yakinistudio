// VIZIONZ SANKOFA · /admin/media · MediaItemCard
// Single card for a media item. Preview + edit form + delete flow.

'use client'

import { useState, useTransition } from 'react'
import { updateMediaItem, deleteMediaItem } from '../actions/media'

export type MediaItem = {
  id: string
  storage_path: string
  kind: 'photo' | 'video'
  caption: string | null
  event_date: string | null
  display_order: number
  created_at: string
}

const SUPABASE_PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

function publicUrlFor(storagePath: string): string {
  return `${SUPABASE_PUBLIC_URL}/storage/v1/object/public/media/${storagePath}`
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  // iso may be 'YYYY-MM-DD' (from event_date) or full timestamp (created_at)
  const datePart = iso.split('T')[0]
  return datePart
}

export function MediaItemCard({ item }: { item: MediaItem }) {
  const [mode, setMode] = useState<'view' | 'edit' | 'confirming-delete'>('view')
  const [caption, setCaption] = useState(item.caption ?? '')
  const [eventDate, setEventDate] = useState(formatDate(item.event_date))
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const url = publicUrlFor(item.storage_path)

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const result = await updateMediaItem(item.id, {
        caption,
        event_date: eventDate,
      })
      if (!result.ok) {
        setError(result.error ?? 'Save failed')
        return
      }
      setMode('view')
    })
  }

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = await deleteMediaItem(item.id)
      if (!result.ok) {
        setError(result.error ?? 'Delete failed')
        return
      }
      // On success the page revalidates and this card disappears.
    })
  }

  function handleCancel() {
    setCaption(item.caption ?? '')
    setEventDate(formatDate(item.event_date))
    setError(null)
    setMode('view')
  }

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(10, 10, 10, 0.08)',
        borderRadius: '2px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Preview */}
      <div
        style={{
          width: '100%',
          aspectRatio: '4 / 3',
          background: '#0A0A0A',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {item.kind === 'photo' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={item.caption ?? 'Vizionz Sankofa media'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          <video
            src={url}
            controls
            preload="metadata"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              background: '#0A0A0A',
            }}
          />
        )}

        {/* Kind badge */}
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            background: item.kind === 'photo' ? '#0A2548' : '#007A33',
            color: '#FFFFFF',
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            padding: '4px 8px',
            borderRadius: '2px',
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          }}
        >
          {item.kind}
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          flex: 1,
        }}
      >
        {mode === 'view' && (
          <ViewMode
            item={item}
            onEdit={() => setMode('edit')}
            onDelete={() => setMode('confirming-delete')}
          />
        )}

        {mode === 'edit' && (
          <EditMode
            caption={caption}
            eventDate={eventDate}
            onCaptionChange={setCaption}
            onEventDateChange={setEventDate}
            onSave={handleSave}
            onCancel={handleCancel}
            isPending={isPending}
            error={error}
          />
        )}

        {mode === 'confirming-delete' && (
          <ConfirmDeleteMode
            onConfirm={handleDelete}
            onCancel={() => setMode('view')}
            isPending={isPending}
            error={error}
          />
        )}
      </div>
    </div>
  )
}

function ViewMode({
  item,
  onEdit,
  onDelete,
}: {
  item: MediaItem
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <>
      <div style={{ minHeight: '60px' }}>
        {item.caption ? (
          <p
            style={{
              fontSize: '14px',
              lineHeight: 1.5,
              color: '#0A0A0A',
              margin: 0,
              marginBottom: '6px',
            }}
          >
            {item.caption}
          </p>
        ) : (
          <p
            style={{
              fontSize: '13px',
              fontStyle: 'italic',
              color: 'rgba(10, 10, 10, 0.4)',
              margin: 0,
              marginBottom: '6px',
            }}
          >
            No caption yet
          </p>
        )}
        {item.event_date && (
          <div
            style={{
              fontSize: '11px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(10, 10, 10, 0.55)',
              fontFamily:
                'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
            }}
          >
            {formatDate(item.event_date)}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
        <button
          type="button"
          onClick={onEdit}
          style={{
            flex: 1,
            padding: '10px 14px',
            fontSize: '12px',
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
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          style={{
            padding: '10px 14px',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#CE1126',
            background: 'transparent',
            border: '1px solid rgba(206, 17, 38, 0.3)',
            borderRadius: '2px',
            cursor: 'pointer',
          }}
        >
          Delete
        </button>
      </div>
    </>
  )
}

function EditMode({
  caption,
  eventDate,
  onCaptionChange,
  onEventDateChange,
  onSave,
  onCancel,
  isPending,
  error,
}: {
  caption: string
  eventDate: string
  onCaptionChange: (v: string) => void
  onEventDateChange: (v: string) => void
  onSave: () => void
  onCancel: () => void
  isPending: boolean
  error: string | null
}) {
  return (
    <>
      <div>
        <label
          style={{
            display: 'block',
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(10, 10, 10, 0.6)',
            marginBottom: '6px',
          }}
        >
          Caption
        </label>
        <textarea
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder="Describe this moment…"
          rows={2}
          disabled={isPending}
          style={{
            width: '100%',
            padding: '8px 10px',
            fontSize: '14px',
            color: '#0A0A0A',
            background: '#FFFFFF',
            border: '1px solid rgba(10, 10, 10, 0.2)',
            borderRadius: '2px',
            fontFamily: 'inherit',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div>
        <label
          style={{
            display: 'block',
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(10, 10, 10, 0.6)',
            marginBottom: '6px',
          }}
        >
          Event Date
        </label>
        <input
          type="date"
          value={eventDate}
          onChange={(e) => onEventDateChange(e.target.value)}
          disabled={isPending}
          style={{
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
          }}
        />
      </div>

      {error && (
        <div
          style={{
            padding: '8px 10px',
            background: 'rgba(206, 17, 38, 0.08)',
            borderLeft: '3px solid #CE1126',
            fontSize: '13px',
            color: '#0A0A0A',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
        <button
          type="button"
          onClick={onSave}
          disabled={isPending}
          style={{
            flex: 1,
            padding: '10px 14px',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#FFFFFF',
            background: '#007A33',
            border: 'none',
            borderRadius: '2px',
            cursor: isPending ? 'wait' : 'pointer',
            opacity: isPending ? 0.6 : 1,
          }}
        >
          {isPending ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          style={{
            padding: '10px 14px',
            fontSize: '12px',
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
    </>
  )
}

function ConfirmDeleteMode({
  onConfirm,
  onCancel,
  isPending,
  error,
}: {
  onConfirm: () => void
  onCancel: () => void
  isPending: boolean
  error: string | null
}) {
  return (
    <>
      <div
        style={{
          padding: '12px',
          background: 'rgba(206, 17, 38, 0.06)',
          borderLeft: '3px solid #CE1126',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#CE1126',
            marginBottom: '6px',
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          }}
        >
          Delete this item?
        </div>
        <p
          style={{
            fontSize: '13px',
            lineHeight: 1.5,
            color: '#0A0A0A',
            margin: 0,
          }}
        >
          The file and its record are removed. This cannot be undone.
        </p>
      </div>

      {error && (
        <div
          style={{
            padding: '8px 10px',
            background: 'rgba(206, 17, 38, 0.08)',
            borderLeft: '3px solid #CE1126',
            fontSize: '13px',
            color: '#0A0A0A',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          style={{
            flex: 1,
            padding: '10px 14px',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#FFFFFF',
            background: '#CE1126',
            border: 'none',
            borderRadius: '2px',
            cursor: isPending ? 'wait' : 'pointer',
            opacity: isPending ? 0.6 : 1,
          }}
        >
          {isPending ? 'Deleting…' : 'Yes, delete'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          style={{
            padding: '10px 14px',
            fontSize: '12px',
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
    </>
  )
}
