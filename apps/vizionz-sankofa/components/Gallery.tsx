// Gallery of photographs. Captions stay under the picture.
// A missing photo says so. Dates are not drawn on the image.

import { VS_RED, VS_INK } from './TriColorRule'
import { GalleryPhoto } from './GalleryPhoto'

export interface GalleryItem {
  date: string
  caption: string
  imageSrc?: string
  href?: string
}

interface GalleryProps {
  items: GalleryItem[]
  viewAllHref?: string
  kicker?: string
  headline?: string
  sub?: string
  headingId?: string
}

export function Gallery({
  items,
  viewAllHref,
  kicker = 'Recent Events',
  headline = 'The work, in moments.',
  sub = 'Photographs from the community. A picture is shown with its own caption only when that caption was saved with it.',
  headingId = 'vs-gallery-heading',
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
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem 1rem;
          align-items: start;
        }
        .vs-gallery-tile {
          background: #F4F1EA;
          border-radius: 4px;
          overflow: hidden;
          text-decoration: none;
          color: inherit;
        }
        .vs-gallery-tile.large {
          grid-column: span 2;
        }
        .vs-gallery-tile img {
          width: 100%;
          height: auto;
          object-fit: contain;
          background: #F4F1EA;
          display: block;
        }
        .vs-gallery-missing {
          margin: 0;
          min-height: 160px;
          display: grid;
          place-items: center;
          padding: 1.5rem;
          font-family: 'Newsreader', Georgia, serif;
          color: #4A4A4A;
          text-align: center;
        }
        .vs-gallery-tile-caption {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 0.9375rem;
          font-weight: 500;
          line-height: 1.4;
          color: ${VS_INK};
          margin: 0;
          padding: 0.75rem 0.25rem 0;
        }

        @media (max-width: 800px) {
          .vs-gallery { padding: 4rem 0; }
          .vs-gallery-inner { padding: 0 1.5rem; }
          .vs-gallery-grid {
            grid-template-columns: 1fr;
          }
          .vs-gallery-tile.large {
            grid-column: span 1;
          }
        }
      `}</style>

      <section className="vs-gallery" aria-labelledby={headingId}>
        <div className="vs-gallery-inner">
          <div className="vs-gallery-header">
            <div className="vs-gallery-header-text">
            <span className="vs-gallery-kicker">{kicker}</span>
            <h2 id={headingId} className="vs-gallery-headline">
              {headline}
            </h2>
            <p className="vs-gallery-sub">{sub}</p>
          </div>
          {viewAllHref && (
            <a href={viewAllHref} className="vs-gallery-cta">
              View All Events
            </a>
          )}
        </div>

        <div className="vs-gallery-grid">
          {items.map((item, idx) => {
            const isLarge = idx === 0
            const label = item.caption.trim() || 'Community photo'
            const Component = item.href ? 'a' : 'figure'
            const props = item.href ? { href: item.href } : {}
            return (
              <Component
                key={`${item.imageSrc ?? 'missing'}-${idx}`}
                className={`vs-gallery-tile ${isLarge ? 'large' : ''}`}
                {...props}
              >
                {item.imageSrc ? (
                  <GalleryPhoto src={item.imageSrc} alt={label} />
                ) : (
                  <p className="vs-gallery-missing" role="status">This photo could not be loaded.</p>
                )}
                {item.caption.trim() && <p className="vs-gallery-tile-caption">{item.caption}</p>}
              </Component>
            )
          })}
        </div>
        </div>
      </section>
    </>
  )
}
