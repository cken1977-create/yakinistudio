// ═════════════════════════════════════════════════════════════════════════
// YAKINI SHARED UI PACKAGE
// ═════════════════════════════════════════════════════════════════════════
// Components used by every Yakini client site.
// Driven entirely by brand config — no hardcoded styling.
//
// File location in monorepo:
//   packages/ui/src/index.tsx
//
// Components included:
//   - <BrandProvider>   — Wraps app, injects fonts and CSS variables
//   - <Navigation>       — Top nav with logo, links, mobile menu
//   - <Footer>           — Footer with Yakini credit (locked)
//   - <Button>           — Primary, secondary, and ghost variants
//   - <Section>          — Standard page section wrapper
//   - <Hero>             — Home page hero
//   - <ServiceCard>      — Service display card
//   - <PortfolioCard>    — Portfolio item card
//   - <ContactForm>      — Lead capture form (wired to Supabase)
//   - <SocialIcons>      — Social media icon row
// ═════════════════════════════════════════════════════════════════════════

'use client'

import { useState, useEffect, ReactNode } from 'react'
import type { BrandConfig } from '@yakini/config'

// ───────────────────────────────────────────────────────────────────────
// BRAND PROVIDER — Wraps the entire app and applies brand styling
// ───────────────────────────────────────────────────────────────────────
export function BrandProvider({
  config,
  children
}: {
  config: BrandConfig
  children: ReactNode
}) {
  const { brand } = config
  const fontUrl = `https://fonts.googleapis.com/css2?family=${brand.fonts.display.replace(/ /g, '+')}:wght@400;500;600;700&family=${brand.fonts.body.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap`

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={fontUrl} rel="stylesheet" />
      <style>{`
        :root {
          --brand-primary: ${brand.colors.primary};
          --brand-accent: ${brand.colors.accent};
          --brand-bg: ${brand.colors.background};
          --brand-text: ${brand.colors.text};
          --brand-muted: ${brand.colors.textMuted};
          --brand-border: ${brand.colors.border};
          --font-display: '${brand.fonts.display}', serif;
          --font-body: '${brand.fonts.body}', sans-serif;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
          background: var(--brand-bg);
          color: var(--brand-text);
          font-family: var(--font-body);
          -webkit-font-smoothing: antialiased;
          line-height: 1.6;
        }
        h1, h2, h3, h4, h5, h6 { font-family: var(--font-display); line-height: 1.15; font-weight: 500; }
        a { color: inherit; text-decoration: none; }
        img { max-width: 100%; height: auto; display: block; }
        button, input, textarea { font-family: inherit; }
      `}</style>
      {children}
    </>
  )
}

// ───────────────────────────────────────────────────────────────────────
// NAVIGATION
// ───────────────────────────────────────────────────────────────────────
export function Navigation({ config }: { config: BrandConfig }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const links = [
    { label: 'Services', href: '/services' },
    { label: 'About', href: '/about' },
    { label: 'Work', href: '/portfolio' },
    { label: 'Contact', href: '/contact' },
    ...(config.portal.enabled ? [{ label: 'Portal', href: '/portal' }] : []),
  ]

  const logoText = config.brand.logo.text || config.business.dba || config.business.name

  return (
    <>
      <style>{`
        .yk-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 18px 32px;
          background: ${scrolled ? 'rgba(250, 250, 248, 0.92)' : 'transparent'};
          backdrop-filter: ${scrolled ? 'blur(20px)' : 'none'};
          border-bottom: 1px solid ${scrolled ? 'var(--brand-border)' : 'transparent'};
          transition: all 0.3s ease;
        }
        .yk-nav-inner {
          max-width: 1280px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
        }
        .yk-logo {
          font-family: var(--font-display);
          font-size: 22px; font-weight: 600;
          letter-spacing: -0.01em;
          color: var(--brand-text);
        }
        .yk-nav-links {
          display: flex; gap: 36px; align-items: center;
        }
        .yk-nav-link {
          font-size: 13px; font-weight: 500;
          color: var(--brand-text);
          letter-spacing: 0.02em;
          position: relative;
          transition: color 0.2s;
        }
        .yk-nav-link::after {
          content: ''; position: absolute; left: 0; bottom: -4px;
          width: 0; height: 1px; background: var(--brand-primary);
          transition: width 0.3s;
        }
        .yk-nav-link:hover::after { width: 100%; }
        .yk-nav-link:hover { color: var(--brand-primary); }
        .yk-nav-cta {
          background: var(--brand-text); color: var(--brand-bg);
          padding: 10px 22px; border-radius: 2px;
          font-size: 12px; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase;
          transition: background 0.2s;
        }
        .yk-nav-cta:hover { background: var(--brand-primary); color: white; }
        .yk-burger { display: none; }
        @media (max-width: 768px) {
          .yk-nav { padding: 14px 20px; }
          .yk-nav-links { display: none; }
          .yk-burger {
            display: flex; flex-direction: column; gap: 4px;
            background: none; border: none; cursor: pointer;
            padding: 8px;
          }
          .yk-burger span {
            width: 22px; height: 1.5px; background: var(--brand-text);
            transition: all 0.3s;
          }
          .yk-burger.open span:nth-child(1) { transform: translateY(5.5px) rotate(45deg); }
          .yk-burger.open span:nth-child(2) { opacity: 0; }
          .yk-burger.open span:nth-child(3) { transform: translateY(-5.5px) rotate(-45deg); }
          .yk-mobile-menu {
            position: fixed; top: 60px; left: 0; right: 0; bottom: 0;
            background: var(--brand-bg);
            padding: 40px 20px;
            display: flex; flex-direction: column; gap: 28px;
            transform: translateX(${open ? '0' : '100%'});
            transition: transform 0.4s ease;
          }
          .yk-mobile-menu .yk-nav-link {
            font-size: 24px;
            font-family: var(--font-display);
          }
        }
      `}</style>

      <nav className="yk-nav">
        <div className="yk-nav-inner">
          <a href="/" className="yk-logo">{logoText}</a>
          <div className="yk-nav-links">
            {links.map(l => (
              <a key={l.href} href={l.href} className="yk-nav-link">{l.label}</a>
            ))}
            <a href="/contact" className="yk-nav-cta">Get In Touch</a>
          </div>
          <button
            className={`yk-burger ${open ? 'open' : ''}`}
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <div className="yk-mobile-menu">
        {links.map(l => (
          <a
            key={l.href}
            href={l.href}
            className="yk-nav-link"
            onClick={() => setOpen(false)}
          >{l.label}</a>
        ))}
        <a href="/contact" className="yk-nav-cta" onClick={() => setOpen(false)}>
          Get In Touch
        </a>
      </div>
    </>
  )
}

// ───────────────────────────────────────────────────────────────────────
// FOOTER — Yakini credit is LOCKED, cannot be removed
// ───────────────────────────────────────────────────────────────────────
export function Footer({ config }: { config: BrandConfig }) {
  const year = new Date().getFullYear()
  const business = config.business.dba || config.business.name

  return (
    <>
      <style>{`
        .yk-footer {
          background: var(--brand-text);
          color: var(--brand-bg);
          padding: 80px 32px 32px;
          margin-top: 120px;
        }
        .yk-footer-inner {
          max-width: 1280px; margin: 0 auto;
        }
        .yk-footer-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1fr;
          gap: 60px;
          margin-bottom: 64px;
        }
        .yk-footer-brand h3 {
          font-size: 36px; font-weight: 500;
          margin-bottom: 16px;
          color: var(--brand-bg);
        }
        .yk-footer-brand p {
          font-size: 14px; line-height: 1.7;
          color: rgba(255,255,255,0.6);
          max-width: 320px;
        }
        .yk-footer-col h4 {
          font-family: var(--font-body);
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--brand-primary);
          margin-bottom: 20px;
        }
        .yk-footer-col a, .yk-footer-col p {
          display: block;
          font-size: 14px;
          color: rgba(255,255,255,0.7);
          margin-bottom: 10px;
          transition: color 0.2s;
        }
        .yk-footer-col a:hover { color: var(--brand-bg); }
        .yk-footer-bottom {
          border-top: 1px solid rgba(255,255,255,0.1);
          padding-top: 32px;
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 16px;
        }
        .yk-footer-copyright {
          font-size: 12px; color: rgba(255,255,255,0.5);
        }
        .yk-yakini-credit {
          display: flex; align-items: center; gap: 10px;
          font-size: 12px;
          color: rgba(255,255,255,0.6);
        }
        .yk-yakini-credit a {
          color: var(--brand-primary);
          font-weight: 600;
          letter-spacing: 0.05em;
        }
        .yk-yakini-credit a:hover { color: white; }
        @media (max-width: 768px) {
          .yk-footer-grid { grid-template-columns: 1fr; gap: 40px; }
          .yk-footer-bottom { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <footer className="yk-footer">
        <div className="yk-footer-inner">
          <div className="yk-footer-grid">
            <div className="yk-footer-brand">
              <h3>{business}</h3>
              <p>{config.business.tagline}</p>
            </div>

            <div className="yk-footer-col">
              <h4>Services</h4>
              {config.services.items.slice(0, 4).map(s => (
                <a key={s.title} href="/services">{s.title}</a>
              ))}
            </div>

            <div className="yk-footer-col">
              <h4>Company</h4>
              <a href="/about">About</a>
              <a href="/portfolio">Work</a>
              <a href="/contact">Contact</a>
              {config.portal.enabled && <a href="/portal">Client Portal</a>}
            </div>

            <div className="yk-footer-col">
              <h4>Contact</h4>
              <a href={`mailto:${config.contact.email}`}>{config.contact.email}</a>
              {config.contact.phone && <a href={`tel:${config.contact.phone}`}>{config.contact.phone}</a>}
              <p>{config.contact.location}</p>
              {config.contact.hours && <p>{config.contact.hours}</p>}
            </div>
          </div>

          <div className="yk-footer-bottom">
            <div className="yk-footer-copyright">
              © {year} {config.business.name}. All rights reserved.
            </div>
            <div className="yk-yakini-credit">
              Built by{' '}
              <a href="https://yakini.digital" target="_blank" rel="noopener">
                YAKINI DIGITAL INFRASTRUCTURE
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}

// ───────────────────────────────────────────────────────────────────────
// BUTTON
// ───────────────────────────────────────────────────────────────────────
export function Button({
  variant = 'primary',
  href,
  onClick,
  children,
  type = 'button',
  disabled = false,
}: {
  variant?: 'primary' | 'secondary' | 'ghost'
  href?: string
  onClick?: () => void
  children: ReactNode
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}) {
  const className = `yk-btn yk-btn-${variant}`
  const content = (
    <>
      <style>{`
        .yk-btn {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 14px 28px;
          font-size: 12px; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase;
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.25s ease;
          border: none;
          font-family: var(--font-body);
          white-space: nowrap;
        }
        .yk-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .yk-btn-primary {
          background: var(--brand-text); color: var(--brand-bg);
        }
        .yk-btn-primary:hover:not(:disabled) {
          background: var(--brand-primary); color: white;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }
        .yk-btn-secondary {
          background: transparent; color: var(--brand-text);
          border: 1.5px solid var(--brand-text);
        }
        .yk-btn-secondary:hover:not(:disabled) {
          background: var(--brand-text); color: var(--brand-bg);
        }
        .yk-btn-ghost {
          background: transparent; color: var(--brand-primary);
          padding: 8px 0;
        }
        .yk-btn-ghost::after {
          content: ' →'; transition: transform 0.2s;
          display: inline-block; margin-left: 4px;
        }
        .yk-btn-ghost:hover::after { transform: translateX(4px); }
      `}</style>
      {children}
    </>
  )

  if (href) return <a href={href} className={className}>{content}</a>
  return (
    <button onClick={onClick} type={type} disabled={disabled} className={className}>
      {content}
    </button>
  )
}

// ───────────────────────────────────────────────────────────────────────
// SECTION
// ───────────────────────────────────────────────────────────────────────
export function Section({
  children,
  background = 'transparent',
  padding = 'lg',
  id,
}: {
  children: ReactNode
  background?: string
  padding?: 'sm' | 'md' | 'lg' | 'xl'
  id?: string
}) {
  const paddingMap = { sm: '40px 32px', md: '80px 32px', lg: '120px 32px', xl: '160px 32px' }
  return (
    <section id={id} style={{ background, padding: paddingMap[padding] }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {children}
      </div>
    </section>
  )
}

// ───────────────────────────────────────────────────────────────────────
// HERO
// ───────────────────────────────────────────────────────────────────────
export function Hero({ config }: { config: BrandConfig }) {
  const { hero } = config.home

  return (
    <>
      <style>{`
        .yk-hero {
          position: relative;
          min-height: 92vh;
          display: flex; flex-direction: column; justify-content: center;
          padding: 140px 32px 80px;
          overflow: hidden;
        }
        .yk-hero-bg {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 50% 0%, rgba(${hexToRgb((typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--brand-primary') : '') || '#888888')},0.08), transparent),
            var(--brand-bg);
        }
        .yk-hero-content {
          position: relative;
          max-width: 1280px; margin: 0 auto;
          width: 100%;
        }
        .yk-hero-tag {
          font-family: var(--font-body);
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.3em; text-transform: uppercase;
          color: var(--brand-primary);
          margin-bottom: 32px;
          opacity: 0; animation: fade-in 0.8s ease 0.1s forwards;
        }
        .yk-hero-headline {
          font-family: var(--font-display);
          font-size: clamp(48px, 7vw, 96px);
          font-weight: 500;
          line-height: 1.05;
          letter-spacing: -0.02em;
          margin-bottom: 32px;
          max-width: 16ch;
          color: var(--brand-text);
          opacity: 0; animation: fade-in 0.8s ease 0.2s forwards;
        }
        .yk-hero-sub {
          font-size: 18px; line-height: 1.7;
          color: var(--brand-muted);
          max-width: 540px;
          margin-bottom: 48px;
          opacity: 0; animation: fade-in 0.8s ease 0.3s forwards;
        }
        .yk-hero-ctas {
          display: flex; gap: 16px; flex-wrap: wrap;
          opacity: 0; animation: fade-in 0.8s ease 0.4s forwards;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          .yk-hero { padding: 120px 20px 60px; min-height: auto; }
          .yk-hero-sub { font-size: 16px; }
        }
      `}</style>

      <div className="yk-hero">
        <div className="yk-hero-bg" />
        <div className="yk-hero-content">
          <div className="yk-hero-tag">— {config.business.dba || config.business.name}</div>
          <h1 className="yk-hero-headline">{hero.headline}</h1>
          <p className="yk-hero-sub">{hero.subheadline}</p>
          <div className="yk-hero-ctas">
            <Button variant="primary" href={hero.ctaLink}>{hero.cta}</Button>
            {hero.secondaryCta && hero.secondaryCtaLink && (
              <Button variant="secondary" href={hero.secondaryCtaLink}>
                {hero.secondaryCta}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ───────────────────────────────────────────────────────────────────────
// SERVICE CARD
// ───────────────────────────────────────────────────────────────────────
export function ServiceCard({
  service,
  index = 0,
}: {
  service: BrandConfig['services']['items'][number]
  index?: number
}) {
  return (
    <>
      <style>{`
        .yk-service {
          padding: 40px;
          background: var(--brand-bg);
          border: 1px solid var(--brand-border);
          border-radius: 4px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .yk-service::before {
          content: ''; position: absolute; inset: 0 0 auto 0;
          height: 3px; background: var(--brand-primary);
          transform: scaleX(0); transform-origin: left;
          transition: transform 0.4s ease;
        }
        .yk-service:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.06);
          border-color: var(--brand-primary);
        }
        .yk-service:hover::before { transform: scaleX(1); }
        .yk-service-num {
          font-family: var(--font-display);
          font-size: 14px; font-style: italic;
          color: var(--brand-primary);
          margin-bottom: 12px;
        }
        .yk-service-icon {
          font-size: 32px; margin-bottom: 16px;
        }
        .yk-service-title {
          font-family: var(--font-display);
          font-size: 28px; font-weight: 500;
          margin-bottom: 12px;
          color: var(--brand-text);
        }
        .yk-service-desc {
          font-size: 15px; line-height: 1.7;
          color: var(--brand-muted);
          margin-bottom: 20px;
        }
        .yk-service-features {
          display: flex; flex-direction: column; gap: 8px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid var(--brand-border);
        }
        .yk-service-feature {
          font-size: 13px; color: var(--brand-text);
          display: flex; gap: 10px; align-items: flex-start;
        }
        .yk-service-feature::before {
          content: '·'; color: var(--brand-primary); font-weight: 700;
          margin-top: -3px;
        }
      `}</style>

      <div className="yk-service">
        <div className="yk-service-num">{String(index + 1).padStart(2, '0')}</div>
        {service.icon && <div className="yk-service-icon">{service.icon}</div>}
        <h3 className="yk-service-title">{service.title}</h3>
        <p className="yk-service-desc">{service.description}</p>
        {service.features && service.features.length > 0 && (
          <div className="yk-service-features">
            {service.features.map(f => (
              <div key={f} className="yk-service-feature">{f}</div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// ───────────────────────────────────────────────────────────────────────
// PORTFOLIO CARD
// ───────────────────────────────────────────────────────────────────────
export function PortfolioCard({
  item,
}: {
  item: BrandConfig['portfolio']['items'][number]
}) {
  return (
    <>
      <style>{`
        .yk-port {
          background: var(--brand-bg);
          border: 1px solid var(--brand-border);
          padding: 32px;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .yk-port:hover {
          border-color: var(--brand-primary);
          transform: translateY(-2px);
        }
        .yk-port-cat {
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--brand-primary);
          margin-bottom: 12px;
        }
        .yk-port-title {
          font-family: var(--font-display);
          font-size: 22px; font-weight: 500;
          margin-bottom: 8px;
          color: var(--brand-text);
        }
        .yk-port-year {
          font-size: 12px; color: var(--brand-muted);
          font-style: italic;
          margin-bottom: 16px;
        }
        .yk-port-desc {
          font-size: 14px; line-height: 1.7;
          color: var(--brand-muted);
        }
      `}</style>
      <div className="yk-port">
        <div className="yk-port-cat">{item.category}</div>
        <h3 className="yk-port-title">{item.title}</h3>
        {item.year && <div className="yk-port-year">{item.year}</div>}
        <p className="yk-port-desc">{item.description}</p>
      </div>
    </>
  )
}

// ───────────────────────────────────────────────────────────────────────
// CONTACT FORM — wired to Yakini's shared Supabase via /api/lead
// ───────────────────────────────────────────────────────────────────────
export function ContactForm({ config }: { config: BrandConfig }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', message: '', service: ''
  })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          client_id: config.yakini.clientId,
          business: config.business.name,
          notify_email: config.contact.notifyEmail || config.contact.email,
        })
      })
      if (!res.ok) throw new Error('Failed')
      setStatus('sent')
      setForm({ name: '', email: '', phone: '', message: '', service: '' })
    } catch {
      setStatus('error')
    }
  }

  return (
    <>
      <style>{`
        .yk-form { display: flex; flex-direction: column; gap: 20px; max-width: 560px; }
        .yk-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .yk-field { display: flex; flex-direction: column; gap: 8px; }
        .yk-field label {
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.15em; text-transform: uppercase;
          color: var(--brand-muted);
        }
        .yk-field input, .yk-field textarea, .yk-field select {
          background: transparent;
          border: none;
          border-bottom: 1px solid var(--brand-border);
          padding: 12px 0;
          font-size: 16px;
          color: var(--brand-text);
          font-family: var(--font-body);
          transition: border-color 0.2s;
          outline: none;
        }
        .yk-field input:focus, .yk-field textarea:focus, .yk-field select:focus {
          border-bottom-color: var(--brand-primary);
        }
        .yk-field textarea { min-height: 120px; resize: vertical; }
        .yk-form-status { font-size: 14px; padding: 12px 0; }
        .yk-form-status.sent { color: #2A7A3A; }
        .yk-form-status.error { color: #C8161D; }
        @media (max-width: 640px) {
          .yk-form-row { grid-template-columns: 1fr; }
        }
      `}</style>

      {status === 'sent' ? (
        <div style={{ padding: '40px 0' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginBottom: 12, color: 'var(--brand-text)' }}>
            Message received.
          </h3>
          <p style={{ fontSize: 16, color: 'var(--brand-muted)', lineHeight: 1.7 }}>
            Thanks for reaching out. {config.business.dba || 'We'} will be in touch within 24 hours.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="yk-form">
          <div className="yk-form-row">
            <div className="yk-field">
              <label>Name</label>
              <input
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="yk-field">
              <label>Email</label>
              <input
                required type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div className="yk-form-row">
            <div className="yk-field">
              <label>Phone (optional)</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="yk-field">
              <label>Service Interest</label>
              <select
                value={form.service}
                onChange={e => setForm({ ...form, service: e.target.value })}
              >
                <option value="">Select...</option>
                {config.services.items.map(s => (
                  <option key={s.title} value={s.title}>{s.title}</option>
                ))}
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="yk-field">
            <label>Tell us about your project</label>
            <textarea
              required
              value={form.message}
              onChange={e => setForm({ ...form, message: e.target.value })}
            />
          </div>

          {status === 'error' && (
            <div className="yk-form-status error">
              Something went wrong. Please email {config.contact.email} directly.
            </div>
          )}

          <Button type="submit" variant="primary" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending...' : 'Send Message'}
          </Button>
        </form>
      )}
    </>
  )
}

// ───────────────────────────────────────────────────────────────────────
// SOCIAL ICONS
// ───────────────────────────────────────────────────────────────────────
const SOCIAL_ICONS: Record<string, string> = {
  instagram: 'IG',
  facebook: 'FB',
  twitter: 'X',
  linkedin: 'IN',
  youtube: 'YT',
  tiktok: 'TT',
}

export function SocialIcons({ config }: { config: BrandConfig }) {
  if (!config.social.length) return null
  return (
    <>
      <style>{`
        .yk-social {
          display: flex; gap: 12px;
        }
        .yk-social a {
          width: 36px; height: 36px;
          display: inline-flex; align-items: center; justify-content: center;
          border: 1px solid var(--brand-border);
          border-radius: 50%;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.05em;
          color: var(--brand-text);
          transition: all 0.2s;
        }
        .yk-social a:hover {
          border-color: var(--brand-primary);
          color: var(--brand-primary);
          transform: translateY(-2px);
        }
      `}</style>
      <div className="yk-social">
        {config.social.map(s => (
          <a key={s.platform} href={s.url} target="_blank" rel="noopener" aria-label={s.platform}>
            {SOCIAL_ICONS[s.platform] || s.platform[0].toUpperCase()}
          </a>
        ))}
      </div>
    </>
  )
}

// ───────────────────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const cleaned = hex.replace('#', '').trim()
  const r = parseInt(cleaned.substring(0, 2), 16) || 136
  const g = parseInt(cleaned.substring(2, 4), 16) || 136
  const b = parseInt(cleaned.substring(4, 6), 16) || 136
  return `${r},${g},${b}`
          }
