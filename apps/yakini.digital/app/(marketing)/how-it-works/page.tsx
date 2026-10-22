import type { Metadata } from 'next'
import { SiteShell } from '@/components/SiteShell'
import { FinalCta, GuidedSteps } from '@/components/site/Sections'
import { BOOK_CALL_URL, BUILD_STEPS, SECTIONS_CSS } from '@/components/site/content'
import {
  AI_LIMIT_NOTE,
  BILLING_NOTE,
  EXTRA_HELP_NOTE,
  FLAT_PRICING_NOTE,
  HELP_HOURS_NOTE,
  PASS_THROUGH_NOTE,
  REFUND_RULE,
  START_URL,
} from '@/lib/pricing'

export const metadata: Metadata = {
  title: 'How it works · Yakini guided setup',
  description: 'Sign up, a kickoff call, we set it up with you, you go live, and your Yakini person stays. Plus how custom builds work.',
}

const PROVIDE = [
  'Your business name and how to reach you',
  'Your logo and brand colour, if you have them (you can send them later)',
  'Your website address, if you already have one',
  'About 30 minutes for the kickoff call',
  'Quick OKs as each piece is set up',
] as const

const FINE_PRINT = [
  { h: 'Paying', p: BILLING_NOTE },
  { h: 'Refunds', p: REFUND_RULE },
  { h: 'Help hours', p: `${HELP_HOURS_NOTE} ${EXTRA_HELP_NOTE}` },
  { h: 'Drafted replies', p: AI_LIMIT_NOTE },
  { h: 'Your accounts', p: `${PASS_THROUGH_NOTE} ${FLAT_PRICING_NOTE}` },
] as const


export default function HowItWorksPage() {
  return (
    <SiteShell>
      <style>{SECTIONS_CSS + PAGE_CSS}</style>

      <header className="yk-page-header hw-header">
        <div className="yk-page-header-inner">
          <div className="yk-eyebrow"><span className="yk-eyebrow-dot" /><span>HOW IT WORKS</span></div>
          <h1 className="yk-page-h1 hw-h1">
            Guided setup,
            <br />
            <span className="yk-gold yk-italic">step by step.</span>
          </h1>
          <p className="yk-page-sub">
            No do-it-yourself setup and no manual to figure out. A real Yakini person sets up your portal with you,
            in your business&apos;s name, and stays on after go-live.
          </p>
          <div className="hm-ctas">
            <a href={START_URL} className="hm-btn hm-btn-gold"><span>Start your setup</span><span className="yk-btn-arrow">→</span></a>
            <a href="/pricing" className="hm-btn hm-btn-ghost"><span>See plans</span></a>
          </div>
        </div>
      </header>

      <GuidedSteps num="01" />

      <section className="yk-section hw-provide">
        <div className="yk-section-inner hw-two">
          <div>
            <div className="yk-section-tag"><span className="yk-num">02</span><span>What you bring</span></div>
            <h2 className="hm-h2">Not much.<br /><span className="yk-gold yk-italic">We handle the rest.</span></h2>
            <p className="hm-lead">You know your business. We know the setup. Together, it goes quickly.</p>
          </div>
          <ul className="hw-list">
            {PROVIDE.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </div>
      </section>

      <section className="yk-section hw-fine">
        <div className="yk-section-inner">
          <div className="yk-section-tag"><span className="yk-num">03</span><span>The fine print</span></div>
          <h2 className="hm-h2">In plain words.</h2>
          <div className="hw-fine-grid">
            {FINE_PRINT.map((f) => (
              <div key={f.h} className="hw-fine-item">
                <h3>{f.h}</h3>
                <p>{f.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="yk-section hw-builds">
        <div className="yk-section-inner">
          <div className="yk-section-tag"><span className="yk-num">04</span><span>Custom builds</span></div>
          <h2 className="hm-h2">Custom builds<br /><span className="yk-gold yk-italic">work a little differently.</span></h2>
          <p className="hm-lead">For a lead engine, a payment and accounting system, or anything built around your business.</p>
          <ol className="hw-build-steps">
            {BUILD_STEPS.map((s, i) => (
              <li key={s.t}>
                <span className="hw-bnum">{String(i + 1).padStart(2, '0')}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </li>
            ))}
          </ol>
          <div className="hm-ctas">
            <a href={BOOK_CALL_URL} className="hm-btn hm-btn-gold"><span>Book a call</span><span className="yk-btn-arrow">→</span></a>
            <a href="/custom-builds" className="hm-btn hm-btn-ghost"><span>See custom builds</span></a>
          </div>
        </div>
      </section>

      <FinalCta />
    </SiteShell>
  )
}

const PAGE_CSS = `
  .hw-header {
    background: linear-gradient(180deg, rgba(10,9,8,0.6) 0%, rgba(10,9,8,0.92) 100%), url('/yakini-process-bg.jpg') center / cover no-repeat;
  }
  .hw-h1 { max-width: 12ch; }
  .hw-provide { background: var(--navy-deep); border-top: 1px solid var(--line); }
  .hw-two { display: grid; grid-template-columns: 1fr; gap: 32px; align-items: center; }
  .hw-list { border-top: 1px solid var(--line-strong); }
  .hw-list li { position: relative; padding: 20px 0 20px 34px; border-bottom: 1px solid var(--line-strong); font-size: 17px; color: var(--cream); }
  .hw-list li::before { content: '✓'; position: absolute; left: 0; color: var(--gold); }
  @media (min-width: 1000px) { .hw-two { grid-template-columns: 1fr 1fr; gap: 80px; } }

  .hw-fine { background: var(--black-soft); border-top: 1px solid var(--line); }
  .hw-fine-grid { display: grid; grid-template-columns: 1fr; gap: 1px; background: var(--line); border: 1px solid var(--line); }
  .hw-fine-item { background: var(--black-soft); padding: 28px 26px; }
  .hw-fine-item h3 { font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 10px; font-weight: 600; }
  .hw-fine-item p { font-size: 15px; line-height: 1.65; color: rgba(244,241,235,0.75); }
  @media (min-width: 800px) { .hw-fine-grid { grid-template-columns: 1fr 1fr; } }
  @media (min-width: 1200px) { .hw-fine-grid { grid-template-columns: repeat(3, 1fr); } }

  .hw-builds {
    background: linear-gradient(180deg, rgba(6,5,4,0.9), rgba(10,9,8,0.95)), url('/yakini-services-bg.jpg') center / cover no-repeat;
    border-top: 1px solid rgba(200,168,75,0.35);
  }
  .hw-build-steps { display: grid; grid-template-columns: 1fr; gap: 16px; }
  .hw-build-steps li { border: 1px solid rgba(200,168,75,0.3); background: rgba(10,9,8,0.7); padding: 28px 24px; }
  .hw-bnum { font-family: var(--font-display); font-style: italic; font-size: 26px; color: var(--gold); }
  .hw-build-steps h3 { font-family: var(--font-display); font-weight: 500; font-size: 26px; color: var(--cream); margin: 12px 0 8px; line-height: 1.15; }
  .hw-build-steps p { font-size: 15px; line-height: 1.6; color: rgba(244,241,235,0.72); }
  @media (min-width: 800px) { .hw-build-steps { grid-template-columns: 1fr 1fr; } }
  @media (min-width: 1200px) { .hw-build-steps { grid-template-columns: repeat(4, 1fr); } }
`
