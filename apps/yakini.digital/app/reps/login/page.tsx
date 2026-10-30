'use client'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function RepLoginPage() {
  return <Suspense fallback={null}><RepLogin /></Suspense>
}

function RepLogin() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error' | 'slow'>('idle')
  const params = useSearchParams()
  const linkError = params.get('error')
  const signedOut = params.get('signedout') === '1'

  async function send(e?: React.FormEvent) {
    e?.preventDefault()
    if (!email) return
    setStatus('loading')
    try {
      const res = await fetch('/api/auth/magic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, for: 'reps' }),
      })
      setStatus(res.ok ? 'sent' : res.status === 429 ? 'slow' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="rp-login">
      <div className="rp-login-box">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/yakini-lockup.jpg" alt="Yakini" width={784} height={1168} />
        <div className="rp-eyebrow">Demo Library</div>
        <h1 className="rp-login-h1">Rep sign-in</h1>
        <p>Enter the email Yakini has on file for you. We&rsquo;ll email you a one-time sign-in link (good for 1 hour).</p>
        {signedOut && status === 'idle' && <p className="rp-err" style={{ color: 'var(--gold)' }}>You&rsquo;re signed out.</p>}
        {linkError && status === 'idle' && (
          <p className="rp-err">
            {linkError === 'denied' ? 'That email is not on the rep list. Ask Clarence to add you.' : 'That link has expired or was already used. Request a new one.'}
          </p>
        )}
        {status === 'sent' ? (
          <div className="rp-note">
            If <b>{email}</b> is on the rep list, a sign-in link is on its way. Check your inbox (and spam).
          </div>
        ) : (
          <form onSubmit={send}>
            <input className="rp-input" type="email" required autoComplete="email" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="you@example.com" aria-label="Your email" />
            {status === 'error' && <p className="rp-err">Something went wrong sending the link. Try again.</p>}
            {status === 'slow' && <p className="rp-err">Too many requests. Wait a few minutes and try again.</p>}
            <button type="submit" className="rp-submit" disabled={!email || status === 'loading'}>
              {status === 'loading' ? 'Sending…' : 'Email me a sign-in link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
