'use client'

// Coalition partner list: search + filter live in the URL so "open a
// partner, then back" returns to the same filtered list.

import Link from 'next/link'
import { useMemo } from 'react'
import { useUrlState } from '@/components/admin/nav/useUrlState'
import { Card, EmptyState, FilterButton, Meta, Pill, SERIF, TONES, formatDay, inputStyle } from '@/components/admin/ui'
import type { PartnerOrg } from './types'

export type PartnerSummary = {
  org: PartnerOrg
  agreementCount: number
  hasLiveMou: boolean
  pendingAgreement: boolean
  expiringOn: string | null
  lastCheckin: string | null
  checkinOverdue: boolean
  sharedPrograms: number
}

type FilterKey = 'all' | 'live_mou' | 'no_mou' | 'expiring' | 'overdue'
const FILTERS: { key: FilterKey; label: string; test: (p: PartnerSummary) => boolean }[] = [
  { key: 'all', label: 'All', test: () => true },
  { key: 'live_mou', label: 'Live MOU', test: (p) => p.hasLiveMou },
  { key: 'no_mou', label: 'No live MOU', test: (p) => !p.hasLiveMou },
  { key: 'expiring', label: 'Expiring soon', test: (p) => !!p.expiringOn },
  { key: 'overdue', label: 'Check-in overdue', test: (p) => p.checkinOverdue },
]

export function CoalitionListClient({ partners, showCheckins }: { partners: PartnerSummary[]; showCheckins: boolean }) {
  const [search, setSearch] = useUrlState<string>('q', '')
  const [filter, setFilter] = useUrlState<FilterKey>('filter', 'all', FILTERS.map((f) => f.key))

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const test = FILTERS.find((f) => f.key === filter)?.test ?? (() => true)
    return partners.filter((p) => {
      if (!test(p)) return false
      if (!q) return true
      return [p.org.name, p.org.short_name ?? '', p.org.primary_contact_name ?? '', p.org.type].join(' ').toLowerCase().includes(q)
    })
  }, [partners, search, filter])

  return (
    <>
      <section style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
        <input
          type="search"
          placeholder="Search partners by name or contact…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search partners"
          style={{ ...inputStyle, flex: '1 1 240px', width: 'auto' }}
        />
      </section>
      <section style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
        {FILTERS.filter((f) => showCheckins || f.key !== 'overdue').map((f) => (
          <FilterButton
            key={f.key}
            label={`${f.label} · ${partners.filter(f.test).length}`}
            active={filter === f.key}
            onClick={() => setFilter(f.key)}
          />
        ))}
      </section>

      {filtered.length === 0 ? (
        <EmptyState title={partners.length === 0 ? 'No coalition partners yet' : 'No partners match'}>
          {partners.length === 0
            ? 'Add partner organizations under Funders & Partners (relationship: Partner or Both) and they appear here.'
            : 'Try a different search or filter.'}
        </EmptyState>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((p) => (
            <Link key={p.org.id} href={`/admin/coalition/${p.org.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <Card style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ minWidth: 0, flex: '1 1 260px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
                    <h3 style={{ fontSize: '17px', fontWeight: 600, margin: 0, fontFamily: SERIF }}>{p.org.name}</h3>
                    {p.hasLiveMou ? (
                      <Pill {...TONES.green}>Live MOU</Pill>
                    ) : p.pendingAgreement ? (
                      <Pill {...TONES.purple}>MOU in progress</Pill>
                    ) : (
                      <Pill {...TONES.grey}>No live MOU</Pill>
                    )}
                    {p.expiringOn && <Pill {...TONES.amber}>Expires {formatDay(p.expiringOn)}</Pill>}
                    {p.checkinOverdue && <Pill {...TONES.red}>Check-in overdue</Pill>}
                  </div>
                  <Meta>
                    {[
                      p.org.primary_contact_name ? `Contact: ${p.org.primary_contact_name}` : null,
                      `${p.sharedPrograms} shared program${p.sharedPrograms === 1 ? '' : 's'}`,
                      showCheckins ? (p.lastCheckin ? `Last check-in ${formatDay(p.lastCheckin)}` : 'No check-ins yet') : null,
                      p.org.next_touch_due ? `Next touch ${formatDay(p.org.next_touch_due)}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Meta>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#CE1126' }}>
                  Open →
                </span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
