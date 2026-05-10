'use client'

export const dynamic = 'force-dynamic';

import { Section, PortfolioCard, Button } from '@yakini/ui'
import { config } from '@/config/brand'

export default function PortfolioPage() {
  return (
    <>
      <Section padding="xl">
        <div style={{ paddingTop: 80, maxWidth: 920, marginBottom: 80 }}>
          <div style={{
            fontSize: 11, fontWeight: 600,
            letterSpacing: '0.3em', textTransform: 'uppercase',
            color: 'var(--brand-primary)', marginBottom: 24
          }}>
            Selected Work
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(48px, 7vw, 96px)',
            fontWeight: 500, lineHeight: 1.05,
            letterSpacing: '-0.02em', marginBottom: 32
          }}>
            {config.portfolio.headline}
          </h1>
          <p style={{
            fontSize: 22, color: 'var(--brand-muted)',
            lineHeight: 1.6, fontFamily: 'var(--font-display)',
            fontStyle: 'italic', maxWidth: 720
          }}>
            {config.portfolio.subheadline}
          </p>
        </div>

        {config.portfolio.items.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 24
          }}>
            {config.portfolio.items.map(item => (
              <PortfolioCard key={item.title} item={item} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <p style={{
              fontSize: 18, color: 'var(--brand-muted)',
              fontFamily: 'var(--font-display)', fontStyle: 'italic'
            }}>
              New work being added soon.
            </p>
          </div>
        )}
      </Section>

      <Section padding="xl">
        <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 500, marginBottom: 24, lineHeight: 1.15
          }}>
            Want to be the next case study?
          </h2>
          <Button variant="primary" href="/contact">Let's Talk</Button>
        </div>
      </Section>
    </>
  )
}
