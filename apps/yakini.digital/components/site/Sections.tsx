'use client'

// Shared marketing sections for yakini.digital (home, /pricing, /how-it-works, /custom-builds).
// Prices, plan contents and policy wording come only from lib/pricing.ts.
// Customer-facing copy names services, never the companies behind them.

import { SeatMeter, useFoundingSeats } from '@/components/FoundingSeats'
import { BOOK_CALL_URL, BUILDS, TOUR } from '@/components/site/content'
import {
  AI_LIMIT_NOTE,
  EXTRA_HELP_NOTE,
  FLAT_PRICING_NOTE,
  FOUNDING,
  GUIDED_STEPS,
  HELP_HOURS_NOTE,
  PLANS,
  REFUND_RULE,
  START_URL,
  helpLabel,
  monthlyLabel,
  priceLabel,
  setupLabel,
  startUrl,
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
          <a href={START_URL} className="hm-btn hm-btn-gold"><span>Start your setup</span><span className="yk-btn-arrow">→</span></a>
          <a href="/pricing" className="hm-btn hm-btn-ghost"><span>Compare plans</span></a>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── Plans (from lib/pricing.ts) ───────────────────────── */

export function PlanGrid({ num = '02' }: { num?: string }) {
  const seats = useFoundingSeats()
  return (
    <section id="plans" className="yk-section hm-plans">
      <div className="yk-section-inner">
        <div className="yk-section-tag"><span className="yk-num">{num}</span><span>Plans</span></div>
        <h2 className="hm-h2">
          Done with you,
          <br />
          <span className="yk-gold yk-italic">not left to you.</span>
        </h2>
        <p className="hm-lead">One-time guided setup, then a flat monthly plan. A real Yakini person sets it up with you, and the help desk stays open after go-live.</p>

        <div className="hm-plan-grid">
          {PLANS.map((plan) => {
            const isFounding = plan.id === 'founding'
            const closed = isFounding && !seats.open
            return (
              <article key={plan.id} className={`hm-plan ${isFounding ? 'hm-plan-founding' : ''} ${plan.id === 'grow' ? 'hm-plan-grow' : ''}`}>
                <div className="hm-plan-tag">{plan.tag}</div>
                <h3 className="hm-plan-name">{plan.name}</h3>
                <p className="hm-plan-sum">{plan.summary}</p>
                <div className="hm-plan-price">
                  <span className="hm-plan-num">{monthlyLabel(plan).replace('/mo', '')}</span>
                  <span className="hm-plan-per">/month</span>
                </div>
                <div className="hm-plan-setup">+ {setupLabel(plan)} one-time guided setup{plan.lockedMonths ? ` · locked ${plan.lockedMonths} months` : ''}</div>
                {isFounding ? <SeatMeter seats={seats} /> : null}
                <ul className="hm-plan-list">
                  <li>{helpLabel(plan)} from your Yakini person</li>
                  {plan.id === 'grow' ? (
                    <>
                      <li>Everything in Operate</li>
                      <li>Card payments on your invoices</li>
                      <li>Missed-call text-back, review requests and follow-up campaigns</li>
                      <li>Monthly owner report</li>
                    </>
                  ) : (
                    <>
                      <li>Your website and customer portal</li>
                      <li>Help desk, texting line and booking you confirm</li>
                      <li>Drafted replies, checked by you before anything goes out</li>
                    </>
                  )}
                </ul>
                {closed ? (
                  <span className="hm-btn hm-btn-off">Founding is closed</span>
                ) : (
                  <a href={startUrl(plan.id)} className={`hm-btn ${isFounding || plan.id === 'grow' ? 'hm-btn-gold' : 'hm-btn-ghost'}`}>
                    <span>Start with {plan.name}</span><span className="yk-btn-arrow">→</span>
                  </a>
                )}
              </article>
            )
          })}
        </div>

        <ul className="hm-policy">
          <li><strong>Refunds.</strong> {REFUND_RULE}</li>
          <li><strong>Help hours.</strong> {HELP_HOURS_NOTE} {EXTRA_HELP_NOTE}</li>
          <li><strong>Flat.</strong> {FLAT_PRICING_NOTE}</li>
        </ul>
        <a href="/pricing" className="hm-textlink">See everything each plan includes, side by side →</a>
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
        <p className="hm-builds-note">Quoted in writing before anything starts. Custom builds are never priced on a page, because every one is built around your business.</p>
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
          <a href={START_URL} className="hm-btn hm-btn-gold"><span>Start your setup</span><span className="yk-btn-arrow">→</span></a>
          <a href={BOOK_CALL_URL} className="hm-btn hm-btn-ghost"><span>Book a call about a custom build</span></a>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── Founding strip (hero) ───────────────────────── */

export function FoundingStrip() {
  const seats = useFoundingSeats()
  if (!seats.open) return null
  return (
    <a href={startUrl(FOUNDING.id)} className="hm-founding">
      <span className="hm-founding-dot" aria-hidden />
      <span>
        <strong>Founding:</strong> {priceLabel(FOUNDING)}, locked {FOUNDING.lockedMonths} months.{' '}
        <strong>{seats.left} of {seats.total}</strong> spots left
      </span>
      <span className="yk-btn-arrow">→</span>
    </a>
  )
}


