import type { Metadata } from 'next'
import Image from 'next/image'
import { SiteShell } from '@/components/SiteShell'
import { FinalCta } from '@/components/site/Sections'
import { SECTIONS_CSS } from '@/components/site/content'
import { START_URL } from '@/lib/pricing'
import { SOCIAL_LINKS } from '@/lib/organization'

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

// Client work, Clarence approved Nov 20 2026. Every line is taken from the client's live site
// or the build itself: no quotes, no numbers we did not see. Links only where a public site exists.
const BUILT_FOR = [
  {
    name: 'Royal Hemoglobin',
    kind: 'Fragrance oils · Wholesale & retail',
    desc: 'An online storefront for a fragrance-oil wholesaler: 488 designer-type oils from a ⅓ oz tester to 16 oz, wholesale accounts for shops, salons and resellers, and quick reorders.',
    href: 'https://royal-hemoglobin.vercel.app',
  },
  {
    name: 'Momma Sally’s',
    kind: 'Southern food truck · West Texas',
    desc: 'A bilingual English and Spanish site with the full menu, catering and events, and seasonal specials customers order by text or phone.',
    href: 'https://mamasallys.com',
  },
  {
    name: 'Vizionz Sankofa',
    kind: 'Nonprofit · Albuquerque, New Mexico',
    desc: 'A new public website for a community nonprofit serving New Mexico since 2014, and the private staff system behind its programs: client records, program enrollment and staff contact logs.',
    href: 'https://www.myvizionz.org',
  },
  {
    name: 'CareRoute',
    kind: 'Mobile testing & training · Texas Panhandle',
    desc: 'An operations system for a mobile drug, alcohol and DNA testing company, with booking and payments, scheduling, a client portal and invoices, plus an online academy for its training courses. It links from the company’s own website.',
    href: null,
  },
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
            <div className="ab-fact"><span>Follow Yakini</span>
              <div className="ab-social">
                {SOCIAL_LINKS.map((l) => (
                  <a key={l.id} href={l.href} target="_blank" rel="noopener me" aria-label={`Yakini Digital on ${l.label}`}>{l.label}</a>
                ))}
              </div>
            </div>
          </div>
          </aside>
        </div>
      </section>

      <section className="yk-section ab-built" id="clients">
        <div className="yk-section-inner">
          <div className="yk-section-tag"><span className="yk-num">02</span><span>Who we&apos;ve built for</span></div>
          <h2 className="hm-h2">Real businesses,<br /><span className="yk-gold yk-italic">real systems.</span></h2>
          <p className="hm-lead ab-built-lead">A few of the businesses running on what Yakini set up with them.</p>
          <div className="ab-built-grid">
            {BUILT_FOR.map((c) => (
              <article key={c.name} className="ab-built-card">
                <div className="ab-built-kind">{c.kind}</div>
                <h3>{c.name}</h3>
                <p>{c.desc}</p>
                {c.href
                  ? <a href={c.href} target="_blank" rel="noopener">Visit {c.name} →</a>
                  : <span className="ab-built-status"><i aria-hidden="true" />Building now</span>}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="yk-section ab-beliefs">
        <div className="yk-section-inner">
          <div className="yk-section-tag"><span className="yk-num">03</span><span>What we believe</span></div>
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
            <div className="yk-section-tag"><span className="yk-num">04</span><span>Who we work with</span></div>
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
          <div className="yk-section-tag"><span className="yk-num">05</span><span>The BRSA family</span></div>
          <div className="ab-brsa-grid">
            <article className="ab-brsa-card">
              <div className="ab-brsa-label">Parent company</div>
              <h3>BRSA Holdings, Inc.</h3>
              <p>The Delaware parent company behind Yakini. It holds the standards every BRSA company works to.</p>
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
    background: var(--black-soft);
  }
  .ab-h1 { max-width: 12ch; }
  .ab-founder { background: var(--navy-deep); }
  .ab-founder-grid { display: grid; grid-template-columns: 1fr; gap: 48px; }
  .ab-role { font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--gold); margin: -8px 0 28px; }
  .ab-story p { font-size: clamp(17px, 1.5vw, 20px); line-height: 1.7; color: rgba(244,247,255,0.78); margin-bottom: 18px; max-width: 640px; }
  .ab-story-strong { font-family: var(--font-display); font-style: italic; font-size: clamp(24px, 2.4vw, 32px) !important; line-height: 1.3 !important; color: var(--gold) !important; }
  .ab-side { display: grid; gap: 20px; align-self: start; }
  .ab-photo { margin: 0; border-radius: 22px; overflow: hidden; border: 1px solid rgba(22,56,232,0.35); box-shadow: 0 40px 80px -30px rgba(244,247,255,0.21); max-width: 420px; }
  .ab-photo img { display: block; width: 100%; height: auto; }
  .ab-facts { border: 1px solid var(--line-strong); padding: 28px; align-self: start; display: grid; gap: 20px; background: rgba(244,247,255,0.02); }
  .ab-fact span { display: block; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); margin-bottom: 4px; }
  .ab-fact strong { font-weight: 500; color: var(--cream); font-size: 16px; }
  .ab-fact a { color: var(--gold); }
  @media (min-width: 1000px) { .ab-founder-grid { grid-template-columns: 1.4fr 1fr; gap: 80px; } }

  .ab-social { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
  .ab-social a { display: inline-block; padding: 6px 13px; border: 1px solid var(--line-strong); border-radius: 999px; font-size: 13px; color: var(--cream); }
  .ab-social a:hover { border-color: var(--gold); color: var(--gold); }

  .ab-built { background: var(--black-soft); border-top: 1px solid var(--line); }
  .ab-built-lead { margin-bottom: 36px; }
  .ab-built-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
  .ab-built-card { border: 1px solid var(--line-strong); padding: 30px 28px; display: flex; flex-direction: column; background: rgba(244,247,255,0.02); }
  .ab-built-kind { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 12px; }
  .ab-built-card h3 { font-family: var(--font-display); font-weight: 500; font-size: 30px; line-height: 1.1; color: var(--cream); margin-bottom: 12px; }
  .ab-built-card p { font-size: 15px; line-height: 1.65; color: rgba(244,247,255,0.74); margin-bottom: 20px; flex: 1; }
  .ab-built-card a { color: var(--gold); font-size: 14px; }
  .ab-built-status { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: var(--muted); }
  .ab-built-status i { width: 8px; height: 8px; border-radius: 50%; background: #C6F432; box-shadow: 0 0 0 4px rgba(198,244,50,0.15); }
  @media (min-width: 760px) { .ab-built-grid { grid-template-columns: 1fr 1fr; } }

  .ab-beliefs { background: linear-gradient(180deg, var(--black-soft), var(--navy-deep)); border-top: 1px solid var(--line); }
  .ab-belief-grid { display: grid; grid-template-columns: 1fr; gap: 1px; background: var(--line); border: 1px solid var(--line); }
  .ab-belief { background: var(--navy-deep); padding: 32px 28px; }
  .ab-belief-num { font-family: var(--font-display); font-style: italic; font-size: 22px; color: var(--gold); }
  .ab-belief h3 { font-family: var(--font-display); font-weight: 500; font-size: 27px; line-height: 1.15; color: var(--cream); margin: 16px 0 12px; }
  .ab-belief p { font-size: 15px; line-height: 1.65; color: rgba(244,247,255,0.74); }
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
  .ab-brsa-card p { font-size: 15px; line-height: 1.65; color: rgba(244,247,255,0.74); margin-bottom: 18px; }
  .ab-brsa-card a { color: var(--gold); font-size: 14px; }
  @media (min-width: 800px) { .ab-brsa-grid { grid-template-columns: 1fr 1fr; } }
`
