import { config } from '@/config/brand'
import Link from 'next/link'

const { about, contact, business } = config

export const metadata = {
  title: 'About',
  description: about.subheadline,
}

export default function AboutPage() {
  return (
    <>
      <section className="about-hero">
        <div className="container">
          <div className="section-eyebrow">About {business.name}</div>
          <h1 className="display section-title">{about.headline}</h1>
          <p className="section-lead">{about.subheadline}</p>
        </div>
      </section>

      <section className="about-story">
        <div className="container">
          <div className="about-story-grid">
            <div className="about-story-text">
              <div className="story-eyebrow">Our story</div>
              {about.story.split('\n\n').map((paragraph, i) => (
                <p key={i} className="story-paragraph">
                  {paragraph}
                </p>
              ))}
            </div>
            <div className="about-mission-card">
              <div className="mission-eyebrow">The mission</div>
              <p className="mission-text">{about.mission}</p>
              <div className="mission-divider"></div>
              <div className="mission-stats">
                <div className="mission-stat">
                  <div className="mission-stat-num">$0</div>
                  <div className="mission-stat-label">Out of pocket</div>
                </div>
                <div className="mission-stat">
                  <div className="mission-stat-num">$1K</div>
                  <div className="mission-stat-label">Deductible covered</div>
                </div>
                <div className="mission-stat">
                  <div className="mission-stat-num">∞</div>
                  <div className="mission-stat-label">Warranty</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-values">
        <div className="container">
          <div className="section-eyebrow">What we stand for</div>
          <h2 className="display section-title">
            Four things <span className="accent">we don&apos;t compromise on.</span>
          </h2>

          <div className="values-grid">
            {about.values.map((value, i) => (
              <div key={i} className="value-card">
                <div className="value-num">0{i + 1}</div>
                <h3 className="value-title">{value.title}</h3>
                <p className="value-body">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="services-cta">
        <div className="container">
          <h2 className="display">
            Ready to get your car back?
          </h2>
          <p className="services-cta-lead">
            Hand us the keys. We&apos;ll hand them back, with your car looking
            like the storm never touched it.
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
