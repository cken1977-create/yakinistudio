// ═════════════════════════════════════════════════════════════════════════
// CTA BANDS — Two side-by-side calls to action
// ═════════════════════════════════════════════════════════════════════════
// Two equal-width bands sitting flush against each other:
//   Left band — soft white-gray ground, "If You Need Us" kicker,
//                "We meet you where you are." headline, supportive copy,
//                primary red CTA button "Begin Intake".
//   Right band — Pan-African red ground, white type, "Support Our Work"
//                kicker, "The work needs partners." headline, copy
//                inverted for contrast, white CTA button on red.
//
// The two bands carry semantically distinct messages and visually
// distinct colors. The eye sees them as two different invitations
// before reading a single word. Quiet vs. urgent, calm vs. red.
//
// On mobile, bands stack vertically with help band first.
// ═════════════════════════════════════════════════════════════════════════

import { VS_RED, VS_INK } from './TriColorRule'

interface CTABand {
  kicker: string
  headline: string
  body: string
  cta: string
  href: string
}

interface CTABandsProps {
  help?: CTABand
  support?: CTABand
}

const DEFAULT_HELP: CTABand = {
  kicker: 'If You Need Us',
  headline: 'We meet you where you are.',
  body: 'Housing, family support, refugee resettlement, food assistance, educational pathways — whatever the need, we hear you. Begin a confidential intake. No appointment needed.',
  cta: 'Begin Intake',
  href: '/get-help',
}

const DEFAULT_SUPPORT: CTABand = {
  kicker: 'Support Our Work',
  headline: 'The work needs partners.',
  body: 'Every dollar funds direct services for families in crisis. Every volunteer hour expands our reach. Every partnership compounds what we can do alone.',
  cta: 'Become a Partner',
  href: '/donate',
}

export function CTABands({
  help = DEFAULT_HELP,
  support = DEFAULT_SUPPORT,
}: CTABandsProps) {
  return (
    <>
      <style>{`
        .vs-cta-bands {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
        }
        .vs-cta-band {
          padding: 6rem 4rem;
          position: relative;
        }
        .vs-cta-band-help {
          background: #FAFAFA;
        }
        .vs-cta-band-support {
          background: #0F0F0F;
          color: #FFFFFF;
        }

        .vs-cta-kicker {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: ${VS_RED};
          display: block;
          margin-bottom: 1rem;
        }
        .vs-cta-band-support .vs-cta-kicker {
          color: rgba(255, 255, 255, 0.95);
        }

        .vs-cta-headline {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(1.75rem, 3.5vw, 2.25rem);
          font-weight: 500;
          line-height: 1.1;
          letter-spacing: -0.012em;
          color: ${VS_INK};
          margin: 0 0 1.5rem;
        }
        .vs-cta-band-support .vs-cta-headline {
          color: #FFFFFF;
        }

        .vs-cta-body {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 1.0625rem;
          line-height: 1.6;
          color: #4A4A4A;
          max-width: 26rem;
          margin: 0 0 2.5rem;
        }
        .vs-cta-band-support .vs-cta-body {
          color: rgba(255, 255, 255, 0.92);
        }

        .vs-cta-button {
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
        .vs-cta-band-help .vs-cta-button {
          background: ${VS_RED};
          color: #FFFFFF;
          box-shadow: 0 2px 10px rgba(206, 17, 38, 0.22);
        }
        .vs-cta-band-help .vs-cta-button:hover {
          background: #A20D1E;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(206, 17, 38, 0.32);
        }
        .vs-cta-band-support .vs-cta-button {
          background: ${VS_RED};
          color: #FFFFFF;
          box-shadow: 0 2px 10px rgba(206, 17, 38, 0.32);
        }
        .vs-cta-band-support .vs-cta-button:hover {
          background: #A20D1E;
          color: #FFFFFF;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(206, 17, 38, 0.44);
        }

        @media (max-width: 800px) {
          .vs-cta-bands {
            grid-template-columns: 1fr;
          }
          .vs-cta-band {
            padding: 4rem 2rem;
          }
        }
        @media (max-width: 500px) {
          .vs-cta-band {
            padding: 3rem 1.5rem;
          }
        }
      `}</style>

      <section className="vs-cta-bands" aria-label="Calls to action">
        <div className="vs-cta-band vs-cta-band-help">
          <span className="vs-cta-kicker">{help.kicker}</span>
          <h2 className="vs-cta-headline">{help.headline}</h2>
          <p className="vs-cta-body">{help.body}</p>
          <a href={help.href} className="vs-cta-button">{help.cta}</a>
        </div>

        <div className="vs-cta-band vs-cta-band-support">
          <span className="vs-cta-kicker">{support.kicker}</span>
          <h2 className="vs-cta-headline">{support.headline}</h2>
          <p className="vs-cta-body">{support.body}</p>
          <a href={support.href} className="vs-cta-button">{support.cta}</a>
        </div>
      </section>
    </>
  )
}
