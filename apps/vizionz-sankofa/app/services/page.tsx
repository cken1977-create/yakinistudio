export const dynamic = 'force-dynamic';

'use client'

import { Section, ServiceCard, Button } from '@yakini/ui'
import { config } from '@/config/brand'

export default function ServicesPage() {
  return (
    <>
      <Section padding="xl">
        <div style={{ paddingTop: 80, maxWidth: 920, marginBottom: 80 }}>
          <div style={{
            fontSize: 11, fontWeight: 600,
            letterSpacing: '0.3em', textTransform: 'uppercase',
            color: 'var(--brand-primary)', marginBottom: 24
          }}>
            Services
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(48px, 7vw, 96px)',
            fontWeight: 500, lineHeight: 1.05,
            letterSpacing: '-0.02em', marginBottom: 32
          }}>
            {config.services.headline}
          </h1>
          <p style={{
            fontSize: 22, color: 'var(--brand-muted)',
            lineHeight: 1.6, fontFamily: 'var(--font-display)',
            fontStyle: 'italic', maxWidth: 720
          }}>
            {config.services.subheadline}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24
        }}>
          {config.services.items.map((s, i) => (
            <ServiceCard key={s.title} service={s} index={i} />
          ))}
        </div>
      </Section>

      <Section padding="xl" background="var(--brand-text)">
        <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 500, color: 'var(--brand-bg)',
            marginBottom: 24, lineHeight: 1.15
          }}>
            Don't see what you need?
          </h2>
          <p style={{
            fontSize: 17, color: 'rgba(255,255,255,0.7)',
            lineHeight: 1.7, marginBottom: 32
          }}>
            Every project is unique. Let's talk about what you're trying to accomplish.
          </p>
          <Button variant="primary" href="/contact">Start the Conversation</Button>
        </div>
      </Section>
    </>
  )
}
