import type { Metadata } from 'next'
import Link from 'next/link'
import { config } from '@/config/brand'
import './globals.css'

const { business, brand, contact, seo } = config

export const metadata: Metadata = {
  title: {
    default: `${business.name} — ${business.tagline}`,
    template: `%s · ${business.name}`,
  },
  description: business.description,
  keywords: seo.keywords,
  metadataBase: new URL(seo.siteUrl),
  openGraph: {
    title: `${business.name} — ${business.tagline}`,
    description: business.description,
    url: seo.siteUrl,
    siteName: business.name,
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: business.name,
    description: business.description,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {/* ── NAV ────────────────────────────────────────────────────── */}
        <nav className="site-nav">
          <div className="nav-inner">
            <Link href="/" className="nav-logo">
              <div>
                <div className="nav-logo-text">{brand.logo.text}</div>
                <span className="nav-logo-sub">Hail Damage Claims</span>
              </div>
            </Link>
            <ul className="nav-links">
              <li>
                <Link href="/services">Services</Link>
              </li>
              <li>
                <Link href="/about">About</Link>
              </li>
              <li>
                <Link href="/portfolio">Work</Link>
              </li>
              <li>
                <Link href="/contact" className="nav-cta">
                  Start your claim
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* ── PAGE CONTENT ───────────────────────────────────────────── */}
        <main>{children}</main>

        {/* ── FOOTER ─────────────────────────────────────────────────── */}
        <footer className="site-footer">
          <div className="footer-inner">
            <div className="footer-grid">
              <div>
                <div className="footer-brand-name">{business.name}</div>
                <p className="footer-tagline">
                  Paintless dent repair across the DFW metroplex. Zero
                  out-of-pocket. Lifetime warranty. We come to you.
                </p>
              </div>
              <div className="footer-col">
                <h4>Contact</h4>
                <ul>
                  <li>
                    <a href={`tel:${contact.phone.replace(/\D/g, '')}`}>
                      {contact.phone}
                    </a>
                  </li>
                  <li>
                    <a href={`mailto:${contact.email}`}>{contact.email}</a>
                  </li>
                  <li>{contact.hours}</li>
                </ul>
              </div>
              <div className="footer-col">
                <h4>Service</h4>
                <ul>
                  <li>
                    <Link href="/contact">Start a claim</Link>
                  </li>
                  <li>
                    <Link href="/services">Services</Link>
                  </li>
                  <li>
                    <Link href="/about">About</Link>
                  </li>
                  <li>
                    <Link href="/portfolio">Recent work</Link>
                  </li>
                </ul>
              </div>
              <div className="footer-col">
                <h4>Coverage</h4>
                <ul>
                  <li>Dallas</li>
                  <li>Arlington</li>
                  <li>Fort Worth</li>
                  <li>+ All DFW suburbs</li>
                </ul>
              </div>
            </div>
            <div className="footer-bottom">
              <div>
                © {new Date().getFullYear()} {business.name} · All rights
                reserved
              </div>
              <div>
                Insurance approved · Lifetime warranty · DFW based
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
