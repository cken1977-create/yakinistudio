'use client'

import { SiteShell } from '@/components/SiteShell'

// ═════════════════════════════════════════════════════════════════════════
// YAKINI PRICING PAGE — Launch / Operate (October 5, 2026)
// File: apps/yakini.digital/app/(marketing)/pricing/page.tsx
//
// Locked model: Launch Kit · Launch Operate · Launch Custom + Operate monthly.
// No room/house language. No Mission Control sold to clients.
// Client dashboard only. Assessment by invitation.
// ═════════════════════════════════════════════════════════════════════════

const LAUNCH_PRODUCTS = [
  {
    id: 'kit',
    name: 'Launch Kit',
    tagline: 'Fixed scope. Live in 2–4 weeks.',
    typical: '$10,000',
    range: '$8,000–$12,000',
    monthly: '$200–$400',
    monthlyNote: 'Hosting, monitoring, and care',
    description:
      'For operators who need institutional-grade infrastructure without agency pricing.',
    features: [
      'Private client portal: intake, timeline, alerts',
      'Built on our stack (Next.js / Supabase / Vercel)',
      'Your brand, your domain, your data',
      'Fixed scope. Live in 2–4 weeks',
    ],
    featured: false,
  },
  {
    id: 'operate',
    name: 'Launch Operate',
    tagline: 'Full product. Weekly rhythm. Client dashboard.',
    typical: '$22,000',
    range: '$18,000–$28,000',
    monthly: '$750–$1,500',
    monthlyNote: 'Weekly rhythm — not daily white-glove',
    description:
      'Everything in Launch Kit, plus a weekly operating rhythm with your team and a client dashboard. The operator cockpit stays internal.',
    features: [
      'Everything in Launch Kit',
      'Weekly rhythm with your team',
      'Client dashboard',
      'Monthly: $750–$1,500 — weekly rhythm, not daily white-glove',
    ],
    featured: true,
  },
]

const OPERATE_ROWS = [
  { shape: 'Launch Kit', monthly: '$200–$400' },
  { shape: 'Launch Operate', monthly: '$750–$1,500' },
  { shape: 'Launch Custom (care)', monthly: '$2,500–$4,000' },
]

const RULES = [
  'Discovery is paid. Always.',
  'Scope growth is a new quote — not a favor.',
  'Monthly is required on hosted work. One-time pricing exists only for throwaway marketing sites, which we mostly decline.',
  'Change in complexity = new band, not a renegotiation of the promise.',
]

export default function PricingPage() {
  return (
    <SiteShell>
      <style>{PAGE_CSS}</style>

      {/* ───── HEADER ───── */}
      <header className="yk-page-header pr-header">
        <div className="yk-page-header-inner">
          <div className="yk-eyebrow">
            <span className="yk-eyebrow-dot" />
            <span>TRANSPARENT PRICING</span>
          </div>
          <h1 className="yk-page-h1">
            Launch.
            <br />
            <span className="yk-gold">Operate.</span>
          </h1>
          <p className="yk-page-sub">
            We build your system, then we run it with you. Ranges, not fake precision.
          </p>
        </div>
      </header>

      {/* ───── LAUNCH PRODUCTS ───── */}
      <section className="yk-section pr-tiers">
        <div className="yk-section-inner">
          <div className="yk-section-tag">
            <span className="yk-num">01</span>
            <span>Launch — one-time</span>
          </div>
          <h2 className="yk-section-h2">
            Two product paths.
            <br />
            <span className="yk-gold">One operating philosophy.</span>
          </h2>

          <div className="pr-tiers-grid pr-tiers-grid-2">
            {LAUNCH_PRODUCTS.map((tier) => (
              <div
                key={tier.id}
                className={`pr-tier ${tier.featured ? 'pr-tier-featured' : ''}`}
              >
                {tier.featured && <div className="pr-tier-badge">FEATURED</div>}

                <div className="pr-tier-name">{tier.name}</div>
                <div className="pr-tier-tagline">{tier.tagline}</div>

                <div className="pr-tier-price-block">
                  <div className="pr-typical-label">Typical</div>
                  <div className="pr-tier-monthly">
                    <span className="pr-price-num pr-price-num-lg">{tier.typical}</span>
                  </div>
                  <div className="pr-price-note">Range {tier.range}</div>
                  <div className="pr-setup-block">
                    <div className="pr-setup-row">
                      <span className="pr-setup-label">Then monthly</span>
                      <span className="pr-setup-value">{tier.monthly}</span>
                    </div>
                    <div className="pr-price-note" style={{ marginTop: 8, marginBottom: 0 }}>
                      {tier.monthlyNote}
                    </div>
                  </div>
                </div>

                <p className="pr-tier-desc">{tier.description}</p>

                <a
                  href="/apply"
                  className={`pr-tier-cta ${tier.featured ? 'pr-cta-featured' : ''}`}
                >
                  <span>Start with {tier.name}</span>
                  <span className="yk-btn-arrow">→</span>
                </a>

                <div className="pr-tier-section">
                  <div className="pr-tier-section-h">INCLUDED</div>
                  <ul className="pr-tier-list pr-list-included">
                    {tier.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Launch Custom */}
          <div className="pr-custom-card">
            <div className="pr-custom-meta">
              <span className="pr-custom-dot" />
              <span>LAUNCH CUSTOM</span>
            </div>
            <h3 className="pr-custom-h">
              When spreadsheets are <span className="yk-italic">running the business.</span>
            </h3>
            <p className="pr-custom-body">
              Discovery first — always paid, two weeks. Half credits into Phase 1 if you continue.
              If you don&apos;t: you keep the <strong>roadmap</strong>.
            </p>

            <div className="pr-custom-grid">
              <div className="pr-custom-phase">
                <div className="pr-custom-phase-label">Discovery</div>
                <div className="pr-custom-phase-price">Typical $7,000</div>
                <div className="pr-custom-phase-range">$6,000–$8,000</div>
                <p>Half credits into Phase 1. Keep the roadmap either way.</p>
              </div>
              <div className="pr-custom-phase">
                <div className="pr-custom-phase-label">Phase 1</div>
                <div className="pr-custom-phase-price">Typical $50,000</div>
                <div className="pr-custom-phase-range">$40,000–$60,000</div>
                <p>Replace the spreadsheet core.</p>
              </div>
              <div className="pr-custom-phase">
                <div className="pr-custom-phase-label">Phase 2</div>
                <div className="pr-custom-phase-price">Typical $25,000</div>
                <div className="pr-custom-phase-range">$20,000–$35,000</div>
                <p>Integrations, reporting, handoff.</p>
              </div>
              <div className="pr-custom-phase">
                <div className="pr-custom-phase-label">Care</div>
                <div className="pr-custom-phase-price">$2,500–$4,000</div>
                <div className="pr-custom-phase-range">per month</div>
                <p>Hosting, iteration, support.</p>
              </div>
            </div>

            <div className="pr-custom-note">
              Year-one cash for a mid-market ops install: <strong>~$75,000–$120,000</strong> against
              $90,000–$200,000 in DIY/agency cost. We take the job when the savings worksheet clears
              more than the fee in year one.
            </div>

            <a href="/apply" className="pr-tier-cta pr-cta-featured" style={{ alignSelf: 'flex-start' }}>
              <span>Start with Discovery</span>
              <span className="yk-btn-arrow">→</span>
            </a>
          </div>
        </div>
      </section>

      {/* ───── OPERATE ───── */}
      <section className="yk-section pr-operate">
        <div className="yk-section-inner">
          <div className="yk-section-tag">
            <span className="yk-num">02</span>
            <span>Operate — monthly</span>
          </div>
          <h2 className="yk-section-h2">
            Required on hosted work.
            <br />
            <span className="yk-gold">We don&apos;t launch and leave.</span>
          </h2>
          <p className="pr-operate-lead">
            Software you don&apos;t operate is software that rots. Monthly covers hosting, monitoring,
            care, weekly rhythm, and iteration — not tickets.
          </p>

          <div className="pr-table-wrapper">
            <table className="pr-table">
              <thead>
                <tr>
                  <th>Shape</th>
                  <th>Monthly</th>
                </tr>
              </thead>
              <tbody>
                {OPERATE_ROWS.map((row) => (
                  <tr key={row.shape}>
                    <td className="pr-feature-cell">{row.shape}</td>
                    <td>
                      <span className="pr-cell-text pr-cell-price">{row.monthly}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="pr-table-footnote">
            Set at launch from complexity (data, users, integrations, compliance).
          </p>
        </div>
      </section>

      {/* ───── RULES ───── */}
      <section className="yk-section pr-rules">
        <div className="yk-section-inner">
          <div className="yk-section-tag">
            <span className="yk-num">03</span>
            <span>The rules</span>
          </div>
          <h2 className="yk-section-h2">
            How engagements
            <br />
            <span className="yk-gold">stay clean.</span>
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

      {/* ───── BY INVITATION ───── */}
      <section className="yk-section pr-invite">
        <div className="yk-section-inner">
          <div className="pr-invite-card">
            <div className="pr-invite-meta">
              <span className="pr-invite-dot" />
              <span>BY INVITATION</span>
            </div>
            <h3 className="pr-invite-h">
              Readiness Assessment
            </h3>
            <p className="pr-invite-body">
              Priced per engagement. Available by invitation until product canon is frozen.
            </p>
          </div>
        </div>
      </section>

      {/* ───── MISSION-ALIGNED (brief) ───── */}
      <section className="yk-section pr-nonprofits">
        <div className="yk-section-inner">
          <div className="pr-nonprofits-card pr-nonprofits-card-brief">
            <div className="pr-nonprofits-meta">
              <span className="pr-nonprofits-dot" />
              <span>MISSION-ALIGNED</span>
            </div>
            <h3 className="pr-nonprofits-h">
              Nonprofits and mission-driven organizations.
            </h3>
            <p className="pr-nonprofits-body">
              For 501(c)(3) organizations and community-serving nonprofits, pricing is structured
              around your mission and operational reality — not standard commercial rates. The
              architecture standards do not change.
            </p>
            <a href="/apply" className="pr-tier-cta pr-cta-featured" style={{ alignSelf: 'flex-start' }}>
              <span>Start the conversation</span>
              <span className="yk-btn-arrow">→</span>
            </a>
          </div>
        </div>
      </section>

      {/* ───── FAQ ───── */}
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
                What&apos;s the difference between Launch Kit and Launch Operate?
                <span className="pr-faq-icon">+</span>
              </summary>
              <div className="pr-faq-a">
                Launch Kit is fixed-scope product delivery: portal, intake, timeline, alerts —
                live in 2–4 weeks. Launch Operate includes everything in Kit, plus a weekly
                operating rhythm with your team and a client dashboard. Monthly on Operate is
                higher because we run with you, not just host the software.
              </div>
            </details>

            <details className="pr-faq-item">
              <summary className="pr-faq-q">
                Why is discovery paid on Custom?
                <span className="pr-faq-icon">+</span>
              </summary>
              <div className="pr-faq-a">
                Discovery qualifies the work and produces a roadmap you keep whether or not you
                continue. Half of the discovery fee credits into Phase 1 if you proceed. Unpaid
                discovery invites scope theater; paid discovery keeps both sides honest.
              </div>
            </details>

            <details className="pr-faq-item">
              <summary className="pr-faq-q">
                What does the monthly fee cover?
                <span className="pr-faq-icon">+</span>
              </summary>
              <div className="pr-faq-a">
                Hosting, monitoring, and care. On Launch Operate and Custom care, it also covers
                weekly operating rhythm and iteration — not a ticket queue. Software you
                don&apos;t operate is software that rots. We don&apos;t launch and leave.
              </div>
            </details>

            <details className="pr-faq-item">
              <summary className="pr-faq-q">
                Can I buy a one-time build with no monthly?
                <span className="pr-faq-icon">+</span>
              </summary>
              <div className="pr-faq-a">
                Only for throwaway marketing sites, which we mostly decline. Hosted product work
                requires monthly. Scope growth is a new quote — not a favor.
              </div>
            </details>

            <details className="pr-faq-item">
              <summary className="pr-faq-q">
                How do you pick a number inside the range?
                <span className="pr-faq-icon">+</span>
              </summary>
              <div className="pr-faq-a">
                Midpoints are typical anchors. The band moves with complexity: data, users,
                integrations, and compliance. A change in complexity is a new band — not a
                renegotiation of the promise.
              </div>
            </details>

            <details className="pr-faq-item">
              <summary className="pr-faq-q">
                When do you take a Custom job?
                <span className="pr-faq-icon">+</span>
              </summary>
              <div className="pr-faq-a">
                When the savings worksheet clears more than the fee in year one. If Phase 1
                alone doesn&apos;t clear that bar on paper, we shrink scope or decline.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* ───── FINAL CTA ───── */}
      <section className="yk-section pr-final">
        <div className="yk-section-inner">
          <div className="pr-final-content">
            <h2 className="pr-final-h2">
              Start with a
              <br />
              <span className="yk-gold yk-italic">conversation.</span>
            </h2>
            <p className="pr-final-sub">
              Tell us what you&apos;re operating — we&apos;ll tell you honestly whether it&apos;s a
              Kit, Operate, Custom, or not a fit.
            </p>
            <div className="pr-final-ctas">
              <a href="/apply" className="pr-tier-cta pr-cta-featured">
                <span>Apply</span>
                <span className="yk-btn-arrow">→</span>
              </a>
              <a href="/process" className="pr-tier-cta">
                <span>See how we build</span>
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

  /* ═══ LAUNCH CUSTOM ═══ */
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
`
