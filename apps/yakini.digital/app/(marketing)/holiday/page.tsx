import type { Metadata } from 'next'
import { SHARE_IMAGE } from '@/lib/share'
import { SiteShell } from '@/components/SiteShell'
import { HOLIDAY_DEADLINE_LABEL, HOLIDAY_URL, holidayClosed, isHolidayType, type HolidayType } from '@/lib/holiday'
import { HolidayForms } from './HolidayForms'
import Image from 'next/image'
import { FestiveSky } from './Festive'
import { HERO_GIFT_CSS, HeroGift } from './HeroGift'

// ═════════════════════════════════════════════════════════════════════════
// HOLIDAY GIVEAWAY (/holiday). Ad landing page; not linked from the rest of the site.
// No prices or dollar amounts on this page (public Yakini site rule).
// ═════════════════════════════════════════════════════════════════════════

const TITLE = 'Holiday Giveaway: 5 Businesses + 1 Future Founder · Yakini Digital & BRSA Foundation'
const DESCRIPTION =
  'Somebody blessed me, so I want to bless somebody else. BRSA Foundation and Yakini Digital will pick 5 struggling businesses or organizations for free Yakini software and a website revamp, plus 1 future founder we’ll walk through registration, setup and the full build. Apply or nominate by December 15, 2026.'
const OG_TITLE = 'Yakini Holiday Giveaway: 5 Businesses + 1 Future Founder'
const OG_DESCRIPTION = 'Somebody blessed me, so I want to bless somebody else. Free Yakini software + a website revamp for 5 struggling businesses, plus 1 future founder built from the ground up. Apply or nominate by Dec 15, 2026.'

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
    images: [SHARE_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    images: [SHARE_IMAGE.url],
  },
}

const GIFTS = [
  { k: 'software' as const, h: 'Yakini software, set up with you', p: 'Your clients, messages, follow-ups and payments in one place. We set it up with you, so it actually gets used.' },
  { k: 'web' as const, h: 'A website revamp', p: 'A fresh, clear website that looks right on a phone and tells people what you do and how to reach you.' },
  { k: 'person' as const, h: 'A real person in your corner', p: 'Somebody from Yakini walks you through it and stays reachable while you get your footing.' },
]

const STEPS = [
  { h: 'Apply or nominate', p: 'Tell us about your business, one you know that could use a lift, or a future founder with an idea. It takes a few minutes.' },
  { h: 'We read every story', p: `Entries close ${HOLIDAY_DEADLINE_LABEL}. A real person reads each one. No algorithm, no lottery.` },
  { h: 'Six get blessed', p: 'BRSA Foundation and Yakini Digital choose five businesses or organizations and one future founder, and reach out to them directly to get started.' },
]

const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''
const d = (s: string) => ({ ['--d' as string]: s }) as React.CSSProperties
const NO_JS_ERROR_CODES = ['missing', 'failed', 'closed', 'founder_contact']

export default async function HolidayPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  const sentRaw = pick(sp.sent)
  const sent: HolidayType | null = isHolidayType(sentRaw) ? sentRaw : null
  const formRaw = pick(sp.form) || sentRaw
  const initialTab: HolidayType = isHolidayType(formRaw) ? formRaw : 'apply'
  const errorCode = NO_JS_ERROR_CODES.includes(pick(sp.error)) ? pick(sp.error) : null

  return (
    <SiteShell>
      <style>{PAGE_CSS + HERO_GIFT_CSS}</style>
      <div className="hx-root">
        <FestiveSky />

        <header className="hx-hero">
          <div className="hx-hero-bg" aria-hidden="true">
            <Image src="/holiday/backdrop.jpg" alt="" fill priority sizes="100vw" quality={70} className="hx-hero-photo" />
          </div>
          <div className="hx-hero-inner">
            <div className="hx-hero-copy">
              <div className="hx-eyebrow hx-in" style={d('.05s')}>BRSA Foundation × Yakini Digital · Holiday 2026</div>
              <h1 className="hx-h1">
                <span className="hx-h1-a hx-in" style={d('.15s')}>5 Businesses</span>{' '}
                <span className="hx-h1-row hx-in" style={d('.3s')}>
                  <span className="hx-h1-plus">+</span>{' '}
                  <span className="hx-h1-b">1 Future Founder</span>
                </span>
              </h1>
              <p className="hx-h1-tag hx-in" style={d('.45s')}>blessed this holiday season.</p>
              <p className="hx-lede hx-in" style={d('.6s')}>
                BRSA Foundation and Yakini Digital will pick 5 existing businesses or organizations that are going through a
                hard stretch and give them Yakini software plus a website revamp, free. And we’ll pick 1 future founder, someone
                trying to start a business, and walk them through registration, setup and the full build.
              </p>
              <div className="hx-cta hx-in" style={d('.72s')}>
                <a href="#forms" className="hx-btn hx-btn-gold"><span>Apply or nominate</span><span className="hx-arrow" aria-hidden="true">→</span></a>
                <a href="#founder" className="hx-btn hx-btn-ghost"><span>Nominate a future founder</span></a>
              </div>
              <p className="hx-deadline hx-in" style={d('.84s')}>Entries close <b>{HOLIDAY_DEADLINE_LABEL}</b></p>
            </div>
            <div className="hx-hero-art"><HeroGift /></div>
          </div>
        </header>

        <section className="hx-sec hx-quote-sec">
          <div className="hx-inner hx-narrow">
            <figure className="hx-quote">
              <blockquote>Somebody blessed me, so I want to bless somebody else.</blockquote>
              <figcaption>Clarence, founder of Yakini Digital</figcaption>
            </figure>
            <div className="hx-intro">
              <p>
                Everybody who has built something knows the season when it gets heavy: the slow months, the client who
                left, the tools that never quite worked. Somebody stepped in for me when I needed it. This holiday season,
                we want to do the same for five businesses and community organizations, and for one person who’s
                ready to start something of their own.
              </p>
              <p>
                If they like what we build together, they can stay on a monthly plan afterward. If not, no hard feelings.
                The gift is theirs either way.
              </p>
            </div>
          </div>
        </section>

        <section className="hx-sec">
          <div className="hx-inner">
            <div className="hx-tag">What the five businesses receive</div>
            <div className="hx-gift-grid">
              {GIFTS.map((g, i) => (
                <article key={g.k} className="hx-gift">
                  <span className="hx-num">{String(i + 1).padStart(2, '0')}</span>
                  <h2>{g.h}</h2>
                  <p>{g.p}</p>
                </article>
              ))}
            </div>
            <p className="hx-who">For small businesses, nonprofits, churches, and community organizations that are struggling right now.</p>

            <article className="hx-founder">
              <div className="hx-tag">Plus one future founder</div>
              <h2>Got a business idea but haven’t started yet?</h2>
              <p>
                We’ll choose one future founder and walk them through the whole thing: registering the business, getting
                set up, and the full build, including the website and Yakini software. Nominate someone you believe in, or yourself.
              </p>
              <a href="#founder" className="hx-btn hx-btn-gold"><span>Nominate a future founder</span><span className="hx-arrow" aria-hidden="true">→</span></a>
              <div className="hx-founder-art" aria-hidden="true">
                <Image src="/holiday/box-base.png" alt="" width={698} height={659} sizes="(max-width: 899px) 240px, 380px" />
              </div>
            </article>
          </div>
        </section>

        <section className="hx-sec">
          <div className="hx-inner">
            <div className="hx-tag">How it works</div>
            <ol className="hx-steps">
              {STEPS.map((s, i) => (
                <li key={s.h}><span className="hx-step-n">{String(i + 1).padStart(2, '0')}</span><div><h3>{s.h}</h3><p>{s.p}</p></div></li>
              ))}
            </ol>
          </div>
        </section>

        <section className="hx-sec hx-forms-sec" id="forms">
          <div className="hx-inner hx-narrow">
            <div className="hx-tag">Apply or nominate</div>
            <h2 className="hx-forms-h">Tell us their story.</h2>
            <p className="hx-forms-p">Fields marked * are required. Questions? Email <a href="mailto:hello@yakini.digital">hello@yakini.digital</a>.</p>
            <div className="hx-giftwrap">
              <HolidayForms initialTab={initialTab} sent={sent} errorCode={errorCode} closed={holidayClosed()} />
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
  )
}

/* Palette: evergreen night + deep wine, gold foil, ivory card. Colors are literal (not the
   site theme variables) because the site theme re-skins variables after this style block. */
const PAGE_CSS = `
  html:has(.hx-root), body:has(.hx-root) { background: #0A1A14 !important; }
  body:has(.hx-root) .yk-backdrop { display: none; }
  body:has(.hx-root) .yk-nav.scrolled { background: rgba(10,26,20,0.88); border-bottom-color: rgba(226,185,92,0.22); }
  body:has(.hx-root) .yk-nav { background: linear-gradient(rgba(10,26,20,0.9), rgba(10,26,20,0)); }
  body:has(.hx-root) .yk-nav-cta { background: linear-gradient(135deg, #F7E2A4, #D9A94A); color: #4A0A14; }
  body:has(.hx-root) .yk-mobile-menu { background: rgba(10,26,20,0.97); }
  body:has(.hx-root) .yk-footer { background: rgba(8,20,15,0.96); border-top-color: rgba(226,185,92,0.2); }

  .hx-root { position: relative; color: #FBF3E4; font-family: var(--font-body); overflow-x: clip; }
  .hx-root a { color: inherit; }

  /* ── sky ── */
  .hx-sky { position: fixed; inset: 0; z-index: -1; pointer-events: none; overflow: hidden;
    background:
      radial-gradient(1000px 700px at 0% 70%, rgba(110,15,31,0.30), transparent 62%),
      radial-gradient(900px 760px at 100% 30%, rgba(16,70,48,0.35), transparent 60%),
      linear-gradient(180deg, #070F0C 0%, #08130F 50%, #0B0809 100%); }
  .hx-sky-glow { position: absolute; inset: 0; background: radial-gradient(600px 300px at 70% 30%, rgba(255,205,120,0.10), transparent 70%); }
  .hx-bokeh { position: absolute; border-radius: 50%; transform: translate(-50%, -50%); animation: hx-drift 10s ease-in-out infinite alternate; will-change: transform, opacity; }
  @keyframes hx-drift { 0% { transform: translate(-50%, -50%) scale(0.92); opacity: 0.55; } 100% { transform: translate(-46%, -56%) scale(1.08); opacity: 1; } }
  .hx-snow { position: absolute; inset: 0; }
  .hx-flake { position: absolute; top: -12px; border-radius: 50%; background: #FFFDF6; box-shadow: 0 0 6px rgba(255,255,255,0.6); will-change: transform; }
  .hx-flake-a { animation: hx-fall-a 16s linear infinite; }
  .hx-flake-b { animation: hx-fall-b 16s linear infinite; }
  @keyframes hx-fall-a { 0% { transform: translate3d(0,-2vh,0); } 50% { transform: translate3d(22px,52vh,0); } 100% { transform: translate3d(-6px,106vh,0); } }
  @keyframes hx-fall-b { 0% { transform: translate3d(0,-2vh,0); } 50% { transform: translate3d(-20px,52vh,0); } 100% { transform: translate3d(8px,106vh,0); } }
  @media (max-width: 700px) {
    .hx-bokeh:nth-child(n+11) { display: none; }
    .hx-flake:nth-child(3n) { display: none; }
  }

  /* ── hero: photographic night backdrop, editorial type, the opening gift ── */
  .hx-hero { position: relative; padding: 104px 22px 40px; isolation: isolate; }
  @media (min-width: 900px) { .hx-hero { padding: 150px 40px 96px; min-height: 100svh; display: flex; align-items: center; } }
  .hx-hero-bg { position: absolute; inset: 0; z-index: -1; overflow: hidden; }
  .hx-hero-photo { object-fit: cover; object-position: 70% 40%; opacity: 0.9; }
  .hx-hero-bg::after { content: ''; position: absolute; inset: 0;
    background:
      linear-gradient(90deg, rgba(7,15,12,0.92) 0%, rgba(7,15,12,0.62) 42%, rgba(7,15,12,0.12) 75%),
      linear-gradient(180deg, rgba(7,15,12,0.55) 0%, transparent 22%, transparent 68%, #070F0C 100%); }
  @media (max-width: 899px) { .hx-hero-bg::after { background: linear-gradient(180deg, rgba(7,15,12,0.5) 0%, rgba(7,15,12,0.15) 30%, rgba(7,15,12,0.78) 58%, #070F0C 100%); } }
  .hx-hero-inner { width: 100%; max-width: 1280px; margin: 0 auto; display: grid; gap: 8px; align-items: center; }
  @media (min-width: 900px) { .hx-hero-inner { grid-template-columns: 1.05fr 0.95fr; gap: 48px; } }
  .hx-eyebrow { display: flex; align-items: center; gap: 14px; color: #E2B95C; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; }
  .hx-eyebrow::before { content: ''; width: 36px; height: 1px; flex-shrink: 0; background: linear-gradient(90deg, transparent, #E2B95C); }
  @media (max-width: 520px) { .hx-eyebrow { font-size: 9.5px; letter-spacing: 0.06em; gap: 8px; white-space: nowrap; } .hx-eyebrow::before { width: 14px; } }
  .hx-h1 { margin: 22px 0 0; font-family: var(--font-display); font-weight: 400; line-height: 0.94; letter-spacing: -0.02em; }
  .hx-h1-a, .hx-h1-row { display: block; }
  .hx-h1-a { font-size: clamp(56px, 8.6vw, 124px); color: #FBF3E4; font-weight: 300; }
  .hx-h1-row { margin-top: 4px; font-size: clamp(44px, 6.6vw, 96px); font-style: italic; font-weight: 400;
    background: linear-gradient(100deg, #B9893A 0%, #F4DFA6 30%, #E2B95C 50%, #FFF0C8 62%, #C99A45 100%);
    background-size: 200% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; padding-bottom: 0.08em; }
  .hx-h1-row.hx-in { animation: hx-in 1s cubic-bezier(.2,.7,.2,1) both, hx-shimmer 9s ease-in-out infinite; animation-delay: var(--d, 0s), 1.4s; }
  @keyframes hx-shimmer { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
  .hx-h1-plus { font-style: normal; font-weight: 300; margin-right: 0.04em; }
  .hx-h1-tag { margin-top: 16px; font-family: var(--font-display); font-style: italic; font-size: clamp(22px, 2.4vw, 30px); color: rgba(251,243,228,0.82); }
  .hx-lede { margin-top: 22px; max-width: 560px; font-size: clamp(16px, 1.25vw, 18px); line-height: 1.7; color: rgba(251,243,228,0.78); font-weight: 300; }
  .hx-cta { margin-top: 32px; display: flex; flex-wrap: wrap; gap: 12px; }
  .hx-deadline { margin-top: 22px; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(251,243,228,0.6); }
  .hx-deadline b { color: #E2B95C; font-weight: 500; }
  .hx-hero-art { width: 100%; max-width: 640px; justify-self: center; }
  @media (max-width: 899px) { .hx-hero-art { order: -1; max-width: 460px; margin: 0 auto 4px; } }

  /* entrance */
  .hx-in { animation: hx-in .9s cubic-bezier(.2,.7,.2,1) both; animation-delay: var(--d, 0s); }
  @keyframes hx-in { from { opacity: 0; transform: translateY(22px); filter: blur(4px); } to { opacity: 1; transform: none; filter: blur(0); } }

  /* buttons: pills, champagne gold and a fine outline */
  .hx-btn { position: relative; overflow: hidden; display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 52px; padding: 14px 26px; border-radius: 999px; font: inherit; font-size: 15px; font-weight: 500; letter-spacing: 0.01em; text-decoration: none; cursor: pointer; border: 1px solid transparent; transition: transform .3s ease, box-shadow .3s ease, background .3s ease, border-color .3s ease, color .3s ease; }
  .hx-btn::after { content: ''; position: absolute; top: 0; left: -120%; width: 60%; height: 100%; background: linear-gradient(100deg, transparent, rgba(255,255,255,0.35), transparent); transform: skewX(-20deg); transition: left .7s ease; }
  .hx-btn:hover::after { left: 140%; }
  .hx-btn:hover { transform: translateY(-2px); }
  .hx-btn:active { transform: translateY(0) scale(0.98); }
  .hx-btn-gold { background: linear-gradient(135deg, #F1DBA0, #D8AE5B); color: #1E0B0E !important; box-shadow: 0 10px 30px rgba(216,174,91,0.22); }
  .hx-btn-gold:hover { box-shadow: 0 16px 40px rgba(216,174,91,0.35); }
  .hx-btn-ghost { border-color: rgba(251,243,228,0.28); color: #FBF3E4 !important; background: rgba(7,15,12,0.3); backdrop-filter: blur(6px); }
  .hx-btn-ghost:hover { border-color: #E2B95C; color: #F4DFA6 !important; }
  .hx-btn-red { background: #6E0F1F; color: #FFF6E2 !important; box-shadow: 0 10px 26px rgba(110,15,31,0.28); }
  .hx-btn-red:hover { background: #8E1B2C; box-shadow: 0 16px 36px rgba(110,15,31,0.38); }
  .hx-btn[disabled] { opacity: 0.65; cursor: default; transform: none; }
  .hx-arrow { transition: transform .25s ease; }
  .hx-btn:hover .hx-arrow { transform: translateX(4px); }

  /* sections */
  .hx-sec { position: relative; padding: 52px 22px; }
  @media (min-width: 900px) { .hx-sec { padding: 88px 40px; } }
  .hx-inner { max-width: 1240px; margin: 0 auto; }
  .hx-narrow { max-width: 880px; }
  .hx-tag { display: flex; align-items: center; gap: 12px; font-family: var(--font-mono); font-size: 11.5px; letter-spacing: 0.22em; text-transform: uppercase; color: #E2B95C; margin-bottom: 18px; }
  .hx-tag::before { content: ''; width: 28px; height: 1px; background: linear-gradient(90deg, transparent, #E2B95C); }

  .hx-quote { position: relative; margin: 0; padding: 4px 0 4px 28px; border-left: 1px solid rgba(226,185,92,0.6); }
  .hx-quote blockquote { margin: 0; font-family: var(--font-display); font-style: italic; font-weight: 300; font-size: clamp(34px, 5vw, 60px); line-height: 1.08; color: #FFF6E2; }
  .hx-quote figcaption { margin-top: 18px; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #E2B95C; }
  .hx-intro { margin-top: 28px; display: grid; gap: 16px; }
  .hx-intro p { font-size: clamp(16.5px, 1.4vw, 19px); line-height: 1.7; color: rgba(251,243,228,0.84); }

  .hx-gift-grid { display: grid; gap: 0; border-top: 1px solid rgba(226,185,92,0.28); }
  @media (min-width: 860px) { .hx-gift-grid { grid-template-columns: repeat(3, 1fr); } }
  .hx-gift { padding: 28px 0 30px; border-bottom: 1px solid rgba(251,243,228,0.08); transition: border-color .4s ease; }
  @media (min-width: 860px) { .hx-gift { padding: 34px 32px 8px 0; border-bottom: 0; } .hx-gift + .hx-gift { padding-left: 32px; border-left: 1px solid rgba(251,243,228,0.08); } }
  .hx-num { font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.18em; color: #E2B95C; }
  .hx-gift h2 { margin-top: 14px; font-family: var(--font-display); font-weight: 400; font-size: clamp(28px, 2.6vw, 34px); line-height: 1.08; color: #FFF6E2; }
  .hx-gift p { margin-top: 10px; font-size: 15.5px; line-height: 1.65; color: rgba(251,243,228,0.72); font-weight: 300; }
  .hx-who { margin-top: 20px; font-size: 16px; color: #FBF3E4; }

  .hx-founder { position: relative; overflow: hidden; margin-top: 48px; padding: 36px 26px; border-radius: 28px; border: 1px solid rgba(226,185,92,0.35);
    background: radial-gradient(700px 360px at 100% 0%, rgba(142,27,44,0.45), transparent 70%), linear-gradient(160deg, rgba(24,14,16,0.85), rgba(8,18,14,0.85));
    box-shadow: 0 30px 80px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06); }
  @media (min-width: 900px) { .hx-founder { padding: 52px 56px; } }
  .hx-founder h2 { position: relative; font-family: var(--font-display); font-weight: 400; font-size: clamp(34px, 4vw, 54px); line-height: 1.02; color: #FFF6E2; max-width: 18ch; }
  .hx-founder-art { position: relative; width: 230px; margin: 28px auto -64px; filter: drop-shadow(0 20px 40px rgba(0,0,0,0.5)); }
  .hx-founder-art img { width: 100%; height: auto; display: block; }
  @media (min-width: 900px) { .hx-founder-art { position: absolute; right: 64px; bottom: -40px; width: 360px; margin: 0; } }
  .hx-founder > :not(.hx-founder-art) { position: relative; z-index: 1; }
  .hx-founder p { position: relative; margin: 16px 0 28px; font-size: 16.5px; line-height: 1.7; color: rgba(251,243,228,0.78); max-width: 620px; font-weight: 300; }
  .hx-steps { list-style: none; padding: 0; margin: 0; display: grid; gap: 16px; }
  @media (min-width: 860px) { .hx-steps { grid-template-columns: repeat(3, 1fr); gap: 22px; } }
  .hx-steps li { display: flex; flex-direction: column; gap: 14px; padding-top: 22px; border-top: 1px solid rgba(226,185,92,0.35); }
  .hx-step-n { font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.18em; color: #E2B95C; }
  .hx-steps h3 { font-family: var(--font-display); font-weight: 400; font-size: 28px; color: #FFF6E2; margin-bottom: 6px; }
  .hx-steps p { font-size: 15.5px; line-height: 1.65; color: rgba(251,243,228,0.72); font-weight: 300; }

  /* ── forms: a light gift card ── */
  .hx-forms-sec { padding-bottom: 90px; scroll-margin-top: 80px; }
  .hx-forms-h { font-family: var(--font-display); font-weight: 400; font-size: clamp(38px, 5vw, 58px); line-height: 1; color: #FFF6E2; }
  .hx-forms-p { margin-top: 12px; font-size: 15px; color: rgba(251,243,228,0.8); }
  .hx-forms-p a { color: #F3D78E; }
  .hx-giftwrap { position: relative; margin-top: 36px; padding: 26px 16px 22px; border-radius: 28px; background: #FBF6EC; color: #2B1B14;
    box-shadow: 0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(226,185,92,0.45), inset 0 0 0 7px #FBF6EC, inset 0 0 0 8px rgba(201,150,59,0.28); }
  @media (min-width: 620px) { .hx-giftwrap { padding: 38px 40px 32px; } }

  .hg-forms { scroll-margin-top: 96px; }
  .hg-tabs { display: grid; grid-template-columns: 1fr; gap: 6px; padding: 6px; border-radius: 18px; background: #F3E7CF; border: 1px solid #E5D2AC; }
  @media (min-width: 620px) { .hg-tabs { grid-template-columns: repeat(3, 1fr); } }
  .hg-tab { display: flex; align-items: center; justify-content: center; text-align: center; min-height: 46px; padding: 10px; border-radius: 13px; font-size: 14.5px; font-weight: 600; line-height: 1.25; color: #6B4A3A !important; text-decoration: none; transition: background .25s ease, color .25s ease, box-shadow .25s ease, transform .2s ease; }
  .hg-tab:hover { color: #7E1426 !important; background: rgba(255,255,255,0.6); }
  .hg-tab.on { background: #6E0F1F; color: #FFF6E2 !important; box-shadow: 0 6px 18px rgba(110,15,31,0.3), inset 0 0 0 1px rgba(217,169,74,0.6); }
  .hg-panel { margin-top: 18px; scroll-margin-top: 290px; }
  @media (min-width: 620px) { .hg-panel { scroll-margin-top: 180px; } }
  .hg-panel[hidden] { display: none; }
  .hg-panel:not([hidden]) { animation: hx-panel .45s ease both; }
  @keyframes hx-panel { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  .hg-card { padding: 4px 2px; }
  .hg-form h3, .hg-done h3 { font-family: var(--font-display); font-weight: 500; font-size: 32px; line-height: 1.05; color: #4A0A14; }
  .hg-form-sub { margin-top: 8px; font-size: 15px; line-height: 1.55; color: #6B5A4E; }
  .hg-group { margin-top: 26px; display: flex; align-items: center; gap: 10px; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #9C6F22; }
  .hg-group::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, #E5D2AC, transparent); }
  .hg-grid { display: grid; gap: 16px; margin-top: 16px; }
  @media (min-width: 620px) { .hg-grid { grid-template-columns: 1fr 1fr; } .hg-wide { grid-column: 1 / -1; } }
  .hg-field { display: grid; gap: 7px; }
  .hg-field label { font-size: 13.5px; font-weight: 600; color: #3A2418; transition: color .2s ease; }
  .hg-field:focus-within label { color: #8E1B2C; }
  .hg-field label b { color: #B4243A; }
  .hg-field label i { font-style: normal; color: #8A7666; font-weight: 400; }
  .hg-field input, .hg-field textarea { font: inherit; font-size: 16px; color: #2B1B14; background: #FFFFFF; border: 1.5px solid #E2D3B8; border-radius: 14px; padding: 13px 14px; width: 100%; box-sizing: border-box; transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease; }
  .hg-field input::placeholder, .hg-field textarea::placeholder { color: #B3A08C; }
  .hg-field input:hover, .hg-field textarea:hover { border-color: #D4BC8E; }
  .hg-field textarea { resize: vertical; }
  .hg-field input:focus, .hg-field textarea:focus { outline: none; border-color: #C9963B; box-shadow: 0 0 0 4px rgba(217,169,74,0.22); transform: translateY(-1px); }
  .hg-field small { font-size: 12.5px; color: #7A6656; }
  .hg-bad input, .hg-bad textarea { border-color: #C2364B; background: #FFF6F6; }
  .hg-bad input, .hg-bad textarea { animation: hx-shake .35s ease; }
  @keyframes hx-shake { 0%, 100% { transform: none; } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
  .hg-field small.hg-err-msg { color: #A3162B; font-weight: 500; }
  .hg-hp { position: absolute; left: -10000px; top: auto; width: 1px; height: 1px; overflow: hidden; }
  .hg-self { margin-top: 20px; display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border: 1.5px solid #E5D2AC; border-radius: 14px; background: #FFF3DE; cursor: pointer; font-size: 15px; color: #3A2418; line-height: 1.45; transition: border-color .2s ease, background .2s ease; }
  .hg-self:hover { border-color: #D4BC8E; }
  .hg-self:has(input:checked) { border-color: #B4243A; background: #FFEDEA; }
  .hg-self input { width: 22px; height: 22px; margin: 0; flex-shrink: 0; accent-color: #8E1B2C; }
  .hg-self b { color: #8E1B2C; }
  .hg-self small { display: block; margin-top: 4px; font-size: 13px; color: #7A6656; }
  .hg-alert { margin-top: 20px; padding: 12px 14px; border-radius: 12px; border: 1px solid #E8A3AD; background: #FDECEE; color: #7E1426; font-size: 14px; }
  .hg-actions { margin-top: 24px; display: grid; gap: 14px; }
  .hg-actions .hx-btn { width: 100%; }
  @media (min-width: 620px) { .hg-actions .hx-btn { width: auto; justify-self: start; padding-left: 30px; padding-right: 30px; } }
  .hg-fine { font-size: 12.5px; line-height: 1.55; color: #7A6656; }

  .hg-done { position: relative; text-align: left; padding: 8px 2px; }
  .hg-done-mark { width: 52px; height: 52px; border-radius: 50%; display: grid; place-items: center; background: radial-gradient(circle at 35% 30%, #FFF3CF, #D9A94A 60%, #9C6F22); color: #4A0A14; font-size: 24px; font-weight: 700; margin-bottom: 16px; box-shadow: 0 8px 24px rgba(217,169,74,0.45); animation: hx-pop .6s cubic-bezier(.2,1.6,.4,1) both; }
  @keyframes hx-pop { from { transform: scale(0.2); opacity: 0; } to { transform: none; opacity: 1; } }
  .hg-done p { margin: 12px 0 20px; color: #5E4B3F; line-height: 1.6; }
  .hx-confetti { position: absolute; left: 26px; top: 26px; width: 0; height: 0; pointer-events: none; z-index: 2; }
  .hx-confetti i { position: absolute; left: 0; top: 0; width: var(--w); height: var(--h); background: var(--c); border-radius: 2px; opacity: 0; animation: hx-burst 1.6s cubic-bezier(.15,.7,.3,1) var(--delay) forwards; }
  @keyframes hx-burst { 0% { opacity: 1; transform: translate(0,0) rotate(0deg); } 70% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--x), var(--y)) rotate(var(--r)); } }

  .hg-share { margin-top: 4px; padding: 20px; border: 1px solid #E5D2AC; border-radius: 18px; background: linear-gradient(180deg, #FFF3DE, #FFEFD3); }
  .hg-share h4 { font-family: var(--font-display); font-weight: 600; font-size: 25px; color: #4A0A14; margin: 0; }
  .hg-done .hg-share p { margin: 8px 0 16px; font-size: 14.5px; }
  .hg-share-native { width: 100%; margin-bottom: 12px; }
  .hg-share-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  @media (min-width: 620px) { .hg-share-row { grid-template-columns: repeat(4, 1fr); } }
  .hg-share-btn { display: flex; align-items: center; justify-content: center; min-height: 46px; padding: 10px 12px; border-radius: 12px; border: 1.5px solid #E2D3B8; background: #FFFFFF; color: #4A0A14 !important; font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; transition: border-color .2s ease, transform .2s ease, box-shadow .2s ease; }
  .hg-share-btn:hover { border-color: #C9963B; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(110,15,31,0.12); }
  .hg-share-manual span { color: #8E1B2C; word-break: break-all; }
  .hg-again { display: inline-block; margin-top: 18px; background: none; border: 0; padding: 0; color: #8E1B2C !important; font: inherit; font-size: 14px; font-weight: 600; text-decoration: underline; cursor: pointer; }

  @media (prefers-reduced-motion: reduce) {
    .hx-root *, .hx-root *::before, .hx-root *::after { animation: none !important; transition: none !important; }
    .hx-snow, .hx-confetti { display: none; }
    .hx-h1-row { background-position: 30% 50%; }
  }
`
