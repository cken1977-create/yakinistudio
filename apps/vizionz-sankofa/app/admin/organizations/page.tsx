// VIZIONZ SANKOFA · /admin/organizations (Wave 3)
//
// Funders/Partners CRM surface. Server component pulls organizations +
// aggregates funder access token activity (how many active tokens, last
// time any funder viewed their portal, total view count across all their
// tokens). Client wrapper handles search, kind/status filters, add modal,
// generate-funder-link button on funder rows.

import {
  requireOperatorOrEmployee,
  touchLastActive,
  getOperatorDisplayName,
} from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { OrganizationsListClient } from './OrganizationsListClient'
import type {
  OrganizationRecord,
  OrganizationWithTokens,
} from './types'
import { isFunder } from './types'

export const dynamic = 'force-dynamic'

export default async function OrganizationsPage() {
  const user = await requireOperatorOrEmployee()
  void touchLastActive(user.id)

  const supabase = await createClient()

  // Fetch all organizations
  const { data: orgsData } = await supabase
    .from('organizations')
    .select(
      'id, name, short_name, slug, relationship_kind, type, level, status, ' +
        'primary_contact_name, primary_contact_email, primary_contact_phone, ' +
        'primary_contact_role, website, notes, next_touch_due, ' +
        'created_at, updated_at',
    )
    .order('name', { ascending: true })

  const rawOrgs = (orgsData ?? []) as unknown as OrganizationRecord[]

  // Fetch token activity (one round-trip for all orgs)
  const orgIds = rawOrgs.map((o) => o.id)
  const tokenStatsByOrg = new Map<
    string,
    {
      active_token_count: number
      last_funder_view: string | null
      total_funder_views: number
    }
  >()

  if (orgIds.length > 0) {
    const { data: tokenData } = await supabase
      .from('funder_access_tokens')
      .select(
        'organization_id, is_revoked, last_viewed_at, view_count',
      )
      .in('organization_id', orgIds)

    if (tokenData) {
      for (const row of tokenData as {
        organization_id: string
        is_revoked: boolean
        last_viewed_at: string | null
        view_count: number
      }[]) {
        const existing = tokenStatsByOrg.get(row.organization_id) ?? {
          active_token_count: 0,
          last_funder_view: null,
          total_funder_views: 0,
        }

        if (!row.is_revoked) {
          existing.active_token_count += 1
        }
        existing.total_funder_views += row.view_count ?? 0

        if (row.last_viewed_at) {
          if (
            !existing.last_funder_view ||
            row.last_viewed_at > existing.last_funder_view
          ) {
            existing.last_funder_view = row.last_viewed_at
          }
        }

        tokenStatsByOrg.set(row.organization_id, existing)
      }
    }
  }

  const organizations: OrganizationWithTokens[] = rawOrgs.map((o) => {
    const stats = tokenStatsByOrg.get(o.id) ?? {
      active_token_count: 0,
      last_funder_view: null,
      total_funder_views: 0,
    }
    return {
      ...o,
      ...stats,
    }
  })

  // Fetch active staff for the "generated_by" attribution on links
  const { data: staffData } = await supabase
    .from('staff')
    .select('id, full_name')
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  const staff = (staffData ?? []) as unknown as {
    id: string
    full_name: string
  }[]

  // Substrate counts
  const funderCount = organizations.filter((o) => isFunder(o.relationship_kind))
    .length
  const partnerCount = organizations.filter(
    (o) => o.relationship_kind === 'partner' || o.relationship_kind === 'both',
  ).length
  const activeTokens = organizations.reduce(
    (sum, o) => sum + o.active_token_count,
    0,
  )
  const totalViews = organizations.reduce(
    (sum, o) => sum + o.total_funder_views,
    0,
  )

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
          Funders & Partners
        </h1>
        <p
          style={{
            fontSize: '16px',
            lineHeight: 1.6,
            color: 'rgba(10, 10, 10, 0.65)',
            maxWidth: '640px',
          }}
        >
          The institutional relationships that power the mission, {greetingName}.
          Funders write checks. Partners collaborate without checks. Generate
          funder-portal links to give them live access to their own outcomes.
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
        <SubstrateStat
          label="Funders"
          value={funderCount.toString()}
          accent="#007A33"
        />
        <SubstrateStat
          label="Partners"
          value={partnerCount.toString()}
          accent="#5B2C8F"
        />
        <SubstrateStat
          label="Active Portal Links"
          value={activeTokens.toString()}
          accent="#B45F00"
        />
        <SubstrateStat
          label="Funder Visits"
          value={totalViews.toString()}
        />
      </section>

      {/* Client list */}
      <OrganizationsListClient
        initialOrganizations={organizations}
        staff={staff}
      />
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
