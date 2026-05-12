// VIZIONZ SANKOFA · /admin/donors (Wave 3.5)
//
// Donor management surface. Server component pulls initial donor list
// server-side; client wrapper handles search/filter UI + maps over
// DonorRow components.

import {
  requireOperatorOrEmployee,
  touchLastActive,
  getOperatorDisplayName,
} from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { DonorListClient } from './DonorListClient'
import { type DonorRecord, formatCurrency } from './types'

export const dynamic = 'force-dynamic'

export default async function DonorsPage() {
  const user = await requireOperatorOrEmployee()
  void touchLastActive(user.id)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('donors')
    .select(
      'id, first_name, last_name, display_name, email, phone, ' +
      'address_line1, address_line2, city, state, postal_code, ' +
      'donor_type, status, tags, notes, first_gift_date, last_gift_date, ' +
      'total_lifetime_amount_cents, total_gifts_count, recurring, ' +
      'created_at, updated_at, created_by'
    )
    .order('display_name', { ascending: true })

  const donors = (error ? [] : (data ?? [])) as unknown as DonorRecord[]

  // Substrate counts for the readiness strip
  const totalCount = donors.length
  const activeCount = donors.filter((d) => d.status === 'active').length
  const lifetimeCents = donors.reduce(
    (sum, d) => sum + d.total_lifetime_amount_cents,
    0
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
          Substrate · Wave 3.5
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
          Donor Management
        </h1>
        <p
          style={{
            fontSize: '16px',
            lineHeight: 1.6,
            color: 'rgba(10, 10, 10, 0.65)',
            maxWidth: '640px',
          }}
        >
          The people, families, foundations, and organizations who give to
          your work, {greetingName}. Add new donors, record gifts, and import
          your existing list. Yakini Intelligence reads this substrate to
          answer questions about donor patterns and giving history.
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
        <SubstrateCell label="Total Donors" value={totalCount.toLocaleString()} accent="#5B2C8F" />
        <SubstrateCell label="Active Donors" value={activeCount.toLocaleString()} accent="#007A33" />
        <SubstrateCell label="Lifetime Giving" value={formatCurrency(lifetimeCents)} accent="#0A2548" />
      </section>

      {/* Donor list with search/filter */}
      <DonorListClient donors={donors} />
    </div>
  )
}

function SubstrateCell({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: string
}) {
  return (
    <div style={{ padding: '20px 24px', background: '#FFFFFF' }}>
      <div
        style={{
          fontSize: '9px',
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
          color: accent,
          fontFamily: '"DM Serif Display", Georgia, serif',
        }}
      >
        {value}
      </div>
    </div>
  )
}
