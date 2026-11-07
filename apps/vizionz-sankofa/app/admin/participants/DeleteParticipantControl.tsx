'use client'

import { useRef, useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import {
  previewParticipantRemoval,
  removeParticipant,
  restoreParticipant,
} from '../actions/participants'
import {
  REMOVAL_SEMANTICS,
  blockerHref,
  blockersFromCounts,
  initialRemoval,
  legalName,
  nameConfirmed,
  participantDisplayName,
  preservedFromCounts,
  removalReducer,
  removalStatusText,
  type RemovalBlocker,
  type RemovalView,
} from '@/lib/participants/removal'
import { UploadStatus } from '@/components/admin/UploadStatus'

type Person = {
  id: string
  first_name: string
  last_name: string
  preferred_name?: string | null
  deleted_at?: string | null
}

export function DeleteParticipantControl({
  participant,
  canDelete,
  onChanged,
}: {
  participant: Person
  canDelete: boolean
  onChanged?: (message: string) => void
}) {
  const router = useRouter()
  const viewRef = useRef<RemovalView>(initialRemoval())
  const [view, setView] = useState<RemovalView>(initialRemoval())
  const [typed, setTyped] = useState('')
  const [reason, setReason] = useState('')
  const [restoreBusy, setRestoreBusy] = useState(false)
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null)
  const name = participantDisplayName(participant)
  const expected = legalName(participant)

  if (!canDelete) return null

  function commit(event: Parameters<typeof removalReducer>[1]) {
    viewRef.current = removalReducer(viewRef.current, event)
    setView(viewRef.current)
    return viewRef.current
  }

  async function loadPreview() {
    const result = await previewParticipantRemoval(participant.id)
    if (!result.ok) {
      commit({ type: 'preview_failed', message: result.error })
      return
    }
    commit({ type: 'preview', preview: result.preview })
  }

  async function open() {
    if (viewRef.current.phase === 'loading' || viewRef.current.phase === 'submitting') return
    setTyped('')
    setReason('')
    commit({ type: 'open' })
    await loadPreview()
  }

  async function confirm() {
    const next = commit({ type: 'confirm', typedName: typed })
    if (next.phase !== 'submitting') return
    const expectedUpdatedAt = next.preview?.participant?.updated_at
    if (!expectedUpdatedAt) {
      commit({
        type: 'result',
        preview: { ok: false, code: 'conflict', semantics: 'reversible_roster_removal', error: 'This participant could not be confirmed. Nothing was changed.' },
      })
      return
    }
    const result = await removeParticipant(participant.id, expectedUpdatedAt, reason)
    if (!result.ok) {
      commit({
        type: 'result',
        preview: { ok: false, code: 'conflict', semantics: 'reversible_roster_removal', error: result.error },
      })
      return
    }
    const done = commit({ type: 'result', preview: result.preview })
    if (done.phase === 'success' && done.message) {
      onChanged?.(done.message)
      router.refresh()
    }
  }

  async function restore() {
    if (restoreBusy) return
    setRestoreBusy(true)
    setRestoreMessage(`Restoring ${name} to the active roster…`)
    const result = await restoreParticipant(participant.id)
    setRestoreBusy(false)
    if (!result.ok) {
      setRestoreMessage(result.error)
      return
    }
    const message = `${name} is back on the active roster. Their history was kept.`
    setRestoreMessage(message)
    onChanged?.(message)
    router.refresh()
  }

  const blockers = blockersFromCounts(view.preview?.counts)
  const preserved = preservedFromCounts(view.preview?.counts)
  const duplicates = view.preview?.possible_duplicates ?? []
  const already = view.preview?.code === 'already_removed'
  const status = removalStatusText(view, name)
  const active = view.phase === 'loading' || view.phase === 'submitting' || restoreBusy

  return (
    <>
      {participant.deleted_at ? (
        <button type="button" data-testid="restore-participant" onClick={() => void restore()} disabled={restoreBusy} style={quietBtn(restoreBusy)}>
          {restoreBusy ? 'Restoring…' : 'Restore participant'}
        </button>
      ) : (
        <button type="button" data-testid="delete-participant" onClick={() => void open()} style={quietBtn(false)}>
          Delete participant
        </button>
      )}
      {restoreMessage && (
        <p role="status" style={{ flexBasis: '100%', margin: 0, fontSize: '13px', color: '#0A0A0A' }}>{restoreMessage}</p>
      )}
      {view.phase !== 'closed' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-participant-title"
          data-testid="delete-participant-dialog"
          onClick={() => { if (view.phase !== 'submitting' && view.phase !== 'loading') commit({ type: 'cancel' }) }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(10, 10, 10, 0.45)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            padding: '32px 16px', zIndex: 80, overflowY: 'auto',
          }}
        >
          <div onClick={(event) => event.stopPropagation()} style={{ width: '100%', maxWidth: '560px', background: '#FFFFFF', borderRadius: '12px', padding: '28px 24px', boxShadow: '0 24px 64px rgba(10, 10, 10, 0.25)' }}>
            <h2 id="delete-participant-title" style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: '26px', margin: '0 0 8px' }}>
              Delete participant
            </h2>
            <UploadStatus text={status} active={active} percent={null} />
            {view.phase !== 'loading' && view.phase !== 'success' && (
              <>
                <p style={{ fontSize: '15px', lineHeight: 1.5, marginTop: 0 }}>
                  This removes <strong>{name}</strong> from the active roster.
                </p>
                <p style={{ fontSize: '14px', lineHeight: 1.55, color: 'rgba(10,10,10,0.75)' }}>{REMOVAL_SEMANTICS}</p>
                {preserved.length > 0 && (
                  <ul style={{ fontSize: '14px', lineHeight: 1.5 }}>
                    {preserved.map((row) => <li key={row.key}>{row.count} {row.label.toLowerCase()} will stay on the record.</li>)}
                  </ul>
                )}
                {duplicates.length > 0 && (
                  <p style={{ fontSize: '14px', lineHeight: 1.5 }}>
                    Other roster records share this name, email, or phone: {duplicates.map((row) => `${row.name}${row.removed ? ' (already removed)' : ''}`).join(', ')}.
                    This action removes only {name}. It does not merge or remove the others.
                  </p>
                )}
                {blockers.length > 0 && (
                  <div role="alert" style={{ background: 'rgba(206, 17, 38, 0.08)', padding: '12px 14px', borderRadius: '8px', fontSize: '14px' }}>
                    <strong>{name} cannot be removed yet.</strong>
                    <ul>{blockers.map((row) => <li key={row.key}>{row.count} {row.label}</li>)}</ul>
                    <BlockerLinks participantId={participant.id} blockers={view.preview?.blockers ?? []} onGo={() => commit({ type: 'cancel' })} />
                  </div>
                )}
                {!already && blockers.length === 0 && view.phase !== 'error' && (
                  <>
                    <label style={{ display: 'block', fontSize: '13px', margin: '12px 0 6px' }}>
                      Type {expected} to confirm
                      <input value={typed} onChange={(event) => setTyped(event.target.value)} autoComplete="off" style={fieldStyle} />
                    </label>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '12px' }}>
                      Note (optional, stored with the audit record)
                      <input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} style={fieldStyle} />
                    </label>
                  </>
                )}
                {view.phase === 'error' && <p role="alert" style={{ color: '#CE1126' }}>{view.message}</p>}
              </>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => commit({ type: 'cancel' })} disabled={view.phase === 'submitting' || view.phase === 'loading'} style={quietBtn(false)}>
                {view.phase === 'success' ? 'Close' : 'Cancel'}
              </button>
              {view.phase === 'error' && (
                <button type="button" onClick={() => { commit({ type: 'retry' }); void loadPreview() }} style={primaryBtn(false)}>Try again</button>
              )}
              {already && view.phase === 'confirm' && (
                <button type="button" onClick={() => void restore()} disabled={restoreBusy} style={primaryBtn(restoreBusy)}>Restore {expected}</button>
              )}
              {!already && blockers.length === 0 && (view.phase === 'confirm' || view.phase === 'submitting') && (
                <button
                  type="button"
                  data-testid="confirm-delete-participant"
                  onClick={() => void confirm()}
                  disabled={!nameConfirmed(typed, expected) || view.phase === 'submitting'}
                  style={primaryBtn(view.phase === 'submitting' || !nameConfirmed(typed, expected))}
                >
                  {view.phase === 'submitting' ? 'Removing…' : `Remove ${expected} from the roster`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function BlockerLinks({
  participantId,
  blockers,
  onGo,
}: {
  participantId: string
  blockers: RemovalBlocker[]
  onGo: () => void
}) {
  if (blockers.length === 0) {
    return <p style={{ marginBottom: 0 }}>Open Programs on this person’s page to complete or withdraw an enrollment. Open tasks stay open until someone finishes or cancels them.</p>
  }
  return (
    <ul style={{ marginBottom: 0 }}>
      {blockers.map((blocker) => (
        <li key={`${blocker.kind}-${blocker.id}`}>
          <a href={blockerHref(participantId, blocker)} onClick={onGo}>
            {blocker.kind === 'enrollment' ? `End enrollment: ${blocker.label}` : `Open task: ${blocker.label}`}
          </a>
          {blocker.kind === 'task' ? ' Finishing this task is separate. It was not closed.' : ' This does not remove the person.'}
        </li>
      ))}
    </ul>
  )
}

const fieldStyle: CSSProperties = {
  display: 'block', width: '100%', marginTop: '6px', padding: '10px 12px',
  border: '1px solid rgba(10,10,10,0.16)', borderRadius: '6px', font: 'inherit',
}

function quietBtn(disabled: boolean): CSSProperties {
  return {
    padding: '8px 14px', border: '1px solid #CE1126', background: '#FFFFFF', color: '#CE1126',
    borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: disabled ? 'wait' : 'pointer', fontFamily: 'inherit',
  }
}

function primaryBtn(disabled: boolean): CSSProperties {
  return {
    padding: '10px 16px', border: '1px solid #0A0A0A', background: disabled ? 'rgba(10,10,10,0.35)' : '#0A0A0A',
    color: '#FFFFFF', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
  }
}
