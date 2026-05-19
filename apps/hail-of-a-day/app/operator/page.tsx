'use client'

import { useState } from 'react'
import Link from 'next/link'

type LeadStatus = 'new' | 'contacted' | 'claim-filed' | 'in-shop' | 'ready' | 'delivered'

type Lead = {
  id: string
  name: string
  phone: string
  city: string
  vehicle: string
  carrier: string
  damage: 'light' | 'moderate' | 'severe'
  status: LeadStatus
  receivedAt: string
  claimNumber?: string
  adjuster?: string
  pickupDate?: string
  estimatedReady?: string
  notes?: string
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  'new': 'New Lead',
  'contacted': 'Contacted',
  'claim-filed': 'Claim Filed',
  'in-shop': 'In Shop',
  'ready': 'Ready',
  'delivered': 'Delivered',
}

const STATUS_ORDER: LeadStatus[] = ['new', 'contacted', 'claim-filed', 'in-shop', 'ready', 'delivered']

const SEED_LEADS: Lead[] = [
  {
    id: 'L-001',
    name: 'Marcus Williams',
    phone: '(214) 555-0142',
    city: 'Plano',
    vehicle: '2022 Chevrolet Tahoe',
    carrier: 'State Farm',
    damage: 'severe',
    status: 'new',
    receivedAt: '12 min ago',
    notes: 'Parking lot conversation at Whataburger. Photos uploaded same day.',
  },
  {
    id: 'L-002',
    name: 'Diana Martinez',
    phone: '(817) 555-0289',
    city: 'Arlington',
    vehicle: '2020 Toyota Camry',
    carrier: 'Allstate',
    damage: 'moderate',
    status: 'new',
    receivedAt: '47 min ago',
  },
  {
    id: 'L-003',
    name: 'James Robinson',
    phone: '(214) 555-0317',
    city: 'Fort Worth',
    vehicle: '2021 Lexus RX 350',
    carrier: 'USAA',
    damage: 'light',
    status: 'contacted',
    receivedAt: '3 hours ago',
    notes: 'Called back. Wants pickup Wednesday.',
  },
  {
    id: 'L-004',
    name: 'Brandon Hayes',
    phone: '(972) 555-0488',
    city: 'Frisco',
    vehicle: '2023 Ford F-150',
    carrier: 'GEICO',
    damage: 'severe',
    status: 'contacted',
    receivedAt: 'Yesterday',
    notes: 'Verified comprehensive coverage. Awaiting customer callback to schedule pickup.',
  },
  {
    id: 'L-005',
    name: 'Sarah Chen',
    phone: '(469) 555-0521',
    city: 'McKinney',
    vehicle: '2019 Honda Pilot',
    carrier: 'State Farm',
    damage: 'moderate',
    status: 'claim-filed',
    receivedAt: '2 days ago',
    claimNumber: 'SF-2025-44782',
    adjuster: 'Mike Holloway · (800) 555-7777',
    pickupDate: 'Thursday 9:00 AM',
    estimatedReady: 'Monday',
  },
  {
    id: 'L-006',
    name: 'Anthony Davis',
    phone: '(214) 555-0633',
    city: 'Dallas',
    vehicle: '2022 BMW X5',
    carrier: 'USAA',
    damage: 'moderate',
    status: 'claim-filed',
    receivedAt: '3 days ago',
    claimNumber: 'USAA-25-991204',
    adjuster: 'Lisa Park · (800) 555-4242',
    pickupDate: 'Friday 8:30 AM',
    estimatedReady: 'Wednesday',
  },
  {
    id: 'L-007',
    name: 'Rebecca Torres',
    phone: '(817) 555-0742',
    city: 'Grand Prairie',
    vehicle: '2021 Chevrolet Silverado 1500',
    carrier: 'Allstate',
    damage: 'severe',
    status: 'in-shop',
    receivedAt: '5 days ago',
    claimNumber: 'AS-2025-66103',
    adjuster: 'Tom Reilly · (800) 555-9999',
    pickupDate: 'Monday 7:00 AM',
    estimatedReady: 'Friday',
    notes: 'Hood + both quarter panels. Tech assigned: Carlos.',
  },
  {
    id: 'L-008',
    name: 'Michael Patterson',
    phone: '(972) 555-0855',
    city: 'Irving',
    vehicle: '2020 Tesla Model Y',
    carrier: 'GEICO',
    damage: 'light',
    status: 'in-shop',
    receivedAt: '4 days ago',
    claimNumber: 'GE-25-882001',
    adjuster: 'Karen White · (800) 555-3030',
    pickupDate: 'Tuesday 10:00 AM',
    estimatedReady: 'Tomorrow',
    notes: 'Roof only. Aluminum body — premium PDR rate.',
  },
  {
    id: 'L-009',
    name: 'Jasmine Carter',
    phone: '(214) 555-0966',
    city: 'Mesquite',
    vehicle: '2022 Nissan Rogue',
    carrier: 'Progressive',
    damage: 'moderate',
    status: 'ready',
    receivedAt: '8 days ago',
    claimNumber: 'PG-25-447721',
    adjuster: 'Dan Foster · (800) 555-1818',
    pickupDate: 'Last Tuesday',
    estimatedReady: 'Ready for delivery',
    notes: 'Final inspection passed. Delivery scheduled Saturday 11am.',
  },
  {
    id: 'L-010',
    name: 'Robert Jackson',
    phone: '(817) 555-1024',
    city: 'Garland',
    vehicle: '2021 GMC Yukon',
    carrier: 'State Farm',
    damage: 'severe',
    status: 'delivered',
    receivedAt: '14 days ago',
    claimNumber: 'SF-2025-44215',
    adjuster: 'Mike Holloway · (800) 555-7777',
    notes: 'Delivered yesterday. Lifetime warranty registered. Referral form sent.',
  },
]

function damageBadgeClass(damage: Lead['damage']) {
  if (damage === 'severe') return 'damage-badge damage-severe'
  if (damage === 'moderate') return 'damage-badge damage-moderate'
  return 'damage-badge damage-light'
}

export default function OperatorPage() {
  const [selectedId, setSelectedId] = useState<string | null>(SEED_LEADS[0].id)
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'all'>('all')

  const filteredLeads = filterStatus === 'all'
    ? SEED_LEADS
    : SEED_LEADS.filter(l => l.status === filterStatus)

  const selected = SEED_LEADS.find(l => l.id === selectedId) ?? SEED_LEADS[0]

  const statusCounts = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = SEED_LEADS.filter(l => l.status === status).length
    return acc
  }, {} as Record<LeadStatus, number>)

  return (
    <div className="operator-shell">
      {/* ── DEMO BANNER ──────────────────────────────────────────────── */}
      <div className="demo-banner">
        <span className="demo-banner-pulse"></span>
        <strong>DEMO PREVIEW</strong>
        <span>·</span>
        <span>This is what Tania&apos;s daily cockpit looks like. All leads shown are sample data.</span>
        <Link href="/" className="demo-banner-back">← Back to site</Link>
      </div>

      {/* ── OPERATOR HEADER ─────────────────────────────────────────── */}
      <header className="operator-header">
        <div className="operator-header-left">
          <h1 className="operator-title">Lead Pipeline</h1>
          <p className="operator-subtitle">Welcome back, Tania</p>
        </div>
        <div className="operator-stats">
          <div className="op-stat">
            <div className="op-stat-num">{SEED_LEADS.length}</div>
            <div className="op-stat-label">Active</div>
          </div>
          <div className="op-stat">
            <div className="op-stat-num signal">{statusCounts['new']}</div>
            <div className="op-stat-label">New today</div>
          </div>
          <div className="op-stat">
            <div className="op-stat-num">{statusCounts['in-shop']}</div>
            <div className="op-stat-label">In shop</div>
          </div>
          <div className="op-stat">
            <div className="op-stat-num">{statusCounts['delivered']}</div>
            <div className="op-stat-label">Delivered</div>
          </div>
        </div>
      </header>

      {/* ── STATUS FILTER ────────────────────────────────────────────── */}
      <div className="operator-filters">
        <button
          className={`filter-pill ${filterStatus === 'all' ? 'active' : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          All <span className="filter-count">{SEED_LEADS.length}</span>
        </button>
        {STATUS_ORDER.map(status => (
          <button
            key={status}
            className={`filter-pill ${filterStatus === status ? 'active' : ''}`}
            onClick={() => setFilterStatus(status)}
          >
            {STATUS_LABELS[status]}
            <span className="filter-count">{statusCounts[status]}</span>
          </button>
        ))}
      </div>

      {/* ── PIPELINE + DETAIL ───────────────────────────────────────── */}
      <div className="operator-body">
        <div className="leads-list">
          {filteredLeads.map(lead => (
            <button
              key={lead.id}
              className={`lead-card ${selectedId === lead.id ? 'selected' : ''}`}
              onClick={() => setSelectedId(lead.id)}
            >
              <div className="lead-card-top">
                <span className={`status-dot status-${lead.status}`}></span>
                <span className="lead-id">{lead.id}</span>
                <span className="lead-received">{lead.receivedAt}</span>
              </div>
              <div className="lead-name">{lead.name}</div>
              <div className="lead-vehicle">{lead.vehicle}</div>
              <div className="lead-card-bottom">
                <span className="lead-city">{lead.city}</span>
                <span className={damageBadgeClass(lead.damage)}>{lead.damage}</span>
              </div>
            </button>
          ))}
        </div>

        {/* ── DETAIL PANE ─────────────────────────────────────────── */}
        <div className="lead-detail">
          <div className="lead-detail-header">
            <div>
              <div className="lead-detail-id">{selected.id} · {STATUS_LABELS[selected.status]}</div>
              <h2 className="lead-detail-name">{selected.name}</h2>
              <div className="lead-detail-meta">
                <a href={`tel:${selected.phone.replace(/\D/g, '')}`} className="detail-link">📞 {selected.phone}</a>
                <span>·</span>
                <span>{selected.city}</span>
              </div>
            </div>
            <span className={damageBadgeClass(selected.damage)} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
              {selected.damage} damage
            </span>
          </div>

          <div className="lead-detail-grid">
            <div className="detail-section">
              <div className="detail-label">Vehicle</div>
              <div className="detail-value">{selected.vehicle}</div>
            </div>
            <div className="detail-section">
              <div className="detail-label">Carrier</div>
              <div className="detail-value">{selected.carrier}</div>
            </div>
            {selected.claimNumber && (
              <div className="detail-section">
                <div className="detail-label">Claim #</div>
                <div className="detail-value">{selected.claimNumber}</div>
              </div>
            )}
            {selected.adjuster && (
              <div className="detail-section">
                <div className="detail-label">Adjuster</div>
                <div className="detail-value">{selected.adjuster}</div>
              </div>
            )}
            {selected.pickupDate && (
              <div className="detail-section">
                <div className="detail-label">Pickup</div>
                <div className="detail-value">{selected.pickupDate}</div>
              </div>
            )}
            {selected.estimatedReady && (
              <div className="detail-section">
                <div className="detail-label">Est. Ready</div>
                <div className="detail-value signal">{selected.estimatedReady}</div>
              </div>
            )}
          </div>

          {selected.notes && (
            <div className="detail-notes">
              <div className="detail-label">Notes</div>
              <p>{selected.notes}</p>
            </div>
          )}

          <div className="detail-actions">
            <button className="op-btn op-btn-primary">📞 Call customer</button>
            <button className="op-btn op-btn-secondary">💬 Send SMS update</button>
            <button className="op-btn op-btn-secondary">📋 Move to next stage</button>
          </div>

          <div className="detail-photos">
            <div className="detail-label">Damage photos</div>
            <div className="photos-grid">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="photo-tile">
                  <span>📷 Photo {n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
