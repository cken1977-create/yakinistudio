'use client'

// VIZIONZ SANKOFA · /admin/participants/[id] · AssessmentsTab
//
// Six-domain readiness assessments timeline. Each row = one assessment
// with composite score + 6 domain scores. Wave 3 baseline instrument
// "VS Six-Domain Readiness v1.0". Upgrades to VS Sankofa Family Readiness
// Index in Wave 3.5/4.

import { useMemo, useState, useTransition } from 'react'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type {
  AssessmentWithScores,
  AssessmentInterval,
  AssessmentDomain,
  DomainScoreInput,
} from './types'
import {
  ASSESSMENT_DOMAINS,
  ASSESSMENT_INTERVAL_LABELS,
  LIKERT_LABELS,
  LIKERT_COLORS,
  VS_BASELINE_INSTRUMENT_NAME,
  VS_BASELINE_INSTRUMENT_VERSION,
  computeComposite,
} from './types'
import type { StaffRecord } from '../types'

export function AssessmentsTab({
  participantId,
  initialAssessments,
  staff,
  defaultAdministrator,
}: {
  participantId: string
  initialAssessments: AssessmentWithScores[]
  staff: StaffRecord[]
  defaultAdministrator: string | null
}) {
  const [assessments, setAssessments] =
    useState<AssessmentWithScores[]>(initialAssessments)
  const [adding, setAdding] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Compute trajectory: did composite improve from baseline → most recent?
  const sortedByDate = useMemo(
    () =>
      [...assessments].sort((a, b) => a.assessed_at.localeCompare(b.assessed_at)),
    [assessments],
  )
  const baseline = sortedByDate[0]
  const mostRecent = sortedByDate[sortedByDate.length - 1]
  const baselineScore = baseline?.composite_score
    ? Number(baseline.composite_score)
    : null
  const recentScore = mostRecent?.composite_score
    ? Number(mostRecent.composite_score)
    : null
  const trajectory =
    baselineScore !== null && recentScore !== null && assessments.length > 1
      ? recentScore - baselineScore
      : null

  return (
    <div>
      {/* Rollup strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1px',
          background: 'rgba(10, 10, 10, 0.08)',
          border: '1px solid rgba(10, 10, 10, 0.08)',
          marginBottom: '28px',
        }}
      >
        <AssessStat label="Assessments" value={assessments.length.toString()} />
        <AssessStat
          label="Baseline"
          value={baselineScore !== null ? baselineScore.toFixed(2) : '—'}
          accent="#5B2C8F"
        />
        <AssessStat
          label="Most Recent"
          value={recentScore !== null ? recentScore.toFixed(2) : '—'}
          accent="#0A0A0A"
        />
        <AssessStat
          label="Change"
          value={
            trajectory !== null
              ? `${trajectory > 0 ? '+' : ''}${trajectory.toFixed(2)}`
              : '—'
          }
          accent={
            trajectory === null
              ? '#0A0A0A'
              : trajectory > 0
                ? '#007A33'
                : trajectory < 0
                  ? '#CE1126'
                  : '#5B2C8F'
          }
        />
      </div>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(10, 10, 10, 0.55)',
              marginBottom: '4px',
              fontFamily:
                'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
            }}
          >
            Readiness Over Time
          </div>
          <div
            style={{
              fontSize: '14px',
              color: 'rgba(10, 10, 10, 0.65)',
            }}
          >
            Six domains, 1–5 scale. Composite = average across all six.
          </div>
        </div>
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
          + Add Assessment
        </button>
      </div>

      {/* Timeline */}
      {assessments.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {[...assessments]
            .sort((a, b) => b.assessed_at.localeCompare(a.assessed_at))
            .map((a) => (
              <AssessmentRow
                key={a.id}
                assessment={a}
                expanded={expandedId === a.id}
                onToggle={() =>
                  setExpandedId(expandedId === a.id ? null : a.id)
                }
              />
            ))}
        </div>
      )}

      {/* Add modal */}
      {adding && (
        <AddAssessmentModal
          participantId={participantId}
          staff={staff}
          defaultAdministrator={defaultAdministrator}
          onClose={() => setAdding(false)}
          onSaved={(newAssessment) => {
            setAssessments((prev) => [newAssessment, ...prev])
            setAdding(false)
          }}
        />
      )}
    </div>
  )
}

function AssessStat({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: string
}) {
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
          fontSize: '20px',
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

function AssessmentRow({
  assessment,
  expanded,
  onToggle,
}: {
  assessment: AssessmentWithScores
  expanded: boolean
  onToggle: () => void
}) {
  const composite = assessment.composite_score
    ? Number(assessment.composite_score)
    : null
  const compositeColor =
    composite !== null
      ? LIKERT_COLORS[Math.max(1, Math.min(5, Math.round(composite)))]
      : 'rgba(10, 10, 10, 0.55)'

  return (
    <article
      style={{
        border: '1px solid rgba(10, 10, 10, 0.1)',
        borderLeft: `4px solid ${compositeColor}`,
        borderRadius: '6px',
        background: '#FFFFFF',
        overflow: 'hidden',
      }}
    >
      {/* Collapsed header — always visible */}
      <button
        onClick={onToggle}
        style={{
          display: 'block',
          width: '100%',
          padding: '16px 20px',
          border: 'none',
          background: 'transparent',
          textAlign: 'left',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              padding: '3px 8px',
              borderRadius: '4px',
              background: 'rgba(91, 44, 143, 0.12)',
              color: '#5B2C8F',
              fontFamily:
                'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
            }}
          >
            {ASSESSMENT_INTERVAL_LABELS[assessment.interval]}
          </span>
          <span
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#0A0A0A',
            }}
          >
            {formatDate(assessment.assessed_at)}
          </span>
          {composite !== null && (
            <span
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: compositeColor,
                fontFamily: '"DM Serif Display", Georgia, serif',
              }}
            >
              {composite.toFixed(2)}
            </span>
          )}
          {assessment.administered_by_name && (
            <span
              style={{
                fontSize: '12px',
                color: 'rgba(10, 10, 10, 0.55)',
                fontFamily:
                  'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
                marginLeft: 'auto',
              }}
            >
              {assessment.administered_by_name}
            </span>
          )}
          <span
            style={{
              fontSize: '12px',
              color: 'rgba(10, 10, 10, 0.5)',
              fontFamily:
                'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
            }}
          >
            {expanded ? '▼' : '▶'}
          </span>
        </div>
      </button>

      {/* Expanded — 6 domain scores */}
      {expanded && (
        <div
          style={{
            padding: '0 20px 20px',
            borderTop: '1px solid rgba(10, 10, 10, 0.08)',
            marginTop: '4px',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
              marginTop: '16px',
            }}
          >
            {ASSESSMENT_DOMAINS.map((domain) => {
              const scoreRow = assessment.scores.find(
                (s) => s.domain === domain,
              )
              const score = scoreRow ? Number(scoreRow.score) : null
              return (
                <DomainScoreCard
                  key={domain}
                  domain={domain}
                  score={score}
                  notes={scoreRow?.notes ?? null}
                />
              )
            })}
          </div>
          {assessment.instrument_name && (
            <div
              style={{
                marginTop: '14px',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'rgba(10, 10, 10, 0.4)',
                fontFamily:
                  'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
              }}
            >
              {assessment.instrument_name}
              {assessment.instrument_version &&
                ` · v${assessment.instrument_version}`}
            </div>
          )}
        </div>
      )}
    </article>
  )
}

function DomainScoreCard({
  domain,
  score,
  notes,
}: {
  domain: AssessmentDomain
  score: number | null
  notes: string | null
}) {
  const color = score !== null ? LIKERT_COLORS[Math.round(score)] : '#999'
  const label = score !== null ? LIKERT_LABELS[Math.round(score)] : '—'

  return (
    <div
      style={{
        padding: '12px 14px',
        border: '1px solid rgba(10, 10, 10, 0.08)',
        borderRadius: '6px',
        background: '#FAFAF8',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgba(10, 10, 10, 0.55)',
          marginBottom: '6px',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        }}
      >
        {domain}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '8px',
          marginBottom: notes ? '6px' : 0,
        }}
      >
        <span
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color,
            fontFamily: '"DM Serif Display", Georgia, serif',
          }}
        >
          {score !== null ? score : '—'}
        </span>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color,
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          }}
        >
          {label}
        </span>
      </div>
      {notes && (
        <div
          style={{
            fontSize: '12px',
            lineHeight: 1.5,
            color: 'rgba(10, 10, 10, 0.7)',
          }}
        >
          {notes}
        </div>
      )}
    </div>
  )
}

function EmptyState() {
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
        No assessments yet. Click + Add Assessment to record the baseline.
      </div>
    </div>
  )
}

function AddAssessmentModal({
  participantId,
  staff,
  defaultAdministrator,
  onClose,
  onSaved,
}: {
  participantId: string
  staff: StaffRecord[]
  defaultAdministrator: string | null
  onClose: () => void
  onSaved: (assessment: AssessmentWithScores) => void
}) {
  const today = new Date().toISOString().slice(0, 10)

  const [assessedAt, setAssessedAt] = useState(today)
  const [interval, setInterval] = useState<AssessmentInterval>('baseline')
  const [administratorId, setAdministratorId] = useState<string>(
    defaultAdministrator ?? '',
  )
  const [domainScores, setDomainScores] = useState<DomainScoreInput[]>(
    ASSESSMENT_DOMAINS.map((d) => ({ domain: d, score: 3, notes: null })),
  )
  const [pending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const composite = useMemo(
    () => computeComposite(domainScores),
    [domainScores],
  )

  function updateScore(domain: AssessmentDomain, score: number) {
    setDomainScores((prev) =>
      prev.map((d) => (d.domain === domain ? { ...d, score } : d)),
    )
  }

  function updateNotes(domain: AssessmentDomain, notes: string) {
    setDomainScores((prev) =>
      prev.map((d) =>
        d.domain === domain ? { ...d, notes: notes || null } : d,
      ),
    )
  }

  function save() {
    setErrorMsg(null)
    startTransition(async () => {
      const supabase = createBrowserClient()

      // 1. Insert the assessment row
      const assessmentPayload = {
        participant_id: participantId,
        administered_by_id: administratorId || null,
        assessed_at: assessedAt,
        interval,
        instrument_name: VS_BASELINE_INSTRUMENT_NAME,
        instrument_version: VS_BASELINE_INSTRUMENT_VERSION,
        composite_score: composite,
      }

      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .insert(assessmentPayload)
        .select()
        .single()

      if (assessmentError || !assessmentData) {
        setErrorMsg(
          `Failed to save assessment: ${assessmentError?.message ?? 'unknown'}`,
        )
        return
      }

      const assessmentId = (assessmentData as { id: string }).id

      // 2. Insert 6 domain score rows
      const scoreRows = domainScores.map((d) => ({
        assessment_id: assessmentId,
        domain: d.domain,
        score: d.score,
        notes: d.notes,
      }))

      const { data: scoresData, error: scoresError } = await supabase
        .from('assessment_scores')
        .insert(scoreRows)
        .select()

      if (scoresError) {
        // Best-effort: try to roll back the assessment row
        await supabase.from('assessments').delete().eq('id', assessmentId)
        setErrorMsg(`Failed to save domain scores: ${scoresError.message}`)
        return
      }

      // 3. Decorate and return
      const adminStaff = staff.find((s) => s.id === administratorId)
      const decorated: AssessmentWithScores = {
        ...(assessmentData as unknown as AssessmentWithScores),
        administered_by_name: adminStaff?.full_name ?? null,
        scores: (scoresData ?? []) as unknown as AssessmentWithScores['scores'],
      }
      onSaved(decorated)
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
          maxWidth: '720px',
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
          Add Assessment
        </h2>
        <p
          style={{
            fontSize: '13px',
            color: 'rgba(10, 10, 10, 0.6)',
            marginBottom: '24px',
          }}
        >
          {VS_BASELINE_INSTRUMENT_NAME} v{VS_BASELINE_INSTRUMENT_VERSION} ·
          Six domains, 1–5 scale.
        </p>

        <Row>
          <Field label="When *">
            <input
              type="date"
              value={assessedAt}
              onChange={(e) => setAssessedAt(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Interval *">
            <select
              value={interval}
              onChange={(e) =>
                setInterval(e.target.value as AssessmentInterval)
              }
              style={inputStyle}
            >
              {(
                Object.keys(ASSESSMENT_INTERVAL_LABELS) as AssessmentInterval[]
              ).map((i) => (
                <option key={i} value={i}>
                  {ASSESSMENT_INTERVAL_LABELS[i]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Administered By">
            <select
              value={administratorId}
              onChange={(e) => setAdministratorId(e.target.value)}
              style={inputStyle}
            >
              <option value="">— Unassigned —</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}
                  {s.role ? ` (${s.role})` : ''}
                </option>
              ))}
            </select>
          </Field>
        </Row>

        {/* Composite preview */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '12px',
            padding: '16px 20px',
            background: 'rgba(91, 44, 143, 0.06)',
            border: '1px solid rgba(91, 44, 143, 0.2)',
            borderRadius: '6px',
            marginBottom: '24px',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#5B2C8F',
              fontFamily:
                'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
            }}
          >
            Composite Score
          </span>
          <span
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: LIKERT_COLORS[Math.max(1, Math.min(5, Math.round(composite)))],
              fontFamily: '"DM Serif Display", Georgia, serif',
            }}
          >
            {composite.toFixed(2)}
          </span>
          <span
            style={{
              fontSize: '13px',
              color: 'rgba(10, 10, 10, 0.6)',
              marginLeft: 'auto',
            }}
          >
            Average of six domains, updates as you score.
          </span>
        </div>

        {/* 6 domain score inputs */}
        {ASSESSMENT_DOMAINS.map((domain) => {
          const current = domainScores.find((d) => d.domain === domain)!
          return (
            <DomainScoreInput
              key={domain}
              domain={domain}
              score={current.score}
              notes={current.notes ?? ''}
              onScoreChange={(s) => updateScore(domain, s)}
              onNotesChange={(n) => updateNotes(domain, n)}
            />
          )
        })}

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
          <button onClick={onClose} disabled={pending} style={cancelBtn(pending)}>
            Cancel
          </button>
          <button onClick={save} disabled={pending} style={saveBtn(pending)}>
            {pending ? 'Saving…' : 'Save Assessment'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DomainScoreInput({
  domain,
  score,
  notes,
  onScoreChange,
  onNotesChange,
}: {
  domain: AssessmentDomain
  score: number
  notes: string
  onScoreChange: (s: number) => void
  onNotesChange: (n: string) => void
}) {
  return (
    <div
      style={{
        padding: '16px 18px',
        border: '1px solid rgba(10, 10, 10, 0.12)',
        borderLeft: `4px solid ${LIKERT_COLORS[Math.round(score)]}`,
        borderRadius: '6px',
        background: '#FFFFFF',
        marginBottom: '12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#0A0A0A',
          }}
        >
          {domain}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '6px',
          }}
        >
          <span
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: LIKERT_COLORS[Math.round(score)],
              fontFamily: '"DM Serif Display", Georgia, serif',
            }}
          >
            {score}
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: LIKERT_COLORS[Math.round(score)],
              fontFamily:
                'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
            }}
          >
            {LIKERT_LABELS[Math.round(score)]}
          </span>
        </div>
      </div>

      {/* 5-button Likert */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '6px',
          marginBottom: '12px',
        }}
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const isSelected = score === n
          return (
            <button
              key={n}
              onClick={() => onScoreChange(n)}
              style={{
                padding: '8px 4px',
                border: isSelected
                  ? `2px solid ${LIKERT_COLORS[n]}`
                  : '1px solid rgba(10, 10, 10, 0.16)',
                background: isSelected ? `${LIKERT_COLORS[n]}1A` : '#FFFFFF',
                color: isSelected ? LIKERT_COLORS[n] : 'rgba(10, 10, 10, 0.7)',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              <span style={{ fontSize: '15px', fontWeight: 700 }}>{n}</span>
              <span
                style={{
                  fontSize: '9px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {LIKERT_LABELS[n]}
              </span>
            </button>
          )
        })}
      </div>

      <textarea
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        rows={2}
        placeholder={`Notes for ${domain.toLowerCase()} (optional)`}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid rgba(10, 10, 10, 0.12)',
          borderRadius: '4px',
          fontSize: '13px',
          color: '#0A0A0A',
          background: '#FAFAF8',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
        }}
      />
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

function formatDate(d: string | null): string {
  if (!d) return '—'
  try {
    const date = new Date(d + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return d
  }
}
