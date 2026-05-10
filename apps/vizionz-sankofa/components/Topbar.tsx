// ═════════════════════════════════════════════════════════════════════════
// TOPBAR — Above-the-header utility strip
// ═════════════════════════════════════════════════════════════════════════
// Deep navy ground, white type, "EST. 2014" + address on the left,
// phone + email on the right. Tri-color rule along the bottom edge.
//
// Reads from BrandConfig.contact for live values.
// ═════════════════════════════════════════════════════════════════════════

import type { BrandConfig } from '@yakini/config'
import { VS_NAVY, VS_RED, VS_INK, VS_GREEN } from './TriColorRule'

export function Topbar({ config }: { config: BrandConfig }) {
  return (
    <>
      <style>{`
        .vs-topbar {
          background: ${VS_NAVY};
          color: rgba(255, 255, 255, 0.92);
          padding: 0.5rem 0;
          font-size: 0.8125rem;
          letter-spacing: 0.02em;
          position: relative;
        }
        .vs-topbar::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg,
            ${VS_RED} 0%, ${VS_RED} 33%,
            ${VS_INK} 33%, ${VS_INK} 67%,
            ${VS_GREEN} 67%, ${VS_GREEN} 100%);
        }
        .vs-topbar-inner {
          max-width: 72rem;
          margin: 0 auto;
          padding: 0 2.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        .vs-topbar a {
          color: inherit;
          text-decoration: none;
          opacity: 0.85;
          transition: opacity 200ms ease;
        }
        .vs-topbar a:hover { opacity: 1; }
        .vs-topbar-divider {
          margin: 0 0.75rem;
          opacity: 0.4;
        }
        .vs-topbar-meta {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
        }
        @media (max-width: 700px) {
          .vs-topbar { font-size: 0.75rem; }
          .vs-topbar-inner { padding: 0 1.25rem; gap: 0.5rem; }
          .vs-topbar-divider { margin: 0 0.5rem; }
        }
      `}</style>

      <div className="vs-topbar">
        <div className="vs-topbar-inner">
          <div>
            <span className="vs-topbar-meta">EST. {config.business.yearFounded || '2014'}</span>
            <span className="vs-topbar-divider">·</span>
            <span>{config.contact.address}{config.contact.address ? ', ' : ''}{config.contact.location}</span>
          </div>
          <div>
            {config.contact.phone && (
              <>
                <a href={`tel:${config.contact.phone.replace(/\D/g, '')}`}>
                  {config.contact.phone}
                </a>
                <span className="vs-topbar-divider">·</span>
              </>
            )}
            <a href={`mailto:${config.contact.email}`}>
              {config.contact.email}
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
