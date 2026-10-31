"use client"

import Link from 'next/link'
import { SiteShell } from '@/components/SiteShell'
import { SEAT_CSS, SeatMeter, useFoundingSeats } from '@/components/FoundingSeats'
import {
  BILLING_NOTE,
  EXTRA_HELP_NOTE,
  HELP_HOURS_NOTE,
  AI_LIMIT_NOTE,
  FLAT_PRICING_NOTE,
  GUIDED_STEPS,
  PARTNER,
  PASS_THROUGH_NOTE,
  PITCH,
  PLANS,
  PLAN_MODULES,
  REFUND_RULE,
  helpLabel,
  monthlyLabel,
  priceLabel,
  setupLabel,
  startUrl,
} from '@/lib/pricing'

export default function PricingPage() {
  const seats = useFoundingSeats()
  const [operate, grow, founding] = PLANS

  return (
    <SiteShell>
      <style>{PAGE_CSS + SEAT_CSS + NEW_CSS}</style>

      <header className="yk-page-header pr-header">
        <div className="yk-page-header-inner">
          <div className="yk-eyebrow">
            <span className="yk-eyebrow-dot" />
            <span>PRICING · GUIDED SETUP</span>
          </div>
          <h1 className="yk-page-h1">
            A real person sets it up with you.
            <br />
            <span className="yk-gold">And stays.</span>
          </h1>
          <p className="yk-page-sub">{PITCH}</p>
          <div className="pn-hero-ctas">
            <a href="#plans" className="pr-tier-cta pr-cta-featured"><span>See the plans</span><span className="yk-btn-arrow">→</span></a>
            <a href={startUrl(founding.id)} className="pr-tier-cta"><span>{seats.open ? `Founding: ${seats.left} of ${seats.total} spots left` : 'Founding is closed'}</span><span className="yk-btn-arrow">→</span></a>
          </div>
        </div>
      </header>

      <section className="pn-portal" aria-label="What you get: the Yakini portal">
        <div className="yk-section-inner pn-portal-inner">
          <p className="pn-portal-lead">Every plan is the <strong>Yakini portal</strong>, your business workspace, set up with you:</p>
          <ul className="pn-portal-list">
            <li><strong>Client rooms</strong><span>One private room per client</span></li>
            <li><strong>Texting line</strong><span>For customers who opted in</span></li>
            <li><strong>Help desk</strong><span>With a real Yakini person</span></li>
            <li><strong>Drafted replies</strong><span>Nothing goes out without your OK</span></li>
          </ul>
          <Link href="/#portal" className="pn-portal-link">Take the portal tour →</Link>
        </div>
      </section>

      <section id="plans" className="yk-section pr-tiers">
        <div className="yk-section-inner">
          <div className="yk-section-tag">
            <span className="yk-num">01</span>
            <span>The plans</span>
          </div>
          <h2 className="yk-section-h2">
            Done with you,
            <br />
            <span className="yk-gold">not left to you.</span>
          </h2>
          <p className="pr-operate-lead">{BILLING_NOTE} {EXTRA_HELP_NOTE} {HELP_HOURS_NOTE}</p>

          <div className="pn-grid">
            {PLANS.map((plan) => {
              const isFounding = plan.id === 'founding'
              const closed = isFounding && !seats.open
              return (
                <div key={plan.id} id={plan.id} className={`pr-tier pn-tier ${isFounding ? 'pn-founding' : ''} ${closed ? 'pn-closed' : ''}`}>
                  <div className="pn-tag">{plan.tag}</div>
                  <div className="pr-tier-name">{plan.name}</div>
                  <div className="pr-tier-tagline">{plan.summary}</div>
                  <div className="pn-price">
                    <span className="pn-price-num">{monthlyLabel(plan).replace('/mo', '')}</span>
                    <span className="pn-price-per">/month</span>
                  </div>
                  <div className="pn-setup">+ {setupLabel(plan)} one-time guided setup{plan.lockedMonths ? ` · locked ${plan.lockedMonths} months` : ''}</div>
                  {isFounding ? <SeatMeter seats={seats} /> : null}
                  <ul className="pr-tier-list pr-list-included pn-list">
                    <li>{helpLabel(plan)} from your Yakini person (unused hours don’t roll over)</li>
                    {plan.includes.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  {closed ? (
                    <span className="pr-tier-cta pn-cta-off"><span>Closed</span></span>
                  ) : (
                    <a href={startUrl(plan.id)} className={`pr-tier-cta ${isFounding || plan.id === 'grow' ? 'pr-cta-featured' : ''}`}>
                      <span>Start with {plan.name}</span>
                      <span className="yk-btn-arrow">→</span>
                    </a>
                  )}
                </div>
              )
            })}
          </div>

          <p className="pn-refund"><strong>Refunds:</strong> {REFUND_RULE} Cancel the monthly plan any time.</p>

          <h3 className="pr-subhead">Side by side</h3>
          <p className="pr-compare-hint">Swipe sideways to compare the plans.</p>
          <div className="pr-compare-wrap">
            <table className="pr-compare">
              <thead>
                <tr>
                  <th scope="col">What you get</th>
                  {PLANS.map((plan) => (
                    <th key={plan.id} scope="col">
                      {plan.name}
                      <span className="pr-compare-price">{priceLabel(plan)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Help each month from your Yakini person (expires at month end)</th>
                  {PLANS.map((plan) => <td key={plan.id}>{plan.helpHours} hr</td>)}
                </tr>
                <tr>
                  <th scope="row">Monthly price locked</th>
                  {PLANS.map((plan) => <td key={plan.id}>{plan.lockedMonths ? `${plan.lockedMonths} months` : '—'}</td>)}
                </tr>
                {PLAN_MODULES.map((module) => (
                  <tr key={module.plain}>
                    <th scope="row">{module.plain}</th>
                    {PLANS.map((plan) => {
                      const included = plan.id === 'grow' ? module.grow : module.operate
                      return <td key={plan.id}>{included ? <Mark yes /> : <Mark />}</td>
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="yk-section pr-operate">
        <div className="yk-section-inner">
          <div className="yk-section-tag">
            <span className="yk-num">02</span>
            <span>How guided setup works</span>
          </div>
          <h2 className="yk-section-h2">
            Four steps.
            <br />
            <span className="yk-gold">One real person.</span>
          </h2>
          <ol className="pn-steps">
            {GUIDED_STEPS.map((step, i) => (
              <li key={step.title}>
                <span className="pn-step-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="pn-step-title">{step.title}</span>
                <span className="pn-step-detail">{step.detail}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="yk-section pr-faq">
        <div className="yk-section-inner">
          <div className="yk-section-tag">
            <span className="yk-num">03</span>
            <span>Questions</span>
          </div>
          <h2 className="yk-section-h2">
            Pricing
            <br />
            <span className="yk-gold">FAQ.</span>
          </h2>

          <div className="pr-faq-list">
            <details className="pr-faq-item">
              <summary className="pr-faq-q">What is the difference between Operate and Grow?<span className="pr-faq-icon">+</span></summary>
              <div className="pr-faq-a">
                Operate is {priceLabel(operate)} with {helpLabel(operate)}. It is your website and customer portal, help desk, voice notes,
                drafted replies that wait for your OK, a business texting line, booking you confirm, and incoming texts in one place.
                Grow is {priceLabel(grow)} with {helpLabel(grow)}, and adds card payments, missed-call text-back, review requests,
                follow-up campaigns and a monthly owner report. {HELP_HOURS_NOTE} {AI_LIMIT_NOTE}
              </div>
            </details>
            <details className="pr-faq-item">
              <summary className="pr-faq-q">What is the Founding plan?<span className="pr-faq-icon">+</span></summary>
              <div className="pr-faq-a">
                Founding is everything in Operate for {monthlyLabel(founding)}, with the monthly price locked for {founding.lockedMonths} months, plus
                the {setupLabel(founding)} guided setup. It is for our first {founding.spots?.total} customers only and closes on its own after the last spot.
                {seats.open ? ` Right now ${seats.left} of ${seats.total} spots are left.` : ' All spots are taken.'}
              </div>
            </details>
            <details className="pr-faq-item">
              <summary className="pr-faq-q">When am I charged?<span className="pr-faq-icon">+</span></summary>
              <div className="pr-faq-a">{BILLING_NOTE} The first monthly charge is 30 days after you sign up, then monthly. {REFUND_RULE}</div>
            </details>
            <details className="pr-faq-item">
              <summary className="pr-faq-q">What if I need more help than my plan includes?<span className="pr-faq-icon">+</span></summary>
              <div className="pr-faq-a">{HELP_HOURS_NOTE} {EXTRA_HELP_NOTE}</div>
            </details>
            <details className="pr-faq-item">
              <summary className="pr-faq-q">Is this do-it-yourself?<span className="pr-faq-icon">+</span></summary>
              <div className="pr-faq-a">No. A real Yakini person sets everything up with you and stays with you after go-live, with a help desk you can reach any time. That is why we price the way we do.</div>
            </details>
            <details className="pr-faq-item">
              <summary className="pr-faq-q">Who pays for hosting, the texting line and payment processing?<span className="pr-faq-icon">+</span></summary>
              <div className="pr-faq-a">{PASS_THROUGH_NOTE} {FLAT_PRICING_NOTE}</div>
            </details>
            <details className="pr-faq-item">
              <summary className="pr-faq-q">I need something custom.<span className="pr-faq-icon">+</span></summary>
              <div className="pr-faq-a">Custom builds, such as lead engines and payment systems, are priced on the work and agreed in writing before anything starts. <a href="/custom-builds" className="yk-gold">See custom builds</a> or <a href={PARTNER.href} className="yk-gold">book a call →</a></div>
            </details>
          </div>
        </div>
      </section>

      <section className="yk-section pr-final">
        <div className="yk-section-inner">
          <div className="pr-final-content">
            <h2 className="pr-final-h2">
              Ready when
              <br />
              <span className="yk-gold yk-italic">you are.</span>
            </h2>
            <p className="pr-final-sub">Pick a plan and a real Yakini person takes it from there, with you.</p>
            <div className="pr-final-ctas">
              <a href={startUrl()} className="pr-tier-cta pr-cta-featured">
                <span>Start your setup</span>
                <span className="yk-btn-arrow">→</span>
              </a>
              <a href={PARTNER.href} className="pr-tier-cta">
                <span>Talk to a person first</span>
                <span className="yk-btn-arrow">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  )
}

function Mark({ yes = false }: { yes?: boolean }) {
  return (
    <span className={yes ? 'pr-mark pr-mark-yes' : 'pr-mark pr-mark-no'}>
      {yes ? 'Included' : 'Not included'}
    </span>
  )
}

const PAGE_CSS = `
  /* ═══ HEADER ═══ */
  .pr-header {
    background: linear-gradient(180deg, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.9) 100%), none center center / cover no-repeat;
    min-height: 520px;
    position: relative;
  }

  /* ═══ TIERS GRID ═══ */
  .pr-tiers {
    background: var(--navy-deep);
  }
  .pr-tiers-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    margin-bottom: 48px;
  }
  .pr-tiers-grid-2 {
    grid-template-columns: repeat(2, 1fr);
    max-width: 960px;
  }
  @media (max-width: 900px) {
    .pr-tiers-grid,
    .pr-tiers-grid-2 { grid-template-columns: 1fr; }
  }
  .pr-tier {
    background: rgba(11,20,55,0.03);
    border: 1px solid var(--line);
    padding: 40px 32px;
    position: relative;
    display: flex;
    flex-direction: column;
  }
  .pr-tier-featured {
    border: 2px solid var(--gold);
    background: linear-gradient(135deg, rgba(22,56,232,0.05) 0%, rgba(11,20,55,0.03) 100%);
    transform: translateY(-8px);
  }
  @media (max-width: 900px) {
    .pr-tier-featured { transform: none; }
  }
  .pr-tier-badge {
    position: absolute;
    top: -14px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--gold);
    color: var(--black);
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.25em;
    padding: 6px 16px;
  }
  .pr-tier-name {
    font-family: var(--font-display);
    font-size: 32px;
    font-weight: 500;
    color: var(--cream);
    margin-bottom: 8px;
    letter-spacing: -0.01em;
  }
  .pr-tier-tagline {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 16px;
    color: var(--gold);
    margin-bottom: 24px;
    line-height: 1.4;
  }
  .pr-tier-price-block {
    padding: 24px 0;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
    margin-bottom: 24px;
  }
  .pr-typical-label {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.22em;
    color: var(--gold);
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .pr-tier-monthly {
    display: flex;
    align-items: baseline;
    gap: 2px;
    margin-bottom: 8px;
  }
  .pr-price-num {
    font-family: var(--font-display);
    font-size: 44px;
    font-weight: 500;
    color: var(--cream);
    line-height: 1;
  }
  .pr-price-num-lg {
    font-size: clamp(36px, 4vw, 48px);
  }
  .pr-price-note {
    font-size: 12px;
    font-style: italic;
    color: var(--muted);
    margin-bottom: 16px;
  }
  .pr-setup-block {
    padding-top: 12px;
    border-top: 1px dashed var(--line);
  }
  .pr-setup-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 6px 0;
    font-size: 13px;
  }
  .pr-setup-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.2em;
    color: var(--muted);
    text-transform: uppercase;
  }
  .pr-setup-value {
    font-family: var(--font-display);
    color: var(--gold);
    font-weight: 500;
    font-size: 18px;
  }
  .pr-tier-desc {
    font-size: 14px;
    line-height: 1.7;
    color: var(--muted);
    margin-bottom: 24px;
  }
  .pr-tier-cta {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 22px;
    background: transparent;
    border: 1px solid var(--gold);
    color: var(--gold);
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    text-decoration: none;
    transition: all 0.2s;
    margin-bottom: 32px;
  }
  .pr-tier-cta:hover {
    background: var(--gold);
    color: var(--black);
  }
  .pr-cta-featured {
    background: var(--gold);
    color: var(--black);
  }
  .pr-cta-featured:hover {
    background: var(--cream);
    color: var(--black);
  }
  .pr-tier-section {
    margin-bottom: 24px;
  }
  .pr-tier-section-h {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.25em;
    color: var(--gold);
    text-transform: uppercase;
    margin-bottom: 12px;
  }
  .pr-tier-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .pr-tier-list li {
    padding: 6px 0 6px 18px;
    position: relative;
    font-size: 13px;
    line-height: 1.6;
    color: var(--cream);
  }
  .pr-list-included li::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: var(--gold);
    font-weight: 700;
  }

  /* ═══ PARTNER ═══ */
  .pr-custom-card {
    padding: 48px;
    background: linear-gradient(135deg, rgba(22,56,232,0.05) 0%, rgba(11,20,55,0.03) 100%);
    border: 1px solid var(--gold);
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .pr-custom-meta {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 6px 14px;
    border: 1px solid var(--gold);
    color: var(--gold);
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.25em;
    margin-bottom: 24px;
    text-transform: uppercase;
    align-self: flex-start;
  }
  .pr-custom-dot {
    width: 6px;
    height: 6px;
    background: var(--gold);
    border-radius: 50%;
  }
  .pr-custom-h {
    font-family: var(--font-display);
    font-size: clamp(28px, 3.6vw, 40px);
    font-weight: 500;
    line-height: 1.15;
    color: var(--cream);
    margin-bottom: 16px;
    letter-spacing: -0.02em;
  }
  .pr-custom-body {
    font-size: 16px;
    line-height: 1.8;
    color: var(--cream);
    margin-bottom: 32px;
    max-width: 720px;
  }
  .pr-custom-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 28px;
    padding: 28px 0;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
  }
  @media (max-width: 900px) {
    .pr-custom-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 560px) {
    .pr-custom-grid { grid-template-columns: 1fr; }
    .pr-custom-card { padding: 32px 24px; }
  }
  .pr-custom-phase-label {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.22em;
    color: var(--gold);
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .pr-custom-phase-price {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 500;
    color: var(--cream);
    margin-bottom: 4px;
  }
  .pr-custom-phase-range {
    font-size: 13px;
    color: var(--muted);
    margin-bottom: 10px;
  }
  .pr-custom-phase p {
    font-size: 13px;
    line-height: 1.6;
    color: var(--muted);
  }
  .pr-custom-note {
    font-size: 14px;
    line-height: 1.7;
    color: var(--cream);
    margin-bottom: 28px;
    padding: 20px;
    background: rgba(11,20,55,0.05);
    border-left: 2px solid var(--gold);
  }

  /* ═══ OPERATE ═══ */
  .pr-operate {
    background: linear-gradient(180deg, var(--navy-deep) 0%, var(--black) 100%);
  }
  .pr-operate-lead {
    font-size: 16px;
    line-height: 1.7;
    color: var(--cream);
    max-width: 640px;
    margin-bottom: 36px;
  }

  /* ═══ RULES ═══ */
  .pr-rules {
    background: var(--black);
  }
  .pr-rules-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0;
    border-top: 1px solid var(--line);
  }
  .pr-rules-list li {
    display: flex;
    gap: 24px;
    align-items: flex-start;
    padding: 28px 0;
    border-bottom: 1px solid var(--line);
    font-size: 16px;
    line-height: 1.6;
    color: var(--cream);
  }
  .pr-rules-num {
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.18em;
    color: var(--gold);
    flex-shrink: 0;
    padding-top: 2px;
  }

  /* ═══ BY INVITATION ═══ */
  .pr-invite {
    background: var(--navy-deep);
  }
  .pr-invite-card {
    padding: 40px 48px;
    background: rgba(11,20,55,0.03);
    border: 1px solid var(--line);
    max-width: 720px;
  }
  .pr-invite-meta {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 6px 14px;
    border: 1px solid var(--line);
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.25em;
    margin-bottom: 20px;
    text-transform: uppercase;
  }
  .pr-invite-dot {
    width: 6px;
    height: 6px;
    background: var(--muted);
    border-radius: 50%;
  }
  .pr-invite-h {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 500;
    color: var(--cream);
    margin-bottom: 12px;
  }
  .pr-invite-body {
    font-size: 15px;
    line-height: 1.7;
    color: var(--muted);
  }

  /* ═══ TABLE ═══ */
  .pr-table-wrapper {
    overflow-x: auto;
    border: 1px solid var(--line);
    background: rgba(11,20,55,0.03);
    max-width: 640px;
  }
  .pr-table {
    width: 100%;
    border-collapse: collapse;
  }
  .pr-table th, .pr-table td {
    padding: 16px 20px;
    text-align: left;
    border-bottom: 1px solid var(--line);
    font-size: 14px;
  }
  .pr-table th {
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 500;
    color: var(--cream);
    background: rgba(11,20,55,0.04);
    border-bottom: 2px solid var(--line-strong);
  }
  .pr-feature-cell {
    color: var(--cream);
    font-weight: 500;
  }
  .pr-cell-text {
    color: var(--cream);
  }
  .pr-cell-price {
    color: var(--gold);
    font-family: var(--font-display);
    font-size: 18px;
    font-weight: 500;
  }
  .pr-table-footnote {
    margin-top: 20px;
    font-style: italic;
    font-size: 14px;
    color: var(--muted);
  }

  /* ═══ NONPROFITS / MISSION-ALIGNED ═══ */
  .pr-nonprofits {
    background: linear-gradient(180deg, var(--navy-deep) 0%, var(--black-soft, var(--black)) 100%);
  }
  .pr-nonprofits-card {
    padding: 48px;
    background: linear-gradient(135deg, rgba(22,56,232,0.05) 0%, rgba(11,20,55,0.03) 100%);
    border: 1px solid var(--gold);
    position: relative;
    max-width: 900px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
  }
  .pr-nonprofits-card-brief {
    padding: 40px 48px;
  }
  .pr-nonprofits-meta {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 6px 14px;
    border: 1px solid var(--gold);
    color: var(--gold);
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.25em;
    margin-bottom: 24px;
    text-transform: uppercase;
    align-self: flex-start;
  }
  .pr-nonprofits-dot {
    width: 6px; height: 6px;
    background: var(--gold);
    border-radius: 50%;
  }
  .pr-nonprofits-h {
    font-family: var(--font-display);
    font-size: clamp(24px, 3vw, 36px);
    font-weight: 500;
    line-height: 1.15;
    color: var(--cream);
    margin-bottom: 16px;
    letter-spacing: -0.02em;
  }
  .pr-nonprofits-body {
    font-size: 15px;
    line-height: 1.8;
    color: var(--cream);
    margin-bottom: 28px;
    max-width: 640px;
  }
  @media (max-width: 700px) {
    .pr-nonprofits-card,
    .pr-nonprofits-card-brief { padding: 32px 24px; }
  }

  /* ═══ FAQ ═══ */
  .pr-faq { background: var(--black); }
  .pr-faq-list {
    display: flex;
    flex-direction: column;
    border-top: 1px solid var(--line);
  }
  .pr-faq-item {
    border-bottom: 1px solid var(--line);
    transition: background 0.2s;
  }
  .pr-faq-item:hover {
    background: rgba(22,56,232,0.02);
  }
  .pr-faq-q {
    cursor: pointer;
    padding: 28px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 24px;
    font-family: var(--font-display);
    font-size: clamp(20px, 2.4vw, 28px);
    font-weight: 500;
    color: var(--cream);
    list-style: none;
    line-height: 1.4;
  }
  .pr-faq-q::-webkit-details-marker { display: none; }
  .pr-faq-icon {
    font-family: var(--font-display);
    font-size: 28px;
    color: var(--gold);
    transition: transform 0.3s;
    flex-shrink: 0;
  }
  details[open] .pr-faq-icon { transform: rotate(45deg); }
  .pr-faq-a {
    padding: 0 0 28px;
    font-size: 15px;
    line-height: 1.8;
    color: var(--muted);
    max-width: 80ch;
  }

  /* ═══ FINAL CTA ═══ */
  .pr-final {
    background: linear-gradient(180deg, var(--black) 0%, var(--navy-deep) 100%);
    text-align: center;
  }
  .pr-final-content { max-width: 900px; margin: 0 auto; }
  .pr-final-h2 {
    font-family: var(--font-display);
    font-size: clamp(48px, 7vw, 96px);
    line-height: 1;
    font-weight: 400;
    letter-spacing: -0.02em;
    color: var(--cream);
    margin-bottom: 32px;
  }
  .pr-final-sub {
    font-size: 18px;
    line-height: 1.7;
    color: var(--muted);
    max-width: 640px;
    margin: 0 auto 48px;
  }
  .pr-final-ctas {
    display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;
  }

  .pr-table-wide { max-width: 880px; }
  .pr-pass { margin-top: 28px; max-width: 760px; }
  .pr-summary { margin-top: 48px; }

  .pr-subhead {
    font-family: var(--font-display);
    font-size: clamp(28px, 3vw, 40px);
    font-weight: 500;
    color: var(--cream);
    margin: 56px 0 12px;
  }
  .pr-compare-hint {
    display: none;
    margin: 0 0 10px;
    font-size: 13px;
    color: var(--muted);
  }
  .pr-compare-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border: 1px solid var(--line);
    background: rgba(11,20,55,0.03);
  }
  .pr-compare {
    width: 100%;
    min-width: 640px;
    border-collapse: collapse;
  }
  .pr-compare th, .pr-compare td {
    padding: 14px 16px;
    border-bottom: 1px solid var(--line);
    text-align: left;
    vertical-align: top;
    font-size: 14px;
    line-height: 1.5;
  }
  .pr-compare thead th {
    font-family: var(--font-display);
    font-size: 18px;
    font-weight: 500;
    color: var(--cream);
    background: rgba(11,20,55,0.04);
  }
  .pr-compare tbody th {
    color: var(--cream);
    font-weight: 500;
    width: 56%;
  }
  .pr-compare td { text-align: center; }
  .pr-compare-price {
    display: block;
    margin-top: 4px;
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    color: var(--gold);
  }
  .pr-mark {
    display: inline-block;
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .pr-mark-yes { color: var(--gold); }
  .pr-mark-yes::before { content: '✓ '; }
  .pr-mark-no { color: var(--muted); }
  .pr-know {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-top: 36px;
  }
  .pr-know-card {
    border: 1px solid var(--line);
    background: rgba(11,20,55,0.03);
    padding: 28px 24px;
  }
  .pr-know-card h3 {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 12px;
  }
  .pr-know-card p, .pr-know-copy {
    font-size: 15px;
    line-height: 1.7;
    color: var(--cream);
  }
  .pr-know-note {
    margin-top: 12px;
    color: var(--muted) !important;
    font-size: 14px !important;
  }
  .pr-gap-list, .pr-account-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .pr-gap-list li {
    padding: 12px 0;
    border-top: 1px solid var(--line);
  }
  .pr-gap-list p {
    margin-bottom: 6px;
  }
  .pr-gap-list a {
    color: var(--gold);
    font-family: var(--font-mono);
    font-size: 12px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    text-decoration: none;
  }
  .pr-gap-list a:hover { color: var(--cream); }
  .pr-account-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 14px;
  }
  .pr-account-list li {
    border: 1px solid var(--line);
    padding: 8px 12px;
    color: var(--cream);
    font-size: 14px;
  }
  @media (max-width: 800px) {
    .pr-know { grid-template-columns: 1fr; }
    .pr-compare-hint { display: block; }
    .pr-compare tbody th {
      position: sticky;
      left: 0;
      background: #0A0908;
      z-index: 1;
      min-width: 180px;
    }
  }
`

const NEW_CSS = `
  .pn-portal { padding: 40px 24px; background: var(--black-soft); border-bottom: 1px solid var(--line); }
  .pn-portal-inner { display: grid; gap: 20px; }
  .pn-portal-lead { font-size: 17px; color: rgba(11,20,55,0.8); }
  .pn-portal-lead strong { color: var(--gold); font-weight: 600; }
  .pn-portal-list { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--line); border: 1px solid var(--line); }
  .pn-portal-list li { background: var(--black-soft); padding: 18px 16px; display: flex; flex-direction: column; gap: 4px; }
  .pn-portal-list strong { font-family: var(--font-display); font-weight: 500; font-size: 22px; color: var(--cream); }
  .pn-portal-list span { font-size: 13px; color: var(--muted); }
  .pn-portal-link { color: var(--gold); font-size: 15px; }
  @media (min-width: 900px) { .pn-portal-list { grid-template-columns: repeat(4, 1fr); } .pn-portal { padding: 48px 32px; } }
  .pn-hero-ctas { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 32px; }
  .pn-hero-ctas .pr-tier-cta { margin-top: 0; }
  .pn-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 32px; align-items: stretch; }
  @media (max-width: 1200px) { .pn-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 700px) { .pn-grid { grid-template-columns: 1fr; } }
  .pn-tier { padding: 34px 28px; border-radius: 4px; transition: transform .25s ease, border-color .25s ease; }
  .pn-tier:hover { transform: translateY(-4px); border-color: rgba(22,56,232,0.5); }
  .pn-founding { border: 2px solid var(--gold); background: linear-gradient(160deg, rgba(22,56,232,0.14) 0%, rgba(11,20,55,0.03) 60%); box-shadow: 0 30px 80px -40px rgba(22,56,232,0.55); }
  .pn-closed { opacity: .55; }
  .pn-partner { border-style: dashed; }
  .pn-tag { font-family: var(--font-mono); font-size: 10px; letter-spacing: .28em; text-transform: uppercase; color: var(--gold); margin-bottom: 14px; }
  .pn-price { display: flex; align-items: baseline; gap: 8px; margin-top: 18px; }
  .pn-price-num { font-family: var(--font-display); font-size: 56px; line-height: 1; color: var(--cream); letter-spacing: -0.02em; }
  .pn-price-per { color: rgba(11,20,55,0.74); font-size: 16px; }
  .pn-setup { margin-top: 8px; color: rgba(11,20,55,0.74); font-size: 14px; }
  .pn-list { margin: 22px 0 8px; flex: 1; }
  .pn-partner-line { font-family: var(--font-display); font-size: 26px; color: var(--cream); margin: 6px 0 12px; }
  .pn-cta-push { margin-top: auto; }
  .pn-cta-off { opacity: .6; cursor: not-allowed; }
  .pn-refund { border-left: 3px solid var(--gold); background: rgba(22,56,232,0.08); padding: 16px 20px; color: var(--cream); margin: 8px 0 48px; font-size: 16px; }
  .pn-steps { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 40px; }
  @media (max-width: 900px) { .pn-steps { grid-template-columns: 1fr; } }
  .pn-steps li { border: 1px solid var(--line); padding: 26px; display: flex; flex-direction: column; gap: 10px; }
  .pn-step-num { font-family: var(--font-display); font-size: 36px; color: var(--gold); }
  .pn-step-title { font-size: 19px; color: var(--cream); font-weight: 600; }
  .pn-step-detail { color: rgba(11,20,55,0.74); font-size: 15px; line-height: 1.6; }
`
