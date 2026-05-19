// VIZIONZ SANKOFA · /admin/participants/[id] (Wave 3)
//
// Participant detail page. Server component fetches participant, case notes,
// services delivered, service types catalog, documents, assessments, and
// staff list. Renders hero + tab navigation.

import {
  requireOperatorOrEmployee,
  touchLastActive,
  getOperatorDisplayName,
} from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { TabsClient } from './TabsClient'
import type {
  CaseNoteRecord,
  CaseNoteWithStaff,
  ServiceDeliveredRecord,
  ServiceWithJoins,
  ServiceTypeRecord,
  ParticipantDocumentRecord,
  ParticipantDocumentWithStaff,
  AssessmentRecord,
  AssessmentScoreRecord,
  AssessmentWithScores,
} from './types'
import type {
  ParticipantRecord,
  StaffRecord,
} from '../types'
import { PARTICIPANT_STATUS_LABELS } from '../types'

export const dynamic = 'force-dynamic'

export default async function ParticipantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireOperatorOrEmployee()
  void touchLastActive(user.id)

  const supabase = await createClient()

  // Fetch the participant
  const { data: participantData, error: participantError } = await supabase
    .from('participants')
    .select(
      'id, first_name, last_name, preferred_name, date_of_birth, ' +
        'phone_primary, phone_secondary, email, ' +
        'address_line1, address_line2, city, state, zip, ' +
        'gender, race_ethnicity, primary_language, ' +
        'veteran_status, disability_status, household_size, ' +
        'children_in_household, household_income_range, ' +
        'intake_date, referral_source, referral_source_detail, ' +
        'status, primary_case_manager_id, ' +
        'consent_to_services, consent_to_share_data, consent_to_photos, ' +
        'consent_signed_at, intake_notes, ' +
        'legacyline_subject_id, legacyline_pushed_at, legacyline_consent_signed, ' +
        'created_at, updated_at',
    )
    .eq('id', id)
    .maybeSingle()

  if (participantError || !participantData) {
    notFound()
  }

  const participant = participantData as unknown as ParticipantRecord

  // Case notes
  const { data: notesData } = await supabase
    .from('case_notes')
    .select(
      'id, participant_id, staff_id, occurred_at, duration_minutes, ' +
        'contact_method, related_cohort_id, subject, content, ' +
        'next_action, next_action_due, next_action_completed, ' +
        'is_confidential, created_at, updated_at, ' +
        'staff:staff_id (full_name, role)',
    )
    .eq('participant_id', id)
    .order('occurred_at', { ascending: false })

  type NoteWithJoin = CaseNoteRecord & {
    staff: { full_name: string | null; role: string | null } | null
  }

  const caseNotes: CaseNoteWithStaff[] = (
    (notesData ?? []) as unknown as NoteWithJoin[]
  ).map((n) => ({
    ...n,
    staff_full_name: n.staff?.full_name ?? null,
    staff_role: n.staff?.role ?? null,
  }))

  // Services delivered
  const { data: servicesData } = await supabase
    .from('services_delivered')
    .select(
      'id, participant_id, service_type_id, delivered_by_id, delivered_at, ' +
        'units, outcome, related_cohort_id, notes, cost_amount, ' +
        'cost_funded_by, created_at, ' +
        'service_type:service_type_id (name, category, countable_unit), ' +
        'staff:delivered_by_id (full_name)',
    )
    .eq('participant_id', id)
    .order('delivered_at', { ascending: false })

  type ServiceWithJoin = ServiceDeliveredRecord & {
    service_type: {
      name: string | null
      category: string | null
      countable_unit: string | null
    } | null
    staff: { full_name: string | null } | null
  }

  const services: ServiceWithJoins[] = (
    (servicesData ?? []) as unknown as ServiceWithJoin[]
  ).map((s) => ({
    ...s,
    service_type_name: s.service_type?.name ?? null,
    service_type_category: s.service_type?.category ?? null,
    service_type_unit: s.service_type?.countable_unit ?? null,
    delivered_by_name: s.staff?.full_name ?? null,
  }))

  // Service types catalog
  const { data: serviceTypesData } = await supabase
    .from('service_types')
    .select(
      'id, slug, name, description, category, countable_unit, is_active',
    )
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  const serviceTypes = (
    serviceTypesData ?? []
  ) as unknown as ServiceTypeRecord[]

  // Documents
  const { data: documentsData } = await supabase
    .from('participant_documents')
    .select(
      'id, participant_id, uploaded_by_id, filename, storage_path, ' +
        'file_size_bytes, mime_type, category, description, ' +
        'is_confidential, uploaded_at, expires_at, created_at, ' +
        'staff:uploaded_by_id (full_name)',
    )
    .eq('participant_id', id)
    .order('uploaded_at', { ascending: false })

  type DocWithJoin = ParticipantDocumentRecord & {
    staff: { full_name: string | null } | null
  }

  const documents: ParticipantDocumentWithStaff[] = (
    (documentsData ?? []) as unknown as DocWithJoin[]
  ).map((d) => ({
    ...d,
    uploaded_by_name: d.staff?.full_name ?? null,
  }))

  // Assessments with scores joined
  const { data: assessmentsData } = await supabase
    .from('assessments')
    .select(
      'id, participant_id, administered_by_id, assessed_at, interval, ' +
        'related_cohort_id, instrument_name, instrument_version, ' +
        'composite_score, ' +
        'staff:administered_by_id (full_name), ' +
        'scores:assessment_scores (id, assessment_id, domain, score, ' +
        '  sub_scores, notes, created_at)',
    )
    .eq('participant_id', id)
    .order('assessed_at', { ascending: false })

  type AssessmentWithJoin = AssessmentRecord & {
    staff: { full_name: string | null } | null
    scores: AssessmentScoreRecord[]
  }

  const assessments: AssessmentWithScores[] = (
    (assessmentsData ?? []) as unknown as AssessmentWithJoin[]
  ).map((a) => ({
    ...a,
    administered_by_name: a.staff?.full_name ?? null,
    scores: a.scores ?? [],
  }))

  // Staff (active only)
  const { data: staffData } = await supabase
    .from('staff')
    .select('id, full_name, role')
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  const staff = (staffData ?? []) as unknown as StaffRecord[]

  // VS uses vs_operators for auth; staff table is the CRM identity layer.
  // Default attribution to first staff member; Wave 3.5 links them properly.
  const defaultAuthorId = staff[0]?.id ?? null

  const greetingName = getOperatorDisplayName(user)

  const displayName =
    participant.preferred_name && participant.preferred_name.trim().length > 0
      ? `${participant.preferred_name} (${participant.first_name} ${participant.last_name})`
      : `${participant.first_name} ${participant.last_name}`

  const caseManager = participant.primary_case_manager_id
    ? staff.find((s) => s.id === participant.primary_case_manager_id)
    : undefined

  return (
    <div>
      {/* Back link */}
      <Link
        href="/admin/participants"
        style={{
          display: 'inline-block',
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#5B2C8F',
          textDecoration: 'none',
          marginBottom: '24px',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        }}
      >
        ← All Participants
      </Link>

      {/* Substrate eyebrow */}
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
        Participant · Case File
      </div>

      {/* Hero */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <h1
          style={{
            fontSize: '36px',
            lineHeight: 1.15,
            fontWeight: 600,
            color: '#0A0A0A',
            margin: 0,
            fontFamily: '"DM Serif Display", Georgia, serif',
          }}
        >
          {displayName}
        </h1>
        <StatusPillServer status={participant.status} />
        {participant.legacyline_subject_id && <LegacylinePillServer />}
      </div>

      {/* Quick facts */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1px',
          background: 'rgba(10, 10, 10, 0.08)',
          marginBottom: '32px',
          border: '1px solid rgba(10, 10, 10, 0.08)',
        }}
      >
        <QuickFact
          label="Intake Date"
          value={formatDate(participant.intake_date)}
        />
        <QuickFact
          label="Case Manager"
          value={caseManager?.full_name ?? 'Unassigned'}
        />
        <QuickFact label="Phone" value={participant.phone_primary ?? '—'} />
        <QuickFact label="Email" value={participant.email ?? '—'} />
        <QuickFact
          label="Location"
          value={
            participant.city
              ? `${participant.city}${participant.state ? ', ' + participant.state : ''}`
              : '—'
          }
        />
      </div>

      {/* Tabs */}
      <TabsClient
        participantId={participant.id}
        caseNotes={caseNotes}
        services={services}
        serviceTypes={serviceTypes}
        documents={documents}
        assessments={assessments}
        staff={staff}
        defaultAuthorId={defaultAuthorId}
        defaultDelivererId={defaultAuthorId}
        defaultUploaderId={defaultAuthorId}
        defaultAdministrator={defaultAuthorId}
        operatorName={greetingName}
      />
    </div>
  )
}

function StatusPillServer({ status }: { status: ParticipantRecord['status'] }) {
  return (
    <span
      style={{
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        padding: '4px 10px',
        borderRadius: '4px',
        background: 'rgba(91, 44, 143, 0.12)',
        color: '#5B2C8F',
        fontFamily:
          'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
      }}
    >
      {PARTICIPANT_STATUS_LABELS[status]}
    </span>
  )
}

function LegacylinePillServer() {
  return (
    <span
      style={{
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        padding: '4px 10px',
        borderRadius: '4px',
        background: 'rgba(10, 10, 10, 0.85)',
        color: '#FFFFFF',
        fontFamily:
          'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
      }}
    >
      In Legacyline
    </span>
  )
}

function QuickFact({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#FFFFFF', padding: '16px 20px' }}>
      <div
        style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(10, 10, 10, 0.5)',
          marginBottom: '6px',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '15px',
          fontWeight: 500,
          color: '#0A0A0A',
          lineHeight: 1.4,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  try {
    const date = new Date(d)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return d
  }
}
