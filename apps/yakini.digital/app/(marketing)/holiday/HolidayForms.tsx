'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { ShareInvite } from './ShareInvite'
import { HOLIDAY_TYPES, LIMITS, isHolidayType, validateHoliday, type HolidayInput, type HolidayType } from '@/lib/holiday'

// Three forms, one page: "Apply for your business" and "Nominate someone" (existing
// businesses and organizations) and "Nominate a future founder" (someone starting one;
// self-nomination allowed with "This is me").
// Works without JavaScript too: every form posts to /api/holiday, which sends the visitor
// back to /holiday?sent=… With JavaScript on, they become tabs and post with fetch.

type Status = 'idle' | 'sending' | 'sent' | 'error'
type Errors = Partial<Record<keyof HolidayInput, string>>

const UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const

const noop = () => () => {}

// Deep links: yakini.digital/holiday#apply, #nominate and #founder open that form directly.
const onHash = (cb: () => void) => { window.addEventListener('hashchange', cb); return () => window.removeEventListener('hashchange', cb) }
const hashTab = (): HolidayType | '' => {
  const h = window.location.hash.replace('#', '').toLowerCase()
  return isHolidayType(h) ? h : ''
}

const TAB_LABEL: Record<HolidayType, string> = {
  apply: 'Apply for your business',
  nominate: 'Nominate someone',
  founder: 'Nominate a future founder',
}

const NO_JS_ERRORS: Record<string, string> = {
  missing: 'A required field was empty or didn’t look right. Please check the form and send it again.',
  failed: 'We couldn’t save that just now. Please try again in a minute, or email hello@yakini.digital.',
  closed: 'Entries for the Holiday Giveaway are closed.',
  founder_contact: 'Because you checked “This is me”, please add both your email and your phone number, then send it again.',
}

export function HolidayForms({ initialTab, sent, errorCode, closed }: {
  initialTab: HolidayType
  sent: HolidayType | null
  errorCode: string | null
  closed: boolean
}) {
  const fromHash = useSyncExternalStore(onHash, hashTab, () => '' as const)
  const tab: HolidayType = fromHash || initialTab
  const clicked = useRef(false)
  const setTab = (t: HolidayType) => {
    if (t === tab) return
    clicked.current = true
    history.replaceState(null, '', `#${t}`)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  }
  // false on the server and the first paint, true once the script is running.
  const enhanced = useSyncExternalStore(noop, () => true, () => false)

  const formsRef = useRef<HTMLDivElement>(null)
  // Arriving on #apply / #nominate / #founder (or following such a link on the page): bring the
  // selected tab into view once the tabs are live. Tab clicks don't scroll.
  useEffect(() => {
    if (!enhanced || !fromHash) return
    if (clicked.current) { clicked.current = false; return }
    // The browser also jumps to the #id on load (sometimes after this runs), so settle on
    // the tabs again a moment later.
    const go = () => formsRef.current?.scrollIntoView({ block: 'start' })
    go()
    const t1 = setTimeout(go, 150)
    const t2 = setTimeout(go, 500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [enhanced, fromHash])

  if (closed) {
    return (
      <div className="hg-card hg-done" role="status">
        <h3>Entries are closed.</h3>
        <p>Thank you to everyone who applied and nominated. We’re reading every story now.</p>
      </div>
    )
  }

  return (
    <div className="hg-forms" ref={formsRef}>
      <div className="hg-tabs" role={enhanced ? 'tablist' : undefined} aria-label="Choose a form">
        {HOLIDAY_TYPES.map((t) => (
          <a
            key={t}
            href={`#${t}`}
            id={`tab-${t}`}
            role={enhanced ? 'tab' : undefined}
            aria-selected={enhanced ? tab === t : undefined}
            aria-controls={t}
            className={`hg-tab ${!enhanced || tab === t ? 'on' : ''}`}
            onClick={(e) => { if (enhanced) { e.preventDefault(); setTab(t) } }}
          >
            {TAB_LABEL[t]}
          </a>
        ))}
      </div>
      {HOLIDAY_TYPES.map((t) => (
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
  nominator_name: '', nominator_email: '', nominator_phone: '', self_nominated: false,
})

type TextKey = Exclude<keyof HolidayInput, 'type' | 'self_nominated'>

function HolidayForm({ type, enhanced, sentNoJs, errorNoJs }: { type: HolidayType; enhanced: boolean; sentNoJs: boolean; errorNoJs: string | null }) {
  const founder = type === 'founder'
  const [v, setV] = useState<HolidayInput>(EMPTY(type))
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<Status>(sentNoJs ? 'sent' : errorNoJs ? 'error' : 'idle')
  const [msg, setMsg] = useState(errorNoJs ? NO_JS_ERRORS[errorNoJs] ?? NO_JS_ERRORS.failed : '')
  const formRef = useRef<HTMLFormElement>(null)
  const id = (k: string) => `${type}-${k}`
  const self = founder && v.self_nominated
  // "theirs": someone else is filling this in (business nomination, or founder nominated by a friend).
  const theirs = type === 'nominate' || (founder && !self)
  // Without JavaScript the founder form can't react to "This is me", so it shows the
  // nominator section with a "skip if this is you" note; the server sorts it out.
  const showNominator = type === 'nominate' || (founder && (!enhanced || !self))

  const set = (k: TextKey) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
          ...(self ? { nominator_name: '', nominator_email: '', nominator_phone: '' } : {}),
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
    const title = founder
      ? (self ? 'Thank you. We got your story.' : 'Thank you for nominating them.')
      : type === 'nominate' ? 'Thank you for nominating them.' : 'Thank you. We got your application.'
    return (
      <div className="hg-card hg-done" role="status">
        <div className="hg-done-mark" aria-hidden="true">✓</div>
        <h3>{title}</h3>
        <p>
          A real person reads every entry. Entries close December 15, 2026, and then BRSA Foundation and Yakini Digital
          choose {founder ? 'one future founder' : 'five businesses and organizations'}. We can’t pick everyone, but if {theirs ? 'they are' : 'you are'} chosen,
          we’ll reach out by email or phone.
        </p>
        {enhanced && <Confetti />}
        <ShareInvite />
        {enhanced ? (
          <button type="button" className="hg-again" onClick={() => { setV(EMPTY(type)); setErrors({}); setStatus('idle') }}>
            {theirs ? 'Nominate someone else' : 'Send another entry'}
          </button>
        ) : (
          // Without JavaScript the button can't reset the form, so link back to a fresh one.
          <a className="hg-again" href={`/holiday?form=${type}#${type}`}>{theirs ? 'Nominate someone else' : 'Send another entry'}</a>
        )}
      </div>
    )
  }

  const field = (k: TextKey, label: string, opts: { type?: string; required?: boolean; area?: boolean; hint?: string; auto?: string; rows?: number; placeholder?: string } = {}) => {
    const err = errors[k]
    const common = {
      id: id(k), name: k, value: v[k], onChange: set(k),
      maxLength: LIMITS[k],
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

  const heading = TAB_LABEL[type]
  const sub = founder
    ? 'For someone who’s ready to start a business but hasn’t launched yet. We’ll walk the one we choose through registering it, getting set up, and the full build. Nominate a friend, or yourself.'
    : type === 'nominate'
      ? 'Know an existing business or organization that could use a lift? Tell us about them.'
      : 'For existing businesses and organizations. Tell us about yours and what this season has been like.'
  const who = (them: string, me: string) => (theirs ? them : me)

  return (
    <form
      ref={formRef}
      className="hg-card hg-form"
      action="/api/holiday"
      method="post"
      noValidate={enhanced}
      onSubmit={onSubmit}
      aria-label={heading}
    >
      <input type="hidden" name="type" value={type} />
      <h3>{heading}</h3>
      <p className="hg-form-sub">{sub}</p>

      {founder && (
        <label className="hg-self" htmlFor={id('self')}>
          <input
            id={id('self')}
            type="checkbox"
            name="self_nominated"
            value="yes"
            checked={v.self_nominated}
            onChange={(e) => { const on = e.target.checked; setV((cur) => ({ ...cur, self_nominated: on })); setErrors({}) }}
          />
          <span>
            <b>This is me.</b> I’m the future founder and I’m nominating myself.
            <small>If this is you, please add both your email and phone below{enhanced ? '' : ' and skip the “About you (the nominator)” part'}.</small>
          </span>
        </label>
      )}

      {theirs && <div className="hg-group">{founder ? 'Who is the future founder?' : 'Who are you nominating?'}</div>}
      {!theirs && founder && <div className="hg-group">About you</div>}
      <div className="hg-grid">
        {field('name', founder ? who('Founder’s name', 'Your name') : who('Their name', 'Your name'), { required: true, auto: theirs ? 'off' : 'name' })}
        {founder
          ? field('business_name', 'Business name, if there is one', { auto: 'off' })
          : field('business_name', 'Business or organization', { required: true, auto: theirs ? 'off' : 'organization' })}
        {field('email', who('Their email', 'Email'), { type: 'email', required: !theirs, auto: theirs ? 'off' : 'email', hint: theirs ? (founder && !enhanced ? 'Their email or phone, whichever you have. Nominating yourself? Add both.' : 'Their email or phone, whichever you have.') : undefined })}
        {field('phone', who('Their phone', 'Phone'), { type: 'tel', required: !theirs, auto: theirs ? 'off' : 'tel' })}
        {field('location', 'City and state', { required: true, placeholder: 'Albuquerque, NM' })}
        {field('what_they_do', founder ? 'What’s the business idea?' : who('What do they do?', 'What do you do?'), { required: true, area: true, rows: 3 })}
        {field('why_help', who('Why do they need help right now?', 'Why do you need help right now?'), { required: true, area: true, rows: 5, hint: 'A few sentences is plenty. Be as honest as you like.' })}
      </div>

      {showNominator && (
        <>
          <div className="hg-group">About you (the nominator){founder && !enhanced ? ' · skip this if you checked “This is me”' : ''}</div>
          <div className="hg-grid">
            {field('nominator_name', 'Your name', { required: enhanced || !founder, auto: 'name' })}
            {field('nominator_email', 'Your email', { type: 'email', required: enhanced || !founder, auto: 'email' })}
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
        <button type="submit" className="hx-btn hx-btn-red" disabled={status === 'sending'}>
          <span>{status === 'sending' ? 'Sending…' : theirs ? 'Send my nomination' : 'Send my application'}</span>
          <span className="hx-arrow" aria-hidden="true">→</span>
        </button>
        <p className="hg-fine">
          Entries close December 15, 2026. Sending this doesn’t guarantee selection. We use what you share only to review
          {theirs ? ' the nomination and to reach out to the person you nominated.' : ' your entry and contact you about the giveaway.'}
        </p>
      </div>
    </form>
  )
}

const CONFETTI_COLORS = ['#D8AE5B', '#F1DBA0', '#FFF6E2', '#8E1B2C', '#E2B95C']

/** One-time celebratory burst on a successful submit (hidden for reduced motion). */
function Confetti() {
  const pieces = Array.from({ length: 34 }, (_, i) => {
    const a = (i / 34) * Math.PI * 2 + (i % 3) * 0.2
    const dist = 90 + ((i * 37) % 120)
    return {
      ['--x' as string]: `${Math.round(Math.cos(a) * dist + 120)}px`,
      ['--y' as string]: `${Math.round(Math.sin(a) * dist * 0.8 + 40)}px`,
      ['--r' as string]: `${(i * 97) % 540 - 270}deg`,
      ['--c' as string]: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      ['--w' as string]: `${6 + (i % 3) * 3}px`,
      ['--h' as string]: `${i % 2 ? 6 : 12}px`,
      ['--delay' as string]: `${(i % 6) * 0.03}s`,
    } as React.CSSProperties
  })
  return <div className="hx-confetti" aria-hidden="true">{pieces.map((st, i) => <i key={i} style={st} />)}</div>
}
