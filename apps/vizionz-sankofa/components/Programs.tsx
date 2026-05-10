// ═════════════════════════════════════════════════════════════════════════
// PROGRAMS — Six program cards, the operational manifest
// ═════════════════════════════════════════════════════════════════════════
// Soft white-gray ground, section header (kicker, headline, sub),
// then a 3-column grid of program cards. Each card displays:
//   - Program · 01 numbering in JetBrains Mono Pan-African green
//   - Program title in Cormorant Garamond
//   - Description in Newsreader body
//   - "Learn More →" arrow link in Pan-African red
//
// On hover: card lifts, border becomes Pan-African red, the tri-color
// rule sweeps across the top of the card from left to right (the
// architectural signature applied to interaction).
//
// Reads from BrandConfig.services for all six programs.
// ═════════════════════════════════════════════════════════════════════════

import type { BrandConfig } from '@yakini/config'
import { VS_RED, VS_INK, VS_GREEN } from './TriColorRule'

export function Programs({ config }: { config: BrandConfig }) {
  return (
    <>
      <style>{`
        .vs-programs {
          padding: 6rem 0;
          background: #FAFAFA;
        }
        .vs-programs-inner {
          max-width: 72rem;
          margin: 0 auto;
          padding: 0 2.5rem;
        }
        .vs-programs-header {
          max-width: 38rem;
          margin-bottom: 4rem;
        }
        .vs-programs-kicker {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: ${VS_RED};
        }
        .vs-programs-headline {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(2rem, 4.5vw, 2.75rem);
          font-weight: 500;
          line-height: 1.08;
          letter-spacing: -0.012em;
          color: ${VS_INK};
          margin: 1rem 0 0;
        }
        .vs-programs-sub {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 1.0625rem;
          color: #4A4A4A;
          line-height: 1.65;
          margin: 1.5rem 0 0;
        }

        .vs-programs-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }
        .vs-program-card {
          background: #FFFFFF;
          padding: 2rem;
          border: 1px solid #E5E5E5;
          border-radius: 4px;
          transition: all 250ms ease;
          position: relative;
          overflow: hidden;
        }
        .vs-program-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(90deg,
            ${VS_RED} 0%, ${VS_RED} 33%,
            ${VS_INK} 33%, ${VS_INK} 67%,
            ${VS_GREEN} 67%, ${VS_GREEN} 100%);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 350ms ease;
        }
        .vs-program-card:hover {
          border-color: #E2293E;
          transform: translateY(-3px);
          box-shadow: 0 16px 32px -10px rgba(10, 37, 72, 0.12);
        }
        .vs-program-card:hover::before {
          transform: scaleX(1);
        }
        .vs-program-number {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-size: 0.6875rem;
          letter-spacing: 0.2em;
          color: #005422;
          font-weight: 600;
        }
        .vs-program-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1.625rem;
          font-weight: 500;
          line-height: 1.15;
          color: ${VS_INK};
          margin: 0.75rem 0 1rem;
        }
        .vs-program-desc {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 0.9375rem;
          color: #4A4A4A;
          line-height: 1.6;
          margin: 0;
        }
        .vs-program-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1.5rem;
          font-family: 'Newsreader', Georgia, serif;
          font-size: 0.8125rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 600;
          color: ${VS_RED};
          text-decoration: none;
          transition: color 200ms ease;
        }
        .vs-program-link::after {
          content: '→';
          transition: transform 200ms ease;
        }
        .vs-program-card:hover .vs-program-link::after {
          transform: translateX(4px);
        }
        .vs-program-link:hover {
          color: #A20D1E;
        }

        @media (max-width: 1024px) {
          .vs-programs-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 700px) {
          .vs-programs { padding: 4rem 0; }
          .vs-programs-inner { padding: 0 1.5rem; }
          .vs-programs-grid {
            grid-template-columns: 1fr;
            gap: 1.25rem;
          }
        }
      `}</style>

      <section className="vs-programs" aria-labelledby="vs-programs-heading">
        <div className="vs-programs-inner">
          <div className="vs-programs-header">
            <span className="vs-programs-kicker">What We Do</span>
            <h2 id="vs-programs-heading" className="vs-programs-headline">
              {config.services.headline}
            </h2>
            <p className="vs-programs-sub">
              {config.services.subheadline}
            </p>
          </div>

          <div className="vs-programs-grid">
            {config.services.items.map((program, idx) => {
              const slug = program.title
                .toLowerCase()
                .replace(/&/g, 'and')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
              const num = String(idx + 1).padStart(2, '0')
              return (
                <article key={program.title} className="vs-program-card">
                  <span className="vs-program-number">PROGRAM · {num}</span>
                  <h3 className="vs-program-title">{program.title}</h3>
                  <p className="vs-program-desc">{program.description}</p>
                  <a href={`/programs/${slug}`} className="vs-program-link">
                    Learn More
                  </a>
                </article>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
