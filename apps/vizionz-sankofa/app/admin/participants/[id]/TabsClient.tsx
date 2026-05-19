'use client'

// VIZIONZ SANKOFA · /admin/participants/[id] · TabsClient
//
// Tab navigation for participant detail page. Owns active-tab state.
// Wave 3 fully shipped: Notes + Services + Documents + Assessments.

import { useState } from 'react'
import { CaseNotesTab } from './CaseNotesTab'
import { ServicesTab } from './ServicesTab'
import { DocumentsTab } from './DocumentsTab'
import { AssessmentsTab } from './AssessmentsTab'
import type {
  CaseNoteWithStaff,
  ServiceWithJoins,
  ServiceTypeRecord,
  ParticipantDocumentWithStaff,
  AssessmentWithScores,
  TabKey,
} from './types'
import { TAB_LABELS } from './types'
import type { StaffRecord } from '../types'

export function TabsClient({
  participantId,
  caseNotes,
  services,
  serviceTypes,
  documents,
  assessments,
  staff,
  defaultAuthorId,
  defaultDelivererId,
  defaultUploaderId,
  defaultAdministrator,
  operatorName,
}: {
  participantId: string
  caseNotes: CaseNoteWithStaff[]
  services: ServiceWithJoins[]
  serviceTypes: ServiceTypeRecord[]
  documents: ParticipantDocumentWithStaff[]
  assessments: AssessmentWithScores[]
  staff: StaffRecord[]
  defaultAuthorId: string | null
  defaultDelivererId: string | null
  defaultUploaderId: string | null
  defaultAdministrator: string | null
  operatorName: string
}) {
  const [activeTab, setActiveTab] = useState<TabKey>('notes')

  const tabKeys: TabKey[] = ['notes', 'services', 'documents', 'assessments']

  return (
    <div>
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
          let count: number | null = null
          if (key === 'notes') count = caseNotes.length
          if (key === 'services') count = services.length
          if (key === 'documents') count = documents.length
          if (key === 'assessments') count = assessments.length

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

      <div>
        {activeTab === 'notes' && (
          <CaseNotesTab
            participantId={participantId}
            initialNotes={caseNotes}
            staff={staff}
            defaultAuthorId={defaultAuthorId}
          />
        )}
        {activeTab === 'services' && (
          <ServicesTab
            participantId={participantId}
            initialServices={services}
            serviceTypes={serviceTypes}
            staff={staff}
            defaultDelivererId={defaultDelivererId}
          />
        )}
        {activeTab === 'documents' && (
          <DocumentsTab
            participantId={participantId}
            initialDocuments={documents}
            staff={staff}
            defaultUploaderId={defaultUploaderId}
          />
        )}
        {activeTab === 'assessments' && (
          <AssessmentsTab
            participantId={participantId}
            initialAssessments={assessments}
            staff={staff}
            defaultAdministrator={defaultAdministrator}
          />
        )}
      </div>

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
