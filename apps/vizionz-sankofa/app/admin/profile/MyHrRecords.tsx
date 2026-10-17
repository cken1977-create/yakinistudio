'use client'

// My Profile · my job description and handbooks. Acknowledging and signing go
// through database functions that timestamp them against the version shown.

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Meta, Notice, Pill, SectionLabel, SERIF, TONES, inputStyle, miniBtn, primaryBtn } from '@/components/admin/ui'
import { createClient } from '@/lib/supabase/client'
import {
  ACK_LABELS, HANDBOOK_STATE_LABELS, HR_FILES_BUCKET, handbookState, jdAckState, lines,
  type Handbook, type HandbookAck, type HandbookVersion, type JdAssignment, type JobDescription,
} from '@/lib/hr/model'
import { acknowledgeJobDescription, markHandbookRead, signHandbook } from '../actions/hr'
import { formatMountain } from '../team/types'

export function MyHrRecords({ jd, assignment, handbooks, displayName }: {
  jd: JobDescription | null; assignment: JdAssignment | null
  handbooks: { handbook: Handbook; latest: HandbookVersion | null; ack: HandbookAck | undefined }[]
  displayName: string
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ tone: 'green' | 'red'; text: string } | null>(null)
  if (!jd && handbooks.length === 0) return null
  const st = jd && assignment ? jdAckState(assignment, jd.version) : null

  return (
    <section data-testid="my-hr" style={{ gridColumn: '1 / -1', display: 'grid', gap: '16px' }}>
      {msg && <div role="status"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
      {jd && assignment && st && (
        <Card>
          <div data-testid="my-jd">
            <SectionLabel right={<Pill fg={st === 'acknowledged' ? TONES.green.fg : TONES.amber.fg} bg={st === 'acknowledged' ? TONES.green.bg : TONES.amber.bg}>{ACK_LABELS[st]}</Pill>}>
              My job description
            </SectionLabel>
            <h3 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: '20px' }}>{jd.title}</h3>
            <Meta>Version {jd.version}{jd.reports_to ? ` · reports to ${jd.reports_to}` : ''}</Meta>
            {jd.summary && <p style={{ fontSize: '14px', lineHeight: 1.6, overflowWrap: 'anywhere' }}>{jd.summary}</p>}
            {lines(jd.duties).length > 0 && (<><div style={{ fontWeight: 600, fontSize: '14px', marginTop: '8px' }}>Duties</div>
              <ul style={{ margin: '4px 0 0', paddingLeft: '20px', fontSize: '14px', lineHeight: 1.6 }}>{lines(jd.duties).map((d, i) => <li key={i}>{d}</li>)}</ul></>)}
            {lines(jd.qualifications).length > 0 && (<><div style={{ fontWeight: 600, fontSize: '14px', marginTop: '8px' }}>Qualifications</div>
              <ul style={{ margin: '4px 0 0', paddingLeft: '20px', fontSize: '14px', lineHeight: 1.6 }}>{lines(jd.qualifications).map((d, i) => <li key={i}>{d}</li>)}</ul></>)}
            <div style={{ marginTop: '14px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              {st === 'acknowledged' ? (
                <Meta>You acknowledged version {assignment.acknowledged_version} on {formatMountain(assignment.acknowledged_at)}.</Meta>
              ) : (
                <button type="button" data-testid="ack-jd" disabled={pending} style={{ ...primaryBtn(pending), minHeight: '44px' }}
                  onClick={() => start(async () => {
                    const r = await acknowledgeJobDescription(assignment.id)
                    setMsg(r.ok ? { tone: 'green', text: 'Thanks. Your acknowledgement is recorded.' } : { tone: 'red', text: r.error })
                    router.refresh()
                  })}>I have read my job description</button>
              )}
            </div>
          </div>
        </Card>
      )}
      {handbooks.map(({ handbook, latest, ack }) => (
        <HandbookCard key={handbook.id} handbook={handbook} latest={latest} ack={ack} displayName={displayName}
          onDone={(m) => { setMsg(m); router.refresh() }} />
      ))}
    </section>
  )
}

function HandbookCard({ handbook, latest, ack, displayName, onDone }: {
  handbook: Handbook; latest: HandbookVersion | null; ack: HandbookAck | undefined; displayName: string
  onDone: (m: { tone: 'green' | 'red'; text: string }) => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(displayName)
  const [agree, setAgree] = useState(false)
  const [pending, start] = useTransition()
  const st = handbookState(latest, ack)
  const tone = st === 'signed' ? TONES.green : st === 'read' ? TONES.amber : TONES.grey

  function openIt() {
    if (!latest) return
    start(async () => {
      if (latest.storage_path) {
        const { data, error } = await createClient().storage.from(HR_FILES_BUCKET).createSignedUrl(latest.storage_path, 300)
        if (error || !data) { onDone({ tone: 'red', text: error?.message ?? 'Could not open the file.' }); return }
        window.open(data.signedUrl, '_blank', 'noopener')
      }
      setOpen(true)
      if (!ack?.read_at) await markHandbookRead(latest.id)
    })
  }

  return (
    <Card>
      <div data-testid="my-handbook">
        <SectionLabel right={<Pill fg={tone.fg} bg={tone.bg}>{HANDBOOK_STATE_LABELS[st]}</Pill>}>Handbook</SectionLabel>
        <h3 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: '20px' }}>{handbook.title}</h3>
        {latest && <Meta>Version {latest.version} · {formatMountain(latest.published_at)}{latest.change_note ? ` · ${latest.change_note}` : ''}</Meta>}
        {latest && (
          <div style={{ marginTop: '12px', display: 'grid', gap: '12px' }}>
            <div><button type="button" data-testid="open-handbook" style={miniBtn(pending)} disabled={pending} onClick={openIt}>
              {latest.storage_path ? `Open ${latest.file_name ?? 'file'}` : open ? 'Showing below' : 'Read it'}</button></div>
            {open && latest.body && (
              <div data-testid="handbook-body" style={{ whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: 1.7, maxHeight: '420px', overflowY: 'auto',
                padding: '14px', border: '1px solid rgba(10,10,10,0.1)', borderRadius: '6px', background: '#FAFAF7', overflowWrap: 'anywhere' }}>{latest.body}</div>
            )}
            {st === 'signed' ? (
              <Meta>You signed version {latest.version} as “{ack?.signed_name}” on {formatMountain(ack?.signed_at)}.</Meta>
            ) : (open || ack?.read_at) ? (
              <form data-testid="sign-handbook" onSubmit={(e) => { e.preventDefault(); start(async () => {
                const r = await signHandbook(latest.id, name)
                onDone(r.ok ? { tone: 'green', text: `Signed. ${handbook.title} v${latest.version} is recorded.` } : { tone: 'red', text: r.error })
              }) }} style={{ display: 'grid', gap: '8px', maxWidth: '460px' }}>
                <label style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '14px' }}>
                  <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ marginTop: '3px' }} />
                  I have read this version of the handbook and agree to follow it.
                </label>
                <input aria-label="Type your full name to sign" value={name} onChange={(e) => setName(e.target.value)} style={{ ...inputStyle, fontSize: '16px' }} />
                <button type="submit" disabled={pending || !agree || !name.trim()} style={{ ...primaryBtn(pending || !agree || !name.trim()), minHeight: '44px' }}>Sign</button>
              </form>
            ) : null}
          </div>
        )}
      </div>
    </Card>
  )
}
