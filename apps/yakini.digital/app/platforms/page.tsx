'use client'

import { SiteShell } from '@/components/SiteShell'
import { INDUSTRY_KITS, OPERATOR_BUILDS } from '@/lib/industry-kits'

// ═════════════════════════════════════════════════════════════════════════
// YAKINI PLATFORMS — Case Study Showcase
// File: apps/yakini.digital/app/platforms/page.tsx
//
// Purpose: Operator systems messaging, industry kits, larger builds, live proof.
// Industry Kits come first so visitors find their vertical. Operator Builds
// (anonymous — no client names) surface enterprise-style work without inventing LIVE metrics.
// Live platforms follow as the proof. No TBD / HELD / Black-owned transportation.
// TheyTowedMyCar featured first among live platforms.
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
    id: 'vimaa',
    name: 'Kamili',
    subtitle: 'Readiness Operating System',
    industry: 'CORRECTIONS · WORKFORCE · NONPROFIT',
    status: 'LIVE',
    statusColor: 'gold',
    tier: '',
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
    id: 'vizionz-sankofa',
    name: 'Vizionz Sankofa',
    subtitle: 'Community Services Nonprofit',
    industry: 'NONPROFIT · COMMUNITY DEVELOPMENT',
    status: 'LIVE',
    statusColor: 'gold',
    tier: '',
    location: 'Albuquerque, NM',
    domain: 'vizionzsankofa.org',
    quote: null,
    challenge: 'Community nonprofits serving low-income families and refugee/immigrant populations operate on lean budgets with high accountability requirements. Grant tracking, family case management, and impact reporting must work across language barriers and limited tech literacy.',
    solution: 'Foundational platform anchored by Kamili integration. Case tracking for families, grant compliance reporting, impact dashboards for funders, multi-language family-facing materials.',
    features: [
      { name: 'Family Case Management', detail: 'Track services delivered to each household' },
      { name: 'Grant Compliance', detail: 'Auto-document grant deliverables and outcomes' },
      { name: 'Impact Dashboards', detail: 'Funder-ready reporting on lives touched' },
      { name: 'Kamili pilot', detail: 'First Track 1 + Track 2 deployment of readiness OS' },
      { name: 'Multi-language Support', detail: 'English + Spanish family-facing materials' },
    ],
    metrics: [
      { value: 'Active', label: 'Kamili pilot partner' },
      { value: 'Granted', label: 'BRSA Foundation 501(c)(3)' },
      { value: 'NM', label: 'Albuquerque-based' },
    ],
    aiTools: ['Document Generation', 'Family Communication', 'Pattern Analysis'],
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
            Operator systems
            <br />
            <span className="yk-italic">for serious</span>
            <br />
            <span className="yk-gold">operators.</span>
          </h1>
          <p className="yk-page-sub">
            We don&apos;t build websites. We build operator systems — intake, workflows,
            portals, and intelligence your business runs on. Insurance agencies, lawyers,
            accountants, industrial crews, nonprofits — find your industry below.
          </p>

          <nav className="pl-jump" aria-label="Jump to your industry">
            <span className="pl-jump-label">FIND YOUR INDUSTRY</span>
            <div className="pl-jump-chips">
              {INDUSTRY_KITS.map(k => (
                <a key={k.id} href={`#${k.id}`} className="pl-jump-chip">{k.short}</a>
              ))}
            </div>
          </nav>

          <div className="pl-stats">
            <div className="pl-stat">
              <span className="pl-stat-num">3</span>
              <span className="pl-stat-lbl">Live platforms</span>
            </div>
            <div className="pl-stat">
              <span className="pl-stat-num">{INDUSTRY_KITS.length}</span>
              <span className="pl-stat-lbl">Industry kits</span>
            </div>
            <div className="pl-stat">
              <span className="pl-stat-num">100%</span>
              <span className="pl-stat-lbl">Founder-owned</span>
            </div>
            <div className="pl-stat">
              <span className="pl-stat-num">Ops</span>
              <span className="pl-stat-lbl">Not websites</span>
            </div>
          </div>
        </div>
      </header>

      {/* ───── INDUSTRY KITS ───── */}
      <section className="yk-section pl-kits" id="kits">
        <div className="yk-section-inner">
          <div className="yk-section-tag">
            <span className="yk-num">01</span>
            <span>Industry Kits</span>
          </div>
          <h2 className="pl-section-h2">
            We already built
            <br />
            <span className="yk-italic">for your </span>
            <span className="yk-gold">industry.</span>
          </h2>
          <p className="pl-section-lead">
            A kit is an operator system pre-configured for one vertical — intake, portal, workflows, and
            intelligence tuned to your industry, then branded to you. Your domain. Your data. Not a brochure site.
            Proven kits run on a live platform today. Ready kits are scoped with you in one conversation.
          </p>

          <div className="pl-kits-grid">
            {INDUSTRY_KITS.map(k => (
              <article key={k.id} id={k.id} className={`pl-kit pl-kit-${k.status}`}>
                <div className="pl-kit-top">
                  <span className="pl-kit-badge">INDUSTRY KIT</span>
                  <span className={`pl-status ${k.status === 'proven' ? 'pl-status-gold' : 'pl-status-electric'}`}>
                    {k.status === 'proven' ? 'PROVEN · LIVE' : 'READY TO SCOPE'}
                  </span>
                </div>
                <div className="pl-kit-industry">{k.industry}</div>
                <h3 className="pl-kit-name">{k.name}</h3>
                <p className="pl-kit-for">{k.forWho}</p>

                <div className="pl-kit-includes-h">WHAT&apos;S IN THE KIT</div>
                <ul className="pl-kit-includes">
                  {k.includes.map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                <div className="pl-kit-ai">
                  {k.aiTools.map(tool => (
                    <span key={tool} className="pl-ai-tag">{tool}</span>
                  ))}
                </div>

                <div className="pl-kit-proof">
                  {k.proof ? (
                    <>
                      <span className="pl-kit-proof-lbl">PROVEN ON</span>
                      <a href={`#${k.proof.anchor}`} className="pl-kit-proof-name">{k.proof.name} ↓</a>
                    </>
                  ) : (
                    <>
                      <span className="pl-kit-proof-lbl">BUILT ON</span>
                      <span className="pl-kit-proof-name pl-kit-proof-plain">The Yakini platform core behind our live builds</span>
                    </>
                  )}
                </div>

                <a href={`/apply?kit=${k.id}`} className="yk-btn-ghost pl-kit-cta">
                  <span>Start a conversation</span>
                  <span className="yk-btn-arrow">→</span>
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───── OPERATOR SYSTEMS / LARGER BUILDS ───── */}
      <section className="yk-section pl-ops" id="operator-systems">
        <div className="yk-section-inner">
          <div className="yk-section-tag">
            <span className="yk-num">02</span>
            <span>Operator Systems</span>
          </div>
          <h2 className="pl-section-h2">
            Not a website.
            <br />
            <span className="yk-italic">The floor </span>
            <span className="yk-gold">you run on.</span>
          </h2>
          <p className="pl-section-lead">
            Yakini builds operator systems — custom software that takes cost out of how you run the business.
            That includes industry kits for agencies and practices, and larger builds for established companies
            that need job cost, crews, compliance, and billing under one roof.
          </p>

          <div className="pl-ops-callout">
            <div className="pl-ops-callout-label">WHAT AN OPERATOR SYSTEM IS</div>
            <p>
              Intake, workflows, portals, intelligence, and the admin command center — owned by you.
              Built for how your people actually work. The same discipline behind our live platforms,
              sized for startups and for bigger company builds.
            </p>
          </div>

          <div className="pl-ops-builds-h">LARGER BUILDS · PROOF OF SCALE</div>
          <div className="pl-ops-grid">
            {OPERATOR_BUILDS.map(b => (
              <article key={b.id} id={b.id} className="pl-ops-card">
                <div className="pl-ops-card-top">
                  <span className="pl-ops-badge">OPERATOR BUILD</span>
                  <span className="pl-status pl-status-electric">ENTERPRISE SCOPE</span>
                </div>
                <div className="pl-ops-label">{b.label}</div>
                <h3 className="pl-ops-name">{b.name}</h3>
                <p className="pl-ops-scope">{b.scope}</p>
                <p className="pl-ops-note">{b.note}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───── PLATFORMS LIST ───── */}
      <section className="yk-section pl-section" id="live">
        <div className="yk-section-inner">
          <div className="yk-section-tag">
            <span className="yk-num">03</span>
            <span>Live Platforms</span>
          </div>
          <h2 className="pl-section-h2">
            The proof
            <br />
            <span className="yk-italic">is </span>
            <span className="yk-gold">live.</span>
          </h2>
          <p className="pl-section-lead">
            Real founders, real operator systems. Each one is the foundation of an Industry Kit above.
          </p>
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
                  {p.tier && <span className="pl-tier">{p.tier}</span>}
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
              <span className="yk-italic">We build</span>
              <br />
              <span className="yk-gold">operator systems.</span>
            </h2>
            <p className="pl-final-sub">
              Yakini doesn't build templates or brochure sites. We build the system your business runs on —
              for insurance agencies, law practices, accounting firms, industrial crews, and anyone still
              leaking time and money into spreadsheets. Let's talk about what your operator system looks like.
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
  .pl-header {
    background: linear-gradient(180deg, rgba(10, 9, 8, 0.20) 0%, rgba(10, 9, 8, 0.40) 100%), url('/yakini-platforms-bg.jpg') center center / cover no-repeat;
    min-height: 600px;
    position: relative;
  }
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

  /* ═══ INDUSTRY JUMP CHIPS ═══ */
  .pl-jump {
    margin-top: 40px;
    display: flex; flex-direction: column; gap: 14px;
  }
  .pl-jump-label {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.25em;
    color: var(--gold);
  }
  .pl-jump-chips { display: flex; gap: 10px; flex-wrap: wrap; }
  .pl-jump-chip {
    font-size: 13px;
    font-weight: 500;
    color: var(--cream);
    text-decoration: none;
    padding: 10px 18px;
    border: 1px solid var(--line-strong);
    background: rgba(10, 9, 8, 0.55);
    transition: all 0.25s;
  }
  .pl-jump-chip:hover {
    border-color: var(--gold);
    color: var(--gold);
    background: var(--gold-soft);
  }

  /* ═══ SECTION HEADS ═══ */
  .pl-section-h2 {
    font-family: var(--font-display);
    font-size: clamp(44px, 6vw, 84px);
    line-height: 0.98;
    font-weight: 400;
    letter-spacing: -0.02em;
    color: var(--cream);
    margin-bottom: 28px;
  }
  .pl-section-lead {
    font-size: 17px;
    line-height: 1.75;
    color: var(--muted);
    max-width: 720px;
    margin-bottom: 64px;
  }

  /* ═══ INDUSTRY KITS ═══ */
  .pl-kits {
    background: linear-gradient(180deg, var(--black) 0%, var(--black-soft) 100%);
    border-bottom: 1px solid var(--line);
    padding-top: 110px;
  }
  .pl-kits-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
  }
  .pl-kit {
    display: flex; flex-direction: column;
    padding: 36px 32px;
    background: rgba(255,255,255,0.02);
    border: 1px solid var(--line);
    position: relative;
    overflow: hidden;
    scroll-margin-top: 110px;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .pl-kit::before {
    content: ''; position: absolute;
    top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, var(--gold), transparent);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.5s;
  }
  .pl-kit:hover, .pl-kit:target {
    border-color: rgba(200, 168, 75, 0.45);
    background: linear-gradient(180deg, rgba(200, 168, 75, 0.05) 0%, rgba(255,255,255,0.02) 100%);
    transform: translateY(-3px);
  }
  .pl-kit:hover::before, .pl-kit:target::before { transform: scaleX(1); }
  .pl-kit-proven { border-color: rgba(200, 168, 75, 0.22); }
  .pl-kit-top {
    display: flex; justify-content: space-between; align-items: center;
    gap: 12px; flex-wrap: wrap;
    margin-bottom: 24px;
  }
  .pl-kit-badge {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.2em;
    color: var(--muted);
  }
  .pl-kit-industry {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.18em;
    color: var(--gold);
    margin-bottom: 12px;
    line-height: 1.6;
  }
  .pl-kit-name {
    font-family: var(--font-display);
    font-size: clamp(28px, 2.6vw, 36px);
    font-weight: 500;
    line-height: 1.05;
    color: var(--cream);
    letter-spacing: -0.01em;
    margin-bottom: 14px;
  }
  .pl-kit-for {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 18px;
    line-height: 1.5;
    color: var(--muted);
    margin-bottom: 24px;
  }
  .pl-kit-includes-h {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.25em;
    color: var(--gold);
    margin-bottom: 12px;
  }
  .pl-kit-includes {
    list-style: none;
    padding: 0; margin: 0 0 24px;
    display: flex; flex-direction: column; gap: 8px;
  }
  .pl-kit-includes li {
    font-size: 14px;
    line-height: 1.5;
    color: var(--cream);
    padding-left: 14px;
    border-left: 2px solid var(--gold);
  }
  .pl-kit-ai {
    display: flex; gap: 6px; flex-wrap: wrap;
    margin-bottom: 24px;
  }
  .pl-kit-ai .pl-ai-tag { font-size: 10px; padding: 5px 10px; }
  .pl-kit-proof {
    margin-top: auto;
    display: flex; flex-direction: column; gap: 4px;
    padding: 14px 0;
    border-top: 1px dashed var(--line-strong);
    border-bottom: 1px dashed var(--line-strong);
    margin-bottom: 24px;
  }
  .pl-kit-proof-lbl {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.2em;
    color: var(--muted);
  }
  .pl-kit-proof-name {
    font-family: var(--font-display);
    font-size: 18px;
    color: var(--gold);
    text-decoration: none;
  }
  .pl-kit-proof-name:hover { text-decoration: underline; }
  .pl-kit-proof-plain { color: var(--cream); font-style: italic; }
  .pl-kit-proof-plain:hover { text-decoration: none; }
  .pl-kit-cta { align-self: flex-start; }

  @media (max-width: 700px) {
    .pl-kits-grid { grid-template-columns: 1fr; }
    .pl-kit { padding: 28px 22px; }
  }

  /* ═══ OPERATOR SYSTEMS ═══ */
  .pl-ops {
    background: linear-gradient(180deg, var(--black-soft) 0%, var(--black) 100%);
    border-bottom: 1px solid var(--line);
    padding-top: 110px;
  }
  .pl-ops-callout {
    max-width: 820px;
    padding: 28px 32px;
    margin-bottom: 48px;
    border: 1px solid rgba(200, 168, 75, 0.35);
    background: linear-gradient(180deg, rgba(200, 168, 75, 0.08) 0%, rgba(255,255,255,0.02) 100%);
  }
  .pl-ops-callout-label {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.25em;
    color: var(--gold);
    margin-bottom: 12px;
  }
  .pl-ops-callout p {
    font-size: 17px;
    line-height: 1.7;
    color: var(--cream);
    margin: 0;
  }
  .pl-ops-builds-h {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.25em;
    color: var(--gold);
    margin-bottom: 20px;
  }
  .pl-ops-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
  @media (max-width: 800px) {
    .pl-ops-grid { grid-template-columns: 1fr; }
  }
  .pl-ops-card {
    padding: 36px 32px;
    background: rgba(255,255,255,0.02);
    border: 1px solid var(--line);
    scroll-margin-top: 110px;
  }
  .pl-ops-card-top {
    display: flex; justify-content: space-between; align-items: center;
    gap: 12px; flex-wrap: wrap;
    margin-bottom: 20px;
  }
  .pl-ops-badge {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.2em;
    color: var(--muted);
  }
  .pl-ops-label {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.18em;
    color: var(--electric);
    margin-bottom: 12px;
  }
  .pl-ops-name {
    font-family: var(--font-display);
    font-size: clamp(28px, 3vw, 40px);
    font-weight: 500;
    line-height: 1.05;
    color: var(--cream);
    margin-bottom: 14px;
  }
  .pl-ops-scope {
    font-size: 16px;
    line-height: 1.7;
    color: var(--cream);
    margin-bottom: 16px;
  }
  .pl-ops-note {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 16px;
    line-height: 1.5;
    color: var(--muted);
    margin: 0;
    padding-top: 16px;
    border-top: 1px dashed var(--line-strong);
  }

  /* ═══ PLATFORMS LIST ═══ */
  .pl-section {
    background: var(--black);
    padding-top: 100px;
  }

  .pl-card {
    scroll-margin-top: 110px;
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
