'use client'

import { useState, useEffect } from 'react'
import { Section, Button } from '@yakini/ui'
import { createBrowserClient } from '@yakini/database'
import { config } from '@/config/brand'

type AuthState = 'loading' | 'logged-out' | 'magic-sent' | 'verifying' | 'logged-in'

export default function PortalPage() {
  const [authState, setAuthState] = useState<AuthState>('loading')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [projects, setProjects] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [tab, setTab] = useState<'projects' | 'invoices' | 'profile'>('projects')

  useEffect(() => {
    const url = new URL(window.location.href)
    const token = url.searchParams.get('token')

    if (token) {
      verifyToken(token)
    } else {
      const stored = localStorage.getItem('yk_portal_email')
      if (stored) {
        setUserEmail(stored)
        loadPortalData(stored)
      } else {
        setAuthState('logged-out')
      }
    }
  }, [])

  const requestMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email) return

    const res = await fetch('/api/auth/magic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        client_id: config.yakini.clientId,
        portal_url: `${config.seo.siteUrl}/portal`
      })
    })

    if (res.ok) {
      setAuthState('magic-sent')
    } else {
      setError('Could not send link. Try again.')
    }
  }

  const verifyToken = async (token: string) => {
    setAuthState('verifying')
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        client_id: config.yakini.clientId
      })
    })

    const data = await res.json()
    if (data.success) {
      localStorage.setItem('yk_portal_email', data.email)
      setUserEmail(data.email)
      window.history.replaceState({}, '', '/portal')
      loadPortalData(data.email)
    } else {
      setError(data.error || 'Invalid link')
      setAuthState('logged-out')
    }
  }

  const loadPortalData = async (email: string) => {
    const supabase = createBrowserClient()

    const { data: projectsData } = await supabase
      .from('projects')
      .select('*')
      .eq('client_id', config.yakini.clientId)
      .order('created_at', { ascending: false })

    const { data: invoicesData } = await supabase
      .from('invoices')
      .select('*')
      .eq('client_id', config.yakini.clientId)
      .order('created_at', { ascending: false })

    setProjects(projectsData || [])
    setInvoices(invoicesData || [])
    setAuthState('logged-in')
  }

  const logout = () => {
    localStorage.removeItem('yk_portal_email')
    setUserEmail('')
    setAuthState('logged-out')
  }

  if (authState === 'loading' || authState === 'verifying') {
    return (
      <Section padding="xl">
        <div style={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: 40, height: 40,
            border: '2px solid var(--brand-border)',
            borderTopColor: 'var(--brand-primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </Section>
    )
  }

  if (authState === 'logged-out') {
    return (
      <Section padding="xl">
        <div style={{ paddingTop: 80, maxWidth: 480, margin: '0 auto' }}>
          <div style={{
            fontSize: 11, fontWeight: 600,
            letterSpacing: '0.3em', textTransform: 'uppercase',
            color: 'var(--brand-primary)', marginBottom: 24
          }}>
            Client Portal
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 48, fontWeight: 500,
            lineHeight: 1.1, marginBottom: 16
          }}>
            Welcome back.
          </h1>
          <p style={{
            fontSize: 16, color: 'var(--brand-muted)',
            lineHeight: 1.7, marginBottom: 40
          }}>
            Enter your email and we'll send you a secure sign-in link.
          </p>

          <form onSubmit={requestMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{
                fontSize: 11, fontWeight: 600,
                letterSpacing: '0.15em', textTransform: 'uppercase',
                color: 'var(--brand-muted)'
              }}>
                Email
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--brand-border)',
                  padding: '12px 0',
                  fontSize: 16,
                  color: 'var(--brand-text)',
                  outline: 'none'
                }}
              />
            </div>
            {error && <div style={{ color: '#C8161D', fontSize: 14 }}>{error}</div>}
            <Button type="submit" variant="primary">Send Sign-In Link</Button>
          </form>
        </div>
      </Section>
    )
  }

  if (authState === 'magic-sent') {
    return (
      <Section padding="xl">
        <div style={{ paddingTop: 80, maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64,
            background: 'rgba(42,122,58,0.1)',
            border: '2px solid #2A7A3A',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 28, color: '#2A7A3A',
            marginBottom: 24
          }}>
            ✓
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 36, fontWeight: 500, marginBottom: 16
          }}>
            Check your email.
          </h1>
          <p style={{ fontSize: 16, color: 'var(--brand-muted)', lineHeight: 1.7 }}>
            We sent a sign-in link to <strong style={{ color: 'var(--brand-text)' }}>{email}</strong>.
            Click the link to access your portal.
          </p>
          <p style={{ fontSize: 13, color: 'var(--brand-muted)', marginTop: 24 }}>
            The link expires in 30 minutes.
          </p>
        </div>
      </Section>
    )
  }

  return (
    <Section padding="xl">
      <div style={{ paddingTop: 80 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          paddingBottom: 32, borderBottom: '1px solid var(--brand-border)',
          marginBottom: 48, flexWrap: 'wrap', gap: 16
        }}>
          <div>
            <div style={{
              fontSize: 11, fontWeight: 600,
              letterSpacing: '0.3em', textTransform: 'uppercase',
              color: 'var(--brand-primary)', marginBottom: 12
            }}>
              Client Portal
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(32px, 5vw, 48px)',
              fontWeight: 500, lineHeight: 1.1
            }}>
              {config.portal.welcomeMessage}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--brand-muted)' }}>
              Signed in as {userEmail}
            </div>
            <button
              onClick={logout}
              style={{
                background: 'transparent',
                border: '1px solid var(--brand-border)',
                color: 'var(--brand-muted)',
                fontSize: 12, fontWeight: 500,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '8px 16px', borderRadius: 2,
                cursor: 'pointer'
              }}
            >
              Sign Out
            </button>
          </div>
        </div>

        <div style={{
          display: 'flex', gap: 24,
          borderBottom: '1px solid var(--brand-border)',
          marginBottom: 32
        }}>
          {(['projects', 'invoices', 'profile'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '12px 0',
                fontSize: 14, fontWeight: 600,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: tab === t ? 'var(--brand-primary)' : 'var(--brand-muted)',
                borderBottom: tab === t ? '2px solid var(--brand-primary)' : 'none',
                cursor: 'pointer', marginBottom: -1
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'projects' && (
          <div>
            {projects.length === 0 ? (
              <p style={{ fontSize: 18, color: 'var(--brand-muted)', textAlign: 'center', padding: 60 }}>
                No active projects yet.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                {projects.map(p => (
                  <div key={p.id} style={{ padding: 24, background: 'var(--brand-bg)', border: '1px solid var(--brand-border)' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 12 }}>{p.title}</h3>
                    <p style={{ fontSize: 14, color: 'var(--brand-muted)', marginBottom: 16 }}>{p.description}</p>
                    <div style={{ width: '100%', height: 4, background: 'var(--brand-border)', borderRadius: 2 }}>
                      <div style={{ width: `${p.progress}%`, height: '100%', background: 'var(--brand-primary)' }} />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--brand-muted)', marginTop: 8 }}>{p.progress}% complete</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'invoices' && (
          <div>
            {invoices.length === 0 ? (
              <p style={{ fontSize: 18, color: 'var(--brand-muted)', textAlign: 'center', padding: 60 }}>
                No invoices yet.
              </p>
            ) : (
              <div style={{ background: 'var(--brand-bg)', border: '1px solid var(--brand-border)' }}>
                {invoices.map(inv => (
                  <div key={inv.id} style={{ padding: 20, borderBottom: '1px solid var(--brand-border)', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontFamily: 'monospace', fontSize: 13 }}>{inv.invoice_number}</div>
                      <div style={{ fontSize: 14, color: 'var(--brand-muted)' }}>{inv.description}</div>
                    </div>
                    <div style={{ fontWeight: 600 }}>${inv.amount}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'profile' && (
          <div style={{ maxWidth: 600 }}>
            <div style={{ padding: 32, background: 'var(--brand-bg)', border: '1px solid var(--brand-border)' }}>
              <div style={{ fontSize: 11, color: 'var(--brand-muted)', marginBottom: 4 }}>Email</div>
              <div style={{ fontSize: 16, marginBottom: 16 }}>{userEmail}</div>
              <div style={{ fontSize: 11, color: 'var(--brand-muted)', marginBottom: 4 }}>Working with</div>
              <div style={{ fontSize: 16 }}>{config.business.dba || config.business.name}</div>
            </div>
          </div>
        )}
      </div>
    </Section>
  )
        }
