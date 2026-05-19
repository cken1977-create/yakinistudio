import { config } from '@/config/brand'
import Link from 'next/link'

export default function HomePage() {
  const { business, brand, contact, home, services } = config

  return (
    <>
      {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
      <div className="topbar">
        <div className="topbar-inner">
          <div className="topbar-pulse">
            <span className="pulse-dot"></span>
            Hail Season Live · Serving DFW
          </div>
          <div>
            Call us anytime ·{' '}
            <a href={home.hero.secondaryCtaLink}>{contact.phone}</a>
          </div>
        </div>
      </div>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-inner">
          <div>
            <div className="hero-eyebrow">Paintless Dent Repair · DFW</div>
            <h1 className="display hero-title">
              Hail hit your car.<br />
              We <span className="accent">handle</span> the rest.
            </h1>
            <p className="hero-sub">{home.hero.subheadline}</p>
            <div className="hero-ctas">
              <Link href={home.hero.ctaLink} className="btn btn-primary">
                {home.hero.cta}
                <span className="btn-arrow">→</span>
              </Link>
              <a href={home.hero.secondaryCtaLink} className="btn btn-secondary">
                {home.hero.secondaryCta}
              </a>
            </div>
            <div className="hero-trust">
              <div className="trust-item">
                <div className="trust-num">
                  <span className="signal-mark">$</span>0
                </div>
                <div className="trust-label">Out of pocket</div>
              </div>
              <div className="trust-item">
                <div className="trust-num">$1,000</div>
                <div className="trust-label">Deductible covered</div>
              </div>
              <div className="trust-item">
                <div className="trust-num">∞</div>
                <div className="trust-label">Lifetime warranty</div>
              </div>
            </div>
          </div>

          {/* ── STORM CARD WITH LIGHTNING ─────────────────────────────── */}
          <div className="storm-card">
            <div className="lightning"></div>
            <div className="lightning lightning-2"></div>
            <div className="storm-card-label">
              The Hail Free Retail Advantage
            </div>
            <h3 className="storm-card-title">
              Everything you need. Nothing you have to chase.
            </h3>
            <ul className="storm-card-list">
              <li>
                <span><span className="check">✓</span> $0 out-of-pocket repair</span>
              </li>
              <li>
                <span><span className="check">✓</span> Deductible help up to $1,000</span>
              </li>
              <li>
                <span><span className="check">✓</span> Free loaner or Uber drop-off</span>
              </li>
              <li>
                <span><span className="check">✓</span> Top-rated techs · Shop tours</span>
              </li>
              <li>
                <span><span className="check">✓</span> Lifetime warranty</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── CITY TICKER ──────────────────────────────────────────────────── */}
      <div className="ticker">
        <div className="ticker-track">
          <span>
            Dallas <span className="ticker-dot">◆</span>
            Arlington <span className="ticker-dot">◆</span>
            Fort Worth <span className="ticker-dot">◆</span>
            Plano <span className="ticker-dot">◆</span>
            Irving <span className="ticker-dot">◆</span>
            Garland <span className="ticker-dot">◆</span>
            Mesquite <span className="ticker-dot">◆</span>
            Frisco <span className="ticker-dot">◆</span>
            McKinney <span className="ticker-dot">◆</span>
            Grand Prairie <span className="ticker-dot">◆</span>
          </span>
          <span>
            Dallas <span className="ticker-dot">◆</span>
            Arlington <span className="ticker-dot">◆</span>
            Fort Worth <span className="ticker-dot">◆</span>
            Plano <span className="ticker-dot">◆</span>
            Irving <span className="ticker-dot">◆</span>
            Garland <span className="ticker-dot">◆</span>
            Mesquite <span className="ticker-dot">◆</span>
            Frisco <span className="ticker-dot">◆</span>
            McKinney <span className="ticker-dot">◆</span>
            Grand Prairie <span className="ticker-dot">◆</span>
          </span>
        </div>
      </div>

      {/* ── 5 PROMISES ───────────────────────────────────────────────────── */}
      <section className="promises" id="promises">
        <div className="container">
          <div className="section-eyebrow">Five Promises</div>
          <h2 className="display section-title">
            No surprises. No runaround.{' '}
            <span className="accent">Just the fix.</span>
          </h2>
          <p className="section-lead">
            We built Hail of a Day for busy people. You shouldn&apos;t lose a
            single hour because the sky dropped ice on your car.
          </p>

          <div className="promises-grid">
            <div className="promise">
              <div className="promise-check">✓</div>
              <h3 className="promise-title">Your rates won&apos;t go up</h3>
              <p className="promise-body">
                Hail is filed under comprehensive coverage — it&apos;s an Act of
                God, not your fault. Insurers don&apos;t penalize weather claims
                the way they do collisions.
              </p>
            </div>
            <div className="promise">
              <div className="promise-check">✓</div>
              <h3 className="promise-title">We pay your deductible</h3>
              <p className="promise-body">
                Up to $1,000 covered, so you walk away with zero out-of-pocket
                cost. The repair gets done, you don&apos;t write a check.
              </p>
            </div>
            <div className="promise">
              <div className="promise-check">✓</div>
              <h3 className="promise-title">No rental? No problem</h3>
              <p className="promise-body">
                If your policy doesn&apos;t include rental coverage, we provide
                premium rental service anyway. You&apos;re not stranded —
                you&apos;re driving.
              </p>
            </div>
            <div className="promise">
              <div className="promise-check">✓</div>
              <h3 className="promise-title">We file the claim for you</h3>
              <p className="promise-body">
                We call your carrier, confirm coverage, and handle the
                paperwork. You don&apos;t sit on hold. You don&apos;t chase
                adjusters. You don&apos;t lose time.
              </p>
            </div>
            <div className="promise">
              <div className="promise-check">✓</div>
              <h3 className="promise-title">Pickup and drop-off</h3>
              <p className="promise-body">
                Hand us the keys. We come to you, repair the damage with
                paintless dent repair, and deliver your car back restored.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="how" id="how">
        <div className="container">
          <div className="section-eyebrow">The Process</div>
          <h2 className="display section-title">
            From damaged to delivered{' '}
            <span className="accent">in five steps.</span>
          </h2>
          <p className="section-lead">
            Most customers spend less than ten minutes on their phone with us.
            Then we take it from there.
          </p>

          <div className="steps">
            <div className="step">
              <div className="step-num">Step 01</div>
              <h3 className="step-title">Snap the damage</h3>
              <p className="step-body">
                Upload photos from your phone. Wide shots and close-ups of the
                worst dents.
              </p>
            </div>
            <div className="step">
              <div className="step-num">Step 02</div>
              <h3 className="step-title">We verify coverage</h3>
              <p className="step-body">
                We call your insurer, confirm your comprehensive coverage, and
                explain what&apos;s covered.
              </p>
            </div>
            <div className="step">
              <div className="step-num">Step 03</div>
              <h3 className="step-title">We pick you up</h3>
              <p className="step-body">
                Free loaner or Uber to wherever you need to be. Your car goes to
                our shop.
              </p>
            </div>
            <div className="step">
              <div className="step-num">Step 04</div>
              <h3 className="step-title">Master techs repair it</h3>
              <p className="step-body">
                Paintless dent repair preserves your factory finish. Lifetime
                warranty on every panel.
              </p>
            </div>
            <div className="step">
              <div className="step-num">Step 05</div>
              <h3 className="step-title">We deliver it back</h3>
              <p className="step-body">
                Detailed, restored, and ready. You walk out to a car that looks
                like it never met a storm.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SPECIALS ─────────────────────────────────────────────────────── */}
      <section className="specials">
        <div className="specials-inner">
          <div>
            <div className="section-eyebrow">Specials</div>
            <h2>
              <span className="accent">Money back</span> in your pocket, just
              for stopping by.
            </h2>
          </div>
          <div className="specials-grid">
            <div className="special">
              <div className="special-amount">$100</div>
              <div className="special-label">
                Take a tour of our shop. See the work before you commit.
              </div>
            </div>
            <div className="special">
              <div className="special-amount">+$150</div>
              <div className="special-label">
                If you drop your car off after the tour, we add another $150.
              </div>
            </div>
            <div className="special">
              <div className="special-amount">$250</div>
              <div className="special-label">
                Refer a friend. When their repair completes, you get paid.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="faq" id="faq">
        <div className="container">
          <div className="section-eyebrow">Real questions, real answers</div>
          <h2 className="display section-title">
            The stuff people <span className="accent">actually ask us.</span>
          </h2>
          <p className="section-lead">
            Filing a hail claim isn&apos;t something most people do twice.
            Here&apos;s what you actually need to know.
          </p>

          <div className="faq-list">
            <details className="faq-item">
              <summary>
                Will my insurance rates go up if I file a hail claim?
                <span className="faq-toggle">+</span>
              </summary>
              <div className="faq-answer">
                No — and this is the biggest myth in hail repair. Hail damage is
                filed under your comprehensive coverage, not collision.
                It&apos;s classified as an &quot;Act of God,&quot; meaning it
                wasn&apos;t your fault. Most insurers don&apos;t penalize
                customers for weather-related claims the same way they do for
                at-fault collisions. You&apos;re already paying for
                comprehensive coverage. This is literally what it&apos;s for.
              </div>
            </details>

            <details className="faq-item">
              <summary>
                I&apos;m not sure if my insurance even covers this.
                <span className="faq-toggle">+</span>
              </summary>
              <div className="faq-answer">
                That&apos;s a smart question — and honestly, most people
                don&apos;t know their coverage until they need it. Hail damage
                is typically covered under comprehensive, which most policies
                include. We&apos;ll handle the verification for you: we call
                your carrier, confirm your coverage, and explain exactly
                what&apos;s covered before any work begins. You&apos;ll know for
                certain within 24 hours, no obligation.
              </div>
            </details>

            <details className="faq-item">
              <summary>
                Should I just wait until after the next storm to fix it all at
                once?
                <span className="faq-toggle">+</span>
              </summary>
              <div className="faq-answer">
                We understand the thinking — but it&apos;s actually one of the
                costliest mistakes hail-damaged car owners make. Each hail event
                is a separate insurance claim with its own deductible. Existing
                damage also weakens your car&apos;s resistance to future storms.
                Insurance companies can depreciate your vehicle&apos;s value if
                you wait too long, leaving you with much less compensation if
                the next storm totals it.
              </div>
            </details>

            <details className="faq-item">
              <summary>
                I don&apos;t have time to deal with a body shop right now.
                <span className="faq-toggle">+</span>
              </summary>
              <div className="faq-answer">
                That&apos;s exactly why we built our service the way we did.
                Most clients tell us the same thing — schedules are tight,
                nobody wants to be without a car. So we come to you. We pick the
                car up, drop off a rental or Uber you to where you need to be,
                file your claim, and handle every step. You literally just hand
                us the keys and we return your car fully restored.
              </div>
            </details>

            <details className="faq-item">
              <summary>
                What is paintless dent repair, and does it really work?
                <span className="faq-toggle">+</span>
              </summary>
              <div className="faq-answer">
                PDR is the gold standard for hail damage. Our technicians use
                specialized tools to massage dents out from behind the panel,
                preserving your original factory paint. No filler, no
                respraying, no color match issues — your car keeps its original
                finish and resale value. When it&apos;s done right, you
                can&apos;t tell the dent was ever there. That&apos;s why we back
                every repair with a lifetime warranty.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* ── SERVICE AREA ─────────────────────────────────────────────────── */}
      <section className="area">
        <div className="container">
          <div className="section-eyebrow">Service Area</div>
          <h2 className="display section-title">
            We work <span className="accent">the storm belt.</span>
          </h2>
          <p className="section-lead">
            If you live in or around the DFW metroplex and your car caught hail,
            we&apos;ll come get it.
          </p>
          <div className="cities">
            <span className="city">Dallas</span>
            <span className="city">Arlington</span>
            <span className="city">Fort Worth</span>
          </div>
          <p className="area-foot">
            …and every suburb in between. Not sure if we cover you? Call us.{' '}
            <a href={home.hero.secondaryCtaLink}>{contact.phone}</a>
          </p>
        </div>
      </section>
    </>
  )
                }
