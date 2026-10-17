'use client'

// VIZIONZ SANKOFA · OBR profile detail
//   Intake    — identity, governance & leadership, staff, policy & compliance,
//               financial (the OBR intake sections)
//   Evidence  — checklist; each item records who attested, the source and date
//   Ratings   — append-only decision records from a certified evaluator
// Executives and operators edit; read-only leadership sees everything but
// cannot change it. The database enforces the same rules (RLS).

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
  SectionLabel,
  SERIF,
  TabBar,
  TONES,
  formatDay,
  inputStyle,
  miniBtn,
  primaryBtn,
  secondaryBtn,
  textareaStyle,
  todayIso,
} from '@/components/admin/ui'
import {
  CERTIFICATION_LABELS,
  EVIDENCE_ITEMS,
  EVIDENCE_STATUS_LABELS,
  OBR_DOMAINS,
  OBR_STATUS_LABELS,
  type CertificationStatus,
  type DocumentOption,
  type EvidenceKey,
  type EvidenceStatus,
  type ObrEvidence,
  type ObrProfile,
  type ObrRating,
  type ObrStatus,
} from '../types'

type TabKey = 'intake' | 'evidence' | 'ratings'
const TAB_KEYS: TabKey[] = ['intake', 'evidence', 'ratings']

export function ObrDetailClient({
  profile: initialProfile,
  evidence: initialEvidence,
  ratings: initialRatings,
  documents,
  canEdit,
  operatorName,
}: {
  profile: ObrProfile
  evidence: ObrEvidence[]
  ratings: ObrRating[]
  documents: DocumentOption[]
  canEdit: boolean
  operatorName: string
}) {
  const [tab, setTab] = useUrlState<TabKey>('tab', 'intake', TAB_KEYS)
  const [profile, setProfile] = useState(initialProfile)
  const [evidence, setEvidence] = useState(initialEvidence)
  const [ratings, setRatings] = useState(initialRatings)

  const onFile = evidence.filter((e) => e.status !== 'missing').length
  const latest = ratings[0] ?? null

  return (
    <div>
      <PageIntro kicker={profile.is_self ? 'Readiness · OBR · Vizionz Sankofa' : 'Readiness · OBR · Coalition partner'} title={profile.display_name}>
        Organizational readiness intake and evidence. A certified evaluator reviews it against the
        BRSA OBR standard and issues the rating; the decision is recorded under Ratings.
      </PageIntro>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '24px' }}>
        <Pill>{OBR_STATUS_LABELS[profile.status]}</Pill>
        {latest && (
          <Pill {...(latest.certification_status === 'certified' ? TONES.green : TONES.grey)}>
            {CERTIFICATION_LABELS[latest.certification_status]} · Standard {latest.standard_version}
          </Pill>
        )}
        <Meta>
          Evidence {onFile}/{EVIDENCE_ITEMS.length} on file · Updated {formatDay(profile.updated_at)}
        </Meta>
      </div>

      {canEdit && <WorkflowBar profile={profile} onChange={setProfile} />}

      <TabBar<TabKey>
        tabs={[
          { key: 'intake', label: 'Intake' },
          { key: 'evidence', label: 'Evidence', count: onFile },
          { key: 'ratings', label: 'Ratings', count: ratings.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'intake' && <IntakeTab profile={profile} canEdit={canEdit} onSaved={setProfile} />}
      {tab === 'evidence' && (
        <EvidenceTab
          profileId={profile.id}
          evidence={evidence}
          documents={documents}
          canEdit={canEdit}
          operatorName={operatorName}
          onChange={setEvidence}
        />
      )}
      {tab === 'ratings' && (
        <RatingsTab
          profileId={profile.id}
          ratings={ratings}
          canEdit={canEdit}
          operatorName={operatorName}
          onRecorded={(r) => {
            setRatings((prev) => [r, ...prev])
            if (!['not_started', 'in_review'].includes(r.certification_status)) {
              setProfile((p) => ({ ...p, status: 'rated' }))
            }
          }}
        />
      )}
    </div>
  )
}

// ─── Workflow ───────────────────────────────────────────────────────────────

function WorkflowBar({ profile, onChange }: { profile: ObrProfile; onChange: (p: ObrProfile) => void }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const next: { status: ObrStatus; label: string } | null =
    profile.status === 'not_started' || profile.status === 'in_progress'
      ? { status: 'ready_for_review', label: 'Mark intake ready for review' }
      : profile.status === 'ready_for_review'
      ? { status: 'submitted', label: 'Mark submitted to evaluator' }
      : null
  const back: { status: ObrStatus; label: string } | null =
    profile.status === 'ready_for_review' || profile.status === 'submitted'
      ? { status: 'in_progress', label: 'Reopen intake' }
      : null

  function move(status: ObrStatus) {
    setError(null)
    startTransition(async () => {
      const supabase = createBrowserClient()
      const patch: Partial<ObrProfile> & { submitted_by?: string } = { status }
      if (status === 'submitted') patch.submitted_at = new Date().toISOString()
      const { data, error: err } = await supabase
        .from('vs_obr_profiles')
        .update(patch)
        .eq('id', profile.id)
        .select('*')
        .single()
      if (err || !data) {
        setError(err?.message ?? 'Could not update the status.')
        return
      }
      onChange(data as unknown as ObrProfile)
    })
  }

  if (!next && !back) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
      {next && (
        <button type="button" disabled={pending} onClick={() => move(next.status)} style={primaryBtn(pending)}>
          {next.label}
        </button>
      )}
      {back && (
        <button type="button" disabled={pending} onClick={() => move(back.status)} style={secondaryBtn(pending)}>
          {back.label}
        </button>
      )}
      {error && <p style={{ color: '#CE1126', fontSize: '13px', margin: 0, flexBasis: '100%' }}>{error}</p>}
    </div>
  )
}

// ─── Intake ─────────────────────────────────────────────────────────────────

type IntakeKey = Exclude<
  keyof ObrProfile,
  'id' | 'is_self' | 'organization_id' | 'status' | 'submitted_at' | 'created_at' | 'updated_at'
>

type IntakeField = { key: IntakeKey; label: string; kind: 'text' | 'long' | 'int' | 'money' | 'date' | 'email' }

const INTAKE_SECTIONS: { key: string; title: string; fields: IntakeField[] }[] = [
  {
    key: 'identity',
    title: 'Identity',
    fields: [
      { key: 'display_name', label: 'Organization name', kind: 'text' },
      { key: 'ein', label: 'EIN', kind: 'text' },
      { key: 'legal_structure', label: 'Legal structure', kind: 'text' },
      { key: 'year_founded', label: 'Year founded', kind: 'int' },
      { key: 'primary_contact_name', label: 'Primary contact', kind: 'text' },
      { key: 'primary_contact_email', label: 'Contact email', kind: 'email' },
    ],
  },
  {
    key: 'governance',
    title: 'Governance & leadership',
    fields: [
      { key: 'leadership_composition', label: 'Leadership composition', kind: 'long' },
      { key: 'board_structure', label: 'Board structure', kind: 'long' },
      { key: 'decision_process', label: 'Decision-making process', kind: 'long' },
      { key: 'succession_plan', label: 'Succession plan', kind: 'long' },
    ],
  },
  {
    key: 'staff',
    title: 'Staff',
    fields: [
      { key: 'staff_count', label: 'Total staff count', kind: 'int' },
      { key: 'turnover_rate', label: 'Annual turnover', kind: 'text' },
      { key: 'training_programs', label: 'Training programs', kind: 'long' },
      { key: 'behavioral_policy_docs', label: 'Conduct / behavioral policy documentation', kind: 'long' },
    ],
  },
  {
    key: 'policy',
    title: 'Policy & compliance',
    fields: [
      { key: 'active_policies', label: 'Active policies', kind: 'long' },
      { key: 'last_audit_date', label: 'Last audit date', kind: 'date' },
      { key: 'compliance_history', label: 'Compliance history', kind: 'long' },
      { key: 'documentation_status', label: 'Documentation status', kind: 'long' },
    ],
  },
  {
    key: 'financial',
    title: 'Financial',
    fields: [
      { key: 'annual_budget', label: 'Annual operating budget ($)', kind: 'money' },
      { key: 'funding_sources', label: 'Primary funding sources', kind: 'long' },
      { key: 'reserves', label: 'Financial reserves', kind: 'long' },
      { key: 'sustainability_plan', label: 'Sustainability plan', kind: 'long' },
    ],
  },
]

function IntakeTab({ profile, canEdit, onSaved }: { profile: ObrProfile; canEdit: boolean; onSaved: (p: ObrProfile) => void }) {
  const [editing, setEditing] = useState<string | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {INTAKE_SECTIONS.map((section) => {
        const filled = section.fields.filter((f) => {
          const v = profile[f.key]
          return v !== null && v !== undefined && String(v).trim() !== ''
        }).length
        return (
          <Card key={section.key}>
            <SectionLabel
              right={
                canEdit && editing !== section.key ? (
                  <button type="button" onClick={() => setEditing(section.key)} style={miniBtn()}>
                    Edit
                  </button>
                ) : undefined
              }
            >
              {section.title} · {filled}/{section.fields.length}
            </SectionLabel>
            {editing === section.key ? (
              <SectionForm
                profile={profile}
                fields={section.fields}
                onCancel={() => setEditing(null)}
                onSaved={(p) => {
                  onSaved(p)
                  setEditing(null)
                }}
              />
            ) : (
              <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px 24px', margin: 0 }}>
                {section.fields.map((f) => (
                  <div key={f.key}>
                    <dt style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(10, 10, 10, 0.5)', fontFamily: MONO, marginBottom: '4px' }}>
                      {f.label}
                    </dt>
                    <dd style={{ margin: 0, fontSize: '14px', lineHeight: 1.5, color: '#0A0A0A', whiteSpace: 'pre-wrap' }}>
                      {displayValue(profile[f.key], f.kind)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </Card>
        )
      })}
    </div>
  )
}

function displayValue(v: unknown, kind: IntakeField['kind']): string {
  if (v === null || v === undefined || String(v).trim() === '') return '—'
  if (kind === 'money') return `$${Number(v).toLocaleString('en-US')}`
  if (kind === 'date') return formatDay(String(v))
  return String(v)
}

function SectionForm({
  profile,
  fields,
  onCancel,
  onSaved,
}: {
  profile: ObrProfile
  fields: IntakeField[]
  onCancel: () => void
  onSaved: (p: ObrProfile) => void
}) {
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, profile[f.key] === null || profile[f.key] === undefined ? '' : String(profile[f.key])])),
  )
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function save() {
    setError(null)
    const patch: Record<string, string | number | null> = {}
    for (const f of fields) {
      const raw = (draft[f.key] ?? '').trim()
      if (f.key === 'display_name' && !raw) {
        setError('Organization name is required.')
        return
      }
      if (!raw) patch[f.key] = null
      else if (f.kind === 'int') {
        const n = Number.parseInt(raw, 10)
        if (Number.isNaN(n)) {
          setError(`${f.label} must be a whole number.`)
          return
        }
        patch[f.key] = n
      } else if (f.kind === 'money') {
        const n = Number(raw.replace(/[$,\s]/g, ''))
        if (Number.isNaN(n)) {
          setError(`${f.label} must be a number.`)
          return
        }
        patch[f.key] = n
      } else patch[f.key] = raw
    }
    startTransition(async () => {
      const supabase = createBrowserClient()
      const { data, error: err } = await supabase.from('vs_obr_profiles').update(patch).eq('id', profile.id).select('*').single()
      if (err || !data) {
        setError(err?.message ?? 'Could not save.')
        return
      }
      onSaved(data as unknown as ObrProfile)
    })
  }

  return (
    <div>
      <Row>
        {fields
          .filter((f) => f.kind !== 'long')
          .map((f) => (
            <Field key={f.key} label={f.label}>
              <input
                type={f.kind === 'date' ? 'date' : f.kind === 'email' ? 'email' : 'text'}
                inputMode={f.kind === 'int' || f.kind === 'money' ? 'numeric' : undefined}
                value={draft[f.key] ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                style={inputStyle}
              />
            </Field>
          ))}
      </Row>
      {fields
        .filter((f) => f.kind === 'long')
        .map((f) => (
          <Field key={f.key} label={f.label}>
            <textarea value={draft[f.key] ?? ''} onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))} style={textareaStyle} />
          </Field>
        ))}
      {error && <p style={{ color: '#CE1126', fontSize: '13px' }}>{error}</p>}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} disabled={pending} style={secondaryBtn(pending)}>
          Cancel
        </button>
        <button type="button" onClick={save} disabled={pending} style={primaryBtn(pending)}>
          {pending ? 'Saving…' : 'Save section'}
        </button>
      </div>
    </div>
  )
}

// ─── Evidence ───────────────────────────────────────────────────────────────

function EvidenceTab({
  profileId,
  evidence,
  documents,
  canEdit,
  operatorName,
  onChange,
}: {
  profileId: string
  evidence: ObrEvidence[]
  documents: DocumentOption[]
  canEdit: boolean
  operatorName: string
  onChange: (rows: ObrEvidence[]) => void
}) {
  const [editing, setEditing] = useState<EvidenceKey | null>(null)
  const byKey = useMemo(() => new Map(evidence.map((e) => [e.item_key, e])), [evidence])
  const docTitle = useMemo(() => new Map(documents.map((d) => [d.id, d.title])), [documents])

  return (
    <div>
      <p style={{ fontSize: '14px', color: 'rgba(10, 10, 10, 0.65)', margin: '0 0 16px', lineHeight: 1.55, maxWidth: '680px' }}>
        Mark each document as on file once it is in the Document Library, and as verified once
        someone has checked it. Only attest to what you have seen yourself.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {EVIDENCE_ITEMS.map((item) => {
          const row = byKey.get(item.key)
          const status: EvidenceStatus = row?.status ?? 'missing'
          const tone = status === 'verified' ? TONES.green : status === 'on_file' ? TONES.purple : TONES.grey
          return (
            <Card key={item.key} style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ minWidth: 0, flex: '1 1 260px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 600 }}>{item.label}</span>
                    <Pill {...tone}>{EVIDENCE_STATUS_LABELS[status]}</Pill>
                  </div>
                  <Meta>
                    {row
                      ? [
                          row.document_id ? `Document: ${docTitle.get(row.document_id) ?? 'linked'}` : null,
                          row.source ? `Source: ${row.source}` : null,
                          `${row.attested_by_name ?? 'Staff'} · ${formatDay(row.attested_at)}`,
                        ]
                          .filter(Boolean)
                          .join(' · ')
                      : item.hint}
                  </Meta>
                  {row?.notes && <p style={{ fontSize: '13px', margin: '6px 0 0', color: 'rgba(10, 10, 10, 0.7)' }}>{row.notes}</p>}
                </div>
                {canEdit && (
                  <button type="button" onClick={() => setEditing(item.key)} style={miniBtn()}>
                    {row ? 'Update' : 'Record'}
                  </button>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {editing && (
        <EvidenceModal
          profileId={profileId}
          itemKey={editing}
          existing={byKey.get(editing) ?? null}
          documents={documents}
          operatorName={operatorName}
          onClose={() => setEditing(null)}
          onSaved={(row) => {
            const others = evidence.filter((e) => e.item_key !== row.item_key)
            onChange([...others, row])
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function EvidenceModal({
  profileId,
  itemKey,
  existing,
  documents,
  operatorName,
  onClose,
  onSaved,
}: {
  profileId: string
  itemKey: EvidenceKey
  existing: ObrEvidence | null
  documents: DocumentOption[]
  operatorName: string
  onClose: () => void
  onSaved: (row: ObrEvidence) => void
}) {
  const item = EVIDENCE_ITEMS.find((i) => i.key === itemKey)!
  const [status, setStatus] = useState<EvidenceStatus>(existing?.status ?? 'on_file')
  const [documentId, setDocumentId] = useState(existing?.document_id ?? '')
  const [source, setSource] = useState(existing?.source ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function save() {
    setError(null)
    startTransition(async () => {
      const supabase = createBrowserClient()
      const row = {
        profile_id: profileId,
        item_key: itemKey,
        label: item.label,
        status,
        document_id: documentId || null,
        source: source.trim() || null,
        notes: notes.trim() || null,
        attested_by_name: operatorName,
        attested_at: new Date().toISOString(),
      }
      const { data, error: err } = await supabase
        .from('vs_obr_evidence')
        .upsert(row, { onConflict: 'profile_id,item_key' })
        .select('id, profile_id, item_key, label, status, document_id, source, notes, attested_by_name, attested_at, updated_at')
        .single()
      if (err || !data) {
        setError(err?.message ?? 'Could not save.')
        return
      }
      onSaved(data as unknown as ObrEvidence)
    })
  }

  return (
    <Modal title={item.label} subtitle={item.hint} onClose={onClose}>
      <Field label="Status">
        <select value={status} onChange={(e) => setStatus(e.target.value as EvidenceStatus)} style={inputStyle}>
          {(Object.keys(EVIDENCE_STATUS_LABELS) as EvidenceStatus[]).map((s) => (
            <option key={s} value={s}>
              {EVIDENCE_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Document in the library" hint="Upload it under Documents first if it is not listed.">
        <select value={documentId} onChange={(e) => setDocumentId(e.target.value)} style={inputStyle}>
          <option value="">— None linked —</option>
          {documents.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title}
              {d.document_date ? ` (${formatDay(d.document_date)})` : ''}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Source" hint="Where it came from, e.g. board binder, accountant, shared drive.">
        <input value={source} onChange={(e) => setSource(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Notes">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={textareaStyle} />
      </Field>
      <Meta>Attested by {operatorName} · {formatDay(todayIso())}</Meta>
      {error && <p style={{ color: '#CE1126', fontSize: '13px' }}>{error}</p>}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
        <button type="button" onClick={onClose} disabled={pending} style={secondaryBtn(pending)}>
          Cancel
        </button>
        <button type="button" onClick={save} disabled={pending} style={primaryBtn(pending)}>
          {pending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Modal>
  )
}

// ─── Ratings ────────────────────────────────────────────────────────────────

function RatingsTab({
  profileId,
  ratings,
  canEdit,
  operatorName,
  onRecorded,
}: {
  profileId: string
  ratings: ObrRating[]
  canEdit: boolean
  operatorName: string
  onRecorded: (r: ObrRating) => void
}) {
  const [adding, setAdding] = useState(false)
  return (
    <div>
      <Notice tone="navy">
        Ratings are issued by a certified evaluator against the BRSA OBR standard. Record each
        decision exactly as issued, with the standard version and rationale. Records cannot be
        edited or deleted; to correct one, record a new decision.
      </Notice>
      {canEdit && (
        <div style={{ marginBottom: '16px' }}>
          <button type="button" onClick={() => setAdding(true)} style={primaryBtn()}>
            + Record evaluator decision
          </button>
        </div>
      )}
      {ratings.length === 0 ? (
        <EmptyState title="No rating yet">The evaluator&apos;s decision appears here once it is recorded.</EmptyState>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {ratings.map((r, i) => (
            <Card key={r.id}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '17px', fontWeight: 600, fontFamily: SERIF }}>
                  {r.rating_label || CERTIFICATION_LABELS[r.certification_status]}
                </span>
                <Pill {...(r.certification_status === 'certified' ? TONES.green : r.certification_status === 'in_review' ? TONES.purple : TONES.grey)}>
                  {CERTIFICATION_LABELS[r.certification_status]}
                </Pill>
                {i === 0 && <Pill {...TONES.navy}>Current</Pill>}
                {r.is_override && <Pill {...TONES.amber}>Override</Pill>}
              </div>
              <Meta>
                Standard {r.standard_version}
                {r.ruleset_hash ? ` · Ruleset ${r.ruleset_hash.slice(0, 12)}` : ''}
                {r.evaluation_run_id ? ` · Run ${r.evaluation_run_id}` : ''} · Evaluator {r.evaluator_name} · Reviewed{' '}
                {formatDay(r.reviewed_on)}
                {r.expires_on ? ` · Expires ${formatDay(r.expires_on)}` : ''}
              </Meta>
              {(r.overall_score !== null || Object.keys(r.domain_scores ?? {}).length > 0) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', margin: '12px 0 0' }}>
                  {r.overall_score !== null && <ScoreChip label="Overall" value={r.overall_score} />}
                  {OBR_DOMAINS.filter((d) => r.domain_scores?.[d.key] !== undefined && r.domain_scores?.[d.key] !== null).map((d) => (
                    <ScoreChip key={d.key} label={d.label} value={r.domain_scores[d.key] as number} />
                  ))}
                </div>
              )}
              <p style={{ fontSize: '14px', lineHeight: 1.55, margin: '12px 0 0', whiteSpace: 'pre-wrap' }}>{r.rationale}</p>
              {r.evidence_reviewed && (
                <p style={{ fontSize: '13px', margin: '8px 0 0', color: 'rgba(10, 10, 10, 0.65)' }}>Evidence reviewed: {r.evidence_reviewed}</p>
              )}
              {r.is_override && r.override_reason && (
                <p style={{ fontSize: '13px', margin: '8px 0 0', color: '#7A5A00' }}>Override reason: {r.override_reason}</p>
              )}
              <div style={{ marginTop: '10px' }}>
                <Meta>
                  Recorded by {r.recorded_by_name ?? 'staff'} · {formatDay(r.created_at)}
                </Meta>
              </div>
            </Card>
          ))}
        </div>
      )}
      {adding && (
        <RatingModal
          profileId={profileId}
          operatorName={operatorName}
          onClose={() => setAdding(false)}
          onSaved={(r) => {
            onRecorded(r)
            setAdding(false)
          }}
        />
      )}
    </div>
  )
}

function ScoreChip({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(10, 10, 10, 0.5)', fontFamily: MONO }}>
        {label}
      </div>
      <div style={{ fontSize: '20px', fontWeight: 600, fontFamily: SERIF }}>{value}</div>
    </div>
  )
}

function RatingModal({
  profileId,
  operatorName,
  onClose,
  onSaved,
}: {
  profileId: string
  operatorName: string
  onClose: () => void
  onSaved: (r: ObrRating) => void
}) {
  const router = useRouter()
  const [f, setF] = useState({
    certification_status: 'in_review' as CertificationStatus,
    rating_label: '',
    overall_score: '',
    standard_version: '',
    ruleset_hash: '',
    evaluation_run_id: '',
    evaluator_name: '',
    reviewed_on: todayIso(),
    expires_on: '',
    evidence_reviewed: '',
    rationale: '',
    is_override: false,
    override_reason: '',
  })
  const [domains, setDomains] = useState<Record<string, string>>({})
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }))

  function save() {
    setError(null)
    if (!f.standard_version.trim()) return setError('Standard version is required.')
    if (!f.evaluator_name.trim()) return setError('Evaluator name is required.')
    if (!f.rationale.trim()) return setError('Rationale is required.')
    if (f.is_override && !f.override_reason.trim()) return setError('Give the reason for the override.')
    const num = (s: string) => (s.trim() === '' ? null : Number(s))
    const overall = num(f.overall_score)
    if (overall !== null && Number.isNaN(overall)) return setError('Overall score must be a number.')
    const domainScores: Record<string, number> = {}
    for (const d of OBR_DOMAINS) {
      const v = num(domains[d.key] ?? '')
      if (v === null) continue
      if (Number.isNaN(v)) return setError(`${d.label} score must be a number.`)
      domainScores[d.key] = v
    }
    startTransition(async () => {
      const supabase = createBrowserClient()
      const { data, error: err } = await supabase
        .from('vs_obr_ratings')
        .insert({
          profile_id: profileId,
          certification_status: f.certification_status,
          rating_label: f.rating_label.trim() || null,
          overall_score: overall,
          domain_scores: domainScores,
          standard_version: f.standard_version.trim(),
          ruleset_hash: f.ruleset_hash.trim() || null,
          evaluation_run_id: f.evaluation_run_id.trim() || null,
          evaluator_name: f.evaluator_name.trim(),
          reviewed_on: f.reviewed_on || todayIso(),
          expires_on: f.expires_on || null,
          evidence_reviewed: f.evidence_reviewed.trim() || null,
          rationale: f.rationale.trim(),
          is_override: f.is_override,
          override_reason: f.is_override ? f.override_reason.trim() : null,
          recorded_by_name: operatorName,
        })
        .select('*')
        .single()
      if (err || !data) {
        setError(err?.message ?? 'Could not record the decision.')
        return
      }
      onSaved(data as unknown as ObrRating)
      router.refresh()
    })
  }

  return (
    <Modal title="Record evaluator decision" subtitle="Enter it exactly as the certified evaluator issued it." onClose={onClose} maxWidth="720px">
      <Row>
        <Field label="Certification status">
          <select value={f.certification_status} onChange={(e) => set('certification_status', e.target.value as CertificationStatus)} style={inputStyle}>
            {(Object.keys(CERTIFICATION_LABELS) as CertificationStatus[]).map((s) => (
              <option key={s} value={s}>
                {CERTIFICATION_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Rating (as issued)">
          <input value={f.rating_label} onChange={(e) => set('rating_label', e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Overall score">
          <input inputMode="decimal" value={f.overall_score} onChange={(e) => set('overall_score', e.target.value)} style={inputStyle} />
        </Field>
      </Row>
      <Row>
        {OBR_DOMAINS.map((d) => (
          <Field key={d.key} label={d.label}>
            <input inputMode="decimal" value={domains[d.key] ?? ''} onChange={(e) => setDomains((p) => ({ ...p, [d.key]: e.target.value }))} style={inputStyle} />
          </Field>
        ))}
      </Row>
      <Row>
        <Field label="Standard version *">
          <input value={f.standard_version} onChange={(e) => set('standard_version', e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Ruleset hash">
          <input value={f.ruleset_hash} onChange={(e) => set('ruleset_hash', e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Evaluation run ID">
          <input value={f.evaluation_run_id} onChange={(e) => set('evaluation_run_id', e.target.value)} style={inputStyle} />
        </Field>
      </Row>
      <Row>
        <Field label="Certified evaluator *">
          <input value={f.evaluator_name} onChange={(e) => set('evaluator_name', e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Reviewed on">
          <input type="date" value={f.reviewed_on} onChange={(e) => set('reviewed_on', e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Expires on">
          <input type="date" value={f.expires_on} onChange={(e) => set('expires_on', e.target.value)} style={inputStyle} />
        </Field>
      </Row>
      <Field label="Evidence reviewed">
        <textarea value={f.evidence_reviewed} onChange={(e) => set('evidence_reviewed', e.target.value)} style={textareaStyle} />
      </Field>
      <Field label="Rationale *">
        <textarea value={f.rationale} onChange={(e) => set('rationale', e.target.value)} style={textareaStyle} />
      </Field>
      <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px', marginBottom: '12px' }}>
        <input type="checkbox" checked={f.is_override} onChange={(e) => set('is_override', e.target.checked)} />
        The evaluator overrode the suggested result
      </label>
      {f.is_override && (
        <Field label="Override reason *">
          <textarea value={f.override_reason} onChange={(e) => set('override_reason', e.target.value)} style={textareaStyle} />
        </Field>
      )}
      {error && <p style={{ color: '#CE1126', fontSize: '13px' }}>{error}</p>}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button type="button" onClick={onClose} disabled={pending} style={secondaryBtn(pending)}>
          Cancel
        </button>
        <button type="button" onClick={save} disabled={pending} style={primaryBtn(pending)}>
          {pending ? 'Recording…' : 'Record decision'}
        </button>
      </div>
    </Modal>
  )
}
