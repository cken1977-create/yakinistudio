'use client'

import { FormEvent, useMemo, useState } from 'react'
import type { BrandProfile } from '@/lib/demo/extract-brand'
import { FALLBACK_COLORS } from '@/lib/demo/extract-brand'
import { DashboardPreview } from '@/components/demo/DashboardPreview'
import {
  ANNUAL_NOTE,
  CATALOG,
  DASHBOARD_NOTE,
  HEADLINE,
  KITS,
  PACKAGE_EXAMPLE,
  QUOTE_NOTE,
  SETUPS,
  SIZES,
  TUTORIAL_NOTE,
  WEBSITE_TYPES,
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
  { id: 'service', label: 'Business Setup and other services' },
  { id: 'marketing', label: 'Marketing and video' },
  { id: 'academy', label: 'Academy' },
]

const STEPS = ['Your business', 'Your kit', 'Your demo'] as const
type Step = 0 | 1 | 2

const EMPTY_BRAND: BrandProfile = {
  name: '',
  logoUrl: null,
  colors: FALLBACK_COLORS,
  sourceUrl: null,
  fetched: false,
}

function monogram(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] || 'Y') + (parts[1]?.[0] || '')).toUpperCase()
}

export function DemoBuilder() {
  const [step, setStep] = useState<Step>(0)
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [industry, setIndustry] = useState('')
  const [brand, setBrand] = useState<BrandProfile>(EMPTY_BRAND)
  const [warning, setWarning] = useState('')
  const [loading, setLoading] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)

  const [kitId, setKitId] = useState<KitId | undefined>(undefined)
  const [sizeId, setSizeId] = useState<SizeId>('small')
  const [setupId, setSetupId] = useState<SetupId>('quick')
  const [items, setItems] = useState<string[]>([])
  const [rush, setRush] = useState(false)
  const [extraSeats, setExtraSeats] = useState(0)
  const [annual, setAnnual] = useState(false)
  const [websiteType, setWebsiteType] = useState('')

  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const sel = useMemo(
    () => ({
      kitId,
      sizeId,
      setupId,
      items,
      rush,
      extraSeats,
      annual,
      websiteType: items.includes('website-simple') ? websiteType || undefined : undefined,
    }),
    [kitId, sizeId, setupId, items, rush, extraSeats, annual, websiteType],
  )
  const estimate = useMemo(() => estimateBuild(sel), [sel])
  const kit = KITS.find((k) => k.id === kitId)
  const prefix = estimate.hasFrom || estimate.hasQuote ? 'From ' : ''

  const toggle = (id: string) => {
    setItems((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]))
  }

  const readSite = async () => {
    setError('')
    setWarning('')
    if (!url.trim() && !name.trim()) {
      setError('Add your website, or at least your business name, to start.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/demo/brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), name: name.trim(), industry }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok && !data.brand) throw new Error(data.error || 'We could not start the demo.')
      const next: BrandProfile = data.brand || {
        ...EMPTY_BRAND,
        name: name.trim() || 'Your business',
      }
      setBrand(next)
      setLogoFailed(false)
      if (next.name && !name.trim()) setName(next.name)
      if (!kitId && (next.suggestedKit || industry)) {
        setKitId((next.suggestedKit || industry) as KitId)
      }
      if (data.warning) setWarning(data.warning)
      setStep(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not start the demo.')
    } finally {
      setLoading(false)
    }
  }

  const goToDemo = () => {
    setError('')
    if (!kitId) {
      setError('Please pick a kit, or tell us in the note at the end if you are not sure.')
      return
    }
    if (brand.name !== name.trim() && name.trim()) {
      setBrand((current) => ({ ...current, name: name.trim() }))
    }
    setStep(2)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!contactName.trim()) return setError('Please add your name.')
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setError('Please add an email we can reach you at.')
    }
    if (!kitId) return setError('Please pick a kit, or tell us in the note if you are not sure.')
    setSubmitting(true)
    try {
      const message = [
        describeBuild(sel, estimate, { phone, website: url.trim() || brand.sourceUrl || undefined }),
        `Demo brand name: ${brand.name || name || 'not given'}`,
        brand.sourceUrl ? `Site read for the demo: ${brand.sourceUrl}` : url.trim() ? `Website given: ${url.trim()}` : null,
        brand.fetched ? `Demo colors (not stored as page content): ${brand.colors.primary}, ${brand.colors.accent}` : 'Brand colors were not read from a website.',
        note.trim() ? `Customer note:\n${note.trim()}` : '',
      ]
        .filter(Boolean)
        .join('\n\n')
      const service = kit ? `Kit demo quote: ${kit.name}` : 'Kit demo quote'
      const budget = `${prefix}${formatUsd(estimate.setup)} setup, ${
        estimate.hasQuote && !estimate.monthly ? 'monthly quoted' : `${prefix}${formatUsd(estimate.monthly)}/mo`
      }${estimate.monthly ? `, or ${formatUsd(estimate.annual)}/yr` : ''} (estimate)`
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName.trim(),
          email: email.trim(),
          company: (brand.name || name).trim() || null,
          service,
          budget,
          message,
          source: 'kit-demo',
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
      <div className="db-card db-thanks" role="status">
        <h3>We received your build.</h3>
        <p>A Yakini person will review it and send a written quote. Nothing is billed until you approve that quote. We will not send an automatic email.</p>
        <p className="db-hint">{estimate.summary}</p>
      </div>
    )
  }

  return (
    <div className="db">
      <ol className="db-steps" aria-label="Demo steps">
        {STEPS.map((label, i) => (
          <li key={label} className={step === i ? 'on' : ''}>
            <span className="n">{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <section className="db-card">
          <h3>Start with your website.</h3>
          <p className="db-hint">We read the public page only — logo, name, and colors — and build a sample dashboard in your brand. You can also start with just a business name.</p>
          <div className="db-fields">
            <label>
              Your website
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                inputMode="url"
                autoComplete="url"
                placeholder="www.yourbusiness.com"
                aria-label="Your business website"
              />
            </label>
            <label>
              Business name, if you want to type it
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="organization" placeholder="Optional" />
            </label>
            <label>
              Industry, if you know it
              <select value={industry} onChange={(e) => setIndustry(e.target.value)}>
                <option value="">Not sure yet</option>
                {KITS.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name}{k.group === 'quote' ? ' (quote only)' : ''}{!k.ready ? ' — not sold yet' : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {error ? <p className="db-error" role="alert">{error}</p> : null}
          <div className="db-actions">
            <button type="button" className="db-btn" onClick={readSite} disabled={loading}>
              {loading ? 'Reading your site…' : 'Build my demo'}
            </button>
          </div>
        </section>
      ) : null}

      {step === 1 ? (
        <div>
          <section className="db-card">
            <h3>Is this your brand?</h3>
            {warning ? <p className="db-warn">{warning} You can still build the demo with the name you entered.</p> : null}
            <div className="db-brand">
              {brand.logoUrl && !logoFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="db-logo" src={brand.logoUrl} alt="" onError={() => setLogoFailed(true)} />
              ) : (
                <div className="db-mono">{monogram(name || brand.name || 'Y')}</div>
              )}
              <div>
                <label>
                  Business name
                  <input value={name || brand.name} onChange={(e) => setName(e.target.value)} />
                </label>
                <div className="db-swatches" aria-label="Brand colors">
                  <i style={{ background: brand.colors.primary }} />
                  <i style={{ background: brand.colors.secondary }} />
                  <i style={{ background: brand.colors.accent }} />
                </div>
              </div>
            </div>
          </section>

          <section className="db-card">
            <h3>Choose a kit, a size, and a setup.</h3>
            <p className="db-hint">Cannabis, home healthcare, and reentry are quote-only. Home healthcare and reentry are not sold until those kits are built.</p>
            <div className="db-group">
              <h4>Kit</h4>
              <div className="db-chips">
                {KITS.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    className={`db-chip ${kitId === k.id ? 'on' : ''} ${!k.ready ? 'warn' : ''}`}
                    onClick={() => setKitId(k.id)}
                  >
                    <span>{k.name}</span>
                    {k.group === 'quote' ? <small>Quote only</small> : <small>From {formatUsd(k.monthly.small.amount)}/mo</small>}
                    {!k.ready ? <small>Not sold until the kit is built</small> : null}
                  </button>
                ))}
              </div>
            </div>
            <div className="db-group">
              <h4>Size</h4>
              <div className="db-chips">
                {SIZES.map((s) => (
                  <button key={s.id} type="button" className={`db-chip ${sizeId === s.id ? 'on' : ''}`} onClick={() => setSizeId(s.id)}>
                    <span>{s.name}</span>
                    <small>{kit && kit.group !== 'quote' ? moneyLabel(kit.monthly[s.id], '/mo') : kit ? 'Quote' : 'Pick a kit'}</small>
                    <small>{s.seats} logins · {s.capacity}</small>
                  </button>
                ))}
              </div>
            </div>
            <div className="db-group">
              <h4>Setup</h4>
              <div className="db-chips">
                {SETUPS.map((s) => (
                  <button key={s.id} type="button" className={`db-chip ${setupId === s.id ? 'on' : ''}`} onClick={() => setSetupId(s.id)}>
                    <span>{s.name}</span>
                    <small>{moneyLabel(s.price)}</small>
                    <small>{s.hours}</small>
                  </button>
                ))}
              </div>
              <p className="db-hint">Any setup can be split into three payments. Quick Start is only available when an existing kit can be configured in three hours or less. The final setup level is confirmed in the written quote.</p>
              <label className="db-check">
                <input type="checkbox" checked={rush} onChange={(e) => setRush(e.target.checked)} />
                <span>Rush setup, +$150, to go live in two business days when there is capacity.</span>
              </label>
            </div>
          </section>

          <section className="db-card">
            <h3>Add the features you want.</h3>
            <p className="db-hint">{DASHBOARD_NOTE} {TUTORIAL_NOTE}</p>
            <div className="db-fields" style={{ maxWidth: 240, marginBottom: 12 }}>
              <label>
                Extra staff logins ($15/month each)
                <input type="number" min={0} max={40} value={extraSeats} onChange={(e) => setExtraSeats(Math.max(0, Number(e.target.value) || 0))} />
              </label>
            </div>
            {ITEM_GROUPS.map((group) => (
              <div key={group.id} className="db-group">
                <h4>{group.label}</h4>
                <div className="db-items">
                  {CATALOG.filter((item) => item.group === group.id && item.picker !== false).map((item) => {
                    const checked = items.includes(item.id)
                    const price = [
                      item.once ? moneyLabel(item.once) + (item.once.kind !== 'quote' && item.once.amount ? ' setup' : '') : null,
                      item.monthly ? moneyLabel(item.monthly, item.monthly.kind === 'pass-through' ? '' : '/mo') : null,
                    ].filter(Boolean).join(' + ')
                    return (
                      <label key={item.id} className={`db-item ${checked ? 'on' : ''}`}>
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
            {items.includes('website-simple') ? (
              <div className="db-group">
                <h4>Choose your website type</h4>
                <p className="db-hint">You pick a type; we build from that template, in your brand.</p>
                <div className="db-chips">
                  {WEBSITE_TYPES.map((t) => (
                    <button key={t.id} type="button" className={`db-chip ${websiteType === t.id ? 'on' : ''}`} onClick={() => setWebsiteType(t.id)}>
                      <span>{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          {error ? <p className="db-error" role="alert">{error}</p> : null}
          <div className="db-actions">
            <button type="button" className="db-btn-ghost" onClick={() => setStep(0)}>Back</button>
            <button type="button" className="db-btn" onClick={goToDemo}>See my dashboard</button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="db-stage">
          <div>
            <DashboardPreview brand={{ ...brand, name: name.trim() || brand.name || 'Your business' }} kitId={kitId} items={items} />
            <section className="db-card" id="send-quote" style={{ marginTop: 16 }}>
              <h3>Send my build for a quote</h3>
              <p className="db-hint">{QUOTE_NOTE} We will not send an automatic email. A Yakini person will follow up with a written quote.</p>
              <form className="db-form" onSubmit={submit}>
                <label>Name<input value={contactName} onChange={(e) => setContactName(e.target.value)} autoComplete="name" required /></label>
                <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></label>
                <label>Phone<input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" /></label>
                <label>Business name<input value={name || brand.name} onChange={(e) => setName(e.target.value)} autoComplete="organization" /></label>
                <label className="wide">Anything we should know<textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} /></label>
                {error ? <p className="db-error" role="alert">{error}</p> : null}
                <button type="submit" className="db-btn" disabled={submitting}>{submitting ? 'Sending…' : 'Send my build for a quote'}</button>
              </form>
            </section>
            <div className="db-actions">
              <button type="button" className="db-btn-ghost" onClick={() => setStep(1)}>Change my kit</button>
            </div>
          </div>
          <aside className="db-estimate" aria-live="polite">
            <div className="db-card db-sticky">
              <p className="db-hint" style={{ letterSpacing: '.14em', textTransform: 'uppercase', fontSize: 11, marginBottom: 6 }}>Your estimate</p>
              <h3>{HEADLINE}</h3>
              <div className="db-totals">
                <div>
                  <span>Estimated setup</span>
                  <strong>{prefix}{formatUsd(estimate.setup)}</strong>
                </div>
                <div>
                  <span>{annual ? 'Estimated yearly (12 for 11)' : 'Estimated monthly'}</span>
                  <strong>
                    {estimate.hasQuote && !estimate.monthly
                      ? 'Quote'
                      : `${prefix}${formatUsd(annual ? estimate.annual : estimate.monthly)}${annual ? '/yr' : '/mo'}`}
                  </strong>
                </div>
              </div>
              <label className="db-check">
                <input type="checkbox" checked={annual} onChange={(e) => setAnnual(e.target.checked)} />
                <span>{ANNUAL_NOTE}</span>
              </label>
              {estimate.monthly && !annual ? <p className="db-hint">Annual prepay would be {formatUsd(estimate.annual)}.</p> : null}
              <ul className="db-lines">
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
              <p className="db-hint">{QUOTE_NOTE} Hosting, texting, and payment processing are billed by those providers, in your name.</p>
              <p className="db-hint">{PACKAGE_EXAMPLE}</p>
              <a className="db-btn" href="#send-quote">Send this build for a quote</a>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  )
}
