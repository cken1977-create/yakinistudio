'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { businessLabel, filterBusinesses, resolveTemplate } from '@/lib/orders/businesses'
import {
  domainFromDraft,
  emptyDraft,
  formatCents,
  growOnlyIds,
  includedLabels,
  intakeFromDraft,
  monthlyLabel,
  monthlyStartLabel,
  publicPlans,
  suggestHostname,
  suggestPlanId,
  timelineBlocks,
  tldSentence,
  toggleFeature,
  type Catalog,
  type Draft,
  type FoundingSeats,
} from '@/lib/orders/logic'
import { ADDON_SECTION, SHOWCASE, addonPriceText, addonSummaryHeading, categoryForItem, itemStatus, rowStatusLabel, showcaseItems, type FeatureStatus, type ShowcaseItem } from '@/lib/orders/showcase'
import { ADDON_PLAN_LINE, INCLUDED_NOT_ADDONS, PLAN_HIGHLIGHTS, PRICE_PROMISE, REFUND_RULE, SEE_BEFORE_YOU_PAY, SETUP_INCLUDES } from '@/lib/pricing'

const STEPS = ['Business', 'Features', 'Domain', 'Timeline', 'Total'] as const

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
  const [bizQuery, setBizQuery] = useState('')
  const [openCats, setOpenCats] = useState<string[]>(['ai', ADDON_SECTION.id])
  const headingRef = useRef<HTMLHeadingElement>(null)
  const moved = useRef(false)

  useEffect(() => {
    if (!moved.current) return
    headingRef.current?.focus()
  }, [step, done])

  const businesses = useMemo(() => filterBusinesses(bizQuery), [bizQuery])
  const growOnly = useMemo(() => growOnlyIds(catalog), [catalog])
  const businessOk = Boolean(draft.businessId && draft.templateId) && (draft.businessId !== 'other' || draft.businessOther.trim().length >= 2)
  const pickedGrow = draft.featureIds.filter((id) => growOnly.has(id))
  const plan = plans.find((item) => item.id === draft.planId) ?? null
  const domain = domainFromDraft(draft, catalog.domain.defaultKind)
  const address = domain?.kind === 'existing' ? domain.hostname : domain?.kind === 'register' ? 'the domain we register for you' : ''
  const suggested = suggestPlanId(catalog, draft.featureIds, seats)
  const startDate = monthlyStartLabel()
  const chosenAddons = useMemo(
    () => showcaseItems().filter((entry) => draft.addonIds.includes(entry.id) && itemStatus(entry, catalog) === 'addon'),
    [catalog, draft.addonIds],
  )

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

  function onToggleAddon(id: string) {
    setDraft((current) => ({
      ...current,
      addonIds: current.addonIds.includes(id)
        ? current.addonIds.filter((item) => item !== id)
        : [...current.addonIds, id],
    }))
  }

  function choosePlan(id: string) {
    if (id !== 'grow' && draft.featureIds.some((featureId) => growOnly.has(featureId))) return
    setDraft((current) => ({ ...current, planId: id, planTouched: true }))
  }

  function pickBusiness(id: string) {
    setDraft((current) => ({
      ...current,
      businessId: id,
      templateId: resolveTemplate(id, catalog),
      businessOther: id === 'other' ? current.businessOther : '',
    }))
  }

  const stepReady = [
    businessOk,
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
          <p className="st-operator">Built by a real operator.</p>
          <dl className="st-recap">
            <div><dt>Business</dt><dd>{draft.contact.businessName}</dd></div>
            <div><dt>Kind</dt><dd>{businessLabel(draft.businessId, draft.businessOther) || template?.label}</dd></div>
            <div><dt>Plan</dt><dd>{plan ? `${plan.name} · ${monthlyLabel(plan)}` : ''}</dd></div>
            {chosenAddons.length ? (
              <div>
                <dt>Add-ons</dt>
                <dd>
                  {chosenAddons.map((entry) => `${entry.name} (${addonPriceText(entry)})`).join(', ')}. Priced with you on your kickoff call. Not part of the plan total.
                </dd>
              </div>
            ) : null}
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
            <p className="st-reassurance">{SEE_BEFORE_YOU_PAY}</p>
            <p className="st-lead">Search or tap the closest fit. A real Yakini person builds the system with you, on your own domain.</p>
            <div className="st-field">
              <label htmlFor="biz-search">Search business types</label>
              <input
                id="biz-search"
                type="search"
                placeholder="Try plumber, salon, dental…"
                value={bizQuery}
                onChange={(event) => setBizQuery(event.target.value)}
              />
            </div>
            <div className="st-biz-grid">
              {businesses.map((business) => (
                <button
                  key={business.id}
                  type="button"
                  className={`st-biz ${draft.businessId === business.id ? 'on' : ''}`}
                  aria-pressed={draft.businessId === business.id}
                  onClick={() => pickBusiness(business.id)}
                >
                  {business.label}
                </button>
              ))}
            </div>
            {draft.businessId === 'other' ? (
              <div className="st-field">
                <label htmlFor="biz-other">What do you do?</label>
                <input
                  id="biz-other"
                  value={draft.businessOther}
                  placeholder="Tell us in a few words"
                  onChange={(event) => setDraft((current) => ({ ...current, businessOther: event.target.value }))}
                />
              </div>
            ) : null}
          </section>
        ) : null}

        {step === 1 ? (
          <section>
            <div className="st-kicker"><span className="yk-eyebrow-dot" /> Your system</div>
            <h1 className="st-h" tabIndex={-1} ref={headingRef}>What should it do?</h1>
            <p className="st-lead">Tick what is included today. Coming soon is on the roadmap, with no date. Add-ons are extra, and each one is priced with you.</p>
            <p className="st-count">
              <strong>{draft.featureIds.length}</strong> included in your setup
              {draft.addonIds.length ? <> · <strong>{chosenAddons.length}</strong> add-ons, priced with you</> : null}
            </p>
            {SHOWCASE.map((category) => {
              const rows = category.items.filter((entry) => itemStatus(entry, catalog) !== 'addon')
              if (!rows.length) return null
              const open = openCats.includes(category.id)
              return (
                <article key={category.id} className="st-cat">
                  <button
                    type="button"
                    className="st-cat-h"
                    aria-expanded={open}
                    onClick={() => setOpenCats((current) => current.includes(category.id) ? current.filter((id) => id !== category.id) : [...current, category.id])}
                  >
                    <CatIcon id={category.id} />
                    <span>
                      <h2>{category.title}</h2>
                      <small>{rows.filter((entry) => itemStatus(entry, catalog) === 'included').length} live today</small>
                    </span>
                  </button>
                  {open ? (
                    <>
                      {category.lede ? <p className="st-lede">{category.lede}</p> : null}
                      <div className="st-list">
                        {rows.map((entry) => (
                          <FeatureRow
                            key={entry.id}
                            entry={entry}
                            status={itemStatus(entry, catalog)}
                            checked={Boolean(entry.moduleId && draft.featureIds.includes(entry.moduleId))}
                            grow={Boolean(entry.moduleId && growOnly.has(entry.moduleId))}
                            onToggle={onToggle}
                          />
                        ))}
                      </div>
                    </>
                  ) : null}
                </article>
              )
            })}
            <AddonSection
              catalog={catalog}
              open={openCats.includes(ADDON_SECTION.id)}
              selected={draft.addonIds}
              onOpen={() => setOpenCats((current) => current.includes(ADDON_SECTION.id) ? current.filter((id) => id !== ADDON_SECTION.id) : [...current, ADDON_SECTION.id])}
              onToggle={onToggleAddon}
            />
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
            <h1 className="st-h" tabIndex={-1} ref={headingRef}>Built by a real operator.</h1>
            <p className="st-lead">Here&apos;s what happens, and how long it really takes. We build your system with you, so it&apos;s built right. That takes a little while, and we&apos;d rather tell you now than surprise you later.</p>
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
            <aside className="st-promise">
              <h2>{PRICE_PROMISE.title}</h2>
              <p>{PRICE_PROMISE.body}</p>
            </aside>
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
                      {item.id in PLAN_HIGHLIGHTS ? <p className="st-who">{PLAN_HIGHLIGHTS[item.id as keyof typeof PLAN_HIGHLIGHTS].tagline}</p> : null}
                      <div className="st-price">{formatCents(item.priceCents)} <small>{item.interval === 'month' ? '/ month' : `/ ${item.interval}`}</small></div>
                      <p className="st-setup-line">
                        {formatCents(item.setupCents)} setup, once
                        {item.lockedMonths ? ` · locked ${item.lockedMonths} months` : ''}
                        {item.id === 'founding' && seats?.open ? ` · ${seats.left} of ${seats.total} spots left` : ''}
                      </p>
                      {item.id in PLAN_HIGHLIGHTS ? (
                        <ul className="st-bullets">
                          {PLAN_HIGHLIGHTS[item.id as keyof typeof PLAN_HIGHLIGHTS].bullets.map((line) => <li key={line}>{line}</li>)}
                        </ul>
                      ) : null}
                      {item.id in PLAN_HIGHLIGHTS ? <p className="st-more">{ADDON_PLAN_LINE}</p> : null}
                    </span>
                  </label>
                )
              })}
            </div>
            {plan ? (
              <div className="st-pay">
                <p className="st-reassurance">{SEE_BEFORE_YOU_PAY}</p>
                <div className="st-pay-grid">
                  <div className="st-total">
                    <p className="st-due">Your Yakini total</p>
                    <p className="st-big">{formatCents(plan.priceCents)} <span>a month</span></p>
                    <p className="st-setup">+ {formatCents(plan.setupCents)} setup, once, collected on your kickoff call.</p>
                    <p className="st-zero"><strong>Due today: $0.</strong> No card is charged. From {startDate}: {formatCents(plan.priceCents)} a month.</p>
                  </div>
                  <aside className="st-setup-list">
                    <h2>What your $499 setup includes</h2>
                    <ul>
                      {SETUP_INCLUDES.map((line) => <li key={line}>{line}</li>)}
                    </ul>
                    <p>{REFUND_RULE}</p>
                  </aside>
                </div>
              </div>
            ) : null}
            {chosenAddons.length ? (
              <aside className="st-picked">
                <h2>{addonSummaryHeading(chosenAddons)}</h2>
                <ul>
                  {chosenAddons.map((entry) => (
                    <li key={entry.id}>{entry.name} · {addonPriceText(entry)}</li>
                  ))}
                </ul>
                <p>Not part of your Yakini total. The plan price above stays the same.</p>
              </aside>
            ) : null}
            <aside className="st-addons">
              <h2>Included, not an add-on</h2>
              <ul>
                {INCLUDED_NOT_ADDONS.map((line) => <li key={line}>{line}</li>)}
              </ul>
            </aside>
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
  if (step === 0 && draft.businessId === 'other' && draft.businessOther.trim().length < 2) return 'Tell us what you do to continue.'
  if (step === 2 && !domainOk) {
    return draft.domainKind === 'existing'
      ? 'Add the domain, and the address you want.'
      : 'Add at least one name you like.'
  }
  return null
}

function AddonSection({
  catalog, open, selected, onOpen, onToggle,
}: {
  catalog: Catalog
  open: boolean
  selected: string[]
  onOpen: () => void
  onToggle: (id: string) => void
}) {
  const rows = showcaseItems().filter((entry) => itemStatus(entry, catalog) === 'addon')
  if (!rows.length) return null
  return (
    <article className="st-cat st-cat-addons">
      <button type="button" className="st-cat-h" aria-expanded={open} onClick={onOpen}>
        <CatIcon id={ADDON_SECTION.id} />
        <span>
          <h2>{ADDON_SECTION.title}</h2>
          <small>{rows.length} extra, priced with you</small>
        </span>
      </button>
      {open ? (
        <>
          <p className="st-lede">{ADDON_SECTION.lede}</p>
          <div className="st-list">
            {rows.map((entry, index) => {
              const group = categoryForItem(entry.id)?.title ?? ''
              const previous = index > 0 ? (categoryForItem(rows[index - 1].id)?.title ?? '') : ''
              const showGroup = group !== previous
              return (
                <div key={entry.id}>
                  {showGroup ? <p className="st-addon-group">{group}</p> : null}
                  <FeatureRow
                    entry={entry}
                    status="addon"
                    checked={selected.includes(entry.id)}
                    grow={false}
                    onToggle={onToggle}
                  />
                </div>
              )
            })}
          </div>
        </>
      ) : null}
    </article>
  )
}

function FeatureRow({
  entry, status, checked, grow, onToggle,
}: {
  entry: ShowcaseItem
  status: FeatureStatus
  checked: boolean
  grow: boolean
  onToggle: (id: string) => void
}) {
  const body = (
    <span>
      <span className={`st-pill st-pill-${status}`}>{rowStatusLabel(entry, status)}</span>
      {grow && status === 'included' ? <span className="st-pill st-pill-grow">Part of Grow</span> : null}
      <h3>{entry.name}</h3>
      <p>{entry.detail}</p>
      {status === 'addon' ? <p className="st-price-note">{addonPriceText(entry)}</p> : null}
      {entry.points.length ? <ul className="st-points">{entry.points.map((point) => <li key={point}>{point}</li>)}</ul> : null}
    </span>
  )
  if (status === 'addon') {
    return (
      <label className={`st-feat st-feat-addon ${checked ? 'on' : ''}`}>
        <input type="checkbox" checked={checked} onChange={() => onToggle(entry.id)} />
        {body}
      </label>
    )
  }
  if (status !== 'included' || !entry.moduleId) {
    return <div className={`st-feat st-feat-${status}`} aria-disabled="true">{body}</div>
  }
  return (
    <label className={`st-feat st-feat-included ${checked ? 'on' : ''}`}>
      <input type="checkbox" checked={checked} onChange={() => onToggle(entry.moduleId!)} />
      {body}
    </label>
  )
}

function CatIcon({ id }: { id: string }) {
  const paths: Record<string, string> = {
    ai: 'M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z',
    calls: 'M8 5h3l1 3-2 1a8 8 0 004 4l1-2 3 1v3a2 2 0 01-2 2A12 12 0 016 7a2 2 0 012-2z',
    booking: 'M6 5h12v14H6zM9 3v4M15 3v4M6 9h12',
    inbox: 'M4 7h16v10H4zM4 7l8 6 8-6',
    reviews: 'M12 4l2 4 4 .5-3 3 .8 4.5L12 14l-3.8 2 .8-4.5-3-3L10 8z',
    payments: 'M4 8h16v8H4zM4 11h16',
    marketing: 'M5 12l7-7 7 3v8l-7 3-7-7z',
    web: 'M4 6h16v12H4zM4 10h16M8 6v4',
    reports: 'M6 18V10M12 18V6M18 18v-5',
    integrations: 'M8 8h3v3H8zM13 13h3v3h-3zM11 9.5h2M14.5 11v2',
    desk: 'M5 16V8h14v8M8 16v2M16 16v2M9 11h6',
    addons: 'M12 5v14M5 12h14',
  }
  return (
    <svg className="st-ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[id] || paths.desk} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
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
