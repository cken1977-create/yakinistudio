// VIZIONZ SANKOFA · /admin/access-denied
// Landing page for authenticated employees who navigate to operator-only
// surfaces (delete intake, manage media library, manage operators).
// Reached via redirect from requireOperator() when the session is an
// employee who tried to access an operator-only page.
//
// Substrate-honest framing: the user is authorized for SOMETHING in
// VS Operations, just not THIS page. Send them back to where they
// belong instead of fully kicking them out.

import Link from 'next/link'
import { getCurrentOperator } from '@/lib/supabase/auth'

export const dynamic = 'force-dynamic'

export default async function AccessDeniedPage() {
  const operator = await getCurrentOperator()
  const displayName =
    operator?.operator.display_name ?? operator?.email ?? 'there'

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#FAFAF8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          height: '3px',
          background:
            'linear-gradient(90deg, #CE1126 0%, #CE1126 33.33%, #0A0A0A 33.33%, #0A0A0A 66.66%, #007A33 66.66%, #007A33 100%)',
          marginBottom: '32px',
        }}
      />

      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          background: '#FFFFFF',
          border: '1px solid rgba(10, 10, 10, 0.08)',
          borderRadius: '2px',
          padding: '40px 32px',
        }}
      >
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
          Operator Access Required
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
          This page is for operators only, {displayName}.
        </h1>

        <p
          style={{
            fontSize: '15px',
            lineHeight: 1.65,
            color: 'rgba(10, 10, 10, 0.7)',
            marginBottom: '24px',
          }}
        >
          Your account has employee access to Vizionz Sankofa Operations,
          but this surface — managing media, deleting intakes, or promoting
          subjects to Legacyline — is reserved for full operators like
          Khadijah and other organizational leadership.
        </p>

        <p
          style={{
            fontSize: '14px',
            lineHeight: 1.65,
            color: 'rgba(10, 10, 10, 0.7)',
            marginBottom: '28px',
          }}
        >
          If you think you need operator access for your role, ask Khadijah
          to upgrade your account.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link
            href="/admin"
            style={{
              padding: '12px 20px',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#FFFFFF',
              background: '#0A2548',
              border: 'none',
              borderRadius: '2px',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Back to admin home
          </Link>

          <Link
            href="/admin/intakes"
            style={{
              padding: '12px 20px',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#0A0A0A',
              background: 'transparent',
              border: '1px solid rgba(10, 10, 10, 0.2)',
              borderRadius: '2px',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Open intake queue
          </Link>
        </div>
      </div>

      <div
        style={{
          marginTop: '24px',
          fontSize: '11px',
          color: 'rgba(10, 10, 10, 0.4)',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          letterSpacing: '0.08em',
        }}
      >
        Vizionz Sankofa Operations · Built by Yakini Digital
      </div>
    </main>
  )
}
