'use client'

// VIZIONZ SANKOFA · /admin/participants · interactive list + add/edit modal
//
// Handles: search, status tabs, case manager filter, add new, edit existing,
// save via Supabase, optimistic UI refresh, Legacyline status badges.

import { useMemo, useState, useTransition } from 'react'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type {
  ParticipantEditableFields,
  ParticipantRecord,
  ParticipantStatus,
  ReferralSource,
  StaffRecord,
} from './types'
import {
  PARTICIPANT_STATUS_LABELS,
  REFERRAL_SOURCE_LABELS,
} from './types'

const STATUS_TABS: { key: 'all' | ParticipantStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'intake', label: 'Intake' },
  { key: 'assessed', label: 'Assessed' },
  { key: 'active', label: 'Active' },
  { key: 'on_hold', label: 'On Hold' },
  { key: 'graduated', label: 'Graduated' },
  { key: 'follow_up', label: 'Follow-up' },
  { key: 'closed', label: 'Closed' },
]

export function ParticipantsListClient({
  initialParticipants,
  staff,
}: {
  initialParticipants: ParticipantRecord[]
  staff: StaffRecord[]
}) {
  const [participants, setParticipants] =
    useState<ParticipantRecord[]>(initialParticipants)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'all' | ParticipantStatus>('all')
  const [editing, setEditing] = useState<ParticipantRecord | null>(null)
  const [adding, setAdding] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return participants.filter((p) => {
      if (tab !== 'all' && p.status !== tab) return false
      if (!q) return true
      const haystack = [
        p.first_name,
        p.last_name,
        p.preferred_name ?? '',
        p.email ?? '',
        p.phone_primary ?? '',
        p.city ?? '',
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [participants, search, tab])

  const staffById = useMemo(() => {
    const map = new Map<string, StaffRecord>()
    staff.forEach((s) => map.set(s.id, s))
    return map
  }, [staff])

  return (
    <>
      {/* Controls */}
      <section
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <input
          type="text"
          placeholder="Search by name, email, phone, city…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: '1 1 240px',
            padding: '10px 14px',
            border: '1px solid rgba(10, 10, 10, 0.16)',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#0A0A0A',
            background: '#FFFFFF',
          }}
        />
        <button
          onClick={() => setAdding(true)}
          style={{
            padding: '10px 18px',
            border: '1px solid #0A0A0A',
            background: '#0A0A0A',
            color: '#FFFFFF',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          + Add Participant
        </button>
      </section>

      {/* Status tabs */}
      <section
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '20px',
        }}
      >
        {STATUS_TABS.map((t) => {
          const count =
            t.key === 'all'
              ? participants.length
              : participants.filter((p) => p.status === t.key).length
          return (
            <TabButton
              key={t.key}
              label={`${t.label} · ${count}`}
              active={tab === t.key}
              onClick={() => setTab(t.key)}
            />
          )
        })}
      </section>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState search={search} hasData={participants.length > 0} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((p) => (
            <ParticipantRow
              key={p.id}
              participant={p}
              caseManager={
                p.primary_case_manager_id
                  ? staffById.get(p.primary_case_manager_id)
                  : undefined
              }
              onEdit={() => setEditing(p)}
            />
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <ParticipantModal
          mode="edit"
          participant={editing}
          staff={staff}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setParticipants((prev) =>
              prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)),
            )
            setEditing(null)
          }}
        />
      )}

      {/* Add modal */}
      {adding && (
        <ParticipantModal
          mode="add"
          staff={staff}
          onClose={() => setAdding(false)}
          onSaved={(created) => {
            setParticipants((prev) => [created, ...prev])
            setAdding(false)
          }}
        />
      )}
    </>
  )
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 14px',
        border: active
          ? '1px solid #0A0A0A'
          : '1px solid rgba(10, 10, 10, 0.16)',
        background: active ? '#0A0A0A' : '#FFFFFF',
        color: active ? '#FFFFFF' : '#0A0A0A',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  )
}

function ParticipantRow({
  participant,
  caseManager,
  onEdit,
}: {
  participant: ParticipantRecord
  caseManager: StaffRecord | undefined
  onEdit: () => void
}) {
  const displayName =
    participant.preferred_name && participant.preferred_name.trim().length > 0
      ? `${participant.preferred_name} (${participant.first_name} ${participant.last_name})`
      : `${participant.first_name} ${participant.last_name}`

  const contactPieces = [
    participant.phone_primary,
    participant.email,
    participant.city,
  ].filter((x): x is string => !!x && x.trim().length > 0)

  return (
    <article
      style={{
        border: '1px solid rgba(10, 10, 10, 0.1)',
        borderRadius: '8px',
        padding: '20px 22px',
        background: '#FFFFFF',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '16px',
        alignItems: 'center',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '6px',
          }}
        >
          <h3
            style={{
              fontSize: '17px',
              fontWeight: 600,
              color: '#0A0A0A',
              margin: 0,
              fontFamily: '"DM Serif Display", Georgia, serif',
            }}
          >
            {displayName}
          </h3>
          <StatusPill status={participant.status} />
          {participant.legacyline_subject_id && <LegacylinePill />}
        </div>
        <div
          style={{
            fontSize: '13px',
            color: 'rgba(10, 10, 10, 0.6)',
            lineHeight: 1.5,
            marginBottom: '4px',
          }}
        >
          {contactPieces.length > 0
            ? contactPieces.join(' · ')
            : 'No contact info on file'}
        </div>
        {caseManager && (
          <div
            style={{
              fontSize: '12px',
              color: 'rgba(10, 10, 10, 0.5)',
              fontFamily:
                'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
              letterSpacing: '0.04em',
            }}
          >
            Case Manager: {caseManager.full_name}
          </div>
        )}
      </div>
      <button
        onClick={onEdit}
        style={{
          padding: '8px 16px',
          border: '1px solid #0A0A0A',
          background: '#FFFFFF',
          color: '#0A0A0A',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        Open
      </button>
    </article>
  )
}

function StatusPill({ status }: { status: ParticipantStatus }) {
  const colors: Record<ParticipantStatus, { bg: string; fg: string }> = {
    intake: { bg: 'rgba(206, 17, 38, 0.12)', fg: '#CE1126' },
    assessed: { bg: 'rgba(91, 44, 143, 0.12)', fg: '#5B2C8F' },
    active: { bg: 'rgba(0, 122, 51, 0.12)', fg: '#007A33' },
    on_hold: { bg: 'rgba(180, 130, 0, 0.12)', fg: '#7A5A00' },
    graduated: { bg: 'rgba(0, 122, 51, 0.12)', fg: '#007A33' },
    inactive: { bg: 'rgba(10, 10, 10, 0.08)', fg: 'rgba(10, 10, 10, 0.55)' },
    follow_up: { bg: 'rgba(91, 44, 143, 0.12)', fg: '#5B2C8F' },
    closed: { bg: 'rgba(10, 10, 10, 0.08)', fg: 'rgba(10, 10, 10, 0.55)' },
  }
  const c = colors[status]
  return (
    <span
      style={{
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        padding: '3px 8px',
        borderRadius: '4px',
        background: c.bg,
        color: c.fg,
        fontFamily:
          'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
      }}
    >
      {PARTICIPANT_STATUS_LABELS[status]}
    </span>
  )
}

function LegacylinePill() {
  return (
    <span
      style={{
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        padding: '3px 8px',
        borderRadius: '4px',
        background: 'rgba(10, 10, 10, 0.85)',
        color: '#FFFFFF',
        fontFamily:
          'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
      }}
    >
      Legacyline
    </span>
  )
}

function EmptyState({
  search,
  hasData,
}: {
  search: string
  hasData: boolean
}) {
  return (
    <div
      style={{
        padding: '60px 24px',
        textAlign: 'center',
        border: '1px dashed rgba(10, 10, 10, 0.18)',
        borderRadius: '8px',
        background: '#FAFAF8',
      }}
    >
      <div
        style={{
          fontSize: '14px',
          color: 'rgba(10, 10, 10, 0.6)',
        }}
      >
        {search
          ? `No participants match "${search}".`
          : hasData
            ? 'No participants in this status.'
            : 'No participants yet. Click + Add Participant to add your first case file.'}
      </div>
    </div>
  )
}

function ParticipantModal({
  mode,
  participant,
  staff,
  onClose,
  onSaved,
}: {
  mode: 'add' | 'edit'
  participant?: ParticipantRecord
  staff: StaffRecord[]
  onClose: () => void
  onSaved: (record: ParticipantRecord) => void
}) {
  const today = new Date().toISOString().slice(0, 10)

  const [draft, setDraft] = useState<ParticipantEditableFields>({
    first_name: participant?.first_name ?? '',
    last_name: participant?.last_name ?? '',
    preferred_name: participant?.preferred_name ?? null,
    date_of_birth: participant?.date_of_birth ?? null,
    phone_primary: participant?.phone_primary ?? null,
    email: participant?.email ?? null,
    city: participant?.city ?? null,
    state: participant?.state ?? 'NM',
    zip: participant?.zip ?? null,
    intake_date: participant?.intake_date ?? today,
    status: participant?.status ?? 'intake',
    referral_source: participant?.referral_source ?? null,
    referral_source_detail: participant?.referral_source_detail ?? null,
    primary_case_manager_id: participant?.primary_case_manager_id ?? null,
    intake_notes: participant?.intake_notes ?? null,
    consent_to_services: participant?.consent_to_services ?? false,
    consent_to_share_data: participant?.consent_to_share_data ?? false,
    consent_to_photos: participant?.consent_to_photos ?? false,
  })
  const [pending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function update<K extends keyof ParticipantEditableFields>(
    key: K,
    value: ParticipantEditableFields[K],
  ) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function save() {
    if (!draft.first_name.trim() || !draft.last_name.trim()) {
      setErrorMsg('First name and last name are required.')
      return
    }
    setErrorMsg(null)
    startTransition(async () => {
      const supabase = createBrowserClient()

      if (mode === 'edit' && participant) {
        const { data, error } = await supabase
          .from('participants')
          .update(draft)
          .eq('id', participant.id)
          .select()
          .single()

        if (error) {
          setErrorMsg(error.message)
          return
        }
        if (data) onSaved(data as unknown as ParticipantRecord)
      } else {
        const { data, error } = await supabase
          .from('participants')
          .insert(draft)
          .select()
          .single()

        if (error) {
          setErrorMsg(error.message)
          return
        }
        if (data) onSaved(data as unknown as ParticipantRecord)
      }
    })
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 10, 10, 0.45)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '40px 16px',
        zIndex: 100,
        overflowY: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '680px',
          background: '#FFFFFF',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 24px 64px rgba(10, 10, 10, 0.25)',
        }}
      >
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 600,
            color: '#0A0A0A',
            marginBottom: '6px',
            fontFamily: '"DM Serif Display", Georgia, serif',
          }}
        >
          {mode === 'add' ? 'Add Participant' : 'Edit Participant'}
        </h2>
        <p
          style={{
            fontSize: '13px',
            color: 'rgba(10, 10, 10, 0.6)',
            marginBottom: '24px',
          }}
        >
          {mode === 'add'
            ? 'New case file. You can add more details later.'
            : `${participant?.first_name} ${participant?.last_name}`}
        </p>

        <Row>
          <Field label="First Name *">
            <input
              type="text"
              value={draft.first_name}
              onChange={(e) => update('first_name', e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Last Name *">
            <input
              type="text"
              value={draft.last_name}
              onChange={(e) => update('last_name', e.target.value)}
              style={inputStyle}
            />
          </Field>
        </Row>

        <Field label="Preferred Name">
          <input
            type="text"
            value={draft.preferred_name ?? ''}
            onChange={(e) => update('preferred_name', e.target.value || null)}
            style={inputStyle}
          />
        </Field>

        <Row>
          <Field label="Date of Birth">
            <input
              type="date"
              value={draft.date_of_birth ?? ''}
              onChange={(e) => update('date_of_birth', e.target.value || null)}
              style={inputStyle}
            />
          </Field>
          <Field label="Intake Date *">
            <input
              type="date"
              value={draft.intake_date}
              onChange={(e) => update('intake_date', e.target.value)}
              style={inputStyle}
            />
          </Field>
        </Row>

        <Row>
          <Field label="Phone">
            <input
              type="tel"
              value={draft.phone_primary ?? ''}
              onChange={(e) => update('phone_primary', e.target.value || null)}
              style={inputStyle}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={draft.email ?? ''}
              onChange={(e) => update('email', e.target.value || null)}
              style={inputStyle}
            />
          </Field>
        </Row>

        <Row>
          <Field label="City">
            <input
              type="text"
              value={draft.city ?? ''}
              onChange={(e) => update('city', e.target.value || null)}
              style={inputStyle}
            />
          </Field>
          <Field label="State">
            <input
              type="text"
              value={draft.state ?? ''}
              onChange={(e) => update('state', e.target.value || null)}
              style={{ ...inputStyle, maxWidth: '100px' }}
            />
          </Field>
          <Field label="ZIP">
            <input
              type="text"
              value={draft.zip ?? ''}
              onChange={(e) => update('zip', e.target.value || null)}
              style={{ ...inputStyle, maxWidth: '120px' }}
            />
          </Field>
        </Row>

        <Row>
          <Field label="Status">
            <select
              value={draft.status}
              onChange={(e) =>
                update('status', e.target.value as ParticipantStatus)
              }
              style={inputStyle}
            >
              {(Object.keys(PARTICIPANT_STATUS_LABELS) as ParticipantStatus[]).map(
                (s) => (
                  <option key={s} value={s}>
                    {PARTICIPANT_STATUS_LABELS[s]}
                  </option>
                ),
              )}
            </select>
          </Field>
          <Field label="Case Manager">
            <select
              value={draft.primary_case_manager_id ?? ''}
              onChange={(e) =>
                update('primary_case_manager_id', e.target.value || null)
              }
              style={inputStyle}
            >
              <option value="">— Unassigned —</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}
                </option>
              ))}
            </select>
          </Field>
        </Row>

        <Row>
          <Field label="Referral Source">
            <select
              value={draft.referral_source ?? ''}
              onChange={(e) =>
                update(
                  'referral_source',
                  (e.target.value as ReferralSource) || null,
                )
              }
              style={inputStyle}
            >
              <option value="">— None —</option>
              {(Object.keys(REFERRAL_SOURCE_LABELS) as ReferralSource[]).map(
                (s) => (
                  <option key={s} value={s}>
                    {REFERRAL_SOURCE_LABELS[s]}
                  </option>
                ),
              )}
            </select>
          </Field>
          <Field label="Referral Detail">
            <input
              type="text"
              value={draft.referral_source_detail ?? ''}
              onChange={(e) =>
                update('referral_source_detail', e.target.value || null)
              }
              placeholder="Optional: name, court, agency"
              style={inputStyle}
            />
          </Field>
        </Row>

        <Field label="Intake Notes">
          <textarea
            value={draft.intake_notes ?? ''}
            onChange={(e) => update('intake_notes', e.target.value || null)}
            rows={3}
            placeholder="What is going on? What support are they seeking?"
            style={{ ...inputStyle, fontFamily: 'inherit' }}
          />
        </Field>

        <Field label="Consent">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '12px 14px',
              border: '1px solid rgba(10, 10, 10, 0.12)',
              borderRadius: '6px',
              background: '#FAFAF8',
            }}
          >
            <label style={consentLabelStyle}>
              <input
                type="checkbox"
                checked={!!draft.consent_to_services}
                onChange={(e) => update('consent_to_services', e.target.checked)}
              />
              <span>Consents to receive services</span>
            </label>
            <label style={consentLabelStyle}>
              <input
                type="checkbox"
                checked={!!draft.consent_to_share_data}
                onChange={(e) =>
                  update('consent_to_share_data', e.target.checked)
                }
              />
              <span>Consents to share data with partner orgs</span>
            </label>
            <label style={consentLabelStyle}>
              <input
                type="checkbox"
                checked={!!draft.consent_to_photos}
                onChange={(e) => update('consent_to_photos', e.target.checked)}
              />
              <span>Consents to photos / media use</span>
            </label>
          </div>
        </Field>

        {errorMsg && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(206, 17, 38, 0.08)',
              color: '#CE1126',
              borderRadius: '6px',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {errorMsg}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end',
            marginTop: '8px',
          }}
        >
          <button
            onClick={onClose}
            disabled={pending}
            style={cancelBtn(pending)}
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={pending}
            style={saveBtn(pending)}
          >
            {pending ? 'Saving…' : mode === 'add' ? 'Add Participant' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
      }}
    >
      {children}
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(10, 10, 10, 0.55)',
            marginBottom: '6px',
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          }}
        >
          {label}
        </label>
      )}
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid rgba(10, 10, 10, 0.16)',
  borderRadius: '6px',
  fontSize: '14px',
  color: '#0A0A0A',
  background: '#FFFFFF',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

const consentLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  fontSize: '14px',
  color: '#0A0A0A',
  cursor: 'pointer',
}

function cancelBtn(pending: boolean): React.CSSProperties {
  return {
    padding: '10px 18px',
    border: '1px solid rgba(10, 10, 10, 0.16)',
    background: '#FFFFFF',
    color: '#0A0A0A',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: pending ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
  }
}

function saveBtn(pending: boolean): React.CSSProperties {
  return {
    padding: '10px 18px',
    border: '1px solid #0A0A0A',
    background: '#0A0A0A',
    color: '#FFFFFF',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: pending ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
  }
}
