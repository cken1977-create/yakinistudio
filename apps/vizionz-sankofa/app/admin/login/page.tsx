// VIZIONZ SANKOFA · /admin/login
// Magic-link sign-in for organizational operators (Khadijah, future team).
// Pan-African palette discipline: white ground, navy header seal, red accent,
// black for institutional weight, green for confirmation states.

'use client'

import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'

type LoginState = 'idle' | 'sending' | 'sent' | 'error'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<LoginState>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState('sending')
    setErrorMessage('')

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    })

    if (error) {
      setState('error')
      setErrorMessage(error.message)
      return
    }

    setState('sent')
  }

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
        {/* Tri-color rule along top edge — architectural signature */}
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

        {/* Kicker */}
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
          Operator Sign-In
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: '28px',
            lineHeight: 1.2,
            fontWeight: 600,
            color: '#0A0A0A',
            marginBottom: '12px',
            fontFamily: '"DM Serif Display", Georgia, serif',
          }}
        >
          Vizionz Sankofa
        </h1>

        <p
          style={{
            fontSize: '15px',
            lineHeight: 1.6,
            color: 'rgba(10, 10, 10, 0.7)',
            marginBottom: '32px',
          }}
        >
          Sign in to manage your organization&apos;s photos, stories, and
          operational tools.
        </p>

        {state === 'sent' ? (
          <ConfirmationCard email={email} onReset={() => setState('idle')} />
        ) : (
          <form onSubmit={handleSubmit}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#0A0A0A',
                marginBottom: '8px',
              }}
            >
              Email Address
            </label>

            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={state === 'sending'}
              placeholder="you@example.org"
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: '16px',
                color: '#0A0A0A',
                background: '#FFFFFF',
                border: '1px solid rgba(10, 10, 10, 0.2)',
                borderRadius: '2px',
                marginBottom: '20px',
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />

            <button
              type="submit"
              disabled={state === 'sending' || !email.trim()}
              style={{
                width: '100%',
                padding: '14px 24px',
                fontSize: '14px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#FFFFFF',
                background: state === 'sending' ? '#0A2548' : '#0A2548',
                border: 'none',
                borderRadius: '2px',
                cursor: state === 'sending' ? 'wait' : 'pointer',
                opacity: state === 'sending' || !email.trim() ? 0.6 : 1,
                transition: 'opacity 0.15s ease',
              }}
            >
              {state === 'sending' ? 'Sending link…' : 'Send sign-in link'}
            </button>

            {state === 'error' && (
              <div
                style={{
                  marginTop: '20px',
                  padding: '12px 16px',
                  background: 'rgba(206, 17, 38, 0.08)',
                  borderLeft: '3px solid #CE1126',
                  fontSize: '14px',
                  color: '#0A0A0A',
                }}
              >
                {errorMessage || 'Something went wrong. Please try again.'}
              </div>
            )}
          </form>
        )}

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
          Access is invitation-only. If you believe you should have access and
          don&apos;t, contact the operator at hello@yakini.digital.
        </div>
      </section>
    </main>
  )
}

function ConfirmationCard({
  email,
  onReset,
}: {
  email: string
  onReset: () => void
}) {
  return (
    <div>
      <div
        style={{
          padding: '20px',
          background: 'rgba(0, 122, 51, 0.05)',
          borderLeft: '3px solid #007A33',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#007A33',
            marginBottom: '8px',
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          }}
        >
          Link Sent
        </div>
        <p
          style={{
            fontSize: '15px',
            lineHeight: 1.6,
            color: '#0A0A0A',
            margin: 0,
          }}
        >
          Check <strong>{email}</strong> for a sign-in link from Vizionz
          Sankofa. The link opens this site, signed in, in your browser.
        </p>
      </div>

      <p
        style={{
          fontSize: '13px',
          lineHeight: 1.5,
          color: 'rgba(10, 10, 10, 0.6)',
          marginBottom: '16px',
        }}
      >
        Didn&apos;t get the email? Check spam, or try a different address.
      </p>

      <button
        type="button"
        onClick={onReset}
        style={{
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: '#CE1126',
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
        }}
      >
        Use a different email →
      </button>
    </div>
  )
}
