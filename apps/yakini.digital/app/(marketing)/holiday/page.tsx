import type { Metadata } from 'next'
import { SiteShell } from '@/components/SiteShell'
import { SECTIONS_CSS } from '@/components/site/content'
import { HOLIDAY_DEADLINE_LABEL, HOLIDAY_URL, holidayClosed, type HolidayType } from '@/lib/holiday'
import { HolidayForms } from './HolidayForms'

// ═════════════════════════════════════════════════════════════════════════
// HOLIDAY GIVEAWAY (/holiday). Ad landing page; not linked from the rest of the site.
// No prices or dollar amounts on this page (public Yakini site rule).
// ═════════════════════════════════════════════════════════════════════════

const TITLE = 'Holiday Giveaway · Yakini Digital & BRSA Foundation'
const DESCRIPTION =
  'Somebody blessed me, so I want to bless somebody else. BRSA Foundation and Yakini Digital will pick 5 struggling businesses or organizations for free Yakini software and a website revamp. Apply or nominate someone by December 15, 2026.'
const OG_TITLE = 'Nominate a business for the Yakini Holiday Giveaway'
const OG_DESCRIPTION = 'Somebody blessed me, so I want to bless somebody else. Free Yakini software + a website revamp for 5 struggling businesses or organizations. Apply or nominate by Dec 15, 2026.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: HOLIDAY_URL },
  robots: { index: true, follow: true },
  openGraph: {
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    url: HOLIDAY_URL,
    siteName: 'Yakini Digital',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: OG_TITLE,
    description: OG_DESCRIPTION,
  },
}

const GIFTS = [
  { k: '01', h: 'Yakini software, set up with you', p: 'Your clients, messages, follow-ups and payments in one place. We set it up with you, so it actually gets used.' },
  { k: '02', h: 'A website revamp', p: 'A fresh, clear website that looks right on a phone and tells people what you do and how to reach you.' },
  { k: '03', h: 'A real person in your corner', p: 'Somebody from Yakini walks you through it and stays reachable while you get your footing.' },
]

const STEPS = [
  { h: 'Apply or nominate', p: 'Tell us about your business, or about one you know that could use a lift. It takes a few minutes.' },
  { h: 'We read every story', p: `Entries close ${HOLIDAY_DEADLINE_LABEL}. A real person reads each one. No algorithm, no lottery.` },
  { h: 'Five get blessed', p: 'BRSA Foundation and Yakini Digital choose five and reach out to them directly to get started.' },
]

const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''

export default async function HolidayPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  const sentRaw = pick(sp.sent)
  const sent: HolidayType | null = sentRaw === 'apply' || sentRaw === 'nominate' ? sentRaw : null
  const formRaw = pick(sp.form) || sentRaw
  const initialTab: HolidayType = formRaw === 'nominate' ? 'nominate' : 'apply'
  const errorCode = ['missing', 'failed', 'closed'].includes(pick(sp.error)) ? pick(sp.error) : null

  return (
    <SiteShell>
      <style>{SECTIONS_CSS + PAGE_CSS}</style>
      <header className="yk-page-header hg-header">
        <div className="yk-page-header-inner">
          <div className="yk-eyebrow"><span className="yk-eyebrow-dot" /><span>HOLIDAY GIVEAWAY · 2026</span></div>
          <h1 className="yk-page-h1 hg-h1">
            We’re blessing <span className="yk-gold yk-italic">five businesses</span> this season.
          </h1>
          <p className="yk-page-sub hg-sub">
            BRSA Foundation and Yakini Digital will pick 5 businesses or organizations that are going through a hard
            stretch and give them Yakini software plus a website revamp, free. Apply for yours, or nominate someone who deserves it.
          </p>
          <div className="hg-hero-cta">
            <a href="#forms" className="hm-btn hm-btn-gold"><span>Apply or nominate</span><span className="yk-btn-arrow">→</span></a>
            <span className="hg-deadline">Entries close <b>{HOLIDAY_DEADLINE_LABEL}</b></span>
          </div>
        </div>
      </header>

      <section className="yk-section hg-quote-sec">
        <div className="yk-section-inner hg-narrow">
          <blockquote className="hg-quote">
            <p>“Somebody blessed me, so I want to bless somebody else.”</p>
            <footer>Clarence, founder of Yakini Digital</footer>
          </blockquote>
          <div className="hg-intro">
            <p>
              Everybody who has built something knows the season when it gets heavy: the slow months, the client who
              left, the tools that never quite worked. Somebody stepped in for me when I needed it. This holiday season,
              we want to do the same for five businesses and community organizations.
            </p>
            <p>
              If they like what we build together, they can stay on a monthly plan afterward. If not, no hard feelings.
              The gift is theirs either way.
            </p>
          </div>
        </div>
      </section>

      <section className="yk-section hg-gifts-sec">
        <div className="yk-section-inner">
          <div className="yk-section-tag">WHAT THE FIVE RECEIVE</div>
          <div className="hg-gifts">
            {GIFTS.map((g) => (
              <article key={g.k} className="hg-gift">
                <span className="hg-gift-k">{g.k}</span>
                <h2>{g.h}</h2>
                <p>{g.p}</p>
              </article>
            ))}
          </div>
          <p className="hg-who">
            For small businesses, nonprofits, churches, and community organizations that are struggling right now.
          </p>
        </div>
      </section>

      <section className="yk-section hg-steps-sec">
        <div className="yk-section-inner">
          <div className="yk-section-tag">HOW IT WORKS</div>
          <ol className="hg-steps">
            {STEPS.map((s, i) => (
              <li key={s.h}><span className="hg-step-n">{i + 1}</span><div><h3>{s.h}</h3><p>{s.p}</p></div></li>
            ))}
          </ol>
        </div>
      </section>

      <section className="yk-section hg-forms-sec" id="forms">
        <div className="yk-section-inner hg-narrow">
          <div className="yk-section-tag">APPLY OR NOMINATE</div>
          <h2 className="hg-forms-h">Tell us their story.</h2>
          <p className="hg-forms-p">Fields marked * are required. Questions? Email <a href="mailto:hello@yakini.digital">hello@yakini.digital</a>.</p>
          <HolidayForms initialTab={initialTab} sent={sent} errorCode={errorCode} closed={holidayClosed()} />
        </div>
      </section>
    </SiteShell>
  )
}

const PAGE_CSS = `
  .hg-header { padding-bottom: 72px; }
  .hg-h1 { max-width: 16ch; font-size: clamp(46px, 8vw, 112px); }
  .hg-sub { max-width: 680px; }
  .hg-hero-cta { margin-top: 36px; display: flex; flex-wrap: wrap; align-items: center; gap: 16px 24px; }
  .hg-deadline { font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); }
  .hg-deadline b { color: var(--gold); font-weight: 600; }
  .hg-narrow { max-width: 860px; }
  .hg-quote-sec { padding-top: 72px; padding-bottom: 40px; }
  .hg-quote { margin: 0; border-left: 2px solid var(--gold); padding-left: 24px; }
  .hg-quote p { font-family: var(--font-display); font-style: italic; font-size: clamp(30px, 4.6vw, 54px); line-height: 1.1; color: var(--cream); }
  .hg-quote footer { margin-top: 14px; font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--gold); }
  .hg-intro { margin-top: 36px; display: grid; gap: 18px; }
  .hg-intro p { font-size: clamp(17px, 1.4vw, 19px); line-height: 1.7; color: var(--muted); }
  .hg-gifts-sec, .hg-steps-sec { padding-top: 48px; padding-bottom: 48px; }
  .hg-gifts { display: grid; gap: 16px; grid-template-columns: 1fr; margin-top: 8px; }
  @media (min-width: 860px) { .hg-gifts { grid-template-columns: repeat(3, 1fr); gap: 20px; } }
  .hg-gift { border: 1px solid var(--line); border-radius: 20px; padding: 26px; background: rgba(6,11,36,0.6); backdrop-filter: blur(10px); }
  .hg-gift-k { font-family: var(--font-display); font-style: italic; font-size: 26px; color: var(--gold); }
  .hg-gift h2 { margin-top: 10px; font-family: var(--font-display); font-weight: 400; font-size: 28px; line-height: 1.1; color: var(--cream); }
  .hg-gift p { margin-top: 10px; font-size: 15px; line-height: 1.6; color: var(--muted); }
  .hg-who { margin-top: 24px; font-size: 16px; color: var(--cream); }
  .hg-steps { list-style: none; padding: 0; margin: 8px 0 0; display: grid; gap: 14px; }
  @media (min-width: 860px) { .hg-steps { grid-template-columns: repeat(3, 1fr); gap: 20px; } }
  .hg-steps li { display: flex; gap: 16px; align-items: flex-start; border-top: 1px solid var(--gold); padding-top: 18px; }
  .hg-step-n { font-family: var(--font-display); font-style: italic; font-size: 34px; line-height: 1; color: var(--gold); min-width: 26px; }
  .hg-steps h3 { font-family: var(--font-display); font-weight: 500; font-size: 24px; color: var(--cream); margin-bottom: 6px; }
  .hg-steps p { font-size: 15px; line-height: 1.6; color: var(--muted); }
  .hg-forms-sec { padding-top: 56px; scroll-margin-top: 80px; }
  .hg-forms-h { font-family: var(--font-display); font-weight: 400; font-size: clamp(36px, 5vw, 56px); line-height: 1; color: var(--cream); }
  .hg-forms-p { margin-top: 12px; font-size: 15px; color: var(--muted); }
  .hg-forms-p a { color: var(--gold); }
  .hg-forms { margin-top: 28px; scroll-margin-top: 96px; }
  .hg-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 6px; border: 1px solid var(--line-strong); border-radius: 16px; background: rgba(6,11,36,0.6); }
  .hg-tab { text-align: center; padding: 13px 10px; border-radius: 11px; font-size: 14px; font-weight: 600; line-height: 1.25; color: var(--muted); }
  .hg-tab.on { background: var(--gold); color: var(--navy-deep); }
  .hg-panel { margin-top: 16px; scroll-margin-top: 90px; }
  .hg-panel[hidden] { display: none; }
  .hg-card { border: 1px solid var(--line); border-radius: 22px; padding: 24px 20px; background: rgba(6,11,36,0.78); backdrop-filter: blur(14px); }
  @media (min-width: 620px) { .hg-card { padding: 32px; } }
  .hg-form h3, .hg-done h3 { font-family: var(--font-display); font-weight: 400; font-size: 32px; line-height: 1.05; color: var(--cream); }
  .hg-form-sub { margin-top: 8px; font-size: 15px; color: var(--muted); }
  .hg-group { margin-top: 26px; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold); }
  .hg-grid { display: grid; gap: 16px; margin-top: 16px; }
  @media (min-width: 620px) { .hg-grid { grid-template-columns: 1fr 1fr; } .hg-wide { grid-column: 1 / -1; } }
  .hg-field { display: grid; gap: 7px; }
  .hg-field label { font-size: 13px; font-weight: 500; color: var(--cream); }
  .hg-field label b { color: var(--gold); }
  .hg-field label i { font-style: normal; color: var(--muted); font-weight: 400; }
  .hg-field input, .hg-field textarea { font: inherit; font-size: 16px; color: var(--cream); background: rgba(244,247,255,0.06); border: 1px solid var(--line-strong); border-radius: 12px; padding: 13px 14px; width: 100%; box-sizing: border-box; }
  .hg-field textarea { resize: vertical; }
  .hg-field input:focus, .hg-field textarea:focus { outline: none; border-color: var(--gold); box-shadow: 0 0 0 3px rgba(198,244,50,0.25); }
  .hg-field small { font-size: 12.5px; color: var(--muted); }
  .hg-bad input, .hg-bad textarea { border-color: #FF8A73; }
  .hg-field small.hg-err-msg { color: #FFB4A2; }
  .hg-hp { position: absolute; left: -10000px; top: auto; width: 1px; height: 1px; overflow: hidden; }
  .hg-alert { margin-top: 20px; padding: 12px 14px; border-radius: 12px; border: 1px solid rgba(255,138,115,0.5); background: rgba(255,138,115,0.1); color: #FFD3C8; font-size: 14px; }
  .hg-actions { margin-top: 24px; display: grid; gap: 14px; }
  .hg-actions .hm-btn { justify-self: stretch; justify-content: center; cursor: pointer; font: inherit; }
  @media (min-width: 620px) { .hg-actions .hm-btn { justify-self: start; } }
  .hg-actions .hm-btn[disabled] { opacity: 0.6; cursor: default; }
  .hg-fine { font-size: 12.5px; line-height: 1.55; color: var(--muted); }
  .hg-done { text-align: left; }
  .hg-done-mark { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; background: var(--gold); color: var(--navy-deep); font-size: 22px; font-weight: 700; margin-bottom: 16px; }
  .hg-done p { margin: 12px 0 20px; color: var(--muted); line-height: 1.6; }
  .hg-share { margin-top: 4px; padding: 20px; border: 1px solid var(--line-strong); border-radius: 16px; background: rgba(198,244,50,0.06); }
  .hg-share h4 { font-family: var(--font-display); font-weight: 500; font-size: 24px; color: var(--cream); margin: 0; }
  .hg-share p { margin: 8px 0 16px; font-size: 14.5px; }
  .hg-share-native { width: 100%; justify-content: center; cursor: pointer; font: inherit; margin-bottom: 12px; }
  .hg-share-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  @media (min-width: 620px) { .hg-share-row { grid-template-columns: repeat(4, 1fr); } }
  .hg-share-btn { display: flex; align-items: center; justify-content: center; min-height: 46px; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--line-strong); background: rgba(244,247,255,0.05); color: var(--cream); font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; }
  .hg-share-btn:hover { border-color: var(--gold); color: var(--gold); }
  .hg-share-manual span { color: var(--gold); word-break: break-all; }
  .hg-again { margin-top: 18px; background: none; border: 0; padding: 0; color: var(--muted); font: inherit; font-size: 14px; text-decoration: underline; cursor: pointer; }
`
