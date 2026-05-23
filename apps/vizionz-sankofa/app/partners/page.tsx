'use client'

export const dynamic = 'force-dynamic'

import { Section } from '@yakini/ui'
import { Coalition } from '@/components/Coalition'

export default function PartnersPage() {
  return (
    <>
      <Section padding="xl">
        <div style={{ paddingTop: 80, maxWidth: 920 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'var(--brand-primary)',
              marginBottom: 24,
            }}
          >
            Coalition
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(48px, 7vw, 96px)',
              fontWeight: 500,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              marginBottom: 32,
            }}
          >
            Coalition &amp; Support
          </h1>
          <p
            style={{
              fontSize: 22,
              color: 'var(--brand-muted)',
              lineHeight: 1.6,
              fontStyle: 'italic',
              fontFamily: 'var(--font-display)',
              maxWidth: 720,
            }}
          >
            Vizionz Sankofa works alongside peer organizations, sister organizations, academic partners, food banks, and civic funders. The coalition is the infrastructure.
          </p>
        </div>
      </Section>
      <Coalition />
    </>
  )
}
