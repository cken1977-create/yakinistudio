'use client'

import { useState, useEffect, ReactNode } from 'react'

// ═════════════════════════════════════════════════════════════════════════
// YAKINI SITE SHELL
// File: apps/yakini.digital/components/SiteShell.tsx
//
// Wraps every page with the premium nav, footer, and brand foundation.
// Import into any page:
//
//   import { SiteShell } from '@/components/SiteShell'
//
//   export default function MyPage() {
//     return <SiteShell>{/* your content */}</SiteShell>
//   }
// ═════════════════════════════════════════════════════════════════════════

export function SiteShell({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {/* ───── NAV ───── */}
      <nav className={`yk-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="yk-nav-inner">
          <a href="/" className="yk-brand">
            <div className="yk-brand-mark">
              <span className="yk-brand-y">Y</span>
            </div>
            <div className="yk-brand-text">
              <span className="yk-brand-name">YAKINI</span>
              <span className="yk-brand-sub">DIGITAL INFRASTRUCTURE</span>
            </div>
          </a>

          <div className="yk-nav-center">
            <a href="/platforms">Platforms</a>
            <a href="/intelligence">Intelligence</a>
            <a href="/process">Process</a>
            <a href="/pricing">Pricing</a>
            <a href="/about">About</a>
          </div>

          <a href="/apply" className="yk-nav-cta">
            <span>Apply</span>
            <span className="yk-nav-cta-arrow">→</span>
          </a>

          <button
            className={`yk-burger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="yk-mobile-menu">
          <a href="/platforms" onClick={() => setMenuOpen(false)}>Platforms</a>
          <a href="/intelligence" onClick={() => setMenuOpen(false)}>Intelligence</a>
          <a href="/process" onClick={() => setMenuOpen(false)}>Process</a>
          <a href="/pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
          <a href="/about" onClick={() => setMenuOpen(false)}>About</a>
          <a href="/apply" className="yk-mobile-cta" onClick={() => setMenuOpen(false)}>Apply →</a>
        </div>
      )}

      {/* PAGE CONTENT */}
      <main>{children}</main>

      {/* ───── FOOTER ───── */}
      <footer className="yk-footer">
        <div className="yk-section-inner">
          <div className="yk-footer-grid">
            <div className="yk-footer-brand">
              <div className="yk-brand">
                <div className="yk-brand-mark">
                  <span className="yk-brand-y">Y</span>
                </div>
                <div className="yk-brand-text">
                  <span className="yk-brand-name">YAKINI</span>
                  <span className="yk-brand-sub">DIGITAL INFRASTRUCTURE</span>
                </div>
              </div>
              <p className="yk-footer-tag">
                The infrastructure layer your business runs on.
              </p>
            </div>

            <div className="yk-footer-col">
              <h6>Build</h6>
              <a href="/platforms">Platforms</a>
              <a href="/intelligence">Intelligence</a>
              <a href="/process">Process</a>
              <a href="/pricing">Pricing</a>
            </div>

            <div className="yk-footer-col">
              <h6>Company</h6>
              <a href="/about">About</a>
              <a href="/apply">Apply</a>
              <a href="https://brsafoundation.org">BRSA Foundation</a>
            </div>

            <div className="yk-footer-col">
              <h6>Contact</h6>
              <a href="mailto:hello@yakini.digital">hello@yakini.digital</a>
              <a href="mailto:admin@yakini.digital">admin@yakini.digital</a>
            </div>
          </div>

          <div className="yk-footer-bottom">
            <span>© 2026 BRSA Holdings, Inc. All rights reserved.</span>
            <span>YAKINI is part of the BRSA ecosystem.</span>
          </div>
        </div>
      </footer>
    </>
  )
}

// ═════════════════════════════════════════════════════════════════════════
// GLOBAL CSS — Loaded once, available on every page using SiteShell
// ═════════════════════════════════════════════════════════════════════════

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --navy: #0A1F3D;
    --navy-deep: #050E1F;
    --black: #000000;
    --black-soft: #0A0A0A;
    --gold: #C8A84B;
    --gold-warm: #B5915F;
    --cream: #F4F1EB;
    --warm-white: #FAFAF8;
    --electric: #4A90D9;
    --electric-soft: rgba(74, 144, 217, 0.15);
    --gold-soft: rgba(200, 168, 75, 0.1);
    --line: rgba(255,255,255,0.08);
    --line-strong: rgba(255,255,255,0.15);
    --muted: rgba(255,255,255,0.55);
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

  .yk-italic { font-style: italic; font-family: var(--font-display); font-weight: 400; }
  .yk-gold { color: var(--gold); }
  .yk-electric { color: var(--electric); }

  /* ═══ NAV ═══ */
  .yk-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    padding: 18px 32px;
    background: transparent;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .yk-nav.scrolled {
    padding: 12px 32px;
    background: rgba(5, 14, 31, 0.85);
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
  .yk-brand-mark {
    width: 36px; height: 36px;
    border: 1.5px solid var(--gold);
    display: flex; align-items: center; justify-content: center;
    background: rgba(200, 168, 75, 0.05);
    transition: all 0.3s;
    flex-shrink: 0;
  }
  .yk-brand-mark:hover {
    background: rgba(200, 168, 75, 0.15);
    transform: rotate(-5deg);
  }
  .yk-brand-y {
    font-family: var(--font-display);
    font-size: 22px;
    font-style: italic;
    font-weight: 500;
    color: var(--gold);
    line-height: 1;
  }
  .yk-brand-text {
    display: flex; flex-direction: column; line-height: 1;
  }
  .yk-brand-name {
    font-family: var(--font-body);
    font-weight: 700;
    font-size: 15px;
    letter-spacing: 0.18em;
    color: var(--cream);
  }
  .yk-brand-sub {
    font-family: var(--font-body);
    font-weight: 500;
    font-size: 9px;
    letter-spacing: 0.25em;
    color: var(--gold);
    margin-top: 3px;
  }

  .yk-nav-center {
    display: flex; gap: 36px; align-items: center;
  }
  .yk-nav-center a {
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.02em;
    color: rgba(244, 241, 235, 0.75);
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
  .yk-nav-center a:hover::after { transform: scaleX(1); }

  .yk-nav-cta {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 11px 22px;
    background: var(--cream);
    color: var(--navy-deep);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.05em;
    transition: all 0.3s;
    flex-shrink: 0;
  }
  .yk-nav-cta:hover {
    background: var(--gold);
    color: var(--navy-deep);
    transform: translateY(-1px);
    box-shadow: 0 12px 30px rgba(200, 168, 75, 0.25);
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

  @media (max-width: 1024px) {
    .yk-nav-center { display: none; }
    .yk-nav-cta { display: none; }
    .yk-burger { display: block; }
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
    opacity: 0.6;
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
    background: rgba(255, 255, 255, 0.02);
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
    box-shadow: 0 15px 40px rgba(200, 168, 75, 0.3);
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
      rgba(200, 168, 75, 0.12) 0%,
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
    color: rgba(244, 241, 235, 0.7);
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
  }
  @media (max-width: 500px) {
    .yk-footer-grid { grid-template-columns: 1fr; }
  }
`
              
