// ═════════════════════════════════════════════════════════════════════════
// COALITION — Partners and funders, two sub-grouped lists
// ═════════════════════════════════════════════════════════════════════════
// Deep navy ground (matching Footer ground for visual continuity).
// Tri-color rule along the top edge as architectural signature.
// Section header with "Coalition & Support" kicker, headline, sub.
//
// Two distinct sub-groups under one section:
//   - "Coalition Partners" — orgs we work alongside (peers, sister orgs,
//     city partners, academic partners). 6 cards in 3-column grid.
//   - "Funders & Institutional Support" — orgs that fund the work
//     (foundations, food banks, civic funders). 3 cards in 3-column grid.
//
// Each item shows:
//   - Role label in JetBrains Mono Pan-African red-light caps
//   - Organization name in Cormorant Garamond
//   - Short description in Newsreader body
//
// Subgrouped by `kind: 'partner' | 'funder'` in the items array.
// ═════════════════════════════════════════════════════════════════════════

import { VS_NAVY, VS_RED, VS_INK, VS_GREEN } from './TriColorRule'

const VS_GREEN_DEEP = '#003D1A'  // Deep Pan-African green for the architectural ground

export interface CoalitionItem {
  kind: 'partner' | 'funder'
  name: string
  role: string                  // "Standards Authority", "Foundation", etc.
  description: string
}

interface CoalitionProps {
  items?: CoalitionItem[]
}

const DEFAULT_ITEMS: CoalitionItem[] = [
  // Coalition Partners
  {
    kind: 'partner',
    role: 'Standards Authority',
    name: 'BRSA Foundation',
    description: 'Funding access to readiness evaluation and certification programs for the communities we serve.',
  },
  {
    kind: 'partner',
    role: 'Pilot Platform',
    name: 'Legacyline',
    description: 'Vizionz Sankofa is the primary pilot partner for individual readiness and organizational behavioral readiness.',
  },
  {
    kind: 'partner',
    role: 'City Partner',
    name: 'Albuquerque Community Services',
    description: "The city's behavioral health and unsheltered response — we partner on outreach, stabilization, and pathways forward.",
  },
  {
    kind: 'partner',
    role: 'Sister Organization',
    name: 'Women with Vizionz',
    description: 'Led by Denise Kennedy — focused on women in our community navigating healing, work, and family stability.',
  },
  {
    kind: 'partner',
    role: 'Community Partner',
    name: 'Big Chef Bowie Cares',
    description: "Led by Chef Don Bowie — bringing food security and culinary workforce pathways into the coalition's reach.",
  },
  {
    kind: 'partner',
    role: 'Academic Partners',
    name: 'UNM Diversity & African American Affairs',
    description: "Cultural humility curricula, health equity research, and student support across UNM's Health Sciences Center.",
  },

  // Funders & Institutional Support
  {
    kind: 'funder',
    role: 'Foundation',
    name: 'Albuquerque Community Foundation',
    description: 'Major New Mexico grantmaker supporting our community programs and capacity building.',
  },
  {
    kind: 'funder',
    role: 'Food Security',
    name: 'Roadrunner Food Bank of New Mexico',
    description: 'Regional food bank supplying our monthly community food distributions across Albuquerque.',
  },
  {
    kind: 'funder',
    role: 'Civic Funder',
    name: 'United Way of North Central New Mexico',
    description: 'Sustained civic support for our community service work across the region.',
  },
]

export function Coalition({ items = DEFAULT_ITEMS }: CoalitionProps) {
  const partners = items.filter(i => i.kind === 'partner')
  const funders = items.filter(i => i.kind === 'funder')

  return (
    <>
      <style>{`
        .vs-coalition {
          padding: 6rem 0;
          background: #005422;
          color: #FFFFFF;
          position: relative;
        }
        .vs-coalition::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
          background: linear-gradient(90deg,
            ${VS_RED} 0%, ${VS_RED} 33%,
            ${VS_INK} 33%, ${VS_INK} 67%,
            ${VS_GREEN} 67%, ${VS_GREEN} 100%);
        }
        .vs-coalition-inner {
          max-width: 72rem;
          margin: 0 auto;
          padding: 0 2.5rem;
        }
        .vs-coalition-header {
          max-width: 38rem;
          margin-bottom: 4rem;
        }
        .vs-coalition-kicker {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #0A0A0A;
        }
        .vs-coalition-headline {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(2rem, 4.5vw, 2.75rem);
          font-weight: 500;
          line-height: 1.08;
          letter-spacing: -0.012em;
          color: #FFFFFF;
          margin: 1rem 0 0;
        }
        .vs-coalition-sub {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 1.0625rem;
          color: rgba(255, 255, 255, 0.78);
          line-height: 1.65;
          margin: 1.5rem 0 0;
        }

        .vs-coalition-subhead {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-size: 0.75rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.85);
          margin: 4rem 0 1.5rem;
          font-weight: 600;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        .vs-coalition-subhead:first-of-type {
          margin-top: 0;
        }

        .vs-coalition-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        .vs-coalition-item {
          padding: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.03);
          transition: all 250ms ease;
        }
        .vs-coalition-item:hover {
          border-color: #0A0A0A;
          background: rgba(255, 255, 255, 0.06);
          transform: translateY(-2px);
        }
        .vs-coalition-role {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-size: 0.625rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #0A0A0A;
          display: block;
          margin: 0 0 0.75rem;
          font-weight: 600;
        }
        .vs-coalition-name {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1.25rem;
          font-weight: 500;
          line-height: 1.2;
          color: #FFFFFF;
          margin: 0 0 0.5rem;
        }
        .vs-coalition-desc {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 0.9rem;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.75);
          margin: 0;
        }

        @media (max-width: 1024px) {
          .vs-coalition-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 700px) {
          .vs-coalition { padding: 4rem 0; }
          .vs-coalition-inner { padding: 0 1.5rem; }
          .vs-coalition-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .vs-coalition-subhead { margin: 3rem 0 1rem; }
        }
      `}</style>

      <section className="vs-coalition" aria-labelledby="vs-coalition-heading">
        <div className="vs-coalition-inner">
          <div className="vs-coalition-header">
            <span className="vs-coalition-kicker">Coalition &amp; Support</span>
            <h2 id="vs-coalition-heading" className="vs-coalition-headline">
              We do not do this work alone.
            </h2>
            <p className="vs-coalition-sub">
              Our coalition strengthens what each organization can do alone —
              institutional partnerships, family alliances, and major funders
              that share both mission and accountability.
            </p>
          </div>

          {partners.length > 0 && (
            <>
              <div className="vs-coalition-subhead">Coalition Partners</div>
              <div className="vs-coalition-grid">
                {partners.map((item, idx) => (
                  <article key={`partner-${idx}`} className="vs-coalition-item">
                    <span className="vs-coalition-role">{item.role}</span>
                    <h3 className="vs-coalition-name">{item.name}</h3>
                    <p className="vs-coalition-desc">{item.description}</p>
                  </article>
                ))}
              </div>
            </>
          )}

          {funders.length > 0 && (
            <>
              <div className="vs-coalition-subhead">Funders &amp; Institutional Support</div>
              <div className="vs-coalition-grid">
                {funders.map((item, idx) => (
                  <article key={`funder-${idx}`} className="vs-coalition-item">
                    <span className="vs-coalition-role">{item.role}</span>
                    <h3 className="vs-coalition-name">{item.name}</h3>
                    <p className="vs-coalition-desc">{item.description}</p>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  )
}
