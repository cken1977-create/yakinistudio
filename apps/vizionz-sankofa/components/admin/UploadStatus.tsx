'use client'

// Visible from the moment a photo upload is in progress until it finishes.
// A percentage is included only when byte progress was measured.

export function UploadStatus({
  text,
  active,
  percent,
}: {
  text: string | null
  active: boolean
  percent: number | null
}) {
  if (!text) return null
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="upload-status"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: '12px',
        margin: '0 auto 16px',
        maxWidth: '520px',
        textAlign: 'left',
        fontSize: '15px',
        fontWeight: 600,
        lineHeight: 1.45,
        color: '#0A0A0A',
      }}
    >
      {active && (
        <span
          aria-hidden
          style={{
            width: '16px',
            height: '16px',
            marginTop: '3px',
            flex: '0 0 auto',
            border: '2px solid rgba(10, 10, 10, 0.15)',
            borderTopColor: '#0A2548',
            borderRadius: '50%',
            animation: 'vs-upload-spin 0.8s linear infinite',
          }}
        />
      )}
      <span>
        {text}
        {percent !== null ? ` ${percent}%` : ''}
      </span>
      <style>{`@keyframes vs-upload-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
