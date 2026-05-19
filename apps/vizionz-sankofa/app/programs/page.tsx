// VIZIONZ SANKOFA · /programs (Wave 3, public surface)
//
// Server component. Pulls programs where is_public = true from Supabase.
// Programs render as a grid; each links to its detail page at /programs/[slug].
// Empty state if no programs are public yet (drafts in admin).

import { Section, Button } from '@yakini/ui'
import { config } from '@/config/brand'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type PublicProgram = {
  id: string
  slug: string
  name: string
  short_name: string | null
  public_description: string | null
  who_we_serve: string | null
  duration_description: string | null
  icon_emoji: string | null
  apply_cta_label: string | null
  apply_url: string | null
  display_order: number
}

export default async function ProgramsPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('programs')
    .select(
      'id, slug, name, short_name, public_description, who_we_serve, ' +
        'duration_description, icon_emoji, apply_cta_label, apply_url, display_order',
    )
    .eq('is_public', true)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  const programs = (error ? [] : (data ?? [])) as unknown as PublicProgram[]

  return (
    <>
      {/* Page Header */}
      <Section padding="xl">
        <div style={{ paddingTop: 80, maxWidth: 920 }}>
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'var(--brand-primary)',
              marginBottom: 24,
            }}
          >
            Our Programs
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
            Wraparound services for every step.
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
            From a roof over your head to a paycheck in your pocket, from your
            first day in a new country to your last years home — we walk with
            you. All backgrounds. No one turned away.
          </p>
        </div>
      </Section>

      {/* Programs Grid */}
      <Section padding="lg">
        {programs.length === 0 ? (
          <EmptyState />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 32,
              maxWidth: 1200,
              margin: '0 auto',
            }}
          >
            {programs.map((program) => (
              <ProgramCard key={program.id} program={program} />
            ))}
          </div>
        )}
      </Section>

      {/* Call to Action */}
      <Section padding="xl" background="var(--brand-text)">
        <div
          style={{
            textAlign: 'center',
            maxWidth: 720,
            margin: '0 auto',
            color: 'white',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'var(--brand-primary)',
              marginBottom: 24,
            }}
          >
            Ready to start?
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(36px, 5vw, 64px)',
              fontWeight: 500,
              lineHeight: 1.1,
              marginBottom: 32,
            }}
          >
            We meet you where you are.
          </h2>
          <p
            style={{
              fontSize: 20,
              lineHeight: 1.6,
              marginBottom: 40,
              opacity: 0.85,
            }}
          >
            Whether it&apos;s housing, family support, refugee resettlement, food
            assistance, or educational pathways — we hear you.
          </p>
          <Link href="/get-help">
            <Button>Get Help Now</Button>
          </Link>
        </div>
      </Section>
    </>
  )
}

function ProgramCard({ program }: { program: PublicProgram }) {
  return (
    <Link
      href={`/programs/${program.slug}`}
      style={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'block',
      }}
    >
      <article
        style={{
          padding: 40,
          border: '1px solid rgba(10, 10, 10, 0.12)',
          borderRadius: 4,
          background: '#FFFFFF',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.2s',
          cursor: 'pointer',
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 24, lineHeight: 1 }}>
          {program.icon_emoji ?? '📋'}
        </div>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28,
            fontWeight: 500,
            lineHeight: 1.15,
            marginBottom: 16,
            color: 'var(--brand-text)',
          }}
        >
          {program.name}
        </h3>
        <p
          style={{
            fontSize: 16,
            lineHeight: 1.6,
            color: 'var(--brand-muted)',
            marginBottom: 24,
            flex: 1,
          }}
        >
          {program.public_description ??
            'Description coming soon. Reach out to learn more.'}
        </p>
        {program.duration_description && (
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--brand-primary)',
              paddingTop: 20,
              borderTop: '1px solid rgba(10, 10, 10, 0.08)',
            }}
          >
            {program.duration_description}
          </div>
        )}
        <div
          style={{
            marginTop: 24,
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--brand-primary)',
            letterSpacing: '0.04em',
          }}
        >
          {program.apply_cta_label ?? 'Learn more'} →
        </div>
      </article>
    </Link>
  )
}

function EmptyState() {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '80px 24px',
        maxWidth: 600,
        margin: '0 auto',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          fontStyle: 'italic',
          color: 'var(--brand-muted)',
          lineHeight: 1.5,
        }}
      >
        Our programs are updating. Please check back soon, or{' '}
        <Link
          href="/get-help"
          style={{ color: 'var(--brand-primary)', textDecoration: 'underline' }}
        >
          reach out
        </Link>{' '}
        — we&apos;ll help you find what you need.
      </p>
    </div>
  )
}
