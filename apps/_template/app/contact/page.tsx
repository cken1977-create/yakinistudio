'use client'

import { Section, ContactForm, SocialIcons } from '@yakini/ui'
import { config } from '@/config/brand'

export default function ContactPage() {
  return (
    <Section padding="xl">
      <div style={{
        paddingTop: 80,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 80
      }}>

        {/* Left: Header & Info */}
        <div>
          <div style={{
            fontSize: 11, fontWeight: 600,
            letterSpacing: '0.3em', textTransform: 'uppercase',
            color: 'var(--brand-primary)', marginBottom: 24
          }}>
            Contact
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(40px, 6vw, 72px)',
            fontWeight: 500, lineHeight: 1.05,
            letterSpacing: '-0.02em', marginBottom: 24
          }}>
            {config.contactPage.headline}
          </h1>
          <p style={{
            fontSize: 18, color: 'var(--brand-muted)',
            lineHeight: 1.7, marginBottom: 40
          }}>
            {config.contactPage.subheadline}
          </p>

          <div style={{
            borderTop: '1px solid var(--brand-border)',
            paddingTop: 32, marginBottom: 32
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'var(--brand-primary)', marginBottom: 16
            }}>
              Direct Contact
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a href={`mailto:${config.contact.email}`} style={{
                fontSize: 18, color: 'var(--brand-text)',
                fontFamily: 'var(--font-display)'
              }}>
                {config.contact.email}
              </a>
              {config.contact.phone && (
                <a href={`tel:${config.contact.phone}`} style={{
                  fontSize: 18, color: 'var(--brand-text)',
                  fontFamily: 'var(--font-display)'
                }}>
                  {config.contact.phone}
                </a>
              )}
              <div style={{ fontSize: 14, color: 'var(--brand-muted)' }}>
                {config.contact.location}
                {config.contact.address && ` · ${config.contact.address}`}
              </div>
              {config.contact.hours && (
                <div style={{ fontSize: 14, color: 'var(--brand-muted)', fontStyle: 'italic' }}>
                  {config.contact.hours}
                </div>
              )}
            </div>
          </div>

          {config.social.length > 0 && (
            <div style={{
              borderTop: '1px solid var(--brand-border)',
              paddingTop: 32
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700,
                letterSpacing: '0.2em', textTransform: 'uppercase',
                color: 'var(--brand-primary)', marginBottom: 16
              }}>
                Follow Along
              </div>
              <SocialIcons config={config} />
            </div>
          )}
        </div>

        {/* Right: Form */}
        <div>
          <div style={{
            fontFamily: 'var(--font-display)', fontStyle: 'italic',
            fontSize: 16, color: 'var(--brand-muted)',
            lineHeight: 1.7, marginBottom: 32
          }}>
            {config.contactPage.formIntro}
          </div>
          <ContactForm config={config} />
        </div>

      </div>
    </Section>
  )
}
