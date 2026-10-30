'use client'

import { useState } from 'react'
import type { HomeCopy } from '@/lib/academy/home-copy'

/** UI-only interest form: nothing is saved; it opens a prefilled email to hello@yakini.digital. */
export function OrgForm({ f }: { f: HomeCopy['orgs']['form'] }) {
  const [v, setV] = useState({ org: '', name: '', email: '', type: '', people: '', language: '', message: '' })
  const [state, setState] = useState<'idle' | 'error' | 'done'>('idle')
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV((x) => ({ ...x, [k]: e.target.value }))
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!v.org.trim() || !v.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) { setState('error'); return }
    const body = [
      `${f.org}: ${v.org}`, `${f.name}: ${v.name}`, `${f.email}: ${v.email}`, `${f.type}: ${v.type}`,
      `${f.people}: ${v.people}`, `${f.language}: ${v.language}`, '', v.message,
    ].join('\n')
    const subject = `Yakini Academy: ${v.org}`.slice(0, 150)
    window.location.href = `mailto:hello@yakini.digital?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.slice(0, 1800))}`
    setState('done')
  }
  return (
    <form className="ya-card yh-form" onSubmit={submit} noValidate>
      <h3>{f.title}</h3>
      {state === 'error' && <p className="ya-alert" role="alert">{f.required}</p>}
      {state === 'done' && <p className="yh-ok" role="status">{f.done}</p>}
      <div className="ya-field"><label htmlFor="yo-org">{f.org}</label><input id="yo-org" className="ya-input" value={v.org} onChange={set('org')} autoComplete="organization" maxLength={160} /></div>
      <div className="ya-grid2">
        <div className="ya-field"><label htmlFor="yo-name">{f.name}</label><input id="yo-name" className="ya-input" value={v.name} onChange={set('name')} autoComplete="name" maxLength={120} /></div>
        <div className="ya-field"><label htmlFor="yo-email">{f.email}</label><input id="yo-email" type="email" className="ya-input" value={v.email} onChange={set('email')} autoComplete="email" maxLength={254} /></div>
      </div>
      <div className="ya-grid2">
        <div className="ya-field"><label htmlFor="yo-type">{f.type}</label>
          <select id="yo-type" className="ya-input" value={v.type} onChange={set('type')}><option value="">—</option>{f.types.map((t) => <option key={t}>{t}</option>)}</select></div>
        <div className="ya-field"><label htmlFor="yo-people">{f.people}</label><input id="yo-people" className="ya-input" inputMode="numeric" value={v.people} onChange={set('people')} maxLength={20} /></div>
      </div>
      <div className="ya-field"><label htmlFor="yo-lang">{f.language}</label><input id="yo-lang" className="ya-input" value={v.language} onChange={set('language')} maxLength={120} /></div>
      <div className="ya-field"><label htmlFor="yo-msg">{f.message}</label><textarea id="yo-msg" className="ya-input" value={v.message} onChange={set('message')} maxLength={1200} /></div>
      <button type="submit" className="ya-btn">{f.submit}</button>
      <p className="ya-consent">{f.note}</p>
    </form>
  )
}
