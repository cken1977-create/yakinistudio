'use client'

import { useState, useEffect } from 'react'

// ═════════════════════════════════════════════════════════════════════════
// YAKINI HOME v2 — "Digital infrastructure for serious founders."
// File: apps/yakini.digital/app/page.tsx
//
// Design direction: Cinematic + Editorial + Technical hybrid.
// Premium positioning to support $5K-20K/mo Intelligence tier pricing.
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
          <a href="/" className="yk-brand">
            <div className="yk-brand-mark">
              <span className="yk-brand-y">Y</span>
            </div>
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
            We don't make websites. We build the platforms your business runs on —
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
              <span>· YAKINI INTELLIGENCE</span>
              <span>· LEGACYLINE</span>
              <span>· THEYTOWEDMYCAR</span>
              <span>· VIZIONZ SANKOFA</span>
              <span>· PETTÍT LUXE</span>
            </div>
          </div>
        </div>

        <div className="yk-hero-scroll">
          <div className="yk-scroll-line" />
          <span>Scroll</span>
        </div>
      </section>

      {/* ───── MANIFESTO ───── */}
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
                Marketing firms can't compete with this work.
                <br />
                They don't build software. We do.
              </p>
              <p className="yk-manifesto-credit">— BUILT BY YAKINI</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── PLATFORMS SHOWCASE ───── */}
      <section className="yk-section yk-platforms">
        <div className="yk-section-inner">
          <div className="yk-section-head">
            <div className="yk-section-tag">
              <span className="yk-num">02</span>
              <span>Platforms</span>
            </div>
            <h2 className="yk-section-h2">
              We don't build sites.
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

      {/* ───── INTELLIGENCE ───── */}
      <section className="yk-section yk-intelligence">
        <div className="yk-section-inner">
          <div className="yk-intel-head">
            <div className="yk-section-tag">
              <span className="yk-num">03</span>
              <span>Yakini Intelligence</span>
            </div>
            <h2 className="yk-section-h2 yk-intel-h2">
              <span className="yk-italic">Built by Yakini.</span>
              <br />
              <span className="yk-electric">Powered by intelligence.</span>
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
                <span>Generated by Claude Sonnet 4 in 8 seconds</span>
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

      {/* ───── PROCESS ───── */}
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
                <div className="yk-brand-mark">
                  <span className="yk-brand-y">Y</span>
                </div>
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

const INTEL_TOOLS = [
  { name: 'Case Triage', icon: '⚖', desc: 'Strength assessment, key arguments, risk analysis, evidence checklist.' },
  { name: 'Letter Generation', icon: '✉', desc: 'Demand letters, dispute notices, customer comms — drafted instantly.' },
  { name: 'Hearing Prep', icon: '🏛', desc: 'One-page court briefs with facts, arguments, and counter-arguments.' },
  { name: 'License Verification', icon: '🔍', desc: 'Cross-reference state licensing records to flag discrepancies.' },
  { name: 'Customer Communication', icon: '💬', desc: 'Status updates and replies drafted in your voice and brand.' },
  { name: 'Strategic Analysis', icon: '📊', desc: 'Pattern detection across your case history — what wins, what loses.' },
]

const PROCESS_STEPS = [
  { title: 'Strategic Intake', desc: 'We map your business — workflows, customers, ops, where AI multiplies you.', time: 'Day 1' },
  { title: 'Architecture', desc: 'Database design, system blueprint, integration plan, security model.', time: 'Days 2-3' },
  { title: 'Build', desc: 'Custom platform — not a template. Database, APIs, UI, AI tools, admin.', time: 'Days 4-14' },
  { title: 'Deploy', desc: 'Your domain, your infrastructure, your data. We hand you the keys.', time: 'Day 15' },
  { title: 'Optimize', desc: 'Monthly platform improvements, AI refinement, new features as you grow.', time: 'Ongoing' },
]

const CSS = `
  /* ═══ FOUNDATION ═══ */
  :root {
    --navy: #0A1F3D;
    --navy-deep: #050E1F;
    --black: #000000;
    --black-soft: #0A0A0A;
    --gold: #C8A84B;
    --gold-warm: #B5915F;
    --cream: #F4F1EB;
    --warm-white: #FAFAF8;
    --electric: #4A90D9;
    --electric-soft: rgba(74, 144, 217, 0.15);
    --gold-soft: rgba(200, 168, 75, 0.1);
    --line: rgba(255,255,255,0.08);
    --line-strong: rgba(255,255,255,0.15);
    --muted: rgba(255,255,255,0.55);
    --font-display: 'Cormorant Garamond', Georgia, serif;
    --font-body: 'Inter', -apple-system, sans-serif;
    --font-mono: 'JetBrains Mono', Menlo, monospace;
  }

  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    background: var(--navy-deep);
    color: var(--cream);
    font-family: var(--font-body);
    -webkit-font-smoothing: antialiased;
    line-height: 1.6;
    overflow-x: hidden;
  }
  a { color: inherit; text-decoration: none; transition: color 0.2s; }
  ul { list-style: none; }
  ::selection { background: var(--gold); color: var(--navy-deep); }

  .yk-italic { font-style: italic; font-family: var(--font-display); font-weight: 400; }
  .yk-gold { color: var(--gold); }
  .yk-electric { color: var(--electric); }

  /* ═══ NAV ═══ */
  .yk-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    padding: 18px 32px;
    background: transparent;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .yk-nav.scrolled {
    padding: 12px 32px;
    background: rgba(5, 14, 31, 0.85);
    backdrop-filter: blur(24px) saturate(180%);
    border-bottom: 1px solid var(--line);
  }
  .yk-nav-inner {
    max-width: 1400px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between;
    gap: 32px;
  }
  .yk-brand {
    display: flex; align-items: center; gap: 12px;
  }
  .yk-brand-mark {
    width: 36px; height: 36px;
    border: 1.5px solid var(--gold);
    display: flex; align-items: center; justify-content: center;
    background: rgba(200, 168, 75, 0.05);
    transition: all 0.3s;
  }
  .yk-brand-mark:hover {
    background: rgba(200, 168, 75, 0.15);
    transform: rotate(-5deg);
  }
  .yk-brand-y {
    font-family: var(--font-display);
    font-size: 22px;
    font-style: italic;
    font-weight: 500;
    color: var(--gold);
    line-height: 1;
  }
  .yk-brand-text {
    display: flex; flex-direction: column; line-height: 1;
  }
  .yk-brand-name {
    font-family: var(--font-body);
    font-weight: 700;
    font-size: 15px;
    letter-spacing: 0.18em;
    color: var(--cream);
  }
  .yk-brand-sub {
    font-family: var(--font-body);
    font-weight: 500;
    font-size: 9px;
    letter-spacing: 0.25em;
    color: var(--gold);
    margin-top: 3px;
  }

  .yk-nav-center {
    display: flex; gap: 36px; align-items: center;
  }
  .yk-nav-center a {
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.02em;
    color: rgba(244, 241, 235, 0.75);
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
  .yk-nav-center a:hover { color: var(--cream); }
  .yk-nav-center a:hover::after { transform: scaleX(1); }

  .yk-nav-cta {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 11px 22px;
    background: var(--cream);
    color: var(--navy-deep);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.05em;
    transition: all 0.3s;
  }
  .yk-nav-cta:hover {
    background: var(--gold);
    color: var(--navy-deep);
    transform: translateY(-1px);
    box-shadow: 0 12px 30px rgba(200, 168, 75, 0.25);
  }
  .yk-nav-cta-arrow {
    transition: transform 0.2s;
  }
  .yk-nav-cta:hover .yk-nav-cta-arrow {
    transform: translateX(4px);
  }

  .yk-burger { display: none; background: none; border: none; cursor: pointer; padding: 8px; }
  .yk-burger span {
    display: block; width: 22px; height: 1.5px;
    background: var(--cream); margin: 5px 0;
    transition: all 0.3s;
  }
  .yk-burger.open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
  .yk-burger.open span:nth-child(2) { opacity: 0; }
  .yk-burger.open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

  .yk-mobile-menu {
    position: fixed; top: 70px; left: 0; right: 0; bottom: 0; z-index: 99;
    background: var(--navy-deep);
    padding: 32px 32px;
    display: flex; flex-direction: column; gap: 20px;
    border-top: 1px solid var(--line);
  }
  .yk-mobile-menu a {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 500;
    color: var(--cream);
    padding: 8px 0;
    border-bottom: 1px solid var(--line);
  }
  .yk-mobile-cta {
    color: var(--gold) !important;
  }

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
  .yk-hero-bg {
    position: absolute; inset: 0;
    background: var(--navy-deep);
    z-index: -1;
  }
  .yk-hero-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(200, 168, 75, 0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(200, 168, 75, 0.04) 1px, transparent 1px);
    background-size: 80px 80px;
    mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent 80%);
  }
  .yk-hero-glow {
    position: absolute;
    top: -10%; left: 50%;
    transform: translateX(-50%);
    width: 1200px; height: 800px;
    background: radial-gradient(ellipse at center,
      rgba(200, 168, 75, 0.18) 0%,
      rgba(74, 144, 217, 0.08) 30%,
      transparent 70%);
    filter: blur(40px);
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
    border: 1px solid var(--line-strong);
    background: rgba(255, 255, 255, 0.02);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.25em;
    color: var(--gold);
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
    font-weight: 400;
    letter-spacing: -0.025em;
    color: var(--cream);
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
    color: rgba(244, 241, 235, 0.65);
  }
  .yk-hero-gold {
    color: var(--gold);
    font-style: italic;
  }

  @keyframes fade-up {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .yk-hero-sub {
    font-size: clamp(17px, 1.5vw, 21px);
    line-height: 1.6;
    color: rgba(244, 241, 235, 0.7);
    max-width: 620px;
    margin-bottom: 48px;
    opacity: 0;
    animation: fade-up 1s cubic-bezier(0.16, 1, 0.3, 1) 0.7s forwards;
  }

  .yk-hero-ctas {
    display: flex; gap: 16px; flex-wrap: wrap;
    margin-bottom: 80px;
    opacity: 0;
    animation: fade-up 1s cubic-bezier(0.16, 1, 0.3, 1) 0.85s forwards;
  }

  .yk-btn-primary {
    display: inline-flex; align-items: center; gap: 12px;
    background: var(--cream);
    color: var(--navy-deep);
    padding: 18px 30px;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.04em;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    border: 1.5px solid var(--cream);
  }
  .yk-btn-primary:hover {
    background: var(--gold);
    border-color: var(--gold);
    transform: translateY(-2px);
    box-shadow: 0 15px 40px rgba(200, 168, 75, 0.3);
  }
  .yk-btn-arrow { transition: transform 0.25s; }
  .yk-btn-primary:hover .yk-btn-arrow { transform: translateX(6px); }

  .yk-btn-ghost {
    display: inline-flex; align-items: center; gap: 10px;
    color: var(--cream);
    padding: 18px 30px;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.04em;
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
    display: flex;
    gap: 60px;
    white-space: nowrap;
    animation: marquee 40s linear infinite;
    font-family: var(--font-body);
    font-size: 12px;
    font-weight: 600;
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
    font-size: 10px;
    letter-spacing: 0.25em;
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
  .yk-section-inner {
    max-width: 1400px; margin: 0 auto;
  }
  .yk-section-tag {
    display: inline-flex; align-items: baseline; gap: 14px;
    margin-bottom: 32px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.3em;
    color: var(--gold);
    text-transform: uppercase;
  }
  .yk-num {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 18px;
    font-weight: 400;
    opacity: 0.6;
  }
  .yk-section-h2 {
    font-family: var(--font-display);
    font-size: clamp(48px, 7vw, 96px);
    line-height: 0.95;
    font-weight: 400;
    letter-spacing: -0.02em;
    color: var(--cream);
    max-width: 14ch;
    margin-bottom: 60px;
  }
  .yk-section-head {
    margin-bottom: 80px;
  }
  .yk-section-cta {
    margin-top: 60px;
    display: flex;
    justify-content: center;
  }

  /* ═══ MANIFESTO ═══ */
  .yk-manifesto {
    background: linear-gradient(180deg, var(--navy-deep) 0%, var(--black-soft) 100%);
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
    padding-top: 12px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.3em;
    color: var(--gold);
    text-transform: uppercase;
    border-top: 2px solid var(--gold);
    padding-top: 20px;
  }
  .yk-manifesto-body { max-width: 720px; }
  .yk-manifesto-p {
    font-family: var(--font-display);
    font-size: clamp(22px, 2.4vw, 34px);
    font-weight: 400;
    line-height: 1.4;
    color: var(--cream);
    margin-bottom: 24px;
  }
  .yk-manifesto-p em { color: var(--gold); font-style: italic; }
  .yk-manifesto-credit {
    font-family: var(--font-body);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.3em;
    color: var(--gold);
    margin-top: 32px;
  }

  @media (max-width: 900px) {
    .yk-manifesto-grid { grid-template-columns: 1fr; gap: 24px; }
  }

  /* ═══ PLATFORMS ═══ */
  .yk-platforms { background: var(--black); }
  .yk-platforms-grid {
    display: grid;
    grid-template-columns: 1.6fr 1fr 1fr;
    grid-template-rows: auto auto;
    gap: 16px;
  }
  .yk-platform-featured {
    grid-row: span 2;
  }
  .yk-platform-card {
    display: flex; flex-direction: column;
    padding: 36px 32px;
    background: linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%);
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
    background: linear-gradient(180deg, rgba(200, 168, 75, 0.04) 0%, rgba(200, 168, 75, 0.01) 100%);
    transform: translateY(-3px);
  }
  .yk-platform-card:hover::before { transform: scaleX(1); }
  .yk-platform-meta {
    display: flex; gap: 16px;
    margin-bottom: 24px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.25em;
    text-transform: uppercase;
  }
  .yk-platform-status {
    color: var(--gold);
    padding: 4px 10px;
    background: var(--gold-soft);
    border: 1px solid rgba(200, 168, 75, 0.3);
  }
  .yk-platform-tier {
    color: var(--muted);
    padding: 4px 10px;
    border: 1px solid var(--line-strong);
  }
  .yk-platform-name {
    font-family: var(--font-display);
    font-size: clamp(28px, 3vw, 44px);
    font-weight: 500;
    line-height: 1.1;
    color: var(--cream);
    margin-bottom: 16px;
  }
  .yk-platform-featured .yk-platform-name {
    font-size: clamp(40px, 4vw, 64px);
  }
  .yk-platform-desc {
    font-size: 15px;
    line-height: 1.7;
    color: var(--muted);
    margin-bottom: auto;
  }
  .yk-platform-stats {
    display: flex; gap: 32px;
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid var(--line);
  }
  .yk-platform-stat {
    display: flex; flex-direction: column;
  }
  .yk-stat-num {
    font-family: var(--font-display);
    font-size: 36px;
    font-weight: 500;
    color: var(--gold);
    line-height: 1;
  }
  .yk-stat-lbl {
    font-size: 11px;
    color: var(--muted);
    margin-top: 6px;
    letter-spacing: 0.05em;
  }
  .yk-platform-arrow {
    margin-top: 24px;
    font-size: 13px;
    font-weight: 600;
    color: var(--gold);
    letter-spacing: 0.05em;
  }

  @media (max-width: 1024px) {
    .yk-platforms-grid {
      grid-template-columns: 1fr 1fr;
    }
    .yk-platform-featured { grid-row: span 1; grid-column: span 2; }
  }
  @media (max-width: 600px) {
    .yk-platforms-grid { grid-template-columns: 1fr; }
    .yk-platform-featured { grid-column: span 1; }
  }
  
  /* ═══ INTELLIGENCE ═══ */
  .yk-intelligence {
    background: linear-gradient(180deg, var(--black) 0%, var(--navy-deep) 100%);
    position: relative;
  }
  .yk-intelligence::before {
    content: ''; position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 800px; height: 800px;
    background: radial-gradient(circle, var(--electric-soft) 0%, transparent 60%);
    pointer-events: none;
  }
  .yk-intel-head {
    text-align: center;
    max-width: 900px;
    margin: 0 auto 80px;
    position: relative;
  }
  .yk-intel-head .yk-section-tag {
    justify-content: center;
  }
  .yk-intel-h2 {
    margin-left: auto; margin-right: auto;
    max-width: 18ch;
  }
  .yk-intel-sub {
    font-size: 18px;
    line-height: 1.7;
    color: var(--muted);
    max-width: 640px;
    margin: 0 auto;
  }

  /* Demo card */
  .yk-demo-card {
    background: var(--black);
    border: 1px solid var(--line-strong);
    padding: 32px;
    position: relative;
    margin-bottom: 80px;
    box-shadow: 0 30px 80px rgba(0,0,0,0.5);
    overflow: hidden;
  }
  .yk-demo-card::before {
    content: ''; position: absolute;
    top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, var(--electric), var(--gold), var(--electric));
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
    letter-spacing: 0.15em;
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
    background: var(--electric);
    border-radius: 50%;
    box-shadow: 0 0 12px var(--electric);
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
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.25em;
    color: var(--muted);
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .yk-demo-case-num {
    font-family: var(--font-display);
    font-size: 36px;
    font-weight: 500;
    color: var(--cream);
    margin-bottom: 6px;
  }
  .yk-demo-customer {
    font-size: 14px;
    color: var(--muted);
  }
  .yk-demo-strength {
    text-align: right;
    border-left: 2px solid var(--gold);
    padding-left: 20px;
  }
  .yk-demo-strength-lbl {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.25em;
    color: var(--muted);
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  .yk-demo-strength-val {
    font-family: var(--font-display);
    font-size: 42px;
    font-weight: 500;
    color: var(--gold);
    line-height: 1;
    margin-bottom: 4px;
  }
  .yk-demo-strength-pct {
    font-size: 12px;
    color: var(--muted);
  }
  .yk-demo-section { margin-bottom: 24px; }
  .yk-demo-section-h {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.2em;
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
    color: var(--cream);
    padding-left: 20px;
    position: relative;
  }
  .yk-demo-list li::before {
    content: '→'; position: absolute;
    left: 0; color: var(--gold);
    opacity: 0.6;
  }
  .yk-demo-footer {
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid var(--line);
    display: flex; justify-content: space-between; align-items: center;
    flex-wrap: wrap; gap: 16px;
  }
  .yk-demo-link {
    color: var(--electric);
    font-size: 13px;
    font-weight: 600;
  }
  .yk-demo-link:hover { color: var(--cream); }

  /* Tools grid */
  .yk-intel-tools {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  .yk-tool {
    padding: 32px 28px;
    background: rgba(255,255,255,0.02);
    border: 1px solid var(--line);
    transition: all 0.3s;
    position: relative;
  }
  .yk-tool:hover {
    border-color: var(--electric);
    background: var(--electric-soft);
    transform: translateY(-2px);
  }
  .yk-tool-num {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--muted);
    letter-spacing: 0.15em;
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
    font-weight: 500;
    color: var(--cream);
    margin-bottom: 10px;
  }
  .yk-tool-desc {
    font-size: 14px;
    line-height: 1.6;
    color: var(--muted);
  }

  @media (max-width: 900px) {
    .yk-intel-tools { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 600px) {
    .yk-intel-tools { grid-template-columns: 1fr; }
  }

  /* ═══ METRICS ═══ */
  .yk-metrics {
    background: var(--navy-deep);
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
    font-weight: 500;
    color: var(--gold);
    line-height: 1;
    margin-bottom: 12px;
    font-style: italic;
  }
  .yk-metric-lbl {
    font-size: 13px;
    color: var(--muted);
    line-height: 1.5;
  }

  @media (max-width: 700px) {
    .yk-metrics-grid { grid-template-columns: 1fr 1fr; gap: 40px 16px; }
    .yk-metric { border: none; }
  }

  /* ═══ PROCESS ═══ */
  .yk-process { background: var(--black-soft); }
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
    background: rgba(200, 168, 75, 0.03);
    padding-left: 16px;
  }
  .yk-process-num {
    font-family: var(--font-display);
    font-size: 32px;
    font-weight: 500;
    color: var(--gold);
    font-style: italic;
  }
  .yk-process-title {
    font-family: var(--font-display);
    font-size: clamp(24px, 3vw, 36px);
    font-weight: 500;
    color: var(--cream);
    margin-bottom: 8px;
  }
  .yk-process-desc {
    font-size: 15px;
    line-height: 1.7;
    color: var(--muted);
    max-width: 600px;
  }
  .yk-process-time {
    text-align: right;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.15em;
    color: var(--gold);
    text-transform: uppercase;
  }

  @media (max-width: 700px) {
    .yk-process-item {
      grid-template-columns: 60px 1fr;
      gap: 16px;
    }
    .yk-process-time { grid-column: 2; text-align: left; margin-top: 8px; }
  }

  /* ═══ FINAL CTA ═══ */
  .yk-final {
    background: linear-gradient(180deg, var(--black-soft) 0%, var(--navy-deep) 100%);
    text-align: center;
  }
  .yk-final-content { max-width: 900px; margin: 0 auto; }
  .yk-final-eyebrow { margin-bottom: 32px; }
  .yk-final-h2 {
    font-family: var(--font-display);
    font-size: clamp(48px, 7vw, 96px);
    line-height: 0.95;
    font-weight: 400;
    letter-spacing: -0.02em;
    color: var(--cream);
    margin-bottom: 32px;
  }
  .yk-final-sub {
    font-size: 18px;
    line-height: 1.7;
    color: var(--muted);
    max-width: 540px;
    margin: 0 auto 48px;
  }
  .yk-final-ctas {
    display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;
  }

  /* ═══ FOOTER ═══ */
  .yk-footer {
    background: var(--black);
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
    font-size: 18px;
    font-style: italic;
    color: var(--muted);
    margin-top: 24px;
    max-width: 280px;
    line-height: 1.5;
  }
  .yk-footer-col h6 {
    font-family: var(--font-body);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.25em;
    color: var(--gold);
    margin-bottom: 20px;
    text-transform: uppercase;
  }
  .yk-footer-col a {
    display: block;
    font-size: 14px;
    color: var(--muted);
    margin-bottom: 10px;
    transition: color 0.2s;
  }
  .yk-footer-col a:hover { color: var(--cream); }
  .yk-footer-bottom {
    border-top: 1px solid var(--line);
    padding-top: 24px;
    display: flex; justify-content: space-between;
    flex-wrap: wrap; gap: 16px;
    font-size: 12px;
    color: var(--muted);
  }

  @media (max-width: 800px) {
    .yk-footer-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
  }
  @media (max-width: 500px) {
    .yk-footer-grid { grid-template-columns: 1fr; }
  }
`
