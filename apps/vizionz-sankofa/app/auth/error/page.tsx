// VIZIONZ SANKOFA · /auth/error
// Friendly error page for failed magic-link verifications.
// Reasons: link expired, link already used, link tampered.

import Link from 'next/link'

export default function AuthErrorPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '48px 32px',
          background: '#FFFFFF',
          border: '1px solid rgba(10, 10, 10, 0.08)',
          borderRadius: '2px',
          position: 'relative',
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

        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#CE1126',
            marginBottom: '16px',
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          }}
        >
          Sign-In Link Issue
        </div>

        <h1
          style={{
            fontSize: '28px',
            lineHeight: 1.2,
            fontWeight: 600,
            color: '#0A0A0A',
            marginBottom: '16px',
            fontFamily: '"DM Serif Display", Georgia, serif',
          }}
        >
          We couldn&apos;t verify your link.
        </h1>

        <p
          style={{
            fontSize: '15px',
            lineHeight: 1.6,
            color: 'rgba(10, 10, 10, 0.7)',
            marginBottom: '24px',
          }}
        >
          This usually happens for one of three reasons:
        </p>

        <ul
          style={{
            margin: '0 0 32px 0',
            padding: '0 0 0 20px',
            fontSize: '15px',
            lineHeight: 1.7,
            color: 'rgba(10, 10, 10, 0.7)',
          }}
        >
          <li>The link is more than one hour old.</li>
          <li>The link has already been used to sign in.</li>
          <li>The link was opened in a different browser than requested.</li>
        </ul>

        <p
          style={{
            fontSize: '15px',
            lineHeight: 1.6,
            color: 'rgba(10, 10, 10, 0.7)',
            marginBottom: '24px',
          }}
        >
          Request a fresh sign-in link below.
        </p>

        <Link
          href="/admin/login"
          style={{
            display: 'inline-block',
            padding: '14px 28px',
            fontSize: '14px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#FFFFFF',
            background: '#0A2548',
            border: 'none',
            borderRadius: '2px',
            textDecoration: 'none',
          }}
        >
          Request a new link
        </Link>

        <div
          style={{
            marginTop: '32px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(10, 10, 10, 0.08)',
            fontSize: '12px',
            lineHeight: 1.5,
            color: 'rgba(10, 10, 10, 0.5)',
          }}
        >
          Still having trouble? Contact the operator at hello@yakini.digital.
        </div>
      </section>
    </main>
  )
}
