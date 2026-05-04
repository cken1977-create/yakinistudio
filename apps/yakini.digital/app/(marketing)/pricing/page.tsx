'use client'

import { useState } from 'react'
import { SiteShell } from '@/components/SiteShell'

// ═════════════════════════════════════════════════════════════════════════
// YAKINI PRICING PAGE — v2 (May 4, 2026)
// File: apps/yakini.digital/app/(marketing)/pricing/page.tsx
//
// v2 changes:
//   - Foundation: monthly is now a range ($500-750) reflecting maintenance scope
//   - Authority: setup raised to $6,500; monthly range ($1,500-2,000)
//   - Intelligence + Enterprise: contact-for-pricing (no public numbers)
//   - NEW: Nonprofits as a distinct mission-aligned section (below comparison)
//   - Yakini Intelligence is now in EVERY tier (Lite/Standard/Pro/Custom)
//   - Build & Own footnote — one-time ownership pricing available on request
// ═════════════════════════════════════════════════════════════════════════

// Commercial tiers — render in the 4-column grid
const TIERS = [
  {
    id: 'foundation',
    name: 'Foundation',
    tagline: 'Built right from day one.',
    description: 'Custom branded site with the Yakini foundation: real architecture, real design, real ownership. Perfect for founders who want to start serious from day one.',
    setup: 2500,
    monthlyMin: 500,
    monthlyMax: 750,
    monthlySubtitle: 'Varies by ongoing maintenance scope',
    minTerm: 3,
    aiTier: 'Yakini Intelligence Lite',
    features: [
      'Custom branded marketing site',
      'Mobile-first responsive design',
      'Lead capture form + email pipeline',
      'Brand identity foundation (logo, palette, typography)',
      'SEO foundations (meta, sitemap, schema)',
      'Google Analytics 4 setup',
      'Independent infrastructure (your domain, your data)',
      'Yakini Intelligence Lite — embedded AI assistant trained on your content + brand voice',
      'Monthly platform updates + maintenance',
      'Email + chat support (24-48hr response)',
    ],
    notIncluded: [
      'Customer portal or admin dashboard',
      'Multi-tenant database',
      'Payment processing integrations',
      'Specialized AI workflow tools (booking, comms, case triage)',
    ],
    bestFor: 'Solo founders, consultants, service providers launching their first serious online presence.',
    color: 'gold',
    featured: false,
    contactForPricing: false,
    contactCta: null,
  },
  {
    id: 'authority',
    name: 'Authority',
    tagline: 'A real platform. Not just a website.',
    description: 'Multi-section platform with database, lead pipeline, and basic admin tooling. The most popular tier for growing service businesses ready to scale ops.',
    setup: 6500,
    monthlyMin: 1500,
    monthlyMax: 2000,
    monthlySubtitle: 'Varies by ongoing maintenance scope',
    minTerm: 6,
    aiTier: 'Yakini Intelligence Standard',
    features: [
      'Everything in Foundation, plus:',
      'Multi-section platform with custom database',
      'Lead pipeline + capture system',
      'Booking or appointment system',
      'Customer portal (basic auth + view-only)',
      'Brand assets package (social templates, email signatures)',
      'Yakini Intelligence Standard — embedded AI + booking assistant + customer comms drafter',
      'Content strategy + monthly content updates',
      'Priority support (same-day response)',
      'Quarterly performance reviews',
      'Up to 2 platform feature updates per quarter',
    ],
    notIncluded: [
      'Full Yakini Intelligence suite (Pro tier)',
      'Custom workflow automation',
      'Advanced multi-tenant architecture',
    ],
    bestFor: 'Service businesses, consultants, small agencies, hospitality operators, professional service firms.',
    color: 'gold',
    featured: false,
    contactForPricing: false,
    contactCta: null,
  },
  {
    id: 'intelligence',
    name: 'Intelligence',
    tagline: 'AI baked into the foundation.',
    description: 'Custom platform configured for your industry, with the full Yakini Intelligence Pro suite integrated into your workflow. This is what we built for Garland\'s tow defense service. This is the tier that turns competitors into followers.',
    contactForPricing: true,
    contactCta: 'Contact about Intelligence',
    minTerm: 12,
    aiTier: 'Yakini Intelligence Pro',
    features: [
      'Everything in Authority, plus:',
      'Yakini Intelligence Pro — full 6-tool suite (Case Triage, Letter Generation, Hearing Prep, License Verification, Customer Comms, Strategic Analysis)',
      'Industry-specific AI configuration',
      'Custom admin command center',
      'Customer portal with magic-link auth',
      'Multi-tenant database architecture',
      'Workflow automation (status updates, notifications, revenue tracking)',
      'Email + SMS communication pipeline',
      'Strategic AI refinement (monthly tuning)',
      'Direct line to your build team (Slack channel)',
      'Up to 4 platform feature updates per quarter',
      'Dedicated success partner',
    ],
    notIncluded: [
      'Multi-platform integrations (Salesforce, HubSpot, etc.)',
      'White-label reseller infrastructure',
    ],
    bestFor: 'Serious operators in regulated industries (legal, medical, energy, transportation, hospitality) who want AI-powered competitive advantage.',
    color: 'electric',
    featured: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Built for companies with infrastructure ambitions.',
    description: 'Full-custom platform development with multi-tenant architecture, integrations, and enterprise-grade ops. For founders who are building a category-defining business.',
    contactForPricing: true,
    contactCta: 'Contact about Enterprise',
    minTerm: 12,
    aiTier: 'Yakini Intelligence Custom',
    features: [
      'Everything in Intelligence, plus:',
      'Yakini Intelligence Custom — bespoke AI tools built for your specific operational workflow',
      'Full custom architecture for your industry',
      'Multi-tenant + multi-brand support',
      'Third-party integrations (Salesforce, HubSpot, custom APIs)',
      'White-label reseller infrastructure (sell to your own clients)',
      'Advanced analytics + business intelligence dashboards',
      'Custom AI fine-tuning on your data',
      'Compliance + audit-ready architecture',
      'Dedicated build team',
      'Quarterly strategic reviews with founder',
      'Unlimited feature updates',
      'Priority emergency support (24/7)',
    ],
    notIncluded: [],
    bestFor: 'Companies building category-defining platforms. Multi-state operators. Franchise systems. Consortiums. Holdings companies.',
    color: 'gold',
    featured: false,
  },
]

const COMPARISON_FEATURES = [
  { name: 'Custom branded site', tiers: { foundation: true, authority: true, intelligence: true, enterprise: true } },
  { name: 'Mobile-responsive design', tiers: { foundation: true, authority: true, intelligence: true, enterprise: true } },
  { name: 'Independent infrastructure', tiers: { foundation: true, authority: true, intelligence: true, enterprise: true } },
  { name: 'Lead capture + email pipeline', tiers: { foundation: true, authority: true, intelligence: true, enterprise: true } },
  { name: 'Custom database architecture', tiers: { foundation: false, authority: true, intelligence: true, enterprise: true } },
  { name: 'Customer portal', tiers: { foundation: false, authority: 'Basic', intelligence: 'Full + Auth', enterprise: 'Multi-tenant' } },
  { name: 'Admin command center', tiers: { foundation: false, authority: 'Basic', intelligence: 'Custom', enterprise: 'Full Custom' } },
  { name: 'Yakini Intelligence', tiers: { foundation: 'Lite', authority: 'Standard', intelligence: 'Pro (6 tools)', enterprise: 'Custom' } },
  { name: 'Workflow automation', tiers: { foundation: false, authority: false, intelligence: true, enterprise: 'Advanced' } },
  { name: 'Multi-tenant architecture', tiers: { foundation: false, authority: false, intelligence: true, enterprise: 'White-label' } },
  { name: 'Third-party integrations', tiers: { foundation: false, authority: false, intelligence: false, enterprise: true } },
  { name: 'Custom AI fine-tuning', tiers: { foundation: false, authority: false, intelligence: false, enterprise: true } },
  { name: 'Support response time', tiers: { foundation: '24-48h', authority: 'Same day', intelligence: 'Slack channel', enterprise: '24/7 emergency' } },
  { name: 'Feature updates per quarter', tiers: { foundation: 'Maintenance', authority: '2', intelligence: '4', enterprise: 'Unlimited' } },
  { name: 'Minimum term', tiers: { foundation: '3 months', authority: '6 months', intelligence: '12 months', enterprise: '12 months' } },
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)

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
            Real platforms.
            <br />
            <span className="yk-italic">Real prices.</span>
            <br />
            <span className="yk-gold">Nothing hidden.</span>
          </h1>
          <p className="yk-page-sub">
            Most agencies hide pricing because their numbers can't survive scrutiny.
            We publish ours because the work justifies them.
            Setup costs, monthly retainers, what's included, what's not — all public.
          </p>
          <p className="pr-page-sub-italic">
            Every Yakini engagement includes Yakini Intelligence. The depth scales with the tier.
          </p>
        </div>
      </header>

      {/* ───── BILLING TOGGLE ───── */}
      <section className="pr-toggle-section">
        <div className="yk-section-inner">
          <div className="pr-toggle-wrapper">
            <button
              className={`pr-toggle-btn ${!annual ? 'active' : ''}`}
              onClick={() => setAnnual(false)}
            >
              Monthly
            </button>
            <button
              className={`pr-toggle-btn ${annual ? 'active' : ''}`}
              onClick={() => setAnnual(true)}
            >
              Annual <span className="pr-toggle-save">Save 15%</span>
            </button>
          </div>
        </div>
      </section>

      {/* ───── COMMERCIAL TIERS ───── */}
      <section className="yk-section pr-tiers">
        <div className="yk-section-inner">
          <div className="pr-tiers-grid">
            {TIERS.map((tier) => {
              let monthlyMinDisplay: number | null = null
              let monthlyMaxDisplay: number | null = null
              if (!tier.contactForPricing && tier.monthlyMin && tier.monthlyMax) {
                monthlyMinDisplay = annual ? Math.round(tier.monthlyMin * 0.85) : tier.monthlyMin
                monthlyMaxDisplay = annual ? Math.round(tier.monthlyMax * 0.85) : tier.monthlyMax
              }

              return (
                <div
                  key={tier.id}
                  className={`pr-tier ${tier.featured ? 'pr-tier-featured' : ''}`}
                >
                  {tier.featured && (
                    <div className="pr-tier-badge">MOST POPULAR</div>
                  )}

                  <div className="pr-tier-name">{tier.name}</div>
                  <div className="pr-tier-tagline">{tier.tagline}</div>

                  <div className="pr-tier-price-block">
                    {tier.contactForPricing ? (
                      <>
                        <div className="pr-tier-monthly pr-contact-price">
                          <span className="pr-contact-text">Contact</span>
                        </div>
                        <div className="pr-price-note pr-contact-note">
                          Engagement scoped individually
                        </div>
                        {tier.minTerm && (
                          <div className="pr-tier-term">{tier.minTerm}-month minimum</div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="pr-tier-monthly">
                          <span className="pr-price-currency">$</span>
                          <span className="pr-price-num">{monthlyMinDisplay?.toLocaleString()}</span>
                          <span className="pr-price-range-dash">–</span>
                          <span className="pr-price-num">{monthlyMaxDisplay?.toLocaleString()}</span>
                          <span className="pr-price-period">/mo</span>
                        </div>
                        {tier.monthlySubtitle && (
                          <div className="pr-price-note">{tier.monthlySubtitle}</div>
                        )}
                        <div className="pr-tier-setup">
                          + ${tier.setup?.toLocaleString()} setup
                        </div>
                        <div className="pr-tier-term">{tier.minTerm}-month minimum</div>
                      </>
                    )}
                  </div>

                  <p className="pr-tier-desc">{tier.description}</p>

                  <a
                    href={tier.contactForPricing ? '/contact' : '/apply'}
                    className={`pr-tier-cta ${tier.featured ? 'pr-cta-featured' : ''}`}
                  >
                    <span>
                      {tier.contactForPricing
                        ? tier.contactCta
                        : `Apply for ${tier.name}`}
                    </span>
                    <span className="yk-btn-arrow">→</span>
                  </a>

                  <div className="pr-tier-section">
                    <div className="pr-tier-section-h">INCLUDED</div>
                    <ul className="pr-tier-list pr-list-included">
                      {tier.features.map(f => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>

                  {tier.notIncluded && tier.notIncluded.length > 0 && (
                    <div className="pr-tier-section">
                      <div className="pr-tier-section-h pr-tier-section-not">NOT INCLUDED</div>
                      <ul className="pr-tier-list pr-list-not">
                        {tier.notIncluded.map(f => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pr-tier-section">
                    <div className="pr-tier-section-h">BEST FOR</div>
                    <p className="pr-tier-bestfor">{tier.bestFor}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Build & Own footnote */}
          <div className="pr-build-own-note">
            <span className="pr-build-own-eyebrow">ALTERNATIVE STRUCTURE</span>
            Each tier is also available as a one-time <strong>Build &amp; Own</strong> engagement.
            Yakini builds the platform; you own and operate it after delivery.
            Contact us for ownership pricing.
          </div>
        </div>
      </section>

      {/* ───── COMPARISON TABLE ───── */}
      <section className="yk-section pr-comparison">
        <div className="yk-section-inner">
          <div className="yk-section-tag">
            <span className="yk-num">02</span>
            <span>Side-by-side</span>
          </div>
          <h2 className="yk-section-h2">
            Compare
            <br />
            <span className="yk-gold">every tier.</span>
          </h2>

          <div className="pr-table-wrapper">
            <table className="pr-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Foundation</th>
                  <th>Authority</th>
                  <th className="pr-th-featured">Intelligence</th>
                  <th>Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_FEATURES.map(feature => (
                  <tr key={feature.name}>
                    <td className="pr-feature-cell">{feature.name}</td>
                    {(['foundation', 'authority', 'intelligence', 'enterprise'] as const).map(t => {
                      const val = feature.tiers[t]
                      return (
                        <td key={t} className={t === 'intelligence' ? 'pr-cell-featured' : ''}>
                          {val === true ? (
                            <span className="pr-check">✓</span>
                          ) : val === false ? (
                            <span className="pr-dash">—</span>
                          ) : (
                            <span className="pr-cell-text">{val}</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="pr-table-footnote">
              Nonprofit engagements scoped individually — see Mission-Aligned section below.
            </p>
          </div>
        </div>
      </section>

      {/* ───── NONPROFITS / MISSION-ALIGNED SECTION ───── */}
      <section className="yk-section pr-nonprofits">
        <div className="yk-section-inner">
          <div className="pr-nonprofits-card">
            <div className="pr-nonprofits-meta">
              <span className="pr-nonprofits-dot" />
              <span>MISSION-ALIGNED ENGAGEMENT</span>
            </div>
            <h3 className="pr-nonprofits-h">
              Custom infrastructure for <span className="yk-italic">nonprofits and mission-driven organizations.</span>
            </h3>
            <p className="pr-nonprofits-body">
              For 501(c)(3) organizations and community-serving nonprofits, pricing is structured
              around your mission, your funders, and your operational reality — not standard commercial rates.
              The architecture standards do not change. The platform you receive meets the same quality bar
              as any commercial engagement.
              <br /><br />
              Qualifying organizations may also access funding support through the
              <strong style={{ color: 'var(--gold)' }}> BRSA Foundation</strong>, the independent 501(c)(3) that funds access to Yakini infrastructure
              for underserved populations.
            </p>

            <div className="pr-nonprofits-grid">
              <div className="pr-nonprofits-feature">
                <div className="pr-nonprofits-feature-h">WHAT'S INCLUDED</div>
                <ul className="pr-tier-list pr-list-included">
                  <li>Custom platform built to your mission and operational needs</li>
                  <li>Donor management + grant tracking workflows (when applicable)</li>
                  <li>Volunteer coordination + program management tools</li>
                  <li>Yakini Intelligence layer matched to your engagement scope</li>
                  <li>Same architecture quality as commercial tiers</li>
                </ul>
              </div>

              <div className="pr-nonprofits-feature">
                <div className="pr-nonprofits-feature-h">PARTNERSHIP STRUCTURE</div>
                <ul className="pr-tier-list pr-list-included">
                  <li>Mission-aligned engagement terms set per partnership</li>
                  <li>BRSA Foundation funding pathway for qualifying orgs</li>
                  <li>Pilot pricing for case-study partners (one per category)</li>
                  <li>Transparent budget conversations from the first call</li>
                  <li>No commercial-tier minimums applied automatically</li>
                </ul>
              </div>
            </div>

            <p className="pr-nonprofits-pilot">
              <strong>Current pilot partner:</strong> Vizionz Sankofa (Albuquerque) — serving low-income families
              and refugee/immigrant communities.
            </p>

            <a href="/contact" className="yk-btn-primary">
              <span>Contact about nonprofit pricing</span>
              <span className="yk-btn-arrow">→</span>
            </a>
          </div>
        </div>
      </section>

      {/* ───── STRATEGIC PARTNER CALLOUT ───── */}
      <section className="yk-section pr-strategic">
        <div className="yk-section-inner">
          <div className="pr-strategic-card">
            <div className="pr-strategic-meta">
              <span className="pr-strategic-dot" />
              <span>STRATEGIC PARTNER PROGRAM</span>
            </div>
            <h3 className="pr-strategic-h">
              Founder pricing for <span className="yk-italic">case study partners.</span>
            </h3>
            <p className="pr-strategic-body">
              Yakini's first Strategic Partner in each industry receives founder pricing
              in exchange for being our case study, providing referrals, and helping us
              refine the platform for their vertical. Garland's TheyTowedMyCar.com is our first.
              <br /><br />
              <strong style={{ color: 'var(--gold)' }}>Strategic Partner slots are limited.</strong> One per industry vertical.
              Once a vertical has a Strategic Partner, all subsequent clients in that vertical pay standard tier pricing.
            </p>
            <p className="pr-strategic-active">
              <strong>Currently available verticals:</strong> Restaurant operators · Trucking & fleet ·
              Production companies · Real estate · Healthcare practices · Construction · Wellness & fitness ·
              Personal services · And more.
            </p>
            <a href="/apply" className="yk-btn-primary">
              <span>Apply for Strategic Partnership</span>
              <span className="yk-btn-arrow">→</span>
            </a>
          </div>
        </div>
      </section>

      {/* ───── FAQ ───── */}
      <section className="yk-section pr-faq">
        <div className="yk-section-inner">
          <div className="yk-section-tag">
            <span className="yk-num">03</span>
            <span>Common Questions</span>
          </div>
          <h2 className="yk-section-h2">
            Things founders
            <br />
            <span className="yk-italic">always ask.</span>
          </h2>

          <div className="pr-faq-list">
            {FAQS.map((faq, i) => (
              <details key={i} className="pr-faq-item">
                <summary className="pr-faq-q">
                  <span>{faq.q}</span>
                  <span className="pr-faq-icon">+</span>
                </summary>
                <div className="pr-faq-a">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ───── FINAL CTA ───── */}
      <section className="yk-section pr-final">
        <div className="yk-section-inner">
          <div className="pr-final-content">
            <div className="yk-eyebrow">
              <span className="yk-eyebrow-dot" />
              <span>READY TO BUILD?</span>
            </div>
            <h2 className="pr-final-h2">
              Stop comparing
              <br />
              <span className="yk-italic">agency pitches.</span>
              <br />
              <span className="yk-gold">Build your platform.</span>
            </h2>
            <p className="pr-final-sub">
              Every tier comes with the same core promise: real infrastructure you own,
              built to your specifications, on your domain, with Yakini Intelligence woven in. The only question is how much capability you need from day one.
            </p>
            <div className="pr-final-ctas">
              <a href="/apply" className="yk-btn-primary">
                <span>Apply for partnership</span>
                <span className="yk-btn-arrow">→</span>
              </a>
              <a href="/intelligence" className="yk-btn-ghost">
                <span>See Intelligence</span>
                <span className="yk-btn-arrow">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  )
}

const FAQS = [
  {
    q: 'Why are your prices public when other agencies hide theirs?',
    a: 'Hidden pricing is a tactic to anchor founders to higher quotes during sales calls. We don\'t need that tactic. Foundation and Authority tier pricing is fully public — setup, monthly range, and what\'s included. Intelligence, Enterprise, and Nonprofit engagements are bespoke and scoped through conversation, the way premium custom work is properly priced.',
  },
  {
    q: 'Why is Foundation and Authority monthly pricing a range?',
    a: 'Every engagement has variable maintenance scope. The base tier locks in the platform; the monthly range reflects how much ongoing work you choose. A founder who needs minimal monthly support pays at the bottom of the range. A founder who wants heavy iteration and ongoing platform development pays at the top. Same tier, scoped to your reality.',
  },
  {
    q: 'What\'s the difference between Yakini Intelligence Lite, Standard, Pro, and Custom?',
    a: 'Lite (Foundation tier) — embedded AI assistant trained on your content and brand voice, customer-facing. Standard (Authority tier) — embedded AI plus specialized tools (booking assistant, customer comms drafter). Pro (Intelligence tier) — full 6-tool Yakini Intelligence suite (Case Triage, Letter Generation, Hearing Prep, License Verification, Customer Comms, Strategic Analysis), customer + admin facing. Custom (Enterprise tier) — bespoke AI tools built for your specific operational workflow plus full Pro suite. AI is in every Yakini engagement; the depth scales with the tier.',
  },
  {
    q: 'What\'s the difference between setup and monthly?',
    a: 'Setup is the one-time cost to architect and build your platform. Monthly is the ongoing retainer for hosting, maintenance, support, updates, AI usage, and platform refinement. You pay setup once when we kick off the build. Monthly recurs.',
  },
  {
    q: 'What is Build & Own and how does it differ from a monthly partnership?',
    a: 'Build & Own is an alternative engagement structure. Yakini builds the complete platform; you take ownership at delivery and operate it independently afterward. There is no ongoing monthly retainer in this structure — but you also lose ongoing platform development, AI refinement, and priority support. Most operators choose monthly partnership because the ongoing relationship compounds value. Build & Own is for operators who want full ownership and intend to operate the platform in-house long-term. Contact us for ownership pricing.',
  },
  {
    q: 'How does nonprofit pricing work?',
    a: 'Nonprofit engagements are scoped per partnership. Pricing reflects the organization\'s mission, funding profile, and operational reality — not standard commercial rates. Qualifying 501(c)(3) organizations may also access funding support through BRSA Foundation, the independent 501(c)(3) that funds access to Yakini infrastructure for underserved populations. Vizionz Sankofa is our pilot partner in this tier.',
  },
  {
    q: 'Why is there a minimum term?',
    a: 'Custom platform development is a real investment from both sides. The minimum term ensures we both treat the partnership seriously and gives your platform time to actually generate ROI before re-evaluating. After the minimum term, the engagement is month-to-month.',
  },
  {
    q: 'What happens to my platform if we stop working together?',
    a: 'You own everything. Your domain, your data, your codebase, your AI configurations. If you choose to leave, we hand off the entire platform to you or your new team. We work for founders who own their infrastructure — not against them.',
  },
  {
    q: 'Do you offer white-label or reseller arrangements?',
    a: 'Yes — at the Enterprise tier. If you want to build platforms FOR your clients (e.g., a marketing agency reselling Yakini infrastructure), we have a partnership program. Apply and let\'s talk.',
  },
  {
    q: 'What does Yakini Intelligence actually cost to run?',
    a: 'AI inference costs are bundled into your monthly retainer at every tier. As your usage scales beyond standard thresholds, we\'ll have a transparent conversation about adjusting the retainer. No surprise overage charges.',
  },
  {
    q: 'Can I upgrade tiers later?',
    a: 'Absolutely. Many founders start at Foundation or Authority and upgrade to Intelligence once they want the full AI suite. Setup costs for the upgrade are calculated against work already completed — you don\'t pay full setup again.',
  },
  {
    q: 'Do you work with startups or only established businesses?',
    a: 'We work with serious founders at any stage. The question isn\'t "established or not" — it\'s "do you have a real business that justifies real infrastructure?" If you do, we want to talk.',
  },
]

const PAGE_CSS = `
  /* ═══ HEADER ═══ */
  .pr-header::before {
    background: radial-gradient(ellipse at center,
      rgba(200, 168, 75, 0.15) 0%,
      rgba(74, 144, 217, 0.06) 40%,
      transparent 70%) !important;
  }
  .pr-page-sub-italic {
    margin-top: 20px;
    font-style: italic;
    opacity: 0.85;
    font-size: 16px;
    color: var(--cream);
    line-height: 1.6;
    max-width: 720px;
  }

  /* ═══ BILLING TOGGLE ═══ */
  .pr-toggle-section {
    padding: 0 32px 60px;
    background: var(--black);
  }
  .pr-toggle-wrapper {
    display: flex;
    justify-content: center;
    gap: 4px;
    padding: 6px;
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--line);
    max-width: 360px;
    margin: 0 auto;
  }
  .pr-toggle-btn {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--muted);
    padding: 12px 24px;
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .pr-toggle-btn:hover { color: var(--cream); }
  .pr-toggle-btn.active {
    background: var(--gold);
    color: var(--navy-deep);
  }
  .pr-toggle-save {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.15em;
    padding: 2px 6px;
    background: rgba(0,0,0,0.15);
  }

  /* ═══ TIERS ═══ */
  .pr-tiers {
    background: var(--black);
    padding-top: 0 !important;
  }
  .pr-tiers-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 40px;
  }

  .pr-tier {
    padding: 40px 32px;
    background: rgba(255,255,255,0.02);
    border: 1px solid var(--line);
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    display: flex;
    flex-direction: column;
  }
  .pr-tier:hover {
    border-color: var(--gold);
    transform: translateY(-4px);
  }
  .pr-tier-featured {
    background: linear-gradient(180deg, rgba(74, 144, 217, 0.08) 0%, rgba(200, 168, 75, 0.04) 100%);
    border: 2px solid var(--electric);
    transform: scale(1.02);
    z-index: 2;
  }
  .pr-tier-featured:hover {
    border-color: var(--electric);
    transform: scale(1.02) translateY(-4px);
  }
  .pr-tier-badge {
    position: absolute;
    top: -1px; left: 50%;
    transform: translateX(-50%) translateY(-50%);
    background: var(--electric);
    color: var(--navy-deep);
    padding: 6px 16px;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.2em;
  }

  .pr-tier-name {
    font-family: var(--font-display);
    font-size: 36px;
    font-weight: 500;
    color: var(--cream);
    line-height: 1;
    margin-bottom: 8px;
  }
  .pr-tier-tagline {
    font-family: var(--font-display);
    font-size: 16px;
    font-style: italic;
    color: var(--gold);
    margin-bottom: 32px;
    line-height: 1.4;
  }

  .pr-tier-price-block {
    padding: 24px 0;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
    margin-bottom: 24px;
  }
  .pr-tier-monthly {
    display: flex;
    align-items: baseline;
    gap: 4px;
    margin-bottom: 4px;
    flex-wrap: wrap;
  }
  .pr-price-currency {
    font-family: var(--font-display);
    font-size: 24px;
    color: var(--muted);
    font-style: italic;
  }
  .pr-price-num {
    font-family: var(--font-display);
    font-size: 44px;
    font-weight: 500;
    color: var(--cream);
    line-height: 1;
  }
  .pr-price-range-dash {
    font-family: var(--font-display);
    font-size: 32px;
    color: var(--muted);
    margin: 0 4px;
    line-height: 1;
  }
  .pr-price-period {
    font-size: 16px;
    color: var(--muted);
    margin-left: 4px;
  }
  .pr-contact-price {
    font-size: 36px;
  }
  .pr-contact-text {
    font-family: var(--font-display);
    font-size: 36px;
    font-weight: 500;
    color: var(--gold);
    font-style: italic;
    line-height: 1;
  }
  .pr-contact-note {
    margin-top: 8px;
  }
  .pr-price-note {
    font-size: 11px;
    color: var(--muted);
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.15em;
    margin-bottom: 8px;
    margin-top: 4px;
  }
  .pr-tier-setup {
    font-size: 13px;
    color: var(--cream);
    margin-bottom: 4px;
  }
  .pr-tier-term {
    font-size: 12px;
    color: var(--muted);
    font-style: italic;
    font-family: var(--font-display);
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
    justify-content: center;
    gap: 8px;
    padding: 14px 24px;
    background: rgba(200, 168, 75, 0.1);
    border: 1.5px solid var(--gold);
    color: var(--gold);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-decoration: none;
    transition: all 0.3s;
    margin-bottom: 32px;
    width: 100%;
  }
  .pr-tier-cta:hover {
    background: var(--gold);
    color: var(--navy-deep);
    transform: translateY(-2px);
  }
  .pr-cta-featured {
    background: var(--electric);
    border-color: var(--electric);
    color: var(--navy-deep);
  }
  .pr-cta-featured:hover {
    background: var(--cream);
    border-color: var(--cream);
    box-shadow: 0 12px 30px rgba(74, 144, 217, 0.3);
  }
  .pr-tier-cta .yk-btn-arrow {
    transition: transform 0.25s;
  }
  .pr-tier-cta:hover .yk-btn-arrow {
    transform: translateX(4px);
  }

  .pr-tier-section {
    margin-bottom: 24px;
  }
  .pr-tier-section-h {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.25em;
    color: var(--gold);
    text-transform: uppercase;
    margin-bottom: 12px;
  }
  .pr-tier-section-not { color: var(--muted); }
  .pr-tier-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .pr-tier-list li {
    font-size: 13px;
    color: var(--cream);
    padding-left: 22px;
    position: relative;
    line-height: 1.6;
  }
  .pr-list-included li::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: var(--gold);
    font-weight: 700;
  }
  .pr-list-not li {
    color: var(--muted);
  }
  .pr-list-not li::before {
    content: '—';
    position: absolute;
    left: 0;
    color: var(--muted);
  }
  .pr-tier-bestfor {
    font-size: 13px;
    color: var(--cream);
    line-height: 1.7;
    font-style: italic;
    font-family: var(--font-display);
      }
      
  /* Build & Own footnote */
  .pr-build-own-note {
    max-width: 720px;
    margin: 40px auto 60px;
    text-align: center;
    padding: 24px 28px;
    border: 1px solid rgba(200, 168, 75, 0.30);
    background: rgba(200, 168, 75, 0.05);
    font-size: 14px;
    color: var(--cream);
    line-height: 1.7;
  }
  .pr-build-own-eyebrow {
    color: var(--gold);
    letter-spacing: 0.25em;
    text-transform: uppercase;
    font-size: 10px;
    font-family: var(--font-mono);
    font-weight: 700;
    display: block;
    margin-bottom: 12px;
  }

  @media (max-width: 1100px) {
    .pr-tiers-grid { grid-template-columns: 1fr 1fr; }
    .pr-tier-featured { grid-column: span 1; transform: none; }
    .pr-tier-featured:hover { transform: translateY(-4px); }
  }
  @media (max-width: 600px) {
    .pr-tiers-grid { grid-template-columns: 1fr; gap: 32px; }
    .pr-price-num { font-size: 36px; }
    .pr-price-range-dash { font-size: 24px; }
  }

  /* ═══ COMPARISON TABLE ═══ */
  .pr-comparison {
    background: linear-gradient(180deg, var(--black) 0%, var(--navy-deep) 100%);
  }
  .pr-table-wrapper {
    overflow-x: auto;
    border: 1px solid var(--line);
    background: rgba(255,255,255,0.02);
  }
  .pr-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 700px;
  }
  .pr-table th, .pr-table td {
    padding: 16px 20px;
    text-align: left;
    border-bottom: 1px solid var(--line);
    font-size: 13px;
  }
  .pr-table th {
    font-family: var(--font-display);
    font-size: 18px;
    font-weight: 500;
    color: var(--cream);
    background: rgba(255,255,255,0.03);
    border-bottom: 2px solid var(--line-strong);
  }
  .pr-th-featured {
    color: var(--electric) !important;
    background: rgba(74, 144, 217, 0.08) !important;
  }
  .pr-feature-cell {
    color: var(--cream);
    font-weight: 500;
  }
  .pr-cell-featured {
    background: rgba(74, 144, 217, 0.04);
  }
  .pr-check {
    color: var(--gold);
    font-size: 18px;
    font-weight: 700;
  }
  .pr-dash {
    color: var(--muted);
    opacity: 0.5;
  }
  .pr-cell-text {
    color: var(--cream);
    font-size: 12px;
  }
  .pr-table-footnote {
    margin-top: 24px;
    text-align: center;
    font-style: italic;
    font-size: 14px;
    color: var(--muted);
  }

  /* ═══ NONPROFITS / MISSION-ALIGNED ═══ */
  .pr-nonprofits {
    background: linear-gradient(180deg, var(--navy-deep) 0%, var(--black-soft) 100%);
  }
  .pr-nonprofits-card {
    padding: 60px;
    background: linear-gradient(135deg, rgba(200, 168, 75, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
    border: 1px solid var(--gold);
    position: relative;
    max-width: 1100px;
    margin: 0 auto;
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
  }
  .pr-nonprofits-dot {
    width: 6px; height: 6px;
    background: var(--gold);
    border-radius: 50%;
    animation: yk-dot-pulse 2s ease-in-out infinite;
  }
  .pr-nonprofits-h {
    font-family: var(--font-display);
    font-size: clamp(28px, 3.6vw, 42px);
    font-weight: 500;
    line-height: 1.15;
    color: var(--cream);
    margin-bottom: 24px;
    letter-spacing: -0.02em;
    max-width: 22ch;
  }
  .pr-nonprofits-body {
    font-size: 16px;
    line-height: 1.8;
    color: var(--cream);
    margin-bottom: 40px;
    max-width: 760px;
  }
  .pr-nonprofits-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    margin-bottom: 40px;
    padding: 32px 0;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
  }
  .pr-nonprofits-feature-h {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.25em;
    color: var(--gold);
    text-transform: uppercase;
    margin-bottom: 16px;
  }
  .pr-nonprofits-pilot {
    font-size: 14px;
    line-height: 1.7;
    color: var(--cream);
    margin-bottom: 32px;
    padding: 20px;
    background: rgba(0,0,0,0.2);
    border-left: 2px solid var(--gold);
  }

  @media (max-width: 800px) {
    .pr-nonprofits-card { padding: 40px 28px; }
    .pr-nonprofits-grid { grid-template-columns: 1fr; gap: 32px; }
  }

  /* ═══ STRATEGIC PARTNER ═══ */
  .pr-strategic {
    background: var(--navy-deep);
  }
  .pr-strategic-card {
    padding: 60px;
    background: linear-gradient(135deg, rgba(200, 168, 75, 0.08) 0%, rgba(74, 144, 217, 0.04) 100%);
    border: 2px solid var(--gold);
    position: relative;
    max-width: 900px;
    margin: 0 auto;
  }
  .pr-strategic-meta {
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
  }
  .pr-strategic-dot {
    width: 6px; height: 6px;
    background: var(--gold);
    border-radius: 50%;
    animation: yk-dot-pulse 2s ease-in-out infinite;
  }
  .pr-strategic-h {
    font-family: var(--font-display);
    font-size: clamp(32px, 4vw, 48px);
    font-weight: 500;
    line-height: 1.1;
    color: var(--cream);
    margin-bottom: 24px;
    letter-spacing: -0.02em;
  }
  .pr-strategic-body {
    font-size: 16px;
    line-height: 1.8;
    color: var(--cream);
    margin-bottom: 24px;
  }
  .pr-strategic-active {
    font-size: 14px;
    line-height: 1.7;
    color: var(--muted);
    margin-bottom: 32px;
    padding: 20px;
    background: rgba(0,0,0,0.2);
    border-left: 2px solid var(--gold);
  }

  @media (max-width: 700px) {
    .pr-strategic-card { padding: 40px 28px; }
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
