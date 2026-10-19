'use client'

import { SiteShell } from '@/components/SiteShell'
import {
  CUSTOM_OFFER,
  FLAT_PRICING_NOTE,
  KIT_INCLUDES,
  KIT_TIERS,
  PASS_THROUGH_NOTE,
  PORTAL_SIGNUP_URL,
  SELF_SERVE_PLANS,
  SELF_SERVE_SETUP_NOTE,
  formatUsd,
  kitMonthlyLabel,
  kitSetupLabel,
  selfServeMonthlyLabel,
  selfServePriceLabel,
  selfServeSetupLabel,
} from '@/lib/pricing'

const RULES = [
  FLAT_PRICING_NOTE,
  PASS_THROUGH_NOTE,
  'Crew, Staff, and House have a six-month minimum.',
  'Custom kit builds are quoted separately.',
  'The first conversation is a free 30-minute Drag Audit.',
]

export default function PricingPage() {
  const operate = SELF_SERVE_PLANS[0]
  const operatePlus = SELF_SERVE_PLANS[1]

  return (
    <SiteShell>
      <style>{PAGE_CSS}</style>

      <header className="yk-page-header pr-header">
        <div className="yk-page-header-inner">
          <div className="yk-eyebrow">
            <span className="yk-eyebrow-dot" />
            <span>PRICING</span>
          </div>
          <h1 className="yk-page-h1">
            One price list.
            <br />
            <span className="yk-gold">Flat.</span>
          </h1>
          <p className="yk-page-sub">
            A self-serve plan, a fully built kit, or a custom build.
            Yakini does not take a share of revenue.
          </p>
        </div>
      </header>

      <section className="yk-section pr-tiers">
        <div className="yk-section-inner">
          <div className="yk-section-tag">
            <span className="yk-num">01</span>
            <span>Self-serve plans</span>
          </div>
          <h2 className="yk-section-h2">
            Sign up and start.
            <br />
            <span className="yk-gold">A Yakini operator sets it up.</span>
          </h2>
          <p className="pr-operate-lead">
            Businesses sign up at the portal and get their own client portal on the plan they choose.
            {` ${SELF_SERVE_SETUP_NOTE}`}
          </p>

          <div className="pr-tiers-grid pr-tiers-grid-2">
            {SELF_SERVE_PLANS.map((plan) => (
              <div key={plan.id} className="pr-tier">
                <div className="pr-tier-name">{plan.name}</div>
                <div className="pr-tier-tagline">{plan.summary}</div>

                <div className="pr-tier-price-block">
                  <div className="pr-typical-label">Setup</div>
                  <div className="pr-tier-monthly">
                    <span className="pr-price-num pr-price-num-lg">{selfServeSetupLabel(plan)}</span>
                  </div>
                  <div className="pr-setup-block">
                    <div className="pr-setup-row">
                      <span className="pr-setup-label">Then monthly</span>
                      <span className="pr-setup-value">{selfServeMonthlyLabel(plan)}</span>
                    </div>
                  </div>
                  <div className="pr-price-note" style={{ marginTop: 12, marginBottom: 0 }}>
                    One-time operator setup
                  </div>
                </div>

                <a
                  href={PORTAL_SIGNUP_URL}
                  className="pr-tier-cta pr-cta-featured"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>Sign up</span>
                  <span className="yk-btn-arrow">→</span>
                </a>

                <div className="pr-tier-section">
                  <div className="pr-tier-section-h">INCLUDED</div>
                  <ul className="pr-tier-list pr-list-included">
                    {plan.includes.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="pr-custom-note pr-pass">
            {PASS_THROUGH_NOTE}
          </div>
        </div>
      </section>

      <section className="yk-section pr-operate">
        <div className="yk-section-inner">
          <div className="yk-section-tag">
            <span className="yk-num">02</span>
            <span>Fully built kits</span>
          </div>
          <h2 className="yk-section-h2">
            We build it with you.
            <br />
            <span className="yk-gold">You own it.</span>
          </h2>
          <p className="pr-operate-lead">
            Setup once, then a monthly retainer. Every kit includes Composer and Sentinel.
            A person approves every release.
          </p>

          <div className="pr-tiers-grid">
            {KIT_TIERS.map((tier) => (
              <div key={tier.id} className="pr-tier">
                <div className="pr-tier-name">{tier.name}</div>
                <div className="pr-tier-tagline">{tier.forWho}</div>

                <div className="pr-tier-price-block">
                  <div className="pr-typical-label">{tier.from ? 'Setup from' : 'Setup'}</div>
                  <div className="pr-tier-monthly">
                    <span className="pr-price-num pr-price-num-lg">{formatUsd(tier.setup)}</span>
                  </div>
                  <div className="pr-setup-block">
                    <div className="pr-setup-row">
                      <span className="pr-setup-label">{tier.from ? 'Monthly from' : 'Monthly'}</span>
                      <span className="pr-setup-value">{formatUsd(tier.monthly)}/mo</span>
                    </div>
                  </div>
                  {tier.minimumMonths ? (
                    <div className="pr-price-note" style={{ marginTop: 12, marginBottom: 0 }}>
                      {tier.minimumMonths}-month minimum
                    </div>
                  ) : null}
                </div>

                <a href={`/apply?tier=${tier.id}`} className="pr-tier-cta">
                  <span>Apply for {tier.name}</span>
                  <span className="yk-btn-arrow">→</span>
                </a>
              </div>
            ))}
          </div>

          <div className="pr-tier-section">
            <div className="pr-tier-section-h">EVERY KIT INCLUDES</div>
            <ul className="pr-tier-list pr-list-included">
              {KIT_INCLUDES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="pr-summary">
            <div className="pr-table-wrapper pr-table-wide">
              <table className="pr-table">
                <thead>
                  <tr>
                    <th>Offer</th>
                    <th>Setup</th>
                    <th>Monthly</th>
                  </tr>
                </thead>
                <tbody>
                  {SELF_SERVE_PLANS.map((plan) => (
                    <tr key={plan.id}>
                      <td className="pr-feature-cell">{plan.name}</td>
                      <td><span className="pr-cell-text pr-cell-price">{selfServeSetupLabel(plan)}</span></td>
                      <td><span className="pr-cell-text pr-cell-price">{selfServeMonthlyLabel(plan)}</span></td>
                    </tr>
                  ))}
                  {KIT_TIERS.map((tier) => (
                    <tr key={tier.id}>
                      <td className="pr-feature-cell">
                        {tier.name}
                        {tier.minimumMonths ? ' · 6-month minimum' : ''}
                      </td>
                      <td><span className="pr-cell-text pr-cell-price">{kitSetupLabel(tier)}</span></td>
                      <td><span className="pr-cell-text pr-cell-price">{kitMonthlyLabel(tier)}</span></td>
                    </tr>
                  ))}
                  <tr>
                    <td className="pr-feature-cell">{CUSTOM_OFFER.name}</td>
                    <td><span className="pr-cell-text">Quoted</span></td>
                    <td><span className="pr-cell-text">Quoted</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="pr-table-footnote">{PASS_THROUGH_NOTE}</p>
          </div>
        </div>
      </section>

      <section className="yk-section pr-rules">
        <div className="yk-section-inner">
          <div className="pr-custom-card">
            <div className="pr-custom-meta">
              <span className="pr-custom-dot" />
              <span>CUSTOM KIT</span>
            </div>
            <h3 className="pr-custom-h">
              Built for the job in front of you.
              <br />
              <span className="yk-italic">Quoted separately.</span>
            </h3>
            <p className="pr-custom-body">
              Custom kit builds do not have a public price. Tell us what you run and we will quote the work.
              Nonprofit and mission work is quoted the same way: case by case, with no published rate.
            </p>
            <a href="/apply?tier=custom" className="pr-tier-cta pr-cta-featured" style={{ alignSelf: 'flex-start' }}>
              <span>Apply for a quote</span>
              <span className="yk-btn-arrow">→</span>
            </a>
          </div>
        </div>
      </section>

      <section className="yk-section pr-invite">
        <div className="yk-section-inner">
          <div className="yk-section-tag">
            <span className="yk-num">03</span>
            <span>The rules</span>
          </div>
          <h2 className="yk-section-h2">
            How the price
            <br />
            <span className="yk-gold">stays clean.</span>
          </h2>
          <ol className="pr-rules-list">
            {RULES.map((rule, i) => (
              <li key={rule}>
                <span className="pr-rules-num">{String(i + 1).padStart(2, '0')}</span>
                <span>{rule}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="yk-section pr-faq">
        <div className="yk-section-inner">
          <div className="yk-section-tag">
            <span className="yk-num">04</span>
            <span>Questions</span>
          </div>
          <h2 className="yk-section-h2">
            Pricing
            <br />
            <span className="yk-gold">FAQ.</span>
          </h2>

          <div className="pr-faq-list">
            <details className="pr-faq-item">
              <summary className="pr-faq-q">
                What is the difference between Operate and Operate Plus?
                <span className="pr-faq-icon">+</span>
              </summary>
              <div className="pr-faq-a">
                Operate is {selfServePriceLabel(operate)}. It is the client portal, help desk,
                voice notes, drafted replies that wait for your OK, opt-in text alerts, a booking
                page you confirm, and incoming texts in the customer&apos;s thread. Operate Plus is{' '}
                {selfServePriceLabel(operatePlus)} and adds card payments, missed-call text-back
                for your approval, review requests, campaigns to opted-in customers, and a monthly
                owner report. The setup fee is one time. A Yakini operator sets either plan up.
              </div>
            </details>

            <details className="pr-faq-item">
              <summary className="pr-faq-q">
                What is the difference between a self-serve plan and a kit?
                <span className="pr-faq-icon">+</span>
              </summary>
              <div className="pr-faq-a">
                A self-serve plan starts at {selfServePriceLabel(operate)}. You sign up at the
                portal. A kit is a system Yakini builds with you: setup plus a monthly retainer,
                from {kitSetupLabel(KIT_TIERS[0])} and {kitMonthlyLabel(KIT_TIERS[0])}. Every kit
                includes Composer and Sentinel, a person approves every release, and you own the
                system. Crew and above have a six-month minimum.
              </div>
            </details>

            <details className="pr-faq-item">
              <summary className="pr-faq-q">
                Do you take a share of revenue?
                <span className="pr-faq-icon">+</span>
              </summary>
              <div className="pr-faq-a">
                No. {FLAT_PRICING_NOTE} The price on this page is the price.
              </div>
            </details>

            <details className="pr-faq-item">
              <summary className="pr-faq-q">
                Who pays for Supabase, Vercel, Twilio, Stripe, the domain, and email?
                <span className="pr-faq-icon">+</span>
              </summary>
              <div className="pr-faq-a">
                You do. {PASS_THROUGH_NOTE}
              </div>
            </details>

            <details className="pr-faq-item">
              <summary className="pr-faq-q">
                How do I get a custom price?
                <span className="pr-faq-icon">+</span>
              </summary>
              <div className="pr-faq-a">
                Apply. Custom kit builds are quoted per project. There is no public number for that work.
              </div>
            </details>
          </div>
        </div>
      </section>

      <section className="yk-section pr-final">
        <div className="yk-section-inner">
          <div className="pr-final-content">
            <h2 className="pr-final-h2">
              Start with a
              <br />
              <span className="yk-gold yk-italic">plan, a kit, or a quote.</span>
            </h2>
            <p className="pr-final-sub">
              Sign up for Operate or Operate Plus, apply for a kit, or ask for a custom quote.
              The Drag Audit is free.
            </p>
            <div className="pr-final-ctas">
              <a href={PORTAL_SIGNUP_URL} className="pr-tier-cta pr-cta-featured" target="_blank" rel="noopener noreferrer">
                <span>Sign up</span>
                <span className="yk-btn-arrow">→</span>
              </a>
              <a href="/apply" className="pr-tier-cta">
                <span>Apply</span>
                <span className="yk-btn-arrow">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  )
}

const PAGE_CSS = `
  /* ═══ HEADER ═══ */
  .pr-header {
    background: linear-gradient(180deg, rgba(10, 9, 8, 0.20) 0%, rgba(10, 9, 8, 0.40) 100%), url('/yakini-pricing-bg.jpg') center center / cover no-repeat;
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
    background: rgba(255,255,255,0.02);
    border: 1px solid var(--line);
    padding: 40px 32px;
    position: relative;
    display: flex;
    flex-direction: column;
  }
  .pr-tier-featured {
    border: 2px solid var(--gold);
    background: linear-gradient(135deg, rgba(200, 168, 75, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
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

  /* ═══ CUSTOM KIT ═══ */
  .pr-custom-card {
    padding: 48px;
    background: linear-gradient(135deg, rgba(200, 168, 75, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
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
    background: rgba(0,0,0,0.2);
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
    background: rgba(255,255,255,0.02);
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
    background: rgba(255,255,255,0.02);
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
    background: rgba(255,255,255,0.03);
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
    background: linear-gradient(135deg, rgba(200, 168, 75, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
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
    background: rgba(200, 168, 75, 0.02);
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
`
