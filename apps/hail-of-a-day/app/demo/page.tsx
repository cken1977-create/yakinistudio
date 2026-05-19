import Link from 'next/link'
import { config } from '@/config/brand'

const { business, contact } = config

export const metadata = {
  title: 'Demo · Built for Hail of a Day',
  description: 'A walkthrough of the infrastructure Yakini built for Hail of a Day.',
}

const DEMOS = [
  {
    href: '/',
    eyebrow: 'Surface 01',
    title: 'The Storefront',
    body: 'The public marketing site customers see when they Google "hail repair Dallas" or scan a QR code from one of Tania\'s business cards. Built to convert — every section drives toward the claim form.',
    highlights: [
      'Live storm card with lightning animation',
      'Full intake form with photo upload',
      '5 promises, process, FAQ, service area',
      'DFW-optimized for local SEO',
    ],
    cta: 'View the public site →',
  },
  {
    href: '/m/demo',
    eyebrow: 'Surface 02',
    title: 'The Digital Handshake',
    body: 'When Tania walks up to a hail-damaged car in a parking lot, she captures the prospect in 60 seconds. Three taps on her phone, the customer\'s phone buzzes with a personalized link, photos uploaded before the conversation ends.',
    highlights: [
      'Name pre-filled, mobile-first',
      'Photos → vehicle → confirm in three steps',
      'Customer feels handled, not sold to',
      'Closes the parking-lot conversation cleanly',
    ],
    cta: 'See the customer view →',
  },
  {
    href: '/operator',
    eyebrow: 'Surface 03',
    title: "Tania's Cockpit",
    body: "Tania runs the day from her phone. Every lead lands in the pipeline. She moves cards through stages, taps to call, tracks claims, schedules pickups. Nothing falls through the cracks. Nothing requires Chadrick.",
    highlights: [
      '10 sample leads across the pipeline',
      'Filter by status: New, Contacted, In Shop, Ready',
      'One-tap actions: call, SMS, advance stage',
      'Built for thumb-typing in the field',
    ],
    cta: 'Open the operator cockpit →',
  },
  {
    href: '/portal/demo-claim',
    eyebrow: 'Surface 04',
    title: 'Customer Status Portal',
    body: 'The single feature no other PDR shop in DFW gives their customers. Marcus opens his portal and sees exactly where his Tahoe is in the repair process. Photos. Timeline. Messages. He never has to call asking "when\'s my car ready."',
    highlights: [
      'Live timeline of every claim stage',
      'Before / in-progress / after photos',
      'Two-way messaging with Tania',
      'Insurance + repair details transparent',
    ],
    cta: 'See what Marcus sees →',
  },
]

export default function DemoIndexPage() {
  return (
    <div className="demo-shell">
      <section className="demo-hero">
        <div className="demo-hero-inner">
          <div className="demo-eyebrow">Built for Hail of a Day · By Yakini</div>
          <h1 className="demo-title">
            This is what running your business <span className="demo-accent">with infrastructure</span> looks like.
          </h1>
          <p className="demo-lead">
            Four surfaces. One operation. Tania closes leads from the field.
            Customers see their repair in real time. You watch the business run.
            Built end-to-end so you don&apos;t have to chase a single piece of it.
          </p>
          <div className="demo-meta">
            <div className="demo-meta-item">
              <span className="demo-meta-label">Phone</span>
              <span className="demo-meta-value">{contact.phone}</span>
            </div>
            <div className="demo-meta-item">
              <span className="demo-meta-label">Domain (pending)</span>
              <span className="demo-meta-value">myhailofaday.com</span>
            </div>
            <div className="demo-meta-item">
              <span className="demo-meta-label">Cohort</span>
              <span className="demo-meta-value demo-meta-signal">Yakini Founding Ten · Member #1</span>
            </div>
          </div>
        </div>
      </section>

      <section className="demo-grid-section">
        <div className="demo-grid">
          {DEMOS.map((demo, i) => (
            <Link href={demo.href} key={i} className="demo-card">
              <div className="demo-card-eyebrow">{demo.eyebrow}</div>
              <h2 className="demo-card-title">{demo.title}</h2>
              <p className="demo-card-body">{demo.body}</p>
              <ul className="demo-card-list">
                {demo.highlights.map((h, j) => (
                  <li key={j}>
                    <span className="demo-card-check">✓</span>
                    {h}
                  </li>
                ))}
              </ul>
              <div className="demo-card-cta">
                {demo.cta}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="demo-footer-section">
        <div className="demo-footer-card">
          <div className="demo-eyebrow">From the Chairman</div>
          <h3 className="demo-footer-title">
            I&apos;m building this for the first ten companies I take on.
          </h3>
          <p className="demo-footer-body">
            Hail of a Day is the kind of business Yakini was built for —
            real operators, real revenue need, real reason to look bigger
            than the day-one team. The infrastructure above is what you
            get when you become a Yakini Founding Member. Standard pricing
            unlocks for everyone else. Founding pricing closes 90 days
            from launch.
          </p>
          <p className="demo-footer-body">
            Let&apos;s talk about whether this fits.
          </p>
          <div className="demo-footer-ctas">
            <a href={`tel:${contact.phone.replace(/\D/g, '')}`} className="btn btn-primary">
              Call {contact.phone}
              <span className="btn-arrow">→</span>
            </a>
            <a href={`mailto:${contact.email}`} className="btn btn-secondary">
              Email {contact.email}
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
