// ═════════════════════════════════════════════════════════════════════════
// FOOTER — Vizionz Sankofa site footer
// ═════════════════════════════════════════════════════════════════════════
// Deep navy ground (deeper than the Topbar/Header navy for visual depth).
// Tri-color rule along the top edge as ceremonial signature. Four-column
// grid: brand block + About / Programs / Engage. Bottom bar with EIN
// disclosure, copyright, and subtle Yakini Digital attribution.
// ═════════════════════════════════════════════════════════════════════════

import type { BrandConfig } from '@yakini/config'
import { VS_NAVY, VS_RED, VS_INK, VS_GREEN } from './TriColorRule'

const VS_BLACK_DEEP = '#0A0A0A'  // True deep black for the Pan-African footer ground

export function Footer({ config }: { config: BrandConfig }) {
  const year = new Date().getFullYear()

  return (
    <>
      <style>{`
        .vs-footer {
          background: ${VS_BLACK_DEEP};
          color: #FFFFFF;
          padding: 4rem 0 1.5rem;
          position: relative;
          margin-top: 6rem;
        }
        .vs-footer::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
          background: linear-gradient(90deg,
            ${VS_RED} 0%, ${VS_RED} 33%,
            ${VS_INK} 33%, ${VS_INK} 67%,
            ${VS_GREEN} 67%, ${VS_GREEN} 100%);
        }
        .vs-footer-inner {
          max-width: 72rem;
          margin: 0 auto;
          padding: 0 2.5rem;
        }
        .vs-footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 2.5rem;
          margin-bottom: 4rem;
        }

        .vs-footer-brand {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .vs-footer-brand-mark {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .vs-footer-seal {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: ${VS_NAVY};
          color: #FFFFFF;
          display: grid;
          place-items: center;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-style: italic;
          font-size: 1.5rem;
          font-weight: 600;
          box-shadow:
            0 0 0 2px #0A0A0A,
            0 0 0 3px ${VS_RED};
        }
        .vs-footer-brand-name {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1.375rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          color: #FFFFFF;
        }
        .vs-footer-brand-descriptor {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-size: 0.625rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.55);
          margin-top: 2px;
        }
        .vs-footer-tagline {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-style: italic;
          font-size: 1rem;
          line-height: 1.55;
          color: rgba(255, 255, 255, 0.78);
          max-width: 24rem;
        }

        .vs-footer-col h5 {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 0.6875rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #E2293E;
          margin: 0 0 1.25rem;
          font-weight: 600;
        }
        .vs-footer-col ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .vs-footer-col li {
          margin-bottom: 0.5rem;
        }
        .vs-footer-col a {
          color: rgba(255, 255, 255, 0.78);
          font-size: 0.9rem;
          text-decoration: none;
          transition: color 200ms ease;
        }
        .vs-footer-col a:hover {
          color: #FFFFFF;
        }

        .vs-footer-bar {
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          padding-top: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.75rem;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
        }
        .vs-footer-bar-divider {
          margin: 0 0.5rem;
          opacity: 0.4;
        }
        .vs-footer-bar .vs-mono {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          color: rgba(255, 255, 255, 0.78);
          letter-spacing: 0.04em;
        }
        .vs-yakini-credit {
          color: rgba(255, 255, 255, 0.55);
        }
        .vs-yakini-credit a {
          color: rgba(255, 255, 255, 0.85);
          text-decoration: none;
          font-weight: 500;
          transition: color 200ms ease;
        }
        .vs-yakini-credit a:hover {
          color: #FFFFFF;
        }

        @media (max-width: 800px) {
          .vs-footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
          }
          .vs-footer-brand {
            grid-column: span 2;
          }
        }
        @media (max-width: 500px) {
          .vs-footer-grid { grid-template-columns: 1fr; }
          .vs-footer-brand { grid-column: span 1; }
          .vs-footer-bar {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      <footer className="vs-footer">
        <div className="vs-footer-inner">
          <div className="vs-footer-grid">

            <div className="vs-footer-brand">
              <div className="vs-footer-brand-mark">
                <div className="vs-footer-seal">V</div>
                <div>
                  <div className="vs-footer-brand-name">{config.business.name}</div>
                  <div className="vs-footer-brand-descriptor">Community Empowerment</div>
                </div>
              </div>
              <p className="vs-footer-tagline">
                "Seeing into the future while going back to our roots to obtain knowledge to move forward."
              </p>
            </div>

            <div className="vs-footer-col">
              <h5>About</h5>
              <ul>
                <li><a href="/about">Our Story</a></li>
                <li><a href="/staff">Leadership</a></li>
                <li><a href="/partners">Coalition</a></li>
                <li><a href="/gallery">Events</a></li>
              </ul>
            </div>

            <div className="vs-footer-col">
              <h5>Programs</h5>
              <ul>
                <li><a href="/programs/unsheltered">Unsheltered Outreach</a></li>
                <li><a href="/programs/refugee-immigrant">Refugee &amp; Immigrant</a></li>
                <li><a href="/programs/housing">Housing Assistance</a></li>
                <li><a href="/programs/youth">Youth &amp; Education</a></li>
              </ul>
            </div>

            <div className="vs-footer-col">
              <h5>Engage</h5>
              <ul>
                <li><a href="/get-help">Get Help</a></li>
                <li><a href="/donate">Donate</a></li>
                <li><a href="/volunteer">Volunteer</a></li>
                <li><a href="/contact">Contact</a></li>
              </ul>
            </div>

          </div>

          <div className="vs-footer-bar">
            <div>
              <span className="vs-mono">EIN PENDING</span>
              <span className="vs-footer-bar-divider">·</span>
              <span>{config.business.name} is a 501(c)(3) tax-exempt organization. Contributions are tax-deductible.</span>
            </div>
            <div className="vs-yakini-credit">
              <span>© {year} {config.business.name}</span>
              <span className="vs-footer-bar-divider">·</span>
              Built by{' '}
              <a href="https://yakini.digital" target="_blank" rel="noopener noreferrer">
                Yakini Digital
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
