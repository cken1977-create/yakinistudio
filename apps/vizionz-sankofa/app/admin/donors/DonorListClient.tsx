'use client'

// VIZIONZ SANKOFA · /admin/donors · DonorListClient (Wave 3.5)
//
// Client component that wraps the donor list. Owns search + filter state
// and renders DonorRow for each matching donor. Mounts the AddDonorButton
// and ImportCSVButton in the action row.

import { useState, useMemo } from 'react'
import { DonorRow } from './DonorRow'
import { AddDonorButton } from './AddDonorButton'
import { ImportCSVButton } from './ImportCSVButton'
import {
  type DonorRecord,
  type DonorStatus,
  type DonorType,
  DONOR_STATUS_LABELS,
  DONOR_TYPE_LABELS,
} from './types'

export function DonorListClient({ donors }: { donors: DonorRecord[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<DonorStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<DonorType | 'all'>('all')
  const [recurringOnly, setRecurringOnly] = useState(false)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return donors.filter((d) => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false
      if (typeFilter !== 'all' && d.donor_type !== typeFilter) return false
      if (recurringOnly && !d.recurring) return false
      if (q) {
        const haystack = [
          d.display_name,
          d.first_name,
          d.last_name,
          d.email,
          d.phone,
          ...d.tags,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [donors, search, statusFilter, typeFilter, recurringOnly])

  return (
    <div>
      {/* Action row */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <AddDonorButton />
          <ImportCSVButton />
        </div>
        <div
          style={{
            fontSize: '11px',
            color: 'rgba(10, 10, 10, 0.55)',
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          }}
        >
          {filtered.length} of {donors.length} donor{donors.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Search + filters */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
          marginBottom: '24px',
          padding: '14px',
          background: 'rgba(10, 10, 10, 0.02)',
          border: '1px solid rgba(10, 10, 10, 0.06)',
        }}
      >
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, phone, or tag…"
          style={{
            padding: '8px 10px',
            fontSize: '13px',
            border: '1px solid rgba(10, 10, 10, 0.15)',
            background: '#FFFFFF',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as DonorStatus | 'all')}
          style={selectStyle}
        >
          <option value="all">All statuses</option>
          {Object.entries(DONOR_STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as DonorType | 'all')}
          style={selectStyle}
        >
          <option value="all">All types</option>
          {Object.entries(DONOR_TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: '#0A0A0A',
            padding: '0 4px',
          }}
        >
          <input
            type="checkbox"
            checked={recurringOnly}
            onChange={(e) => setRecurringOnly(e.target.checked)}
          />
          Recurring only
        </label>
      </div>

      {/* List */}
      {filtered.length === 0 && donors.length === 0 && <EmptyState />}
      {filtered.length === 0 && donors.length > 0 && (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            background: '#FFFFFF',
            border: '1px solid rgba(10, 10, 10, 0.08)',
            color: 'rgba(10, 10, 10, 0.55)',
            fontSize: '13px',
          }}
        >
          No donors match the current filters. Try clearing them.
        </div>
      )}
      {filtered.map((d) => (
        <DonorRow key={d.id} donor={d} />
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div
      style={{
        padding: '60px 40px',
        textAlign: 'center',
        background: '#FFFFFF',
        border: '1px solid rgba(10, 10, 10, 0.08)',
      }}
    >
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
        Empty Donor Library
      </div>
      <h3
        style={{
          fontSize: '20px',
          fontWeight: 600,
          color: '#0A0A0A',
          marginBottom: '8px',
          fontFamily: '"DM Serif Display", Georgia, serif',
        }}
      >
        No donors yet
      </h3>
      <p
        style={{
          fontSize: '14px',
          color: 'rgba(10, 10, 10, 0.65)',
          maxWidth: '420px',
          margin: '0 auto',
          lineHeight: 1.55,
        }}
      >
        Add donors one at a time with the form above, or import an existing
        list as a CSV. Yakini Intelligence will start reading the substrate
        as soon as records exist.
      </p>
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  padding: '8px 10px',
  fontSize: '13px',
  border: '1px solid rgba(10, 10, 10, 0.15)',
  background: '#FFFFFF',
  outline: 'none',
  fontFamily: 'inherit',
  cursor: 'pointer',
}
