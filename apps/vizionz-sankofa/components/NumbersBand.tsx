// ═════════════════════════════════════════════════════════════════════════
// NUMBERS BAND — By-the-numbers credibility strip
// ═════════════════════════════════════════════════════════════════════════
// Black ground (Pan-African register, not navy/American). Tri-color rule
// along the top edge. Four large stats with italic Pan-African red
// accent figures.
// ═════════════════════════════════════════════════════════════════════════

import { VS_RED, VS_INK, VS_GREEN } from './TriColorRule'

const VS_BLACK = '#0F0F0F'  // Slightly softened from pure black to avoid harshness

export interface NumberStat {
  figure: string
  accent?: string
  label: string
}

interface NumbersBandProps {
  stats?: NumberStat[]
}

const DEFAULT_STATS: NumberStat[] = [
  { figure: '500', accent: '+', label: 'Families Served' },
  { figure: '11',                 label: 'Years of Service' },
  { figure: '6',                  label: 'Active Programs' },
  { figure: '8',  accent: '+', label: 'Coalition Partners' },
]

export function NumbersBand({ stats = DEFAULT_STATS }: NumbersBandProps) {
  return (
    <>
      <style>{`
        .vs-numbers {
          background: ${VS_BLACK};
          color: #FFFFFF;
          padding: 4rem 0;
          position: relative;
        }
        .vs-numbers::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
          background: linear-gradient(90deg,
            ${VS_RED} 0%, ${VS_RED} 33%,
            ${VS_INK} 33%, ${VS_INK} 67%,
            ${VS_GREEN} 67%, ${VS_GREEN} 100%);
        }
        .vs-numbers-inner {
          max-width: 72rem;
          margin: 0 auto;
          padding: 0 2.5rem;
        }
        .vs-numbers-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2.5rem;
        }
        .vs-number-stat {
          text-align: center;
          padding: 0 1rem;
          position: relative;
        }
        .vs-number-stat:not(:last-child)::after {
          content: '';
          position: absolute;
          right: 0;
          top: 20%;
          bottom: 20%;
          width: 1px;
          background: rgba(255, 255, 255, 0.15);
        }
        .vs-number-figure {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(2.75rem, 5.5vw, 4rem);
          font-weight: 600;
          color: #FFFFFF;
          line-height: 1;
          letter-spacing: -0.02em;
        }
        .vs-number-accent {
          font-style: italic;
          color: #E2293E;
          font-weight: 600;
        }
        .vs-number-label {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 0.6875rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.72);
          margin-top: 1rem;
        }

        @keyframes vs-numbers-rise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .vs-number-figure {
          animation: vs-numbers-rise 800ms ease both;
        }
        .vs-number-stat:nth-child(1) .vs-number-figure { animation-delay: 100ms; }
        .vs-number-stat:nth-child(2) .vs-number-figure { animation-delay: 200ms; }
        .vs-number-stat:nth-child(3) .vs-number-figure { animation-delay: 300ms; }
        .vs-number-stat:nth-child(4) .vs-number-figure { animation-delay: 400ms; }

        @media (max-width: 900px) {
          .vs-numbers-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 2rem 1.5rem;
          }
          .vs-number-stat:nth-child(2)::after { display: none; }
        }
        @media (max-width: 500px) {
          .vs-numbers { padding: 3rem 0; }
          .vs-numbers-inner { padding: 0 1.5rem; }
          .vs-numbers-grid { gap: 2rem 1rem; }
        }
      `}</style>

      <section className="vs-numbers" aria-label="By the numbers">
        <div className="vs-numbers-inner">
          <div className="vs-numbers-grid">
            {stats.map((stat, idx) => (
              <div key={idx} className="vs-number-stat">
                <div className="vs-number-figure">
                  {stat.figure}
                  {stat.accent && (
                    <span className="vs-number-accent">{stat.accent}</span>
                  )}
                </div>
                <div className="vs-number-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
