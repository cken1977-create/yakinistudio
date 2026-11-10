'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

/**
 * App Router global error boundary. Reports to Sentry when a DSN is set.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0A0908',
          color: '#F5F0E8',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ maxWidth: 420, padding: 24, textAlign: 'center' }}>
          <p style={{ letterSpacing: '0.18em', fontSize: 11, opacity: 0.6 }}>
            YAKINI
          </p>
          <h1 style={{ fontSize: 28, margin: '12px 0' }}>Something went wrong.</h1>
          <p style={{ opacity: 0.75, fontSize: 14 }}>
            The error was recorded. You can try again, or come back in a moment.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 20,
              padding: '10px 18px',
              background: '#C9A227',
              color: '#0A0908',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
