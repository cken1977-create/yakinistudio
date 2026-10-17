'use client'

// VIZIONZ SANKOFA · coalition partner detail
//   Agreements       MOUs and other agreements, with dates and signed copy
//   Check-ins        dated partner check-ins (no client names or details)
//   Shared programs  which VS programs / cohorts this partner helps run
// Executives and operators edit; others read. RLS enforces the same rules.

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { useUrlState } from '@/components/admin/nav/useUrlState'
import { Modal } from '@/components/admin/Modal'
import {
  Card,
  EmptyState,
  Field,
  Meta,
  MONO,
  Notice,
  PageIntro,
  Pill,
  Row,
  TabBar,
  TONES,
  formatDay,
  inputStyle,
  miniBtn,
  primaryBtn,
  secondaryBtn,
  textareaStyle,
} from '@/components/admin/ui'
import {
  AGREEMENT_COLUMNS,
  AGREEMENT_STATUS_LABELS,
  AGREEMENT_TYPE_LABELS,
  CHECKIN_COLUMNS,
  CHECKIN_METHOD_LABELS,
  EXPIRING_WINDOW_DAYS,
  LIVE_AGREEMENT_STATUSES,
  PARTNER_ROLE_LABELS,
  SHARED_PROGRAM_COLUMNS,
  SHARED_PROGRAM_STATUS_LABELS,
  daysUntil,
  type Agreement,
  type AgreementStatus,
  type AgreementType,
  type Checkin,
  type CheckinMethod,
  type CohortOption,
  type DocumentOption,
  type PartnerOrg,
  type PartnerRole,
  type ProgramOption,
  type SharedProgram,
  type SharedProgramStatus,
} from '../types'

type TabKey = 'agreements' | 'checkins' | 'programs'

export function PartnerDetailClient(props: {
  org: PartnerOrg
  agreements: Agreement[]
  checkins: Checkin[]
  sharedPrograms: SharedProgram[]
  programs: ProgramOption[]
  cohorts: CohortOption[]
  documents: DocumentOption[]
  canEdit: boolean
  canSeeCheckins: boolean
  tablesMissing: boolean
  operatorName: string
  today: string
}) {
  const { org, canEdit, canSeeCheckins, today } = props
  const tabKeys: TabKey[] = canSeeCheckins ? ['agreements', 'checkins', 'programs'] : ['agreements', 'programs']
  const [tab, setTab] = useUrlState<TabKey>('tab', 'agreements', tabKeys)
  const [agreements, setAgreements] = useState(props.agreements)
  const [checkins, setCheckins] = useState(props.checkins)
  const [shared, setShared] = useState(props.sharedPrograms)
  const [nextTouch, setNextTouch] = useState(org.next_touch_due)

  const touchDays = daysUntil(nextTouch, today)
  const contact = [org.primary_contact_name, org.primary_contact_role, org.primary_contact_email, org.primary_contact_phone]
    .filter(Boolean)
    .join(' · ')

  return (
    <div>
      <PageIntro kicker={`Coalition · ${org.type.replace(/_/g, ' ')}`} title={org.name}>
        {contact ? <>Contact: {contact}</> : 'No primary contact on file.'}
        {org.website && (
          <>
            {' · '}
            <a href={org.website} target="_blank" rel="noreferrer" style={{ color: '#5B2C8F' }}>
              Website
            </a>
          </>
        )}
      </PageIntro>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '24px' }}>
        {agreements.some((a) => LIVE_AGREEMENT_STATUSES.includes(a.status) && (daysUntil(a.expires_on, today) ?? 0) >= 0) ? (
          <Pill {...TONES.green}>Live MOU</Pill>
        ) : (
          <Pill {...TONES.grey}>No live MOU</Pill>
        )}
        {nextTouch && (
          <Pill {...(touchDays !== null && touchDays < 0 ? TONES.red : TONES.navy)}>
            {touchDays !== null && touchDays < 0 ? 'Check-in overdue · ' : 'Next check-in · '}
            {formatDay(nextTouch)}
          </Pill>
        )}
      </div>

      {props.tablesMissing && (
        <Notice>
          The coalition tables are not in the database yet. Apply migration{' '}
          <code>20261017000700_vs_coalition_partners.sql</code>.
        </Notice>
      )}

      <TabBar<TabKey>
        tabs={[
          { key: 'agreements', label: 'Agreements', count: agreements.length },
          ...(canSeeCheckins ? [{ key: 'checkins' as TabKey, label: 'Check-ins', count: checkins.length }] : []),
          { key: 'programs', label: 'Shared programs', count: shared.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'agreements' && (
        <AgreementsTab
          orgId={org.id}
          agreements={agreements}
          documents={props.documents}
          canEdit={canEdit && !props.tablesMissing}
          today={today}
          onChange={setAgreements}
        />
      )}
      {tab === 'checkins' && canSeeCheckins && (
        <CheckinsTab
          orgId={org.id}
          checkins={checkins}
          canEdit={canEdit && !props.tablesMissing}
          operatorName={props.operatorName}
          today={today}
          onAdded={(c) => {
            setCheckins((prev) => [c, ...prev].sort((a, b) => b.occurred_on.localeCompare(a.occurred_on)))
            if (c.next_checkin_due) setNextTouch(c.next_checkin_due)
          }}
        />
      )}
      {tab === 'programs' && (
        <ProgramsTab
          orgId={org.id}
          shared={shared}
          programs={props.programs}
          cohorts={props.cohorts}
          canEdit={canEdit && !props.tablesMissing}
          onChange={setShared}
        />
      )}
    </div>
  )
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <p style={{ color: '#CE1126', fontSize: '13px', margin: '8px 0' }}>{children}</p>
}

function FormButtons({ pending, onCancel, onSave, label }: { pending: boolean; onCancel: () => void; onSave: () => void; label: string }) {
  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
      <button type="button" onClick={onCancel} disabled={pending} style={secondaryBtn(pending)}>
        Cancel
      </button>
      <button type="button" onClick={onSave} disabled={pending} style={primaryBtn(pending)}>
        {pending ? 'Saving…' : label}
      </button>
    </div>
  )
}

// ─── Agreements ─────────────────────────────────────────────────────────────

function AgreementsTab({
  orgId,
  agreements,
  documents,
  canEdit,
  today,
  onChange,
}: {
  orgId: string
  agreements: Agreement[]
  documents: DocumentOption[]
  canEdit: boolean
  today: string
  onChange: (rows: Agreement[]) => void
}) {
  const [editing, setEditing] = useState<Agreement | 'new' | null>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const docTitle = useMemo(() => new Map(documents.map((d) => [d.id, d.title])), [documents])

  function remove(a: Agreement) {
    if (!window.confirm(`Delete "${a.title}"? This is logged in the audit trail.`)) return
    setError(null)
    startTransition(async () => {
      const { error: err } = await createBrowserClient().from('vs_partner_agreements').delete().eq('id', a.id)
      if (err) return setError(err.message)
      onChange(agreements.filter((x) => x.id !== a.id))
    })
  }

  return (
    <div>
      {canEdit && (
        <div style={{ marginBottom: '16px' }}>
          <button type="button" onClick={() => setEditing('new')} style={primaryBtn()}>
            + Add agreement
          </button>
        </div>
      )}
      {error && <ErrorText>{error}</ErrorText>}
      {agreements.length === 0 ? (
        <EmptyState title="No agreements yet">Add the MOU or other agreement with this partner to track its dates and status.</EmptyState>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {agreements.map((a) => {
            const days = daysUntil(a.expires_on, today)
            const live = LIVE_AGREEMENT_STATUSES.includes(a.status)
            const tone =
              live && days !== null && days < 0
                ? TONES.red
                : live
                ? TONES.green
                : a.status === 'expired' || a.status === 'terminated'
                ? TONES.grey
                : TONES.purple
            return (
              <Card key={a.id}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ minWidth: 0, flex: '1 1 260px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 600 }}>{a.title}</span>
                      <Pill {...TONES.navy}>{AGREEMENT_TYPE_LABELS[a.agreement_type]}</Pill>
                      <Pill {...tone}>{live && days !== null && days < 0 ? 'Past expiry' : AGREEMENT_STATUS_LABELS[a.status]}</Pill>
                      {live && days !== null && days >= 0 && days <= EXPIRING_WINDOW_DAYS && <Pill {...TONES.amber}>Expires in {days} days</Pill>}
                      {a.covers_participant_data && <Pill {...TONES.red}>Covers participant data</Pill>}
                    </div>
                    <Meta>
                      {[
                        a.effective_date ? `Effective ${formatDay(a.effective_date)}` : null,
                        a.expires_on ? `Expires ${formatDay(a.expires_on)}` : 'No end date',
                        a.signed_on ? `Signed ${formatDay(a.signed_on)}` : null,
                        a.vs_signatory ? `VS: ${a.vs_signatory}` : null,
                        a.partner_signatory ? `Partner: ${a.partner_signatory}` : null,
                        a.document_id ? `Copy: ${docTitle.get(a.document_id) ?? 'in Document Library'}` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Meta>
                    {a.notes && <p style={{ fontSize: '13px', margin: '8px 0 0', color: 'rgba(10, 10, 10, 0.7)', whiteSpace: 'pre-wrap' }}>{a.notes}</p>}
                  </div>
                  {canEdit && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button type="button" onClick={() => setEditing(a)} style={miniBtn(pending)} disabled={pending}>
                        Edit
                      </button>
                      <button type="button" onClick={() => remove(a)} style={miniBtn(pending, true)} disabled={pending}>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
      {editing && (
        <AgreementModal
          orgId={orgId}
          existing={editing === 'new' ? null : editing}
          documents={documents}
          onClose={() => setEditing(null)}
          onSaved={(row) => {
            const exists = agreements.some((a) => a.id === row.id)
            onChange(exists ? agreements.map((a) => (a.id === row.id ? row : a)) : [row, ...agreements])
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function AgreementModal({
  orgId,
  existing,
  documents,
  onClose,
  onSaved,
}: {
  orgId: string
  existing: Agreement | null
  documents: DocumentOption[]
  onClose: () => void
  onSaved: (a: Agreement) => void
}) {
  const [f, setF] = useState({
    title: existing?.title ?? '',
    agreement_type: (existing?.agreement_type ?? 'mou') as AgreementType,
    status: (existing?.status ?? 'drafting') as AgreementStatus,
    effective_date: existing?.effective_date ?? '',
    expires_on: existing?.expires_on ?? '',
    signed_on: existing?.signed_on ?? '',
    vs_signatory: existing?.vs_signatory ?? '',
    partner_signatory: existing?.partner_signatory ?? '',
    covers_participant_data: existing?.covers_participant_data ?? false,
    document_id: existing?.document_id ?? '',
    notes: existing?.notes ?? '',
  })
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }))
  // MOU-type documents first in the picker.
  const docs = useMemo(
    () => [...documents].sort((a, b) => Number(['mou', 'contract'].includes(b.category)) - Number(['mou', 'contract'].includes(a.category))),
    [documents],
  )

  function save() {
    setError(null)
    if (!f.title.trim()) return setError('Give the agreement a title.')
    if (f.effective_date && f.expires_on && f.expires_on < f.effective_date) return setError('The end date is before the start date.')
    const row = {
      organization_id: orgId,
      title: f.title.trim(),
      agreement_type: f.agreement_type,
      status: f.status,
      effective_date: f.effective_date || null,
      expires_on: f.expires_on || null,
      signed_on: f.signed_on || null,
      vs_signatory: f.vs_signatory.trim() || null,
      partner_signatory: f.partner_signatory.trim() || null,
      covers_participant_data: f.covers_participant_data,
      document_id: f.document_id || null,
      notes: f.notes.trim() || null,
    }
    startTransition(async () => {
      const supabase = createBrowserClient()
      const q = existing
        ? supabase.from('vs_partner_agreements').update(row).eq('id', existing.id)
        : supabase.from('vs_partner_agreements').insert(row)
      const { data, error: err } = await q.select(AGREEMENT_COLUMNS).single()
      if (err || !data) return setError(err?.message ?? 'Could not save.')
      onSaved(data as unknown as Agreement)
    })
  }

  return (
    <Modal title={existing ? 'Edit agreement' : 'Add agreement'} subtitle="MOU, data-sharing, referral or other agreement with this partner." onClose={onClose} maxWidth="720px">
      <Field label="Title *">
        <input value={f.title} onChange={(e) => set('title', e.target.value)} style={inputStyle} placeholder="e.g. 2026–27 Program partnership MOU" />
      </Field>
      <Row>
        <Field label="Type">
          <select value={f.agreement_type} onChange={(e) => set('agreement_type', e.target.value as AgreementType)} style={inputStyle}>
            {(Object.keys(AGREEMENT_TYPE_LABELS) as AgreementType[]).map((k) => (
              <option key={k} value={k}>
                {AGREEMENT_TYPE_LABELS[k]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select value={f.status} onChange={(e) => set('status', e.target.value as AgreementStatus)} style={inputStyle}>
            {(Object.keys(AGREEMENT_STATUS_LABELS) as AgreementStatus[]).map((k) => (
              <option key={k} value={k}>
                {AGREEMENT_STATUS_LABELS[k]}
              </option>
            ))}
          </select>
        </Field>
      </Row>
      <Row>
        <Field label="Effective">
          <input type="date" value={f.effective_date} onChange={(e) => set('effective_date', e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Expires">
          <input type="date" value={f.expires_on} onChange={(e) => set('expires_on', e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Signed on">
          <input type="date" value={f.signed_on} onChange={(e) => set('signed_on', e.target.value)} style={inputStyle} />
        </Field>
      </Row>
      <Row>
        <Field label="Signed for VS by">
          <input value={f.vs_signatory} onChange={(e) => set('vs_signatory', e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Signed for partner by">
          <input value={f.partner_signatory} onChange={(e) => set('partner_signatory', e.target.value)} style={inputStyle} />
        </Field>
      </Row>
      <Field label="Signed copy" hint="Upload it under Documents (category MOU or Contract) first if it is not listed.">
        <select value={f.document_id} onChange={(e) => set('document_id', e.target.value)} style={inputStyle}>
          <option value="">— None linked —</option>
          {docs.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title}
            </option>
          ))}
        </select>
      </Field>
      <label style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '14px', marginBottom: '8px', lineHeight: 1.5 }}>
        <input type="checkbox" checked={f.covers_participant_data} onChange={(e) => set('covers_participant_data', e.target.checked)} style={{ marginTop: '3px' }} />
        This agreement covers sharing participant data with the partner
      </label>
      {f.covers_participant_data && (
        <Notice tone="red">
          Participant-level data can only be shared with each person&apos;s signed consent and a signed
          data-sharing agreement. Recording the agreement here does not share anything.
        </Notice>
      )}
      <Field label="Notes">
        <textarea value={f.notes} onChange={(e) => set('notes', e.target.value)} style={textareaStyle} />
      </Field>
      {error && <ErrorText>{error}</ErrorText>}
      <FormButtons pending={pending} onCancel={onClose} onSave={save} label={existing ? 'Save changes' : 'Add agreement'} />
    </Modal>
  )
}

// ─── Check-ins ──────────────────────────────────────────────────────────────

function CheckinsTab({
  orgId,
  checkins,
  canEdit,
  operatorName,
  today,
  onAdded,
}: {
  orgId: string
  checkins: Checkin[]
  canEdit: boolean
  operatorName: string
  today: string
  onAdded: (c: Checkin) => void
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ occurred_on: today, method: 'meeting' as CheckinMethod, attendees: '', summary: '', next_steps: '', next_checkin_due: '' })
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }))

  function save() {
    setError(null)
    if (!f.summary.trim()) return setError('Add a short summary.')
    if (f.next_checkin_due && f.next_checkin_due < f.occurred_on) return setError('The next check-in date is before this one.')
    startTransition(async () => {
      const { data, error: err } = await createBrowserClient()
        .from('vs_partner_checkins')
        .insert({
          organization_id: orgId,
          occurred_on: f.occurred_on || today,
          method: f.method,
          attendees: f.attendees.trim() || null,
          summary: f.summary.trim(),
          next_steps: f.next_steps.trim() || null,
          next_checkin_due: f.next_checkin_due || null,
          logged_by_name: operatorName,
        })
        .select(CHECKIN_COLUMNS)
        .single()
      if (err || !data) return setError(err?.message ?? 'Could not save.')
      onAdded(data as unknown as Checkin)
      setF({ occurred_on: today, method: 'meeting', attendees: '', summary: '', next_steps: '', next_checkin_due: '' })
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <div>
      {canEdit && !open && (
        <div style={{ marginBottom: '16px' }}>
          <button type="button" onClick={() => setOpen(true)} style={primaryBtn()}>
            + Log check-in
          </button>
        </div>
      )}
      {canEdit && open && (
        <Card style={{ marginBottom: '20px' }}>
          <Notice tone="navy">Partner check-ins are about the relationship. Do not include client names or client details.</Notice>
          <Row>
            <Field label="Date">
              <input type="date" value={f.occurred_on} onChange={(e) => set('occurred_on', e.target.value)} style={inputStyle} />
            </Field>
            <Field label="How">
              <select value={f.method} onChange={(e) => set('method', e.target.value as CheckinMethod)} style={inputStyle}>
                {(Object.keys(CHECKIN_METHOD_LABELS) as CheckinMethod[]).map((k) => (
                  <option key={k} value={k}>
                    {CHECKIN_METHOD_LABELS[k]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Next check-in">
              <input type="date" value={f.next_checkin_due} onChange={(e) => set('next_checkin_due', e.target.value)} style={inputStyle} />
            </Field>
          </Row>
          <Field label="Who was there">
            <input value={f.attendees} onChange={(e) => set('attendees', e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Summary *">
            <textarea value={f.summary} onChange={(e) => set('summary', e.target.value)} style={textareaStyle} />
          </Field>
          <Field label="Next steps">
            <textarea value={f.next_steps} onChange={(e) => set('next_steps', e.target.value)} style={textareaStyle} />
          </Field>
          {error && <ErrorText>{error}</ErrorText>}
          <FormButtons pending={pending} onCancel={() => setOpen(false)} onSave={save} label="Save check-in" />
        </Card>
      )}
      {checkins.length === 0 ? (
        <EmptyState title="No check-ins yet">Log each partner meeting or call to keep the relationship on track.</EmptyState>
      ) : (
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {checkins.map((c) => (
            <li key={c.id}>
              <Card style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 600 }}>{formatDay(c.occurred_on)}</span>
                  <Pill {...TONES.navy}>{CHECKIN_METHOD_LABELS[c.method]}</Pill>
                </div>
                <p style={{ fontSize: '14px', lineHeight: 1.55, margin: '0 0 6px', whiteSpace: 'pre-wrap' }}>{c.summary}</p>
                {c.next_steps && (
                  <p style={{ fontSize: '13px', lineHeight: 1.5, margin: '0 0 6px', color: 'rgba(10, 10, 10, 0.7)', whiteSpace: 'pre-wrap' }}>
                    <span style={{ fontFamily: MONO, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Next: </span>
                    {c.next_steps}
                  </p>
                )}
                <Meta>
                  {[c.attendees ? `With ${c.attendees}` : null, c.next_checkin_due ? `Next check-in ${formatDay(c.next_checkin_due)}` : null, `Logged by ${c.logged_by_name ?? 'staff'}`]
                    .filter(Boolean)
                    .join(' · ')}
                </Meta>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

// ─── Shared programs ────────────────────────────────────────────────────────

function ProgramsTab({
  orgId,
  shared,
  programs,
  cohorts,
  canEdit,
  onChange,
}: {
  orgId: string
  shared: SharedProgram[]
  programs: ProgramOption[]
  cohorts: CohortOption[]
  canEdit: boolean
  onChange: (rows: SharedProgram[]) => void
}) {
  const [editing, setEditing] = useState<SharedProgram | 'new' | null>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const programName = useMemo(() => new Map(programs.map((p) => [p.id, p.name])), [programs])
  const cohortName = useMemo(() => new Map(cohorts.map((c) => [c.id, c.name])), [cohorts])

  function remove(s: SharedProgram) {
    if (!window.confirm('Remove this shared program link? This is logged in the audit trail.')) return
    setError(null)
    startTransition(async () => {
      const { error: err } = await createBrowserClient().from('vs_partner_programs').delete().eq('id', s.id)
      if (err) return setError(err.message)
      onChange(shared.filter((x) => x.id !== s.id))
    })
  }

  return (
    <div>
      {canEdit && (
        <div style={{ marginBottom: '16px' }}>
          <button type="button" onClick={() => setEditing('new')} style={primaryBtn(programs.length === 0)} disabled={programs.length === 0}>
            + Link a program
          </button>
          {programs.length === 0 && <Meta>Add a program under Programs first.</Meta>}
        </div>
      )}
      {error && <ErrorText>{error}</ErrorText>}
      {shared.length === 0 ? (
        <EmptyState title="No shared programs yet">Link the VS programs or cohorts this partner co-delivers, hosts, or refers into.</EmptyState>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {shared.map((s) => (
            <Card key={s.id} style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ minWidth: 0, flex: '1 1 260px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 600 }}>{programName.get(s.program_id) ?? 'Program'}</span>
                    <Pill {...TONES.navy}>{PARTNER_ROLE_LABELS[s.partner_role]}</Pill>
                    <Pill {...(s.status === 'active' ? TONES.green : s.status === 'ended' ? TONES.grey : TONES.purple)}>
                      {SHARED_PROGRAM_STATUS_LABELS[s.status]}
                    </Pill>
                  </div>
                  <Meta>
                    {[
                      s.cohort_id ? `Cohort: ${cohortName.get(s.cohort_id) ?? '—'}` : 'All cohorts',
                      s.start_date ? `From ${formatDay(s.start_date)}` : null,
                      s.end_date ? `To ${formatDay(s.end_date)}` : null,
                      s.partner_contact ? `Partner contact: ${s.partner_contact}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Meta>
                  {s.notes && <p style={{ fontSize: '13px', margin: '6px 0 0', color: 'rgba(10, 10, 10, 0.7)', whiteSpace: 'pre-wrap' }}>{s.notes}</p>}
                </div>
                {canEdit && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button type="button" onClick={() => setEditing(s)} style={miniBtn(pending)} disabled={pending}>
                      Edit
                    </button>
                    <button type="button" onClick={() => remove(s)} style={miniBtn(pending, true)} disabled={pending}>
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      {editing && (
        <SharedProgramModal
          orgId={orgId}
          existing={editing === 'new' ? null : editing}
          programs={programs}
          cohorts={cohorts}
          onClose={() => setEditing(null)}
          onSaved={(row) => {
            const exists = shared.some((s) => s.id === row.id)
            onChange(exists ? shared.map((s) => (s.id === row.id ? row : s)) : [...shared, row])
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function SharedProgramModal({
  orgId,
  existing,
  programs,
  cohorts,
  onClose,
  onSaved,
}: {
  orgId: string
  existing: SharedProgram | null
  programs: ProgramOption[]
  cohorts: CohortOption[]
  onClose: () => void
  onSaved: (s: SharedProgram) => void
}) {
  const [f, setF] = useState({
    program_id: existing?.program_id ?? programs[0]?.id ?? '',
    cohort_id: existing?.cohort_id ?? '',
    partner_role: (existing?.partner_role ?? 'co_delivery') as PartnerRole,
    status: (existing?.status ?? 'active') as SharedProgramStatus,
    start_date: existing?.start_date ?? '',
    end_date: existing?.end_date ?? '',
    partner_contact: existing?.partner_contact ?? '',
    notes: existing?.notes ?? '',
  })
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }))
  const programCohorts = cohorts.filter((c) => c.program_id === f.program_id)

  function save() {
    setError(null)
    if (!f.program_id) return setError('Pick a program.')
    if (f.start_date && f.end_date && f.end_date < f.start_date) return setError('The end date is before the start date.')
    const row = {
      organization_id: orgId,
      program_id: f.program_id,
      cohort_id: f.cohort_id || null,
      partner_role: f.partner_role,
      status: f.status,
      start_date: f.start_date || null,
      end_date: f.end_date || null,
      partner_contact: f.partner_contact.trim() || null,
      notes: f.notes.trim() || null,
    }
    startTransition(async () => {
      const supabase = createBrowserClient()
      const q = existing
        ? supabase.from('vs_partner_programs').update(row).eq('id', existing.id)
        : supabase.from('vs_partner_programs').insert(row)
      const { data, error: err } = await q.select(SHARED_PROGRAM_COLUMNS).single()
      if (err || !data) {
        return setError(
          err?.code === '23505' ? 'This partner already has that role on that program.' : err?.message ?? 'Could not save.',
        )
      }
      onSaved(data as unknown as SharedProgram)
    })
  }

  return (
    <Modal title={existing ? 'Edit shared program' : 'Link a program'} subtitle="How this partner takes part in a VS program." onClose={onClose}>
      <Row>
        <Field label="Program *">
          <select value={f.program_id} onChange={(e) => setF((p) => ({ ...p, program_id: e.target.value, cohort_id: '' }))} style={inputStyle}>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Cohort">
          <select value={f.cohort_id} onChange={(e) => set('cohort_id', e.target.value)} style={inputStyle}>
            <option value="">All cohorts</option>
            {programCohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </Row>
      <Row>
        <Field label="Partner role">
          <select value={f.partner_role} onChange={(e) => set('partner_role', e.target.value as PartnerRole)} style={inputStyle}>
            {(Object.keys(PARTNER_ROLE_LABELS) as PartnerRole[]).map((k) => (
              <option key={k} value={k}>
                {PARTNER_ROLE_LABELS[k]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select value={f.status} onChange={(e) => set('status', e.target.value as SharedProgramStatus)} style={inputStyle}>
            {(Object.keys(SHARED_PROGRAM_STATUS_LABELS) as SharedProgramStatus[]).map((k) => (
              <option key={k} value={k}>
                {SHARED_PROGRAM_STATUS_LABELS[k]}
              </option>
            ))}
          </select>
        </Field>
      </Row>
      <Row>
        <Field label="Start">
          <input type="date" value={f.start_date} onChange={(e) => set('start_date', e.target.value)} style={inputStyle} />
        </Field>
        <Field label="End">
          <input type="date" value={f.end_date} onChange={(e) => set('end_date', e.target.value)} style={inputStyle} />
        </Field>
      </Row>
      <Field label="Partner contact for this program">
        <input value={f.partner_contact} onChange={(e) => set('partner_contact', e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Notes">
        <textarea value={f.notes} onChange={(e) => set('notes', e.target.value)} style={textareaStyle} />
      </Field>
      {error && <ErrorText>{error}</ErrorText>}
      <FormButtons pending={pending} onCancel={onClose} onSave={save} label={existing ? 'Save changes' : 'Link program'} />
    </Modal>
  )
}
