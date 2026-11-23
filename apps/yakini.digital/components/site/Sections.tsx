'use client'

// Shared marketing sections for yakini.digital (home, /pricing, /how-it-works, /custom-builds).
// Prices, plan contents and policy wording come only from lib/pricing.ts.
// Customer-facing copy names services, never the companies behind them.

import Link from 'next/link'
import { BOOK_CALL_URL, BUILDS, TOUR } from '@/components/site/content'
import {
  AI_LIMIT_NOTE,
  BUILD_URL,
  DASHBOARD_NOTE,
  EXTRA_HELP_NOTE,
  FLAT_PRICING_NOTE,
  GUIDED_STEPS,
  HEADLINE,
  HELP_HOURS_NOTE,
  KIT_INCLUDES,
  REFUND_RULE,
  TUTORIAL_NOTE,
} from '@/lib/pricing'


/* ───────────────────────── Portal window (illustration, sample data) ───────────────────────── */

export function PortalWindow() {
  return (
    <figure className="pw" aria-label="Sample view of a Yakini portal">
      <div className="pw-bar">
        <span className="pw-dots" aria-hidden><i /><i /><i /></span>
        <span className="pw-title">Your portal</span>
        <span className="pw-sample">Sample view</span>
      </div>
      <div className="pw-body">
        <aside className="pw-rooms" aria-hidden>
          <div className="pw-rooms-h">Client rooms</div>
          <div className="pw-room pw-room-on"><span className="pw-av">M</span><span>Maya&apos;s room</span><b /></div>
          <div className="pw-room"><span className="pw-av">J</span><span>Jordan&apos;s room</span></div>
          <div className="pw-room"><span className="pw-av">R</span><span>Rivera family</span></div>
          <div className="pw-rooms-h pw-rooms-h2">Help desk</div>
          <div className="pw-room"><span className="pw-av pw-av-gold">Y</span><span>Your Yakini person</span></div>
        </aside>
        <div className="pw-thread">
          <div className="pw-msg pw-in">
            <span className="pw-chan">Text</span>
            Hi! Can we move Thursday to 3pm?
          </div>
          <div className="pw-book">
            <span>Booking request · Thursday, 3:00 PM</span>
            <span className="pw-chip">Confirm</span>
          </div>
          <div className="pw-draft">
            <div className="pw-draft-h">Drafted for you · waiting for your OK</div>
            <p>Of course. Thursday at 3:00 works. See you then!</p>
            <div className="pw-draft-actions">
              <span className="pw-btn pw-btn-gold">Approve &amp; send</span>
              <span className="pw-btn">Edit</span>
            </div>
          </div>
        </div>
      </div>
    </figure>
  )
}

/* ───────────────────────── Portal tour ───────────────────────── */


export function PortalTour({ num = '01' }: { num?: string }) {
  return (
    <section id="portal" className="yk-section hm-tour">
      <div className="yk-section-inner">
        <div className="yk-section-tag"><span className="yk-num">{num}</span><span>Inside your portal</span></div>
        <h2 className="hm-h2">
          One place for the whole business.
          <br />
          <span className="yk-gold yk-italic">Built around your clients.</span>
        </h2>
        <p className="hm-lead">
          The Yakini portal is your business workspace. Your clients, your texts, your payments and your replies all live in one calm place,
          set up in your business&apos;s name.
        </p>
        <div className="hm-tour-grid">
          {TOUR.map((t) => (
            <article key={t.k} className="hm-tour-card">
              <div className="hm-tour-top">
                <span className="hm-tour-k">{t.k}</span>
                {'tag' in t ? <span className="hm-tour-tag">{t.tag}</span> : null}
              </div>
              <h3>{t.title}</h3>
              <p>{t.body}</p>
            </article>
          ))}
        </div>
        <p className="hm-fine">{AI_LIMIT_NOTE}</p>
        <div className="hm-ctas">
          <a href={BUILD_URL} className="hm-btn hm-btn-gold"><span>Build my estimate</span><span className="yk-btn-arrow">→</span></a>
          <a href="/pricing" className="hm-btn hm-btn-ghost"><span>See pricing</span></a>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── Plans (from lib/pricing.ts) ───────────────────────── */

export function PlanGrid({ num = '02' }: { num?: string }) {
  return (
    <section id="plans" className="yk-section hm-plans">
      <div className="yk-section-inner">
        <div className="yk-section-tag"><span className="yk-num">{num}</span><span>Pricing</span></div>
        <h2 className="hm-h2">
          {HEADLINE.split('.')[0]}.
          <br />
          <span className="yk-gold yk-italic">{HEADLINE.split('. ')[1]}</span>
        </h2>
        <p className="hm-lead">{DASHBOARD_NOTE} {TUTORIAL_NOTE}</p>
        <ul className="hm-plan-list" style={{ maxWidth: 720, margin: '20px 0 28px' }}>
          {KIT_INCLUDES.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <div className="hm-ctas">
          <a href={BUILD_URL} className="hm-btn hm-btn-gold"><span>Build my estimate</span><span className="yk-btn-arrow">→</span></a>
          <a href="/pricing" className="hm-btn hm-btn-ghost"><span>See all prices</span></a>
        </div>
        <ul className="hm-policy">
          <li><strong>Estimates.</strong> Totals on the pricing page are estimates. The written quote is final.</li>
          <li><strong>Refunds.</strong> {REFUND_RULE}</li>
          <li><strong>Help hours.</strong> {HELP_HOURS_NOTE} {EXTRA_HELP_NOTE}</li>
          <li><strong>In writing.</strong> {FLAT_PRICING_NOTE}</li>
        </ul>
        <a href="/pricing" className="hm-textlink">Build your estimate and see every price →</a>
      </div>
    </section>
  )
}

/* ───────────────────────── How guided setup works ───────────────────────── */

export function GuidedSteps({ num = '03', heading = true }: { num?: string; heading?: boolean }) {
  return (
    <section id="how" className="yk-section hm-steps">
      <div className="yk-section-inner">
        {heading ? (
          <>
            <div className="yk-section-tag"><span className="yk-num">{num}</span><span>How guided setup works</span></div>
            <h2 className="hm-h2">
              Four steps.
              <br />
              <span className="yk-gold yk-italic">One real person, the whole way.</span>
            </h2>
          </>
        ) : null}
        <ol className="hm-step-list">
          {GUIDED_STEPS.map((step, i) => (
            <li key={step.title} className="hm-step">
              <span className="hm-step-num">{String(i + 1).padStart(2, '0')}</span>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
            </li>
          ))}
        </ol>
        <p className="hm-own">Everything is set up in your business&apos;s name, so it stays yours.</p>
      </div>
    </section>
  )
}

/* ───────────────────────── Custom builds (premium second lane) ───────────────────────── */



export function CustomBuildsBand({ num = '04', showPageLink = true }: { num?: string; showPageLink?: boolean }) {
  return (
    <section id="custom-builds" className="hm-builds">
      <div className="hm-builds-inner">
        <div className="yk-section-tag"><span className="yk-num">{num}</span><span>Custom builds</span></div>
        <h2 className="hm-h2 hm-builds-h2">
          When you need more than a portal,
          <br />
          <span className="yk-gold yk-italic">we build it. And we stay.</span>
        </h2>
        <p className="hm-lead">
          For businesses that need a system built around them. Most builders hand over the keys and walk away. We launch it,
          then stay on to run it with you.
        </p>
        <div className="hm-build-grid">
          {BUILDS.map((b) => (
            <article key={b.id} className="hm-build">
              <div className="hm-build-label">{b.label}</div>
              <h3>{b.title}</h3>
              <ul>
                {b.points.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </article>
          ))}
        </div>
        <p className="hm-builds-note">Custom system builds start from $7,500 and are quoted in writing before anything starts, because every one is built around your business.</p>
        <div className="hm-ctas">
          <a href={BOOK_CALL_URL} className="hm-btn hm-btn-gold"><span>Book a call</span><span className="yk-btn-arrow">→</span></a>
          {showPageLink ? <a href="/custom-builds" className="hm-btn hm-btn-ghost"><span>See custom builds</span></a> : null}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── Final CTA ───────────────────────── */

export function FinalCta({ line = 'Start your setup and a real Yakini person takes it from there, with you.' }: { line?: string }) {
  return (
    <section className="hm-final">
      <div className="hm-final-inner">
        <h2 className="hm-final-h2">
          Ready when
          <br />
          <span className="yk-gold yk-italic">you are.</span>
        </h2>
        <p className="hm-final-sub">{line}</p>
        <div className="hm-ctas hm-ctas-center">
          <a href={BUILD_URL} className="hm-btn hm-btn-gold"><span>Build my estimate</span><span className="yk-btn-arrow">→</span></a>
          <a href={BOOK_CALL_URL} className="hm-btn hm-btn-ghost"><span>Book a call about a custom build</span></a>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── Pricing strip (hero) ───────────────────────── */

export function FoundingStrip() {
  return (
    <Link href={BUILD_URL} className="hm-founding">
      <span className="hm-founding-dot" aria-hidden />
      <span>
        <strong>{HEADLINE}</strong> Build an estimate and send it for a written quote.
      </span>
      <span className="yk-btn-arrow">→</span>
    </Link>
  )
}
