'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Lang } from '@/lib/academy/config'
import { PATHS } from '@/lib/academy/config'
import { EMAIL_CONSENT, PAGE, SMS_CONSENT } from '@/lib/academy/copy'
import { COUNTRY_CODES } from '@/lib/academy/countries'

type State = 'idle' | 'sending' | 'done'
type Done = { name: string; ready: boolean; emailed: boolean; watchUrl: string | null }

export function SignupForm({ lang, defaultCountry }: { lang: Lang; defaultCountry: string | null }) {
  const c = PAGE[lang]
  const [state, setState] = useState<State>('idle')
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState(defaultCountry ?? '')
  const [countryTouched, setCountryTouched] = useState(false)
  const [sms, setSms] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [alert, setAlert] = useState('')
  const [done, setDone] = useState<Done | null>(null)
  const loadedAt = useRef(0)
  const hp = useRef<HTMLInputElement>(null)

  useEffect(() => { loadedAt.current = Date.now() }, [])

  const countries = useMemo(() => {
    let names: Intl.DisplayNames | null = null
    try { names = new Intl.DisplayNames([lang], { type: 'region' }) } catch { names = null }
    return COUNTRY_CODES.map((code) => ({ code, name: names?.of(code) ?? code }))
      .sort((a, b) => a.name.localeCompare(b.name, lang))
  }, [lang])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!firstName.trim()) errs.firstName = c.errors.name
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) errs.email = c.errors.email
    setErrors(errs)
    setAlert('')
    if (Object.keys(errs).length) return
    setState('sending')
    const q = new URLSearchParams(window.location.search)
    let tz: string | null = null
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone } catch { tz = null }
    try {
      const res = await fetch('/api/class/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lang, firstName, email, phone: phone.trim() || null, country: country || null, countryTouched,
          smsConsent: !!phone.trim() && sms, timezone: tz, loadedAt: loadedAt.current,
          website: hp.current?.value ?? '',
          s: q.get('s'), utm_source: q.get('utm_source'), utm_medium: q.get('utm_medium'), utm_campaign: q.get('utm_campaign'),
          utm_content: q.get('utm_content'), utm_term: q.get('utm_term'), referrer: document.referrer || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        setDone({ name: firstName.trim(), ready: !!data.ready, emailed: data.emailed !== false, watchUrl: data.watchUrl ?? null })
        setState('done')
        return
      }
      if (res.status === 400 && data.fields) {
        const f: Record<string, string> = {}
        if (data.fields.firstName) f.firstName = c.errors.name
        if (data.fields.email) f.email = c.errors.email
        if (data.fields.phone) f.phone = c.errors.phone
        setErrors(f)
      } else if (res.status === 429) setAlert(c.errors.slow)
      else if (res.status === 503) setAlert(c.errors.notOpen)
      else setAlert(c.errors.generic)
    } catch {
      setAlert(c.errors.generic)
    }
    setState('idle')
  }

  if (state === 'done' && done) {
    return (
      <div className="ya-card ya-thanks" role="status" aria-live="polite">
        <h2>{c.thanksTitle(done.name)}</h2>
        <p>{!done.emailed && done.watchUrl ? c.thanksBodyNoEmail : done.ready ? c.thanksBodyReady : c.thanksBodyPending}</p>
        {done.watchUrl && <a className="ya-btn" href={done.watchUrl}>{done.ready ? c.watchCta : c.myPageCta}</a>}
      </div>
    )
  }

  const privacy = PATHS[lang].privacy
  return (
    <form className="ya-card ya-form" id="signup" onSubmit={submit} noValidate>
      <h2>{c.formHeading}</h2>
      <p className="ya-form-sub">{c.formSub}</p>
      {alert && <p className="ya-alert" role="alert">{alert}</p>}

      <div className="ya-hp" aria-hidden="true">
        <label>Website<input ref={hp} type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <div className="ya-grid2">
        <div className="ya-field">
          <label htmlFor="ya-name">{c.fields.name}</label>
          <input id="ya-name" className="ya-input" name="given-name" autoComplete="given-name" maxLength={60} required
            value={firstName} onChange={(e) => setFirstName(e.target.value)} aria-invalid={!!errors.firstName}
            aria-describedby={errors.firstName ? 'ya-name-err' : undefined} />
          {errors.firstName && <span id="ya-name-err" className="ya-err">{errors.firstName}</span>}
        </div>
        <div className="ya-field">
          <label htmlFor="ya-email">{c.fields.email}</label>
          <input id="ya-email" className="ya-input" type="email" name="email" autoComplete="email" inputMode="email" maxLength={254} required
            value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'ya-email-err' : undefined} />
          {errors.email && <span id="ya-email-err" className="ya-err">{errors.email}</span>}
        </div>
      </div>

      <div className="ya-grid2">
        <div className="ya-field">
          <label htmlFor="ya-phone">{c.fields.phone} <span className="ya-opt">({c.fields.optional})</span></label>
          <input id="ya-phone" className="ya-input" type="tel" name="tel" autoComplete="tel" inputMode="tel" maxLength={40}
            value={phone} onChange={(e) => { setPhone(e.target.value); if (!e.target.value.trim()) setSms(false) }}
            aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'ya-phone-err' : 'ya-phone-hint'} />
          {errors.phone ? <span id="ya-phone-err" className="ya-err">{errors.phone}</span> : <span id="ya-phone-hint" className="ya-hint">{c.fields.phoneHint}</span>}
        </div>
        <div className="ya-field">
          <label htmlFor="ya-country">{c.fields.country}</label>
          <select id="ya-country" className="ya-input" name="country" autoComplete="country"
            value={country} onChange={(e) => { setCountry(e.target.value); setCountryTouched(true) }}>
            <option value="">—</option>
            {countries.map((x) => <option key={x.code} value={x.code} suppressHydrationWarning>{x.name}</option>)}
          </select>
        </div>
      </div>

      {phone.trim() && (
        <label className="ya-check">
          <input type="checkbox" checked={sms} onChange={(e) => setSms(e.target.checked)} />
          <span>{SMS_CONSENT[lang]} <a href={privacy} target="_blank" rel="noopener">{c.privacy}</a>.</span>
        </label>
      )}

      <button className="ya-btn" type="submit" disabled={state === 'sending'}>{state === 'sending' ? c.sending : c.button}</button>
      <p className="ya-consent">{EMAIL_CONSENT[lang]} <a href={privacy} target="_blank" rel="noopener">{c.privacy}</a>.</p>
    </form>
  )
}
