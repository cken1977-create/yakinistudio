// VIZIONZ SANKOFA · /admin (operator landing page)
// First surface the operator sees after sign-in. Light dashboard with
// navigation to admin surfaces and live stats from Supabase.

import Link from 'next/link'
import { requireOperator } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLandingPage() {
  // Enforce authentication. Redirects to /admin/login if no session.
  const user = await requireOperator()

  // Pull live media counts from Supabase.
  const supabase = await createClient()
  const { count: mediaCount } = await supabase
    .from('media_items')
    .select('*', { count: 'exact', head: true })

  const { count: photoCount } = await supabase
    .from('media_items')
    .select('*', { count: 'exact', head: true })
    .eq('kind', 'photo')

  const { count: videoCount } = await supabase
    .from('media_items')
    .select('*', { count: 'exact', head: true })
    .eq('kind', 'video')

  const emailLocal = user.email?.split('@')[0] ?? 'operator'
  const greetingName =
    emailLocal.charAt(0).toUpperCase() + emailLocal.slice(1)

  return (
    <div>
      {/* Welcome strip */}
      <section style={{ marginBottom: '40px' }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#CE1126',
            marginBottom: '12px',
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          }}
        >
          Operator Surface · Wave 1.5
        </div>

        <h1
          style={{
            fontSize: '36px',
            lineHeight: 1.15,
            fontWeight: 600,
            color: '#0A0A0A',
            marginBottom: '12px',
            fontFamily: '"DM Serif Display", Georgia, serif',
          }}
        >
          Welcome back, {greetingName}.
        </h1>

        <p
          style={{
            fontSize: '16px',
            lineHeight: 1.6,
            color: 'rgba(10, 10, 10, 0.65)',
            maxWidth: '640px',
          }}
        >
          This is your command surface for Vizionz Sankofa. From here you
          manage what the public site shows, who reaches out, and how the
          organization moves forward.
        </p>
      </section>

      {/* Stats strip — live from Supabase */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1px',
          background: 'rgba(10, 10, 10, 0.08)',
          marginBottom: '40px',
          border: '1px solid rgba(10, 10, 10, 0.08)',
        }}
      >
        <StatCell
          label="Total Media"
          value={mediaCount ?? 0}
          accent="#0A0A0A"
        />
        <StatCell label="Photos" value={photoCount ?? 0} accent="#0A2548" />
        <StatCell label="Videos" value={videoCount ?? 0} accent="#007A33" />
        <StatCell label="Active Programs" value={6} accent="#CE1126" />
      </section>

      {/* Surfaces grid */}
      <section style={{ marginBottom: '32px' }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(10, 10, 10, 0.5)',
            marginBottom: '20px',
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          }}
        >
          Admin Surfaces
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
          }}
        >
          <SurfaceCard
            href="/admin/media"
            kicker="Media · Wave 1.5"
            title="Photos & Videos"
            description="Upload event photos and program videos for the public Gallery. Caption, date, and order them as the story you want to tell."
            status="active"
          />
          <SurfaceCard
            href="#"
            kicker="Intakes · Wave 2"
            title="Get Help Requests"
            description="Review incoming intakes from families seeking support. Triage, contact, and route to the right program."
            status="coming"
          />
          <SurfaceCard
            href="#"
            kicker="Donors · Wave 3"
            title="Donor Management"
            description="Track donor relationships, recurring gifts, grants in motion, and BRSA Foundation funding alignment."
            status="coming"
          />
          <SurfaceCard
            href="#"
            kicker="Programs · Wave 3"
            title="Program Operations"
            description="Schedule monthly food distributions, track participant engagement, and manage program logistics."
            status="coming"
          />
          <SurfaceCard
            href="#"
            kicker="Legacyline · Wave 3"
            title="OBR & Readiness"
            description="Onboard subjects into the Legacyline readiness platform. View FRARI scores and certification status."
            status="coming"
          />
          <SurfaceCard
            href="#"
            kicker="Coalition · Wave 4"
            title="Coalition Partners"
            description="MOU tracking, partner check-ins, shared program coordination across the coalition."
            status="coming"
          />
        </div>
      </section>
    </div>
  )
}

function StatCell({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent: string
}) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        padding: '20px 24px',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '3px',
          height: '24px',
          background: accent,
        }}
      />
      <div
        style={{
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(10, 10, 10, 0.55)',
          marginBottom: '8px',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '28px',
          fontWeight: 600,
          color: '#0A0A0A',
          fontFamily: '"DM Serif Display", Georgia, serif',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function SurfaceCard({
  href,
  kicker,
  title,
  description,
  status,
}: {
  href: string
  kicker: string
  title: string
  description: string
  status: 'active' | 'coming'
}) {
  const isComing = status === 'coming'

  const cardContent = (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(10, 10, 10, 0.08)',
        borderRadius: '2px',
        padding: '24px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        opacity: isComing ? 0.55 : 1,
        cursor: isComing ? 'not-allowed' : 'pointer',
        transition: 'border-color 0.15s ease, transform 0.15s ease',
        position: 'relative',
      }}
    >
      <div
        style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: isComing ? 'rgba(10, 10, 10, 0.4)' : '#CE1126',
          marginBottom: '10px',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        }}
      >
        {kicker}
      </div>
      <h3
        style={{
          fontSize: '20px',
          lineHeight: 1.2,
          fontWeight: 600,
          color: '#0A0A0A',
          marginBottom: '12px',
          fontFamily: '"DM Serif Display", Georgia, serif',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: '14px',
          lineHeight: 1.55,
          color: 'rgba(10, 10, 10, 0.65)',
          margin: 0,
          flex: 1,
        }}
      >
        {description}
      </p>
      {!isComing && (
        <div
          style={{
            marginTop: '16px',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#0A2548',
          }}
        >
          Open →
        </div>
      )}
      {isComing && (
        <div
          style={{
            marginTop: '16px',
            fontSize: '11px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(10, 10, 10, 0.4)',
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          }}
        >
          Coming Next
        </div>
      )}
    </div>
  )

  if (isComing) {
    return <div>{cardContent}</div>
  }

  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      {cardContent}
    </Link>
  )
}
