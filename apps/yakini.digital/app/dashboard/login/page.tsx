'use client'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function DashboardLoginPage() {
  return <Suspense fallback={null}><DashboardLogin /></Suspense>
}

function DashboardLogin() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error' | 'slow'>('idle')
  const linkError = useSearchParams().get('error')

  async function send() {
    if (!email) return
    setStatus('loading')
    try {
      const res = await fetch('/api/auth/magic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, for: 'dashboard' }),
      })
      setStatus(res.ok ? 'sent' : res.status === 429 ? 'slow' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ color: '#C8A84B', fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 12 }}>Yakini Dashboard</div>
        <h1 style={{ color: '#F8F5EF', fontSize: 28, margin: '0 0 8px' }}>Admin sign-in</h1>
        <p style={{ color: '#888', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>
          Enter your admin email. If it is on the admin list, we email you a one-time sign-in link (valid 1 hour).
        </p>
        {linkError && status === 'idle' && (
          <p style={{ color: '#E07070', fontSize: 13, margin: '0 0 16px' }}>
            {linkError === 'denied' ? 'That email is not an admin.' : 'That link has expired or was already used. Request a new one.'}
          </p>
        )}
        {status === 'sent' ? (
          <div style={{ border: '1px solid rgba(200,168,75,0.3)', padding: 24, color: '#ccc', fontSize: 14, lineHeight: 1.6 }}>
            If <b>{email}</b> is an admin address, a sign-in link is on its way. Check your inbox (and spam).
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@yakini.digital"
              onKeyDown={e => { if (e.key === 'Enter') send() }}
              style={{ background: '#151515', border: '1px solid #333', color: '#F8F5EF', padding: '12px 14px', fontSize: 14, outline: 'none' }} />
            {status === 'error' && <p style={{ color: '#E07070', fontSize: 13, margin: 0 }}>Something went wrong sending the link. Try again.</p>}
            {status === 'slow' && <p style={{ color: '#E07070', fontSize: 13, margin: 0 }}>Too many requests. Wait a few minutes and try again.</p>}
            <button onClick={send} disabled={!email || status === 'loading'}
              style={{ background: '#C8A84B', color: '#0A0A0A', border: 0, padding: '14px', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer', opacity: !email || status === 'loading' ? 0.5 : 1 }}>
              {status === 'loading' ? 'Sending…' : 'Email me a sign-in link'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
