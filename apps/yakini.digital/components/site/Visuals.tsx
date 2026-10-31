// Visual sections for yakini.digital (Preview, Oct 30 2026).
// Every product screen here is a real Yakini demo or the client portal with SAMPLE data. Nothing poses as a real client.
// Customer-facing copy: no vendor names, no income claims.

import Image from 'next/image'
import { BOOK_CALL_URL } from '@/components/site/content'
import { START_URL } from '@/lib/pricing'

/* ───────────────────────── Hero stage: real demo screens, floating ───────────────────────── */

export function HeroStage() {
  return (
    <div className="vs-stage" aria-label="Sample screens from Yakini demos and the client portal">
      <figure className="vs-browser vs-float-a">
        <div className="vs-bar" aria-hidden><i /><i /><i /><span>Food truck desk · sample data</span></div>
        <Image src="/kits/foodtruck-desktop.jpg" alt="Food truck owner desk with today's orders, sales and catering requests (sample data)" width={1440} height={868} fetchPriority="high" loading="eager" sizes="(min-width: 1100px) 46vw, 92vw" />
      </figure>
      <figure className="vs-card vs-float-b">
        <Image src="/kits/portal-dashboard-sample.jpg" alt="Client portal home: next steps, build progress and go-live date (sample client)" width={1440} height={900} sizes="(min-width: 1100px) 26vw, 50vw" />
        <figcaption>Your client portal</figcaption>
      </figure>
      <figure className="vs-phone vs-float-c">
        <Image src="/kits/landlord-phone.jpg" alt="Landlord help desk on a phone: every issue sorted and moving (sample data)" width={585} height={1233} sizes="(min-width: 1100px) 12vw, 30vw" />
      </figure>
      <span className="vs-glow" aria-hidden />
    </div>
  )
}

/* ───────────────────────── Kit gallery ───────────────────────── */

const KITS = [
  { id: 'foodtruck', trade: 'Food trucks', line: 'Pre-orders, a live menu, catering requests and a phone line for the truck.', href: 'https://yakini-foodtruck-demo.vercel.app', img: '/kits/foodtruck-desktop.jpg' },
  { id: 'landlord', trade: 'Landlords', line: 'Tenants report issues with photos; you send the right vendor in one tap.', href: 'https://yakini-landlord-demo.vercel.app', img: '/kits/landlord-desktop.jpg' },
  { id: 'realestate', trade: 'Real estate', line: 'Homes picked for each buyer, one-tap showings and a private client room.', href: 'https://yakini-realestate-demo.vercel.app', img: '/kits/realestate-desktop.jpg' },
  { id: 'transport', trade: 'Trucking & hauling', line: 'Shippers request loads, you dispatch, and the signed delivery sends the invoice.', href: 'https://yakini-transport-demo.vercel.app', img: '/kits/transport-desktop.jpg' },
] as const

const MORE_KITS = [
  { trade: 'Oilfield services', line: 'Job requests, crew clearance, field tickets and invoices.' },
  { trade: 'Tree & lawn care', line: 'Quotes, crews, schedules, certifications and invoices.' },
] as const

export function KitGallery({ num = '02' }: { num?: string }) {
  return (
    <section id="kits" className="yk-section vs-kits">
      <div className="yk-section-inner">
        <div className="yk-section-tag"><span className="yk-num">{num}</span><span>See it for your trade</span></div>
        <h2 className="hm-h2">
          Real systems.
          <br />
          <span className="yk-gold yk-italic">Open one and look around.</span>
        </h2>
        <p className="hm-lead">
          Each demo is a working Yakini system for one kind of business, filled with sample data. Click through it the way your customers and your team would.
        </p>
        <div className="vs-kit-grid">
          {KITS.map((k) => (
            <a key={k.id} href={k.href} target="_blank" rel="noopener" className="vs-kit">
              <span className="vs-kit-shot">
                <Image src={k.img} alt={`${k.trade} demo screen (sample data)`} width={1440} height={878} sizes="(min-width: 1000px) 45vw, 92vw" />
              </span>
              <span className="vs-kit-body">
                <span className="vs-kit-tag">Demo · sample data</span>
                <strong>{k.trade}</strong>
                <span>{k.line}</span>
                <em>Open the demo →</em>
              </span>
            </a>
          ))}
        </div>
        <div className="vs-more">
          {MORE_KITS.map((k) => (
            <a key={k.trade} href={BOOK_CALL_URL} className="vs-more-card">
              <span className="vs-kit-tag">Walkthrough on a call</span>
              <strong>{k.trade}</strong>
              <span>{k.line}</span>
            </a>
          ))}
          <a href={BOOK_CALL_URL} className="vs-more-card vs-more-any">
            <span className="vs-kit-tag">Your trade</span>
            <strong>Don&apos;t see yours?</strong>
            <span>Every industry is welcome. We set it up around how you already work.</span>
          </a>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── Client portal (dashboard) ───────────────────────── */

export function PortalShowcase({ num = '01' }: { num?: string }) {
  return (
    <section id="client-portal" className="yk-section vs-portal">
      <div className="yk-section-inner vs-portal-grid">
        <div>
          <div className="yk-section-tag"><span className="yk-num">{num}</span><span>Your build, in plain sight</span></div>
          <h2 className="hm-h2">
            Always know
            <br />
            <span className="yk-gold yk-italic">where your build stands.</span>
          </h2>
          <p className="hm-lead">
            From the day you sign up, you get your own portal under your business&apos;s name. It shows what&apos;s done, what&apos;s next, and the date you go live.
          </p>
          <ul className="vs-points">
            <li><b>Where we are.</b> Kickoff, Build, Review, Live, with your target go-live date.</li>
            <li><b>Next up.</b> The two or three things we need from you, in order.</li>
            <li><b>Your Yakini person.</b> A name and face, plus messages and files in one place.</li>
            <li><b>Yours to keep.</b> You own your website, system and data. Hosting and running costs are covered in the monthly fee, with usage billed at cost.</li>
          </ul>
          <div className="hm-ctas">
            <a href={START_URL} className="hm-btn hm-btn-gold"><span>Start your setup</span><span className="yk-btn-arrow">→</span></a>
          </div>
        </div>
        <div className="vs-portal-visual">
          <figure className="vs-browser vs-browser-light">
            <div className="vs-bar" aria-hidden><i /><i /><i /><span>Client portal · sample client</span></div>
            <Image src="/kits/portal-dashboard-sample.jpg" alt="Client portal home for a sample client: next up, where we are, what Yakini is doing next, contact and updates" width={1440} height={900} sizes="(min-width: 1000px) 52vw, 92vw" />
          </figure>
          <figure className="vs-phone vs-phone-sm">
            <Image src="/kits/portal-dashboard-sample-phone.jpg" alt="The same client portal on a phone (sample client)" width={585} height={1266} sizes="160px" />
          </figure>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── Founder ───────────────────────── */

export function FounderBand() {
  return (
    <section className="vs-founder">
      <div className="vs-founder-inner">
        <figure className="vs-founder-photo">
          <Image src="/art/founder-clarence.jpg" alt="Clarence Kennedy, founder of Yakini" width={800} height={992} sizes="(min-width: 1000px) 380px, 70vw" />
        </figure>
        <div>
          <div className="yk-section-tag"><span className="yk-num">—</span><span>From the founder</span></div>
          <blockquote className="vs-quote">
            &ldquo;The software usually existed. What was missing was a person to set it up with owners, and to still be there next month. So that is what Yakini is.&rdquo;
          </blockquote>
          <p className="vs-founder-name">Clarence Kennedy</p>
          <p className="vs-founder-role">Founder &amp; CEO, Yakini</p>
          <a href="/about" className="hm-textlink">Why we started Yakini →</a>
        </div>
      </div>
    </section>
  )
}

export const VISUALS_CSS = `
  /* hero stage */
  .vs-stage { position: relative; width: 100%; max-width: 760px; aspect-ratio: 1.18; margin: 0 auto; }
  .vs-stage figure { position: absolute; margin: 0; }
  .vs-glow { position: absolute; inset: 12% 8%; background: radial-gradient(closest-side, rgba(22,56,232,0.28), transparent); filter: blur(30px); z-index: 0; }
  .vs-browser { border-radius: 14px; overflow: hidden; background: #14120e; box-shadow: var(--yk-shadow-float); }
  .vs-browser img, .vs-card img, .vs-phone img, .vs-kit-shot img, .vs-founder-photo img { display: block; width: 100%; height: auto; }
  .vs-bar { display: flex; align-items: center; gap: 6px; padding: 9px 12px; background: #1b1914; border-bottom: 1px solid var(--yk-line-dark); }
  .vs-bar i { width: 9px; height: 9px; border-radius: 50%; background: rgba(11,20,55,0.2); }
  .vs-bar span { margin-left: 10px; font-size: 11px; letter-spacing: 0.04em; color: rgba(11,20,55,0.74); }
  .vs-stage .vs-browser { left: 0; top: 4%; width: 84%; z-index: 1; }
  .vs-card { right: 0; bottom: 4%; width: 52%; border-radius: 14px; overflow: hidden; background: #fff; box-shadow: var(--yk-shadow-float); z-index: 2; }
  .vs-card figcaption { position: absolute; left: 10px; top: 10px; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; background: #C6F432; color: #0B1437; padding: 5px 10px; border-radius: 999px; }
  .vs-phone { border-radius: 28px; overflow: hidden; border: 6px solid #0d0c0a; background: #0d0c0a; box-shadow: var(--yk-shadow-float); }
  .vs-stage .vs-phone { left: 2%; bottom: 0; width: 23%; z-index: 3; }
  @media (prefers-reduced-motion: no-preference) {
    .vs-float-a { animation: vs-float 9s ease-in-out infinite; }
    .vs-float-b { animation: vs-float 11s ease-in-out -3s infinite; }
    .vs-float-c { animation: vs-float 10s ease-in-out -6s infinite; }
    @keyframes vs-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  }

  /* kits */
  .vs-kits { background: #F4F7FF; border-top: 1px solid var(--line); }
  .vs-kit-grid { display: grid; grid-template-columns: 1fr; gap: 22px; margin-top: 48px; }
  .vs-kit { display: grid; border: 1px solid var(--line-strong); border-radius: var(--yk-radius-lg); overflow: hidden; background: rgba(255,255,255,0.9); color: var(--cream); text-decoration: none; transition: border-color .25s, transform .25s; }
  .vs-kit:hover, .vs-kit:focus-visible { border-color: rgba(22,56,232,0.6); }
  @media (prefers-reduced-motion: no-preference) { .vs-kit:hover { transform: translateY(-3px); } }
  .vs-kit-shot { display: block; aspect-ratio: 16 / 9.4; overflow: hidden; border-bottom: 1px solid var(--line); }
  .vs-kit-body { display: grid; gap: 6px; padding: 20px 22px 22px; }
  .vs-kit-body strong, .vs-more-card strong { font-family: var(--font-display); font-weight: 500; font-size: 26px; }
  .vs-kit-body span:not(.vs-kit-tag), .vs-more-card span:not(.vs-kit-tag) { font-size: 15px; line-height: 1.55; color: rgba(11,20,55,0.74); }
  .vs-kit-body em { font-style: normal; color: var(--gold); font-size: 14px; margin-top: 6px; }
  .vs-kit-tag { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold); }
  .vs-more { display: grid; grid-template-columns: 1fr; gap: 16px; margin-top: 22px; }
  .vs-more-card { display: grid; gap: 6px; padding: 22px; border: 1px dashed var(--line-strong); border-radius: var(--yk-radius); color: var(--cream); text-decoration: none; background: rgba(255,255,255,0.6); }
  .vs-more-card:hover { border-color: rgba(22,56,232,0.6); }
  @media (min-width: 900px) { .vs-kit-grid { grid-template-columns: 1fr 1fr; } .vs-more { grid-template-columns: repeat(3, 1fr); } }

  /* client portal showcase */
  .vs-portal { background: radial-gradient(ellipse at 80% 30%, rgba(22,56,232,0.1), transparent 55%), var(--navy-deep); }
  .vs-portal-grid { display: grid; grid-template-columns: 1fr; gap: 56px; align-items: center; }
  .vs-points { list-style: none; display: grid; gap: 14px; margin: 28px 0 8px; padding: 0; }
  .vs-points li { padding-left: 22px; position: relative; font-size: 16px; line-height: 1.6; color: rgba(11,20,55,0.78); max-width: 560px; }
  .vs-points li::before { content: ''; position: absolute; left: 0; top: 0.62em; width: 8px; height: 8px; border-radius: 50%; background: var(--gold); }
  .vs-points b { color: var(--cream); font-weight: 600; }
  .vs-portal-visual { position: relative; padding-bottom: 40px; }
  .vs-phone-sm { position: absolute; right: -6px; bottom: 0; width: 26%; max-width: 170px; }
  @media (min-width: 1000px) { .vs-portal-grid { grid-template-columns: 0.85fr 1.15fr; gap: 72px; } }

  /* founder */
  .vs-founder { padding: 120px 32px; background: #F4F7FF; border-top: 1px solid var(--line); }
  .vs-founder-inner { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1fr; gap: 48px; align-items: center; }
  .vs-founder-photo { margin: 0 auto; width: min(340px, 76vw); border-radius: var(--yk-radius-lg); overflow: hidden; box-shadow: var(--yk-shadow-float); border: 1px solid rgba(22,56,232,0.35); }
  .vs-quote { font-family: var(--font-display); font-style: italic; font-size: clamp(26px, 3vw, 40px); line-height: 1.25; color: var(--cream); margin: 0 0 26px; }
  .vs-founder-name { font-size: 18px; font-weight: 600; color: var(--cream); }
  .vs-founder-role { font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold); margin: 4px 0 22px; }
  @media (min-width: 1000px) { .vs-founder-inner { grid-template-columns: 380px 1fr; gap: 80px; } .vs-founder-photo { width: 100%; } }
`
