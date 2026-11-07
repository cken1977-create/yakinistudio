'use client'

import { useState } from 'react'
import { savedMessage, type WebsiteSaveResult } from '@/lib/contact/public-message'

type Status = 'idle' | 'saving' | 'saved' | 'error'

export function PublicContactForm({ services, directEmail }: { services: string[]; directEmail: string }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', service: '', message: '', consent: false })
  const [status, setStatus] = useState<Status>('idle')
  const [notice, setNotice] = useState('')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (status === 'saving') return
    setStatus('saving')
    setNotice('Saving your message…')
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          service: form.service,
          message: form.message,
          consent_given: form.consent,
        }),
      })
      const body = await res.json().catch(() => null) as WebsiteSaveResult | null
      if (!res.ok || !body?.ok || !body.saved || body.emailSent) {
        setStatus('error')
        setNotice(body && 'error' in body && body.error ? body.error : 'We could not save this. Nothing was sent.')
        return
      }
      setStatus('saved')
      setNotice(savedMessage(body, 'contact'))
      setForm({ name: '', email: '', phone: '', service: '', message: '', consent: false })
    } catch {
      setStatus('error')
      setNotice(`We could not save this. Nothing was sent. You can email ${directEmail}.`)
    }
  }

  if (status === 'saved') {
    return <p role="status" style={{ fontSize: 16, lineHeight: 1.7 }}>{notice}</p>
  }

  return (
    <form onSubmit={submit} className="vs-contact-form">
      <style>{`
        .vs-contact-form { display: flex; flex-direction: column; gap: 20px; max-width: 560px; }
        .vs-contact-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .vs-contact-field { display: flex; flex-direction: column; gap: 8px; }
        .vs-contact-field label, .vs-contact-consent { font-size: 11px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: var(--brand-muted); }
        .vs-contact-field input, .vs-contact-field textarea, .vs-contact-field select {
          background: transparent; border: none; border-bottom: 1px solid var(--brand-border);
          padding: 12px 0; font-size: 16px; color: var(--brand-text); font-family: var(--font-body); outline: none;
        }
        .vs-contact-field textarea { min-height: 120px; resize: vertical; }
        .vs-contact-consent { display: flex; gap: 10px; align-items: flex-start; letter-spacing: 0; text-transform: none; font-size: 15px; font-weight: 500; line-height: 1.5; }
        .vs-contact-status { font-size: 15px; line-height: 1.5; }
        .vs-contact-status.error { color: #C8161D; }
        .vs-contact-submit { background: var(--brand-primary); color: white; border: 0; padding: 14px 22px; font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; cursor: pointer; }
        .vs-contact-submit:disabled { opacity: 0.6; cursor: wait; }
        @media (max-width: 640px) { .vs-contact-row { grid-template-columns: 1fr; } }
      `}</style>
      <div className="vs-contact-row">
        <div className="vs-contact-field">
          <label htmlFor="contact-name">Name</label>
          <input id="contact-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="vs-contact-field">
          <label htmlFor="contact-email">Email</label>
          <input id="contact-email" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
      </div>
      <div className="vs-contact-row">
        <div className="vs-contact-field">
          <label htmlFor="contact-phone">Phone (optional)</label>
          <input id="contact-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="vs-contact-field">
          <label htmlFor="contact-service">What do you need?</label>
          <select id="contact-service" value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}>
            <option value="">Select...</option>
            {services.map((title) => <option key={title} value={title}>{title}</option>)}
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <div className="vs-contact-field">
        <label htmlFor="contact-message">How can we help?</label>
        <textarea id="contact-message" required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
      </div>
      <label className="vs-contact-consent">
        <input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
        <span>Vizionz Sankofa may keep this message and contact me about it. This form does not send an email by itself.</span>
      </label>
      {notice && status !== 'saving' && <p role="alert" className="vs-contact-status error">{notice}</p>}
      {status === 'saving' && <p role="status" className="vs-contact-status">{notice}</p>}
      <button type="submit" className="vs-contact-submit" disabled={status === 'saving' || !form.consent}>
        {status === 'saving' ? 'Saving…' : 'Send message'}
      </button>
    </form>
  )
}
