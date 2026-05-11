// VIZIONZ SANKOFA · /admin/access-pending
// Landing page for users who are signed in but not yet authorized to
// use the admin surface. Reached via redirect from requireOperator()
// and requireOperatorOrEmployee() when the session is:
//   - pending (no operator has assigned a role yet)
//   - revoked (operator removed access)
//   - missing vs_operators row (signed in via magic link without an
//     invite being pre-seeded)
//
// Clean exit path: sign-out link so the user can leave gracefully and
// the next sign-in attempt starts fresh.

import { signOut } from '../actions/auth'
import { getOperator } from '@/lib/supabase/auth'

export const dynamic = 'force-dynamic'

export default async function AccessPendingPage() {
  const user = await getOperator()

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
      {/* Tri-color rule */}
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
            color: '#0A2548',
            marginBottom: '12px',
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          }}
        >
          Access Pending
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
          Your sign-in worked. Your access is being set up.
        </h1>

        <p
          style={{
            fontSize: '15px',
            lineHeight: 1.65,
            color: 'rgba(10, 10, 10, 0.7)',
            marginBottom: '20px',
          }}
        >
          You&apos;re signed in to Vizionz Sankofa Operations
          {user?.email ? (
            <>
              {' '}
              as <strong style={{ color: '#0A0A0A' }}>{user.email}</strong>
            </>
          ) : null}
          , but an operator hasn&apos;t yet assigned your role. This usually
          means one of two things:
        </p>

        <ul
          style={{
            fontSize: '14px',
            lineHeight: 1.65,
            color: 'rgba(10, 10, 10, 0.7)',
            marginBottom: '24px',
            paddingLeft: '20px',
          }}
        >
          <li style={{ marginBottom: '8px' }}>
            You were invited recently and the operator hasn&apos;t finished
            setting up your role yet.
          </li>
          <li>
            You signed in without being invited first. In that case, an
            operator needs to add you before you can use the admin surface.
          </li>
        </ul>

        <p
          style={{
            fontSize: '14px',
            lineHeight: 1.65,
            color: 'rgba(10, 10, 10, 0.7)',
            marginBottom: '28px',
          }}
        >
          Reach out to Khadijah or another operator and let them know your
          email. Once they activate your access, sign in again and
          you&apos;ll land on your admin home.
        </p>

        <form action={signOut}>
          <button
            type="submit"
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
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Sign out
          </button>
        </form>
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
