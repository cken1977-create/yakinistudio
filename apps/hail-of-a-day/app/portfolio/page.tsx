import { config } from '@/config/brand'
import Link from 'next/link'

const { portfolio, contact } = config

export const metadata = {
  title: 'Recent Work',
  description: portfolio.subheadline,
}

export default function PortfolioPage() {
  return (
    <>
      <section className="portfolio-hero">
        <div className="container">
          <div className="section-eyebrow">Recent Work</div>
          <h1 className="display section-title">{portfolio.headline}</h1>
          <p className="section-lead">{portfolio.subheadline}</p>
        </div>
      </section>

      <section className="portfolio-grid-section">
        <div className="container">
          <div className="portfolio-grid">
            {(portfolio.items ?? []).map((item, i) => (
              <article key={i} className="portfolio-card">
                <div className="portfolio-image">
                  <div className="portfolio-image-placeholder">
                    <div className="portfolio-image-icon">📷</div>
                    <div className="portfolio-image-label">Photo coming</div>
                  </div>
                  <div className="portfolio-demo-badge">SAMPLE</div>
                </div>
                <div className="portfolio-content">
                  <div className="portfolio-meta">
                    <span className="portfolio-category">{item.category}</span>
                    <span className="portfolio-year">{item.year}</span>
                  </div>
                  <h2 className="portfolio-title">{item.title}</h2>
                  <p className="portfolio-description">{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="portfolio-note">
        <div className="container">
          <div className="portfolio-note-card">
            <div className="section-eyebrow" style={{ justifyContent: 'center' }}>
              About this page
            </div>
            <p>
              Every repair we complete gets photographed before, during, and
              after. When you become a customer, your repair becomes part of
              our portfolio — and you get full access to your before-and-after
              photos through your customer portal.
            </p>
          </div>
        </div>
      </section>

      <section className="services-cta">
        <div className="container">
          <h2 className="display">
            Yours could be <span className="accent">next.</span>
          </h2>
          <p className="services-cta-lead">
            Send us photos of your hail damage and we&apos;ll show you what
            factory-finish PDR can do for your vehicle.
          </p>
          <div className="hero-ctas" style={{ justifyContent: 'center', marginBottom: 0 }}>
            <Link href="/contact" className="btn btn-primary">
              Start your claim
              <span className="btn-arrow">→</span>
            </Link>
            <a href={`tel:${contact.phone.replace(/\D/g, '')}`} className="btn btn-secondary">
              Call {contact.phone}
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
