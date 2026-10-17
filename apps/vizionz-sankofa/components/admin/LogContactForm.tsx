'use client'

// VIZIONZ SANKOFA · "+ Log contact" quick form. Faster than a spreadsheet
// row: pick the client, how, one line of note, optional next step.

import { useState, useTransition } from 'react'
import { logContact } from '@/app/admin/actions/contacts'

const METHOD_LABELS: Array<[string, string]> = [
  ['phone', 'Phone'], ['text', 'Text'], ['in_person', 'In person'], ['home_visit', 'Home visit'],
  ['email', 'Email'], ['video', 'Video'], ['group_session', 'Group'], ['court', 'Court'], ['referral', 'Referral'],
]

export function LogContactForm({ clients }: { clients: Array<{ id: string; label: string }> }) {
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState('')
  const [pending, start] = useTransition()

  const field = { fontSize: '16px', padding: '10px 12px', border: '1px solid rgba(10,10,10,0.18)', borderRadius: '4px', fontFamily: 'Georgia, serif', width: '100%' } as const

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => { setOpen(true); setMsg('') }}
        style={{ fontSize: '20px', padding: '16px 28px', background: '#CE1126', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Georgia, serif', width: '100%' }}
      >
        + Log contact
      </button>
    )
  }

  return (
    <form
      action={(fd) =>
        start(async () => {
          const r = await logContact(fd)
          if (r.ok) { setMsg('Saved.'); setOpen(false) } else setMsg(r.error)
        })
      }
      style={{ background: '#fff', border: '1px solid rgba(10,10,10,0.08)', borderTop: '3px solid #CE1126', borderRadius: '4px', padding: '20px', display: 'grid', gap: '12px', fontFamily: 'Georgia, serif' }}
    >
      <select name="participant_id" required defaultValue="" style={field} aria-label="Client">
        <option value="" disabled>Choose client…</option>
        {clients.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
      </select>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {METHOD_LABELS.map(([v, l], i) => (
          <label key={v} style={{ fontSize: '15px', padding: '6px 10px', border: '1px solid rgba(10,10,10,0.15)', borderRadius: '4px' }}>
            <input type="radio" name="contact_method" value={v} defaultChecked={i === 0} /> {l}
          </label>
        ))}
      </div>
      <textarea name="content" required rows={2} placeholder="What happened? (one or two lines)" style={field} />
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
        <input name="next_action" placeholder="Next step (optional)" style={field} />
        <input name="next_action_due" type="date" aria-label="Next step due" style={field} />
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button type="submit" disabled={pending} style={{ fontSize: '16px', padding: '10px 22px', background: '#0A2548', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {pending ? 'Saving…' : 'Save contact'}
        </button>
        <button type="button" onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#CE1126', cursor: 'pointer', fontSize: '15px' }}>Cancel</button>
        <span style={{ fontSize: '14px' }}>{msg}</span>
      </div>
    </form>
  )
}
