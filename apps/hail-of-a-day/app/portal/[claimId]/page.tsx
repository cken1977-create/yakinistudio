'use client'

import { useState } from 'react'
import Link from 'next/link'

// In production this would resolve claimId to a real claim.
// For the demo, the page always renders Marcus's Tahoe story arc.
const DEMO_CLAIM = {
  customer: {
    firstName: 'Marcus',
    lastName: 'Williams',
    phone: '(214) 555-0142',
  },
  vehicle: {
    year: 2022,
    make: 'Chevrolet',
    model: 'Tahoe',
    color: 'Silver Ice Metallic',
  },
  claim: {
    number: 'SF-2026-44912',
    carrier: 'State Farm',
    adjuster: 'Mike Holloway',
    deductible: '$1,000 (covered by Hail of a Day)',
    outOfPocket: '$0',
  },
  service: {
    tech: 'Carlos M.',
    estimatedReady: 'Friday, by 5:00 PM',
    panelsRepaired: 'Hood, roof, both front fenders',
    warranty: 'Lifetime warranty registered',
  },
}

type StageKey = 'received' | 'verified' | 'picked-up' | 'in-shop' | 'quality-check' | 'ready'

const STAGES: { key: StageKey; label: string; sublabel: string }[] = [
  { key: 'received', label: 'Claim Received', sublabel: 'Monday · 2:14 PM' },
  { key: 'verified', label: 'Coverage Verified', sublabel: 'Monday · 4:47 PM' },
  { key: 'picked-up', label: 'Vehicle Picked Up', sublabel: 'Tuesday · 9:12 AM' },
  { key: 'in-shop', label: 'Paintless Dent Repair', sublabel: 'In progress now' },
  { key: 'quality-check', label: 'Quality Inspection', sublabel: 'Friday · est. 10 AM' },
  { key: 'ready', label: 'Ready for Delivery', sublabel: 'Friday · est. 5 PM' },
]

const CURRENT_STAGE: StageKey = 'in-shop'

const MESSAGES = [
  {
    from: 'Hail of a Day',
    when: 'Tuesday 9:14 AM',
    text: 'Hey Marcus — we picked up your Tahoe at 9:12 AM. Driver dropped you a rental. Repair starts today and we&apos;ll text you photos as we work.',
    type: 'system',
  },
  {
    from: 'Tania',
    when: 'Monday 4:47 PM',
    text: 'State Farm confirmed comprehensive coverage. Deductible $1,000 — we&apos;ve got it. Pickup tomorrow 9 AM at your house. Reply STOP to opt out of texts.',
    type: 'tania',
  },
  {
    from: 'Hail of a Day',
    when: 'Monday 2:14 PM',
    text: 'Got your claim, Marcus. Reviewing your photos now. We&apos;ll call you back within 24 hours with next steps.',
    type: 'system',
  },
]

const currentStageIndex = STAGES.findIndex(s => s.key === CURRENT_STAGE)

export default function PortalClaimPage() {
  const [tab, setTab] = useState<'progress' | 'photos' | 'messages' | 'details'>('progress')

  return (
    <div className="portal-shell">
      <div className="demo-banner">
        <span className="demo-banner-pulse"></span>
        <strong>DEMO PREVIEW</strong>
        <span>·</span>
        <span>Customer&apos;s view of their claim. This is what no other DFW PDR shop gives them.</span>
        <Link href="/" className="demo-banner-back">← Back to site</Link>
      </div>

      <div className="portal-container">
        {/* ── HEADER ──────────────────────────────────────────────── */}
        <header className="portal-header">
          <div className="portal-welcome">
            <div className="portal-eyebrow">Your Claim</div>
            <h1 className="portal-name">
              Welcome back, {DEMO_CLAIM.customer.firstName}.
            </h1>
            <p className="portal-vehicle">
              {DEMO_CLAIM.vehicle.year} {DEMO_CLAIM.vehicle.make}{' '}
              {DEMO_CLAIM.vehicle.model} · {DEMO_CLAIM.vehicle.color}
            </p>
          </div>
          <div className="portal-claim-card">
            <div className="portal-claim-label">Claim Number</div>
            <div className="portal-claim-num">{DEMO_CLAIM.claim.number}</div>
            <div className="portal-claim-stat">
              <span>Your cost</span>
              <strong className="signal">{DEMO_CLAIM.claim.outOfPocket}</strong>
            </div>
          </div>
        </header>

        {/* ── HEADLINE STATUS ─────────────────────────────────────── */}
        <div className="portal-status-headline">
          <div className="portal-status-pulse"></div>
          <div>
            <div className="portal-status-label">Right now</div>
            <div className="portal-status-title">
              Carlos is repairing your hood.
            </div>
            <div className="portal-status-sub">
              Estimated ready: <strong>{DEMO_CLAIM.service.estimatedReady}</strong>
            </div>
          </div>
        </div>

        {/* ── TABS ────────────────────────────────────────────────── */}
        <div className="portal-tabs">
          {(['progress', 'photos', 'messages', 'details'] as const).map((t) => (
            <button
              key={t}
              className={`portal-tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'progress' && '📍 Progress'}
              {t === 'photos' && '📷 Photos'}
              {t === 'messages' && '💬 Messages'}
              {t === 'details' && 'ℹ️ Details'}
            </button>
          ))}
        </div>

        {/* ── PROGRESS TAB ────────────────────────────────────────── */}
        {tab === 'progress' && (
          <div className="portal-panel">
            <div className="timeline">
              {STAGES.map((stage, i) => {
                const isComplete = i < currentStageIndex
                const isCurrent = i === currentStageIndex
                const isFuture = i > currentStageIndex
                return (
                  <div
                    key={stage.key}
                    className={`timeline-step ${
                      isComplete ? 'complete' : isCurrent ? 'current' : 'future'
                    }`}
                  >
                    <div className="timeline-marker">
                      {isComplete ? '✓' : isCurrent ? '●' : i + 1}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-label">{stage.label}</div>
                      <div className="timeline-sublabel">{stage.sublabel}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── PHOTOS TAB ──────────────────────────────────────────── */}
        {tab === 'photos' && (
          <div className="portal-panel">
            <div className="portal-photo-section">
              <div className="portal-photo-label">Before — Monday intake</div>
              <div className="portal-photo-grid">
                {[1, 2, 3, 4].map((n) => (
                  <div key={`before-${n}`} className="portal-photo">
                    <span>📷 Before {n}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="portal-photo-section">
              <div className="portal-photo-label">In progress — Tuesday</div>
              <div className="portal-photo-grid">
                {[1, 2].map((n) => (
                  <div key={`during-${n}`} className="portal-photo">
                    <span>📷 In shop {n}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="portal-photo-section">
              <div className="portal-photo-label">After — coming Friday</div>
              <div className="portal-photo-grid portal-photo-pending">
                {[1, 2, 3, 4].map((n) => (
                  <div key={`after-${n}`} className="portal-photo">
                    <span>Coming soon</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MESSAGES TAB ────────────────────────────────────────── */}
        {tab === 'messages' && (
          <div className="portal-panel">
            <div className="messages-list">
              {MESSAGES.map((msg, i) => (
                <div
                  key={i}
                  className={`message message-${msg.type}`}
                >
                  <div className="message-header">
                    <div className="message-from">{msg.from}</div>
                    <div className="message-when">{msg.when}</div>
                  </div>
                  <div className="message-text">{msg.text}</div>
                </div>
              ))}
            </div>
            <div className="message-compose">
              <input
                type="text"
                placeholder="Reply to Tania…"
                className="message-input"
              />
              <button className="message-send">Send</button>
            </div>
          </div>
        )}

        {/* ── DETAILS TAB ─────────────────────────────────────────── */}
        {tab === 'details' && (
          <div className="portal-panel">
            <div className="details-grid">
              <div className="detail-block">
                <div className="detail-block-label">Insurance</div>
                <div className="detail-block-rows">
                  <div className="detail-row">
                    <span>Carrier</span>
                    <strong>{DEMO_CLAIM.claim.carrier}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Claim #</span>
                    <strong>{DEMO_CLAIM.claim.number}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Adjuster</span>
                    <strong>{DEMO_CLAIM.claim.adjuster}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Deductible</span>
                    <strong>{DEMO_CLAIM.claim.deductible}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Your cost</span>
                    <strong className="signal">{DEMO_CLAIM.claim.outOfPocket}</strong>
                  </div>
                </div>
              </div>

              <div className="detail-block">
                <div className="detail-block-label">Repair</div>
                <div className="detail-block-rows">
                  <div className="detail-row">
                    <span>Tech</span>
                    <strong>{DEMO_CLAIM.service.tech}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Panels</span>
                    <strong>{DEMO_CLAIM.service.panelsRepaired}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Method</span>
                    <strong>Paintless Dent Repair</strong>
                  </div>
                  <div className="detail-row">
                    <span>Warranty</span>
                    <strong className="signal">{DEMO_CLAIM.service.warranty}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="portal-help">
              <h3>Questions?</h3>
              <p>
                Tania&apos;s here to help. Text the messages tab or call the
                shop directly.
              </p>
              <a href="tel:2142452113" className="portal-help-btn">
                📞 Call (214) 245-2113
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
      }
