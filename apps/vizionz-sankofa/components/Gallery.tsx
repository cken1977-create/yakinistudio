// ═════════════════════════════════════════════════════════════════════════
// GALLERY — Recent events photo grid
// ═════════════════════════════════════════════════════════════════════════
// Five-tile asymmetric grid with one large hero tile (spans 2 rows on
// the left) and four supporting tiles. Each tile shows date in JetBrains
// Mono caps and event caption in Cormorant Garamond.
//
// Without imageSrc: tiles render as colored gradient blocks (navy, red,
// green, navy-light, deep-red) that read as intentional design rather
// than missing images. The Pan-African palette in motion.
//
// With imageSrc: tiles render the photo with a subtle dark gradient
// overlay so caption text remains readable.
//
// Section header includes a "View All Events →" link aligned to the
// right of the section header.
// ═════════════════════════════════════════════════════════════════════════

import { VS_NAVY, VS_RED, VS_INK, VS_GREEN } from './TriColorRule'

export interface GalleryItem {
  date: string           // "May 9, 2026", "Monthly", etc.
  caption: string        // Short event title
  imageSrc?: string      // Optional photo path
  href?: string          // Optional click destination
}

interface GalleryProps {
  items?: GalleryItem[]
  viewAllHref?: string
}

const DEFAULT_ITEMS: GalleryItem[] = [
  { date: 'May 9, 2026',     caption: 'Spring Community Gathering' },
  { date: 'Monthly',         caption: 'Community Food Distribution' },
  { date: 'April 2026',      caption: 'Family Support Workshop' },
  { date: 'March 2026',      caption: 'Refugee Resource Fair' },
  { date: 'February 2026',   caption: 'Coalition Partner Summit' },
]

const TILE_GRADIENTS = [
  `linear-gradient(135deg, ${VS_NAVY} 0%, #061935 100%)`,
  `linear-gradient(135deg, ${VS_RED} 0%, #A20D1E 100%)`,
  `linear-gradient(135deg, ${VS_GREEN} 0%, #005422 100%)`,
  `linear-gradient(135deg, #1A3A66 0%, ${VS_NAVY} 100%)`,
  `linear-gradient(135deg, #A20D1E 0%, #061935 100%)`,
]

export function Gallery({
  items = DEFAULT_ITEMS,
  viewAllHref = '/gallery'
}: GalleryProps) {
  return (
    <>
      <style>{`
        .vs-gallery {
          padding: 6rem 0;
          background: #FAFAFA;
        }
        .vs-gallery-inner {
          max-width: 72rem;
          margin: 0 auto;
          padding: 0 2.5rem;
        }
        .vs-gallery-header {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 2.5rem;
          margin-bottom: 4rem;
          flex-wrap: wrap;
        }
        .vs-gallery-header-text {
          max-width: 38rem;
        }
        .vs-gallery-kicker {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: ${VS_RED};
        }
        .vs-gallery-headline {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(2rem, 4.5vw, 2.75rem);
          font-weight: 500;
          line-height: 1.08;
          letter-spacing: -0.012em;
          color: ${VS_INK};
          margin: 1rem 0 0;
        }
        .vs-gallery-sub {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 1.0625rem;
          color: #4A4A4A;
          line-height: 1.65;
          margin: 1.5rem 0 0;
        }
        .vs-gallery-cta {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-family: 'Newsreader', Georgia, serif;
          font-size: 0.8125rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 600;
          color: ${VS_RED};
          text-decoration: none;
          padding-bottom: 0.5rem;
          transition: color 200ms ease;
        }
        .vs-gallery-cta::after {
          content: '→';
          transition: transform 200ms ease;
        }
        .vs-gallery-cta:hover { color: #A20D1E; }
        .vs-gallery-cta:hover::after { transform: translateX(4px); }

        .vs-gallery-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          gap: 1rem;
          aspect-ratio: 16 / 9;
        }
        .vs-gallery-tile {
          border-radius: 4px;
          overflow: hidden;
          position: relative;
          cursor: pointer;
          transition: transform 250ms ease;
          background-size: cover;
          background-position: center;
          text-decoration: none;
        }
        .vs-gallery-tile:hover {
          transform: scale(1.015);
        }
        .vs-gallery-tile.large {
          grid-row: span 2;
        }
        .vs-gallery-tile::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to top,
            rgba(0, 0, 0, 0.6) 0%,
            rgba(0, 0, 0, 0.15) 40%,
            transparent 70%);
          z-index: 1;
        }
        .vs-gallery-tile-content {
          position: absolute;
          bottom: 1.5rem;
          left: 1.5rem;
          right: 1.5rem;
          color: #FFFFFF;
          z-index: 2;
        }
        .vs-gallery-tile-date {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-size: 0.6875rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.85);
          display: block;
          margin-bottom: 4px;
        }
        .vs-gallery-tile-caption {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1.125rem;
          font-weight: 500;
          line-height: 1.3;
          margin: 0;
        }
        .vs-gallery-tile.large .vs-gallery-tile-caption {
          font-size: 1.625rem;
        }

        @media (max-width: 800px) {
          .vs-gallery { padding: 4rem 0; }
          .vs-gallery-inner { padding: 0 1.5rem; }
          .vs-gallery-grid {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto;
            aspect-ratio: auto;
            gap: 0.75rem;
          }
          .vs-gallery-tile {
            aspect-ratio: 4 / 3;
          }
          .vs-gallery-tile.large {
            grid-row: span 1;
            grid-column: span 2;
            aspect-ratio: 16 / 9;
          }
        }
      `}</style>

      <section className="vs-gallery" aria-labelledby="vs-gallery-heading">
        <div className="vs-gallery-inner">
          <div className="vs-gallery-header">
            <div className="vs-gallery-header-text">
              <span className="vs-gallery-kicker">Recent Events</span>
              <h2 id="vs-gallery-heading" className="vs-gallery-headline">
                The work, in moments.
              </h2>
              <p className="vs-gallery-sub">
                Monthly food distributions, community gatherings, partnership
                events, and the daily work of meeting families where they are.
              </p>
            </div>
            <a href={viewAllHref} className="vs-gallery-cta">
              View All Events
            </a>
          </div>

          <div className="vs-gallery-grid">
            {items.slice(0, 5).map((item, idx) => {
              const isLarge = idx === 0
              const fallbackGradient = TILE_GRADIENTS[idx % TILE_GRADIENTS.length]
              const tileStyle = item.imageSrc
                ? { backgroundImage: `url(${item.imageSrc})` }
                : { background: fallbackGradient }
              const Component = item.href ? 'a' : 'div'
              const props = item.href ? { href: item.href } : {}

              return (
                <Component
                  key={`${item.date}-${idx}`}
                  className={`vs-gallery-tile ${isLarge ? 'large' : ''}`}
                  style={tileStyle}
                  {...props}
                >
                  <div className="vs-gallery-tile-content">
                    <span className="vs-gallery-tile-date">{item.date}</span>
                    <h3 className="vs-gallery-tile-caption">{item.caption}</h3>
                  </div>
                </Component>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
