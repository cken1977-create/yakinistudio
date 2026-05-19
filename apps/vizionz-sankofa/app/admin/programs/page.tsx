// VIZIONZ SANKOFA · /admin/programs (Wave 3)
//
// Programs management surface. Server component pulls initial program list +
// substrate counts. Client wrapper handles search, edit modal, public/draft toggles.

import {
  requireOperatorOrEmployee,
  touchLastActive,
  getOperatorDisplayName,
} from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { ProgramsListClient } from './ProgramsListClient'
import type { ProgramRecord } from './types'

export const dynamic = 'force-dynamic'

export default async function ProgramsPage() {
  const user = await requireOperatorOrEmployee()
  void touchLastActive(user.id)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('programs')
    .select(
      'id, slug, name, short_name, is_public, is_active, ' +
        'public_description, public_long_description, ' +
        'who_we_serve, eligibility_criteria, duration_description, ' +
        'apply_cta_label, apply_url, hero_image_url, icon_emoji, ' +
        'display_order, primary_outcome_domains, ' +
        'launched_at, retired_at, created_at, updated_at',
    )
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  const programs = (error ? [] : (data ?? [])) as unknown as ProgramRecord[]

  // Substrate counts for the readiness strip
  const totalCount = programs.length
  const publicCount = programs.filter((p) => p.is_public).length
  const draftCount = programs.filter((p) => !p.is_public).length
  const withDescriptions = programs.filter(
    (p) => p.public_description && p.public_description.trim().length > 0,
  ).length

  const greetingName = getOperatorDisplayName(user)

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
            color: '#5B2C8F',
            marginBottom: '12px',
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          }}
        >
          Substrate · Wave 3
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
          Programs
        </h1>
        <p
          style={{
            fontSize: '16px',
            lineHeight: 1.6,
            color: 'rgba(10, 10, 10, 0.65)',
            maxWidth: '640px',
          }}
        >
          The wraparound services Vizionz Sankofa delivers, {greetingName}. Edit
          descriptions, set eligibility, and decide when each program goes live
          on the public site.
        </p>
      </section>

      {/* Substrate readiness strip */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1px',
          background: 'rgba(10, 10, 10, 0.08)',
          marginBottom: '32px',
          border: '1px solid rgba(10, 10, 10, 0.08)',
        }}
      >
        <SubstrateStat label="Total Programs" value={totalCount.toString()} />
        <SubstrateStat
          label="Public"
          value={publicCount.toString()}
          accent="#007A33"
        />
        <SubstrateStat label="Drafts" value={draftCount.toString()} />
        <SubstrateStat
          label="With Descriptions"
          value={`${withDescriptions} / ${totalCount}`}
        />
      </section>

      {/* Client-side list with search + edit */}
      <ProgramsListClient initialPrograms={programs} />
    </div>
  )
}

function SubstrateStat({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: string
}) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        padding: '20px 24px',
      }}
    >
      <div
        style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(10, 10, 10, 0.5)',
          marginBottom: '8px',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '24px',
          fontWeight: 600,
          color: accent ?? '#0A0A0A',
          fontFamily: '"DM Serif Display", Georgia, serif',
        }}
      >
        {value}
      </div>
    </div>
  )
}
