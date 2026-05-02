'use client'

import { SiteShell } from '@/components/SiteShell'

// ═════════════════════════════════════════════════════════════════════════
// YAKINI PROCESS PAGE
// File: apps/yakini.digital/app/(marketing)/process/page.tsx
//
// Editorial walkthrough of how Yakini builds platforms.
// Five phases. Real timelines. What we deliver. What founders do.
// ═════════════════════════════════════════════════════════════════════════

const PHASES = [
  {
    num: '01',
    title: 'Strategic Intake',
    subtitle: 'Understanding what we\'re actually building.',
    days: 'Day 1 · 2-3 hours',
    description: 'Most agencies ask "what do you want?" We ask "what does your business actually do?" Strategic Intake is a deep working session where we map your operations, customers, workflows, regulatory landscape, and the leverage points where AI multiplies your capability.',
    weDeliver: [
      'Strategic intake document (what we learned)',
      'Workflow map of your current operations',
      'AI leverage point identification',
      'Initial platform architecture sketch',
      'Scope and timeline alignment',
    ],
    youProvide: [
      'Honest answers about how your business actually runs',
      'Existing systems, tools, and pain points',
      'Customer journey context',
      'Industry-specific regulatory or compliance details',
    ],
    output: 'A shared understanding that we can build from. No misalignment. No surprise scope creep at week six.',
  },
  {
    num: '02',
    title: 'Architecture',
    subtitle: 'Designing the system before we touch code.',
    days: 'Days 2-4',
    description: 'Architecture is where most projects fail before they begin. We design your database schema, API surface, authentication model, AI tool integration points, and security model — on paper, before we touch code. Foundation matters more than features.',
    weDeliver: [
      'Database schema with table relationships',
      'API endpoint specification',
      'Authentication and authorization model',
      'Yakini Intelligence integration architecture',
      'Security and data ownership model',
      'Wireframes for customer-facing and admin views',
      'Tech stack confirmation',
    ],
    youProvide: [
      'Brand assets (logo, colors, typography preferences)',
      'Existing customer data structure (if migrating)',
      'Domain name (or we help you select one)',
    ],
    output: 'Complete blueprint before code is written. Architecture decisions you can review and approve before we build anything.',
  },
  {
    num: '03',
    title: 'Build',
    subtitle: 'Where the platform actually comes to life.',
    days: 'Days 5-14 (typical)',
    description: 'This is where we earn our retainer. Database deployed. APIs built. Frontend designed and developed. AI tools configured for your industry. Admin command center wired up. Customer portal styled to your brand. We build in public — you see progress daily, not at the final reveal.',
    weDeliver: [
      'Custom database deployed (independent infrastructure)',
      'All public-facing pages designed and developed',
      'Customer portal with authentication',
      'Admin command center built for your workflow',
      'Yakini Intelligence configured for your industry',
      'Email pipeline (notifications, communications)',
      'Payment integration (if applicable)',
      'Mobile-optimized responsive design',
    ],
    youProvide: [
      'Quick approval cycles on design decisions',
      'Content (we draft, you refine)',
      'Test scenarios from your real workflow',
    ],
    output: 'A working platform deployed to staging by end of week one. Live and tested by end of week two.',
  },
  {
    num: '04',
    title: 'Deploy',
    subtitle: 'Your platform goes live. You get the keys.',
    days: 'Day 15',
    description: 'Deployment day. We point your domain at your platform. Final security audit. SSL configured. Search engine indexing prepared. We onboard you to the admin dashboard and walk you through every system. End of day, the platform is yours.',
    weDeliver: [
      'Custom domain configured and live',
      'SSL certificates active',
      'Search engine submission prepared',
      'Admin onboarding session (walkthrough of every tool)',
      'Documentation for ongoing operations',
      'Direct line to your build team',
      'Backup and disaster recovery setup',
    ],
    youProvide: [
      'Time for the admin walkthrough (1-2 hours)',
      'Excitement about going live',
    ],
    output: 'A platform you own, on your domain, that you know how to operate. Same day Garland\'s TheyTowedMyCar.com went from build to live.',
  },
  {
    num: '05',
    title: 'Optimize',
    subtitle: 'The retainer earns its keep.',
    days: 'Ongoing · Monthly',
    description: 'Most agencies disappear after launch. We don\'t. The monthly retainer means we\'re building features, refining AI tools, monitoring performance, and growing the platform with you. Every Yakini platform gets better month over month — yours included.',
    weDeliver: [
      'Monthly platform improvements based on usage',
      'AI tool refinement (better outputs over time)',
      'New features as your business grows',
      'Performance monitoring and optimization',
      'Security patches and updates',
      'Content and SEO refinement',
      'Quarterly strategic reviews',
    ],
    youProvide: [
      'Feedback on what\'s working and what isn\'t',
      'New ideas as your business evolves',
      'Real customer data so AI tools improve',
    ],
    output: 'A platform that grows with you. The longer you stay, the more capable your platform becomes.',
  },
]

export default function ProcessPage() {
  return (
    <SiteShell>
      <style>{PAGE_CSS}</style>

      {/* ───── HEADER ───── */}
      <header className="yk-page-header pc-header">
        <div className="yk-page-header-inner">
          <div className="yk-eyebrow">
            <span className="yk-eyebrow-dot" />
            <span>HOW WE BUILD</span>
          </div>
          <h1 className="yk-page-h1">
            From <span className="yk-italic">strategic intake</span>
            <br />
            to live platform.
            <br />
            <span className="yk-gold">Fifteen days.</span>
          </h1>
          <p className="yk-page-sub">
            Most agencies take three months to launch a website. We deploy custom platforms in two weeks because we don't waste your time.
            Five phases. Clear deliverables. No hidden process.
            Real timelines from real Yakini builds.
          </p>

          <div className="pc-timeline">
            <div className="pc-timeline-item">
              <span className="pc-timeline-num">01</span>
              <span className="pc-timeline-label">Strategic Intake</span>
              <span className="pc-timeline-day">Day 1</span>
            </div>
            <div className="pc-timeline-line" />
            <div className="pc-timeline-item">
              <span className="pc-timeline-num">02</span>
              <span className="pc-timeline-label">Architecture</span>
              <span className="pc-timeline-day">Days 2-4</span>
            </div>
            <div className="pc-timeline-line" />
            <div className="pc-timeline-item">
              <span className="pc-timeline-num">03</span>
              <span className="pc-timeline-label">Build</span>
              <span className="pc-timeline-day">Days 5-14</span>
            </div>
            <div className="pc-timeline-line" />
            <div className="pc-timeline-item">
              <span className="pc-timeline-num">04</span>
              <span className="pc-timeline-label">Deploy</span>
              <span className="pc-timeline-day">Day 15</span>
            </div>
            <div className="pc-timeline-line" />
            <div className="pc-timeline-item pc-timeline-ongoing">
              <span className="pc-timeline-num">05</span>
              <span className="pc-timeline-label">Optimize</span>
              <span className="pc-timeline-day">Ongoing</span>
            </div>
          </div>
        </div>
      </header>

      {/* ───── PHASES ───── */}
      <section className="yk-section pc-phases">
        <div className="yk-section-inner">
          {PHASES.map((phase, i) => (
            <article key={phase.num} className="pc-phase">
              <div className="pc-phase-header">
                <div className="pc-phase-num-block">
                  <div className="pc-phase-num">{phase.num}</div>
                  <div className="pc-phase-days">{phase.days}</div>
                </div>
                <div className="pc-phase-title-block">
                  <h2 className="pc-phase-title">{phase.title}</h2>
                  <p className="pc-phase-subtitle">{phase.subtitle}</p>
                </div>
              </div>

              <p className="pc-phase-description">{phase.description}</p>

              <div className="pc-phase-grid">
                <div className="pc-phase-block">
                  <div className="pc-phase-block-h">WHAT WE DELIVER</div>
                  <ul className="pc-phase-list pc-list-deliver">
                    {phase.weDeliver.map(item => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="pc-phase-block">
                  <div className="pc-phase-block-h pc-block-you">WHAT YOU PROVIDE</div>
                  <ul className="pc-phase-list pc-list-you">
                    {phase.youProvide.map(item => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pc-phase-output">
                <div className="pc-phase-output-h">OUTCOME</div>
                <p>{phase.output}</p>
              </div>

              {i < PHASES.length - 1 && <div className="pc-phase-divider" />}
            </article>
          ))}
        </div>
      </section>

      {/* ───── WHAT MAKES US DIFFERENT ───── */}
      <section className="yk-section pc-different">
        <div className="yk-section-inner">
          <div className="yk-section-tag">
            <span className="yk-num">02</span>
            <span>Why This Works</span>
          </div>
          <h2 className="yk-section-h2">
            What makes our process
            <br />
            <span className="yk-italic">actually different.</span>
          </h2>

          <div className="pc-different-grid">
            {DIFFERENCES.map((d, i) => (
              <div key={d.title} className="pc-different-card">
                <div className="pc-different-num">{String(i + 1).padStart(2, '0')}</div>
                <h3 className="pc-different-title">{d.title}</h3>
                <p className="pc-different-desc">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── THE CONTRACT ───── */}
      <section className="yk-section pc-contract">
        <div className="yk-section-inner">
          <div className="pc-contract-card">
            <div className="pc-contract-meta">
              <span className="pc-contract-dot" />
              <span>OUR PROMISE TO YOU</span>
            </div>
            <h2 className="pc-contract-h">
              Every Yakini build comes with
              <br />
              <span className="yk-italic">three guarantees.</span>
            </h2>

            <div className="pc-guarantees">
              <div className="pc-guarantee">
                <div className="pc-guarantee-num">1.</div>
                <div className="pc-guarantee-content">
                  <h4>You own everything.</h4>
                  <p>Your domain, your data, your codebase, your AI configurations. If you choose to leave Yakini, we hand off the entire platform. We work for founders who own their infrastructure — not against them.</p>
                </div>
              </div>

              <div className="pc-guarantee">
                <div className="pc-guarantee-num">2.</div>
                <div className="pc-guarantee-content">
                  <h4>No surprise scope creep.</h4>
                  <p>The architecture phase locks scope before code is written. If we discover something mid-build that requires re-scoping, we pause and have an honest conversation about it. We don't bury surprise costs in invoices.</p>
                </div>
              </div>

              <div className="pc-guarantee">
                <div className="pc-guarantee-num">3.</div>
                <div className="pc-guarantee-content">
                  <h4>Real deadlines, real platforms.</h4>
                  <p>If we say Day 15, we mean Day 15. Garland's TheyTowedMyCar.com platform was built and live in one continuous session. That kind of velocity is what custom infrastructure looks like when you're working with builders, not committee designers.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── FINAL CTA ───── */}
      <section className="yk-section pc-final">
        <div className="yk-section-inner">
          <div className="pc-final-content">
            <div className="yk-eyebrow">
              <span className="yk-eyebrow-dot" />
              <span>READY TO START?</span>
            </div>
            <h2 className="pc-final-h2">
              Apply for partnership.
              <br />
              <span className="yk-italic">We'll book your</span>
              <br />
              <span className="yk-gold">strategic intake.</span>
            </h2>
            <p className="pc-final-sub">
              Strategic intake is selective. We work with a handful of serious founders at a time.
              If your business is ready to be built on real infrastructure, the conversation starts with an application.
            </p>
            <div className="pc-final-ctas">
              <a href="/apply" className="yk-btn-primary">
                <span>Apply for partnership</span>
                <span className="yk-btn-arrow">→</span>
              </a>
              <a href="/pricing" className="yk-btn-ghost">
                <span>See pricing</span>
                <span className="yk-btn-arrow">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  )
}

const DIFFERENCES = [
  {
    title: 'We build, not assemble.',
    desc: 'Most agencies stitch together WordPress plugins, Webflow templates, and SaaS subscriptions. We build custom platforms with our own database, our own auth, our own AI infrastructure. Your platform is yours — not a license you rent.',
  },
  {
    title: 'AI is foundational, not bolted on.',
    desc: 'Yakini Intelligence is woven into the architecture from Day 2. Other agencies talk about adding AI to your existing site as an afterthought. We design every database table and workflow around the AI capability you\'ll need.',
  },
  {
    title: 'Speed is a competitive advantage.',
    desc: 'Two-week deployment isn\'t reckless — it\'s focused. We don\'t waste your time with status meetings, internal handoffs between four departments, or three-month design exploration phases. Decisions get made fast because the right people are in the room from Day 1.',
  },
  {
    title: 'Your platform improves monthly.',
    desc: 'Other agencies treat post-launch as the end. We treat it as the beginning. Every month your platform gets better — new features, refined AI, performance improvements. The longer you stay, the more capable it becomes.',
  },
  {
    title: 'We work with founders, not committees.',
    desc: 'Strategic intake is a working session with the actual decision-maker. Not a marketing manager. Not a project coordinator. The person who has skin in the game. This eliminates the politics that make agency work slow and unpredictable.',
  },
  {
    title: 'Real outputs from Day 1.',
    desc: 'Most agencies show wireframes for two weeks before building anything. We have working code by Day 5. You can click through your platform and see real progress, not just slide decks describing what we plan to build.',
  },
]

const PAGE_CSS = `
  /* ═══ HEADER ═══ */
  .pc-header::before {
    background: radial-gradient(ellipse at center,
      rgba(200, 168, 75, 0.15) 0%,
      rgba(74, 144, 217, 0.06) 40%,
      transparent 70%) !important;
  }

  .pc-timeline {
    margin-top: 60px;
    padding-top: 40px;
    border-top: 1px solid var(--line);
    display: flex;
    align-items: center;
    gap: 0;
    overflow-x: auto;
    padding-bottom: 16px;
  }
  .pc-timeline-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    flex-shrink: 0;
    min-width: 120px;
  }
  .pc-timeline-ongoing { color: var(--electric); }
  .pc-timeline-num {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 500;
    color: var(--gold);
    font-style: italic;
    line-height: 1;
  }
  .pc-timeline-ongoing .pc-timeline-num { color: var(--electric); }
  .pc-timeline-label {
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 600;
    color: var(--cream);
    margin-top: 4px;
  }
  .pc-timeline-day {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--muted);
    letter-spacing: 0.1em;
  }
  .pc-timeline-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, var(--gold), var(--line-strong));
    min-width: 40px;
  }

  /* ═══ PHASES ═══ */
  .pc-phases { background: var(--black); }

  .pc-phase {
    margin-bottom: 80px;
    padding: 60px;
    background: rgba(255,255,255,0.02);
    border: 1px solid var(--line);
    position: relative;
  }
  .pc-phase:last-child { margin-bottom: 0; }

  .pc-phase-header {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 40px;
    margin-bottom: 32px;
    padding-bottom: 32px;
    border-bottom: 1px solid var(--line);
    align-items: start;
  }
  .pc-phase-num-block {
    border-left: 3px solid var(--gold);
    padding-left: 24px;
  }
  .pc-phase-num {
    font-family: var(--font-display);
    font-size: 80px;
    font-weight: 500;
    color: var(--gold);
    line-height: 1;
    font-style: italic;
    margin-bottom: 8px;
  }
  .pc-phase-days {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--muted);
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }
  .pc-phase-title {
    font-family: var(--font-display);
    font-size: clamp(40px, 5vw, 64px);
    font-weight: 500;
    line-height: 1;
    color: var(--cream);
    margin-bottom: 12px;
    letter-spacing: -0.02em;
  }
  .pc-phase-subtitle {
    font-family: var(--font-display);
    font-size: clamp(18px, 2vw, 24px);
    font-style: italic;
    color: var(--gold);
    line-height: 1.4;
  }

  .pc-phase-description {
    font-size: 17px;
    line-height: 1.8;
    color: var(--cream);
    margin-bottom: 40px;
    max-width: 80ch;
  }

  .pc-phase-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    margin-bottom: 40px;
  }
  .pc-phase-block-h {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.25em;
    color: var(--gold);
    margin-bottom: 16px;
    text-transform: uppercase;
  }
  .pc-block-you { color: var(--electric); }
  .pc-phase-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .pc-phase-list li {
    font-size: 14px;
    color: var(--cream);
    padding-left: 24px;
    position: relative;
    line-height: 1.6;
  }
  .pc-list-deliver li::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: var(--gold);
    font-weight: 700;
  }
  .pc-list-you li::before {
    content: '→';
    position: absolute;
    left: 0;
    color: var(--electric);
  }

  
  .pc-phase-output {
    padding: 24px;
    background: rgba(200, 168, 75, 0.05);
    border-left: 3px solid var(--gold);
  }
  .pc-phase-output-h {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.25em;
    color: var(--gold);
    margin-bottom: 8px;
    text-transform: uppercase;
  }
  .pc-phase-output p {
    font-family: var(--font-display);
    font-size: 18px;
    line-height: 1.6;
    color: var(--cream);
    font-style: italic;
  }

  @media (max-width: 800px) {
    .pc-phase { padding: 32px 24px; }
    .pc-phase-header { grid-template-columns: 1fr; gap: 16px; }
    .pc-phase-grid { grid-template-columns: 1fr; gap: 24px; }
  }

  /* ═══ DIFFERENCES ═══ */
  .pc-different {
    background: linear-gradient(180deg, var(--black) 0%, var(--navy-deep) 100%);
  }
  .pc-different-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  .pc-different-card {
    padding: 36px 32px;
    background: rgba(255,255,255,0.02);
    border: 1px solid var(--line);
    transition: all 0.3s;
  }
  .pc-different-card:hover {
    border-color: var(--gold);
    background: rgba(200, 168, 75, 0.03);
    transform: translateY(-2px);
  }
  .pc-different-num {
    font-family: var(--font-display);
    font-size: 32px;
    color: var(--muted);
    font-style: italic;
    margin-bottom: 16px;
  }
  .pc-different-title {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 500;
    color: var(--cream);
    margin-bottom: 12px;
    line-height: 1.2;
  }
  .pc-different-desc {
    font-size: 14px;
    line-height: 1.7;
    color: var(--muted);
  }

  @media (max-width: 900px) {
    .pc-different-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 600px) {
    .pc-different-grid { grid-template-columns: 1fr; }
  }

  /* ═══ CONTRACT/PROMISE ═══ */
  .pc-contract { background: var(--navy-deep); }
  .pc-contract-card {
    padding: 60px;
    background: linear-gradient(135deg, rgba(200, 168, 75, 0.08) 0%, rgba(74, 144, 217, 0.04) 100%);
    border: 2px solid var(--gold);
    max-width: 1100px;
    margin: 0 auto;
  }
  .pc-contract-meta {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 6px 14px;
    border: 1px solid var(--gold);
    color: var(--gold);
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.25em;
    margin-bottom: 32px;
    text-transform: uppercase;
  }
  .pc-contract-dot {
    width: 6px; height: 6px;
    background: var(--gold);
    border-radius: 50%;
    animation: yk-dot-pulse 2s ease-in-out infinite;
  }
  .pc-contract-h {
    font-family: var(--font-display);
    font-size: clamp(36px, 5vw, 56px);
    font-weight: 500;
    line-height: 1.1;
    color: var(--cream);
    margin-bottom: 48px;
    letter-spacing: -0.02em;
  }

  .pc-guarantees {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }
  .pc-guarantee {
    display: grid;
    grid-template-columns: 80px 1fr;
    gap: 24px;
    padding: 24px 0;
    border-top: 1px solid var(--line);
  }
  .pc-guarantee-num {
    font-family: var(--font-display);
    font-size: 56px;
    font-weight: 500;
    color: var(--gold);
    line-height: 1;
    font-style: italic;
  }
  .pc-guarantee-content h4 {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 500;
    color: var(--cream);
    margin-bottom: 12px;
    line-height: 1.2;
  }
  .pc-guarantee-content p {
    font-size: 15px;
    line-height: 1.8;
    color: var(--cream);
  }

  @media (max-width: 700px) {
    .pc-contract-card { padding: 40px 28px; }
    .pc-guarantee { grid-template-columns: 60px 1fr; gap: 16px; }
    .pc-guarantee-num { font-size: 40px; }
  }

  /* ═══ FINAL CTA ═══ */
  .pc-final {
    background: linear-gradient(180deg, var(--navy-deep) 0%, var(--black) 100%);
    text-align: center;
  }
  .pc-final-content { max-width: 900px; margin: 0 auto; }
  .pc-final-h2 {
    font-family: var(--font-display);
    font-size: clamp(48px, 7vw, 96px);
    line-height: 1;
    font-weight: 400;
    letter-spacing: -0.02em;
    color: var(--cream);
    margin-bottom: 32px;
  }
  .pc-final-sub {
    font-size: 18px;
    line-height: 1.7;
    color: var(--muted);
    max-width: 640px;
    margin: 0 auto 48px;
  }
  .pc-final-ctas {
    display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;
  }
`
