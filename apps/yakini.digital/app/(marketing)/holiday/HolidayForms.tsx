'use client'

import { useRef, useState, useSyncExternalStore } from 'react'
import { ShareInvite } from './ShareInvite'
import { LIMITS, validateHoliday, type HolidayInput, type HolidayType } from '@/lib/holiday'

// Two forms, one page: "Apply for your business" and "Nominate someone".
// Works without JavaScript too: both forms post to /api/holiday, which sends the visitor
// back to /holiday?sent=… With JavaScript on, they become tabs and post with fetch.

type Status = 'idle' | 'sending' | 'sent' | 'error'
type Errors = Partial<Record<keyof HolidayInput, string>>

const UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const

const noop = () => () => {}

const NO_JS_ERRORS: Record<string, string> = {
  missing: 'A required field was empty or didn’t look right. Please check the form and send it again.',
  failed: 'We couldn’t save that just now. Please try again in a minute, or email hello@yakini.digital.',
  closed: 'Entries for the Holiday Giveaway are closed.',
}

export function HolidayForms({ initialTab, sent, errorCode, closed }: {
  initialTab: HolidayType
  sent: HolidayType | null
  errorCode: string | null
  closed: boolean
}) {
  const [tab, setTab] = useState<HolidayType>(initialTab)
  // false on the server and the first paint, true once the script is running.
  const enhanced = useSyncExternalStore(noop, () => true, () => false)

  if (closed) {
    return (
      <div className="hg-card hg-done" role="status">
        <h3>Entries are closed.</h3>
        <p>Thank you to everyone who applied and nominated. We’re reading every story now.</p>
      </div>
    )
  }

  return (
    <div className="hg-forms">
      <div className="hg-tabs" role={enhanced ? 'tablist' : undefined} aria-label="Choose a form">
        {(['apply', 'nominate'] as const).map((t) => (
          <a
            key={t}
            href={`#${t}`}
            id={`tab-${t}`}
            role={enhanced ? 'tab' : undefined}
            aria-selected={enhanced ? tab === t : undefined}
            aria-controls={`panel-${t}`}
            className={`hg-tab ${!enhanced || tab === t ? 'on' : ''}`}
            onClick={(e) => { if (enhanced) { e.preventDefault(); setTab(t) } }}
          >
            {t === 'apply' ? 'Apply for your business' : 'Nominate someone'}
          </a>
        ))}
      </div>
      {(['apply', 'nominate'] as const).map((t) => (
        <section
          key={t}
          id={t}
          className="hg-panel"
          role={enhanced ? 'tabpanel' : undefined}
          aria-labelledby={`tab-${t}`}
          hidden={enhanced && tab !== t}
        >
          <HolidayForm type={t} enhanced={enhanced} sentNoJs={sent === t} errorNoJs={initialTab === t ? errorCode : null} />
        </section>
      ))}
    </div>
  )
}

const EMPTY = (type: HolidayType): HolidayInput => ({
  type, name: '', business_name: '', email: '', phone: '', location: '', what_they_do: '', why_help: '',
  nominator_name: '', nominator_email: '', nominator_phone: '',
})

function HolidayForm({ type, enhanced, sentNoJs, errorNoJs }: { type: HolidayType; enhanced: boolean; sentNoJs: boolean; errorNoJs: string | null }) {
  const nom = type === 'nominate'
  const [v, setV] = useState<HolidayInput>(EMPTY(type))
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<Status>(sentNoJs ? 'sent' : errorNoJs ? 'error' : 'idle')
  const [msg, setMsg] = useState(errorNoJs ? NO_JS_ERRORS[errorNoJs] ?? NO_JS_ERRORS.failed : '')
  const formRef = useRef<HTMLFormElement>(null)
  const id = (k: string) => `${type}-${k}`

  const set = (k: keyof HolidayInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setV((cur) => ({ ...cur, [k]: e.target.value }))
    if (errors[k]) setErrors((cur) => ({ ...cur, [k]: undefined }))
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const found = validateHoliday(v)
    setErrors(found)
    if (Object.keys(found).length) {
      setStatus('error')
      setMsg('Please fill in the highlighted fields.')
      const first = Object.keys(found)[0]
      requestAnimationFrame(() => document.getElementById(id(first))?.focus())
      return
    }
    const fd = new FormData(e.currentTarget)
    const params = new URLSearchParams(window.location.search)
    setStatus('sending'); setMsg('')
    try {
      const res = await fetch('/api/holiday', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...v,
          website: fd.get('website') || '',
          ...Object.fromEntries(UTM.map((k) => [k, params.get(k) || ''])),
          referrer: document.referrer || '',
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({} as { error?: string; fields?: Errors }))
        if (j.fields) setErrors(j.fields)
        throw new Error(
          res.status === 429 ? 'Too many tries from here. Please wait a few minutes, or email hello@yakini.digital.'
          : j.error === 'closed' ? NO_JS_ERRORS.closed
          : j.error || NO_JS_ERRORS.failed,
        )
      }
      setStatus('sent')
      formRef.current?.closest('.hg-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch (x) {
      setStatus('error')
      setMsg(x instanceof Error ? x.message : NO_JS_ERRORS.failed)
    }
  }

  if (status === 'sent') {
    return (
      <div className="hg-card hg-done" role="status">
        <div className="hg-done-mark" aria-hidden="true">✓</div>
        <h3>{nom ? 'Thank you for nominating them.' : 'Thank you. We got your application.'}</h3>
        <p>
          A real person reads every entry. Entries close December 15, 2026, and then BRSA Foundation and Yakini Digital
          choose five. We can’t pick everyone, but if {nom ? 'they are' : 'you are'} chosen, we’ll reach out by email or phone.
        </p>
        <ShareInvite />
        <button type="button" className="hg-again" onClick={() => { setV(EMPTY(type)); setErrors({}); setStatus('idle') }}>
          {nom ? 'Nominate someone else' : 'Send another entry'}
        </button>
      </div>
    )
  }

  const field = (k: keyof HolidayInput, label: string, opts: { type?: string; required?: boolean; area?: boolean; hint?: string; auto?: string; rows?: number; placeholder?: string } = {}) => {
    const err = errors[k]
    const common = {
      id: id(k), name: k, value: v[k], onChange: set(k),
      maxLength: LIMITS[k as keyof typeof LIMITS],
      required: opts.required,
      'aria-invalid': err ? true : undefined,
      'aria-describedby': err ? `${id(k)}-err` : opts.hint ? `${id(k)}-hint` : undefined,
      placeholder: opts.placeholder,
    }
    return (
      <div className={`hg-field ${opts.area ? 'hg-wide' : ''} ${err ? 'hg-bad' : ''}`}>
        <label htmlFor={id(k)}>{label}{opts.required ? <b aria-hidden="true"> *</b> : <i> (optional)</i>}</label>
        {opts.area
          ? <textarea {...common} rows={opts.rows ?? 4} />
          : <input {...common} type={opts.type ?? 'text'} autoComplete={opts.auto ?? 'off'} />}
        {opts.hint && !err && <small id={`${id(k)}-hint`}>{opts.hint}</small>}
        {err && <small id={`${id(k)}-err`} className="hg-err-msg">{err}</small>}
      </div>
    )
  }

  return (
    <form
      ref={formRef}
      className="hg-card hg-form"
      action="/api/holiday"
      method="post"
      noValidate={enhanced}
      onSubmit={onSubmit}
      aria-label={nom ? 'Nominate someone' : 'Apply for your business'}
    >
      <input type="hidden" name="type" value={type} />
      <h3>{nom ? 'Nominate someone' : 'Apply for your business'}</h3>
      <p className="hg-form-sub">
        {nom
          ? 'Know a business or organization that could use a lift? Tell us about them.'
          : 'Tell us about your business or organization and what this season has been like.'}
      </p>

      {nom && <div className="hg-group">Who are you nominating?</div>}
      <div className="hg-grid">
        {field('name', nom ? 'Their name' : 'Your name', { required: true, auto: nom ? 'off' : 'name' })}
        {field('business_name', 'Business or organization', { required: true, auto: nom ? 'off' : 'organization' })}
        {field('email', nom ? 'Their email' : 'Email', { type: 'email', required: !nom, auto: nom ? 'off' : 'email', hint: nom ? 'Their email or phone, whichever you have.' : undefined })}
        {field('phone', nom ? 'Their phone' : 'Phone', { type: 'tel', required: !nom, auto: nom ? 'off' : 'tel' })}
        {field('location', 'City and state', { required: true, placeholder: 'Albuquerque, NM' })}
        {field('what_they_do', nom ? 'What do they do?' : 'What do you do?', { required: true, area: true, rows: 3 })}
        {field('why_help', nom ? 'Why do they need help right now?' : 'Why do you need help right now?', { required: true, area: true, rows: 5, hint: 'A few sentences is plenty. Be as honest as you like.' })}
      </div>

      {nom && (
        <>
          <div className="hg-group">About you</div>
          <div className="hg-grid">
            {field('nominator_name', 'Your name', { required: true, auto: 'name' })}
            {field('nominator_email', 'Your email', { type: 'email', required: true, auto: 'email' })}
            {field('nominator_phone', 'Your phone', { type: 'tel', auto: 'tel' })}
          </div>
        </>
      )}

      {/* Spam trap: hidden from people, filled by bots. */}
      <div className="hg-hp" aria-hidden="true">
        <label htmlFor={id('website')}>Leave this empty</label>
        <input id={id('website')} name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      {status === 'error' && msg && <p className="hg-alert" role="alert">{msg}</p>}

      <div className="hg-actions">
        <button type="submit" className="hm-btn hm-btn-gold" disabled={status === 'sending'}>
          <span>{status === 'sending' ? 'Sending…' : nom ? 'Send my nomination' : 'Send my application'}</span>
          <span className="yk-btn-arrow">→</span>
        </button>
        <p className="hg-fine">
          Entries close December 15, 2026. Sending this doesn’t guarantee selection. We use what you share only to review
          {nom ? ' the nomination and to reach out to the person you nominated.' : ' your entry and contact you about the giveaway.'}
        </p>
      </div>
    </form>
  )
}
