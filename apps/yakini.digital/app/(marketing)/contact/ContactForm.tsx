'use client'

import { useState } from 'react'

// Short note form. Posts to the existing /api/leads route (saves the lead, emails the Yakini
// inbox and sends the sender a "we got it" note). Same backend, nothing new on the server.
const TOPICS = ['The Yakini portal', 'Plans and pricing', 'A custom build', 'The free class', 'Something else'] as const

export function ContactForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [err, setErr] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setState('sending'); setErr('')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: f.get('name'), email: f.get('email'), company: f.get('company') || null,
          service: f.get('service'), message: f.get('message'),
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(res.status === 429 ? 'Too many notes from here. Please call or email us instead.' : j.error || 'Something went wrong.')
      }
      setState('sent')
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'Something went wrong.')
      setState('error')
    }
  }

  if (state === 'sent') {
    return (
      <div className="ct-sent" role="status">
        <h3>Got it. Thank you.</h3>
        <p>A real person at Yakini reads every note and gets back to you within one business day. Check your inbox for a confirmation.</p>
      </div>
    )
  }

  return (
    <form className="ct-form" onSubmit={onSubmit}>
      <div className="ct-row">
        <label>Your name<input name="name" required maxLength={120} autoComplete="name" /></label>
        <label>Email<input name="email" type="email" required maxLength={254} autoComplete="email" /></label>
      </div>
      <label><span>Business name <i>(optional)</i></span><input name="company" maxLength={160} autoComplete="organization" /></label>
      <label>What is it about?
        <select name="service" required defaultValue="">
          <option value="" disabled>Pick one</option>
          {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>
      <label>Your note<textarea name="message" required maxLength={5000} rows={5} placeholder="Tell us a little about the business and what you need." /></label>
      {state === 'error' && <p className="ct-err" role="alert">{err}</p>}
      <button type="submit" className="hm-btn hm-btn-gold" disabled={state === 'sending'}>
        <span>{state === 'sending' ? 'Sending…' : 'Send the note'}</span><span className="yk-btn-arrow">→</span>
      </button>
    </form>
  )
}
