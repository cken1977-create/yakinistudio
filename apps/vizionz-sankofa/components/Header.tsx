// ═════════════════════════════════════════════════════════════════════════
// HEADER — Sticky main navigation
// ═════════════════════════════════════════════════════════════════════════
// White ground with subtle border. VS brand seal (navy circle, red+gold
// rings, italic V) on the left. Seven nav links. Two CTAs: Donate (navy)
// and Get Help (red). Mobile burger menu.
//
// Sticky with backdrop blur. Sits below Topbar, above Hero.
// ═════════════════════════════════════════════════════════════════════════

'use client'

import { useState } from 'react'
import type { BrandConfig } from '@yakini/config'
import { VS_NAVY, VS_RED, VS_INK } from './TriColorRule'

const NAV_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Programs', href: '/programs' },
  { label: 'Events', href: '/gallery' },
  { label: 'Coalition', href: '/partners' },
  { label: 'Stories', href: '/voices' },
  { label: 'Contact', href: '/contact' },
]

export function Header({ config }: { config: BrandConfig }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <style>{`
        .vs-header {
          background: rgba(255, 255, 255, 0.97);
          padding: 1.5rem 0;
          border-bottom: 1px solid #E5E5E5;
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .vs-header-inner {
          max-width: 72rem;
          margin: 0 auto;
          padding: 0 2.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2.5rem;
        }
        .vs-brand-mark {
          display: flex;
          align-items: center;
          gap: 1rem;
          text-decoration: none;
        }
        .vs-brand-seal {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: ${VS_NAVY};
          color: #FFFFFF;
          display: grid;
          place-items: center;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-style: italic;
          font-size: 1.75rem;
          font-weight: 600;
          box-shadow:
            0 0 0 2px #FFFFFF,
            0 0 0 3px ${VS_RED},
            0 4px 12px rgba(10, 37, 72, 0.18);
          transition: transform 250ms ease;
        }
        .vs-brand-mark:hover .vs-brand-seal {
          transform: rotate(-4deg);
        }
        .vs-brand-text { line-height: 1.1; }
        .vs-brand-name {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1.5rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          color: ${VS_INK};
        }
        .vs-brand-descriptor {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-size: 0.6875rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #767676;
          margin-top: 2px;
        }

        .vs-nav-list {
          display: flex;
          list-style: none;
          gap: 1.75rem;
          align-items: center;
          margin: 0;
          padding: 0;
        }
        .vs-nav-link {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 0.9375rem;
          font-weight: 500;
          letter-spacing: 0.01em;
          color: #4A4A4A;
          text-decoration: none;
          padding: 0.5rem 0;
          border-bottom: 2px solid transparent;
          transition: all 200ms ease;
        }
        .vs-nav-link:hover {
          color: ${VS_RED};
          border-bottom-color: ${VS_RED};
        }

        .vs-cta-group {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }
        .vs-cta {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          font-family: 'Newsreader', Georgia, serif;
          font-size: 0.8125rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 600;
          border-radius: 2px;
          text-decoration: none;
          transition: all 200ms ease;
          white-space: nowrap;
        }
        .vs-cta-donate {
          background: ${VS_NAVY};
          color: #FFFFFF;
          box-shadow: 0 2px 10px rgba(10, 37, 72, 0.18);
        }
        .vs-cta-donate:hover {
          background: #061935;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(10, 37, 72, 0.28);
        }
        .vs-cta-help {
          background: ${VS_RED};
          color: #FFFFFF;
          box-shadow: 0 2px 10px rgba(206, 17, 38, 0.22);
        }
        .vs-cta-help:hover {
          background: #A20D1E;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(206, 17, 38, 0.32);
        }

        .vs-burger {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          flex-direction: column;
          gap: 4px;
        }
        .vs-burger span {
          width: 24px;
          height: 2px;
          background: ${VS_INK};
          transition: all 0.3s ease;
        }
        .vs-burger.open span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
        .vs-burger.open span:nth-child(2) { opacity: 0; }
        .vs-burger.open span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }

        @media (max-width: 1024px) {
          .vs-header-inner { padding: 0 1.5rem; gap: 1.5rem; }
          .vs-nav-list { gap: 1.25rem; }
          .vs-nav-link { font-size: 0.875rem; }
        }
        @media (max-width: 900px) {
          .vs-nav-list { display: none; }
          .vs-cta-group { display: none; }
          .vs-burger { display: flex; }

          .vs-mobile-menu {
            position: fixed;
            top: 88px;
            left: 0; right: 0; bottom: 0;
            background: #FFFFFF;
            padding: 2rem 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            transform: translateX(${mobileOpen ? '0' : '100%'});
            transition: transform 0.4s ease;
            z-index: 99;
            overflow-y: auto;
          }
          .vs-mobile-menu .vs-nav-link {
            font-size: 1.5rem;
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-weight: 500;
            color: ${VS_INK};
          }
          .vs-mobile-menu .vs-nav-link:hover {
            color: ${VS_RED};
          }
          .vs-mobile-cta-group {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            margin-top: 1.5rem;
            padding-top: 1.5rem;
            border-top: 1px solid #E5E5E5;
          }
          .vs-mobile-cta-group .vs-cta {
            text-align: center;
            padding: 1rem 1.5rem;
          }
        }
        @media (min-width: 901px) {
          .vs-mobile-menu { display: none; }
        }
      `}</style>

      <header className="vs-header">
        <div className="vs-header-inner">
          <a href="/" className="vs-brand-mark" aria-label={config.business.name}>
            <div className="vs-brand-seal">V</div>
            <div className="vs-brand-text">
              <div className="vs-brand-name">{config.business.name}</div>
              <div className="vs-brand-descriptor">Community Empowerment</div>
            </div>
          </a>

          <nav aria-label="Primary">
            <ul className="vs-nav-list">
              {NAV_LINKS.map(link => (
                <li key={link.href}>
                  <a href={link.href} className="vs-nav-link">{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="vs-cta-group">
            <a href="/donate" className="vs-cta vs-cta-donate">Donate</a>
            <a href="/get-help" className="vs-cta vs-cta-help">Get Help</a>
          </div>

          <button
            className={`vs-burger ${mobileOpen ? 'open' : ''}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
            aria-expanded={mobileOpen}
          >
            <span /><span /><span />
          </button>
        </div>

        <div className="vs-mobile-menu" aria-hidden={!mobileOpen}>
          {NAV_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="vs-nav-link"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="vs-mobile-cta-group">
            <a href="/donate" className="vs-cta vs-cta-donate" onClick={() => setMobileOpen(false)}>
              Donate
            </a>
            <a href="/get-help" className="vs-cta vs-cta-help" onClick={() => setMobileOpen(false)}>
              Get Help
            </a>
          </div>
        </div>
      </header>
    </>
  )
}
