// ═════════════════════════════════════════════════════════════════════════
// VOICES — Three-card testimonial grid with founder emphasis
// ═════════════════════════════════════════════════════════════════════════
// Three columns: founder card (1.4fr, larger, navy ground), then two
// supporting voices (1fr each, soft-white ground). The founder card is
// architecturally distinct — navy ground, white type, tri-color rule
// along the top edge, larger portrait circle with red ring shadow.
//
// Each card has:
//   - Portrait circle (initial placeholder until real photos uploaded)
//   - Role in JetBrains Mono Pan-African green deep
//   - Name in Cormorant Garamond
//   - Italic quote in Newsreader (or Cormorant Garamond on founder card)
//
// Voices are passed as props with optional `featured` flag for founder.
// Default values match VS's three voices: Khadijah, Maria L., Denise.
// ═════════════════════════════════════════════════════════════════════════

import { VS_NAVY, VS_RED, VS_INK, VS_GREEN } from './TriColorRule'

export interface Voice {
  name: string
  role: string
  quote: string
  initial?: string        // Portrait initial; defaults to first letter of name
  imageSrc?: string       // Optional photo path; falls back to initial circle
  featured?: boolean      // True for the dominant founder card
}

interface VoicesProps {
  voices?: Voice[]
}

const DEFAULT_VOICES: Voice[] = [
  {
    name: 'Khadijah',
    role: 'Founder & Executive Director',
    quote: 'I built Vizionz Sankofa because I saw families with nowhere to turn, and I refused to look away. Sankofa means we go back for the wisdom we need to move forward — and we bring that wisdom to whoever walks through our door, regardless of where they come from. This work is about dignity. Always.',
    featured: true,
  },
  {
    name: 'Maria L.',
    role: 'Program Participant',
    quote: 'Vizionz Sankofa met me when I had nothing. They didn\'t ask me where I came from before they helped — they just helped. Now I have a place to live and my children are in school.',
  },
  {
    name: 'Denise Kennedy',
    role: 'Coalition Partner',
    quote: 'Women with Vizionz exists alongside Vizionz Sankofa because the work is too big for one organization. Together we cover ground neither of us could cover alone.',
  },
]

export function Voices({ voices = DEFAULT_VOICES }: VoicesProps) {
  return (
    <>
      <style>{`
        .vs-voices {
          padding: 6rem 0;
          background: #FFFFFF;
        }
        .vs-voices-inner {
          max-width: 72rem;
          margin: 0 auto;
          padding: 0 2.5rem;
        }
        .vs-voices-header {
          max-width: 38rem;
          margin-bottom: 4rem;
        }
        .vs-voices-kicker {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: ${VS_RED};
        }
        .vs-voices-headline {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(2rem, 4.5vw, 2.75rem);
          font-weight: 500;
          line-height: 1.08;
          letter-spacing: -0.012em;
          color: ${VS_INK};
          margin: 1rem 0 0;
        }

        .vs-voices-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr;
          gap: 2rem;
        }

        .vs-voice-card {
          background: #FAFAFA;
          padding: 2rem;
          border: 1px solid #E5E5E5;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
        }
        .vs-voice-card.featured {
          background: ${VS_NAVY};
          color: #FFFFFF;
          border: none;
          box-shadow: 0 16px 36px -10px rgba(10, 37, 72, 0.35);
          position: relative;
          overflow: hidden;
        }
        .vs-voice-card.featured::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg,
            ${VS_RED} 0%, ${VS_RED} 33%,
            ${VS_INK} 33%, ${VS_INK} 67%,
            ${VS_GREEN} 67%, ${VS_GREEN} 100%);
        }

        .vs-voice-portrait {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          background: #FFFFFF;
          display: grid;
          place-items: center;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 2rem;
          color: #767676;
          font-style: italic;
          margin-bottom: 1.5rem;
          box-shadow: 0 0 0 2px #FAFAFA, 0 0 0 3px ${VS_RED};
          background-size: cover;
          background-position: center;
          overflow: hidden;
        }
        .vs-voice-card.featured .vs-voice-portrait {
          background: #FFFFFF;
          color: ${VS_NAVY};
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.25);
        }

        .vs-voice-role {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-size: 0.6875rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #005422;
          margin: 0 0 0.5rem;
          font-weight: 600;
        }
        .vs-voice-card.featured .vs-voice-role {
          color: rgba(255, 255, 255, 0.78);
        }

        .vs-voice-name {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1.5rem;
          font-weight: 600;
          color: ${VS_INK};
          margin: 0 0 1.5rem;
        }
        .vs-voice-card.featured .vs-voice-name {
          color: #FFFFFF;
        }

        .vs-voice-quote {
          font-family: 'Newsreader', Georgia, serif;
          font-style: italic;
          font-size: 1rem;
          line-height: 1.55;
          color: ${VS_INK};
          margin: 0;
        }
        .vs-voice-card.featured .vs-voice-quote {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1.0625rem;
          color: rgba(255, 255, 255, 0.92);
        }

        @media (max-width: 1024px) {
          .vs-voices-grid {
            grid-template-columns: 1fr 1fr;
          }
          .vs-voice-card.featured {
            grid-column: span 2;
          }
        }
        @media (max-width: 700px) {
          .vs-voices { padding: 4rem 0; }
          .vs-voices-inner { padding: 0 1.5rem; }
          .vs-voices-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          .vs-voice-card.featured {
            grid-column: span 1;
          }
        }
      `}</style>

      <section className="vs-voices" aria-labelledby="vs-voices-heading">
        <div className="vs-voices-inner">
          <div className="vs-voices-header">
            <span className="vs-voices-kicker">Voices</span>
            <h2 id="vs-voices-heading" className="vs-voices-headline">
              Who we are, in our own words.
            </h2>
          </div>

          <div className="vs-voices-grid">
            {voices.map((voice, idx) => {
              const initial = voice.initial || voice.name.charAt(0).toUpperCase()
              const portraitStyle = voice.imageSrc
                ? { backgroundImage: `url(${voice.imageSrc})` }
                : undefined
              return (
                <article
                  key={`${voice.name}-${idx}`}
                  className={`vs-voice-card ${voice.featured ? 'featured' : ''}`}
                >
                  <div
                    className="vs-voice-portrait"
                    style={portraitStyle}
                    aria-label={voice.name}
                  >
                    {!voice.imageSrc && initial}
                  </div>
                  <div className="vs-voice-role">{voice.role}</div>
                  <h3 className="vs-voice-name">{voice.name}</h3>
                  <blockquote className="vs-voice-quote">
                    "{voice.quote}"
                  </blockquote>
                </article>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
