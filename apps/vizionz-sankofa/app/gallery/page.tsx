'use client'

export const dynamic = 'force-dynamic'

import { Section } from '@yakini/ui'
import { Gallery } from '@/components/Gallery'

export default function GalleryPage() {
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
            Events
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
            Where We Show Up
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
            Twelve years of community presence across Albuquerque and New Mexico. Past gatherings, current programs, and the events still to come.
          </p>
        </div>
      </Section>
      <Gallery />
    </>
  )
}
