import { config } from '@/config/brand'
import Link from 'next/link'

const { services, contact } = config

export const metadata = {
  title: 'Services',
  description: services.subheadline,
}

export default function ServicesPage() {
  return (
    <>
      <section className="services-hero">
        <div className="container">
          <div className="section-eyebrow">What we do</div>
          <h1 className="display section-title">{services.headline}</h1>
          <p className="section-lead">{services.subheadline}</p>
        </div>
      </section>

      <section className="services-grid-section">
        <div className="container">
          <div className="services-grid">
            {services.items.map((service, i) => (
              <div key={i} className="service-card">
                <div className="service-icon">{service.icon}</div>
                <h2 className="service-title">{service.title}</h2>
                <p className="service-description">{service.description}</p>
                {service.features && service.features.length > 0 && (
                  <ul className="service-features">
                    {service.features.map((feature, j) => (
                      <li key={j}>
                        <span className="feature-check">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="services-cta">
        <div className="container">
          <h2 className="display">
            Hail damage? <span className="accent">We handle it.</span>
          </h2>
          <p className="services-cta-lead">
            Zero out-of-pocket. We pay your deductible up to $1,000. We file the
            claim. We pick up your car. You don&apos;t lift a finger.
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
