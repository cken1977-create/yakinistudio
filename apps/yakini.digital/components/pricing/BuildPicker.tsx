
'use client'

import { useMemo, useState, FormEvent } from 'react'
import {
  ANNUAL_NOTE,
  CATALOG,
  DASHBOARD_NOTE,
  HEADLINE,
  PACKAGE_EXAMPLE,
  KITS,
  QUOTE_NOTE,
  SETUPS,
  SIZES,
  TUTORIAL_NOTE,
  describeBuild,
  estimateBuild,
  formatUsd,
  moneyLabel,
  type KitId,
  type SetupId,
  type SizeId,
} from '@/lib/pricing'

const ITEM_GROUPS: { id: 'website' | 'addon' | 'service' | 'marketing' | 'academy'; label: string }[] = [
  { id: 'website', label: 'Websites' },
  { id: 'addon', label: 'Kit add-ons' },
  { id: 'service', label: 'Operations Check, 90-Day Fix, Business Setup, custom builds' },
  { id: 'marketing', label: 'Marketing and video' },
  { id: 'academy', label: 'Academy and Founder’s Build' },
]

export function BuildPicker() {
  const [kitId, setKitId] = useState<KitId | undefined>(undefined)
  const [sizeId, setSizeId] = useState<SizeId>('small')
  const [setupId, setSetupId] = useState<SetupId>('standard')
  const [items, setItems] = useState<string[]>([])
  const [rush, setRush] = useState(false)
  const [extraSeats, setExtraSeats] = useState(0)
  const [annual, setAnnual] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [website, setWebsite] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const sel = useMemo(
    () => ({ kitId, sizeId, setupId, items, rush, extraSeats, annual }),
    [kitId, sizeId, setupId, items, rush, extraSeats, annual],
  )
  const estimate = useMemo(() => estimateBuild(sel), [sel])
  const kit = KITS.find((k) => k.id === kitId)
  const size = SIZES.find((s) => s.id === sizeId)!

  const toggle = (id: string) => {
    setItems((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]))
  }

  const prefix = estimate.hasFrom || estimate.hasQuote ? 'From ' : ''

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) return setError('Please add your name.')
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Please add an email we can reach you at.')
    if (!kitId) return setError('Please pick a kit, or tell us in the note if you are not sure.')
    setSubmitting(true)
    try {
      const message = [describeBuild(sel, estimate, { phone, website }), note.trim() ? `Customer note:\n${note.trim()}` : '']
        .filter(Boolean)
        .join('\n\n')
      const service = kit
        ? `Kit quote: ${kit.name}${size ? ` · ${size.name}` : ''}`
        : 'Kit quote'
      const budget = `${prefix}${formatUsd(estimate.setup)} setup, ${estimate.hasQuote && !estimate.monthly ? 'monthly quoted' : `${prefix}${formatUsd(estimate.monthly)}/mo`}${estimate.monthly ? `, or ${formatUsd(estimate.annual)}/yr` : ''} (estimate)`
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          company: company.trim() || null,
          service,
          budget,
          message,
          source: 'pricing-build',
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not send your build.')
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your build. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className="bp-card bp-thanks" role="status">
        <h3>We received your build.</h3>
        <p>A Yakini person will review it and send a written quote. Nothing is billed until you approve that quote.</p>
        <p className="bp-est-line">{estimate.summary}</p>
      </div>
    )
  }

  return (
    <div className="bp">
      <div className="bp-grid">
        <div className="bp-main">
          <section className="bp-card">
            <h3>1. Choose a kit</h3>
            <div className="bp-chips">
              {KITS.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  className={`bp-chip ${kitId === k.id ? 'on' : ''} ${!k.ready ? 'warn' : ''}`}
                  onClick={() => setKitId(k.id)}
                >
                  <span>{k.name}</span>
                  {k.group === 'quote' ? <small>Quote</small> : <small>From {formatUsd(k.monthly.small.amount)}/mo</small>}
                  {!k.ready ? <small>Not sold until the kit is built</small> : null}
                </button>
              ))}
            </div>
          </section>

          <section className="bp-card">
            <h3>2. Choose a size</h3>
            <div className="bp-chips bp-sizes">
              {SIZES.map((s) => (
                <button key={s.id} type="button" className={`bp-chip ${sizeId === s.id ? 'on' : ''}`} onClick={() => setSizeId(s.id)}>
                  <span>{s.name}</span>
                  <small>
                    {kit && kit.group !== 'quote' ? moneyLabel(kit.monthly[s.id], '/mo') : kit ? 'Quote' : 'Pick a kit'}
                  </small>
                  <small>{s.seats} logins · {s.capacity}</small>
                </button>
              ))}
            </div>
            {kit ? (
              <p className="bp-hint">
                {size.name} for {kit.name}: {kit.capacity[size.id]}. {size.support}. {size.seats} staff logins; extra logins are $15/month. The plan is sized for {size.texts.toLocaleString('en-US')} text segments; you pay your texting provider directly for every text. If you need more than this size includes, move up a size, or ask for a custom quote past Larger.
              </p>
            ) : (
              <p className="bp-hint">Staff logins, capacity, and support come with the size you pick. If you need more than Larger includes, that is a custom quote.</p>
            )}
            {!kit?.ready && kit ? (
              <p className="bp-warn">This kit is not sold as a published plan until it is built. You can still send a quote request.</p>
            ) : null}
          </section>

          <section className="bp-card">
            <h3>3. Choose a setup level</h3>
            <div className="bp-chips bp-setups">
              {SETUPS.map((s) => (
                <button key={s.id} type="button" className={`bp-chip ${setupId === s.id ? 'on' : ''}`} onClick={() => setSetupId(s.id)}>
                  <span>{s.name}</span>
                  <small>{moneyLabel(s.price)}</small>
                  <small>{s.hours}</small>
                </button>
              ))}
            </div>
            <p className="bp-hint">The final setup level is confirmed in the written quote. Quick Start is only available when an existing kit can be configured in three hours or less. Any setup can be split into three payments.</p>
            <label className="bp-check">
              <input type="checkbox" checked={rush} onChange={(e) => setRush(e.target.checked)} />
              <span>Rush setup, +$150, to go live in two business days when there is capacity.</span>
            </label>
          </section>

          <section className="bp-card">
            <h3>4. Add services you want</h3>
            <p className="bp-hint">{DASHBOARD_NOTE} {TUTORIAL_NOTE}</p>
            <div className="bp-extras">
              <label>
                Extra staff logins ($15/month each)
                <input type="number" min={0} max={40} value={extraSeats} onChange={(e) => setExtraSeats(Math.max(0, Number(e.target.value) || 0))} />
              </label>
            </div>
            {ITEM_GROUPS.map((group) => (
              <div key={group.id} className="bp-group">
                <h4>{group.label}</h4>
                <div className="bp-items">
                  {CATALOG.filter((item) => item.group === group.id && item.picker !== false).map((item) => {
                    const checked = items.includes(item.id)
                    const price = [item.once ? moneyLabel(item.once) + (item.once.kind !== 'quote' && item.once.amount ? ' setup' : '') : null, item.monthly ? moneyLabel(item.monthly, item.monthly.kind === 'pass-through' ? '' : '/mo') : null].filter(Boolean).join(' + ')
                    return (
                      <label key={item.id} className={`bp-item ${checked ? 'on' : ''}`}>
                        <input type="checkbox" checked={checked} onChange={() => toggle(item.id)} />
                        <span>
                          <strong>{item.name}</strong>
                          <em>{price}</em>
                          <small>{item.summary}</small>
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </section>

          <section className="bp-card" id="send-quote">
            <h3>5. Send my build for a quote</h3>
            <p className="bp-hint">{QUOTE_NOTE} We will not send an automatic email. A Yakini person will follow up with a written quote.</p>
            <form className="bp-form" onSubmit={submit}>
              <label>Name<input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required /></label>
              <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></label>
              <label>Phone<input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" /></label>
              <label>Business name<input value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="organization" /></label>
              <label className="wide">Website, if you have one<input value={website} onChange={(e) => setWebsite(e.target.value)} autoComplete="url" /></label>
              <label className="wide">Anything we should know<textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} /></label>
              {error ? <p className="bp-error" role="alert">{error}</p> : null}
              <button type="submit" className="bp-submit" disabled={submitting}>{submitting ? 'Sending…' : 'Send my build for a quote'}</button>
            </form>
          </section>
        </div>

        <aside className="bp-summary" aria-live="polite">
          <div className="bp-summary-inner">
            <p className="bp-kicker">Your estimate</p>
            <p className="bp-head">{HEADLINE}</p>
            <p className="bp-hint">{PACKAGE_EXAMPLE}</p>
            <div className="bp-totals">
              <div>
                <span>Estimated setup</span>
                <strong>{prefix}{formatUsd(estimate.setup)}</strong>
              </div>
              <div>
                <span>{annual ? 'Estimated yearly (12 for 11)' : 'Estimated monthly'}</span>
                <strong>{estimate.hasQuote && !estimate.monthly ? 'Quote' : `${prefix}${formatUsd(annual ? estimate.annual : estimate.monthly)}${annual ? '/yr' : '/mo'}`}</strong>
              </div>
            </div>
            <label className="bp-check">
              <input type="checkbox" checked={annual} onChange={(e) => setAnnual(e.target.checked)} />
              <span>{ANNUAL_NOTE}</span>
            </label>
            {estimate.monthly && !annual ? <p className="bp-hint">Annual prepay would be {formatUsd(estimate.annual)}.</p> : null}
            <ul className="bp-lines">
              {estimate.lines.map((l) => (
                <li key={l.label}>
                  <span>{l.label}</span>
                  <span>
                    {l.setup ? `${l.kind === 'from' ? 'from ' : ''}${formatUsd(l.setup)}` : ''}
                    {l.setup && l.monthly ? ' + ' : ''}
                    {l.monthly ? `${l.kind === 'from' ? 'from ' : ''}${formatUsd(l.monthly)}/mo` : l.kind === 'quote' && !l.setup && !l.monthly ? 'Quote' : ''}
                  </span>
                </li>
              ))}
            </ul>
            <p className="bp-hint">{QUOTE_NOTE} Outside services such as hosting, texting, and card processing are billed to you directly; expected costs are shown on the quote.</p>
            <a className="bp-submit bp-jump" href="#send-quote">Send this build for a quote</a>
          </div>
        </aside>
      </div>
    </div>
  )
}
