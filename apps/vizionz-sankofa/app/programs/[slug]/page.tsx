// VIZIONZ SANKOFA · /programs/[slug] (Wave 3, public detail page)
//
// Server component. Fetches one program by slug. Renders full detail:
// hero with name + icon, long description, who we serve, eligibility,
// duration, and apply CTA.

import { Section, Button } from '@yakini/ui'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { applyHref } from '@/lib/programs/apply'
import { brandProgramBySlug, programFigures } from '@/lib/site/public-pages'

export const dynamic = 'force-dynamic'

type ProgramDetail = {
  id: string
  slug: string
  name: string
  public_description: string | null
  public_long_description: string | null
  who_we_serve: string | null
  eligibility_criteria: string | null
  duration_description: string | null
  icon_emoji: string | null
  apply_cta_label: string | null
  apply_url: string | null
}

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('programs')
    .select(
      'id, slug, name, public_description, public_long_description, ' +
        'who_we_serve, eligibility_criteria, duration_description, ' +
        'icon_emoji, apply_cta_label, apply_url, slug',
    )
    .eq('slug', slug)
    .eq('is_public', true)
    .eq('is_active', true)
    .maybeSingle()

  if (error || !data) {
    const written = brandProgramBySlug(slug)
    if (!written) notFound()
    return <WrittenProgram program={written} />
  }

  const program = data as unknown as ProgramDetail
  const applicationHref = applyHref(program)
  const figures = programFigures(program.slug)

  return (
    <>
      {figures.map((figure) => <ProgramFigure key={figure.src} figure={figure} />)}
      {/* Hero */}
      <Section padding="xl">
        <div style={{ paddingTop: 80, maxWidth: 920 }}>
          <Link
            href="/programs"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--brand-primary)',
              textDecoration: 'none',
              display: 'inline-block',
              marginBottom: 32,
            }}
          >
            ← All Programs
          </Link>
          <div
            style={{
              fontSize: 56,
              marginBottom: 24,
              lineHeight: 1,
            }}
          >
            {program.icon_emoji ?? '📋'}
          </div>
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
            Program
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(40px, 6vw, 72px)',
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              marginBottom: 32,
            }}
          >
            {program.name}
          </h1>
          {program.public_description && (
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
              {program.public_description}
            </p>
          )}
        </div>
      </Section>

      {/* Long Description */}
      {program.public_long_description && (
        <Section padding="lg">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)',
              gap: 80,
              maxWidth: 1200,
              margin: '0 auto',
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
                paddingTop: 8,
              }}
            >
              About this program
            </div>
            <div>
              {program.public_long_description
                .split('\n\n')
                .map((para, i) => (
                  <p
                    key={i}
                    style={{
                      fontSize: 18,
                      lineHeight: 1.7,
                      color: 'var(--brand-text)',
                      marginBottom: 24,
                    }}
                  >
                    {para}
                  </p>
                ))}
            </div>
          </div>
        </Section>
      )}

      {/* Who We Serve + Eligibility + Duration */}
      <Section padding="lg" background="rgba(10, 10, 10, 0.03)">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 48,
            maxWidth: 1200,
            margin: '0 auto',
          }}
        >
          {program.who_we_serve && (
            <DetailBlock
              eyebrow="Who we serve"
              body={program.who_we_serve}
            />
          )}
          {program.eligibility_criteria && (
            <DetailBlock
              eyebrow="Eligibility"
              body={program.eligibility_criteria}
            />
          )}
          {program.duration_description && (
            <DetailBlock
              eyebrow="Duration"
              body={program.duration_description}
            />
          )}
        </div>
      </Section>

      {/* Apply CTA */}
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
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: 500,
              lineHeight: 1.1,
              marginBottom: 32,
            }}
          >
            We&apos;re here when you are.
          </h2>
          <p
            style={{
              fontSize: 20,
              lineHeight: 1.6,
              marginBottom: 40,
              opacity: 0.85,
            }}
          >
            Reach out and a real person will respond. All backgrounds welcome.
            No one turned away.
          </p>
          <Button href={applicationHref}>{program.apply_cta_label ?? 'Apply Now'}</Button>
        </div>
      </Section>
    </>
  )
}

function ProgramFigure({ figure }: { figure: { src: string; alt: string; fit: 'contain' | 'natural'; illustrative?: boolean; credit?: string; creditHref?: string } | null }) {
  if (!figure) return null
  // The flyer file is stored sideways and has no orientation tag. Rotate it for display; the file itself stays the original.
  if (figure.fit === 'contain') {
    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 24px 0' }}>
        <div style={{ width: '100%', maxWidth: 920, margin: '0 auto', aspectRatio: '2048 / 1536', position: 'relative', background: '#F4F1EA', containerType: 'inline-size' }}>
          <img
            src={figure.src}
            alt={figure.alt}
            style={{ position: 'absolute', left: '50%', top: '50%', height: '100cqi', width: 'auto', maxWidth: 'none', transform: 'translate(-50%, -50%) rotate(90deg)' }}
          />
        </div>
      </div>
    )
  }
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 24px 0' }}>
      <img src={figure.src} alt={figure.alt} style={{ width: '100%', height: 'auto', objectFit: 'contain', background: '#F4F1EA', display: 'block' }} />
      {figure.illustrative && (
        <p style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.4, color: '#4A4A4A' }}>
          Illustrative photo, not a Vizionz Sankofa client.{' '}
          {figure.creditHref ? <a href={figure.creditHref} style={{ color: '#0A2548' }}>{figure.credit}</a> : figure.credit}
        </p>
      )}
    </div>
  )
}

function WrittenProgram({ program }: { program: { slug: string; title: string; description: string; features: string[] } }) {
  const figures = programFigures(program.slug)
  return (
    <>
      {figures.map((figure) => <ProgramFigure key={figure.src} figure={figure} />)}
      <Section padding="xl">
        <div style={{ paddingTop: 80, maxWidth: 920 }}>
          <Link href="/programs" style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--brand-primary)', textDecoration: 'none' }}>
            ← All Programs
          </Link>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 500, lineHeight: 1.1, margin: '32px 0' }}>
            {program.title}
          </h1>
          <p style={{ fontSize: 22, lineHeight: 1.6, color: 'var(--brand-muted)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
            {program.description}
          </p>
        </div>
      </Section>
      {program.features.length > 0 && (
        <Section padding="lg">
          <ul style={{ maxWidth: 720, fontSize: 18, lineHeight: 1.7 }}>
            {program.features.map((feature) => <li key={feature}>{feature}</li>)}
          </ul>
        </Section>
      )}
      <Section padding="xl" background="var(--brand-text)">
        <div style={{ textAlign: 'center', color: 'white' }}>
          <Button href={applyHref({ slug: program.slug })}>Apply Now</Button>
        </div>
      </Section>
    </>
  )
}

function DetailBlock({ eyebrow, body }: { eyebrow: string; body: string }) {
  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: 'var(--brand-primary)',
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: '1px solid rgba(10, 10, 10, 0.12)',
        }}
      >
        {eyebrow}
      </div>
      <p
        style={{
          fontSize: 16,
          lineHeight: 1.65,
          color: 'var(--brand-text)',
        }}
      >
        {body}
      </p>
    </div>
  )
}
