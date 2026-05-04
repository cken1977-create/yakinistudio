'use client'

import { useState, useEffect } from 'react'

// ═════════════════════════════════════════════════════════════════════════
// YAKINI HOME v3 — "Digital infrastructure for serious founders."
// File: apps/yakini.digital/app/page.tsx
//
// v3 changes (May 4, 2026):
//   - Migrated to Cosmogram brand identity (Dogon-anchored)
//   - Warm Black + Antique Gold + Bone palette
//   - Fraunces display + Inter body + JetBrains Mono accents
//   - Brand mark replaced with the B2 Cosmogram (cosmic egg + sene)
//   - Added Section 03·B — Composer (the operating layer)
//   - Added Section 03·C — Yakini Studios (production arm)
//   - Section 03·A retained as Yakini Intelligence (existing tools)
// ═════════════════════════════════════════════════════════════════════════

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <>
      <style>{CSS}</style>

      {/* ───── NAV ───── */}
      <nav className={`yk-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="yk-nav-inner">
          <a href="/" className="yk-brand" aria-label="Yakini home">
            <CosmogramMark size={36} />
            <div className="yk-brand-text">
              <span className="yk-brand-name">YAKINI</span>
              <span className="yk-brand-sub">DIGITAL INFRASTRUCTURE</span>
            </div>
          </a>

          <div className="yk-nav-center">
            <a href="/platforms">Platforms</a>
            <a href="/intelligence">Intelligence</a>
            <a href="/process">Process</a>
            <a href="/pricing">Pricing</a>
            <a href="/about">About</a>
          </div>

          <a href="/apply" className="yk-nav-cta">
            <span>Apply</span>
            <span className="yk-nav-cta-arrow">→</span>
          </a>

          <button
            className={`yk-burger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="yk-mobile-menu">
          <a href="/platforms" onClick={() => setMenuOpen(false)}>Platforms</a>
          <a href="/intelligence" onClick={() => setMenuOpen(false)}>Intelligence</a>
          <a href="/process" onClick={() => setMenuOpen(false)}>Process</a>
          <a href="/pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
          <a href="/about" onClick={() => setMenuOpen(false)}>About</a>
          <a href="/apply" className="yk-mobile-cta" onClick={() => setMenuOpen(false)}>Apply →</a>
        </div>
      )}

      {/* ───── HERO ───── */}
      <section className="yk-hero">
        <div className="yk-hero-bg">
          <div className="yk-hero-grid" />
          <div className="yk-hero-glow" />
        </div>

        <div className="yk-hero-inner">
          <div className="yk-hero-eyebrow">
            <span className="yk-eyebrow-dot" />
            <span>YAKINI DIGITAL INFRASTRUCTURE</span>
          </div>

          <h1 className="yk-hero-h1">
            <span className="yk-hero-line">Digital infrastructure</span>
            <span className="yk-hero-line yk-hero-italic">for serious</span>
            <span className="yk-hero-line yk-hero-gold">founders.</span>
          </h1>

          <p className="yk-hero-sub">
            We don&apos;t make websites. We build the platforms your business runs on —
            with intelligence baked into the foundation.
          </p>

          <div className="yk-hero-ctas">
            <a href="/apply" className="yk-btn-primary">
              <span>Apply for partnership</span>
              <span className="yk-btn-arrow">→</span>
            </a>
            <a href="/platforms" className="yk-btn-ghost">
              <span>See our platforms</span>
            </a>
          </div>

          <div className="yk-hero-marquee">
            <div className="yk-marquee-track">
              <span>· LEGACYLINE</span>
              <span>· THEYTOWEDMYCAR</span>
              <span>· VIZIONZ SANKOFA</span>
              <span>· PETTÍT LUXE</span>
              <span>· PX3 ENERGY</span>
              <span>· COMPOSER</span>
              <span>· YAKINI STUDIOS</span>
              <span>· LEGACYLINE</span>
              <span>· THEYTOWEDMYCAR</span>
              <span>· VIZIONZ SANKOFA</span>
              <span>· PETTÍT LUXE</span>
              <span>· PX3 ENERGY</span>
            </div>
          </div>
        </div>

        <div className="yk-hero-scroll">
          <div className="yk-scroll-line" />
          <span>Scroll</span>
        </div>
      </section>

      {/* ───── 01 MANIFESTO ───── */}
      <section className="yk-section yk-manifesto">
        <div className="yk-section-inner">
          <div className="yk-manifesto-grid">
            <div className="yk-manifesto-label">
              <span className="yk-num">01</span>
              <span>Manifesto</span>
            </div>
            <div className="yk-manifesto-body">
              <p className="yk-manifesto-p">
                Most agencies sell you a <em>website</em>.
              </p>
              <p className="yk-manifesto-p">
                We build the <span className="yk-gold">infrastructure layer</span> your business actually runs on —
                customer portals, admin command centers, AI-powered tools, automated workflows.
              </p>
              <p className="yk-manifesto-p">
                Marketing firms can&apos;t compete with this work.
                <br />
                They don&apos;t build software. We do.
              </p>
              <p className="yk-manifesto-credit">— BUILT BY YAKINI</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── 02 PLATFORMS ───── */}
      <section className="yk-section yk-platforms">
        <div className="yk-section-inner">
          <div className="yk-section-head">
            <div className="yk-section-tag">
              <span className="yk-num">02</span>
              <span>Platforms</span>
            </div>
            <h2 className="yk-section-h2">
              We don&apos;t build sites.
              <br />
              <span className="yk-italic">We build </span>
              <span className="yk-gold">platforms.</span>
            </h2>
          </div>

          <div className="yk-platforms-grid">
            <a href="/platforms#theytowedmycar" className="yk-platform-card yk-platform-featured">
              <div className="yk-platform-meta">
                <span className="yk-platform-status">LIVE</span>
                <span className="yk-platform-tier">INTELLIGENCE TIER</span>
              </div>
              <h3 className="yk-platform-name">TheyTowedMyCar.com</h3>
              <p className="yk-platform-desc">
                AI-powered tow defense platform serving Texas. Customer portal, admin command center,
                Claude-powered case triage, automated revenue tracking.
              </p>
              <div className="yk-platform-stats">
                <div className="yk-platform-stat">
                  <span className="yk-stat-num">9</span>
                  <span className="yk-stat-lbl">Database tables</span>
                </div>
                <div className="yk-platform-stat">
                  <span className="yk-stat-num">5</span>
                  <span className="yk-stat-lbl">TX counties</span>
                </div>
                <div className="yk-platform-stat">
                  <span className="yk-stat-num">8s</span>
                  <span className="yk-stat-lbl">AI triage time</span>
                </div>
              </div>
              <span className="yk-platform-arrow">View case study →</span>
            </a>

            <a href="/platforms#legacyline" className="yk-platform-card">
              <div className="yk-platform-meta">
                <span className="yk-platform-status">LIVE</span>
                <span className="yk-platform-tier">ENTERPRISE</span>
              </div>
              <h3 className="yk-platform-name">Legacyline</h3>
              <p className="yk-platform-desc">
                7-module readiness OS. SHA-256 deterministic scoring. Three-domain evaluator system.
              </p>
              <span className="yk-platform-arrow">→</span>
            </a>

            <a href="#" className="yk-platform-card yk-platform-soon">
              <div className="yk-platform-meta">
                <span className="yk-platform-status">PILOT</span>
                <span className="yk-platform-tier">FOUNDATION</span>
              </div>
              <h3 className="yk-platform-name">Vizionz Sankofa</h3>
              <p className="yk-platform-desc">
                Albuquerque nonprofit serving low-income families and refugee communities.
              </p>
              <span className="yk-platform-arrow">→</span>
            </a>

            <a href="#" className="yk-platform-card yk-platform-soon">
              <div className="yk-platform-meta">
                <span className="yk-platform-status">BUILDING</span>
                <span className="yk-platform-tier">AUTHORITY</span>
              </div>
              <h3 className="yk-platform-name">Pettít Luxe Group</h3>
              <p className="yk-platform-desc">
                Chef Jada — private dining and event catering in Chicago.
              </p>
              <span className="yk-platform-arrow">→</span>
            </a>

            <a href="#" className="yk-platform-card yk-platform-soon">
              <div className="yk-platform-meta">
                <span className="yk-platform-status">BUILDING</span>
                <span className="yk-platform-tier">AUTHORITY</span>
              </div>
              <h3 className="yk-platform-name">PX3 Energy</h3>
              <p className="yk-platform-desc">
                Oilfield services — Odessa, Texas. Operations infrastructure.
              </p>
              <span className="yk-platform-arrow">→</span>
            </a>
          </div>

          <div className="yk-section-cta">
            <a href="/platforms" className="yk-btn-ghost">
              <span>All platforms</span>
              <span className="yk-btn-arrow">→</span>
            </a>
          </div>
        </div>
      </section>

      {/* ───── 03·A INTELLIGENCE ───── */}
      <section className="yk-section yk-intelligence">
        <div className="yk-section-inner">
          <div className="yk-intel-head">
            <div className="yk-section-tag">
              <span className="yk-num">03·A</span>
              <span>Yakini Intelligence</span>
            </div>
            <h2 className="yk-section-h2 yk-intel-h2">
              <span className="yk-italic">Built by Yakini.</span>
              <br />
              <span className="yk-gold">Powered by intelligence.</span>
            </h2>
            <p className="yk-intel-sub">
              Every Yakini platform comes with an AI layer woven into the workflow —
              not bolted on as an afterthought. Claude-powered tools that turn 30 minutes
              of expert work into 8 seconds of structured output.
            </p>
          </div>

          {/* Live demo card */}
          <div className="yk-demo-card">
            <div className="yk-demo-meta">
              <div className="yk-demo-meta-left">
                <span className="yk-demo-dot" />
                <span>LIVE EXAMPLE</span>
              </div>
              <span className="yk-demo-meta-right">YAKINI INTELLIGENCE / CASE TRIAGE</span>
            </div>

            <div className="yk-demo-header">
              <div>
                <div className="yk-demo-eyebrow">Case file</div>
                <div className="yk-demo-case-num">TTMC-2026-0001</div>
                <div className="yk-demo-customer">2024 Honda Civic · Apartment complex tow · Harris County</div>
              </div>
              <div className="yk-demo-strength">
                <div className="yk-demo-strength-lbl">Case Strength</div>
                <div className="yk-demo-strength-val">STRONG</div>
                <div className="yk-demo-strength-pct">85% confidence</div>
              </div>
            </div>

            <div className="yk-demo-section">
              <div className="yk-demo-section-h">⚖ KEY ARGUMENTS FOR THE CUSTOMER</div>
              <ul className="yk-demo-list">
                <li>No visible tow warning signage violates TX Transportation Code §545.305</li>
                <li>Burden on tow company to prove signage was properly posted</li>
                <li>Apartment complex tows require clear authorization signage</li>
              </ul>
            </div>

            <div className="yk-demo-section">
              <div className="yk-demo-section-h">🎯 RECOMMENDED NEXT STEPS</div>
              <ul className="yk-demo-list">
                <li>Get customer to take current photos of the parking area</li>
                <li>Request all signage documentation from tow company during discovery</li>
                <li>Verify VSF license and property contracts</li>
              </ul>
            </div>

            <div className="yk-demo-footer">
              <div className="yk-demo-meta-left">
                <span className="yk-demo-pulse" />
                <span>Generated by Claude Sonnet 4.5 in 8 seconds</span>
              </div>
              <a href="/intelligence" className="yk-demo-link">
                See how it works →
              </a>
            </div>
          </div>

          <div className="yk-intel-tools">
            {INTEL_TOOLS.map((t, i) => (
              <div key={t.name} className="yk-tool">
                <span className="yk-tool-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="yk-tool-icon">{t.icon}</span>
                <h4 className="yk-tool-name">{t.name}</h4>
                <p className="yk-tool-desc">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── 03·B COMPOSER ───── */}
      <section className="yk-section yk-composer">
        <div className="yk-section-inner">
          <div className="yk-composer-head">
            <div className="yk-section-tag yk-composer-tag">
              <span className="yk-num">03·B</span>
              <span>Composer</span>
            </div>
            <h2 className="yk-section-h2 yk-composer-h2">
              <span className="yk-italic">The operating layer </span>
              <br />
              <span className="yk-gold">that runs after we build.</span>
            </h2>
            <p className="yk-composer-sub">
              Most agencies ship a platform and disappear. Yakini ships the platform <em>and</em> the
              intelligence that runs it. Composer is the AI operating layer at the center of every
              engagement — your business made readable, executable, and ungovernable by anyone but you.
            </p>
          </div>

          {/* Composer preview card */}
          <div className="yk-composer-preview">
            <div className="yk-composer-preview-header">
              <div className="yk-composer-preview-brand">
                <CosmogramMark size={22} breathe={true} />
                <span className="yk-composer-preview-name">YAKINI</span>
                <span className="yk-composer-preview-tag">· Composer</span>
              </div>
              <span className="yk-composer-preview-user">Operator</span>
            </div>

            <div className="yk-composer-preview-body">
              <div className="yk-composer-preview-mark">
                <CosmogramMark size={64} breathe={true} />
              </div>
              <h3 className="yk-composer-preview-greeting">Good evening.</h3>
              <p className="yk-composer-preview-tagline">
                Composer is ready. Pull pipeline, log revenue, draft a proposal — or ask anything.
              </p>
              <div className="yk-composer-preview-chips">
                <span className="yk-composer-chip">SHOW MY CLIENTS</span>
                <span className="yk-composer-chip">WHAT&apos;S MY MRR</span>
                <span className="yk-composer-chip">PIPELINE VIEW</span>
              </div>
            </div>

            <div className="yk-composer-preview-input">
              <span className="yk-composer-input-placeholder">
                Pull pipeline · Draft proposal · Log revenue
              </span>
              <span className="yk-composer-input-send">→</span>
            </div>
          </div>

          <div className="yk-composer-features">
            {COMPOSER_FEATURES.map((f, i) => (
              <div key={f.name} className="yk-composer-feature">
                <span className="yk-composer-feature-num">{String(i + 1).padStart(2, '0')}</span>
                <h4 className="yk-composer-feature-name">{f.name}</h4>
                <p className="yk-composer-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="yk-composer-availability">
            <div className="yk-availability-line" />
            <span>Composer is included in Authority tier and above.</span>
            <div className="yk-availability-line" />
          </div>
        </div>
      </section>

      {/* ───── 03·C YAKINI STUDIOS ───── */}
      <section className="yk-section yk-studios">
        <div className="yk-section-inner">
          <div className="yk-studios-head">
            <div className="yk-section-tag">
              <span className="yk-num">03·C</span>
              <span>Yakini Studios</span>
            </div>
            <h2 className="yk-section-h2">
              <span className="yk-italic">When the platform isn&apos;t enough.</span>
              <br />
              <span className="yk-gold">We make the content too.</span>
            </h2>
            <p className="yk-studios-sub">
              The story your business tells in motion — talking-head video, voiceover, long-form
              editorial, training programs, commercials. Produced in-house, shipped at platform
              quality, distributed through the same operating layer your business runs on.
            </p>
          </div>

          <div className="yk-studios-grid">
            {STUDIOS_OFFERINGS.map((s, i) => (
              <div key={s.name} className="yk-studios-card">
                <span className="yk-studios-num">{String(i + 1).padStart(2, '0')}</span>
                <h4 className="yk-studios-name">{s.name}</h4>
                <p className="yk-studios-desc">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="yk-studios-coming">
            <span className="yk-studios-coming-dot" />
            <span>Studios opens to Enterprise tier this quarter.</span>
          </div>
        </div>
      </section>

      {/* ───── METRICS ───── */}
      <section className="yk-section yk-metrics">
        <div className="yk-section-inner">
          <div className="yk-metrics-grid">
            <div className="yk-metric">
              <div className="yk-metric-num">24/7</div>
              <div className="yk-metric-lbl">Platforms running for clients</div>
            </div>
            <div className="yk-metric">
              <div className="yk-metric-num">8 sec</div>
              <div className="yk-metric-lbl">Average AI analysis time</div>
            </div>
            <div className="yk-metric">
              <div className="yk-metric-num">~1 hr</div>
              <div className="yk-metric-lbl">From signed contract to live</div>
            </div>
            <div className="yk-metric">
              <div className="yk-metric-num">100%</div>
              <div className="yk-metric-lbl">Client-owned domains</div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── 04 PROCESS ───── */}
      <section className="yk-section yk-process">
        <div className="yk-section-inner">
          <div className="yk-section-head">
            <div className="yk-section-tag">
              <span className="yk-num">04</span>
              <span>Process</span>
            </div>
            <h2 className="yk-section-h2">
              How we <span className="yk-gold">build.</span>
            </h2>
          </div>

          <div className="yk-process-list">
            {PROCESS_STEPS.map((s, i) => (
              <div key={s.title} className="yk-process-item">
                <div className="yk-process-num">{String(i + 1).padStart(2, '0')}</div>
                <div className="yk-process-content">
                  <h4 className="yk-process-title">{s.title}</h4>
                  <p className="yk-process-desc">{s.desc}</p>
                </div>
                <div className="yk-process-time">{s.time}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── FINAL CTA ───── */}
      <section className="yk-section yk-final">
        <div className="yk-section-inner">
          <div className="yk-final-content">
            <div className="yk-eyebrow yk-final-eyebrow">
              <span className="yk-eyebrow-dot" />
              <span>SELECTIVE PARTNERSHIPS</span>
            </div>
            <h2 className="yk-final-h2">
              We work with <span className="yk-italic">a handful</span> of
              <br />
              <span className="yk-gold">serious founders</span> at a time.
            </h2>
            <p className="yk-final-sub">
              If your business is ready to be built on infrastructure that scales with you —
              not against you — start the conversation.
            </p>
            <div className="yk-final-ctas">
              <a href="/apply" className="yk-btn-primary">
                <span>Apply for partnership</span>
                <span className="yk-btn-arrow">→</span>
              </a>
              <a href="/intelligence" className="yk-btn-ghost">
                <span>See Intelligence</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ───── FOOTER ───── */}
      <footer className="yk-footer">
        <div className="yk-section-inner">
          <div className="yk-footer-grid">
            <div className="yk-footer-brand">
              <div className="yk-brand">
                <CosmogramMark size={36} />
                <div className="yk-brand-text">
                  <span className="yk-brand-name">YAKINI</span>
                  <span className="yk-brand-sub">DIGITAL INFRASTRUCTURE</span>
                </div>
              </div>
              <p className="yk-footer-tag">
                The infrastructure layer your business runs on.
              </p>
            </div>

            <div className="yk-footer-col">
              <h6>Build</h6>
              <a href="/platforms">Platforms</a>
              <a href="/intelligence">Intelligence</a>
              <a href="/process">Process</a>
              <a href="/pricing">Pricing</a>
            </div>

            <div className="yk-footer-col">
              <h6>Company</h6>
              <a href="/about">About</a>
              <a href="/apply">Apply</a>
              <a href="https://brsafoundation.org">BRSA Foundation</a>
            </div>

            <div className="yk-footer-col">
              <h6>Contact</h6>
              <a href="mailto:hello@yakini.digital">hello@yakini.digital</a>
              <a href="mailto:admin@yakini.digital">admin@yakini.digital</a>
            </div>
          </div>

          <div className="yk-footer-bottom">
            <span>© 2026 BRSA Holdings, Inc. All rights reserved.</span>
            <span>YAKINI is part of the BRSA ecosystem.</span>
          </div>
        </div>
      </footer>
    </>
  )
}

// ─── The Cosmogram Mark (B2 — Four Elements / Sene) ─────
// Dogon-anchored. Outer rotated square = the cosmic egg.
// Inner square + cross = the sene seed of the four elements.
// Center bone = the seed binding them.
function CosmogramMark({
  size = 36,
  breathe = false,
}: {
  size?: number
  breathe?: boolean
}) {
  return (
    <svg
      viewBox="0 0 140 140"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: 'block', overflow: 'visible', flexShrink: 0 }}
    >
      <rect
        x="20" y="20" width="100" height="100"
        fill="none" stroke="var(--gold)" strokeWidth="3"
        transform="rotate(45 70 70)" opacity="0.85"
      />
      <rect
        x="34" y="34" width="72" height="72"
        fill="none" stroke="var(--gold)" strokeWidth="3.5"
      />
      <line x1="70" y1="34" x2="70" y2="106" stroke="var(--gold)" strokeWidth="3" />
      <line x1="34" y1="70" x2="106" y2="70" stroke="var(--gold)" strokeWidth="3" />
      <circle cx="52" cy="52" r="4" fill="var(--gold)" opacity="0.7" />
      <circle cx="88" cy="52" r="4" fill="var(--gold)" opacity="0.7" />
      <circle cx="52" cy="88" r="4" fill="var(--gold)" opacity="0.7" />
      <circle cx="88" cy="88" r="4" fill="var(--gold)" opacity="0.7" />
      <circle
        cx="70" cy="70" r="9" fill="var(--bone)"
        style={
          breathe
            ? {
                transformOrigin: '70px 70px',
                animation: 'cosmogramBreathe 4s ease-in-out infinite',
              }
            : undefined
        }
      />
      <circle cx="70" cy="70" r="3" fill="var(--ink)" />
    </svg>
  )
}

// ─── Data ───────────────────────────────────────────────

const INTEL_TOOLS = [
  { name: 'Case Triage', icon: '⚖', desc: 'Strength assessment, key arguments, risk analysis, evidence checklist.' },
  { name: 'Letter Generation', icon: '✉', desc: 'Demand letters, dispute notices, customer comms — drafted instantly.' },
  { name: 'Hearing Prep', icon: '🏛', desc: 'One-page court briefs with facts, arguments, and counter-arguments.' },
  { name: 'License Verification', icon: '🔍', desc: 'Cross-reference state licensing records to flag discrepancies.' },
  { name: 'Customer Communication', icon: '💬', desc: 'Status updates and replies drafted in your voice and brand.' },
  { name: 'Strategic Analysis', icon: '📊', desc: 'Pattern detection across your case history — what wins, what loses.' },
]

const COMPOSER_FEATURES = [
  { name: 'Conversational operations', desc: 'Run your business in plain language. Show clients, log revenue, draft proposals — no menus, no forms.' },
  { name: 'Trained on your business', desc: 'Composer learns your clients, pricing, doctrine, and operational rhythms. Every engagement gets its own.' },
  { name: 'Strategic intelligence', desc: 'Pull a strategic analysis on demand. Composer reads your real data and surfaces what to focus on this quarter.' },
  { name: 'Full audit trail', desc: 'Every action logged. Every approval recorded. Every model call costed. Operator-grade accountability built in.' },
]

const STUDIOS_OFFERINGS = [
  { name: 'Talking-head video', desc: 'Founder interviews, client testimonials, explainer content — produced at network quality.' },
  { name: 'Voiceover & narration', desc: 'Brand-consistent narration for product walkthroughs, training, and long-form editorial.' },
  { name: 'Long-form editorial', desc: 'The publishing arm. Essays, case studies, position papers — owning your category in writing.' },
  { name: 'Training & certification', desc: 'Branded learning paths for clients, teams, and partners. Same standards as the platform itself.' },
  { name: 'Commercial production', desc: 'Short-form ad creative for paid distribution. Built for the channels your buyers actually live on.' },
]

const PROCESS_STEPS = [
  { title: 'Strategic Intake', desc: 'We map your business — workflows, customers, ops, where AI multiplies you.', time: 'Day 1' },
  { title: 'Architecture', desc: 'Database design, system blueprint, integration plan, security model.', time: 'Days 2-3' },
  { title: 'Build', desc: 'Custom platform — not a template. Database, APIs, UI, AI tools, admin.', time: 'Days 4-14' },
  { title: 'Deploy', desc: 'Your domain, your infrastructure, your data. We hand you the keys.', time: 'Day 15' },
  { title: 'Optimize', desc: 'Monthly platform improvements, AI refinement, new features as you grow.', time: 'Ongoing' },
]

// ─── CSS ───────────────────────────────────────────────

const CSS = `
  /* ═══ FOUNDATION — Cosmogram identity (Dogon-anchored) ═══ */
  :root {
    --ink: #0A0908;
    --ink-deep: #060504;
    --ink-soft: #131210;
    --black: #000000;
    --gold: #C9A961;
    --gold-bright: #E5C684;
    --gold-warm: #B89752;
    --bone: #F5F2EA;
    --bone-soft: #DDD8C9;
    --bone-deep: #a8a397;
    --gold-soft: rgba(201, 169, 97, 0.08);
    --gold-line: rgba(201, 169, 97, 0.20);
    --line: rgba(245, 242, 234, 0.06);
    --line-strong: rgba(245, 242, 234, 0.12);
    --muted: rgba(245, 242, 234, 0.55);
    --font-display: 'Fraunces', 'Cormorant Garamond', Georgia, serif;
    --font-body: 'Inter', -apple-system, sans-serif;
    --font-mono: 'JetBrains Mono', Menlo, monospace;
  }

  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    background: var(--ink);
    color: var(--bone);
    font-family: var(--font-body);
    font-weight: 300;
    -webkit-font-smoothing: antialiased;
    line-height: 1.6;
    overflow-x: hidden;
  }
  a { color: inherit; text-decoration: none; transition: color 0.2s; }
  ul { list-style: none; }
  ::selection { background: rgba(201, 169, 97, 0.30); color: var(--bone); }

  .yk-italic { font-style: italic; font-family: var(--font-display); font-weight: 300; }
  .yk-gold { color: var(--gold); }

  @keyframes cosmogramBreathe {
    0%, 100% { transform: scale(1); opacity: 0.85; }
    50%      { transform: scale(1.08); opacity: 1; }
  }

  /* ═══ NAV ═══ */
  .yk-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    padding: 18px 32px;
    background: transparent;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .yk-nav.scrolled {
    padding: 12px 32px;
    background: rgba(10, 9, 8, 0.85);
    backdrop-filter: blur(24px) saturate(180%);
    border-bottom: 1px solid var(--line);
  }
  .yk-nav-inner {
    max-width: 1400px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between;
    gap: 32px;
  }
  .yk-brand {
    display: flex; align-items: center; gap: 14px;
  }
  .yk-brand-text {
    display: flex; flex-direction: column; line-height: 1;
  }
  .yk-brand-name {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: 16px;
    letter-spacing: 0.22em;
    color: var(--bone);
  }
  .yk-brand-sub {
    font-family: var(--font-mono);
    font-weight: 400;
    font-size: 9px;
    letter-spacing: 0.28em;
    color: var(--gold);
    margin-top: 4px;
  }

  .yk-nav-center {
    display: flex; gap: 36px; align-items: center;
  }
  .yk-nav-center a {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 400;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--bone-deep);
    position: relative;
    padding: 4px 0;
  }
  .yk-nav-center a::after {
    content: ''; position: absolute;
    bottom: -2px; left: 0; right: 0;
    height: 1px;
    background: var(--gold);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s;
  }
  .yk-nav-center a:hover { color: var(--bone); }
  .yk-nav-center a:hover::after { transform: scaleX(1); }

  .yk-nav-cta {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 11px 22px;
    background: var(--gold);
    color: var(--ink);
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    transition: all 0.3s;
  }
  .yk-nav-cta:hover {
    background: var(--gold-bright);
    transform: translateY(-1px);
    box-shadow: 0 12px 30px rgba(201, 169, 97, 0.25);
  }
  .yk-nav-cta-arrow { transition: transform 0.2s; }
  .yk-nav-cta:hover .yk-nav-cta-arrow { transform: translateX(4px); }

  .yk-burger { display: none; background: none; border: none; cursor: pointer; padding: 8px; }
  .yk-burger span {
    display: block; width: 22px; height: 1.5px;
    background: var(--bone); margin: 5px 0;
    transition: all 0.3s;
  }
  .yk-burger.open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
  .yk-burger.open span:nth-child(2) { opacity: 0; }
  .yk-burger.open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

  .yk-mobile-menu {
    position: fixed; top: 70px; left: 0; right: 0; bottom: 0; z-index: 99;
    background: var(--ink);
    padding: 32px;
    display: flex; flex-direction: column; gap: 20px;
    border-top: 1px solid var(--line);
  }
  .yk-mobile-menu a {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 400;
    color: var(--bone);
    padding: 8px 0;
    border-bottom: 1px solid var(--line);
  }
  .yk-mobile-cta { color: var(--gold) !important; }

  @media (max-width: 1024px) {
    .yk-nav-center { display: none; }
    .yk-nav-cta { display: none; }
    .yk-burger { display: block; }
   }
   /* ═══ HERO ═══ */
  .yk-hero {
    position: relative;
    min-height: 100vh;
    padding: 120px 32px 60px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .yk-hero-bg { position: absolute; inset: 0; background: var(--ink); z-index: -1; }
  .yk-hero-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(201, 169, 97, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(201, 169, 97, 0.03) 1px, transparent 1px);
    background-size: 80px 80px;
    mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent 80%);
  }
  .yk-hero-glow {
    position: absolute;
    top: -10%; left: 50%;
    transform: translateX(-50%);
    width: 1200px; height: 800px;
    background: radial-gradient(ellipse at center,
      rgba(201, 169, 97, 0.12) 0%,
      transparent 70%);
    filter: blur(60px);
    animation: glow-pulse 8s ease-in-out infinite;
  }
  @keyframes glow-pulse {
    0%, 100% { opacity: 0.7; transform: translateX(-50%) scale(1); }
    50% { opacity: 1; transform: translateX(-50%) scale(1.05); }
  }

  .yk-hero-inner {
    position: relative;
    max-width: 1400px;
    width: 100%;
    margin: 0 auto;
  }

  .yk-hero-eyebrow,
  .yk-eyebrow {
    display: inline-flex; align-items: center; gap: 12px;
    padding: 8px 16px;
    border: 1px solid var(--gold-line);
    background: rgba(245, 242, 234, 0.02);
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.28em;
    color: var(--gold);
    text-transform: uppercase;
    margin-bottom: 40px;
    opacity: 0;
    animation: fade-up 1s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
  }
  .yk-eyebrow-dot {
    width: 6px; height: 6px;
    background: var(--gold);
    border-radius: 50%;
    animation: dot-pulse 2s ease-in-out infinite;
  }
  @keyframes dot-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.7); }
  }

  .yk-hero-h1 {
    font-family: var(--font-display);
    font-size: clamp(56px, 11vw, 160px);
    line-height: 0.92;
    font-weight: 300;
    letter-spacing: -0.025em;
    color: var(--bone);
    margin-bottom: 40px;
    max-width: 14ch;
  }
  .yk-hero-line {
    display: block;
    opacity: 0;
    animation: fade-up 1.1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  .yk-hero-line:nth-child(1) { animation-delay: 0.2s; }
  .yk-hero-line:nth-child(2) { animation-delay: 0.35s; }
  .yk-hero-line:nth-child(3) { animation-delay: 0.5s; }
  .yk-hero-italic {
    font-style: italic;
    color: rgba(245, 242, 234, 0.65);
    font-weight: 300;
  }
  .yk-hero-gold {
    color: var(--gold);
    font-style: italic;
    font-weight: 400;
  }

  @keyframes fade-up {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .yk-hero-sub {
    font-size: clamp(17px, 1.5vw, 21px);
    line-height: 1.65;
    color: rgba(245, 242, 234, 0.7);
    max-width: 620px;
    margin-bottom: 48px;
    opacity: 0;
    animation: fade-up 1s cubic-bezier(0.16, 1, 0.3, 1) 0.7s forwards;
    font-weight: 300;
  }

  .yk-hero-ctas {
    display: flex; gap: 16px; flex-wrap: wrap;
    margin-bottom: 80px;
    opacity: 0;
    animation: fade-up 1s cubic-bezier(0.16, 1, 0.3, 1) 0.85s forwards;
  }

  .yk-btn-primary {
    display: inline-flex; align-items: center; gap: 12px;
    background: var(--gold);
    color: var(--ink);
    padding: 18px 30px;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    border: 1.5px solid var(--gold);
  }
  .yk-btn-primary:hover {
    background: var(--gold-bright);
    border-color: var(--gold-bright);
    transform: translateY(-2px);
    box-shadow: 0 15px 40px rgba(201, 169, 97, 0.30);
  }
  .yk-btn-arrow { transition: transform 0.25s; }
  .yk-btn-primary:hover .yk-btn-arrow { transform: translateX(6px); }

  .yk-btn-ghost {
    display: inline-flex; align-items: center; gap: 10px;
    color: var(--bone);
    padding: 18px 30px;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    border: 1.5px solid var(--line-strong);
    transition: all 0.3s;
  }
  .yk-btn-ghost:hover {
    border-color: var(--gold);
    color: var(--gold);
  }
  .yk-btn-ghost .yk-btn-arrow { transition: transform 0.25s; }
  .yk-btn-ghost:hover .yk-btn-arrow { transform: translateX(4px); }

  /* Marquee */
  .yk-hero-marquee {
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
    padding: 20px 0;
    overflow: hidden;
    margin-top: 40px;
    mask-image: linear-gradient(90deg, transparent, black 10%, black 90%, transparent);
    opacity: 0;
    animation: fade-up 1s cubic-bezier(0.16, 1, 0.3, 1) 1s forwards;
  }
  .yk-marquee-track {
    display: flex; gap: 60px;
    white-space: nowrap;
    animation: marquee 50s linear infinite;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.3em;
    color: var(--gold);
  }
  @keyframes marquee {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }
  

  /* Scroll indicator */
  .yk-hero-scroll {
    position: absolute;
    bottom: 32px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 0.3em;
    color: var(--muted);
    text-transform: uppercase;
    opacity: 0;
    animation: fade-up 1s 1.3s forwards;
  }
  .yk-scroll-line {
    width: 1px; height: 40px;
    background: linear-gradient(to bottom, transparent, var(--gold));
    animation: scroll-pulse 2.5s ease infinite;
  }
  @keyframes scroll-pulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }

  /* ═══ SECTIONS ═══ */
  .yk-section {
    padding: 140px 32px;
    position: relative;
  }
  .yk-section-inner { max-width: 1400px; margin: 0 auto; }
  .yk-section-tag {
    display: inline-flex; align-items: baseline; gap: 14px;
    margin-bottom: 32px;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.3em;
    color: var(--gold);
    text-transform: uppercase;
  }
  .yk-num {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 18px;
    font-weight: 300;
    opacity: 0.7;
  }
  .yk-section-h2 {
    font-family: var(--font-display);
    font-size: clamp(48px, 7vw, 96px);
    line-height: 0.95;
    font-weight: 300;
    letter-spacing: -0.02em;
    color: var(--bone);
    max-width: 16ch;
    margin-bottom: 60px;
  }
  .yk-section-head { margin-bottom: 80px; }
  .yk-section-cta { margin-top: 60px; display: flex; justify-content: center; }

  /* ═══ MANIFESTO ═══ */
  .yk-manifesto {
    background: linear-gradient(180deg, var(--ink) 0%, var(--ink-soft) 100%);
    border-top: 1px solid var(--line);
    padding: 100px 32px;
  }
  .yk-manifesto-grid {
    display: grid;
    grid-template-columns: 240px 1fr;
    gap: 80px;
    align-items: start;
  }
  .yk-manifesto-label {
    display: flex; flex-direction: column; gap: 8px;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.3em;
    color: var(--gold);
    text-transform: uppercase;
    border-top: 1px solid var(--gold);
    padding-top: 20px;
  }
  .yk-manifesto-body { max-width: 720px; }
  .yk-manifesto-p {
    font-family: var(--font-display);
    font-size: clamp(22px, 2.4vw, 34px);
    font-weight: 300;
    line-height: 1.45;
    color: var(--bone);
    margin-bottom: 24px;
  }
  .yk-manifesto-p em { color: var(--gold); font-style: italic; font-weight: 400; }
  .yk-manifesto-credit {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.3em;
    color: var(--gold);
    margin-top: 32px;
    text-transform: uppercase;
  }

  @media (max-width: 900px) {
    .yk-manifesto-grid { grid-template-columns: 1fr; gap: 24px; }
  }

  /* ═══ PLATFORMS ═══ */
  .yk-platforms { background: var(--ink-deep); }
  .yk-platforms-grid {
    display: grid;
    grid-template-columns: 1.6fr 1fr 1fr;
    grid-template-rows: auto auto;
    gap: 16px;
  }
  .yk-platform-featured { grid-row: span 2; }
  .yk-platform-card {
    display: flex; flex-direction: column;
    padding: 36px 32px;
    background: linear-gradient(180deg, rgba(245, 242, 234, 0.025) 0%, rgba(245, 242, 234, 0.005) 100%);
    border: 1px solid var(--line);
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    overflow: hidden;
    min-height: 280px;
  }
  .yk-platform-card::before {
    content: ''; position: absolute;
    top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, var(--gold), transparent);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.5s;
  }
  .yk-platform-card:hover {
    border-color: var(--gold);
    background: linear-gradient(180deg, rgba(201, 169, 97, 0.05) 0%, rgba(201, 169, 97, 0.01) 100%);
    transform: translateY(-3px);
  }
  .yk-platform-card:hover::before { transform: scaleX(1); }
  .yk-platform-meta {
    display: flex; gap: 10px;
    margin-bottom: 24px;
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.25em;
    text-transform: uppercase;
  }
  .yk-platform-status {
    color: var(--gold);
    padding: 4px 10px;
    background: var(--gold-soft);
    border: 1px solid var(--gold-line);
  }
  .yk-platform-tier {
    color: var(--muted);
    padding: 4px 10px;
    border: 1px solid var(--line-strong);
  }
  .yk-platform-name {
    font-family: var(--font-display);
    font-size: clamp(28px, 3vw, 44px);
    font-weight: 400;
    line-height: 1.1;
    color: var(--bone);
    margin-bottom: 16px;
  }
  .yk-platform-featured .yk-platform-name {
    font-size: clamp(40px, 4vw, 64px);
  }
  .yk-platform-desc {
    font-size: 14px;
    line-height: 1.7;
    color: var(--muted);
    margin-bottom: auto;
    font-weight: 300;
  }
  .yk-platform-stats {
    display: flex; gap: 32px;
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid var(--line);
  }
  .yk-platform-stat { display: flex; flex-direction: column; }
  .yk-stat-num {
    font-family: var(--font-display);
    font-size: 36px;
    font-weight: 400;
    color: var(--gold);
    line-height: 1;
  }
  .yk-stat-lbl {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--muted);
    margin-top: 8px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .yk-platform-arrow {
    margin-top: 24px;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 500;
    color: var(--gold);
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  @media (max-width: 1024px) {
    .yk-platforms-grid { grid-template-columns: 1fr 1fr; }
    .yk-platform-featured { grid-row: span 1; grid-column: span 2; }
  }
  @media (max-width: 600px) {
    .yk-platforms-grid { grid-template-columns: 1fr; }
    .yk-platform-featured { grid-column: span 1; }
  }

  /* ═══ INTELLIGENCE ═══ */
  .yk-intelligence {
    background: linear-gradient(180deg, var(--ink-deep) 0%, var(--ink) 100%);
    position: relative;
  }
  .yk-intelligence::before {
    content: ''; position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 800px; height: 800px;
    background: radial-gradient(circle, rgba(201, 169, 97, 0.06) 0%, transparent 60%);
    pointer-events: none;
  }
  .yk-intel-head {
    text-align: center;
    max-width: 900px;
    margin: 0 auto 80px;
    position: relative;
  }
  .yk-intel-head .yk-section-tag { justify-content: center; }
  .yk-intel-h2 { margin-left: auto; margin-right: auto; max-width: 18ch; }
  .yk-intel-sub {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 19px;
    line-height: 1.65;
    color: var(--muted);
    max-width: 640px;
    margin: 0 auto;
    font-weight: 300;
  }

  /* Demo card */
  .yk-demo-card {
    background: var(--ink-deep);
    border: 1px solid var(--line-strong);
    padding: 32px;
    position: relative;
    margin-bottom: 80px;
    box-shadow: 0 30px 80px rgba(0,0,0,0.5);
    overflow: hidden;
  }
  .yk-demo-card::before {
    content: ''; position: absolute;
    top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, var(--gold), transparent);
    background-size: 200% 100%;
    animation: gradient-shift 4s ease infinite;
  }
  @keyframes gradient-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  .yk-demo-meta {
    display: flex; justify-content: space-between;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.18em;
    color: var(--muted);
    margin-bottom: 32px;
    text-transform: uppercase;
  }
  .yk-demo-meta-left {
    display: flex; align-items: center; gap: 8px;
    color: var(--gold);
  }
  .yk-demo-dot {
    width: 8px; height: 8px;
    background: var(--gold);
    border-radius: 50%;
    animation: dot-pulse 2s ease-in-out infinite;
  }
  .yk-demo-pulse {
    width: 6px; height: 6px;
    background: var(--gold);
    border-radius: 50%;
    box-shadow: 0 0 12px var(--gold);
    animation: dot-pulse 1.5s ease-in-out infinite;
  }
  .yk-demo-header {
    display: flex; justify-content: space-between; align-items: flex-start;
    padding-bottom: 28px;
    border-bottom: 1px solid var(--line);
    margin-bottom: 28px;
    gap: 24px;
    flex-wrap: wrap;
  }
  .yk-demo-eyebrow {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.25em;
    color: var(--muted);
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .yk-demo-case-num {
    font-family: var(--font-display);
    font-size: 36px;
    font-weight: 400;
    color: var(--bone);
    margin-bottom: 6px;
  }
  .yk-demo-customer {
    font-size: 13px;
    color: var(--muted);
    font-weight: 300;
  }
  .yk-demo-strength {
    text-align: right;
    border-left: 2px solid var(--gold);
    padding-left: 20px;
  }
  .yk-demo-strength-lbl {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.25em;
    color: var(--muted);
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  .yk-demo-strength-val {
    font-family: var(--font-display);
    font-size: 42px;
    font-weight: 400;
    color: var(--gold);
    line-height: 1;
    margin-bottom: 4px;
  }
  .yk-demo-strength-pct {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--muted);
  }
  .yk-demo-section { margin-bottom: 24px; }
  .yk-demo-section-h {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.25em;
    color: var(--gold);
    text-transform: uppercase;
    margin-bottom: 12px;
  }
  .yk-demo-list {
    display: flex; flex-direction: column; gap: 8px;
  }
  .yk-demo-list li {
    font-size: 14px;
    line-height: 1.7;
    color: var(--bone);
    padding-left: 20px;
    position: relative;
    font-weight: 300;
  }
  .yk-demo-list li::before {
    content: '→'; position: absolute;
    left: 0; color: var(--gold);
    opacity: 0.7;
  }
  .yk-demo-footer {
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid var(--line);
    display: flex; justify-content: space-between; align-items: center;
    flex-wrap: wrap; gap: 16px;
  }
  .yk-demo-link {
    color: var(--gold);
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }
  .yk-demo-link:hover { color: var(--gold-bright); }

  /* Tools grid */
  .yk-intel-tools {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  .yk-tool {
    padding: 32px 28px;
    background: rgba(245, 242, 234, 0.02);
    border: 1px solid var(--line);
    transition: all 0.3s;
    position: relative;
  }
  .yk-tool:hover {
    border-color: var(--gold);
    background: var(--gold-soft);
    transform: translateY(-2px);
  }
  .yk-tool-num {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--muted);
    letter-spacing: 0.2em;
  }
  .yk-tool-icon {
    display: block;
    font-size: 28px;
    margin: 16px 0 12px;
    color: var(--gold);
  }
  .yk-tool-name {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 400;
    color: var(--bone);
    margin-bottom: 10px;
  }
  .yk-tool-desc {
    font-size: 13px;
    line-height: 1.65;
    color: var(--muted);
    font-weight: 300;
  }

  @media (max-width: 900px) { .yk-intel-tools { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 600px) { .yk-intel-tools { grid-template-columns: 1fr; } }

  /* ═══ COMPOSER (03·B) ═══ */
  .yk-composer {
    background: var(--ink);
    border-top: 1px solid var(--line);
    position: relative;
  }
  .yk-composer-head {
    text-align: center;
    max-width: 900px;
    margin: 0 auto 80px;
  }
  .yk-composer-tag { justify-content: center; }
  .yk-composer-h2 {
    margin-left: auto; margin-right: auto;
    max-width: 18ch;
  }
  .yk-composer-sub {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 19px;
    line-height: 1.65;
    color: var(--muted);
    max-width: 720px;
    margin: 0 auto;
    font-weight: 300;
  }
  .yk-composer-sub em {
    color: var(--gold);
    font-style: italic;
  }

  /* Composer preview card — mirrors the live Composer aesthetic */
  .yk-composer-preview {
    max-width: 900px;
    margin: 0 auto 80px;
    background: var(--ink);
    border: 1px solid var(--line-strong);
    box-shadow: 0 40px 100px rgba(0,0,0,0.6);
    overflow: hidden;
  }
  .yk-composer-preview-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 24px;
    border-bottom: 1px solid var(--line);
  }
  .yk-composer-preview-brand {
    display: flex; align-items: center; gap: 12px;
  }
  .yk-composer-preview-name {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: 14px;
    letter-spacing: 0.22em;
    color: var(--bone);
  }
  .yk-composer-preview-tag {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.2em;
    color: var(--muted);
    text-transform: uppercase;
  }
  .yk-composer-preview-user {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--muted);
    letter-spacing: 0.05em;
  }
  .yk-composer-preview-body {
    padding: 80px 32px 60px;
    text-align: center;
  }
  .yk-composer-preview-mark {
    display: flex;
    justify-content: center;
    margin-bottom: 32px;
  }
  .yk-composer-preview-greeting {
    font-family: var(--font-display);
    font-weight: 300;
    font-size: 32px;
    letter-spacing: -0.015em;
    color: var(--bone);
    margin-bottom: 12px;
  }
  .yk-composer-preview-tagline {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 15px;
    color: var(--muted);
    max-width: 420px;
    margin: 0 auto 36px;
    font-weight: 300;
    line-height: 1.55;
  }
  .yk-composer-preview-chips {
    display: flex; flex-wrap: wrap;
    justify-content: center; gap: 8px;
  }
  .yk-composer-chip {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 0.2em;
    color: var(--muted);
    padding: 7px 14px;
    border: 1px solid var(--line);
    background: rgba(245, 242, 234, 0.02);
    text-transform: uppercase;
  }
  .yk-composer-preview-input {
    display: flex; align-items: center; justify-content: space-between;
    margin: 0 24px 24px;
    padding: 12px 16px;
    border: 1px solid var(--line-strong);
    background: rgba(245, 242, 234, 0.03);
  }
  .yk-composer-input-placeholder {
    font-family: var(--font-body);
    font-size: 13px;
    color: var(--muted);
    font-weight: 300;
  }
  .yk-composer-input-send {
    display: inline-flex; align-items: center; justify-content: center;
    width: 28px; height: 28px;
    background: var(--gold);
    color: var(--ink);
    font-size: 14px;
  }

  .yk-composer-features {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 60px;
  }
  .yk-composer-feature {
    padding: 28px 24px;
    background: rgba(245, 242, 234, 0.02);
    border: 1px solid var(--line);
    transition: all 0.3s;
  }
  .yk-composer-feature:hover {
    border-color: var(--gold);
    background: var(--gold-soft);
  }
  .yk-composer-feature-num {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--gold);
    letter-spacing: 0.2em;
  }
  .yk-composer-feature-name {
    font-family: var(--font-display);
    font-size: 19px;
    font-weight: 400;
    color: var(--bone);
    margin: 14px 0 10px;
    line-height: 1.25;
  }
  .yk-composer-feature-desc {
    font-size: 13px;
    line-height: 1.65;
    color: var(--muted);
    font-weight: 300;
  }
  @media (max-width: 1024px) { .yk-composer-features { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 600px) { .yk-composer-features { grid-template-columns: 1fr; } }

  .yk-composer-availability {
    display: flex; align-items: center; justify-content: center; gap: 24px;
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.25em;
    color: var(--gold);
    text-transform: uppercase;
  }
  .yk-availability-line {
    flex: 0 1 80px;
    height: 1px;
    background: var(--gold-line);
  }

  /* ═══ STUDIOS (03·C) ═══ */
  .yk-studios {
    background: linear-gradient(180deg, var(--ink) 0%, var(--ink-deep) 100%);
    border-top: 1px solid var(--line);
  }
  .yk-studios-head {
    text-align: center;
    max-width: 900px;
    margin: 0 auto 80px;
  }
  .yk-studios-head .yk-section-tag { justify-content: center; }
  .yk-studios-head .yk-section-h2 { margin-left: auto; margin-right: auto; max-width: 18ch; }
  .yk-studios-sub {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 19px;
    line-height: 1.65;
    color: var(--muted);
    max-width: 720px;
    margin: 0 auto;
    font-weight: 300;
  }

  .yk-studios-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 12px;
    margin-bottom: 60px;
  }
  .yk-studios-card {
    padding: 28px 22px;
    background: rgba(245, 242, 234, 0.02);
    border: 1px solid var(--line);
    transition: all 0.3s;
    min-height: 200px;
    display: flex;
    flex-direction: column;
  }
  .yk-studios-card:hover {
    border-color: var(--gold);
    background: var(--gold-soft);
    transform: translateY(-2px);
  }
  .yk-studios-num {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--gold);
    letter-spacing: 0.2em;
  }
  .yk-studios-name {
    font-family: var(--font-display);
    font-size: 17px;
    font-weight: 400;
    color: var(--bone);
    margin: 14px 0 10px;
    line-height: 1.25;
  }
  .yk-studios-desc {
    font-size: 12px;
    line-height: 1.65;
    color: var(--muted);
    font-weight: 300;
  }
  @media (max-width: 1100px) { .yk-studios-grid { grid-template-columns: 1fr 1fr 1fr; } }
  @media (max-width: 700px) { .yk-studios-grid { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 480px) { .yk-studios-grid { grid-template-columns: 1fr; } }

  .yk-studios-coming {
    display: flex; align-items: center; justify-content: center; gap: 12px;
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.22em;
    color: var(--bone-deep);
    text-transform: uppercase;
  }
  .yk-studios-coming-dot {
    width: 6px; height: 6px;
    background: var(--gold);
    border-radius: 50%;
    animation: dot-pulse 2s ease-in-out infinite;
  }
  
  /* ═══ METRICS ═══ */
  .yk-metrics {
    background: var(--ink-deep);
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
    padding: 80px 32px;
  }
  .yk-metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 32px;
  }
  .yk-metric {
    text-align: center;
    padding: 0 16px;
    border-right: 1px solid var(--line);
  }
  .yk-metric:last-child { border-right: none; }
  .yk-metric-num {
    font-family: var(--font-display);
    font-size: clamp(48px, 6vw, 80px);
    font-weight: 400;
    color: var(--gold);
    line-height: 1;
    margin-bottom: 12px;
    font-style: italic;
  }
  .yk-metric-lbl {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--muted);
    line-height: 1.5;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  @media (max-width: 700px) {
    .yk-metrics-grid { grid-template-columns: 1fr 1fr; gap: 40px 16px; }
    .yk-metric { border: none; }
  }

  /* ═══ PROCESS ═══ */
  .yk-process { background: var(--ink-soft); }
  .yk-process-list {
    display: flex; flex-direction: column;
    border-top: 1px solid var(--line);
  }
  .yk-process-item {
    display: grid;
    grid-template-columns: 100px 1fr 120px;
    gap: 32px;
    padding: 32px 0;
    border-bottom: 1px solid var(--line);
    align-items: baseline;
    transition: all 0.3s;
  }
  .yk-process-item:hover {
    background: rgba(201, 169, 97, 0.04);
    padding-left: 16px;
  }
  .yk-process-num {
    font-family: var(--font-display);
    font-size: 32px;
    font-weight: 400;
    color: var(--gold);
    font-style: italic;
  }
  .yk-process-title {
    font-family: var(--font-display);
    font-size: clamp(24px, 3vw, 36px);
    font-weight: 400;
    color: var(--bone);
    margin-bottom: 8px;
  }
  .yk-process-desc {
    font-size: 14px;
    line-height: 1.7;
    color: var(--muted);
    max-width: 600px;
    font-weight: 300;
  }
  .yk-process-time {
    text-align: right;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.2em;
    color: var(--gold);
    text-transform: uppercase;
  }
  @media (max-width: 700px) {
    .yk-process-item { grid-template-columns: 60px 1fr; gap: 16px; }
    .yk-process-time { grid-column: 2; text-align: left; margin-top: 8px; }
  }

  /* ═══ FINAL CTA ═══ */
  .yk-final {
    background: linear-gradient(180deg, var(--ink-soft) 0%, var(--ink) 100%);
    text-align: center;
  }
  .yk-final-content { max-width: 900px; margin: 0 auto; }
  .yk-final-eyebrow { margin-bottom: 32px; }
  .yk-final-h2 {
    font-family: var(--font-display);
    font-size: clamp(48px, 7vw, 96px);
    line-height: 0.95;
    font-weight: 300;
    letter-spacing: -0.02em;
    color: var(--bone);
    margin-bottom: 32px;
  }
  .yk-final-sub {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 19px;
    line-height: 1.65;
    color: var(--muted);
    max-width: 540px;
    margin: 0 auto 48px;
    font-weight: 300;
  }
  .yk-final-ctas {
    display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;
  }

  /* ═══ FOOTER ═══ */
  .yk-footer {
    background: var(--ink-deep);
    padding: 80px 32px 32px;
    border-top: 1px solid var(--line);
  }
  .yk-footer-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 60px;
    margin-bottom: 60px;
  }
  .yk-footer-tag {
    font-family: var(--font-display);
    font-size: 17px;
    font-style: italic;
    color: var(--muted);
    margin-top: 24px;
    max-width: 280px;
    line-height: 1.55;
    font-weight: 300;
  }
  .yk-footer-col h6 {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.3em;
    color: var(--gold);
    margin-bottom: 20px;
    text-transform: uppercase;
  }
  .yk-footer-col a {
    display: block;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--muted);
    margin-bottom: 10px;
    transition: color 0.2s;
    letter-spacing: 0.05em;
  }
  .yk-footer-col a:hover { color: var(--bone); }
  .yk-footer-bottom {
    border-top: 1px solid var(--line);
    padding-top: 24px;
    display: flex; justify-content: space-between;
    flex-wrap: wrap; gap: 16px;
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--muted);
    letter-spacing: 0.05em;
  }
  @media (max-width: 800px) {
    .yk-footer-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
  }
  @media (max-width: 500px) {
    .yk-footer-grid { grid-template-columns: 1fr; }
  }
`
