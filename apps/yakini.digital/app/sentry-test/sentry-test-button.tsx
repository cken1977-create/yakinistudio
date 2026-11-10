'use client';

export function SentryTestButton() {
  return (
    <button
      type="button"
      onClick={() => {
        throw new Error('Sentry preview test error (yakini.digital client)');
      }}
      style={{
        marginTop: 16,
        padding: '10px 18px',
        background: '#C9A227',
        color: '#0A0908',
        border: 'none',
        cursor: 'pointer',
        fontWeight: 600,
      }}
    >
      Throw a client test error
    </button>
  );
}
