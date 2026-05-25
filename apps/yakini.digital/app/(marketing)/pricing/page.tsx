'use client'

import { useState } from 'react'
import { SiteShell } from '@/components/SiteShell'

// ═════════════════════════════════════════════════════════════════════════
// YAKINI PRICING PAGE — v3 (May 25, 2026)
// File: apps/yakini.digital/app/(marketing)/pricing/page.tsx
//
// v3 changes:
//   - Restructured from 4 tiers to 3: Core / Authority / Enterprise
//   - Each tier now has TWO pricing columns: Custom and Vertical Edition
//   - Vertical Edition = 10-12% premium for the five proven vertical patterns
//   - NEW: Vertical Editions section between tiers and comparison table
//   - Foundation → Core (rename + restructure)
//   - Intelligence absorbed into Authority + Enterprise as included features
//   - Yakini Intelligence tier mapping: Lite / Standard + Composer / Pro + Composer + Studios
//   - All public commercial pricing (no contact-for-pricing on commercial tiers)
//   - Brain trust locked: Kim/Greg/Clarence May 24-25 convergence
// ═════════════════════════════════════════════════════════════════════════

// Three commercial tiers — each with Custom and Vertical Edition pricing
const TIERS = [
  {
    id: 'core',
    name: 'Core',
    tagline: 'A real platform. Built right from day one.',
    description: 'Custom branded platform with the Yakini foundation: real architecture, real design, real ownership, with Yakini Intelligence Lite woven into the workflow. The entry point for founders who want serious infrastructure without enterprise overhead.',
    customSetupMin: 12000,
    customSetupMax: 22000,
    verticalSetupMin: 14000,
    verticalSetupMax: 25000,
    monthlyMin: 1800,
    monthlyMax: 2500,
    monthlySubtitle: 'Platform maintenance, AI refinement, support',
    minTerm: 3,
    aiTier: 'Yakini Intelligence Lite',
    features: [
      'Custom branded marketing platform',
      'Mobile-first responsive architecture',
      'Lead capture + customer pipeline',
      'Brand identity foundation (logo, palette, typography)',
      'Independent infrastructure (your domain, your data)',
      'Yakini Intelligence Lite — embedded AI trained on your content + brand voice',
      'SEO foundations (meta, sitemap, schema)',
      'Google Analytics 4 setup',
      'Monthly platform updates + maintenance',
      'Email + chat support (24-48hr response)',
    ],
    notIncluded: [
      'Customer portal with authentication',
      'Multi-tenant database architecture',
      'Composer operating layer',
      'Yakini Studios access',
    ],
    bestFor: 'Solo founders, consultants, and service providers launching their first serious online presence with AI infrastructure baked in.',
    color: 'gold',
    featured: false,
    verticalAvailable: true,
  },
  {
    id: 'authority',
    name: 'Authority',
    tagline: 'A platform that runs operations. With Composer.',
    description: 'Multi-section platform with database, lead pipeline, customer portal, and Composer — the AI operating layer that runs your business in plain language. Yakini Intelligence Standard scaled to the workflows your business actually runs on. The tier where Yakini becomes operational infrastructure, not just a website.',
    customSetupMin: 32000,
    customSetupMax: 48000,
    verticalSetupMin: 36000,
    verticalSetupMax: 54000,
    monthlyMin: 4500,
    monthlyMax: 6000,
    monthlySubtitle: 'Platform + Composer + AI refinement + priority support',
    minTerm: 6,
    aiTier: 'Yakini Intelligence Standard + Composer',
    features: [
      'Everything in Core, plus:',
      'Multi-section platform with custom database',
      'Customer portal with magic-link authentication',
      'Lead pipeline + booking system',
      'Composer included — AI operating layer for your business',
      'Yakini Intelligence Standard — workflow AI, customer comms drafter, booking assistant',
      'Brand assets package (social templates, email signatures, pitch deck)',
      'Content strategy + monthly content updates',
      'Quarterly performance reviews',
      'Up to 4 platform feature updates per quarter',
      'Priority support (same-day response)',
      'Direct line to build team (Slack channel)',
    ],
    notIncluded: [
      'Multi-tenant / white-label reseller architecture',
      'Custom AI fine-tuning on proprietary data',
      'Third-party enterprise integrations (Salesforce, HubSpot, custom APIs)',
      'Yakini Studios access (Enterprise tier)',
    ],
    bestFor: 'Growing service businesses, professional firms, consultancies, hospitality operators, and any founder ready to run real operations on AI-native infrastructure.',
    color: 'gold',
    featured: true,
    verticalAvailable: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Category-defining platforms. With Composer + Studios.',
    description: 'Full-custom platform development with multi-tenant architecture, third-party integrations, and the complete Yakini stack — Composer, Yakini Intelligence Pro, and Yakini Studios access. For founders building category-defining businesses, multi-state operators, franchise systems, and consortiums.',
    customSetupMin: 105000,
    customSetupMax: 145000,
    verticalSetupMin: 118000,
    verticalSetupMax: 162000,
    monthlyMin: 11000,
    monthlyMax: 14000,
    monthlySubtitle: 'Full stack platform + Composer + Studios + dedicated team',
    minTerm: 6,
    aiTier: 'Yakini Intelligence Pro + Composer + Studios',
    features: [
      'Everything in Authority, plus:',
      'Full custom architecture for your industry',
      'Multi-tenant + multi-brand support (white-label ready)',
      'Yakini Intelligence Pro — full 6-tool suite + custom workflow AI',
      'Yakini Studios access — talking-head video, voiceover, training content production',
      'Third-party integrations (Salesforce, HubSpot, custom APIs)',
      'Custom AI fine-tuning on your proprietary data',
      'Advanced analytics + business intelligence dashboards',
      'Compliance + audit-ready architecture',
      'Dedicated build team',
      'Quarterly strategic reviews with founder',
      'Unlimited platform feature updates',
      'Priority emergency support (24/7)',
    ],
    notIncluded: [],
    bestFor: 'Companies building category-defining platforms. Multi-state operators. Franchise systems. Consortiums. Holdings companies. Founders preparing for institutional capital.',
    color: 'gold',
    featured: false,
    verticalAvailable: true,
  },
]

// Five vertical builds — three live, two in development
const VERTICALS = [
  {
    id: 'real-estate',
    name: 'Real Estate Services',
    status: 'LIVE',
    proof: 'Crownpoint Strategies',
    description: 'Lead intake calibrated to real estate workflows, fair housing compliance language, transaction document automation, buyer/seller portals, CRM integrations.',
  },
  {
    id: 'professional-services',
    name: 'Professional Services',
    status: 'LIVE',
    proof: 'TheyTowedMyCar',
    description: 'Client intake, case/matter management, document workflows, billing, secure client portals. For legal, accounting, and consulting practices.',
  },
  {
    id: 'workforce',
    name: 'Workforce Development',
    status: 'LIVE',
    proof: 'Vizionz Sankofa',
    description: 'Participant case management, services tracking, outcomes reporting, grant compliance, funder portals. For mission-driven workforce and reentry programs.',
  },
  {
    id: 'hospitality',
    name: 'Culinary, Hospitality & Personal Services',
    status: 'Q3 2026',
    proof: 'In development',
    description: 'Booking and consultation workflows, customer profile and preference tracking, content production tools, white-glove customer portals.',
  },
  {
    id: 'construction',
    name: 'Construction & Trade Services',
    status: 'Q4 2026',
    proof: 'In development',
    description: 'Lead and bid intake, project management, supplier coordination, customer-facing project portals, change order management, billing.',
  },
]

const COMPARISON_FEATURES = [
  { name: 'Custom branded platform', tiers: { core: true, authority: true, enterprise: true } },
  { name: 'Mobile-responsive architecture', tiers: { core: true, authority: true, enterprise: true } },
  { name: 'Independent infrastructure', tiers: { core: true, authority: true, enterprise: true } },
  { name: 'Lead capture + customer pipeline', tiers: { core: true, authority: true, enterprise: true } },
  { name: 'Custom database architecture', tiers: { core: false, authority: true, enterprise: true } },
  { name: 'Customer portal', tiers: { core: false, authority: 'Magic-link auth', enterprise: 'Multi-tenant' } },
  { name: 'Yakini Intelligence', tiers: { core: 'Lite', authority: 'Standard', enterprise: 'Pro (6 tools)' } },
  { name: 'Composer operating layer', tiers: { core: false, authority: true, enterprise: true } },
  { name: 'Yakini Studios access', tiers: { core: false, authority: false, enterprise: true } },
  { name: 'Workflow automation', tiers: { core: false, authority: true, enterprise: 'Advanced' } },
  { name: 'Multi-tenant architecture', tiers: { core: false, authority: false, enterprise: 'White-label' } },
  { name: 'Third-party integrations', tiers: { core: false, authority: false, enterprise: true } },
  { name: 'Custom AI fine-tuning', tiers: { core: false, authority: false, enterprise: true } },
  { name: 'Vertical Edition available', tiers: { core: true, authority: true, enterprise: true } },
  { name: 'Support response time', tiers: { core: '24-48h', authority: 'Same day + Slack', enterprise: '24/7 emergency' } },
  { name: 'Feature updates per quarter', tiers: { core: 'Maintenance', authority: '4', enterprise: 'Unlimited' } },
  { name: 'Minimum term', tiers: { core: '3 months', authority: '6 months', enterprise: '6 months' } },
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
            Three tiers.
            <br />
            <span className="yk-italic">Two engagement paths.</span>
            <br />
            <span className="yk-gold">One operating philosophy.</span>
          </h1>
          <p className="yk-page-sub">
            Most agencies hide pricing because their numbers can't survive scrutiny.
            We publish ours because the work justifies them.
            Every Yakini engagement is available as a Custom build or as a Vertical Edition deployment against one of our proven industry patterns.
          </p>
          <p className="pr-page-sub-italic">
            Every tier includes Yakini Intelligence. The depth scales with the engagement.
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
              const monthlyMinDisplay = annual ? Math.round(tier.monthlyMin * 0.85) : tier.monthlyMin
              const monthlyMaxDisplay = annual ? Math.round(tier.monthlyMax * 0.85) : tier.monthlyMax

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
                    <div className="pr-tier-monthly">
                      <span className="pr-price-currency">$</span>
                      <span className="pr-price-num">{monthlyMinDisplay.toLocaleString()}</span>
                      <span className="pr-price-range-dash">–</span>
                      <span className="pr-price-num">{monthlyMaxDisplay.toLocaleString()}</span>
                      <span className="pr-price-period">/mo</span>
                    </div>
                    <div className="pr-price-note">{tier.monthlySubtitle}</div>

                    <div className="pr-setup-block">
                      <div className="pr-setup-row">
                        <span className="pr-setup-label">Custom setup</span>
                        <span className="pr-setup-value">
                          ${tier.customSetupMin.toLocaleString()} – ${tier.customSetupMax.toLocaleString()}
                        </span>
                      </div>
                      <div className="pr-setup-row pr-setup-vertical">
                        <span className="pr-setup-label">Vertical Edition</span>
                        <span className="pr-setup-value">
                          ${tier.verticalSetupMin.toLocaleString()} – ${tier.verticalSetupMax.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="pr-tier-term">{tier.minTerm}-month minimum</div>
                  </div>

                  <p className="pr-tier-desc">{tier.description}</p>

                  <a
                    href="/apply"
                    className={`pr-tier-cta ${tier.featured ? 'pr-cta-featured' : ''}`}
                  >
                    <span>Apply for {tier.name}</span>
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

          {/* Payment + Floor notes */}
          <div className="pr-policy-row">
            <div className="pr-policy-card">
              <div className="pr-policy-h">PAYMENT STRUCTURE</div>
              <p>50% at signature · 25% at platform delivery · 25% at launch acceptance. Anthropic API and third-party services billed at cost + 15% administrative.</p>
            </div>
            <div className="pr-policy-card">
              <div className="pr-policy-h">FLOOR RULES</div>
              <p>No projects under $12,000. No websites without platform infrastructure. No clients without documented workflow. Capacity: two active client builds at any time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── VERTICAL EDITIONS ───── */}
      <section className="yk-section pr-verticals">
        <div className="yk-section-inner">
          <div className="yk-section-tag">
            <span className="yk-num">02</span>
            <span>Vertical Editions</span>
          </div>
          <h2 className="yk-section-h2">
            Five proven industry patterns.
            <br />
            <span className="yk-gold">Deployment, not discovery.</span>
          </h2>

          <p className="pr-verticals-explainer">
            A Vertical Edition is a Yakini engagement deployed against one of our proven industry patterns.
            The architecture, AI prompt libraries, compliance language, and operational workflows are already built and validated.
            Vertical Edition pricing reflects the value of deployment-grade infrastructure tuned for your industry.
          </p>

          <div className="pr-verticals-quote">
            <p>
              "Because we've already built the lead intake, the compliance language, and the transaction workflow for your industry.
              You're not paying for discovery. You're paying for deployment."
            </p>
          </div>

          <div className="pr-verticals-grid">
            {VERTICALS.map((v) => (
              <div key={v.id} className={`pr-vertical-card ${v.status === 'LIVE' ? 'pr-vertical-live' : 'pr-vertical-dev'}`}>
                <div className="pr-vertical-status">
                  <span className="pr-vertical-status-dot" />
                  {v.status}
                </div>
                <h3 className="pr-vertical-name">{v.name}</h3>
                <div className="pr-vertical-proof">
                  <span className="pr-vertical-proof-label">PROOF</span>
                  <span className="pr-vertical-proof-name">{v.proof}</span>
                </div>
                <p className="pr-vertical-desc">{v.description}</p>
              </div>
            ))}
          </div>

          <div className="pr-verticals-straddler">
            <p>
              <strong>Not sure which vertical fits?</strong> Start with the Operational Drag Audit.
              We'll surface your dominant operational pattern and match you to the right deployment — vertical or custom.
            </p>
            <a href="/apply" className="pr-verticals-cta">
              <span>Start the Operational Drag Audit</span>
              <span className="yk-btn-arrow">→</span>
            </a>
          </div>
        </div>
      </section>

      {/* ───── COMPARISON TABLE ───── */}
      <section className="yk-section pr-comparison">
        <div className="yk-section-inner">
          <div className="yk-section-tag">
            <span className="yk-num">03</span>
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
                  <th>Core</th>
                  <th className="pr-th-featured">Authority</th>
                  <th>Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_FEATURES.map(feature => (
                  <tr key={feature.name}>
                    <td className="pr-feature-cell">{feature.name}</td>
                    {(['core', 'authority', 'enterprise'] as const).map(t => {
                      const val = feature.tiers[t]
                      return (
                        <td key={t} className={t === 'authority' ? 'pr-cell-featured' : ''}>
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

      {/* ───── NONPROFITS / MISSION-ALIGNED ───── */}
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

            <div className="pr-nonprofits-pilot">
              <strong>Active partnership:</strong> Vizionz Sankofa (Albuquerque, NM) — first mission-aligned pilot, full case management platform live since Mother's Day 2026. Reference available for serious nonprofit conversations.
            </div>

            <a href="/apply" className="pr-tier-cta pr-cta-featured" style={{ alignSelf: 'flex-start' }}>
              <span>Start the conversation</span>
              <span className="yk-btn-arrow">→</span>
            </a>
          </div>
        </div>
      </section>

      {/* ───── STRATEGIC PARTNER ───── */}
      <section className="yk-section pr-strategic">
        <div className="yk-section-inner">
          <div className="pr-strategic-card">
            <div className="pr-strategic-meta">
              <span className="pr-strategic-dot" />
              <span>STRATEGIC PARTNER PROGRAM</span>
            </div>
            <h3 className="pr-strategic-h">
              For partners who refer business <span className="yk-italic">and earn recurring revenue.</span>
            </h3>
            <p className="pr-strategic-body">
              The Strategic Partner Program is for established operators in their industries who want to
              offer Yakini infrastructure to their networks. Partners receive co-marketing rights,
              revenue share on deployments through their channel, and advisory input on the vertical
              templates serving their industry. Founding partner economics apply to the first partner
              in each vertical and do not repeat.
            </p>

            <div className="pr-strategic-active">
              <strong>Founding partners in progress:</strong> Crownpoint Strategies (Real Estate vertical, founding deployment). Future real estate channel partners deploy at standard Vertical Edition rates.
            </div>

            <a href="/apply" className="pr-tier-cta pr-cta-featured" style={{ alignSelf: 'flex-start' }}>
              <span>Apply for Strategic Partner</span>
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
                What's the difference between Custom and Vertical Edition pricing?
                <span className="pr-faq-icon">+</span>
              </summary>
              <div className="pr-faq-a">
                Custom is a from-zero build for industries outside our five proven verticals (Real Estate, Professional Services, Workforce Development, Hospitality, Construction). Vertical Edition is a deployment against pre-built industry infrastructure with the architecture, AI prompt libraries, compliance language, and workflows already validated. Vertical Edition costs 10-12% more because the deployment is faster, the outcome is more predictable, and the infrastructure is already proven in your industry. You're paying for deployment, not discovery.
              </div>
            </details>

            <details className="pr-faq-item">
              <summary className="pr-faq-q">
                Why is the Core minimum $12,000?
                <span className="pr-faq-icon">+</span>
              </summary>
              <div className="pr-faq-a">
                Below $12,000, we cannot deliver real platform infrastructure with the architecture, AI integration, brand depth, and ongoing support that the Yakini name represents. Engagements under that floor produce websites, not platforms. We don't build websites. The floor protects you from getting less than you came for.
              </div>
            </details>

            <details className="pr-faq-item">
              <summary className="pr-faq-q">
                What does the monthly fee actually cover?
                <span className="pr-faq-icon">+</span>
              </summary>
              <div className="pr-faq-a">
                Platform hosting and infrastructure, security and uptime monitoring, AI refinement and prompt tuning, technical support, content updates, monthly platform updates, and feature improvements at the cadence defined by your tier. The monthly is not a maintenance fee — it's the ongoing engagement that keeps your platform competitive as your business grows.
              </div>
            </details>

            <details className="pr-faq-item">
              <summary className="pr-faq-q">
                Is Anthropic API usage included?
                <span className="pr-faq-icon">+</span>
              </summary>
              <div className="pr-faq-a">
                Anthropic API consumption and third-party services are billed separately at cost plus 15% administrative. You see a transparent monthly statement showing actual consumption. Most customers run $30-150 per month in API costs at standard usage. Heavy-usage cases get flagged for review and potential optimization.
              </div>
            </details>

            <details className="pr-faq-item">
              <summary className="pr-faq-q">
                Can I switch from Custom to Vertical Edition mid-project?
                <span className="pr-faq-icon">+</span>
              </summary>
              <div className="pr-faq-a">
                Yes, if the Operational Drag Audit surfaces that your business actually fits one of our proven verticals. We'd rather discover this at the audit phase than three months into a custom build. The Audit is the universal qualifier — it tells both of us which path serves your business best.
              </div>
            </details>

            <details className="pr-faq-item">
              <summary className="pr-faq-q">
                What about the Build &amp; Own option?
                <span className="pr-faq-icon">+</span>
              </summary>
              <div className="pr-faq-a">
                For each tier, we offer a one-time engagement structure where Yakini builds the platform, transfers full ownership at delivery, and you operate it independently afterward. No monthly. No ongoing engagement. Pricing is roughly 2.5x the Custom setup cost. Best fit for companies with in-house technical teams ready to take over operations. Most clients prefer the recurring engagement because the platform stays current and the AI keeps refining.
              </div>
            </details>

            <details className="pr-faq-item">
              <summary className="pr-faq-q">
                Can existing clients keep their grandfathered pricing?
                <span className="pr-faq-icon">+</span>
              </summary>
              <div className="pr-faq-a">
                Yes. All existing Yakini clients keep the terms they signed under. New pricing applies to engagements signed from May 25, 2026 forward. Grandfathered rates do not transfer to new engagements, partner channel deployments, or contract renewals at expanded scope.
              </div>
            </details>

            <details className="pr-faq-item">
              <summary className="pr-faq-q">
                How long until my platform is live?
                <span className="pr-faq-icon">+</span>
              </summary>
              <div className="pr-faq-a">
                Custom builds: 8-12 weeks from contract signature to launch, depending on tier and scope. Vertical Edition deployments: 3-5 weeks because the architecture is already built. Foundation engagements (small business formation work like Crownpoint's Foundation SOW) deploy in 7-10 business days.
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
              Start with the
              <br />
              <span className="yk-gold yk-italic">Operational Drag Audit.</span>
            </h2>
            <p className="pr-final-sub">
              The Audit is the universal qualifier. It surfaces where your operations are leaking value,
              identifies which vertical pattern fits (or whether a custom build serves better),
              and matches you to the right tier. Every Yakini engagement starts here.
            </p>
            <div className="pr-final-ctas">
              <a href="/apply" className="pr-tier-cta pr-cta-featured">
                <span>Start the Audit</span>
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
// =========================================================================
// PAGE STYLES
// ═════════════════════════════════════════════════════════════════════════
const PAGE_CSS = `
  /* ═══ HEADER ═══ */
  .pr-header {
    background: linear-gradient(180deg, rgba(10, 9, 8, 0.72) 0%, rgba(10, 9, 8, 0.88) 100%), url('/yakini-pricing-bg.jpg') center center / cover no-repeat;
  }
  .pr-page-sub-italic {
    margin-top: 20px;
    font-family: var(--font-display);
    font-style: italic;
    font-size: 18px;
    color: var(--gold);
    letter-spacing: 0.01em;
  }

  /* ═══ BILLING TOGGLE ═══ */
  .pr-toggle-section {
    background: var(--navy-deep);
    padding: 40px 0;
  }
  .pr-toggle-wrapper {
    display: inline-flex;
    background: rgba(255,255,255,0.05);
    border: 1px solid var(--line);
    padding: 6px;
    border-radius: 4px;
    margin: 0 auto;
  }
  .pr-toggle-wrapper { display: flex; justify-content: center; }
  .pr-toggle-btn {
    background: transparent;
    border: none;
    padding: 12px 24px;
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s;
    border-radius: 2px;
  }
  .pr-toggle-btn.active {
    background: var(--gold);
    color: var(--black);
  }
  .pr-toggle-save {
    margin-left: 6px;
    font-size: 10px;
    color: var(--gold);
  }
  .pr-toggle-btn.active .pr-toggle-save {
    color: var(--black);
    opacity: 0.7;
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
  @media (max-width: 1100px) {
    .pr-tiers-grid { grid-template-columns: 1fr; }
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
  @media (max-width: 1100px) {
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
  .pr-tier-monthly {
    display: flex;
    align-items: baseline;
    gap: 2px;
    margin-bottom: 8px;
  }
  .pr-price-currency {
    font-family: var(--font-display);
    font-size: 24px;
    color: var(--cream);
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
  }
  .pr-price-period {
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--muted);
    margin-left: 6px;
    letter-spacing: 0.1em;
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
  .pr-setup-row.pr-setup-vertical {
    color: var(--gold);
  }
  .pr-setup-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.2em;
    color: var(--muted);
    text-transform: uppercase;
  }
  .pr-setup-row.pr-setup-vertical .pr-setup-label {
    color: var(--gold);
  }
  .pr-setup-value {
    font-family: var(--font-display);
    color: var(--cream);
    font-weight: 500;
  }
  .pr-setup-row.pr-setup-vertical .pr-setup-value {
    color: var(--gold);
  }
  .pr-tier-term {
    margin-top: 14px;
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.18em;
    color: var(--muted);
    text-transform: uppercase;
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
  .pr-tier-section-not {
    color: var(--muted);
    opacity: 0.6;
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
  .pr-list-not li {
    color: var(--muted);
    opacity: 0.7;
  }
  .pr-list-not li::before {
    content: '—';
    position: absolute;
    left: 0;
    color: var(--muted);
  }
  .pr-tier-bestfor {
    font-size: 13px;
    line-height: 1.6;
    color: var(--muted);
    font-style: italic;
  }

  /* ═══ BUILD & OWN NOTE ═══ */
  .pr-build-own-note {
    padding: 24px 32px;
    background: rgba(0,0,0,0.2);
    border-left: 2px solid var(--gold);
    font-size: 14px;
    line-height: 1.7;
    color: var(--cream);
    margin-bottom: 40px;
  }
  .pr-build-own-eyebrow {
    display: block;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.25em;
    color: var(--gold);
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  /* ═══ POLICY ROW (Payment + Floor) ═══ */
  .pr-policy-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  @media (max-width: 800px) {
    .pr-policy-row { grid-template-columns: 1fr; }
  }
  .pr-policy-card {
    padding: 28px;
    background: rgba(255,255,255,0.02);
    border: 1px solid var(--line);
  }
  .pr-policy-h {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.25em;
    color: var(--gold);
    text-transform: uppercase;
    margin-bottom: 12px;
  }
  .pr-policy-card p {
    font-size: 14px;
    line-height: 1.7;
    color: var(--cream);
  }

  /* ═══ VERTICAL EDITIONS ═══ */
  .pr-verticals {
    background: linear-gradient(180deg, var(--navy-deep) 0%, var(--black) 100%);
  }
  .pr-verticals-explainer {
    font-size: 16px;
    line-height: 1.7;
    color: var(--cream);
    max-width: 760px;
    margin-bottom: 32px;
  }
  .pr-verticals-quote {
    padding: 28px 32px;
    background: rgba(200, 168, 75, 0.05);
    border-left: 3px solid var(--gold);
    margin-bottom: 48px;
    max-width: 900px;
  }
  .pr-verticals-quote p {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 20px;
    line-height: 1.5;
    color: var(--cream);
  }
  .pr-verticals-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    margin-bottom: 48px;
  }
  .pr-vertical-card {
    padding: 28px;
    background: rgba(255,255,255,0.02);
    border: 1px solid var(--line);
    position: relative;
    display: flex;
    flex-direction: column;
  }
  .pr-vertical-live {
    border-color: var(--gold);
  }
  .pr-vertical-dev {
    opacity: 0.85;
  }
  .pr-vertical-status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.22em;
    color: var(--gold);
    text-transform: uppercase;
    margin-bottom: 14px;
  }
  .pr-vertical-status-dot {
    width: 6px;
    height: 6px;
    background: var(--gold);
    border-radius: 50%;
  }
  .pr-vertical-dev .pr-vertical-status {
    color: var(--muted);
  }
  .pr-vertical-dev .pr-vertical-status-dot {
    background: var(--muted);
  }
  .pr-vertical-name {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 500;
    color: var(--cream);
    line-height: 1.2;
    margin-bottom: 14px;
    letter-spacing: -0.01em;
  }
  .pr-vertical-proof {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 10px 0;
    border-top: 1px dashed var(--line);
    border-bottom: 1px dashed var(--line);
    margin-bottom: 14px;
  }
  .pr-vertical-proof-label {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 0.25em;
    color: var(--gold);
    text-transform: uppercase;
  }
  .pr-vertical-proof-name {
    font-family: var(--font-display);
    font-size: 15px;
    color: var(--cream);
    font-weight: 500;
  }
  .pr-vertical-desc {
    font-size: 13px;
    line-height: 1.6;
    color: var(--muted);
  }
  .pr-verticals-straddler {
    padding: 32px;
    background: rgba(200, 168, 75, 0.04);
    border: 1px solid var(--gold);
    display: flex;
    flex-direction: column;
    gap: 20px;
    align-items: flex-start;
  }
  .pr-verticals-straddler p {
    font-size: 15px;
    line-height: 1.7;
    color: var(--cream);
  }
  .pr-verticals-cta {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 14px 22px;
    background: var(--gold);
    color: var(--black);
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    text-decoration: none;
    transition: all 0.2s;
  }
  .pr-verticals-cta:hover {
    background: var(--cream);
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
    min-width: 600px;
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
    color: var(--gold) !important;
    background: rgba(200, 168, 75, 0.08) !important;
  }
  .pr-feature-cell {
    color: var(--cream);
    font-weight: 500;
  }
  .pr-cell-featured {
    background: rgba(200, 168, 75, 0.04);
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
    background: linear-gradient(135deg, rgba(200, 168, 75, 0.08) 0%, rgba(200, 168, 75, 0.02) 100%);
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
