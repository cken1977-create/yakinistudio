'use client'

import { Section, Button } from '@yakini/ui'
import { config } from '@/config/brand'

export default function AboutPage() {
  return (
    <>
      {/* Page Header */}
      <Section padding="xl">
        <div style={{ paddingTop: 80, maxWidth: 920 }}>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11, fontWeight: 600,
            letterSpacing: '0.3em', textTransform: 'uppercase',
            color: 'var(--brand-primary)', marginBottom: 24
          }}>
            About
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(48px, 7vw, 96px)',
            fontWeight: 500, lineHeight: 1.05,
            letterSpacing: '-0.02em', marginBottom: 32
          }}>
            {config.about.headline}
          </h1>
          <p style={{
            fontSize: 22, color: 'var(--brand-muted)',
            lineHeight: 1.6, fontStyle: 'italic',
            fontFamily: 'var(--font-display)',
            maxWidth: 720
          }}>
            {config.about.subheadline}
          </p>
        </div>
      </Section>

      {/* Story */}
      <Section padding="lg">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)',
          gap: 80
        }}>
          <div>
            <div style={{
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.25em', textTransform: 'uppercase',
              color: 'var(--brand-primary)',
              borderTop: '1px solid var(--brand-primary)',
              paddingTop: 16
            }}>
              Our Story
            </div>
          </div>
          <div>
            {config.about.story.split('\n\n').map((para, i) => (
              <p key={i} style={{
                fontSize: 18, lineHeight: 1.85,
                color: 'var(--brand-text)', marginBottom: 24
              }}>
                {para}
              </p>
            ))}
          </div>
        </div>
      </Section>

      {/* Mission */}
      <Section padding="xl" background="var(--brand-text)">
        <div style={{ textAlign: 'center', maxWidth: 920, margin: '0 auto' }}>
          <div style={{
            fontSize: 11, fontWeight: 600,
            letterSpacing: '0.3em', textTransform: 'uppercase',
            color: 'var(--brand-primary)', marginBottom: 32
          }}>
            Mission
          </div>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4vw, 48px)',
            fontStyle: 'italic',
            color: 'var(--brand-bg)',
            lineHeight: 1.4
          }}>
            "{config.about.mission}"
          </p>
        </div>
      </Section>

      {/* CTA */}
      <Section padding="xl">
        <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 500, marginBottom: 24, lineHeight: 1.15
          }}>
            Ready to work together?
          </h2>
          <Button variant="primary" href="/contact">Get In Touch</Button>
        </div>
      </Section>
    </>
  )
}
