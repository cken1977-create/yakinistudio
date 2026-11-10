import { notFound } from 'next/navigation';
import { SentryTestButton } from './sentry-test-button';

export const dynamic = 'force-dynamic';
export const robots = { index: false, follow: false };

/**
 * Preview/dev only. 404s in production so this never ships as a public page.
 */
export default function SentryTestPage() {
  if (process.env.VERCEL_ENV === 'production') {
    notFound();
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0A0908',
        color: '#F5F0E8',
        fontFamily: 'system-ui, sans-serif',
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 480, textAlign: 'center' }}>
        <p style={{ letterSpacing: '0.18em', fontSize: 11, opacity: 0.6 }}>
          PREVIEW ONLY
        </p>
        <h1 style={{ fontSize: 28, margin: '12px 0' }}>Sentry test</h1>
        <p style={{ opacity: 0.75, fontSize: 14 }}>
          This page is hidden in production. Use the button for a browser error,
          or POST /api/sentry-test for a server error.
        </p>
        <SentryTestButton />
      </div>
    </main>
  );
}
