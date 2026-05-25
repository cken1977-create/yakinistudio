'use client'

import { SiteShell } from '@/components/SiteShell'

// ═════════════════════════════════════════════════════════════════════════
// YAKINI ABOUT PAGE
// File: apps/yakini.digital/app/(marketing)/about/page.tsx
//
// Purpose: Make founders trust Clarence specifically AND understand
// the bigger BRSA ecosystem. People invest in founders, not companies.
// ═════════════════════════════════════════════════════════════════════════

export default function AboutPage() {
  return (
    <SiteShell>
      <style>{PAGE_CSS}</style>
      <div className="ab-page-bg" />

      {/* ───── HEADER ───── */}
      <header className="yk-page-header ab-header">
        <div className="yk-page-header-inner">
          <div className="yk-eyebrow">
            <span className="yk-eyebrow-dot" />
            <span>ABOUT YAKINI</span>
          </div>
          <h1 className="yk-page-h1">
            We don't <span className="yk-italic">sell websites.</span>
            <br />
            We build <span className="yk-gold">infrastructure</span>
            <br />
            for serious founders.
          </h1>
          <p className="yk-page-sub">
            Yakini is the digital infrastructure arm of BRSA Holdings — a small holding company building
            standards, platforms, and intelligence for industries that have been underserved by traditional agencies.
          </p>
        </div>
      </header>

      {/* ───── FOUNDER STORY ───── */}
      <section className="yk-section ab-founder">
        <div className="yk-section-inner">
          <div className="yk-section-tag">
            <span className="yk-num">01</span>
            <span>Founder</span>
          </div>

          <div className="ab-founder-grid">
            <div className="ab-founder-content">
              <div className="ab-founder-meta">FOUNDER · CEO</div>
              <h2 className="ab-founder-name">Clarence Kennedy</h2>
              <p className="ab-founder-role">
                Founder of BRSA Holdings · Builder of Yakini, Legacyline, and the BRSA Foundation
              </p>

              <div className="ab-founder-body">
                <p>
                  I started building Yakini because I kept seeing the same broken pattern:
                  serious founders running serious businesses on tools designed for hobbyists.
                </p>
                <p>
                  Tow defense services running their case files on Google Sheets.
                  Private chefs managing million-dollar bookings through DMs.
                  Oilfield operators tracking compliance on clipboards.
                  Nonprofits with grant deliverables that should print themselves —
                  doing them by hand.
                </p>
                <p>
                  Every one of these founders deserves real infrastructure. Custom platforms.
                  AI tools. Independent ownership. Most agencies won't build this for them
                  because it's harder than selling a WordPress template.
                </p>
                <p>
                  <strong style={{ color: 'var(--gold)' }}>Yakini exists because we will.</strong>
                </p>
              </div>

              <div className="ab-founder-quote">
                <p>"Most agencies sell you a website. We sell you the infrastructure your business runs on."</p>
                <span>— Clarence · Founder</span>
              </div>
            </div>

            <div className="ab-founder-visual">
              <div className="ab-founder-card">
                <div className="ab-founder-card-h">FOUNDER FACTS</div>

                <div className="ab-fact">
                  <div className="ab-fact-h">BUILDS</div>
                  <div className="ab-fact-v">Yakini · Legacyline · TheyTowedMyCar</div>
                </div>

                <div className="ab-fact">
                  <div className="ab-fact-h">PARENT COMPANY</div>
                  <div className="ab-fact-v">BRSA Holdings, Inc. · Delaware</div>
                </div>

                <div className="ab-fact">
                  <div className="ab-fact-h">NONPROFIT ARM</div>
                  <div className="ab-fact-v">BRSA Foundation · 501(c)(3) · NM</div>
                </div>

                <div className="ab-fact">
                  <div className="ab-fact-h">APPROACH</div>
                  <div className="ab-fact-v">Solo builder, partner-first, founder-aligned</div>
                </div>

                <div className="ab-fact">
                  <div className="ab-fact-h">FOCUS AREAS</div>
                  <div className="ab-fact-v">Corrections · Workforce · Hospitality · Energy · Legal Services</div>
                </div>

                <div className="ab-fact-cta">
                  <p>Direct line</p>
                  <a href="mailto:hello@yakini.digital">hello@yakini.digital</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── BRSA ECOSYSTEM ───── */}
      <section className="yk-section ab-ecosystem">
        <div className="yk-section-inner">
          <div className="yk-section-tag">
            <span className="yk-num">02</span>
            <span>The Ecosystem</span>
          </div>
          <h2 className="yk-section-h2">
            Yakini is part of
            <br />
            <span className="yk-italic">something bigger.</span>
          </h2>
          <p className="ab-section-sub">
            BRSA Holdings is the parent company. Yakini is the digital infrastructure arm.
            Legacyline is the readiness operating system. The BRSA Foundation funds access for communities
            that need infrastructure but can't afford it.
            <br /><br />
            Same standards. Same rigor. Different missions.
          </p>

          <div className="ab-ecosystem-tree">
            {/* BRSA Holdings */}
            <div className="ab-tree-node ab-tree-root">
              <div className="ab-tree-node-meta">PARENT · IP HOLDER</div>
              <h3 className="ab-tree-node-name">BRSA Holdings, Inc.</h3>
              <p className="ab-tree-node-desc">
                Delaware C-Corporation. Holds intellectual property and standards across all entities.
                Never intended for sale. The permanent foundation.
              </p>
              <div className="ab-tree-tags">
                <span className="ab-tree-tag">DELAWARE C-CORP</span>
                <span className="ab-tree-tag">STANDARDS AUTHORITY</span>
                <span className="ab-tree-tag">IP HOLDER</span>
              </div>
            </div>

            <div className="ab-tree-connector" />

            {/* Three children */}
            <div className="ab-tree-children">
              <div className="ab-tree-node ab-tree-yakini">
                <div className="ab-tree-node-meta">DIGITAL INFRASTRUCTURE</div>
                <h3 className="ab-tree-node-name">Yakini</h3>
                <p className="ab-tree-node-desc">
                  The agency arm. Builds custom platforms with AI intelligence baked in,
                  for serious founders across every industry. Designed to scale and acquire.
                </p>
                <div className="ab-tree-tags">
                  <span className="ab-tree-tag">PLATFORM BUILDER</span>
                  <span className="ab-tree-tag">AI ENGINE</span>
                  <span className="ab-tree-tag">REVENUE GENERATOR</span>
                </div>
                <a href="/" className="ab-tree-link">You are here →</a>
              </div>

              <div className="ab-tree-node ab-tree-legacyline">
                <div className="ab-tree-node-meta">VERTICAL PLATFORM</div>
                <h3 className="ab-tree-node-name">Legacyline</h3>
                <p className="ab-tree-node-desc">
                  Readiness operating system for corrections, workforce, education, and economic development.
                  7 modules. Three subject domains. Deterministic SHA-256 scoring. Built to be acquired.
                </p>
                <div className="ab-tree-tags">
                  <span className="ab-tree-tag">7-MODULE OS</span>
                  <span className="ab-tree-tag">FRARI SCORING</span>
                  <span className="ab-tree-tag">ACQUIRABLE</span>
                </div>
                <a href="https://legacylinehq.com" target="_blank" rel="noopener" className="ab-tree-link">
                  Visit legacylinehq.com →
                </a>
              </div>

              <div className="ab-tree-node ab-tree-foundation">
                <div className="ab-tree-node-meta">NONPROFIT</div>
                <h3 className="ab-tree-node-name">BRSA Foundation</h3>
                <p className="ab-tree-node-desc">
                  501(c)(3) nonprofit funding access to BRSA infrastructure for low-income communities,
                  refugee populations, and underserved nonprofits. New Mexico based, granted status.
                </p>
                <div className="ab-tree-tags">
                  <span className="ab-tree-tag">501(C)(3)</span>
                  <span className="ab-tree-tag">NEW MEXICO</span>
                  <span className="ab-tree-tag">GRANTED</span>
                </div>
                <a href="https://brsafoundation.org" target="_blank" rel="noopener" className="ab-tree-link">
                  Visit brsafoundation.org →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── PHILOSOPHY ───── */}
      <section className="yk-section ab-philosophy">
        <div className="yk-section-inner">
          <div className="yk-section-tag">
            <span className="yk-num">03</span>
            <span>What We Believe</span>
          </div>

          <h2 className="yk-section-h2">
            Six things <span className="yk-italic">we believe</span>
            <br />
            that shape <span className="yk-gold">how we build.</span>
          </h2>

          <div className="ab-beliefs">
            {BELIEFS.map((belief, i) => (
              <div key={belief.title} className="ab-belief">
                <div className="ab-belief-num">{String(i + 1).padStart(2, '0')}</div>
                <div className="ab-belief-content">
                  <h3 className="ab-belief-title">{belief.title}</h3>
                  <p className="ab-belief-desc">{belief.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── WHO WE WORK WITH ───── */}
      <section className="yk-section ab-who">
        <div className="yk-section-inner">
          <div className="yk-section-tag">
            <span className="yk-num">04</span>
            <span>Selectivity</span>
          </div>

          <h2 className="yk-section-h2">
            Who we
            <br />
            <span className="yk-italic">work with.</span>
          </h2>

          <div className="ab-who-grid">
            <div className="ab-who-card ab-who-yes">
              <div className="ab-who-h">WE BUILD WITH</div>
              <ul>
                <li>Founders who own their business and make decisions</li>
                <li>Operators in regulated or specialized industries</li>
                <li>Growth-stage businesses tired of duct-tape solutions</li>
                <li>People who want infrastructure they own forever</li>
                <li>Founders in industries that have been underserved</li>
                <li>Strategic partners willing to be a case study</li>
                <li>Nonprofits with serious operations and accountability</li>
              </ul>
            </div>

            <div className="ab-who-card ab-who-no">
              <div className="ab-who-h">WE DON'T BUILD FOR</div>
              <ul>
                <li>Founders looking for the cheapest possible website</li>
                <li>Committees that need three-month decision cycles</li>
                <li>Businesses where "we'll figure out AI later"</li>
                <li>Clients who want to license templates, not own platforms</li>
                <li>Anyone whose business model relies on us being slow</li>
                <li>Vanity projects without real operational backing</li>
              </ul>
            </div>
          </div>

          <p className="ab-who-footer">
            We say no more often than we say yes. That's how we maintain quality.
          </p>
        </div>
      </section>

      {/* ───── FINAL CTA ───── */}
      <section className="yk-section ab-final">
        <div className="yk-section-inner">
          <div className="ab-final-content">
            <div className="yk-eyebrow">
              <span className="yk-eyebrow-dot" />
              <span>READY TO BUILD?</span>
            </div>
            <h2 className="ab-final-h2">
              Yakini is selective.
              <br />
              <span className="yk-italic">If we say yes,</span>
              <br />
              <span className="yk-gold">we mean it.</span>
            </h2>
            <p className="ab-final-sub">
              The application process exists to make sure we're a fit before either of us invests time.
              Real partnerships start with real conversations.
            </p>
            <div className="ab-final-ctas">
              <a href="/apply" className="yk-btn-primary">
                <span>Apply for partnership</span>
                <span className="yk-btn-arrow">→</span>
              </a>
              <a href="/platforms" className="yk-btn-ghost">
                <span>See our platforms</span>
                <span className="yk-btn-arrow">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  )
}

const BELIEFS = [
  {
    title: 'Infrastructure beats marketing tactics.',
    desc: 'A flashy ad campaign gets you customers for a month. A platform built for your industry gets you customers for a decade. Yakini invests in the second kind of advantage.',
  },
  {
    title: 'AI baked in, not bolted on.',
    desc: 'Adding AI to an existing platform never works as well as designing the platform around AI from day one. Every Yakini build is architected so intelligence is in the foundation, not a feature.',
  },
  {
    title: 'Founders should own their infrastructure.',
    desc: 'Most agencies build platforms that lock founders into their hosting, their licenses, their proprietary tools. We hand over the keys. Your domain, your data, your code, your AI — yours forever.',
  },
  {
    title: 'Speed is a competitive advantage.',
    desc: 'Three-month build cycles aren\'t careful — they\'re wasteful. We deploy custom platforms in two weeks because every day your business doesn\'t have its infrastructure is a day your competitors gain ground.',
  },
  {
    title: 'Underserved industries deserve elite tools.',
    desc: 'Tow defense services, oilfield operators, private chefs, immigrant-serving nonprofits — these aren\'t glamorous tech sectors. They\'re also where the real work of America happens. They deserve infrastructure as good as any Silicon Valley startup gets.',
  },
  {
    title: 'Standards before scale.',
    desc: 'BRSA Holdings exists to govern standards across our platforms. Before Legacyline scales nationally, before Yakini scales to a hundred clients, the standards must be locked. Quality first. Volume follows.',
  },
]

const PAGE_CSS = `
  /* === PAGE BACKGROUND (CGI imagery) === */
  .ab-page-bg {
    position: fixed;
    inset: 0;
    z-index: 0;
    background: var(--navy-deep) url('/yakini-about-bg.jpg') center center / cover no-repeat;
    pointer-events: none;
  }
  .ab-page-bg::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(10,9,8,0.55) 0%, rgba(10,9,8,0.70) 70%, rgba(10,9,8,0.90) 100%);
    pointer-events: none;
  }
  /* Lift content above the background */
  header.ab-header,
  section.yk-section {
    position: relative;
    z-index: 1;
  }

  /* ═══ HEADER ═══ */
  .ab-header::before {
    background: radial-gradient(ellipse at center,
      rgba(200, 168, 75, 0.15) 0%,
      rgba(74, 144, 217, 0.06) 40%,
      transparent 70%) !important;
  }
  .ab-section-sub {
    font-size: 18px;
    line-height: 1.7;
    color: var(--muted);
    max-width: 760px;
    margin-bottom: 80px;
  }

  /* ═══ FOUNDER ═══ */
  .ab-founder { background: var(--black); }
  .ab-founder-grid {
    display: grid;
    grid-template-columns: 1.6fr 1fr;
    gap: 60px;
    align-items: start;
  }
  .ab-founder-meta {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.3em;
    color: var(--gold);
    margin-bottom: 16px;
    text-transform: uppercase;
  }
  .ab-founder-name {
    font-family: var(--font-display);
    font-size: clamp(48px, 7vw, 96px);
    font-weight: 500;
    line-height: 1;
    color: var(--cream);
    margin-bottom: 16px;
    letter-spacing: -0.02em;
  }
  .ab-founder-role {
    font-family: var(--font-display);
    font-size: clamp(18px, 2vw, 24px);
    font-style: italic;
    color: var(--gold);
    margin-bottom: 40px;
  }
  .ab-founder-body p {
    font-size: 17px;
    line-height: 1.8;
    color: var(--cream);
    margin-bottom: 20px;
  }
  .ab-founder-quote {
    margin-top: 48px;
    padding: 32px;
    background: linear-gradient(135deg, rgba(200, 168, 75, 0.08) 0%, rgba(74, 144, 217, 0.04) 100%);
    border-left: 3px solid var(--gold);
  }
  .ab-founder-quote p {
    font-family: var(--font-display);
    font-size: clamp(22px, 2.4vw, 30px);
    font-style: italic;
    font-weight: 500;
    line-height: 1.4;
    color: var(--cream);
    margin-bottom: 12px;
  }
  .ab-founder-quote span {
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--gold);
    letter-spacing: 0.05em;
  }

  /* Founder card */
  .ab-founder-card {
    padding: 36px;
    background: rgba(255,255,255,0.02);
    border: 1px solid var(--line-strong);
    position: sticky;
    top: 100px;
  }
  .ab-founder-card-h {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.25em;
    color: var(--gold);
    margin-bottom: 32px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--line);
  }
  .ab-fact {
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px dashed var(--line);
  }
  .ab-fact:last-of-type { border-bottom: none; }
  .ab-fact-h {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.25em;
    color: var(--muted);
    margin-bottom: 6px;
    text-transform: uppercase;
  }
  .ab-fact-v {
    font-size: 14px;
    color: var(--cream);
    line-height: 1.5;
  }
  .ab-fact-cta {
    margin-top: 16px;
    padding-top: 24px;
    border-top: 1px solid var(--line);
  }
  .ab-fact-cta p {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.25em;
    color: var(--muted);
    margin-bottom: 8px;
    text-transform: uppercase;
  }
  .ab-fact-cta a {
    font-family: var(--font-display);
    font-size: 18px;
    font-style: italic;
    color: var(--gold);
  }
  .ab-fact-cta a:hover { color: var(--cream); }

  @media (max-width: 900px) {
    .ab-founder-grid { grid-template-columns: 1fr; }
    .ab-founder-card { position: static; }
  }

  /* ═══ ECOSYSTEM ═══ */
  .ab-ecosystem {
    background: linear-gradient(180deg, var(--black) 0%, var(--navy-deep) 100%);
  }

  .ab-ecosystem-tree {
    margin-top: 40px;
  }
  .ab-tree-node {
    padding: 36px;
    background: rgba(255,255,255,0.02);
    border: 1px solid var(--line);
    transition: all 0.3s;
    position: relative;
  }
  .ab-tree-node:hover {
    border-color: var(--gold);
    transform: translateY(-2px);
  }
  .ab-tree-root {
    background: linear-gradient(135deg, rgba(200, 168, 75, 0.06) 0%, rgba(255,255,255,0.02) 100%);
    border: 2px solid var(--gold);
    max-width: 700px;
    margin: 0 auto 0;
  }
  .ab-tree-yakini {
    background: linear-gradient(180deg, rgba(74, 144, 217, 0.06) 0%, rgba(255,255,255,0.02) 100%);
    border-color: var(--electric);
  }
  .ab-tree-node-meta {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.3em;
    color: var(--gold);
    margin-bottom: 12px;
    text-transform: uppercase;
  }
  .ab-tree-yakini .ab-tree-node-meta { color: var(--electric); }
  .ab-tree-node-name {
    font-family: var(--font-display);
 font-size: clamp(28px, 3.2vw, 44px);
    font-weight: 500;
    line-height: 1;
    color: var(--cream);
    margin-bottom: 16px;
    letter-spacing: -0.02em;
  }
  .ab-tree-node-desc {
    font-size: 14px;
    line-height: 1.7;
    color: var(--cream);
    margin-bottom: 16px;
  }
  .ab-tree-tags {
    display: flex; gap: 6px; flex-wrap: wrap;
    margin-bottom: 16px;
  }
  .ab-tree-tag {
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.2em;
    padding: 4px 10px;
    background: rgba(0,0,0,0.3);
    color: var(--muted);
    text-transform: uppercase;
  }
  .ab-tree-link {
    display: inline-block;
    font-size: 13px;
    font-weight: 600;
    color: var(--gold);
    margin-top: 8px;
  }
  .ab-tree-link:hover { color: var(--cream); }
  .ab-tree-yakini .ab-tree-link { color: var(--electric); }

  .ab-tree-connector {
    width: 2px;
    height: 60px;
    background: linear-gradient(180deg, var(--gold), var(--line-strong));
    margin: 0 auto;
  }

  .ab-tree-children {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-top: 40px;
  }

  @media (max-width: 1000px) {
    .ab-tree-children { grid-template-columns: 1fr 1fr; }
    .ab-tree-yakini { grid-column: span 2; }
  }
  @media (max-width: 700px) {
    .ab-tree-children { grid-template-columns: 1fr; }
    .ab-tree-yakini { grid-column: span 1; }
  }

  /* ═══ PHILOSOPHY ═══ */
  .ab-philosophy { background: var(--black); }
  .ab-beliefs {
    display: flex;
    flex-direction: column;
    border-top: 1px solid var(--line);
  }
  .ab-belief {
    display: grid;
    grid-template-columns: 100px 1fr;
    gap: 32px;
    padding: 40px 0;
    border-bottom: 1px solid var(--line);
    align-items: start;
    transition: padding 0.3s;
  }
  .ab-belief:hover {
    padding-left: 16px;
    background: rgba(200, 168, 75, 0.02);
  }
  .ab-belief-num {
    font-family: var(--font-display);
    font-size: 56px;
    font-weight: 500;
    color: var(--gold);
    font-style: italic;
    line-height: 1;
  }
  .ab-belief-title {
    font-family: var(--font-display);
    font-size: clamp(28px, 3.5vw, 44px);
    font-weight: 500;
    line-height: 1.2;
    color: var(--cream);
    margin-bottom: 12px;
    letter-spacing: -0.02em;
  }
  .ab-belief-desc {
    font-size: 16px;
    line-height: 1.8;
    color: var(--muted);
    max-width: 80ch;
  }

  @media (max-width: 700px) {
    .ab-belief { grid-template-columns: 60px 1fr; gap: 16px; }
    .ab-belief-num { font-size: 36px; }
  }

  /* ═══ WHO WE WORK WITH ═══ */
  .ab-who { background: var(--navy-deep); }
  .ab-who-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 32px;
  }
  .ab-who-card {
    padding: 40px;
    background: rgba(255,255,255,0.02);
    border: 1px solid var(--line);
  }
  .ab-who-yes {
    border-color: var(--gold);
    background: linear-gradient(180deg, rgba(200, 168, 75, 0.04) 0%, rgba(255,255,255,0.02) 100%);
  }
  .ab-who-no {
    border-color: rgba(255,56,56,0.15);
  }
  .ab-who-h {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.3em;
    color: var(--gold);
    margin-bottom: 24px;
    text-transform: uppercase;
  }
  .ab-who-no .ab-who-h { color: rgba(255,107,107,0.8); }
  .ab-who-card ul {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .ab-who-card li {
    font-size: 15px;
    line-height: 1.7;
    color: var(--cream);
    padding-left: 24px;
    position: relative;
  }
  .ab-who-yes li::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: var(--gold);
    font-weight: 700;
  }
  .ab-who-no li::before {
    content: '✕';
    position: absolute;
    left: 0;
    color: rgba(255,107,107,0.6);
  }
  .ab-who-footer {
    text-align: center;
    font-family: var(--font-display);
    font-size: clamp(20px, 2.4vw, 28px);
    font-style: italic;
    color: var(--gold);
    margin-top: 40px;
    line-height: 1.4;
  }

  @media (max-width: 700px) {
    .ab-who-grid { grid-template-columns: 1fr; }
    .ab-who-card { padding: 32px 28px; }
  }

  /* ═══ FINAL CTA ═══ */
  .ab-final {
    background: linear-gradient(180deg, var(--navy-deep) 0%, var(--black) 100%);
    text-align: center;
  }
  .ab-final-content { max-width: 900px; margin: 0 auto; }
  .ab-final-h2 {
    font-family: var(--font-display);
    font-size: clamp(48px, 7vw, 96px);
    line-height: 1;
    font-weight: 400;
    letter-spacing: -0.02em;
    color: var(--cream);
    margin-bottom: 32px;
  }
  .ab-final-sub {
    font-size: 18px;
    line-height: 1.7;
    color: var(--muted);
    max-width: 640px;
    margin: 0 auto 48px;
  }
  .ab-final-ctas {
    display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;
  }
`
