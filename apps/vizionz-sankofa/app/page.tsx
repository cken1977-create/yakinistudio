'use client'

export const dynamic = 'force-dynamic';

import { Hero, Section, ServiceCard, Button } from '@yakini/ui'
import { config } from '@/config/brand'

export default function HomePage() {
  const featured = config.home.featuredServices
    ? config.home.featuredServices.map(i => config.services.items[i]).filter(Boolean)
    : config.services.items.slice(0, 3)

  return (
    <>
      <Hero config={config} />

      {/* Featured Services */}
      <Section padding="xl">
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11, fontWeight: 600,
            letterSpacing: '0.3em', textTransform: 'uppercase',
            color: 'var(--brand-primary)', marginBottom: 16
          }}>
            What We Do
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 500, lineHeight: 1.15,
            maxWidth: '18ch', margin: '0 auto 20px',
            letterSpacing: '-0.02em'
          }}>
            {config.services.headline}
          </h2>
          <p style={{
            fontSize: 17, color: 'var(--brand-muted)', lineHeight: 1.7,
            maxWidth: 540, margin: '0 auto'
          }}>
            {config.services.subheadline}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24, marginBottom: 64
        }}>
          {featured.map((s, i) => (
            <ServiceCard key={s.title} service={s} index={i} />
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <Button variant="ghost" href="/services">View All Services</Button>
        </div>
      </Section>

      {/* About Preview */}
      <Section padding="xl" background="var(--brand-text)">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 80, alignItems: 'center'
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11, fontWeight: 600,
              letterSpacing: '0.3em', textTransform: 'uppercase',
              color: 'var(--brand-primary)', marginBottom: 16
            }}>
              About
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(32px, 4vw, 48px)',
              fontWeight: 500, color: 'var(--brand-bg)',
              marginBottom: 20, letterSpacing: '-0.02em'
            }}>
              {config.about.headline}
            </h2>
            <p style={{
              fontSize: 17, color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.8, marginBottom: 32
            }}>
              {config.about.story.split('\n')[0]}
            </p>
            <Button variant="ghost" href="/about">Read Our Story</Button>
          </div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 4vw, 48px)',
            fontStyle: 'italic',
            color: 'var(--brand-bg)',
            opacity: 0.9, lineHeight: 1.4
          }}>
            "{config.about.mission}"
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section padding="xl">
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(40px, 6vw, 72px)',
            fontWeight: 500, marginBottom: 24,
            letterSpacing: '-0.02em', lineHeight: 1.1
          }}>
            Let's create something{' '}
            <em style={{ color: 'var(--brand-primary)' }}>memorable</em>.
          </h2>
          <p style={{
            fontSize: 18, color: 'var(--brand-muted)',
            lineHeight: 1.7, marginBottom: 40
          }}>
            Every great project starts with a conversation.
          </p>
          <Button variant="primary" href="/contact">Start the Conversation</Button>
        </div>
      </Section>
    </>
  )
}
