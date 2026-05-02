'use client'

import { useState } from 'react'
import { SiteShell } from '@/components/SiteShell'

// ═════════════════════════════════════════════════════════════════════════
// YAKINI INTELLIGENCE — Sales Page
// File: apps/yakini.digital/app/intelligence/page.tsx
//
// Purpose: Convert "interested" into "where do I sign" for $5K-15K/mo
// Intelligence tier engagements.
// ═════════════════════════════════════════════════════════════════════════

const TOOLS = [
  {
    icon: '⚖',
    name: 'Case Triage',
    headline: 'Strength assessment in 8 seconds.',
    desc: 'Analyzes incoming cases and returns a structured assessment: case strength, confidence percentage, key arguments for your position, risks to watch, evidence checklist, and recommended next steps.',
    use: 'Tow defense, legal services, insurance claims, dispute resolution.',
    example: 'TTMC-2026-0001 → STRONG (85%) → 3 winning arguments cited Texas Transportation Code §545.305',
  },
  {
    icon: '✉',
    name: 'Letter Generation',
    headline: 'Demand letters and dispute notices, drafted instantly.',
    desc: 'Generates first-draft demand letters, dispute notices, follow-up communications, cease-and-desist letters — all in your voice and brand. You review and send.',
    use: 'Any business that handles disputes, billing issues, or formal communications.',
    example: 'Customer dispute → 3 letter variants → review → send. 30 seconds total.',
  },
  {
    icon: '🏛',
    name: 'Hearing Prep Brief',
    headline: 'One-page court briefs the night before.',
    desc: 'Generates a complete pre-hearing brief 24 hours before any scheduled hearing: facts of the case, key arguments, anticipated counter-arguments, evidence presentation order, and a ready-to-go talking script.',
    use: 'Legal hearings, regulatory meetings, insurance appeals, board presentations.',
    example: 'Hearing tomorrow at 9am → brief in your inbox at 8am with full prep packet.',
  },
  {
    icon: '🔍',
    name: 'License Verification',
    headline: 'Cross-reference state records automatically.',
    desc: 'When a vendor, contractor, or counterparty is named, AI cross-references their licensing status against state records and flags any discrepancies, expirations, or issues.',
    use: 'Construction, contracting, real estate, regulated industries.',
    example: 'Tow company name → cross-checked against TX VSF database → flagged expired license.',
  },
  {
    icon: '💬',
    name: 'Customer Communication',
    headline: 'Status updates drafted in your voice.',
    desc: 'Auto-drafts personalized customer status updates, follow-ups, and replies based on case progress. Maintains your brand voice across thousands of touchpoints.',
    use: 'Service businesses, professional services, anything with active customer relationships.',
    example: 'Case status changed → personalized update drafted → you approve → sent.',
  },
  {
    icon: '📊',
    name: 'Strategic Pattern Analysis',
    headline: 'Detect what wins. Detect what loses.',
    desc: 'Analyzes your historical case data to identify patterns: which case types have highest win rates, which arguments resonate, which evidence carries weight, which judges/courts to prioritize.',
    use: 'Any business with case-based or project-based historical data.',
    example: '50 cases analyzed → "Cases citing §545.305 win 87% of the time. Prioritize.',
  },
]

const ROI_INPUTS = [
  { label: 'Cases per month', default: 50 },
  { label: 'Minutes saved per case', default: 30 },
  { label: 'Hours saved per month', default: 25 },
  { label: 'Effective hourly rate', default: 150 },
]

export default function IntelligencePage() {
  const [casesPerMonth, setCasesPerMonth] = useState(50)
  const [minutesPerCase, setMinutesPerCase] = useState(30)
  const [hourlyRate, setHourlyRate] = useState(150)

  const hoursSaved = (casesPerMonth * minutesPerCase) / 60
  const monthlyValue = hoursSaved * hourlyRate
  const annualValue = monthlyValue * 12

  return (
    <SiteShell>
      <style>{PAGE_CSS}</style>

      {/* ───── PAGE HEADER ───── */}
      <header className="yk-page-header yk-intel-header">
        <div className="yk-page-header-inner">
          <div className="yk-eyebrow">
            <span className="yk-eyebrow-dot" />
            <span>YAKINI INTELLIGENCE</span>
          </div>
          <h1 className="yk-page-h1">
            <span className="yk-italic">Built by Yakini.</span>
            <br />
            <span className="yk-electric">Powered by intelligence.</span>
          </h1>
          <p className="yk-page-sub">
            Every Yakini platform comes with an AI layer woven into the workflow —
            not bolted on as an afterthought. Claude-powered tools that turn 30 minutes
            of expert work into 8 seconds of structured output.
          </p>
        </div>
      </header>

      {/* ───── LIVE DEMO ───── */}
      <section className="yk-section int-demo">
        <div className="yk-section-inner">
          <div className="yk-section-tag">
            <span className="yk-num">01</span>
            <span>Live Example</span>
          </div>
          <h2 className="yk-section-h2">
            See it <span className="yk-gold">work.</span>
          </h2>
          <p className="int-section-sub">
            This is the actual output from Garland's TheyTowedMyCar.com platform —
            a real case analyzed by Claude in 8 seconds. No mockup. No filter. The screenshot below is from the live admin dashboard.
          </p>

          <div className="yk-demo-card int-demo-card">
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
                <div className="yk-demo-customer">2024 Honda Civic · Apartment complex tow · Harris County, TX</div>
              </div>
              <div className="yk-demo-strength">
                <div className="yk-demo-strength-lbl">Case Strength</div>
                <div className="yk-demo-strength-val">STRONG</div>
                <div className="yk-demo-strength-pct">85% confidence</div>
              </div>
            </div>

            <div className="yk-demo-section">
              <div className="yk-demo-section-h">📋 ASSESSMENT</div>
              <p className="int-demo-assessment">
                Strong case based on customer's claim of no visible signage at apartment complex.
                Texas law requires specific signage standards, and absence of proper posting is
                a classic winning argument in tow hearings.
              </p>
            </div>

            <div className="yk-demo-section">
              <div className="yk-demo-section-h">⚖ KEY ARGUMENTS FOR THE CUSTOMER</div>
              <ul className="yk-demo-list">
                <li>No visible tow warning signage violates TX Transportation Code §545.305 requirements</li>
                <li>Burden on tow company to prove signage was properly posted and visible</li>
                <li>Apartment complex tows require clear authorization signage to establish probable cause</li>
              </ul>
            </div>

            <div className="yk-demo-section">
              <div className="yk-demo-section-h">⚠ RISKS &amp; WEAKNESSES</div>
              <ul className="yk-demo-list">
                <li>Customer may have missed existing signage</li>
                <li>Tow company might produce photos showing proper signs</li>
                <li>If truly unauthorized parking, signs may have been present but obscured</li>
              </ul>
            </div>

            <div className="yk-demo-section">
              <div className="yk-demo-section-h">🎯 RECOMMENDED NEXT STEPS</div>
              <ul className="yk-demo-list">
                <li>Get customer to take current photos of the parking area</li>
                <li>Request all signage documentation from tow company during discovery</li>
                <li>Verify if Apple Towing has proper VSF license and contracts with property</li>
              </ul>
            </div>

            <div className="yk-demo-section">
              <div className="yk-demo-section-h">📸 EVIDENCE TO COLLECT</div>
              <ul className="yk-demo-list">
                <li>Current photos of parking area showing lack of signage</li>
                <li>Tow company's authorization documentation</li>
                <li>Apple Towing's VSF license status</li>
                <li>Property management contract authorizing tows</li>
              </ul>
            </div>

            <div className="yk-demo-footer">
              <div className="yk-demo-meta-left">
                <span className="yk-demo-pulse" />
                <span>Generated by Claude Sonnet 4 in 8 seconds</span>
              </div>
              <span className="int-demo-stamp">REAL OUTPUT · NOT A MOCKUP</span>
            </div>
          </div>
        </div>
      </section>

      {/* ───── ROI CALCULATOR ───── */}
      <section className="yk-section int-roi">
        <div className="yk-section-inner">
          <div className="yk-section-tag">
            <span className="yk-num">02</span>
            <span>The Math</span>
          </div>
          <h2 className="yk-section-h2">
            What <span className="yk-italic">8 seconds</span>
            <br />
            <span className="yk-gold">is worth.</span>
          </h2>

          <div className="int-roi-grid">
            <div className="int-roi-inputs">
              <div className="int-roi-h">Your Numbers</div>
              <p className="int-roi-intro">
                Adjust the inputs below to see what Yakini Intelligence saves your business in time and money.
              </p>

              <div className="int-roi-field">
                <label>Cases / Tickets / Decisions per month</label>
                <input
                  type="range"
                  min="10"
                  max="500"
                  value={casesPerMonth}
                  onChange={e => setCasesPerMonth(Number(e.target.value))}
                />
                <div className="int-roi-val">{casesPerMonth.toLocaleString()}</div>
              </div>

              <div className="int-roi-field">
                <label>Minutes of expert time saved per case</label>
                <input
                  type="range"
                  min="5"
                  max="120"
                  value={minutesPerCase}
                  onChange={e => setMinutesPerCase(Number(e.target.value))}
                />
                <div className="int-roi-val">{minutesPerCase} min</div>
              </div>

              <div className="int-roi-field">
                <label>Effective hourly rate ($)</label>
                <input
                  type="range"
                  min="50"
                  max="500"
                  value={hourlyRate}
                  onChange={e => setHourlyRate(Number(e.target.value))}
                />
                <div className="int-roi-val">${hourlyRate}/hr</div>
              </div>
            </div>

            <div className="int-roi-output">
              <div className="int-roi-result">
                <div className="int-result-lbl">Hours saved monthly</div>
                <div className="int-result-val">{hoursSaved.toFixed(0)}</div>
              </div>
              <div className="int-roi-result int-result-feature">
                <div className="int-result-lbl">Monthly value created</div>
                <div className="int-result-val int-result-gold">
                  ${monthlyValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>
              <div className="int-roi-result">
                <div className="int-result-lbl">Annual value created</div>
                <div className="int-result-val int-result-electric">
                  ${annualValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>

              <div className="int-roi-comparison">
                <div className="int-comp-h">Yakini Intelligence Tier</div>
                <div className="int-comp-pricing">
                  <span className="int-comp-price">$10,000</span>
                  <span className="int-comp-period">/mo</span>
                </div>
                <div className="int-comp-roi">
                  ROI: <span className="yk-gold">
                    {monthlyValue > 0 ? ((monthlyValue / 10000 - 1) * 100).toFixed(0) : 0}%
                  </span> per month
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── 6 TOOLS ───── */}
      <section className="yk-section int-tools-section">
        <div className="yk-section-inner">
          <div className="yk-section-tag">
            <span className="yk-num">03</span>
            <span>The Tools</span>
          </div>
          <h2 className="yk-section-h2">
            Six AI tools.
            <br />
            <span className="yk-italic">One workflow.</span>
          </h2>

          <div className="int-tools-grid">
            {TOOLS.map((t, i) => (
              <div key={t.name} className="int-tool-card">
                <div className="int-tool-meta">
                  <span className="int-tool-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="int-tool-icon">{t.icon}</span>
                </div>
                <h3 className="int-tool-name">{t.name}</h3>
                <p className="int-tool-headline">{t.headline}</p>
                <p className="int-tool-desc">{t.desc}</p>
                <div className="int-tool-section">
                  <div className="int-tool-h">USE CASES</div>
                  <p>{t.use}</p>
                </div>
                <div className="int-tool-section">
                  <div className="int-tool-h">EXAMPLE</div>
                  <p className="int-tool-example">{t.example}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CASE STUDY: GARLAND ───── */}
      <section className="yk-section int-case-study">
        <div className="yk-section-inner">
          <div className="yk-section-tag">
            <span className="yk-num">04</span>
            <span>Case Study</span>
          </div>

          <div className="int-cs-grid">
            <div className="int-cs-content">
              <div className="int-cs-eyebrow">STRATEGIC PARTNER</div>
              <h2 className="int-cs-h2">
                <span className="yk-italic">Tow Defense Service</span>
                <br />
                <span className="yk-gold">TheyTowedMyCar.com</span>
              </h2>
              <p className="int-cs-quote">
                "Holy shit. THIS SHIT IS LEGIT BRO!!!"
              </p>
              <p className="int-cs-attribution">— Garland, Founder · First reaction to seeing the platform</p>

              <div className="int-cs-body">
                <p>
                  Garland runs a Texas tow hearing service. Customers get wrongfully towed,
                  he builds their evidentiary packet, they win their hearing, the tow company pays.
                </p>
                <p>
                  Before Yakini, every case took 30+ minutes of expert review time before
                  he even decided whether to take it. Manual investigation. Manual research.
                  Manual letter drafting.
                </p>
                <p>
                  We built him a complete platform: customer intake, admin command center,
                  customer portal, AI-powered case triage, automatic revenue tracking.
                  All in one session. All on his own domain. All AI-assisted.
                </p>
              </div>

              <div className="int-cs-stats">
                <div className="int-cs-stat">
                  <span className="int-cs-stat-num">8 sec</span>
                  <span className="int-cs-stat-lbl">Case strength assessment</span>
                </div>
                <div className="int-cs-stat">
                  <span className="int-cs-stat-num">5</span>
                  <span className="int-cs-stat-lbl">TX counties served</span>
                </div>
                <div className="int-cs-stat">
                  <span className="int-cs-stat-num">100%</span>
                  <span className="int-cs-stat-lbl">Owned by him</span>
                </div>
              </div>
            </div>

            <div className="int-cs-visual">
              <div className="int-cs-visual-card">
                <div className="int-cs-visual-meta">PLATFORM</div>
                <div className="int-cs-visual-h">TheyTowedMyCar.com</div>
                <div className="int-cs-visual-domain">Live · Independent infrastructure</div>

                <div className="int-cs-visual-features">
                  <div className="int-cs-feature">
                    <span className="int-cs-feature-dot">●</span>
                    <span>Public site (5 service counties)</span>
                  </div>
                  <div className="int-cs-feature">
                    <span className="int-cs-feature-dot">●</span>
                    <span>Customer intake (4-step form)</span>
                  </div>
                  <div className="int-cs-feature">
                    <span className="int-cs-feature-dot">●</span>
                    <span>Customer portal (magic link auth)</span>
                  </div>
                  <div className="int-cs-feature">
                    <span className="int-cs-feature-dot">●</span>
                    <span>Admin command center</span>
                  </div>
                  <div className="int-cs-feature">
                    <span className="int-cs-feature-dot int-cs-feature-electric">●</span>
                    <span>AI Triage (Claude Sonnet 4)</span>
                  </div>
                  <div className="int-cs-feature">
                    <span className="int-cs-feature-dot">●</span>
                    <span>Auto revenue share tracking</span>
                  </div>
                  <div className="int-cs-feature">
                    <span className="int-cs-feature-dot">●</span>
                    <span>VSF locator database</span>
                  </div>
                  <div className="int-cs-feature">
                    <span className="int-cs-feature-dot">●</span>
                    <span>Email automation pipeline</span>
                  </div>
                </div>

                <a href="https://theytowedmycar.com" target="_blank" rel="noopener" className="int-cs-visual-cta">
                  Visit live platform →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── PRICING POSITION ───── */}
      <section className="yk-section int-pricing-position">
        <div className="yk-section-inner">
          <div className="yk-section-tag">
            <span className="yk-num">05</span>
            <span>Investment</span>
          </div>
          <h2 className="yk-section-h2">
            Intelligence tier.
            <br />
            <span className="yk-gold">$10,000/mo.</span>
          </h2>

          <div className="int-tier-grid">
            <div className="int-tier-included">
              <h3>Included in every Intelligence engagement:</h3>
              <ul>
                <li>Custom platform (not a template)</li>
                <li>Independent infrastructure (your domain, your data)</li>
                <li>Database architecture + multi-tenant ready</li>
                <li>Customer-facing portal with auth</li>
                <li>Admin command center built for your workflow</li>
                <li>All 6 AI tools integrated</li>
                <li>Email automation + notifications</li>
                <li>Continuous AI refinement (monthly tuning)</li>
                <li>Platform updates + new features as you grow</li>
                <li>Direct line to your build team</li>
              </ul>
            </div>

            <div className="int-tier-cta">
              <div className="int-tier-h">Strategic Partner</div>
              <div className="int-tier-price">
                <span className="int-tier-num">$10K</span>
                <span className="int-tier-period">/month</span>
              </div>
              <div className="int-tier-setup">+ build setup fee (case-by-case)</div>

              <p className="int-tier-note">
                We work with a handful of serious founders at a time. Application required.
              </p>

              <a href="/apply" className="yk-btn-primary int-tier-btn">
                <span>Apply for partnership</span>
                <span className="yk-btn-arrow">→</span>
              </a>

              <a href="/pricing" className="int-tier-link">
                See all tiers →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ───── FINAL CTA ───── */}
      <section className="yk-section int-final">
        <div className="yk-section-inner">
          <div className="int-final-content">
            <div className="yk-eyebrow">
              <span className="yk-eyebrow-dot" />
              <span>READY TO BUILD?</span>
            </div>
            <h2 className="int-final-h2">
              Stop competing on
              <br />
              <span className="yk-italic">marketing tactics.</span>
              <br />
              <span className="yk-gold">Compete on infrastructure.</span>
            </h2>
            <p className="int-final-sub">
              Marketing firms can't build what we build. They don't make software.
              When you have Yakini Intelligence, your competitors aren't just behind on marketing — they're behind on the fundamental capability of their business.
            </p>
            <div className="int-final-ctas">
              <a href="/apply" className="yk-btn-primary">
                <span>Apply for partnership</span>
                <span className="yk-btn-arrow">→</span>
              </a>
              <a href="/platforms" className="yk-btn-ghost">
                <span>See all platforms</span>
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
  /* ═══ INTEL PAGE HEADER ═══ */
  .yk-intel-header {
    background: linear-gradient(180deg, var(--navy-deep) 0%, var(--black) 100%);
  }
  .yk-intel-header::before {
    background: radial-gradient(ellipse at center,
      rgba(74, 144, 217, 0.18) 0%,
      rgba(200, 168, 75, 0.08) 40%,
      transparent 70%) !important;
  }

  .int-section-sub {
    font-size: 18px;
    line-height: 1.7;
    color: var(--muted);
    max-width: 720px;
    margin-bottom: 80px;
  }

  /* ═══ DEMO CARD ═══ */
  .int-demo { background: var(--black); }
  .int-demo-card {
    background: var(--black-soft);
    border: 1px solid var(--line-strong);
    padding: 40px;
    position: relative;
    box-shadow: 0 30px 80px rgba(0,0,0,0.5);
    overflow: hidden;
  }
  .int-demo-card::before {
    content: ''; position: absolute;
    top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, var(--electric), var(--gold), var(--electric));
    background-size: 200% 100%;
    animation: int-gradient-shift 4s ease infinite;
  }
  @keyframes int-gradient-shift {
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
    flex-wrap: wrap; gap: 12px;
  }
  .yk-demo-meta-left {
    display: flex; align-items: center; gap: 8px;
    color: var(--gold);
  }
  .yk-demo-dot {
    width: 8px; height: 8px;
    background: var(--gold);
    border-radius: 50%;
    animation: yk-dot-pulse 2s ease-in-out infinite;
  }
  .yk-demo-pulse {
    width: 6px; height: 6px;
    background: var(--electric);
    border-radius: 50%;
    box-shadow: 0 0 12px var(--electric);
    animation: yk-dot-pulse 1.5s ease-in-out infinite;
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
  .int-demo-assessment {
    font-size: 16px;
    line-height: 1.7;
    color: var(--cream);
    font-style: italic;
    font-family: var(--font-display);
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
  .int-demo-stamp {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.2em;
    color: var(--electric);
    text-transform: uppercase;
  }

  /* ═══ ROI CALCULATOR ═══ */
  .int-roi {
    background: linear-gradient(180deg, var(--black) 0%, var(--navy-deep) 100%);
  }
  .int-roi-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    margin-top: 40px;
  }
  .int-roi-inputs {
    padding: 40px;
    background: rgba(255,255,255,0.02);
    border: 1px solid var(--line);
  }
  .int-roi-h {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 500;
    color: var(--cream);
    margin-bottom: 16px;
  }
  .int-roi-intro {
    font-size: 14px;
    color: var(--muted);
    line-height: 1.7;
    margin-bottom: 32px;
  }
  .int-roi-field { margin-bottom: 24px; }
  .int-roi-field label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--gold);
    text-transform: uppercase;
    margin-bottom: 12px;
  }
  .int-roi-field input[type="range"] {
    width: 100%;
    -webkit-appearance: none;
    appearance: none;
    background: var(--line);
    height: 4px;
    border-radius: 2px;
    outline: none;
  }
  .int-roi-field input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px; height: 20px;
    border-radius: 50%;
    background: var(--gold);
    cursor: pointer;
    box-shadow: 0 0 12px rgba(200, 168, 75, 0.4);
  }
  .int-roi-field input[type="range"]::-moz-range-thumb {
    width: 20px; height: 20px;
    border-radius: 50%;
    background: var(--gold);
    cursor: pointer;
    border: none;
    box-shadow: 0 0 12px rgba(200, 168, 75, 0.4);
  }
  .int-roi-val {
    font-family: var(--font-display);
    font-size: 32px;
    font-weight: 500;
    color: var(--cream);
    margin-top: 12px;
  }

  .int-roi-output {
    display: flex; flex-direction: column; gap: 16px;
  }
  .int-roi-result {
    padding: 32px;
    background: rgba(255,255,255,0.02);
    border: 1px solid var(--line);
  }
  .int-result-feature {
    border-color: var(--gold);
    background: rgba(200, 168, 75, 0.05);
  }
  .int-result-lbl {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.25em;
    color: var(--muted);
    text-transform: uppercase;
    margin-bottom: 12px;
  }
  .int-result-val {
    font-family: var(--font-display);
    font-size: clamp(40px, 5vw, 64px);
    font-weight: 500;
    color: var(--cream);
    line-height: 1;
  }
  .int-result-gold { color: var(--gold); }
  .int-result-electric { color: var(--electric); }

  .int-roi-comparison {
    padding: 32px;
    background: var(--navy-deep);
    border: 2px solid var(--gold);
    margin-top: 8px;
  }
  .int-comp-h {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.25em;
    color: var(--gold);
    text-transform: uppercase;
    margin-bottom: 12px;
  }
  .int-comp-pricing {
    display: flex; align-items: baseline; gap: 8px;
    margin-bottom: 12px;
  }
  .int-comp-price {
    font-family: var(--font-display);
    font-size: 48px;
    font-weight: 500;
    color: var(--cream);
  }
  .int-comp-period {
    font-size: 16px;
    color: var(--muted);
  }
  .int-comp-roi {
    font-size: 16px;
    color: var(--cream);
  }

  @media (max-width: 900px) {
    .int-roi-grid { grid-template-columns: 1fr; }
  }

  /* ═══ TOOLS GRID ═══ */
  .int-tools-section { background: var(--black); }
  .int-tools-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .int-tool-card {
    padding: 40px;
    background: linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%);
    border: 1px solid var(--line);
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    overflow: hidden;
  }
  .int-tool-card::before {
    content: ''; position: absolute;
    top: 0; left: 0; bottom: 0; width: 3px;
    background: linear-gradient(180deg, var(--electric), var(--gold));
    transform: scaleY(0);
    transform-origin: top;
    transition: transform 0.5s;
  }
  .int-tool-card:hover {
    border-color: var(--gold);
    background: linear-gradient(180deg, rgba(200, 168, 75, 0.04) 0%, rgba(200, 168, 75, 0.01) 100%);
    transform: translateY(-3px);
  }
  .int-tool-card:hover::before { transform: scaleY(1); }

  .int-tool-meta {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 24px;
  }
  .int-tool-num {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--muted);
    letter-spacing: 0.15em;
  }
  .int-tool-icon {
    font-size: 32px;
    color: var(--gold);
  }
  .int-tool-name {
    font-family: var(--font-display);
    font-size: 36px;
    font-weight: 500;
    color: var(--cream);
    margin-bottom: 12px;
    line-height: 1.1;
  }
  .int-tool-headline {
    font-family: var(--font-display);
    font-size: 18px;
    font-style: italic;
    color: var(--gold);
    margin-bottom: 20px;
    line-height: 1.4;
  }
  .int-tool-desc {
    font-size: 14px;
    line-height: 1.7;
    color: var(--muted);
    margin-bottom: 24px;
  }
  .int-tool-section {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--line);
  }
  .int-tool-h {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.25em;
    color: var(--gold);
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .int-tool-section p {
    font-size: 13px;
    line-height: 1.6;
    color: var(--cream);
  }
  .int-tool-example {
    font-family: var(--font-mono);
    font-size: 12px !important;
    color: var(--muted) !important;
  }

  @media (max-width: 800px) {
    .int-tools-grid { grid-template-columns: 1fr; }
    .int-tool-card { padding: 32px 28px; }
  }

  /* ═══ CASE STUDY ═══ */
  .int-case-study {
    background: linear-gradient(180deg, var(--black) 0%, var(--navy-deep) 100%);
  }
  .int-cs-grid {
    display: grid;
    grid-template-columns: 1.3fr 1fr;
    gap: 60px;
    align-items: start;
  }
  .int-cs-eyebrow {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.3em;
    color: var(--gold);
    text-transform: uppercase;
    margin-bottom: 16px;
  }
  .int-cs-h2 {
    font-family: var(--font-display);
    font-size: clamp(36px, 5vw, 64px);
    font-weight: 400;
    line-height: 1;
    color: var(--cream);
    margin-bottom: 32px;
    letter-spacing: -0.02em;
  }
  .int-cs-quote {
    font-family: var(--font-display);
    font-size: clamp(28px, 3vw, 40px);
    font-style: italic;
    font-weight: 500;
    color: var(--gold);
    line-height: 1.3;
    padding: 24px 0;
    border-top: 1px solid var(--gold);
    border-bottom: 1px solid var(--gold);
    margin-bottom: 12px;
  }
  .int-cs-attribution {
    font-size: 13px;
    color: var(--muted);
    margin-bottom: 32px;
    font-family: var(--font-mono);
    letter-spacing: 0.05em;
  }
  .int-cs-body p {
    font-size: 16px;
    line-height: 1.8;
    color: var(--cream);
    margin-bottom: 16px;
  }
  .int-cs-stats {
    display: flex; gap: 32px;
    margin-top: 32px;
    padding-top: 32px;
    border-top: 1px solid var(--line);
    flex-wrap: wrap;
  }
  .int-cs-stat {
    display: flex; flex-direction: column;
  }
  .int-cs-stat-num {
    font-family: var(--font-display);
    font-size: 40px;
    font-weight: 500;
    color: var(--gold);
    line-height: 1;
  }
  .int-cs-stat-lbl {
    font-size: 11px;
    color: var(--muted);
    margin-top: 8px;
    letter-spacing: 0.05em;
  }

  .int-cs-visual-card {
    padding: 36px;
    background: rgba(255,255,255,0.02);
    border: 1px solid var(--line-strong);
    position: sticky;
    top: 100px;
  }
  .int-cs-visual-meta {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.3em;
    color: var(--gold);
    margin-bottom: 12px;
    text-transform: uppercase;
  }
  .int-cs-visual-h {
    font-family: var(--font-display);
    font-size: 32px;
    font-weight: 500;
    color: var(--cream);
    margin-bottom: 8px;
  }
  .int-cs-visual-domain {
    font-size: 13px;
    color: var(--muted);
    margin-bottom: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--line);
  }
  .int-cs-visual-features {
    display: flex; flex-direction: column; gap: 12px;
    margin-bottom: 32px;
  }
  .int-cs-feature {
    display: flex; align-items: center; gap: 12px;
    font-size: 13px;
    color: var(--cream);
  }
  .int-cs-feature-dot {
    color: var(--gold);
    font-size: 8px;
  }
  .int-cs-feature-electric {
    color: var(--electric);
    text-shadow: 0 0 8px var(--electric);
  }
  .int-cs-visual-cta {
    display: inline-block;
    color: var(--gold);
    font-size: 13px;
    font-weight: 600;
  }
  .int-cs-visual-cta:hover { color: var(--cream); }

  @media (max-width: 900px) {
    .int-cs-grid { grid-template-columns: 1fr; }
    .int-cs-visual-card { position: static; }
  }

  /* ═══ PRICING POSITION ═══ */
  .int-pricing-position { background: var(--black); }
  .int-tier-grid {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 32px;
    align-items: start;
  }
  .int-tier-included {
    padding: 40px;
    background: rgba(255,255,255,0.02);
    border: 1px solid var(--line);
  }
  .int-tier-included h3 {
    font-family: var(--font-display);
    font-size: 24px;
    font-weight: 500;
    color: var(--cream);
    margin-bottom: 24px;
    font-style: italic;
  }
  .int-tier-included ul {
    display: flex; flex-direction: column; gap: 12px;
  }
  .int-tier-included li {
    font-size: 15px;
    color: var(--cream);
    padding-left: 24px;
    position: relative;
    line-height: 1.6;
  }
  .int-tier-included li::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: var(--gold);
    font-weight: 700;
  }

  .int-tier-cta {
    padding: 40px;
    background: linear-gradient(180deg, var(--navy-deep), var(--black-soft));
    border: 2px solid var(--gold);
    text-align: center;
  }
  .int-tier-h {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.3em;
    color: var(--gold);
    text-transform: uppercase;
    margin-bottom: 24px;
  }
  .int-tier-price {
    display: flex; justify-content: center; align-items: baseline; gap: 8px;
    margin-bottom: 8px;
  }
  .int-tier-num {
    font-family: var(--font-display);
    font-size: 80px;
    font-weight: 500;
    color: var(--cream);
    line-height: 1;
  }
  .int-tier-period {
    font-size: 18px;
    color: var(--muted);
  }
  .int-tier-setup {
    font-size: 13px;
    color: var(--muted);
    margin-bottom: 32px;
    font-style: italic;
    font-family: var(--font-display);
  }
  .int-tier-note {
    font-size: 13px;
    color: var(--muted);
    line-height: 1.7;
    margin-bottom: 24px;
  }
  .int-tier-btn {
    width: 100%;
    justify-content: center;
    margin-bottom: 16px;
  }
  .int-tier-link {
    display: inline-block;
    font-size: 13px;
    color: var(--gold);
    margin-top: 8px;
  }

  @media (max-width: 800px) {
    .int-tier-grid { grid-template-columns: 1fr; }
  }

  /* ═══ FINAL CTA ═══ */
  .int-final {
    background: linear-gradient(180deg, var(--black) 0%, var(--navy-deep) 100%);
    text-align: center;
  }
  .int-final-content { max-width: 900px; margin: 0 auto; }
  .int-final-h2 {
    font-family: var(--font-display);
    font-size: clamp(48px, 7vw, 96px);
    line-height: 1;
    font-weight: 400;
    letter-spacing: -0.02em;
    color: var(--cream);
    margin-bottom: 32px;
  }
  .int-final-sub {
    font-size: 18px;
    line-height: 1.7;
    color: var(--muted);
    max-width: 640px;
    margin: 0 auto 48px;
  }
  .int-final-ctas {
    display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;
  }
`
