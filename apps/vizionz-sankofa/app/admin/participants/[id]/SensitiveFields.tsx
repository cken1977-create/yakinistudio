'use client'

// VIZIONZ SANKOFA · Masked sensitive fields (Medicaid ID, SSN, DOB)
// Values come from vs_get_sensitive(): masked by default. "Show" asks the
// database to reveal only what this user's role allows; every reveal is
// written to the audit trail by the database itself.

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Sensitive = {
  medicaid_id: string | null
  ssn: string | null
  dob: string | null
  masked: boolean
  can_reveal: { medicaid_id: boolean; ssn: boolean; dob: boolean }
}

export function SensitiveFields({ participantId }: { participantId: string }) {
  const [data, setData] = useState<Sensitive | null>(null)
  const [err, setErr] = useState('')

  const load = async (reveal: boolean) => {
    const { data: d, error } = await createClient().rpc('vs_get_sensitive', {
      p_participant_id: participantId,
      p_reveal: reveal,
    })
    if (error) setErr('Protected fields unavailable.')
    else setData(d as Sensitive)
  }

  useEffect(() => {
    void load(false)
    // Re-mask automatically after 60 seconds.
  }, [participantId])

  useEffect(() => {
    if (data && !data.masked) {
      const t = setTimeout(() => void load(false), 60000)
      return () => clearTimeout(t)
    }
  }, [data])

  if (err) return <p style={{ fontSize: '13px', color: 'rgba(10,10,10,0.6)' }}>{err}</p>
  if (!data) return null
  const anyReveal = data.can_reveal.medicaid_id || data.can_reveal.ssn || data.can_reveal.dob

  const item = (label: string, value: string | null) => (
    <div style={{ background: '#fff', padding: '12px 16px' }}>
      <div style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(10,10,10,0.55)' }}>{label}</div>
      <div style={{ fontSize: '16px', fontFamily: 'ui-monospace, Menlo, monospace' }}>{value ?? '—'}</div>
    </div>
  )

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1px', background: 'rgba(10,10,10,0.08)', border: '1px solid rgba(10,10,10,0.08)' }}>
        {item('Medicaid ID', data.medicaid_id)}
        {item('SSN', data.ssn)}
        {item('Date of birth', data.dob)}
      </div>
      <div style={{ fontSize: '13px', marginTop: '6px', color: 'rgba(10,10,10,0.6)', fontFamily: 'Georgia, serif' }}>
        🔒 Encrypted. {data.masked
          ? anyReveal
            ? <button type="button" onClick={() => void load(true)} style={{ background: 'none', border: 'none', color: '#CE1126', cursor: 'pointer', padding: 0, fontFamily: 'Georgia, serif', fontSize: '13px' }}>Show (logged)</button>
            : 'Your role sees masked values only.'
          : 'Shown for 60 seconds. This view was logged.'}
      </div>
    </div>
  )
}
