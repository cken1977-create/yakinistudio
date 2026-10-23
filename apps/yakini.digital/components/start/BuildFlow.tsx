'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  domainFromDraft,
  emptyDraft,
  formatCents,
  groupedFeatures,
  growOnlyIds,
  includedLabels,
  intakeFromDraft,
  isComingSoon,
  isSelectable,
  monthlyLabel,
  monthlyStartLabel,
  publicPlans,
  suggestHostname,
  suggestPlanId,
  timelineBlocks,
  tldSentence,
  toggleFeature,
  type Catalog,
  type CatalogFeature,
  type Draft,
  type FoundingSeats,
} from '@/lib/orders/logic'

const STEPS = ['Business', 'Features', 'Domain', 'Timeline', 'Total'] as const

const HINTS: Record<string, string> = {
  'home-services': 'Trades, cleaning, lawn care, repairs',
  construction: 'Builders, crews, and job sites',
  hospitality: 'Kitchens, catering, stays, and service',
  builtin: 'We shape the setup around your business',
}

type Done = { testMode: boolean; reference: string | null }

export function BuildFlow({
  catalog,
  seats,
  initialPlanId,
  testMode,
}: {
  catalog: Catalog
  seats: FoundingSeats | null
  initialPlanId: string
  testMode: boolean
}) {
  const plans = useMemo(() => publicPlans(catalog, seats), [catalog, seats])
  const queryPlan = plans.some((plan) => plan.id === initialPlanId)
  const startingPlan = queryPlan ? initialPlanId : (suggestPlanId(catalog, [], seats) ?? '')
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Draft>(() => ({ ...emptyDraft(startingPlan), planTouched: queryPlan }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState<Done | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const moved = useRef(false)

  useEffect(() => {
    if (!moved.current) return
    headingRef.current?.focus()
  }, [step, done])

  const groups = useMemo(() => groupedFeatures(catalog), [catalog])
  const growOnly = useMemo(() => growOnlyIds(catalog), [catalog])
  const pickedGrow = draft.featureIds.filter((id) => growOnly.has(id))
  const plan = plans.find((item) => item.id === draft.planId) ?? null
  const domain = domainFromDraft(draft, catalog.domain.defaultKind)
  const address = domain?.kind === 'existing' ? domain.hostname : domain?.kind === 'register' ? 'the domain we register for you' : ''
  const suggested = suggestPlanId(catalog, draft.featureIds, seats)
  const startDate = monthlyStartLabel()

  function go(next: number) {
    setError('')
    moved.current = true
    setStep(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function onToggle(id: string) {
    setDraft((current) => {
      const featureIds = toggleFeature(current.featureIds, id, catalog)
      const needsGrow = featureIds.some((featureId) => growOnly.has(featureId))
      const grow = plans.find((item) => item.id === 'grow')
      let planId = current.planTouched ? current.planId : (suggestPlanId(catalog, featureIds, seats) ?? current.planId)
      if (needsGrow && grow) planId = grow.id
      return { ...current, featureIds, planId }
    })
  }

  function choosePlan(id: string) {
    if (id !== 'grow' && draft.featureIds.some((featureId) => growOnly.has(featureId))) return
    setDraft((current) => ({ ...current, planId: id, planTouched: true }))
  }

  const stepReady = [
    Boolean(draft.templateId),
    true,
    Boolean(domain),
    true,
    Boolean(plan) && Boolean(intakeFromDraft(draft, catalog, seats)),
  ][step]

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const intake = intakeFromDraft(draft, catalog, seats)
    if (!intake) {
      setError('Add your name, email, phone, and business name to reserve the setup.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          templateId: draft.templateId,
          featureIds: draft.featureIds,
          planId: draft.planId,
          domainKind: draft.domainKind,
          domain: draft.domain,
          hostname: intake.domain.kind === 'existing' ? intake.domain.hostname : '',
          preferredNames: draft.preferredNames,
          contact: draft.contact,
        }),
      })
      const body = await response.json().catch(() => null) as { ok?: boolean; testMode?: boolean; reference?: string | null; error?: string } | null
      if (!response.ok || !body?.ok) {
        setError(body?.error || 'We could not reserve that just now. Email hello@yakini.digital and a Yakini person will take it from here.')
        return
      }
      moved.current = true
      setDone({ testMode: Boolean(body.testMode), reference: body.reference ?? null })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setError('We could not reserve that just now. Email hello@yakini.digital and a Yakini person will take it from here.')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    const template = catalog.templates.find((item) => item.id === draft.templateId)
    return (
      <div className="st">
        <div className="st-wrap st-done">
          {done.testMode ? (
            <div className="st-test" role="status">
              <strong>Test preview. </strong>
              This reservation was not sent. Nothing was created, and no card was charged.
            </div>
          ) : null}
          <div className="st-kicker"><span className="yk-eyebrow-dot" /> Reserved</div>
          <h1 className="st-h" tabIndex={-1} ref={headingRef}>You&apos;re reserved.</h1>
          <p className="st-lead">
            A Yakini person will reach out to schedule the kickoff call. No card was charged.
          </p>
          <dl className="st-recap">
            <div><dt>Business</dt><dd>{draft.contact.businessName}</dd></div>
            <div><dt>Kind</dt><dd>{template?.label}</dd></div>
            <div><dt>Plan</dt><dd>{plan ? `${plan.name} · ${monthlyLabel(plan)}` : ''}</dd></div>
            <div><dt>Address</dt><dd>{address}</dd></div>
            {done.reference ? <div><dt>Reservation</dt><dd>{done.reference}</dd></div> : null}
          </dl>
        </div>
      </div>
    )
  }

  return (
    <div className="st">
      <div className="st-wrap">
        {testMode ? (
          <div className="st-test">
            <strong>Test preview. </strong>
            Reserving here does not create an order, and no card is charged.
          </div>
        ) : null}
        <div className="st-progress">
          <p>Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
          <div className="st-meter" aria-hidden><span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
        </div>

        {step === 0 ? (
          <section>
            <div className="st-kicker"><span className="yk-eyebrow-dot" /> Build it with you</div>
            <h1 className="st-h" tabIndex={-1} ref={headingRef}>What kind of business are you?</h1>
            <p className="st-lead">Pick the closest fit. A real Yakini person builds the system with you, on your own domain.</p>
            <div className="st-list st-templates">
              {catalog.templates.map((template) => (
                <label key={template.id} className="st-choice">
                  <input
                    type="radio"
                    name="template"
                    checked={draft.templateId === template.id}
                    onChange={() => setDraft((current) => ({ ...current, templateId: template.id }))}
                  />
                  <span className="st-mark" aria-hidden />
                  <span>
                    <h2>{template.label}</h2>
                    {HINTS[template.id] ? <p>{HINTS[template.id]}</p> : null}
                  </span>
                </label>
              ))}
            </div>
          </section>
        ) : null}

        {step === 1 ? (
          <section>
            <div className="st-kicker"><span className="yk-eyebrow-dot" /> Your system</div>
            <h1 className="st-h" tabIndex={-1} ref={headingRef}>What should it do?</h1>
            <p className="st-lead">Tick what you want now. Anything marked coming soon stays off until it is ready. We build the rest with you.</p>
            {groups.map((group) => (
              <div key={group.group} className="st-group">
                <h2>{group.group}</h2>
                <div className="st-list">
                  {group.features.map((feature) => (
                    isSelectable(feature)
                      ? <FeatureChoice key={feature.id} feature={feature} checked={draft.featureIds.includes(feature.id)} onToggle={onToggle} />
                      : <SoonCard key={feature.id} feature={feature} />
                  ))}
                </div>
              </div>
            ))}
            <p className="st-ask">Anything else is coming soon. Ask your Yakini person, and we will tell you straight whether it belongs in this setup.</p>
            {pickedGrow.length ? (
              <p className="st-note">
                {pickedGrow.map((id) => catalog.features.find((feature) => feature.id === id)?.label).filter(Boolean).join(' and ')} {pickedGrow.length === 1 ? 'is' : 'are'} part of Grow, so that plan is selected for you. You can turn {pickedGrow.length === 1 ? 'it' : 'them'} off if you want Founding or Operate.
              </p>
            ) : null}
          </section>
        ) : null}

        {step === 2 ? (
          <section>
            <div className="st-kicker"><span className="yk-eyebrow-dot" /> Your domain</div>
            <h1 className="st-h" tabIndex={-1} ref={headingRef}>Where will your system live?</h1>
            <p className="st-lead">On your own domain. A Yakini person connects it with you on the kickoff call. We never touch your email.</p>
            <div className="st-split" role="radiogroup" aria-label="Do you already have a domain?">
              <button type="button" className={`st-path ${draft.domainKind === 'existing' ? 'on' : ''}`} aria-pressed={draft.domainKind === 'existing'} onClick={() => setDraft((current) => ({ ...current, domainKind: 'existing' }))}>
                <strong>I have a domain</strong>
                <span>We connect it with you. Nothing to change today.</span>
              </button>
              <button type="button" className={`st-path ${draft.domainKind === 'register' ? 'on' : ''}`} aria-pressed={draft.domainKind === 'register'} onClick={() => setDraft((current) => ({ ...current, domainKind: 'register' }))}>
                <strong>I need one</strong>
                <span>Yakini registers it at sign-up, in your business&apos;s name.</span>
              </button>
            </div>
            {draft.domainKind === 'existing' ? (
              <>
                <div className="st-field">
                  <label htmlFor="domain">Your domain</label>
                  <input
                    id="domain"
                    inputMode="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                    placeholder="theirbusiness.com"
                    value={draft.domain}
                    onChange={(event) => {
                      const domain = event.target.value
                      setDraft((current) => ({
                        ...current,
                        domain,
                        hostname: current.hostnameTouched ? current.hostname : suggestHostname(domain, catalog.domain.defaultKind),
                      }))
                    }}
                  />
                </div>
                <div className="st-field">
                  <label htmlFor="hostname">The address you want</label>
                  <input
                    id="hostname"
                    inputMode="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                    placeholder="portal.theirbusiness.com"
                    value={draft.hostnameTouched ? draft.hostname : suggestHostname(draft.domain, catalog.domain.defaultKind)}
                    onChange={(event) => setDraft((current) => ({ ...current, hostname: event.target.value, hostnameTouched: true }))}
                  />
                  <small>We suggest portal.yourbusiness.com so your website and email stay put. On the kickoff call we add one record together. It takes about 15 minutes, and there is nothing to do now. We never change your email.</small>
                </div>
              </>
            ) : (
              <div className="st-field">
                <span className="st-legend" id="names-label">Names you like</span>
                {draft.preferredNames.map((name, index) => (
                  <input
                    key={index}
                    aria-labelledby="names-label"
                    placeholder={index === 0 ? 'their business' : 'another name'}
                    value={name}
                    onChange={(event) => {
                      const preferredNames = draft.preferredNames.slice()
                      preferredNames[index] = event.target.value
                      setDraft((current) => ({ ...current, preferredNames }))
                    }}
                  />
                ))}
                {draft.preferredNames.length < 4 ? (
                  <button type="button" className="st-add" onClick={() => setDraft((current) => ({ ...current, preferredNames: [...current.preferredNames, ''] }))}>
                    Add another name
                  </button>
                ) : null}
                <small>Yakini registers one of these at sign-up ({tldSentence(catalog.domain.registerTlds)}), in your business&apos;s name. If we register it, it is already connected before the kickoff call. We still never touch your email.</small>
              </div>
            )}
          </section>
        ) : null}

        {step === 3 ? (
          <section>
            <div className="st-kicker"><span className="yk-eyebrow-dot" /> The honest timeline</div>
            <h1 className="st-h" tabIndex={-1} ref={headingRef}>Here&apos;s what happens, and how long it really takes.</h1>
            <p className="st-lead">We build your system with you, so it&apos;s built right. That takes a little while, and we&apos;d rather tell you now than surprise you later.</p>
            <div className="st-time">
              {timelineBlocks(address).map((block) => (
                <article key={block.title}>
                  <h2>{block.title}</h2>
                  <p>{block.body}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {step === 4 ? (
          <form onSubmit={onSubmit}>
            <div className="st-kicker"><span className="yk-eyebrow-dot" /> One total</div>
            <h1 className="st-h" tabIndex={-1} ref={headingRef}>Your true total.</h1>
            <p className="st-lead">One Yakini price, from the published plans. No card on this page. Nothing else is added here.</p>
            {pickedGrow.length ? (
              <p className="st-note">Grow is selected because of what you picked. Turn those features off on the previous step to choose Founding or Operate.</p>
            ) : null}
            <div className="st-plans">
              {plans.map((item) => {
                const blocked = item.id !== 'grow' && pickedGrow.length > 0
                return (
                  <label key={item.id} className="st-choice st-plan" aria-disabled={blocked}>
                    <input
                      type="radio"
                      name="plan"
                      checked={draft.planId === item.id}
                      disabled={blocked}
                      onChange={() => choosePlan(item.id)}
                    />
                    <span className="st-mark" aria-hidden />
                    <span>
                      {item.id === suggested ? <span className="st-fit">Fits what you picked</span> : null}
                      <h3>{item.name}</h3>
                      <p>
                        {formatCents(item.setupCents)} setup, once
                        {item.lockedMonths ? ` · price locked ${item.lockedMonths} months` : ''}
                        {item.id === 'founding' && seats?.open ? ` · ${seats.left} of ${seats.total} spots left` : ''}
                      </p>
                      <div className="st-price">{formatCents(item.priceCents)} <small>{item.interval === 'month' ? '/ month' : `/ ${item.interval}`}</small></div>
                    </span>
                  </label>
                )
              })}
            </div>
            {plan ? (
              <div className="st-total">
                <p className="st-due">Your Yakini total</p>
                <p className="st-big">{formatCents(plan.priceCents)} <span>a month</span></p>
                <p className="st-setup">+ {formatCents(plan.setupCents)} setup, once, collected on your kickoff call.</p>
                <p className="st-zero"><strong>Due today: $0.</strong> No card is charged. From {startDate}: {formatCents(plan.priceCents)} a month.</p>
              </div>
            ) : null}
            {plan ? (
              <>
                <p className="st-kicker">What&apos;s included</p>
                <ul className="st-includes">
                  <li>A Yakini person builds it with you, on your domain</li>
                  {includedLabels(catalog, plan, draft.featureIds).map((label) => <li key={label}>{label}</li>)}
                </ul>
              </>
            ) : null}
            <div className="st-contact">
              <h2>Where should we reach you?</h2>
              <p className="st-lead">A Yakini person uses this to schedule the kickoff call. No card fields, because card payments are not on yet.</p>
              <div className="st-fields">
                <Field id="name" label="Your name" autoComplete="name" value={draft.contact.name} onChange={(name) => setDraft((current) => ({ ...current, contact: { ...current.contact, name } }))} />
                <Field id="business" label="Business name" autoComplete="organization" value={draft.contact.businessName} onChange={(businessName) => setDraft((current) => ({ ...current, contact: { ...current.contact, businessName } }))} />
                <Field id="email" label="Email" type="email" autoComplete="email" value={draft.contact.email} onChange={(email) => setDraft((current) => ({ ...current, contact: { ...current.contact, email } }))} />
                <Field id="phone" label="Phone" type="tel" autoComplete="tel" value={draft.contact.phone} onChange={(phone) => setDraft((current) => ({ ...current, contact: { ...current.contact, phone } }))} />
              </div>
            </div>
            {error ? <p className="st-error" role="alert">{error}</p> : null}
            <div className="st-bar">
              <button type="button" className="st-btn" onClick={() => go(step - 1)}>Back</button>
              <button type="submit" className="st-btn st-btn-gold" disabled={busy}>
                {busy ? 'Reserving…' : 'Reserve my setup'}
              </button>
            </div>
          </form>
        ) : (
          <>
            {stepHint(step, draft, Boolean(domain)) ? <p className="st-note">{stepHint(step, draft, Boolean(domain))}</p> : null}
            <div className="st-bar">
              {step > 0 ? <button type="button" className="st-btn" onClick={() => go(step - 1)}>Back</button> : null}
              <button type="button" className="st-btn st-btn-gold" disabled={!stepReady} onClick={() => go(step + 1)}>Continue</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function stepHint(step: number, draft: Draft, domainOk: boolean): string | null {
  if (step === 0 && !draft.templateId) return 'Choose the closest fit to continue.'
  if (step === 2 && !domainOk) {
    return draft.domainKind === 'existing'
      ? 'Add the domain, and the address you want.'
      : 'Add at least one name you like.'
  }
  return null
}

function FeatureChoice({ feature, checked, onToggle }: { feature: CatalogFeature; checked: boolean; onToggle: (id: string) => void }) {
  return (
    <label className="st-choice">
      <input type="checkbox" checked={checked} onChange={() => onToggle(feature.id)} />
      <span className="st-mark" aria-hidden />
      <span>
        <h3>{feature.label}</h3>
        <p>{feature.detail}{feature.needs.length ? ' This needs your business texting line, and we include it when you tick this.' : ''}</p>
      </span>
    </label>
  )
}

function SoonCard({ feature }: { feature: CatalogFeature }) {
  if (!isComingSoon(feature) && feature.state === 'ask') return null
  return (
    <div className="st-soon" aria-disabled="true">
      <span className="st-pill">Coming soon</span>
      <h3>{feature.label}</h3>
      <p>{feature.detail}</p>
    </div>
  )
}

function Field({
  id, label, value, onChange, type = 'text', autoComplete,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  autoComplete?: string
}) {
  return (
    <div className="st-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} name={id} type={type} autoComplete={autoComplete} required value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}
