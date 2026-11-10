import type { Metadata } from 'next'
import { SiteShell } from '@/components/SiteShell'
import { SECTIONS_CSS } from '@/components/site/content'
import { PORTAL_LOGIN_URL, START_URL } from '@/lib/pricing'
import { ContactForm } from './ContactForm'

export const metadata: Metadata = {
  title: 'Contact Yakini · Talk to a real person',
  description: 'Call, email or send Yakini a note. A real person reads every message and gets back to you.',
  alternates: { canonical: 'https://yakini.digital/contact' },
}

const WAYS = [
  { k: 'CALL THE OFFICE', v: '1 (346) 623-2199', href: 'tel:+13466232199' },
  { k: 'EXECUTIVE LINE', v: '1 (346) 626-4948', href: 'tel:+13466264948' },
  { k: 'EMAIL', v: 'hello@yakini.digital', href: 'mailto:hello@yakini.digital' },
  { k: 'ADMIN', v: 'admin@yakini.digital', href: 'mailto:admin@yakini.digital' },
] as const

export default function ContactPage() {
  return (
    <SiteShell>
      <style>{SECTIONS_CSS + PAGE_CSS}</style>
      <header className="yk-page-header">
        <div className="yk-page-header-inner">
          <div className="yk-eyebrow"><span className="yk-eyebrow-dot" /><span>CONTACT YAKINI</span></div>
          <h1 className="yk-page-h1">
            Talk to a <span className="yk-gold yk-italic">real person.</span>
          </h1>
          <p className="yk-page-sub">Call, email or send a note. Somebody at Yakini reads every message and gets back to you, usually the same business day.</p>
        </div>
      </header>

      <section className="yk-section ct">
        <div className="yk-section-inner ct-grid">
          <div>
            <div className="yk-section-tag">REACH US</div>
            <ul className="ct-ways">
              {WAYS.map((w) => (
                <li key={w.k}><small>{w.k}</small><a href={w.href}>{w.v}</a></li>
              ))}
            </ul>
            <div className="yk-section-tag ct-gap">OR GO STRAIGHT TO IT</div>
            <div className="ct-routes">
              <a href="/apply" className="hm-btn hm-btn-gold"><span>Book a call</span><span className="yk-btn-arrow">→</span></a>
              <a href={START_URL} className="hm-btn"><span>Start your setup</span></a>
              <a href={PORTAL_LOGIN_URL} className="hm-btn"><span>Sign in to your portal</span></a>
              <a href="/class" className="hm-btn"><span>Take the free class</span></a>
            </div>
            <p className="ct-fine">Yakini is part of the BRSA ecosystem · Houston, Texas</p>
          </div>
          <div className="ct-card">
            <h2>Send us a note</h2>
            <ContactForm />
          </div>
        </div>
      </section>
    </SiteShell>
  )
}

const PAGE_CSS = `
  .ct { padding-top: 80px; }
  .ct-grid { display: grid; grid-template-columns: 1fr; gap: 56px; }
  @media (min-width: 960px) { .ct-grid { grid-template-columns: 1fr 1.1fr; gap: 80px; } }
  .ct-ways { display: grid; gap: 22px; }
  .ct-ways small { display: block; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.18em; color: var(--muted); margin-bottom: 4px; }
  .ct-ways a { font-family: var(--font-display); font-size: clamp(28px, 3vw, 40px); line-height: 1.1; color: var(--cream); }
  .ct-ways a:hover { color: var(--gold); }
  .ct-gap { margin-top: 56px; }
  .ct-routes { display: flex; flex-wrap: wrap; gap: 12px; }
  .ct-fine { margin-top: 40px; font-size: 13px; color: var(--muted); }
  .ct-card { border: 1px solid var(--line); border-radius: 22px; padding: 32px; background: rgba(6,11,36,0.72); backdrop-filter: blur(14px); align-self: start; }
  .ct-card h2 { font-family: var(--font-display); font-weight: 400; font-size: 40px; line-height: 1; margin-bottom: 24px; }
  .ct-form { display: grid; gap: 18px; }
  .ct-row { display: grid; gap: 18px; }
  @media (min-width: 620px) { .ct-row { grid-template-columns: 1fr 1fr; } }
  .ct-form label { display: grid; gap: 8px; font-size: 13px; font-weight: 500; color: var(--muted); }
  .ct-form label i { font-style: normal; font-weight: 400; opacity: 0.7; }
  .ct-form input, .ct-form select, .ct-form textarea { font: inherit; font-size: 15px; color: var(--cream); background: rgba(244,247,255,0.06); border: 1px solid var(--line-strong); border-radius: 12px; padding: 13px 14px; }
  .ct-form select option { color: #0B1437; }
  .ct-form input:focus, .ct-form select:focus, .ct-form textarea:focus { outline: none; border-color: var(--gold); }
  .ct-form button { justify-self: start; cursor: pointer; font: inherit; }
  .ct-form button[disabled] { opacity: 0.6; cursor: default; }
  .ct-err { color: #FFB4A2; font-size: 14px; }
  .ct-sent h3 { font-family: var(--font-display); font-weight: 400; font-size: 32px; color: var(--gold); }
  .ct-sent p { margin-top: 10px; color: var(--muted); }
`
