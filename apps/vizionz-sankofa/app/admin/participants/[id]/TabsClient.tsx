'use client'

// VIZIONZ SANKOFA · /admin/participants/[id] · TabsClient
//
// Tab navigation for participant detail page. Owns active-tab state.
// Renders the appropriate tab content. Placeholder tabs for surfaces not
// yet built (Services, Documents, Assessments) — each replaced wholesale
// in its own Wave 3.X push without touching this file's architecture.

import { useState } from 'react'
import { CaseNotesTab } from './CaseNotesTab'
import type {
  CaseNoteWithStaff,
  TabKey,
} from './types'
import { TAB_LABELS } from './types'
import type { StaffRecord } from '../types'

export function TabsClient({
  participantId,
  caseNotes,
  staff,
  defaultAuthorId,
  operatorName,
}: {
  participantId: string
  caseNotes: CaseNoteWithStaff[]
  staff: StaffRecord[]
  defaultAuthorId: string | null
  operatorName: string
}) {
  const [activeTab, setActiveTab] = useState<TabKey>('notes')

  const tabKeys: TabKey[] = ['notes', 'services', 'documents', 'assessments']

  return (
    <div>
      {/* Tab navigation */}
      <nav
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          borderBottom: '1px solid rgba(10, 10, 10, 0.12)',
          marginBottom: '32px',
        }}
      >
        {tabKeys.map((key) => {
          const isActive = activeTab === key
          const count = key === 'notes' ? caseNotes.length : null
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: 'transparent',
                color: isActive ? '#0A0A0A' : 'rgba(10, 10, 10, 0.5)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                borderBottom: isActive
                  ? '3px solid #5B2C8F'
                  : '3px solid transparent',
                marginBottom: '-1px',
                transition: 'color 0.15s',
              }}
            >
              {TAB_LABELS[key]}
              {count !== null && count > 0 && (
                <span
                  style={{
                    marginLeft: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: isActive ? '#5B2C8F' : 'rgba(10, 10, 10, 0.4)',
                    fontFamily:
                      'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Tab content */}
      <div>
        {activeTab === 'notes' && (
          <CaseNotesTab
            participantId={participantId}
            initialNotes={caseNotes}
            staff={staff}
            defaultAuthorId={defaultAuthorId}
          />
        )}
        {activeTab === 'services' && <ServicesPlaceholder />}
        {activeTab === 'documents' && <DocumentsPlaceholder />}
        {activeTab === 'assessments' && <AssessmentsPlaceholder />}
      </div>

      {/* Operator footer */}
      <footer
        style={{
          marginTop: '48px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(10, 10, 10, 0.08)',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(10, 10, 10, 0.45)',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        }}
      >
        Signed in as {operatorName}
      </footer>
    </div>
  )
}

function ServicesPlaceholder() {
  return (
    <ComingSoonPanel
      title="Services Delivered"
      wave="Wave 3.5"
      description="Track every service unit provided to this participant — meals, housing assistance, transportation, ID recovery, court accompaniment, and more. Each service becomes a countable unit for grant reporting."
    />
  )
}

function DocumentsPlaceholder() {
  return (
    <ComingSoonPanel
      title="Participant Documents"
      wave="Wave 3.6"
      description="Per-participant document vault. Upload IDs, leases, court paperwork, intake forms, consent forms. Google Drive integration lets you pull existing files. Plaid integration brings in bank statements automatically."
    />
  )
}

function AssessmentsPlaceholder() {
  return (
    <ComingSoonPanel
      title="Readiness Assessments"
      wave="Wave 3.7"
      description="Six-domain readiness check-ins (Housing, Family, Employment, Mental Wellness, Substance/Recovery, Social Support). Tracks progress over time. Wave 3.5+ upgrades to the branded VS Sankofa Family Readiness Index methodology."
    />
  )
}

function ComingSoonPanel({
  title,
  wave,
  description,
}: {
  title: string
  wave: string
  description: string
}) {
  return (
    <div
      style={{
        padding: '60px 40px',
        textAlign: 'center',
        border: '1px dashed rgba(10, 10, 10, 0.18)',
        borderRadius: '8px',
        background: '#FAFAF8',
        maxWidth: '560px',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#5B2C8F',
          marginBottom: '12px',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        }}
      >
        {wave} · Coming Soon
      </div>
      <h3
        style={{
          fontSize: '22px',
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
          lineHeight: 1.65,
          color: 'rgba(10, 10, 10, 0.65)',
          margin: 0,
        }}
      >
        {description}
      </p>
    </div>
  )
}
