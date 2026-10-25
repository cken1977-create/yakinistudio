// VIZIONZ SANKOFA · /admin/participants (Wave 3)
//
// Participants registry. Server component pulls initial roster + staff list +
// substrate counts. Client wrapper handles search, filters, edit modal.

import {
  requireOperatorOrEmployee,
  touchLastActive,
  getOperatorDisplayName,
} from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { ParticipantsListClient } from './ParticipantsListClient'
import type { ParticipantRecord, StaffRecord } from './types'
import { AdminCrumbs } from '@/components/admin/nav/AdminCrumbs'
import { CanEditProvider } from '@/components/admin/CanEdit'
import { canWriteCrm } from '@/lib/crm/model'
import { getAccessRole } from '@/lib/supabase/auth'

export const dynamic = 'force-dynamic'

export default async function ParticipantsPage() {
  const user = await requireOperatorOrEmployee()
  void touchLastActive(user.id)

  const supabase = await createClient()

  // Fetch participants
  const PARTICIPANT_COLS =
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
        'created_at, updated_at'
  // The API returns at most 1,000 rows per request, so page through with
  // .range() until a short page comes back. The list's search and status
  // tabs then cover every client, not just the newest 1,000.
  const PAGE = 1000
  const listParticipants = async (cols: string) => {
    const rows: unknown[] = []
    for (let from = 0; from < 50_000; from += PAGE) {
      const { data, error } = await supabase
        .from('participants')
        .select(cols)
        .order('intake_date', { ascending: false })
        .order('id', { ascending: true })
        .range(from, from + PAGE - 1)
      if (error) return { data: null, error }
      const batch = (data ?? []) as unknown[]
      rows.push(...batch)
      if (batch.length < PAGE) break
    }
    return { data: rows, error: null }
  }
  // service_county arrives with migration 0900; read without it until then.
  let { data: participantsData, error: participantsError } = await listParticipants(PARTICIPANT_COLS + ', service_county')
  if (participantsError && /service_county/.test(participantsError.message)) {
    ;({ data: participantsData, error: participantsError } = await listParticipants(PARTICIPANT_COLS))
  }

  const participants = (
    participantsError ? [] : (participantsData ?? [])
  ) as unknown as ParticipantRecord[]

  // Fetch staff for case manager dropdown
  const { data: staffData } = await supabase
    .from('staff')
    .select('id, full_name, role')
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  const staff = (staffData ?? []) as unknown as StaffRecord[]

  // Substrate counts
  const totalCount = participants.length
  const activeCount = participants.filter((p) => p.status === 'active').length
  const intakeCount = participants.filter((p) => p.status === 'intake').length

  const greetingName = getOperatorDisplayName(user)

  return (
    <div>
      <AdminCrumbs trail={[{ label: 'Participants' }]} fallbackHref="/admin" fallbackLabel="Operations" />
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
          Case management
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
          Participants
        </h1>
        <p
          style={{
            fontSize: '16px',
            lineHeight: 1.6,
            color: 'rgba(10, 10, 10, 0.65)',
            maxWidth: '640px',
          }}
        >
          Every family and individual Vizionz Sankofa walks with, {greetingName}.
          Add new intakes, update case status, assign case managers, and track
          consent.
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
        <SubstrateStat label="Total Served" value={totalCount.toString()} />
        <SubstrateStat
          label="Active Cases"
          value={activeCount.toString()}
          accent="#007A33"
        />
        <SubstrateStat
          label="In Intake"
          value={intakeCount.toString()}
          accent="#CE1126"
        />
      </section>

      {/* Client-side list with search + filter + edit */}
      <CanEditProvider value={canWriteCrm(getAccessRole(user))}>
        <ParticipantsListClient
          initialParticipants={participants}
          staff={staff}
        />
      </CanEditProvider>
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
