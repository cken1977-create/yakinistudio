import type { Metadata } from 'next'
import { SiteShell } from '@/components/SiteShell'
import { BOOK_CALL_URL, BUILDS, BUILD_STEPS, SECTIONS_CSS } from '@/components/site/content'
import { START_URL } from '@/lib/pricing'

// Custom builds: Yakini's premium second lane. Outcomes only: no client names, no demo numbers, never priced.

export const metadata: Metadata = {
  title: 'Custom builds · Yakini',
  description:
    'Lead engines, payment and accounting systems, and more, built around your business, quoted in writing, and run with you after launch.',
}

const DETAIL: Record<(typeof BUILDS)[number]['id'], string> = {
  'lead-engine':
    'Speed wins leads. The engine answers every missed call and new enquiry within a minute, keeps following up for a year so nobody is forgotten, and puts hot leads in front of a person with a clock running. Each month, a report shows exactly what happened.',
  payments:
    'When money runs through more than one place, it gets messy. One fee engine prices every charge the same way, payment plans run on schedule, related entities keep their own books, and the ledger only ever adds entries, so the history can always be trusted.',
}

const MORE = [
  { t: 'Client portals with your own workflow', d: 'Your intake, your steps, your approvals, built around how your team already works.' },
  { t: 'Intake and case management', d: 'Every request captured once, tracked to the end, with nothing living in someone’s inbox.' },
  { t: 'Scheduling, dispatch and field work', d: 'Jobs, crews and customers on one board, with updates sent the moment things change.' },
  { t: 'Reporting for owners, boards and funders', d: 'The numbers you are asked for, ready when you need them, from records you already keep.' },
] as const

const WHY = [
  { t: 'We stay after launch', d: 'Most builders hand over the keys and walk away. We stay on to run it with you: watching it, fixing it, and changing it as the business grows.' },
  { t: 'Quoted in writing', d: 'A written scope and price before anything starts. Custom builds are never priced on a page, because every one is different.' },
  { t: 'In your business’s name', d: 'The accounts behind your system are set up in your business’s name, so what we build for you stays yours.' },
  { t: 'You approve what goes out', d: 'Anything that speaks to your customers can wait for your OK. You stay in control of your voice.' },
] as const

export default function CustomBuildsPage() {
  return (
    <SiteShell>
      <style>{SECTIONS_CSS + PAGE_CSS}</style>

      <header className="yk-page-header cb-header">
        <div className="yk-page-header-inner">
          <div className="yk-eyebrow"><span className="yk-eyebrow-dot" /><span>CUSTOM BUILDS · QUOTED IN WRITING</span></div>
          <h1 className="yk-page-h1 cb-h1">
            Built around your business.
            <span className="cb-h1-gold"> And run with you after launch.</span>
          </h1>
          <p className="yk-page-sub">
            Some businesses need more than a portal. We design and build the system, launch it, and stay on to run it with you.
            Every build is scoped and quoted in writing before anything starts.
          </p>
          <div className="hm-ctas">
            <a href={BOOK_CALL_URL} className="hm-btn hm-btn-gold"><span>Book a call</span><span className="yk-btn-arrow">→</span></a>
            <a href="#how" className="hm-btn hm-btn-ghost"><span>How a build runs</span></a>
          </div>
        </div>
      </header>

      <section className="yk-section cb-builds">
        <div className="yk-section-inner">
          <div className="yk-section-tag"><span className="yk-num">01</span><span>What we build</span></div>
          <h2 className="hm-h2">Systems that do the work,<br /><span className="yk-gold yk-italic">and prove it.</span></h2>
          <div className="cb-build-list">
            {BUILDS.map((b) => (
              <article key={b.id} id={b.id} className="cb-build">
                <div className="cb-build-head">
                  <div className="hm-build-label">{b.label}</div>
                  <h3>{b.title}</h3>
                  <p>{DETAIL[b.id]}</p>
                </div>
                <ul className="cb-points">
                  {b.points.map((p) => <li key={p}>{p}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="yk-section cb-more">
        <div className="yk-section-inner">
          <div className="yk-section-tag"><span className="yk-num">02</span><span>And more</span></div>
          <h2 className="hm-h2">If the business needs it,<br /><span className="yk-gold yk-italic">we can build it.</span></h2>
          <div className="cb-more-grid">
            {MORE.map((m) => (
              <div key={m.t} className="cb-more-item">
                <h3>{m.t}</h3>
                <p>{m.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="yk-section cb-why">
        <div className="yk-section-inner">
          <div className="yk-section-tag"><span className="yk-num">03</span><span>Why Yakini</span></div>
          <h2 className="hm-h2">We don&apos;t build it and leave.<br /><span className="yk-gold yk-italic">We stay.</span></h2>
          <div className="cb-why-grid">
            {WHY.map((w, i) => (
              <div key={w.t} className="cb-why-item">
                <span className="cb-why-num">{String(i + 1).padStart(2, '0')}</span>
                <h3>{w.t}</h3>
                <p>{w.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="yk-section cb-how">
        <div className="yk-section-inner">
          <div className="yk-section-tag"><span className="yk-num">04</span><span>How a build runs</span></div>
          <h2 className="hm-h2">Four steps,<br /><span className="yk-gold yk-italic">in the open.</span></h2>
          <ol className="cb-steps">
            {BUILD_STEPS.map((s, i) => (
              <li key={s.t}>
                <span className="cb-step-num">{String(i + 1).padStart(2, '0')}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="call" className="cb-cta">
        <div className="cb-cta-inner">
          <h2 className="hm-final-h2">Tell us what<br /><span className="yk-gold yk-italic">you want built.</span></h2>
          <p className="hm-final-sub">A short form, then a real conversation with Yakini. No pressure, and a written quote before anything starts.</p>
          <div className="hm-ctas hm-ctas-center">
            <a href={BOOK_CALL_URL} className="hm-btn hm-btn-gold"><span>Book a call</span><span className="yk-btn-arrow">→</span></a>
            <a href="mailto:hello@yakini.digital" className="hm-btn hm-btn-ghost"><span>Email hello@yakini.digital</span></a>
          </div>
          <p className="cb-portal-note">Looking for the portal instead? <a href={START_URL}>Start your setup →</a></p>
        </div>
      </section>
    </SiteShell>
  )
}

const PAGE_CSS = `
  .cb-header {
    min-height: 88vh; display: flex; align-items: flex-end;
    background: linear-gradient(180deg, rgba(10,9,8,0.45) 0%, rgba(10,9,8,0.94) 100%), url('/yakini-services-bg.jpg') center / cover no-repeat;
  }
  .cb-header .yk-page-header-inner { width: 100%; }
  .cb-h1 { max-width: 15ch; }
  .cb-h1-gold { display: block; color: var(--gold); font-style: italic; font-size: 0.55em; line-height: 1.1; margin-top: 18px; }
  .cb-builds { background: var(--navy-deep); }
  .cb-build-list { display: grid; gap: 20px; }
  .cb-build {
    display: grid; grid-template-columns: 1fr; gap: 28px;
    padding: 40px 28px; border: 1px solid rgba(200,168,75,0.35);
    background: linear-gradient(135deg, rgba(200,168,75,0.07), rgba(255,255,255,0.01));
  }
  .cb-build h3 { font-family: var(--font-display); font-weight: 400; font-size: clamp(32px, 4vw, 52px); line-height: 1.05; color: var(--cream); margin-bottom: 18px; }
  .cb-build-head p { font-size: 16.5px; line-height: 1.7; color: rgba(244,241,235,0.75); max-width: 560px; }
  .cb-points { border-top: 1px solid var(--line-strong); align-self: center; }
  .cb-points li { position: relative; padding: 18px 0 18px 30px; border-bottom: 1px solid var(--line-strong); font-size: 17px; color: var(--cream); }
  .cb-points li::before { content: '→'; position: absolute; left: 0; color: var(--gold); }
  @media (min-width: 1000px) { .cb-build { grid-template-columns: 1.1fr 1fr; gap: 64px; padding: 56px 48px; } }

  .cb-more { background: var(--black-soft); border-top: 1px solid var(--line); }
  .cb-more-grid { display: grid; grid-template-columns: 1fr; gap: 1px; background: var(--line); border: 1px solid var(--line); }
  .cb-more-item { background: var(--black-soft); padding: 30px 26px; }
  .cb-more-item h3 { font-family: var(--font-display); font-weight: 500; font-size: 26px; line-height: 1.15; color: var(--cream); margin-bottom: 10px; }
  .cb-more-item p { font-size: 15px; line-height: 1.6; color: rgba(244,241,235,0.7); }
  @media (min-width: 800px) { .cb-more-grid { grid-template-columns: 1fr 1fr; } }

  .cb-why { background: var(--navy-deep); border-top: 1px solid var(--line); }
  .cb-why-grid { display: grid; grid-template-columns: 1fr; gap: 28px; }
  .cb-why-item { border-top: 1px solid var(--gold); padding-top: 22px; }
  .cb-why-num { font-family: var(--font-display); font-style: italic; font-size: 24px; color: var(--gold); }
  .cb-why-item h3 { font-family: var(--font-display); font-weight: 500; font-size: 26px; color: var(--cream); margin: 10px 0 8px; line-height: 1.15; }
  .cb-why-item p { font-size: 15px; line-height: 1.65; color: rgba(244,241,235,0.72); }
  @media (min-width: 800px) { .cb-why-grid { grid-template-columns: 1fr 1fr; gap: 40px; } }
  @media (min-width: 1200px) { .cb-why-grid { grid-template-columns: repeat(4, 1fr); } }

  .cb-how { background: linear-gradient(180deg, var(--black-soft), var(--navy-deep)); border-top: 1px solid var(--line); }
  .cb-steps { display: grid; grid-template-columns: 1fr; gap: 16px; }
  .cb-steps li { border: 1px solid var(--line-strong); padding: 28px 24px; }
  .cb-step-num { font-family: var(--font-display); font-style: italic; font-size: 26px; color: var(--gold); }
  .cb-steps h3 { font-family: var(--font-display); font-weight: 500; font-size: 26px; color: var(--cream); margin: 12px 0 8px; line-height: 1.15; }
  .cb-steps p { font-size: 15px; line-height: 1.6; color: rgba(244,241,235,0.72); }
  @media (min-width: 800px) { .cb-steps { grid-template-columns: 1fr 1fr; } }
  @media (min-width: 1200px) { .cb-steps { grid-template-columns: repeat(4, 1fr); } }

  .cb-cta { padding: 140px 24px; text-align: center; background: radial-gradient(ellipse at center, rgba(200,168,75,0.14) 0%, transparent 60%), var(--black); border-top: 1px solid rgba(200,168,75,0.35); }
  .cb-cta-inner { max-width: 900px; margin: 0 auto; }
  .cb-portal-note { margin-top: 28px; font-size: 14px; color: var(--muted); }
  .cb-portal-note a { color: var(--gold); }
`
