'use client'

// VIZIONZ SANKOFA · "+ Log" — call, email, meeting or note in two taps.
// Either fixed to one record (record pages) or with a picker (My Day).
// Client contacts are written to case_notes (caseload rules apply).

import { useState, useTransition } from 'react'
import { logActivity } from '@/app/admin/actions/crm'
import { ACTIVITY_KIND_LABELS, type ActivityKind, type SubjectType } from '@/lib/crm/model'
import { MONO, inputStyle, primaryBtn, textareaStyle } from '../ui'

export type SubjectOption = { type: SubjectType; id: string; label: string }

const KINDS: ActivityKind[] = ['call', 'email', 'meeting', 'note']

export function QuickLog({
  subject,
  options,
  today,
  onLogged,
  startOpen = false,
}: {
  subject?: SubjectOption
  options?: { group: string; items: SubjectOption[] }[]
  today: string
  onLogged?: () => void
  startOpen?: boolean
}) {
  const [open, setOpen] = useState(startOpen)
  const [kind, setKind] = useState<ActivityKind>('call')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, start] = useTransition()
  const [pick, setPick] = useState('')
  const isClient = subject ? subject.type === 'participant' : pick.startsWith('participant:')

  if (!open) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <button type="button" data-testid="quick-log-open" onClick={() => { setOpen(true); setMsg(null) }}
          style={{ ...primaryBtn(), background: '#CE1126', borderColor: '#CE1126', fontSize: '15px', padding: '12px 22px', minHeight: '44px' }}>
          + Log
        </button>
        {msg && <span role="status" style={{ fontSize: '14px', color: msg.ok ? '#007A33' : '#CE1126' }}>{msg.text}</span>}
      </div>
    )
  }

  return (
    <form
      data-testid="quick-log-form"
      action={(fd) => start(async () => {
        if (!subject) {
          const [t, id] = pick.split(':')
          fd.set('subject_type', t ?? '')
          fd.set('subject_id', id ?? '')
        }
        fd.set('kind', kind)
        const r = await logActivity(fd)
        if (r.ok) { setMsg({ ok: true, text: 'Logged.' }); setOpen(false); onLogged?.() }
        else setMsg({ ok: false, text: r.error })
      })}
      style={{ background: '#FFFFFF', border: '1px solid rgba(10,10,10,0.1)', borderTop: '3px solid #CE1126', borderRadius: '8px', padding: '18px', display: 'grid', gap: '12px' }}
    >
      {subject ? (
        <>
          <input type="hidden" name="subject_type" value={subject.type} />
          <input type="hidden" name="subject_id" value={subject.id} />
        </>
      ) : (
        <select aria-label="Who or what is this about" required value={pick} onChange={(e) => setPick(e.target.value)} style={{ ...inputStyle, fontSize: '16px' }}>
          <option value="" disabled>Who or what is this about?</option>
          {(options ?? []).map((g) => (
            <optgroup key={g.group} label={g.group}>
              {g.items.map((o) => <option key={`${o.type}:${o.id}`} value={`${o.type}:${o.id}`}>{o.label}</option>)}
            </optgroup>
          ))}
        </select>
      )}
      <div role="radiogroup" aria-label="Type" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {KINDS.map((k) => (
          <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)}
            style={{ minHeight: '40px', padding: '6px 14px', borderRadius: '4px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: MONO,
              background: kind === k ? '#0A2548' : '#FFFFFF', color: kind === k ? '#FFFFFF' : '#0A0A0A',
              border: `1px solid ${kind === k ? '#0A2548' : 'rgba(10,10,10,0.18)'}` }}>
            {ACTIVITY_KIND_LABELS[k]}
          </button>
        ))}
      </div>
      <input name="summary" required maxLength={500} placeholder="What happened? (one line)" aria-label="Summary" style={{ ...inputStyle, fontSize: '16px' }} />
      <textarea name="details" rows={2} placeholder="Details (optional)" aria-label="Details" style={{ ...textareaStyle, fontSize: '16px', minHeight: '60px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
        <label style={{ fontSize: '12px', color: 'rgba(10,10,10,0.6)' }}>
          Date
          <input name="occurred_on" type="date" defaultValue={today} max={today} style={{ ...inputStyle, fontSize: '16px' }} />
        </label>
        {!isClient && kind !== 'note' && (
          <label style={{ fontSize: '12px', color: 'rgba(10,10,10,0.6)' }}>
            Direction
            <select name="direction" defaultValue="outbound" style={{ ...inputStyle, fontSize: '16px' }}>
              <option value="outbound">We reached out</option>
              <option value="inbound">They reached out</option>
            </select>
          </label>
        )}
      </div>
      <p style={{ fontSize: '12px', color: 'rgba(10,10,10,0.55)', margin: 0 }}>
        {isClient ? 'Saved to the client’s case notes.' : 'Keep client names and details out of partner, funder and donor notes.'}
      </p>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="submit" disabled={pending} style={{ ...primaryBtn(pending), minHeight: '44px' }}>{pending ? 'Saving…' : 'Save'}</button>
        <button type="button" onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#CE1126', cursor: 'pointer', fontSize: '14px', minHeight: '44px' }}>Cancel</button>
        {msg && !msg.ok && <span role="alert" style={{ fontSize: '14px', color: '#CE1126' }}>{msg.text}</span>}
      </div>
    </form>
  )
}
