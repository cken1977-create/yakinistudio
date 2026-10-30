'use client'

import { useEffect, useMemo, useState } from 'react'
import { BUDGETS, EMAIL_CONSENT_TEXT, EMAIL_CONSENT_TEXT_ES, EVENT_TYPES, MIN_GUESTS, MAX_GUESTS, REPLY_PROMISE, REPLY_PROMISE_ES } from '@/config/funnel'
import { PHONE_DISPLAY, PHONE_TEL } from '@/config/site'

type Status = 'idle' | 'sending' | 'done' | 'error'

const label: React.CSSProperties = { display: 'grid', gap: 6, fontSize: 15, fontWeight: 600 }
const sub: React.CSSProperties = { fontWeight: 400, fontStyle: 'italic', color: 'var(--brand-muted)', fontSize: 13 }
const input: React.CSSProperties = {
  minHeight: 50, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--brand-border)', background: '#0b0b0b',
  color: '#fff', fontSize: 16, width: '100%', boxSizing: 'border-box', colorScheme: 'dark',
}

export function QuoteForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [startedAt, setStartedAt] = useState(0)
  const [source, setSource] = useState('')
  const [lang, setLang] = useState<'en' | 'es'>('en')
  const [f, setF] = useState({ event_date: '', headcount: '', event_type: 'office', budget: '', full_name: '', email: '', phone: '', notes: '', email_consent: false, company_website: '' })

  useEffect(() => {
    setStartedAt(Date.now())
    const q = new URLSearchParams(window.location.search)
    setSource(q.get('src') ?? '')
    const t = q.get('type')
    if (t && EVENT_TYPES.some((x) => x.id === t)) setF((s) => ({ ...s, event_type: t }))
    if (q.get('lang') === 'es' || navigator.language?.toLowerCase().startsWith('es')) setLang('es')
  }, [])

  const minDate = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setStatus('sending')
    try {
      const r = await fetch('/api/catering/quote', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, headcount: Number(f.headcount), source, lang, started_at: startedAt }),
      })
      const j = (await r.json().catch(() => null)) as { ok?: boolean; error?: string } | null
      if (!r.ok || !j?.ok) { setError(j?.error ?? 'Something went wrong. Please call or text us.'); setStatus('error'); return }
      setStatus('done')
    } catch {
      setError('Could not send. Please check your connection, or call or text us.')
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div role="status" style={{ border: '1px solid var(--brand-primary)', borderRadius: 18, padding: '28px 22px', background: 'rgba(179,18,27,.12)', maxWidth: 640 }}>
        <h3 style={{ fontSize: 30, margin: '0 0 10px' }}>Got it, thank you!</h3>
        <p style={{ color: '#ddd', lineHeight: 1.6, margin: '0 0 6px' }}>
          Nicole will reach out {REPLY_PROMISE} with your quote. We just emailed you a confirmation.
        </p>
        <p className="ms-es" style={{ margin: '0 0 18px' }}>¡Gracias! Nicole te contactará {REPLY_PROMISE_ES} con tu cotización.</p>
        <a href={PHONE_TEL} className="ms-btn ms-btn-red">Can&rsquo;t wait? Call {PHONE_DISPLAY}</a>
      </div>
    )
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 18, maxWidth: 640 }} noValidate={false}>
      <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <label style={label}>
          <span>Event date <span style={sub}>· Fecha</span></span>
          <input type="date" required min={minDate} value={f.event_date} onChange={set('event_date')} style={input} name="event_date" />
        </label>
        <label style={label}>
          <span>Headcount <span style={sub}>· Invitados (min. {MIN_GUESTS})</span></span>
          <input type="number" inputMode="numeric" required min={MIN_GUESTS} max={MAX_GUESTS} placeholder={`${MIN_GUESTS}+`} value={f.headcount} onChange={set('headcount')} style={input} name="headcount" />
        </label>
        <label style={label}>
          <span>Type of event <span style={sub}>· Tipo de evento</span></span>
          <select required value={f.event_type} onChange={set('event_type')} style={input} name="event_type">
            {EVENT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.en} · {t.es}</option>)}
          </select>
        </label>
        <label style={label}>
          <span>Budget <span style={sub}>· Presupuesto (optional)</span></span>
          <select value={f.budget} onChange={set('budget')} style={input} name="budget">
            {BUDGETS.map((b) => <option key={b.id || 'none'} value={b.id}>{b.en}</option>)}
          </select>
        </label>
        <label style={label}>
          <span>Your name <span style={sub}>· Nombre</span></span>
          <input required autoComplete="name" value={f.full_name} onChange={set('full_name')} style={input} name="full_name" maxLength={120} />
        </label>
        <label style={label}>
          <span>Email <span style={sub}>· Correo (for your quote)</span></span>
          <input type="email" required autoComplete="email" value={f.email} onChange={set('email')} style={input} name="email" maxLength={254} />
        </label>
        <label style={label}>
          <span>Mobile <span style={sub}>· Celular (optional)</span></span>
          <input type="tel" autoComplete="tel" inputMode="tel" value={f.phone} onChange={set('phone')} style={input} name="phone" maxLength={40} placeholder="325-555-0123" />
        </label>
      </div>
      <label style={label}>
        <span>Anything else? <span style={sub}>· Location, dietary needs, &ldquo;I want the grazing table&rdquo;</span></span>
        <textarea rows={3} value={f.notes} onChange={set('notes')} style={{ ...input, minHeight: 96, resize: 'vertical' }} name="notes" maxLength={2000} />
      </label>
      {/* Honeypot: hidden from people, bots fill it. */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
        <label>Company website<input tabIndex={-1} autoComplete="off" value={f.company_website} onChange={set('company_website')} name="company_website" /></label>
      </div>
      <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.5, color: '#ddd', cursor: 'pointer' }}>
        <input type="checkbox" checked={f.email_consent} onChange={set('email_consent')} name="email_consent" style={{ width: 22, height: 22, marginTop: 2, accentColor: '#b3121b', flex: '0 0 auto' }} />
        <span>
          {EMAIL_CONSENT_TEXT} <span className="ms-es">{EMAIL_CONSENT_TEXT_ES}</span>
          <br /><span style={{ fontSize: 12, color: 'var(--brand-muted)' }}>Optional. We&rsquo;ll still email your confirmation and your quote either way.</span>
        </span>
      </label>
      {error && <p role="alert" style={{ color: '#ff8a8a', margin: 0 }}>{error}</p>}
      <button type="submit" className="ms-btn ms-btn-red" disabled={status === 'sending'} style={{ justifySelf: 'start', minWidth: 240, cursor: 'pointer', opacity: status === 'sending' ? 0.7 : 1 }}>
        {status === 'sending' ? 'Sending…' : 'Get my quote · Cotizar'}
      </button>
      <p style={{ fontSize: 12, color: 'var(--brand-muted)', margin: 0 }}>
        Takes about a minute. We never sell your info. No texts are sent from this form.
      </p>
    </form>
  )
}
