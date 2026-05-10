// ═════════════════════════════════════════════════════════════════════════
// MISSION — Founding doctrine section
// ═════════════════════════════════════════════════════════════════════════
// Two-column layout. Left: "OUR MISSION" kicker, tri-color rule,
// "Stewards of their own lives." headline. Right: founding story
// paragraph, pull-quote with Pan-African red border-left, then the
// "extended work" paragraph that broadens the org's scope.
//
// The pull-quote is the load-bearing visual element of this section.
// It carries the original 2014 founding intent — "Every child should
// be given the opportunity to pursue the dream of life, liberty, and
// the pursuit of happiness" — in italic Pan-African red, bordered.
// ═════════════════════════════════════════════════════════════════════════

import type { BrandConfig } from '@yakini/config'
import { VS_RED, VS_INK, VS_GREEN } from './TriColorRule'

export function Mission({ config }: { config: BrandConfig }) {
  return (
    <>
      <style>{`
        .vs-mission {
          padding: 6rem 0;
          background: #FFFFFF;
        }
        .vs-mission-inner {
          max-width: 72rem;
          margin: 0 auto;
          padding: 0 2.5rem;
        }
        .vs-mission-grid {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 4rem;
        }
        .vs-mission-kicker {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: ${VS_RED};
        }
        .vs-mission-rule {
          width: 4rem;
          height: 4px;
          border: 0;
          margin: 1.5rem 0;
          background: linear-gradient(90deg,
            ${VS_RED} 0%, ${VS_RED} 33%,
            ${VS_INK} 33%, ${VS_INK} 67%,
            ${VS_GREEN} 67%, ${VS_GREEN} 100%);
        }
        .vs-mission-headline {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(2rem, 4vw, 2.75rem);
          font-weight: 500;
          line-height: 1.08;
          letter-spacing: -0.012em;
          color: ${VS_INK};
          margin: 0;
        }

        .vs-mission-body p {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 1.125rem;
          line-height: 1.65;
          color: ${VS_INK};
          margin: 0 0 1.5rem;
        }
        .vs-mission-body p:last-child {
          margin-bottom: 0;
        }

        .vs-mission-pull {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-style: italic;
          font-size: 1.625rem;
          line-height: 1.4;
          color: ${VS_RED};
          padding: 0.5rem 0 0.5rem 1.5rem;
          border-left: 4px solid ${VS_RED};
          margin: 2.5rem 0;
        }

        @media (max-width: 800px) {
          .vs-mission { padding: 4rem 0; }
          .vs-mission-inner { padding: 0 1.5rem; }
          .vs-mission-grid { grid-template-columns: 1fr; gap: 2rem; }
          .vs-mission-pull { font-size: 1.375rem; margin: 2rem 0; }
        }
      `}</style>

      <section className="vs-mission" aria-labelledby="vs-mission-heading">
        <div className="vs-mission-inner">
          <div className="vs-mission-grid">

            <div>
              <span className="vs-mission-kicker">Our Mission</span>
              <hr className="vs-mission-rule" />
              <h2 id="vs-mission-heading" className="vs-mission-headline">
                Stewards of their own lives.
              </h2>
            </div>

            <div className="vs-mission-body">
              <p>
                Vizionz Sankofa was founded in {config.business.yearFounded || 2014} to
                assist youth and young adults in becoming stewards of their lives —
                despite socio-economic conditions beyond their control. We began with
                a focus on African American youth navigating disparities in schools,
                the justice system, and CYFD custody.
              </p>

              <blockquote className="vs-mission-pull">
                "Every child should be given the opportunity to pursue the dream of life,
                liberty, and the pursuit of happiness."
              </blockquote>

              <p>
                The work has since extended to anyone in New Mexico without the substrate
                to thrive — unsheltered neighbors, refugee and immigrant families of
                every background, youth in crisis, and the families who carry them. The
                Sankofa philosophy is universal: heritage as compass, dignity as ground,
                knowing where you come from as the foundation for moving forward.
              </p>

              <p>
                Our doors are open. We meet families where they are.
              </p>
            </div>

          </div>
        </div>
      </section>
    </>
  )
}
