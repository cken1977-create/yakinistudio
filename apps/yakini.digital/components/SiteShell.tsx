'use client'

import { useState, useEffect, ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PORTAL_LOGIN_URL, START_URL } from '@/lib/pricing'

// ═════════════════════════════════════════════════════════════════════════
// YAKINI SITE SHELL: header, mobile menu and footer for every page.
// The site's one job is to lead people into the portal (START_URL);
// custom builds are the second lane (/custom-builds, Book a call = /apply).
// ═════════════════════════════════════════════════════════════════════════

// Nov 9 2026 home makeover: / is the immersive walkthrough; every other page wears its look
// (night navy, gold Y mark, lime accents, a photoreal room behind each page header).
export const NAV_LINKS = [
  { href: '/portal', label: 'The portal' },
  { href: '/pricing', label: 'Plans' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/custom-builds', label: 'Custom builds' },
  { href: '/watch', label: 'Watch' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const

// Photoreal room behind each page header (stills cut from the walkthrough's room panoramas).
const ROOM_FOR_PATH: [string, string][] = [
  ['/pricing', 'landlord'], ['/how-it-works', 'trucking'], ['/custom-builds', 'tree'], ['/about', 'nonprofit'],
  ['/apply', 'foodtruck'], ['/contact', 'foodtruck'], ['/watch', 'realestate'], ['/portal', 'grower'],
]
function roomFor(path: string) {
  const hit = ROOM_FOR_PATH.find(([p]) => path === p || path.startsWith(p + '/'))
  return `/art/rooms/${hit ? hit[1] : 'landlord'}.jpg`
}

function YMark({ size = 30 }: { size?: number }) {
  return (
    <svg className="yk-y" width={size} height={size * 0.93} viewBox="-30 -30 960 858" aria-hidden="true">
      <defs><linearGradient id="ykyg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F3D98B" /><stop offset=".5" stopColor="#C9A14A" /><stop offset="1" stopColor="#8E6A24" /></linearGradient></defs>
      <g fill="url(#ykyg)"><polygon opacity=".62" points="0,0 298,298 298,432 0,134" /><polygon opacity=".62" points="900,0 900,134 602,432 602,298" /><polygon opacity=".62" points="332,366 432,466 432,798 332,698" /><polygon points="48,0 216,0 426,210 342,294" /><polygon points="684,0 852,0 493,359 568,359 568,554 349,335" /><polygon points="468,502 568,602 568,698 468,798" /></g>
    </svg>
  )
}

export const TAGLINE = 'SET UP WITH YOU · HERE TO STAY'

export function BrandMark() {
  return (
    <Link href="/" className="yk-brand" aria-label="Yakini home">
      {/* The Yakini logo, white + blue refresh (/yakini-lockup-blue.svg). The original gold
          lockup (/yakini-lockup.jpg) stays in the repo, unused here. */}
      {/* Same gold Y mark and wordmark as the immersive home page. The blue lockup
          (/yakini-lockup-blue.svg) and gold lockup (/yakini-lockup.jpg) stay in the repo. */}
      <YMark />
      <span className="yk-brand-word">YAKINI <b>DIGITAL</b></span>
    </Link>
  )
}

export function SiteShell({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30)
    handler()
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const close = () => setMenuOpen(false)
  const path = usePathname() || '/'

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="yk-backdrop" aria-hidden="true" style={{ backgroundImage: `url(${roomFor(path)})` }} />
      <style>{`:root{--yk-room:url(${roomFor(path)})}`}</style>

      <nav className={`yk-nav ${scrolled || menuOpen ? 'scrolled' : ''}`}>
        <div className="yk-nav-inner">
          <BrandMark />
          <div className="yk-nav-center">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} aria-current={path === l.href ? 'page' : undefined}>{l.label}</a>
            ))}
          </div>
          <div className="yk-nav-right">
            <a href={PORTAL_LOGIN_URL} className="yk-nav-signin">Sign in</a>
            <a href={START_URL} className="yk-nav-cta">
              <span>Start</span>
              <span className="yk-nav-cta-arrow">→</span>
            </a>
            <button
              className={`yk-burger ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div className="yk-mobile-menu">
          <div className="yk-mobile-actions">
            <a href={START_URL} className="yk-mobile-start" onClick={close}>Start your setup →</a>
            <a href={PORTAL_LOGIN_URL} className="yk-mobile-signin" onClick={close}>Sign in to your portal</a>
          </div>
          <a href="/" onClick={close}>Walk through Yakini</a>
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={close}>{l.label}</a>
          ))}
          <a href="/class" onClick={close}>Free class</a>
          <a href="/apply" onClick={close}>Book a call</a>
        </div>
      )}

      <main className="yk-main">{children}</main>

      <footer className="yk-footer">
        <div className="yk-section-inner">
          <div className="yk-footer-grid">
            <div className="yk-footer-brand">
              <BrandMark />
              <p className="yk-footer-tag">Your business portal, set up with you. And we stay.</p>
              <a href={START_URL} className="yk-footer-start">Start your setup →</a>
            </div>
            <div className="yk-footer-col">
              <h6>Portal</h6>
              <a href={START_URL}>Start your setup</a>
              <a href={PORTAL_LOGIN_URL}>Sign in</a>
              <a href="/portal">The portal</a>
              <a href="/pricing">Plans</a>
              <a href="/how-it-works">How it works</a>
              <Link href="/watch">Watch it work</Link>
              <a href="/class">Free class</a>
            </div>
            <div className="yk-footer-col">
              <h6>Custom builds</h6>
              <a href="/custom-builds">What we build</a>
              <a href="/apply?tier=partner">Book a call</a>
              <h6 className="yk-footer-h6-gap">Company</h6>
              <a href="/">Walk through Yakini</a>
              <a href="/about">About</a>
              <a href="https://brsafoundation.org" target="_blank" rel="noopener">BRSA Foundation</a>
              <a href="https://brsaholdings.org" target="_blank" rel="noopener">BRSA Holdings</a>
            </div>
            <div className="yk-footer-col">
              <h6>Contact</h6>
              <a href="/contact">Contact us</a>
              <a href="tel:+13466232199">Office · 1 (346) 623-2199</a>
              <a href="tel:+13466264948">Executive · 1 (346) 626-4948</a>
              <a href="mailto:hello@yakini.digital">hello@yakini.digital</a>
              <a href="mailto:admin@yakini.digital">admin@yakini.digital</a>
              <a href="https://contracts.yakini.digital">contracts.yakini.digital</a>
            </div>
          </div>
          <div className="yk-footer-bottom">
            <span>© 2026 BRSA Holdings, Inc. All rights reserved.</span>
            <span>YAKINI is part of the BRSA ecosystem · Houston, Texas</span>
          </div>
        </div>
      </footer>
      <style>{THEME_CSS}</style>
    </>
  )
}

// ═════════════════════════════════════════════════════════════════════════
// GLOBAL CSS — Loaded once, available on every page using SiteShell
// ═════════════════════════════════════════════════════════════════════════

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --navy: #F4F7FF;
    --navy-deep: #FFFFFF;
    --black: #F4F7FF;
    --black-soft: #F4F7FF;
    --gold: #1638E8;
    /* Shared Yakini dashboard style (same tokens as the client portal) */
    --yk-ink: #15130F;
    --yk-gold: #1638E8;
    --yk-gold-soft: rgba(22,56,232,0.14);
    --yk-tray: #F6F3EC;
    --yk-line-dark: rgba(11,20,55,0.12);
    --yk-radius: 16px;
    --yk-radius-lg: 22px;
    --yk-shadow-float: 0 40px 80px -30px rgba(11,20,55,0.21), 0 0 0 1px rgba(11,20,55,0.08);
    --gold-warm: #1638E8;
    --cream: #0B1437;
    --warm-white: #FAFAF8;
    --electric: #4A90D9;
    --electric-soft: rgba(74, 144, 217, 0.15);
    --gold-soft: rgba(22,56,232,0.1);
    --line: rgba(11,20,55,0.1);
    --line-strong: rgba(11,20,55,0.2);
    --muted: rgba(11,20,55,0.74);
    --font-display: 'Cormorant Garamond', Georgia, serif;
    --font-body: 'Inter', -apple-system, sans-serif;
    --font-mono: 'JetBrains Mono', Menlo, monospace;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    background: var(--navy-deep);
    color: var(--cream);
    font-family: var(--font-body);
    -webkit-font-smoothing: antialiased;
    line-height: 1.6;
    overflow-x: hidden;
  }
  a { color: inherit; text-decoration: none; transition: color 0.2s; }
  ul { list-style: none; }
  ::selection { background: var(--gold); color: var(--navy-deep); }

  /* Palette 11: lime is decoration only (underline, pills, tags, active states); anything on lime is navy. */
  .yk-gold.yk-italic, .hh-h1-gold {
    background-image: linear-gradient(transparent 80%, rgba(198,244,50,0.95) 80%, rgba(198,244,50,0.95) 94%, transparent 94%);
    -webkit-box-decoration-break: clone; box-decoration-break: clone;
  }
  .yk-num { background: #C6F432 !important; color: #0B1437 !important; padding: 2px 8px; border-radius: 6px; }
  .yk-italic { font-style: italic; font-family: var(--font-display); font-weight: 400; }
  .yk-gold { color: var(--gold); }
  .yk-electric { color: var(--electric); }

  /* ═══ NAV ═══ */
  .yk-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    padding: 14px 32px;
    background: transparent;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .yk-nav.scrolled {
    padding: 10px 32px;
    background: rgba(255,255,255,0.85);
    backdrop-filter: blur(24px) saturate(180%);
    border-bottom: 1px solid var(--line);
  }
  .yk-nav-inner {
    max-width: 1400px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between;
    gap: 32px;
  }
  .yk-brand {
    display: flex; align-items: center; gap: 12px;
  }
  .yk-brand-logo { display: block; flex-shrink: 0; height: 40px; }
  .yk-brand-logo img { display: block; height: 100%; width: auto; }
  .yk-brand:hover .yk-brand-logo { opacity: 0.85; }
  .yk-brand-sub {
    font-family: var(--font-body);
    font-weight: 500;
    font-size: 8.5px;
    letter-spacing: 0.2em;
    color: var(--gold);
    line-height: 1.5;
    max-width: 120px;
  }

  .yk-nav-center {
    display: flex; gap: 36px; align-items: center;
  }
  .yk-nav-center a {
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.02em;
    color: rgba(11,20,55,0.75);
    position: relative;
    padding: 4px 0;
  }
  .yk-nav-center a::after {
    content: ''; position: absolute;
    bottom: -2px; left: 0; right: 0;
    height: 1px;
    background: var(--gold);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s;
  }
  .yk-nav-center a:hover { color: var(--cream); }
  .yk-nav-right { display: flex; align-items: center; gap: 18px; flex-shrink: 0; }
  .yk-nav-signin {
    font-size: 13px; font-weight: 500; letter-spacing: 0.02em;
    color: rgba(11,20,55,0.85);
    padding: 10px 4px;
  }
  .yk-nav-signin:hover { color: var(--gold); }
  .yk-nav-center a:hover::after { transform: scaleX(1); }

  .yk-nav-cta {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 11px 22px;
    background: var(--gold);
    color: var(--navy-deep);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.05em;
    transition: all 0.3s;
    flex-shrink: 0;
  }
  .yk-nav-cta:hover {
    background: var(--cream);
    color: var(--navy-deep);
    transform: translateY(-1px);
    box-shadow: 0 12px 30px rgba(22,56,232,0.25);
  }
  .yk-nav-cta-arrow { transition: transform 0.2s; }
  .yk-nav-cta:hover .yk-nav-cta-arrow { transform: translateX(4px); }

  .yk-burger { display: none; background: none; border: none; cursor: pointer; padding: 8px; }
  .yk-burger span {
    display: block; width: 22px; height: 1.5px;
    background: var(--cream); margin: 5px 0;
    transition: all 0.3s;
  }
  .yk-burger.open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
  .yk-burger.open span:nth-child(2) { opacity: 0; }
  .yk-burger.open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

  .yk-mobile-menu {
    position: fixed; top: 70px; left: 0; right: 0; bottom: 0; z-index: 99;
    background: var(--navy-deep);
    padding: 32px 32px;
    display: flex; flex-direction: column; gap: 20px;
    border-top: 1px solid var(--line);
  }
  .yk-mobile-menu a {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 500;
    color: var(--cream);
    padding: 8px 0;
    border-bottom: 1px solid var(--line);
  }
  .yk-mobile-cta { color: var(--gold) !important; }

  .yk-mobile-actions { display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
  .yk-mobile-menu a.yk-mobile-start {
    font-family: var(--font-body); font-size: 16px; font-weight: 600; letter-spacing: 0.04em;
    background: var(--gold); color: var(--navy-deep); text-align: center; padding: 16px; border: none;
  }
  .yk-mobile-menu a.yk-mobile-signin {
    font-family: var(--font-body); font-size: 15px; font-weight: 500;
    border: 1px solid var(--line-strong); text-align: center; padding: 14px; color: var(--cream);
  }
  @media (max-width: 1100px) {
    .yk-nav-center { gap: 24px; }
  }
  @media (max-width: 1024px) {
    .yk-nav-center { display: none; }
    .yk-nav-signin { display: none; }
    .yk-burger { display: block; }
    .yk-nav-right { gap: 8px; }
    .yk-nav-cta { padding: 9px 16px; font-size: 12px; }
    .yk-brand-logo { --logo-h: 64px; }
    .yk-mobile-menu { top: 88px; }
  }
  @media (max-width: 420px) {
    .yk-nav { padding: 14px 18px; }
    .yk-nav.scrolled { padding: 10px 18px; }
    .yk-brand-sub { display: none; }
    .yk-brand-logo { --logo-h: 60px; }
    .yk-mobile-menu { top: 80px; }
  }

  /* ═══ SHARED SECTION FOUNDATIONS ═══ */
  .yk-section {
    padding: 140px 32px;
    position: relative;
  }
  .yk-section-inner {
    max-width: 1400px; margin: 0 auto;
  }
  .yk-section-tag {
    display: inline-flex; align-items: baseline; gap: 14px;
    margin-bottom: 32px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.3em;
    color: var(--gold);
    text-transform: uppercase;
  }
  .yk-num {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 18px;
    font-weight: 400;
  }
  .yk-section-h2 {
    font-family: var(--font-display);
    font-size: clamp(48px, 7vw, 96px);
    line-height: 0.95;
    font-weight: 400;
    letter-spacing: -0.02em;
    color: var(--cream);
    max-width: 14ch;
    margin-bottom: 60px;
  }
  .yk-section-head { margin-bottom: 80px; }

  .yk-eyebrow {
    display: inline-flex; align-items: center; gap: 12px;
    padding: 8px 16px;
    border: 1px solid var(--line-strong);
    background: rgba(11,20,55,0.03);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.25em;
    color: var(--gold);
    margin-bottom: 40px;
  }
  .yk-eyebrow-dot {
    width: 6px; height: 6px;
    background: var(--gold);
    border-radius: 50%;
    animation: yk-dot-pulse 2s ease-in-out infinite;
  }
  @keyframes yk-dot-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.7); }
  }

  /* ═══ SHARED BUTTONS ═══ */
  .yk-btn-primary {
    display: inline-flex; align-items: center; gap: 12px;
    background: var(--cream);
    color: var(--navy-deep);
    padding: 18px 30px;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.04em;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    border: 1.5px solid var(--cream);
  }
  .yk-btn-primary:hover {
    background: var(--gold);
    border-color: var(--gold);
    transform: translateY(-2px);
    box-shadow: 0 15px 40px rgba(22,56,232,0.3);
  }
  .yk-btn-arrow { transition: transform 0.25s; }
  .yk-btn-primary:hover .yk-btn-arrow { transform: translateX(6px); }

  .yk-btn-ghost {
    display: inline-flex; align-items: center; gap: 10px;
    color: var(--cream);
    padding: 18px 30px;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.04em;
    border: 1.5px solid var(--line-strong);
    transition: all 0.3s;
  }
  .yk-btn-ghost:hover {
    border-color: var(--gold);
    color: var(--gold);
  }
  .yk-btn-ghost .yk-btn-arrow { transition: transform 0.25s; }
  .yk-btn-ghost:hover .yk-btn-arrow { transform: translateX(4px); }

  /* ═══ SHARED PAGE HEADER ═══ */
  .yk-page-header {
    padding: 180px 32px 100px;
    background: linear-gradient(180deg, var(--navy-deep) 0%, var(--black-soft) 100%);
    border-bottom: 1px solid var(--line);
    position: relative;
    overflow: hidden;
  }
  .yk-page-header::before {
    content: ''; position: absolute;
    top: 0; left: 50%;
    transform: translateX(-50%);
    width: 1000px; height: 600px;
    background: radial-gradient(ellipse at center,
      rgba(22,56,232,0.12) 0%,
      transparent 60%);
    pointer-events: none;
  }
  .yk-page-header-inner {
    max-width: 1400px; margin: 0 auto;
    position: relative;
  }
  .yk-page-h1 {
    font-family: var(--font-display);
    font-size: clamp(56px, 9vw, 128px);
    line-height: 0.92;
    font-weight: 400;
    letter-spacing: -0.025em;
    color: var(--cream);
    margin-bottom: 32px;
    max-width: 14ch;
  }
  .yk-page-sub {
    font-size: clamp(17px, 1.5vw, 21px);
    line-height: 1.6;
    color: rgba(11,20,55,0.74);
    max-width: 640px;
  }

  /* ═══ FOOTER ═══ */
  .yk-footer {
    background: var(--black);
    padding: 80px 32px 32px;
    border-top: 1px solid var(--line);
  }
  .yk-footer-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 60px;
    margin-bottom: 60px;
  }
  .yk-footer-tag {
    font-family: var(--font-display);
    font-size: 18px;
    font-style: italic;
    color: var(--muted);
    margin-top: 24px;
    max-width: 280px;
    line-height: 1.5;
  }
  .yk-footer-col h6 {
    font-family: var(--font-body);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.25em;
    color: var(--gold);
    margin-bottom: 20px;
    text-transform: uppercase;
  }
  .yk-footer-col a {
    display: block;
    font-size: 14px;
    color: var(--muted);
    margin-bottom: 10px;
    transition: color 0.2s;
  }
  .yk-footer-col a:hover { color: var(--cream); }
  .yk-footer-h6-gap { margin-top: 28px; }
  .yk-footer-start {
    display: inline-block; margin-top: 22px; padding: 12px 20px;
    border: 1px solid var(--gold); color: var(--gold);
    font-size: 13px; font-weight: 600; letter-spacing: 0.04em;
  }
  .yk-footer-start:hover { background: var(--gold); color: var(--navy-deep); }
  .yk-footer-bottom {
    border-top: 1px solid var(--line);
    padding-top: 24px;
    display: flex; justify-content: space-between;
    flex-wrap: wrap; gap: 16px;
    font-size: 12px;
    color: var(--muted);
  }

  @media (max-width: 800px) {
    .yk-footer-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
    .yk-footer-brand { grid-column: 1 / -1; }
  }
  @media (max-width: 500px) {
    .yk-footer-grid { grid-template-columns: 1fr; }
  }
`
              

// ═════════════════════════════════════════════════════════════════════════
// IMMERSIVE THEME (Nov 9 2026). Rendered after the page's own <style>, so it
// re-skins every SiteShell page to match the walkthrough at /. Layout, copy,
// links and forms are untouched; only colour, type and backdrop change.
// ═════════════════════════════════════════════════════════════════════════
const THEME_CSS = `
  :root {
    --navy: rgba(11,20,55,0.55);
    --navy-deep: #060B24;
    --black: rgba(6,11,36,0.92);
    --black-soft: rgba(11,20,55,0.6);
    --gold: #C6F432;
    --gold-warm: #C6F432;
    --gold-soft: rgba(198,244,50,0.12);
    --cream: #F4F7FF;
    --warm-white: #F4F7FF;
    --line: rgba(244,247,255,0.14);
    --line-strong: rgba(244,247,255,0.28);
    --muted: rgba(244,247,255,0.72);
    --yk-ink: #F4F7FF;
    --yk-gold: #C6F432;
    --yk-gold-soft: rgba(198,244,50,0.14);
    --yk-line-dark: rgba(244,247,255,0.14);
    --brass: #C9A14A;
  }
  html, body { background: #060B24 !important; color: var(--cream); }
  ::selection { background: #C6F432; color: #060B24; }
  .yk-backdrop {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-size: cover; background-position: center;
    opacity: 0.22; filter: saturate(0.85) blur(2px);
  }
  .yk-backdrop::after { content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse at 80% 0%, rgba(22,56,232,0.35), transparent 55%), linear-gradient(180deg, rgba(6,11,36,0.4), rgba(6,11,36,0.92) 70%); }
  .yk-main, .yk-footer, .yk-nav, .yk-mobile-menu { position: relative; z-index: 1; }
  .yk-nav { position: fixed; z-index: 100; }
  .yk-mobile-menu { position: fixed; z-index: 99; background: rgba(6,11,36,0.97); }

  /* brand */
  .yk-brand { gap: 10px; }
  .yk-y { filter: drop-shadow(0 0 10px rgba(201,161,74,0.55)); flex-shrink: 0; }
  .yk-brand-word { font-family: var(--font-body); font-weight: 600; font-size: 15px; letter-spacing: 0.22em; white-space: nowrap;
    background: linear-gradient(100deg,#F3D98B,#C9A14A 45%,#F6E3A8 55%,#A9802F); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .yk-brand-word b { font-weight: 600; }

  /* nav: dark glass, pills like the walkthrough */
  .yk-nav { background: linear-gradient(rgba(6,11,36,0.85), rgba(6,11,36,0)); }
  .yk-nav.scrolled { background: rgba(6,11,36,0.82); border-bottom: 1px solid var(--line); }
  .yk-nav-center { gap: 26px; }
  .yk-nav-center a { color: rgba(244,247,255,0.78); }
  .yk-nav-center a[aria-current="page"] { color: #C6F432; }
  .yk-nav-center a::after { background: #C6F432 !important; }
  .yk-nav-signin { color: rgba(244,247,255,0.85); border: 1px solid var(--line); border-radius: 999px; padding: 8px 14px; }
  .yk-nav-cta { border-radius: 999px; background: #C6F432; color: #0B1437; }
  .yk-nav-cta:hover { background: #F4F7FF; color: #0B1437; box-shadow: 0 12px 30px rgba(198,244,50,0.25); }
  .yk-mobile-menu a.yk-mobile-start { border-radius: 999px; background: #C6F432; color: #0B1437; }
  .yk-mobile-menu a.yk-mobile-signin { border-radius: 999px; }
  @media (max-width: 1240px) { .yk-nav-center { gap: 18px; } .yk-nav-center a { font-size: 12.5px; } }
  @media (max-width: 420px) { .yk-brand-word { font-size: 12.5px; letter-spacing: 0.16em; } }

  /* headings + accents: Cormorant display, lime italics (no highlighter bar on dark) */
  .yk-gold.yk-italic, .hh-h1-gold { background-image: none !important; color: #C6F432 !important; font-style: italic; }
  .yk-gold { color: #C6F432; }
  .yk-eyebrow { border-radius: 999px; background: rgba(6,11,36,0.55); backdrop-filter: blur(8px); font-family: var(--font-mono); color: #C6F432; }
  .yk-eyebrow-dot { background: #C6F432; }
  .yk-section-tag { font-family: var(--font-mono); color: #C6F432; }
  .yk-page-sub { color: var(--muted) !important; }

  /* buttons: lime primary pill, glass ghost pill */
  .yk-btn-primary { border-radius: 999px; background: #C6F432; border-color: #C6F432; color: #0B1437; }
  .yk-btn-primary:hover { background: #F4F7FF; border-color: #F4F7FF; color: #0B1437; box-shadow: 0 15px 40px rgba(198,244,50,0.25); }
  .yk-btn-ghost { border-radius: 999px; background: rgba(6,11,36,0.5); backdrop-filter: blur(6px); }
  .yk-btn-ghost:hover { border-color: #C6F432; color: #C6F432; }

  /* page headers: a photoreal room behind the title */
  .yk-page-header { background: none !important; border-bottom: 1px solid var(--line); }
  .yk-page-header::before { content: ''; position: absolute; inset: 0; width: auto; height: auto; left: 0; transform: none;
    background-image: linear-gradient(90deg, rgba(6,11,36,0.94) 0%, rgba(6,11,36,0.78) 45%, rgba(6,11,36,0.35) 100%), linear-gradient(0deg, #060B24 0%, transparent 40%), var(--yk-room);
    background-size: cover; background-position: center; opacity: 1; }
  .yk-page-h1, .yk-section-h2 { text-shadow: 0 2px 30px rgba(6,11,36,0.8); }

  /* shared section buttons (hm-btn) as walkthrough pills */
  .hm-btn { border-radius: 999px; background: rgba(6,11,36,0.5); backdrop-filter: blur(6px); }
  .hm-btn-gold { background: #C6F432; border-color: #C6F432; color: #0B1437; }
  .hm-btn-gold:hover { background: #F4F7FF; border-color: #F4F7FF; color: #0B1437; box-shadow: 0 16px 40px rgba(198,244,50,0.22); }

  .yk-footer { background: rgba(3,6,20,0.92); }
  .yk-footer-start { border-radius: 999px; }
  .yk-footer-start:hover { color: #0B1437; }
`
