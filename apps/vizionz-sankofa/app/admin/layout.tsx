// VIZIONZ SANKOFA · /admin layout
// Shared shell for all admin surfaces. Enforces operator authentication
// (redirects to /admin/login if no session). The login page itself
// short-circuits the auth check via the children-only render at the
// bottom of this layout when no session exists AND we're on /admin/login.

import { headers } from 'next/headers'
import Link from 'next/link'
import {
  requireOperatorOrEmployee,
  getOperatorDisplayName,
} from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import { signOut } from './actions/auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Read the current path from the middleware-injected header.
  // Falls back to safe defaults if header isn't set.
  const headerList = await headers()
  const pathname = headerList.get('x-pathname') ?? ''
  // Wave 2.5 hotfix: gate pages and login render bare. Without this,
  // a redirect FROM requireOperatorOrEmployee TO /admin/access-pending
  // would re-enter the layout, re-fire the same redirect, loop forever.
  const bareRenderPaths = [
    '/admin/login',
    '/admin/access-pending',
    '/admin/access-denied',
  ]
  const isLoginPath = bareRenderPaths.some((p) => pathname.startsWith(p))

  // Login + gate pages render bare — no chrome, no auth gate.
  // This prevents the redirect loop (login -> auth check -> redirect to login).
  if (isLoginPath) {
    return <>{children}</>
  }

  // Every other /admin/* route requires a verified operator OR employee
  // session. requireOperatorOrEmployee handles all redirect cases:
  //   - unauthenticated → /admin/login
  //   - signed in but pending/revoked/no row → /admin/access-pending
  //   - operator OR employee → returns AuthenticatedOperator
  const user = await requireOperatorOrEmployee()

  // Wave 2.5: Display name derived via canonical helper. See
  // getOperatorDisplayName in lib/supabase/auth.ts.
  const displayName = getOperatorDisplayName(user)

  // Wave 2.5: Role badge in topbar — visible signal of access level
  const isOperator = user.role === 'operator'
  const roleBadgeLabel = isOperator ? 'Operator' : 'Employee'
  const roleBadgeColor = isOperator ? '#0A2548' : '#CE1126'

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAFAF8',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Tri-color rule — architectural signature, anchors the operator surface */}
      <div
        style={{
          height: '3px',
          background:
            'linear-gradient(90deg, #CE1126 0%, #CE1126 33.33%, #0A0A0A 33.33%, #0A0A0A 66.66%, #007A33 66.66%, #007A33 100%)',
        }}
      />

      {/* Operator header */}
      <header
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid rgba(10, 10, 10, 0.08)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <Link
          href="/admin"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            color: '#0A0A0A',
          }}
        >
          {/* Navy circular seal with italic V — matches public site Header */}
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#0A2548',
              border: '2px solid #CE1126',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: '18px',
              fontStyle: 'italic',
              fontWeight: 600,
            }}
          >
            V
          </div>
          <div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#0A0A0A',
                fontFamily: '"DM Serif Display", Georgia, serif',
              }}
            >
              Vizionz Sankofa
            </div>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#CE1126',
                fontFamily:
                  'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
                marginTop: '2px',
              }}
            >
              Operations
            </div>
          </div>
        </Link>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              display: 'none',
              alignItems: 'center',
              gap: '10px',
            }}
            className="vs-admin-email-desktop"
          >
            <span
              style={{
                fontSize: '13px',
                color: 'rgba(10, 10, 10, 0.75)',
                fontWeight: 500,
              }}
            >
              {displayName}
            </span>
            <span
              style={{
                display: 'inline-block',
                padding: '3px 9px',
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#FFFFFF',
                background: roleBadgeColor,
                borderRadius: '2px',
                fontFamily:
                  'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
              }}
            >
              {roleBadgeLabel}
            </span>
          </div>

          <form action={signOut}>
            <button
              type="submit"
              style={{
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#0A0A0A',
                background: 'transparent',
                border: '1px solid rgba(10, 10, 10, 0.2)',
                borderRadius: '2px',
                padding: '8px 16px',
                cursor: 'pointer',
              }}
            >
              Sign Out
            </button>
          </form>
        </div>
      </header>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          padding: '32px 24px',
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
        }}
      >
        {children}
      </main>

      {/* Footer — discipline attribution */}
      <footer
        style={{
          padding: '24px',
          borderTop: '1px solid rgba(10, 10, 10, 0.08)',
          background: '#FFFFFF',
          textAlign: 'center',
          fontSize: '11px',
          letterSpacing: '0.06em',
          color: 'rgba(10, 10, 10, 0.5)',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        }}
      >
        Vizionz Sankofa Operations · Built by Yakini Digital
      </footer>
    </div>
  )
}
