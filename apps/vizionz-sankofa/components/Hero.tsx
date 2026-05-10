// ═════════════════════════════════════════════════════════════════════════
// HERO — Vizionz Sankofa home page hero
// ═════════════════════════════════════════════════════════════════════════
// Split layout: text left (kicker, headline with em-italic accent,
// philosophical sub, two CTAs, meta strip), Pan-African gradient block
// right (navy → red → green diagonal with Sankofa SVG bird emblem and
// the Adinkra proverb caption).
//
// Reads from BrandConfig.home.hero for copy.
// ═════════════════════════════════════════════════════════════════════════

import type { BrandConfig } from '@yakini/config'
import { VS_NAVY, VS_RED, VS_GREEN, VS_INK } from './TriColorRule'

export function Hero({ config }: { config: BrandConfig }) {
  const { hero } = config.home

  return (
    <>
      <style>{`
        .vs-hero {
          padding: 6rem 0 6rem;
          position: relative;
          overflow: hidden;
        }
        .vs-hero::before {
          content: '';
          position: absolute;
          top: -100px; right: -100px;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(206, 17, 38, 0.04) 0%, transparent 70%);
          z-index: 0;
        }
        .vs-hero::after {
          content: '';
          position: absolute;
          bottom: -100px; left: -100px;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(0, 122, 51, 0.04) 0%, transparent 70%);
          z-index: 0;
        }
        .vs-hero-inner {
          max-width: 72rem;
          margin: 0 auto;
          padding: 0 2.5rem;
          position: relative;
          z-index: 1;
        }
        .vs-hero-grid {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: 6rem;
          align-items: center;
        }
        .vs-hero-eyebrow {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .vs-hero-eyebrow::before {
          content: '';
          display: block;
          width: 2.5rem;
          height: 4px;
          background: linear-gradient(90deg,
            ${VS_RED} 0%, ${VS_RED} 33%,
            ${VS_INK} 33%, ${VS_INK} 67%,
            ${VS_GREEN} 67%, ${VS_GREEN} 100%);
        }
        .vs-hero-kicker {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: ${VS_RED};
        }
        .vs-hero-headline {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(2.75rem, 6.5vw, 5rem);
          line-height: 1.0;
          letter-spacing: -0.02em;
          font-weight: 500;
          color: ${VS_INK};
          margin: 0 0 2.5rem;
        }
        .vs-hero-headline em {
          font-style: italic;
          color: ${VS_RED};
          font-weight: 600;
          display: block;
        }
        .vs-hero-tagline {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-style: italic;
          font-size: 1.4rem;
          color: #4A4A4A;
          max-width: 36rem;
          margin: 0 0 2.5rem;
          line-height: 1.5;
        }
        .vs-hero-actions {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
          margin-bottom: 4rem;
        }
        .vs-hero-cta {
          display: inline-block;
          padding: 0.875rem 1.75rem;
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
        .vs-hero-cta-primary {
          background: ${VS_RED};
          color: #FFFFFF;
          box-shadow: 0 2px 10px rgba(206, 17, 38, 0.22);
        }
        .vs-hero-cta-primary:hover {
          background: #A20D1E;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(206, 17, 38, 0.32);
        }
        .vs-hero-cta-secondary {
          background: transparent;
          color: ${VS_NAVY};
          border: 2px solid ${VS_NAVY};
        }
        .vs-hero-cta-secondary:hover {
          background: ${VS_NAVY};
          color: #FFFFFF;
        }
        .vs-hero-meta {
          padding-top: 1.5rem;
          border-top: 1px solid #E5E5E5;
          display: flex;
          gap: 4rem;
          flex-wrap: wrap;
        }
        .vs-hero-meta-item .data {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          color: ${VS_INK};
          font-size: 0.875rem;
          display: block;
          font-weight: 600;
          letter-spacing: 0.02em;
        }
        .vs-hero-meta-item .label {
          font-size: 0.6875rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #767676;
          margin-top: 4px;
        }

        .vs-hero-visual {
          position: relative;
          aspect-ratio: 4 / 5;
          background: linear-gradient(135deg,
            ${VS_NAVY} 0%,
            ${VS_NAVY} 35%,
            #A20D1E 65%,
            #005422 100%);
          border-radius: 4px;
          overflow: hidden;
          box-shadow:
            0 24px 48px -12px rgba(10, 37, 72, 0.35),
            0 0 0 1px rgba(255, 255, 255, 0.08);
        }
        .vs-hero-visual::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 25% 20%, rgba(255, 255, 255, 0.12) 0%, transparent 55%),
            radial-gradient(ellipse at 75% 75%, rgba(206, 17, 38, 0.18) 0%, transparent 60%);
        }
        .vs-hero-visual::after {
          content: '';
          position: absolute;
          inset: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 2px;
          pointer-events: none;
        }
        .vs-sankofa-emblem {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          color: #FFFFFF;
          z-index: 2;
        }
        .vs-sankofa-emblem svg {
          width: 65%;
          height: auto;
          opacity: 0.95;
          filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.25));
        }
        .vs-hero-visual-caption {
          position: absolute;
          bottom: 1.5rem;
          left: 1.5rem;
          right: 1.5rem;
          color: rgba(255, 255, 255, 0.92);
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-style: italic;
          font-size: 0.9375rem;
          line-height: 1.45;
          z-index: 3;
        }

        @keyframes vs-fade-up {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .vs-hero-headline,
        .vs-hero-tagline,
        .vs-hero-actions,
        .vs-hero-meta {
          animation: vs-fade-up 700ms ease both;
        }
        .vs-hero-tagline { animation-delay: 100ms; }
        .vs-hero-actions { animation-delay: 200ms; }
        .vs-hero-meta { animation-delay: 300ms; }

        @media (max-width: 900px) {
          .vs-hero { padding: 4rem 0 4rem; }
          .vs-hero-grid { grid-template-columns: 1fr; gap: 3rem; }
          .vs-hero-meta { gap: 2rem; }
        }
        @media (max-width: 600px) {
          .vs-hero-inner { padding: 0 1.5rem; }
          .vs-hero-actions { flex-direction: column; }
          .vs-hero-cta { text-align: center; }
        }
      `}</style>

      <section className="vs-hero" aria-label="Welcome to Vizionz Sankofa">
        <div className="vs-hero-inner">
          <div className="vs-hero-grid">
            <div>
              <div className="vs-hero-eyebrow">
                <span className="vs-hero-kicker">
                  Serving New Mexico Since {config.business.yearFounded || '2014'}
                </span>
              </div>
              <h1 className="vs-hero-headline">
                Seeing forward,
                <em>returning to roots.</em>
              </h1>
              <p className="vs-hero-tagline">
                {hero.subheadline}
              </p>
              <div className="vs-hero-actions">
                <a href={hero.ctaLink} className="vs-hero-cta vs-hero-cta-primary">
                  {hero.cta}
                </a>
                {hero.secondaryCta && hero.secondaryCtaLink && (
                  <a href={hero.secondaryCtaLink} className="vs-hero-cta vs-hero-cta-secondary">
                    {hero.secondaryCta}
                  </a>
                )}
              </div>
              <div className="vs-hero-meta">
                <div className="vs-hero-meta-item">
                  <span className="data">501(c)(3)</span>
                  <div className="label">Tax-Exempt</div>
                </div>
                <div className="vs-hero-meta-item">
                  <span className="data">{new Date().getFullYear() - (config.business.yearFounded || 2014)} YEARS</span>
                  <div className="label">Of Service</div>
                </div>
                <div className="vs-hero-meta-item">
                  <span className="data">ALL BACKGROUNDS</span>
                  <div className="label">No One Turned Away</div>
                </div>
              </div>
            </div>

            <div className="vs-hero-visual" aria-hidden="true">
              <div className="vs-sankofa-emblem">
                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="100" cy="100" r="92" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
                  <circle cx="100" cy="100" r="78" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
                  <g stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M 60 130 Q 80 100, 110 105 Q 140 110, 145 95" />
                    <path d="M 145 95 Q 155 70, 130 60 Q 100 55, 95 75" />
                    <path d="M 95 75 Q 90 70, 92 62 L 78 60 L 88 70" />
                    <circle cx="92" cy="68" r="1.5" fill="currentColor"/>
                    <path d="M 60 130 L 50 140 M 60 130 L 55 145 M 60 130 L 65 148" />
                    <path d="M 90 130 L 85 150 M 110 132 L 115 150" />
                    <ellipse cx="78" cy="60" rx="4" ry="5" fill="currentColor" opacity="0.6"/>
                  </g>
                  <text x="100" y="180" textAnchor="middle" fill="currentColor" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontSize="11" letterSpacing="2" opacity="0.78">SANKOFA</text>
                </svg>
              </div>
              <div className="vs-hero-visual-caption">
                "Se wo were fi na wosankofa a yenkyi" —<br />
                it is not wrong to go back for that which you have forgotten.
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  )
}
