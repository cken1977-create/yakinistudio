import type { Metadata } from 'next'
import Image from 'next/image'
import { SiteShell } from '@/components/SiteShell'
import { FinalCta } from '@/components/site/Sections'
import { SECTIONS_CSS } from '@/components/site/content'
import { START_URL } from '@/lib/pricing'

export const metadata: Metadata = {
  title: 'About Yakini · Set up with you. Here to stay.',
  description: 'Yakini sets up the system your business runs on, with you, in your business’s name, and stays on after go-live.',
}

const BELIEFS = [
  { title: 'Nobody should be left alone with their software.', desc: 'Good tools still fail when the owner is left to set them up alone. A real Yakini person sets yours up with you, step by step, and you approve each one.' },
  { title: 'Yours from day one.', desc: 'Your hosting, email, texting line and payments are set up in your business’s name. If you ever leave, everything stays with you.' },
  { title: 'Nothing goes out without your OK.', desc: 'Replies can be drafted for you, but you decide what is sent. Your customers hear from you, in your voice.' },
  { title: 'Flat, honest pricing.', desc: 'One price list, published. Yakini never takes a share of your revenue. Custom builds are quoted in writing before anything starts.' },
  { title: 'We stay.', desc: 'Go-live is the start, not the end. Your Yakini person stays on, the help desk stays open, and the systems we build, we help you run.' },
] as const

const WHO = [
  'Solo owners who want their business in one place',
  'Small teams outgrowing texts, spreadsheets and sticky notes',
  'Service businesses that live on calls, bookings and follow-up',
  'Owners who would rather be guided than handed a manual',
  'Businesses that need a custom system built and run with them',
] as const

export default function AboutPage() {
  return (
    <SiteShell>
      <style>{SECTIONS_CSS + PAGE_CSS}</style>

      <header className="yk-page-header ab-header">
        <div className="yk-page-header-inner">
          <div className="yk-eyebrow"><span className="yk-eyebrow-dot" /><span>ABOUT YAKINI</span></div>
          <h1 className="yk-page-h1 ab-h1">
            Set up with you.
            <br />
            <span className="yk-gold yk-italic">Here to stay.</span>
          </h1>
          <p className="yk-page-sub">
            Yakini sets up the system your business runs on, with you, in your business&apos;s name, and stays on after go-live.
            Most businesses start with the Yakini portal. When a business needs something bigger, we build it and stay to run it with them.
          </p>
          <div className="hm-ctas">
            <a href={START_URL} className="hm-btn hm-btn-gold"><span>Start your setup</span><span className="yk-btn-arrow">→</span></a>
            <a href="/custom-builds" className="hm-btn hm-btn-ghost"><span>Custom builds</span></a>
          </div>
        </div>
      </header>

      <section className="yk-section ab-founder">
        <div className="yk-section-inner ab-founder-grid">
          <div>
            <div className="yk-section-tag"><span className="yk-num">01</span><span>The founder</span></div>
            <h2 className="hm-h2">Clarence Kennedy</h2>
            <p className="ab-role">Founder &amp; CEO, Yakini · Founder, BRSA Holdings</p>
            <div className="ab-story">
              <p>
                Yakini started with a pattern Clarence kept seeing: owners doing serious work with tools that left them on their own.
                Customer details in spreadsheets. Bookings buried in text threads. Reports finished by hand late at night.
              </p>
              <p>
                The software usually existed. What was missing was a person to set it up with them, and to still be there next month.
              </p>
              <p className="ab-story-strong">
                So that is what Yakini is. We set it up with you, in your business&apos;s name. And we stay.
              </p>
            </div>
          </div>
          <aside className="ab-side">
            <figure className="ab-photo">
              <Image src="/art/founder-clarence.jpg" alt="Clarence Kennedy, founder of Yakini" width={800} height={992} sizes="(min-width: 1000px) 420px, 80vw" />
            </figure>
          <div className="ab-facts">
            <div className="ab-fact"><span>Parent company</span><strong>BRSA Holdings, Inc. · Delaware</strong></div>
            <div className="ab-fact"><span>Nonprofit arm</span><strong>BRSA Foundation · 501(c)(3) · New Mexico</strong></div>
            <div className="ab-fact"><span>Based in</span><strong>Houston, Texas</strong></div>
            <div className="ab-fact"><span>Talk to us</span><strong><a href="mailto:hello@yakini.digital">hello@yakini.digital</a></strong></div>
          </div>
          </aside>
        </div>
      </section>

      <section className="yk-section ab-beliefs">
        <div className="yk-section-inner">
          <div className="yk-section-tag"><span className="yk-num">02</span><span>What we believe</span></div>
          <h2 className="hm-h2">How we work,<br /><span className="yk-gold yk-italic">in five lines.</span></h2>
          <div className="ab-belief-grid">
            {BELIEFS.map((b, i) => (
              <article key={b.title} className="ab-belief">
                <span className="ab-belief-num">{String(i + 1).padStart(2, '0')}</span>
                <h3>{b.title}</h3>
                <p>{b.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="yk-section ab-who">
        <div className="yk-section-inner ab-who-grid">
          <div>
            <div className="yk-section-tag"><span className="yk-num">03</span><span>Who we work with</span></div>
            <h2 className="hm-h2">Every industry<br /><span className="yk-gold yk-italic">is welcome.</span></h2>
            <p className="hm-lead">If you run a business and want it set up properly, with someone who stays, you are in the right place.</p>
          </div>
          <ul className="ab-who-list">
            {WHO.map((w) => <li key={w}>{w}</li>)}
          </ul>
        </div>
      </section>

      <section className="yk-section ab-brsa">
        <div className="yk-section-inner">
          <div className="yk-section-tag"><span className="yk-num">04</span><span>The BRSA family</span></div>
          <div className="ab-brsa-grid">
            <article className="ab-brsa-card">
              <div className="ab-brsa-label">Parent company</div>
              <h3>BRSA Holdings, Inc.</h3>
              <p>The Delaware parent company behind Yakini. It holds the standards every BRSA company works to.</p>
              <a href="https://brsaholdings.org" target="_blank" rel="noopener">brsaholdings.org →</a>
            </article>
            <article className="ab-brsa-card">
              <div className="ab-brsa-label">Nonprofit arm</div>
              <h3>BRSA Foundation</h3>
              <p>A New Mexico 501(c)(3) that helps communities and nonprofits get access to the same quality of systems.</p>
              <a href="https://brsafoundation.org" target="_blank" rel="noopener">brsafoundation.org →</a>
            </article>
          </div>
        </div>
      </section>

      <FinalCta />
    </SiteShell>
  )
}

const PAGE_CSS = `
  .ab-header {
    background: linear-gradient(180deg, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.92) 100%), none center / cover no-repeat;
  }
  .ab-h1 { max-width: 12ch; }
  .ab-founder { background: var(--navy-deep); }
  .ab-founder-grid { display: grid; grid-template-columns: 1fr; gap: 48px; }
  .ab-role { font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--gold); margin: -8px 0 28px; }
  .ab-story p { font-size: clamp(17px, 1.5vw, 20px); line-height: 1.7; color: rgba(11,20,55,0.78); margin-bottom: 18px; max-width: 640px; }
  .ab-story-strong { font-family: var(--font-display); font-style: italic; font-size: clamp(24px, 2.4vw, 32px) !important; line-height: 1.3 !important; color: var(--gold) !important; }
  .ab-side { display: grid; gap: 20px; align-self: start; }
  .ab-photo { margin: 0; border-radius: 22px; overflow: hidden; border: 1px solid rgba(22,56,232,0.35); box-shadow: 0 40px 80px -30px rgba(11,20,55,0.21); max-width: 420px; }
  .ab-photo img { display: block; width: 100%; height: auto; }
  .ab-facts { border: 1px solid var(--line-strong); padding: 28px; align-self: start; display: grid; gap: 20px; background: rgba(11,20,55,0.02); }
  .ab-fact span { display: block; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); margin-bottom: 4px; }
  .ab-fact strong { font-weight: 500; color: var(--cream); font-size: 16px; }
  .ab-fact a { color: var(--gold); }
  @media (min-width: 1000px) { .ab-founder-grid { grid-template-columns: 1.4fr 1fr; gap: 80px; } }

  .ab-beliefs { background: linear-gradient(180deg, var(--black-soft), var(--navy-deep)); border-top: 1px solid var(--line); }
  .ab-belief-grid { display: grid; grid-template-columns: 1fr; gap: 1px; background: var(--line); border: 1px solid var(--line); }
  .ab-belief { background: var(--navy-deep); padding: 32px 28px; }
  .ab-belief-num { font-family: var(--font-display); font-style: italic; font-size: 22px; color: var(--gold); }
  .ab-belief h3 { font-family: var(--font-display); font-weight: 500; font-size: 27px; line-height: 1.15; color: var(--cream); margin: 16px 0 12px; }
  .ab-belief p { font-size: 15px; line-height: 1.65; color: rgba(11,20,55,0.74); }
  @media (min-width: 760px) { .ab-belief-grid { grid-template-columns: 1fr 1fr; } }
  @media (min-width: 1200px) { .ab-belief-grid { grid-template-columns: repeat(3, 1fr); } }

  .ab-who { background: var(--navy-deep); border-top: 1px solid var(--line); }
  .ab-who-grid { display: grid; grid-template-columns: 1fr; gap: 32px; align-items: center; }
  .ab-who-list { border-top: 1px solid var(--line-strong); }
  .ab-who-list li { padding: 20px 0 20px 34px; border-bottom: 1px solid var(--line-strong); position: relative; font-size: 18px; color: var(--cream); }
  .ab-who-list li::before { content: '→'; position: absolute; left: 0; color: var(--gold); }
  @media (min-width: 1000px) { .ab-who-grid { grid-template-columns: 1fr 1fr; gap: 80px; } }

  .ab-brsa { background: var(--black-soft); border-top: 1px solid var(--line); }
  .ab-brsa-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
  .ab-brsa-card { border: 1px solid var(--line-strong); padding: 32px 28px; }
  .ab-brsa-label { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 12px; }
  .ab-brsa-card h3 { font-family: var(--font-display); font-weight: 500; font-size: 32px; color: var(--cream); margin-bottom: 10px; }
  .ab-brsa-card p { font-size: 15px; line-height: 1.65; color: rgba(11,20,55,0.74); margin-bottom: 18px; }
  .ab-brsa-card a { color: var(--gold); font-size: 14px; }
  @media (min-width: 800px) { .ab-brsa-grid { grid-template-columns: 1fr 1fr; } }
`
