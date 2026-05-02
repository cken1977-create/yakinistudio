'use client'

import { SiteShell } from '@/components/SiteShell'

// ═════════════════════════════════════════════════════════════════════════
// YAKINI PLATFORMS — Case Study Showcase
// File: apps/yakini.digital/app/platforms/page.tsx
//
// Purpose: Show the diversity of Yakini-built platforms across industries.
// Every vertical gets case study treatment. TheyTowedMyCar featured as
// the first live deployment, anchored in a constellation of others.
// ═════════════════════════════════════════════════════════════════════════

const PLATFORMS = [
  {
    id: 'theytowedmycar',
    name: 'TheyTowedMyCar.com',
    subtitle: 'Tow Defense Service',
    industry: 'LEGAL SERVICES · CONSUMER PROTECTION',
    status: 'LIVE',
    statusColor: 'gold',
    tier: 'INTELLIGENCE TIER',
    location: 'Texas · 5 Counties',
    domain: 'theytowedmycar.com',
    quote: 'This is legit. I had no idea this kind of platform was even possible for someone like me.',
    quoteBy: 'Garland · Founder',
    challenge: 'Tow defense services lose hours per case to manual research, letter drafting, and case strength assessment. Most operators are working off spreadsheets and Google Forms — losing winnable cases because they can\'t triage fast enough.',
    solution: 'Custom platform with AI-powered case triage, customer portal with magic-link auth, admin command center, automatic revenue tracking, and integration with Texas VSF licensing data.',
    features: [
      { name: 'Public Site', detail: '5-county service coverage with live VSF locator' },
      { name: 'Customer Intake', detail: '4-step form capturing all evidentiary details' },
      { name: 'Customer Portal', detail: 'Magic-link auth, case status tracking, hearing date display' },
      { name: 'Admin Command Center', detail: 'Case queue with filters, status updates, internal notes' },
      { name: 'Yakini Intelligence', detail: 'Case strength assessment in 8 seconds with TX statute citations' },
      { name: 'Revenue Automation', detail: 'Per-case revenue share auto-tracked when status set to WON' },
      { name: 'Email Pipeline', detail: 'Customer + admin + Yakini notifications on every event' },
      { name: 'VSF Database', detail: 'Searchable Texas Vehicle Storage Facility directory' },
    ],
    metrics: [
      { value: '8 sec', label: 'AI case strength assessment' },
      { value: '5', label: 'Texas counties served' },
      { value: '9', label: 'Database tables' },
      { value: '100%', label: 'Owned by founder' },
    ],
    aiTools: ['Case Triage', 'Letter Generation', 'Hearing Prep', 'License Verification'],
  },
  {
    id: 'legacyline',
    name: 'Legacyline',
    subtitle: 'Readiness Operating System',
    industry: 'CORRECTIONS · WORKFORCE · NONPROFIT',
    status: 'LIVE',
    statusColor: 'gold',
    tier: 'ENTERPRISE',
    location: 'New Mexico Pilot',
    domain: 'legacylinehq.com',
    quote: null,
    challenge: 'Reentry, workforce, and corrections programs lack a unified system to assess and document readiness across individuals, organizations, and partnerships. Manual paperwork, inconsistent scoring, no audit trail.',
    solution: '7-module readiness OS with deterministic SHA-256 scoring, three-domain evaluator system (Individual / OBR / FRARI), version-locked rulesets, full audit reproducibility.',
    features: [
      { name: '7 Core Modules', detail: 'Subject Registry, Evidence Intake, Behavioral Patterns, Readiness Scoring, Evaluator Workflow, Reporting, Longitudinal Vault' },
      { name: 'Deterministic Scoring', detail: 'SHA-256 hashed assessments with version-locked rulesets' },
      { name: 'Three Subject Types', detail: 'Individual / OBR (Organizational) / FRARI (Family-Region)' },
      { name: 'Evaluator Console', detail: 'Unified dashboard for certified evaluators across all domains' },
      { name: 'Subject Authentication', detail: 'Registry IDs, state lifecycle tracking, audit trail' },
      { name: 'BRSA Standards Authority', detail: 'Governed by BRSA Holdings standards body' },
    ],
    metrics: [
      { value: '7', label: 'Core modules' },
      { value: '3', label: 'Subject domains' },
      { value: '100%', label: 'Audit reproducibility' },
      { value: 'v1.0', label: 'FRARI scoring released' },
    ],
    aiTools: ['Document Integrity', 'Evidence Engagement Scoring', 'Pattern Analysis'],
  },
  {
    id: 'pettit-luxe',
    name: 'Pettít Luxe Group',
    subtitle: 'Private Chef & Luxury Catering',
    industry: 'HOSPITALITY · LUXURY DINING',
    status: 'BUILDING',
    statusColor: 'electric',
    tier: 'AUTHORITY TIER',
    location: 'Chicago',
    domain: 'pettit-luxe.com (TBD)',
    quote: null,
    challenge: 'Private chefs operating at the luxury tier rely on word-of-mouth and Instagram. Booking, quoting, contracts, and client relationships are managed across 6+ disconnected tools. No central system, no client portal, no scaling without losing the personal touch.',
    solution: 'Branded platform with smart event quoting, integrated booking calendar, signed digital contracts, client portal showing past events and future bookings, and AI-drafted pre-event communications.',
    features: [
      { name: 'Brand-First Design', detail: 'Editorial photography layout matching Chef Jada\'s aesthetic' },
      { name: 'Event Quoting Engine', detail: 'Dynamic quotes based on guest count, menu, location, season' },
      { name: 'Booking System', detail: 'Calendar sync, deposit collection, contract delivery' },
      { name: 'Client Portal', detail: 'Past events, upcoming bookings, menu archive, photo galleries' },
      { name: 'Yakini Intelligence', detail: 'Pre-event coordination drafts, follow-up communications' },
      { name: 'Vendor Management', detail: 'Wine pairings, equipment rentals, sous-chefs in one workflow' },
    ],
    metrics: [
      { value: 'TBD', label: 'Launch target Q2 2026' },
      { value: '$$$$', label: 'Luxury tier positioning' },
      { value: '1-on-1', label: 'White-glove client model' },
    ],
    aiTools: ['Smart Quoting', 'Customer Communication', 'Strategic Analysis', 'Letter Generation'],
  },
  {
    id: 'px3-energy',
    name: 'PX3 Energy',
    subtitle: 'Oilfield Services Operations',
    industry: 'ENERGY · INDUSTRIAL SERVICES',
    status: 'BUILDING',
    statusColor: 'electric',
    tier: 'AUTHORITY TIER',
    location: 'Odessa, Texas',
    domain: 'px3energy.com (TBD)',
    quote: null,
    challenge: 'Oilfield service companies operate across rugged conditions with crews spread over hundreds of miles. Safety incidents need fast triage. Compliance requires constant verification. Client reporting eats hours weekly. Most run on radios and clipboards.',
    solution: 'Mobile-first operations platform with crew dispatch, safety incident management, OSHA + Texas RRC compliance verification, automated client reporting, and equipment tracking.',
    features: [
      { name: 'Crew Dispatch', detail: 'Real-time crew location and assignment tracking' },
      { name: 'Safety Incident System', detail: 'Mobile incident reporting with AI severity triage' },
      { name: 'Compliance Verification', detail: 'Auto cross-check OSHA + TX RRC certifications' },
      { name: 'Client Portal', detail: 'Live job status, incident reports, deliverables tracking' },
      { name: 'Yakini Intelligence', detail: 'Incident triage, crew utilization analysis, profitability patterns' },
      { name: 'Equipment Tracking', detail: 'Maintenance schedules, deployment status, location' },
    ],
    metrics: [
      { value: 'TBD', label: 'Launch target Q2 2026' },
      { value: 'B2B', label: 'Oil & gas operators' },
      { value: 'Mobile', label: 'Field-first design' },
    ],
    aiTools: ['Incident Triage', 'Compliance Verification', 'Letter Generation', 'Strategic Analysis'],
  },
  {
    id: 'vizionz-sankofa',
    name: 'Vizionz Sankofa',
    subtitle: 'Community Services Nonprofit',
    industry: 'NONPROFIT · COMMUNITY DEVELOPMENT',
    status: 'PILOT',
    statusColor: 'gold',
    tier: 'FOUNDATION TIER',
    location: 'Albuquerque, NM',
    domain: 'vizionzsankofa.org',
    quote: null,
    challenge: 'Community nonprofits serving low-income families and refugee/immigrant populations operate on lean budgets with high accountability requirements. Grant tracking, family case management, and impact reporting must work across language barriers and limited tech literacy.',
    solution: 'Foundational platform anchored by Legacyline integration. Case tracking for families, grant compliance reporting, impact dashboards for funders, multi-language family-facing materials.',
    features: [
      { name: 'Family Case Management', detail: 'Track services delivered to each household' },
      { name: 'Grant Compliance', detail: 'Auto-document grant deliverables and outcomes' },
      { name: 'Impact Dashboards', detail: 'Funder-ready reporting on lives touched' },
      { name: 'Legacyline Pilot', detail: 'First Track 1 + Track 2 deployment of readiness OS' },
      { name: 'Multi-language Support', detail: 'English + Spanish family-facing materials' },
    ],
    metrics: [
      { value: 'Active', label: 'Legacyline pilot partner' },
      { value: 'Granted', label: 'BRSA Foundation 501(c)(3)' },
      { value: 'NM', label: 'Albuquerque-based' },
    ],
    aiTools: ['Document Generation', 'Family Communication', 'Pattern Analysis'],
  },
  {
    id: 'transportation-services',
    name: 'Independent Transportation Services',
    subtitle: 'Black-Owned Mobility Operators',
    industry: 'TRANSPORTATION · MOBILITY',
    status: 'PROSPECTIVE',
    statusColor: 'muted',
    tier: 'AUTHORITY TIER',
    location: 'Multi-market',
    domain: 'TBD per operator',
    quote: null,
    challenge: 'Independent transportation operators (executive shuttles, airport runs, special events) compete against rideshare giants without infrastructure to match. Most operate via text and spreadsheet — losing bookings to faster, more polished competitors.',
    solution: 'Operator-branded platform with online booking, real-time dispatch, driver app, customer portal showing past rides and saved routes, and AI-powered booking assistant.',
    features: [
      { name: 'Branded Booking Site', detail: 'Operator\'s domain, brand, pricing — not a marketplace' },
      { name: 'Real-time Dispatch', detail: 'Driver app with assignment, navigation, status updates' },
      { name: 'Customer Portal', detail: 'Past rides, saved routes, recurring bookings, receipts' },
      { name: 'AI Booking Assistant', detail: 'Quote generation, route optimization, calendar coordination' },
      { name: 'Compliance Tracking', detail: 'Driver licenses, insurance, vehicle inspections' },
    ],
    metrics: [
      { value: 'Q3 2026', label: 'Target launch' },
      { value: 'Multi-tenant', label: 'Designed for operator network' },
    ],
    aiTools: ['Customer Communication', 'Letter Generation', 'Strategic Analysis', 'Verification'],
  },
  {
    id: 'production-co',
    name: 'Independent Production Companies',
    subtitle: 'Film & TV Production',
    industry: 'CREATIVE · ENTERTAINMENT',
    status: 'PROSPECTIVE',
    statusColor: 'muted',
    tier: 'INTELLIGENCE TIER',
    location: 'Multi-market',
    domain: 'TBD per company',
    quote: null,
    challenge: 'Independent production companies juggle dozens of vendors, locations, contracts, and crew across each project. Most run on PDF agreements and shared Google Drives — losing signed contracts, missing payments, struggling with project profitability analysis.',
    solution: 'Production operations platform with project tracking, vendor and location management, integrated digital contracts, crew coordination, and AI-powered project feasibility analysis.',
    features: [
      { name: 'Project Hub', detail: 'Each production has its own workspace with all assets' },
      { name: 'Vendor Management', detail: 'Locations, equipment, talent, post-production in one system' },
      { name: 'Digital Contracts', detail: 'Crew agreements, location releases, talent contracts' },
      { name: 'Crew Coordination', detail: 'Call sheets, schedules, payment tracking' },
      { name: 'Yakini Intelligence', detail: 'Project feasibility analysis, profitability patterns' },
    ],
    metrics: [
      { value: 'Q4 2026', label: 'Target launch' },
      { value: 'B2B', label: 'Production company SaaS' },
    ],
    aiTools: ['Project Triage', 'Letter Generation', 'Customer Communication', 'Strategic Analysis'],
  },
]

export default function PlatformsPage() {
  return (
    <SiteShell>
      <style>{PAGE_CSS}</style>

      {/* ───── PAGE HEADER ───── */}
      <header className="yk-page-header pl-header">
        <div className="yk-page-header-inner">
          <div className="yk-eyebrow">
            <span className="yk-eyebrow-dot" />
            <span>YAKINI PLATFORMS</span>
          </div>
          <h1 className="yk-page-h1">
            Platforms for
            <br />
            <span className="yk-italic">serious founders</span>
            <br />
            <span className="yk-gold">across every industry.</span>
          </h1>
          <p className="yk-page-sub">
            Tow defense services. Private chefs. Oilfield operators. Community nonprofits.
            Transportation companies. Production studios. Each Yakini-built platform is
            custom-architected for its industry — same foundation, wildly different applications.
          </p>

          <div className="pl-stats">
            <div className="pl-stat">
              <span className="pl-stat-num">2</span>
              <span className="pl-stat-lbl">Live platforms</span>
            </div>
            <div className="pl-stat">
              <span className="pl-stat-num">3</span>
              <span className="pl-stat-lbl">In active build</span>
            </div>
            <div className="pl-stat">
              <span className="pl-stat-num">7+</span>
              <span className="pl-stat-lbl">Industries served</span>
            </div>
            <div className="pl-stat">
              <span className="pl-stat-num">100%</span>
              <span className="pl-stat-lbl">Founder-owned</span>
            </div>
          </div>
        </div>
      </header>

      {/* ───── PLATFORMS LIST ───── */}
      <section className="yk-section pl-section">
        <div className="yk-section-inner">
          {PLATFORMS.map((p, i) => (
            <article key={p.id} id={p.id} className={`pl-card ${i === 0 ? 'pl-card-featured' : ''}`}>
              {/* Header strip */}
              <div className="pl-card-strip">
                <div className="pl-card-strip-left">
                  <span className="pl-card-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="pl-card-industry">{p.industry}</span>
                </div>
                <div className="pl-card-strip-right">
                  <span className={`pl-status pl-status-${p.statusColor}`}>{p.status}</span>
                  <span className="pl-tier">{p.tier}</span>
                </div>
              </div>

              {/* Headline */}
              <div className="pl-card-headline">
                <h2 className="pl-card-name">{p.name}</h2>
                <p className="pl-card-subtitle">{p.subtitle}</p>
                <div className="pl-card-meta">
                  <span>📍 {p.location}</span>
                  <span>·</span>
                  <span>🌐 {p.domain}</span>
                </div>
              </div>

              {/* Quote (if present) */}
              {p.quote && (
                <div className="pl-card-quote">
                  <p>"{p.quote}"</p>
                  <span className="pl-card-quote-by">— {p.quoteBy}</span>
                </div>
              )}

              {/* Challenge / Solution */}
              <div className="pl-card-narrative">
                <div className="pl-narrative-block">
                  <div className="pl-narrative-h">CHALLENGE</div>
                  <p>{p.challenge}</p>
                </div>
                <div className="pl-narrative-block">
                  <div className="pl-narrative-h">SOLUTION</div>
                  <p>{p.solution}</p>
                </div>
              </div>

              {/* Features */}
              <div className="pl-card-features">
                <div className="pl-features-h">PLATFORM FEATURES</div>
                <div className="pl-features-grid">
                  {p.features.map(f => (
                    <div key={f.name} className="pl-feature">
                      <div className="pl-feature-name">{f.name}</div>
                      <div className="pl-feature-detail">{f.detail}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Tools */}
              <div className="pl-card-ai">
                <div className="pl-ai-h">YAKINI INTELLIGENCE TOOLS</div>
                <div className="pl-ai-tags">
                  {p.aiTools.map(tool => (
                    <span key={tool} className="pl-ai-tag">{tool}</span>
                  ))}
                </div>
              </div>

              {/* Metrics */}
              <div className="pl-card-metrics">
                {p.metrics.map(m => (
                  <div key={m.label} className="pl-metric">
                    <div className="pl-metric-num">{m.value}</div>
                    <div className="pl-metric-lbl">{m.label}</div>
                  </div>
                ))}
              </div>

              {/* CTA strip for live platforms */}
              {p.status === 'LIVE' && (
                <div className="pl-card-cta">
                  <a href={`https://${p.domain}`} target="_blank" rel="noopener" className="yk-btn-ghost">
                    <span>Visit live platform</span>
                    <span className="yk-btn-arrow">↗</span>
                  </a>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* ───── FINAL CTA ───── */}
      <section className="yk-section pl-final">
        <div className="yk-section-inner">
          <div className="pl-final-content">
            <div className="yk-eyebrow">
              <span className="yk-eyebrow-dot" />
              <span>YOUR INDUSTRY ISN'T LISTED?</span>
            </div>
            <h2 className="pl-final-h2">
              We don't have a vertical yet.
              <br />
              <span className="yk-italic">We have</span>
              <br />
              <span className="yk-gold">a methodology.</span>
            </h2>
            <p className="pl-final-sub">
              Yakini doesn't build templates. We build custom infrastructure for every founder we partner with.
              If you're operating a serious business in any industry — and your competitors are running on
              spreadsheets — let's talk about what your platform looks like.
            </p>
            <div className="pl-final-ctas">
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

const PAGE_CSS = `
  /* ═══ PAGE HEADER ═══ */
  .pl-header::before {
    background: radial-gradient(ellipse at center,
      rgba(200, 168, 75, 0.15) 0%,
      rgba(74, 144, 217, 0.06) 40%,
      transparent 70%) !important;
  }
  .pl-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
    margin-top: 60px;
    padding-top: 40px;
    border-top: 1px solid var(--line);
    max-width: 800px;
  }
 }
  .pl-stat {
    display: flex; flex-direction: column;
    border-right: 1px solid var(--line);
    padding-right: 24px;
  }
  .pl-stat:last-child { border-right: none; }
  .pl-stat-num {
    font-family: var(--font-display);
    font-size: clamp(36px, 5vw, 56px);
    font-weight: 500;
    color: var(--gold);
    line-height: 1;
    margin-bottom: 8px;
    font-style: italic;
  }
  .pl-stat-lbl {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.15em;
    color: var(--muted);
    text-transform: uppercase;
  }

  @media (max-width: 700px) {
    .pl-stats { grid-template-columns: 1fr 1fr; gap: 24px 16px; }
    .pl-stat { border-right: none; padding-right: 0; }
  }

  /* ═══ PLATFORMS LIST ═══ */
  .pl-section {
    background: var(--black);
    padding-top: 100px;
  }

  .pl-card {
    margin-bottom: 80px;
    padding: 60px;
    background: rgba(255,255,255,0.02);
    border: 1px solid var(--line);
    position: relative;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .pl-card-featured {
    background: linear-gradient(180deg, rgba(200, 168, 75, 0.04) 0%, rgba(255,255,255,0.02) 100%);
    border-color: rgba(200, 168, 75, 0.3);
  }
  .pl-card-featured::before {
    content: ''; position: absolute;
    top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, var(--electric), var(--gold), var(--electric));
    background-size: 200% 100%;
    animation: pl-gradient-shift 4s ease infinite;
  }
  @keyframes pl-gradient-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  /* Header strip */
  .pl-card-strip {
    display: flex; justify-content: space-between; align-items: center;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--line);
    margin-bottom: 32px;
    flex-wrap: wrap;
    gap: 16px;
  }
  .pl-card-strip-left {
    display: flex; align-items: center; gap: 16px;
  }
  .pl-card-num {
    font-family: var(--font-display);
    font-size: 24px;
    font-style: italic;
    font-weight: 400;
    color: var(--muted);
  }
  .pl-card-industry {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.2em;
    color: var(--muted);
    text-transform: uppercase;
  }
  .pl-card-strip-right {
    display: flex; gap: 8px; align-items: center;
  }
  .pl-status {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.2em;
    padding: 5px 12px;
    border: 1px solid;
    text-transform: uppercase;
  }
  .pl-status-gold {
    color: var(--gold);
    border-color: var(--gold);
    background: var(--gold-soft);
  }
  .pl-status-electric {
    color: var(--electric);
    border-color: var(--electric);
    background: var(--electric-soft);
  }
  .pl-status-muted {
    color: var(--muted);
    border-color: var(--line-strong);
  }
  .pl-tier {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.2em;
    color: var(--muted);
    padding: 5px 12px;
    border: 1px solid var(--line-strong);
    text-transform: uppercase;
  }

  /* Headline */
  .pl-card-headline { margin-bottom: 32px; }
  .pl-card-name {
    font-family: var(--font-display);
    font-size: clamp(36px, 5vw, 64px);
    font-weight: 500;
    line-height: 1;
    color: var(--cream);
    margin-bottom: 12px;
    letter-spacing: -0.02em;
  }
  .pl-card-subtitle {
    font-family: var(--font-display);
    font-size: clamp(20px, 2vw, 28px);
    font-style: italic;
    color: var(--gold);
    margin-bottom: 16px;
  }
  .pl-card-meta {
    display: flex; gap: 12px; flex-wrap: wrap;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--muted);
    letter-spacing: 0.05em;
  }

  /* Quote */
  .pl-card-quote {
    margin: 32px 0;
    padding: 28px 32px;
    background: linear-gradient(180deg, rgba(200, 168, 75, 0.08) 0%, rgba(200, 168, 75, 0.02) 100%);
    border-left: 3px solid var(--gold);
  }
  .pl-card-quote p {
    font-family: var(--font-display);
    font-size: clamp(20px, 2.2vw, 28px);
    font-style: italic;
    font-weight: 500;
    line-height: 1.4;
    color: var(--cream);
    margin-bottom: 12px;
  }
  .pl-card-quote-by {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--gold);
    letter-spacing: 0.05em;
  }

  /* Narrative */
  .pl-card-narrative {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    margin-bottom: 40px;
    padding-bottom: 32px;
    border-bottom: 1px solid var(--line);
  }
  .pl-narrative-h {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.25em;
    color: var(--gold);
    margin-bottom: 12px;
    text-transform: uppercase;
  }
  .pl-narrative-block p {
    font-size: 15px;
    line-height: 1.8;
    color: var(--cream);
  }

  @media (max-width: 800px) {
    .pl-card-narrative { grid-template-columns: 1fr; gap: 24px; }
  }

  /* Features */
  .pl-card-features { margin-bottom: 32px; }
  .pl-features-h, .pl-ai-h {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.25em;
    color: var(--gold);
    margin-bottom: 16px;
    text-transform: uppercase;
  }
  .pl-features-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .pl-feature {
    padding: 16px 20px;
    background: rgba(255,255,255,0.02);
    border-left: 2px solid var(--gold);
  }
  .pl-feature-name {
    font-family: var(--font-body);
    font-size: 14px;
    font-weight: 600;
    color: var(--cream);
    margin-bottom: 4px;
  }
  .pl-feature-detail {
    font-size: 13px;
    color: var(--muted);
    line-height: 1.5;
  }

  @media (max-width: 700px) {
    .pl-features-grid { grid-template-columns: 1fr; }
  }

  /* AI Tools */
  .pl-card-ai {
    margin-bottom: 32px;
    padding: 24px;
    background: rgba(74, 144, 217, 0.04);
    border: 1px solid rgba(74, 144, 217, 0.2);
  }
  .pl-card-ai .pl-ai-h { color: var(--electric); margin-bottom: 12px; }
  .pl-ai-tags {
    display: flex; gap: 8px; flex-wrap: wrap;
  }
  .pl-ai-tag {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    padding: 6px 12px;
    background: var(--navy-deep);
    border: 1px solid var(--electric);
    color: var(--electric);
    text-transform: uppercase;
  }

  /* Metrics */
  .pl-card-metrics {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    padding-top: 24px;
    border-top: 1px solid var(--line);
  }
  .pl-metric {
    display: flex; flex-direction: column;
    padding-right: 16px;
    border-right: 1px solid var(--line);
  }
  .pl-metric:last-child { border-right: none; }
  .pl-metric-num {
    font-family: var(--font-display);
    font-size: clamp(28px, 3vw, 40px);
    font-weight: 500;
    color: var(--gold);
    line-height: 1;
    font-style: italic;
    margin-bottom: 8px;
  }
  .pl-metric-lbl {
    font-size: 11px;
    color: var(--muted);
    line-height: 1.4;
    letter-spacing: 0.05em;
  }

  @media (max-width: 700px) {
    .pl-card-metrics { grid-template-columns: 1fr 1fr; gap: 16px; }
    .pl-metric { border-right: none; }
  }

  /* CTA strip */
  .pl-card-cta {
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid var(--line);
    display: flex;
  }

  /* Mobile padding */
  @media (max-width: 700px) {
    .pl-card { padding: 32px 24px; }
  }

  /* ═══ FINAL CTA ═══ */
  .pl-final {
    background: linear-gradient(180deg, var(--black) 0%, var(--navy-deep) 100%);
    text-align: center;
  }
  .pl-final-content { max-width: 900px; margin: 0 auto; }
  .pl-final-h2 {
    font-family: var(--font-display);
    font-size: clamp(48px, 7vw, 96px);
    line-height: 1;
    font-weight: 400;
    letter-spacing: -0.02em;
    color: var(--cream);
    margin-bottom: 32px;
  }
  .pl-final-sub {
    font-size: 18px;
    line-height: 1.7;
    color: var(--muted);
    max-width: 640px;
    margin: 0 auto 48px;
  }
  .pl-final-ctas {
    display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;
  }
`
