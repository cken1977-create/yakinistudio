
'use client'

import Link from 'next/link'
import { SiteShell } from '@/components/SiteShell'
import { BuildPicker } from '@/components/pricing/BuildPicker'
import {
  DEMO_URL,
  ANNUAL_NOTE,
  DASHBOARD_NOTE,
  EXTRA_HELP_NOTE,
  GUIDED_STEPS,
  HEADLINE,
  PACKAGE_EXAMPLE,
  HELP_HOURS_NOTE,
  HOURLY_RATE,
  KITS,
  KIT_INCLUDES,
  PASS_THROUGH_NOTE,
  PITCH,
  QUOTE_NOTE,
  REFUND_RULE,
  SETUPS,
  SIZES,
  STAY_WITH_YOU_NOTE,
  TUTORIAL_NOTE,
  formatUsd,
  moneyLabel,
} from '@/lib/pricing'

export default function PricingPage() {
  return (
    <SiteShell>
      <style>{PAGE_CSS}</style>

      <header className="yk-page-header pr-header">
        <div className="yk-page-header-inner">
          <div className="yk-eyebrow">
            <span className="yk-eyebrow-dot" />
            <span>PRICING · BUILD YOUR KIT</span>
          </div>
          <h1 className="yk-page-h1">
            {HEADLINE.split('.')[0]}.
            <br />
            <span className="yk-gold">{HEADLINE.split('. ')[1]}</span>
          </h1>
          <p className="yk-page-sub">{PITCH}</p>
          <p className="pr-lead">{PACKAGE_EXAMPLE}</p>
          <div className="pn-hero-ctas">
            <a href="#build" className="pr-tier-cta pr-cta-featured"><span>Build my estimate</span><span className="yk-btn-arrow">→</span></a>
            <a href={DEMO_URL} className="pr-tier-cta"><span>See a free demo of your kit</span></a>
          </div>
        </div>
      </header>

      <section id="build" className="yk-section pr-build">
        <div className="yk-section-inner">
          <div className="yk-section-tag"><span className="yk-num">01</span><span>Build your estimate</span></div>
          <h2 className="yk-section-h2">Choose a kit, a size, and the services you want.</h2>
          <p className="pr-lead">{QUOTE_NOTE} Work beyond the included time is ${HOURLY_RATE} an hour, and must be approved first.</p>
          <BuildPicker />
        </div>
      </section>

      <section id="includes" className="yk-section">
        <div className="yk-section-inner">
          <div className="yk-section-tag"><span className="yk-num">02</span><span>What’s in a kit</span></div>
          <h2 className="yk-section-h2">The owner and staff dashboard is included in every monthly kit price.</h2>
          <p className="pr-lead">{DASHBOARD_NOTE} {TUTORIAL_NOTE}</p>
          <ul className="pr-includes">
            {KIT_INCLUDES.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <p className="pr-lead">{HELP_HOURS_NOTE} {EXTRA_HELP_NOTE}</p>
        </div>
      </section>

      <section id="plans" className="yk-section">
        <div className="yk-section-inner">
          <div className="yk-section-tag"><span className="yk-num">03</span><span>Monthly kit prices</span></div>
          <h2 className="yk-section-h2">Priced by the kind of business, and by size.</h2>
          <p className="pr-lead"><strong>{STAY_WITH_YOU_NOTE}</strong></p>
          <p className="pr-lead">{ANNUAL_NOTE} Cannabis, home healthcare, and reentry are quote-only. Home healthcare and reentry are not sold until those kits are built.</p>
          <div className="pr-table-wrap">
            <table className="pr-table">
              <thead>
                <tr>
                  <th>Kit</th>
                  <th>Small</th>
                  <th>Growing</th>
                  <th>Larger</th>
                </tr>
              </thead>
              <tbody>
                {KITS.map((kit) => (
                  <tr key={kit.id}>
                    <td>{kit.name}</td>
                    {SIZES.map((size) => (
                      <td key={size.id}>{moneyLabel(kit.monthly[size.id], '/mo')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="limits" className="yk-section">
        <div className="yk-section-inner">
          <div className="yk-section-tag"><span className="yk-num">04</span><span>Size limits</span></div>
          <h2 className="yk-section-h2">Staff logins, capacity, and support for each size.</h2>
          <div className="pr-table-wrap">
            <table className="pr-table">
              <thead>
                <tr>
                  <th>Limit</th>
                  {SIZES.map((size) => <th key={size.id}>{size.name}</th>)}
                  <th>Past the limit</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Staff logins</td>
                  {SIZES.map((s) => <td key={s.id}>{s.seats}</td>)}
                  <td>$15 per extra login, per month</td>
                </tr>
                <tr>
                  <td>Capacity</td>
                  {SIZES.map((s) => <td key={s.id}>{s.capacity}</td>)}
                  <td>Past Larger is a custom quote</td>
                </tr>
                <tr>
                  <td>Support</td>
                  {SIZES.map((s) => <td key={s.id}>{s.support}</td>)}
                  <td>Beyond included time: ${HOURLY_RATE}/hr, approved first</td>
                </tr>
                <tr>
                  <td>Texting volume the plan is sized for</td>
                  {SIZES.map((s) => <td key={s.id}>{s.texts.toLocaleString('en-US')} segments</td>)}
                  <td>You pay your texting provider directly for every text. If you regularly need more volume, a separate Yakini texting management fee can be quoted. Yakini does not mark up the provider bill.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="setup" className="yk-section">
        <div className="yk-section-inner">
          <div className="yk-section-tag"><span className="yk-num">05</span><span>Setup</span></div>
          <h2 className="yk-section-h2">Setup from {formatUsd(299)}, with the final level confirmed in writing.</h2>
          <div className="pr-setups">
            {SETUPS.map((s) => (
              <article key={s.id}>
                <h3>{s.name}</h3>
                <p className="pr-price">{moneyLabel(s.price)}</p>
                <p>{s.hours}. {s.summary}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="yk-section">
        <div className="yk-section-inner">
          <div className="yk-section-tag"><span className="yk-num">06</span><span>How it works</span></div>
          <h2 className="yk-section-h2">Four steps. One real person.</h2>
          <ol className="pr-steps">
            {GUIDED_STEPS.map((step, i) => (
              <li key={step.title}>
                <span>{String(i + 1).padStart(2, '0')}</span>
                <h3>{step.title}</h3>
                <p>{step.detail}</p>
              </li>
            ))}
          </ol>
          <p className="pr-lead">{PASS_THROUGH_NOTE}</p>
          <p className="pr-lead">{REFUND_RULE} You can cancel the monthly plan any time.</p>
          <p className="pr-lead"><Link href="#build">Build your estimate and send it for a quote →</Link> Or <Link href={DEMO_URL}>see a free demo in your brand →</Link></p>
        </div>
      </section>
    </SiteShell>
  )
}

const PAGE_CSS = `
  .pr-header { padding-bottom: 40px; }
  .pn-hero-ctas { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
  .pr-tier-cta {
    display: inline-flex; align-items: center; gap: 10px;
    border: 1px solid var(--line-strong); color: var(--cream);
    padding: 14px 20px; text-decoration: none; font-weight: 600;
  }
  .pr-cta-featured { background: var(--gold); color: var(--navy-deep); border-color: var(--gold); }
  .pr-lead { color: rgba(244,247,255,0.8); font-size: 17px; line-height: 1.65; max-width: 720px; margin: 12px 0 0; }
  .pr-includes { margin: 24px 0 0; padding: 0; list-style: none; display: grid; gap: 10px; }
  .pr-includes li { padding: 14px 16px; border: 1px solid var(--line); }
  .pr-table-wrap { overflow-x: auto; margin-top: 24px; -webkit-overflow-scrolling: touch; }
  .pr-table { width: 100%; border-collapse: collapse; min-width: 640px; }
  .pr-table th, .pr-table td { text-align: left; padding: 12px 14px; border-bottom: 1px solid var(--line); vertical-align: top; }
  .pr-table th { font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: var(--gold); }
  .pr-setups { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 24px; }
  .pr-setups article { border: 1px solid var(--line); padding: 20px; }
  .pr-setups h3 { margin: 0 0 6px; font-size: 22px; }
  .pr-price { color: var(--gold); font-weight: 700; margin: 0 0 8px; }
  .pr-steps { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 24px; }
  .pr-steps li { border: 1px solid var(--line); padding: 20px; }
  .pr-steps span { font-family: var(--font-display); font-size: 32px; color: var(--gold); }
  @media (max-width: 800px) {
    .pr-setups, .pr-steps { grid-template-columns: 1fr; }
  }

  .bp-grid { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 24px; align-items: start; margin-top: 28px; }
  .bp-card, .bp-summary-inner { border: 1px solid var(--line); padding: 22px; background: rgba(5,8,28,0.45); }
  .bp-card + .bp-card { margin-top: 16px; }
  .bp-card h3 { margin: 0 0 14px; font-size: 22px; }
  .bp-card h4 { margin: 22px 0 10px; font-size: 13px; letter-spacing: .12em; text-transform: uppercase; color: var(--gold); }
  .bp-chips { display: flex; flex-wrap: wrap; gap: 10px; }
  .bp-chip {
    appearance: none; text-align: left; cursor: pointer;
    border: 1px solid var(--line-strong); background: transparent; color: inherit;
    padding: 12px 14px; min-height: 44px; display: flex; flex-direction: column; gap: 2px;
    flex: 1 1 140px; max-width: 100%;
  }
  .bp-chip.on { border-color: var(--gold); box-shadow: inset 0 0 0 1px var(--gold); }
  .bp-chip.warn { opacity: .9; }
  .bp-chip small { color: rgba(244,247,255,0.7); font-size: 12px; }
  .bp-hint { margin: 14px 0 0; color: rgba(244,247,255,0.74); font-size: 14px; line-height: 1.55; }
  .bp-warn { margin: 12px 0 0; color: #f3d98b; font-size: 14px; }
  .bp-error { color: #ffb4b4; margin: 0; }
  .bp-check, .bp-item { display: flex; gap: 10px; align-items: flex-start; margin-top: 12px; cursor: pointer; }
  .bp-check input, .bp-item input { margin-top: 4px; flex: 0 0 auto; }
  .bp-items { display: grid; gap: 8px; }
  .bp-item { border: 1px solid var(--line); padding: 12px; margin-top: 0; }
  .bp-item.on { border-color: var(--gold); }
  .bp-item span { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .bp-item em { font-style: normal; color: var(--gold); font-size: 13px; }
  .bp-item small { color: rgba(244,247,255,0.72); font-size: 13px; line-height: 1.45; }
  .bp-extras { display: flex; flex-wrap: wrap; gap: 16px; margin: 8px 0 8px; }
  .bp-extras label { display: flex; flex-direction: column; gap: 6px; font-size: 14px; }
  .bp-extras input, .bp-form input, .bp-form textarea {
    background: rgba(255,255,255,0.04); border: 1px solid var(--line-strong);
    color: inherit; padding: 12px; min-height: 44px; width: 100%; max-width: 220px;
  }
  .bp-form { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
  .bp-form label { display: flex; flex-direction: column; gap: 6px; font-size: 14px; }
  .bp-form label.wide, .bp-form .bp-error, .bp-form .bp-submit { grid-column: 1 / -1; }
  .bp-form input, .bp-form textarea { max-width: none; }
  .bp-submit {
    display: inline-flex; justify-content: center; align-items: center;
    background: var(--gold); color: var(--navy-deep); border: 0; padding: 14px 18px;
    font-weight: 700; cursor: pointer; text-decoration: none; width: 100%; min-height: 48px;
  }
  .bp-submit:disabled { opacity: .6; cursor: wait; }
  .bp-summary { position: sticky; top: 88px; }
  .bp-kicker { font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: var(--gold); margin: 0 0 6px; }
  .bp-head { margin: 0 0 16px; font-size: 16px; }
  .bp-totals { display: grid; gap: 12px; margin-bottom: 12px; }
  .bp-totals div { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .bp-totals strong { font-size: 22px; }
  .bp-lines { list-style: none; padding: 0; margin: 16px 0 0; display: grid; gap: 8px; }
  .bp-lines li { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; font-size: 13px; border-bottom: 1px solid var(--line); padding-bottom: 8px; }
  .bp-jump { margin-top: 16px; }
  .bp-thanks h3 { margin-top: 0; }
  @media (max-width: 980px) {
    .bp-grid { grid-template-columns: 1fr; }
    .bp-summary { position: static; }
    .bp-form { grid-template-columns: 1fr; }
    .bp-summary-inner { position: sticky; bottom: 0; z-index: 5; }
  }
`
