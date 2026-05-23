// VIZIONZ SANKOFA · /admin (operator landing page)
// First surface the operator sees after sign-in. Light dashboard with
// navigation to admin surfaces and live stats from Supabase.

import Link from 'next/link'
import {
  requireOperatorOrEmployee,
  touchLastActive,
  getOperatorDisplayName,
} from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLandingPage() {
  // Enforce authentication. Redirects to /admin/login if no session.
  const user = await requireOperatorOrEmployee()
  // Wave 2.5: bounded activity tracking — only this landing page updates
  // last_active_at, no per-action writes
  void touchLastActive(user.id)

  // Pull live media counts from Supabase
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

  const { count: intakeNewCount } = await supabase
    .from('intake_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'new')

  const { count: intakeTotalCount } = await supabase
    .from('intake_requests')
    .select('*', { count: 'exact', head: true })

  const { count: documentCount } = await supabase
    .from('vs_documents')
    .select('*', { count: 'exact', head: true })

  // Wave 3 counts
  const { count: participantCount } = await supabase
    .from('participants')
    .select('*', { count: 'exact', head: true })

  const { count: activeParticipantCount } = await supabase
    .from('participants')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  const { count: cohortCount } = await supabase
    .from('cohorts')
    .select('*', { count: 'exact', head: true })

  const { count: activeCohortCount } = await supabase
    .from('cohorts')
    .select('*', { count: 'exact', head: true })
    .in('status', ['recruiting', 'active'])

  const { count: programCount } = await supabase
    .from('programs')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  const { count: organizationCount } = await supabase
    .from('organizations')
    .select('*', { count: 'exact', head: true })

  const { count: funderCount } = await supabase
    .from('organizations')
    .select('*', { count: 'exact', head: true })
    .in('relationship_kind', ['funder', 'both'])

  const { count: grantCount } = await supabase
    .from('grants')
    .select('*', { count: 'exact', head: true })

  const { count: activeGrantCount } = await supabase
    .from('grants')
    .select('*', { count: 'exact', head: true })
    .in('status', ['drafting', 'submitted', 'awarded'])


  const { count: googleSyncCount } = await supabase
    .from('google_oauth_connections')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  const greetingName = getOperatorDisplayName(user)

  const { data: recentActivity } = await supabase
    .from('case_notes')
    .select('id, content, created_at, participant_id, participants(first_name, last_name)')
    .order('created_at', { ascending: false })
    .limit(5)

  // emailLocal kept for any other call sites — leaving the derivation for
  // now in case other parts of the page reference it; remove in future
  // polish if confirmed unused.
  const emailLocal = user.email?.split('@')[0] ?? 'operator'
  // greetingName is set above via getOperatorDisplayName
  void emailLocal

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
          Operator Surface · Wave 3
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
          label="Participants"
          value={participantCount ?? 0}
          accent="#5B2C8F"
        />
        <StatCell
          label="Active Cases"
          value={activeParticipantCount ?? 0}
          accent="#007A33"
        />
        <StatCell
          label="Active Cohorts"
          value={activeCohortCount ?? 0}
          accent="#B45F00"
        />
        <StatCell
          label="Funders & Partners"
          value={organizationCount ?? 0}
          accent="#0A0A0A"
        />
        <StatCell
          label="Active Grants"
          value={activeGrantCount ?? 0}
          accent="#007A33"
        />
        <StatCell
          label="New Intakes"
          value={intakeNewCount ?? 0}
          accent="#CE1126"
        />
        <StatCell
          label="Documents"
          value={documentCount ?? 0}
          accent="#5B2C8F"
        <StatCell
          label="Google Sync"
          value={googleSyncCount ?? 0}
          accent={googleSyncCount ? '#007A33' : '#0A0A0A'}
        />
        />
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
          {/* Wave 3 case management surfaces — primary */}
          <SurfaceCard
            href="/admin/participants"
            kicker="Substrate · Wave 3"
            title="Participants"
            description={`Every family and individual VS walks with. ${participantCount ?? 0} total · ${activeParticipantCount ?? 0} active.`}
            status="active"
          />
          <SurfaceCard
            href="/admin/cohorts"
            kicker="Substrate · Wave 3"
            title="Cohorts"
            description={`Specific instances of every program. ${cohortCount ?? 0} total · ${activeCohortCount ?? 0} running now.`}
            status="active"
          />
          <SurfaceCard
            href="/admin/programs"
            kicker="Substrate · Wave 3"
            title="Programs"
            description={`The programs Vizionz Sankofa offers. ${programCount ?? 0} active.`}
            status="active"
          />
          <SurfaceCard
            href="/admin/organizations"
            kicker="Substrate · Wave 3"
            title="Funders & Partners"
            description={`Institutional relationships. ${funderCount ?? 0} funders + ${(organizationCount ?? 0) - (funderCount ?? 0)} partners. Generate funder portal links here.`}
            status="active"
          />
          <SurfaceCard
            href="/admin/grants"
            kicker="Substrate · Wave 3"
            title="Grants Pipeline"
            description={`Grant applications from draft through close. ${grantCount ?? 0} total · ${activeGrantCount ?? 0} active.`}
            status="active"
          />

          {/* Existing operational surfaces */}
          <SurfaceCard
            href="/admin/media"
            kicker="Media · Wave 1.5"
            title="Photos & Videos"
            description={`Upload event photos and program videos for the public Gallery. ${mediaCount ?? 0} items · ${photoCount ?? 0} photos · ${videoCount ?? 0} videos.`}
            status="active"
          />
          <SurfaceCard
            href="/admin/intakes"
            kicker="Intakes · Wave 2"
            title="Get Help Requests"
            description={`Review incoming intakes from families seeking support. ${intakeTotalCount ?? 0} total · ${intakeNewCount ?? 0} new.`}
            status="active"
          />
          <SurfaceCard
            href="/admin/documents"
            kicker="Substrate · Wave 3.2"
            title="Document Library"
            description="Upload organizational documents — policies, financials, programs, board minutes. Each becomes searchable substrate as it's processed."
            status="active"
          />
          <SurfaceCard
            href="/admin/intelligence"
            kicker="Substrate · Wave 3.4"
            title="Yakini Intelligence"
            description="Ask anything about your organization. Yakini Intelligence reads your documents and intake records to deliver grounded answers with source citations."
            status="active"
          />
          <SurfaceCard
            href="/admin/donors"
            kicker="Substrate · Wave 3.5"
            title="Donor Management"
            description="Donor records, gift history, and CSV import. Yakini Intelligence reads donor patterns to answer questions about giving history, recurring relationships, and lifetime support."
            status="active"
          />

          {/* Coming next */}
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

      {/* Activity feed */}
      <ActivityFeed items={recentActivity ?? []} />
      </section>
    </div>
  )
}


type ActivityItem = {
  id: string
  content: string
  created_at: string
  participant_id: string
  participants: { first_name: string; last_name: string } | null
}

function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) return null
  return (
    <section style={{ marginBottom: '40px' }}>
      <div style={{
        fontSize: '11px', fontWeight: 600, letterSpacing: '0.18em',
        textTransform: 'uppercase', color: 'rgba(10,10,10,0.5)',
        marginBottom: '16px',
        fontFamily: ''ui-monospace', "SF Mono", "JetBrains Mono", Menlo, monospace',
      }}>
        Recent Activity
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map(item => {
          const name = item.participants
            ? `${item.participants.first_name} ${item.participants.last_name}`
            : 'Unknown'
          const date = new Date(item.created_at).toLocaleDateString()
          return (
            <li key={item.id} style={{
              background: '#FFFFFF', border: '1px solid rgba(10,10,10,0.08)',
              borderRadius: '8px', padding: '14px 18px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px',
            }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#0A0A0A', margin: '0 0 4px' }}>{name}</p>
                <p style={{ fontSize: '13px', color: 'rgba(10,10,10,0.6)', margin: 0, lineHeight: 1.5 }}>
                  {item.content.length > 120 ? item.content.slice(0, 120) + '…' : item.content}
                </p>
              </div>
              <span style={{
                fontSize: '11px', color: 'rgba(10,10,10,0.4)', whiteSpace: 'nowrap',
                fontFamily: ''ui-monospace', "SF Mono", Menlo, monospace',
              }}>{date}</span>
            </li>
          )
        })}
      </ul>
    </section>
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
    return cardContent
  }

  return (
    <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
      {cardContent}
    </Link>
  )
}
