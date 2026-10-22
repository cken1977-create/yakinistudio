import type { Metadata } from 'next'
import { SiteShell } from '@/components/SiteShell'
import {
  CustomBuildsBand,
  FinalCta,
  FoundingStrip,
  GuidedSteps,
  PlanGrid,
  PortalTour,
  PortalWindow,
} from '@/components/site/Sections'
import { SECTIONS_CSS } from '@/components/site/content'
import {
  BILLING_NOTE,
  EXTRA_HELP_NOTE,
  FLAT_PRICING_NOTE,
  HELP_HOURS_NOTE,
  PASS_THROUGH_NOTE,
  PORTAL_LOGIN_URL,
  REFUND_RULE,
  START_URL,
} from '@/lib/pricing'

// yakini.digital home, portal first (plan approved by Clarence Kennedy, Oct 22 2026):
// hero → portal tour → plans + Partner → how guided setup works → custom builds → FAQ → final CTA.

export const metadata: Metadata = {
  title: 'Yakini · Your business, in one portal. Set up with you.',
  description:
    'Every client, text, payment and reply in one place. A real Yakini person sets up your portal with you, and stays.',
  alternates: { canonical: 'https://yakini.digital' },
}

const FAQ = [
  { q: 'Is this do-it-yourself?', a: 'No. A real Yakini person sets everything up with you and stays with you after go-live, with a help desk you can reach any time.' },
  { q: 'When am I charged?', a: `${BILLING_NOTE} The first monthly charge is 30 days after you sign up, then monthly. Cancel the monthly plan any time.` },
  { q: 'Can I get a refund?', a: REFUND_RULE },
  { q: 'What happens to help hours I don’t use?', a: `${HELP_HOURS_NOTE} ${EXTRA_HELP_NOTE}` },
  { q: 'Who owns the accounts?', a: `You do. ${PASS_THROUGH_NOTE} ${FLAT_PRICING_NOTE}` },
] as const

export default function HomePage() {
  return (
    <SiteShell>
      <style>{SECTIONS_CSS + HOME_CSS}</style>

      <header className="hh">
        <div className="hh-inner">
          <div className="hh-copy">
            <div className="yk-eyebrow">
              <span className="yk-eyebrow-dot" />
              <span>THE YAKINI PORTAL · GUIDED SETUP</span>
            </div>
            <h1 className="hh-h1">
              Your business, in one portal.
              <span className="hh-h1-gold"> Set up with you, not left to you.</span>
            </h1>
            <p className="hh-sub">
              Every client, text, payment and reply in one place. A real Yakini person sets it up with you, and stays.
            </p>
            <div className="hh-ctas">
              <a href={START_URL} className="hm-btn hm-btn-gold hh-primary">
                <span>Start your setup</span>
                <span className="yk-btn-arrow">→</span>
              </a>
              <a href="#plans" className="hm-btn hm-btn-ghost">
                <span>See plans</span>
              </a>
            </div>
            <p className="hh-signin">
              Already a customer? <a href={PORTAL_LOGIN_URL}>Sign in to your portal</a>
            </p>
            <FoundingStrip />
          </div>
          <div className="hh-visual">
            <PortalWindow />
          </div>
        </div>
      </header>

      <PortalTour />
      <PlanGrid num="02" />
      <GuidedSteps num="03" />
      <CustomBuildsBand num="04" />

      <section className="yk-section hf">
        <div className="yk-section-inner hf-inner">
          <div>
            <div className="yk-section-tag"><span className="yk-num">05</span><span>Questions</span></div>
            <h2 className="hm-h2">Good questions.<br /><span className="yk-gold yk-italic">Straight answers.</span></h2>
            <p className="hm-lead">Anything else? Email <a className="yk-gold" href="mailto:hello@yakini.digital">hello@yakini.digital</a>. A real person reads every message.</p>
          </div>
          <div className="hf-list">
            {FAQ.map((f) => (
              <details key={f.q} className="hf-item">
                <summary>{f.q}<span className="hf-icon" aria-hidden>+</span></summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <FinalCta />
    </SiteShell>
  )
}

const HOME_CSS = `
  .hh {
    position: relative; min-height: 100vh; min-height: 100svh;
    display: flex; align-items: center;
    padding: 120px 20px 72px;
    background:
      linear-gradient(90deg, rgba(10,9,8,0.92) 0%, rgba(10,9,8,0.72) 55%, rgba(10,9,8,0.55) 100%),
      linear-gradient(180deg, rgba(10,9,8,0.35) 0%, rgba(10,9,8,0.95) 100%),
      url('/yakini-apply-bg.jpg') center / cover no-repeat;
    overflow: hidden;
  }
  .hh::after {
    content: ''; position: absolute; left: 50%; bottom: -30%; transform: translateX(-50%);
    width: 1200px; height: 700px; pointer-events: none;
    background: radial-gradient(ellipse at center, rgba(200,168,75,0.14) 0%, transparent 60%);
  }
  .hh-inner {
    position: relative; z-index: 1; width: 100%; max-width: 1400px; margin: 0 auto;
    display: grid; grid-template-columns: 1fr; gap: 56px; align-items: center;
  }
  .hh-copy { animation: hh-up 0.9s cubic-bezier(0.16,1,0.3,1) both; }
  .hh-visual { display: flex; justify-content: center; animation: hh-up 1.1s 0.15s cubic-bezier(0.16,1,0.3,1) both; }
  @keyframes hh-up { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
  .hh-h1 {
    font-family: var(--font-display); font-weight: 400;
    font-size: clamp(44px, 7.2vw, 104px); line-height: 0.98; letter-spacing: -0.02em;
    color: var(--cream); max-width: 14ch; margin-bottom: 28px;
  }
  .hh-h1-gold { display: block; color: var(--gold); font-style: italic; font-size: 0.62em; line-height: 1.08; margin-top: 18px; max-width: 18ch; }
  .hh-sub { font-size: clamp(17px, 1.5vw, 21px); line-height: 1.6; color: rgba(244,241,235,0.8); max-width: 560px; }
  .hh-ctas { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 36px; }
  .hh-primary { padding: 19px 34px; font-size: 15px; }
  .hh-signin { margin-top: 18px; font-size: 14px; color: var(--muted); }
  .hh-signin a { color: var(--cream); border-bottom: 1px solid rgba(244,241,235,0.35); }
  .hh-signin a:hover { color: var(--gold); border-color: var(--gold); }
  @media (min-width: 1100px) {
    .hh { padding: 140px 32px 96px; }
    .hh-inner { grid-template-columns: 1.15fr 1fr; gap: 64px; }
  }

  /* FAQ */
  .hf { background: var(--navy-deep); border-top: 1px solid var(--line); }
  .hf-inner { display: grid; grid-template-columns: 1fr; gap: 24px; }
  .hf-list { border-top: 1px solid var(--line-strong); }
  .hf-item { border-bottom: 1px solid var(--line-strong); }
  .hf-item summary {
    list-style: none; cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 16px;
    padding: 24px 0; font-family: var(--font-display); font-size: clamp(21px, 2vw, 27px); color: var(--cream);
  }
  .hf-item summary::-webkit-details-marker { display: none; }
  .hf-icon { color: var(--gold); font-family: var(--font-body); font-size: 22px; transition: transform 0.3s; flex-shrink: 0; }
  .hf-item[open] .hf-icon { transform: rotate(45deg); }
  .hf-item p { padding: 0 0 24px; font-size: 15.5px; line-height: 1.7; color: rgba(244,241,235,0.72); max-width: 680px; }
  @media (min-width: 1000px) { .hf-inner { grid-template-columns: 0.9fr 1.1fr; gap: 80px; } }
`
