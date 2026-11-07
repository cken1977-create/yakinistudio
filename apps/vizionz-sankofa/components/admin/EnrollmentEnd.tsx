'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { endEnrollment } from '@/app/admin/actions/enrollments'
import {
  canSubmitEnrollmentEnd,
  enrollmentEndCopy,
  enrollmentIsOpen,
  type EnrollmentOutcome,
} from '@/lib/enrollments/end'

export type EnrollmentCard = {
  id: string
  status: string
  updatedAt: string
  enrolledAt: string
  completedAt: string | null
  withdrewAt: string | null
  withdrawalReason: string | null
  programName: string
  cohortName: string
  participantId: string
  participantName: string
}

export function EnrollmentEndButtons({
  enrollment,
  canEnd,
}: {
  enrollment: EnrollmentCard
  canEnd: boolean
}) {
  const [outcome, setOutcome] = useState<EnrollmentOutcome | null>(null)
  if (!canEnd || !enrollmentIsOpen(enrollment.status)) return null
  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <button type="button" onClick={() => setOutcome('completed')} style={quietBtn}>Complete</button>
        <button type="button" onClick={() => setOutcome('withdrew')} style={quietBtn}>Withdraw</button>
      </div>
      {outcome && (
        <EnrollmentEndDialog enrollment={enrollment} outcome={outcome} onClose={() => setOutcome(null)} />
      )}
    </>
  )
}

function EnrollmentEndDialog({
  enrollment,
  outcome,
  onClose,
}: {
  enrollment: EnrollmentCard
  outcome: EnrollmentOutcome
  onClose: () => void
}) {
  const router = useRouter()
  const program = [enrollment.programName, enrollment.cohortName].filter(Boolean).join(' · ')
  const copy = enrollmentEndCopy({ outcome, person: enrollment.participantName, program })
  const [reason, setReason] = useState('')
  const [phase, setPhase] = useState<'confirm' | 'saving' | 'error'>('confirm')
  const [message, setMessage] = useState<string | null>(null)
  const ready = canSubmitEnrollmentEnd(outcome, reason)

  async function confirm() {
    if (!ready || phase === 'saving') return
    setPhase('saving')
    setMessage(copy.pending)
    const result = await endEnrollment({
      enrollmentId: enrollment.id,
      participantId: enrollment.participantId,
      outcome,
      expectedUpdatedAt: enrollment.updatedAt,
      reason,
      person: enrollment.participantName,
      program,
    })
    if (!result.ok) {
      setPhase('error')
      setMessage(result.error)
      return
    }
    setMessage(result.message)
    router.refresh()
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="end-enrollment-title"
      data-testid="end-enrollment-dialog"
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,10,0.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 16px', zIndex: 90, overflowY: 'auto' }}
    >
      <div onClick={(event) => event.stopPropagation()} style={{ width: '100%', maxWidth: '520px', background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 24px 64px rgba(10,10,10,0.25)' }}>
        <h2 id="end-enrollment-title" style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: '24px', margin: '0 0 8px' }}>{copy.title}</h2>
        <p role="status" style={{ fontSize: '14px', lineHeight: 1.5 }}>{phase === 'confirm' ? copy.body : message}</p>
        {outcome === 'withdrew' && phase !== 'saving' && (
          <label style={{ display: 'block', fontSize: '13px', margin: '12px 0' }}>
            Reason
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} maxLength={500} style={{ display: 'block', width: '100%', marginTop: '6px', padding: '10px 12px', font: 'inherit' }} />
          </label>
        )}
        {phase === 'error' && <p role="alert" style={{ color: '#CE1126' }}>{message}</p>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} disabled={phase === 'saving'} style={quietBtn}>Cancel</button>
          <button type="button" data-testid="confirm-end-enrollment" onClick={() => void confirm()} disabled={!ready || phase === 'saving'} style={primaryBtn}>
            {phase === 'saving' ? copy.pending : copy.confirm}
          </button>
        </div>
      </div>
    </div>
  )
}

const quietBtn = {
  padding: '8px 12px', border: '1px solid rgba(10,10,10,0.18)', background: '#fff', borderRadius: '4px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
} as const
const primaryBtn = {
  padding: '8px 14px', border: 'none', background: '#0A2548', color: '#fff', borderRadius: '4px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
} as const

export function ParticipantPrograms({
  enrollments,
  canEnd,
}: {
  enrollments: EnrollmentCard[]
  canEnd: boolean
}) {
  return (
    <section id="participant-programs" data-testid="participant-programs" style={{ marginBottom: '28px' }}>
      <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(10,10,10,0.55)', marginBottom: '10px' }}>
        Programs · {enrollments.length}
      </div>
      {enrollments.length === 0 ? (
        <p style={{ fontSize: '14px', color: 'rgba(10,10,10,0.65)' }}>No program enrollments on this record.</p>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {enrollments.map((enrollment) => (
            <article id={`enrollment-${enrollment.id}`} key={enrollment.id} style={{ border: '1px solid rgba(10,10,10,0.1)', borderRadius: '6px', padding: '14px 16px', background: '#fff', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{[enrollment.programName, enrollment.cohortName].filter(Boolean).join(' · ') || 'Program'}</strong>
                <div style={{ fontSize: '12px', color: 'rgba(10,10,10,0.6)', marginTop: '4px' }}>
                  {enrollment.status} · enrolled {enrollment.enrolledAt}
                  {enrollment.completedAt ? ` · completed ${enrollment.completedAt}` : ''}
                  {enrollment.withdrewAt ? ` · withdrew ${enrollment.withdrewAt}` : ''}
                </div>
                {enrollment.withdrawalReason && <div style={{ fontSize: '13px', marginTop: '4px' }}>Reason: {enrollment.withdrawalReason}</div>}
              </div>
              <EnrollmentEndButtons enrollment={enrollment} canEnd={canEnd} />
            </article>
          ))}
        </div>
      )}
      <p style={{ fontSize: '13px', color: 'rgba(10,10,10,0.6)', marginTop: '8px' }}>
        Completing or withdrawing ends that program enrollment. It does not remove the person, and it does not close open tasks.
      </p>
    </section>
  )
}
