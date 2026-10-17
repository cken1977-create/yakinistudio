'use client'

// Start an OBR profile: for VS itself, or for a coalition partner.

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { inputStyle, primaryBtn, secondaryBtn } from '@/components/admin/ui'

export function ObrStartClient({
  mode,
  partners = [],
}: {
  mode: 'self' | 'partner'
  partners?: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [orgId, setOrgId] = useState('')

  function start() {
    setError(null)
    startTransition(async () => {
      const supabase = createBrowserClient()
      const org = partners.find((p) => p.id === orgId)
      if (mode === 'partner' && !org) {
        setError('Pick a partner first.')
        return
      }
      const row: { is_self: boolean; organization_id: string | null; display_name: string; status: string } =
        mode === 'self'
          ? { is_self: true, organization_id: null, display_name: 'Vizionz Sankofa', status: 'in_progress' }
          : { is_self: false, organization_id: org!.id, display_name: org!.name, status: 'in_progress' }
      const { data, error: err } = await supabase.from('vs_obr_profiles').insert(row).select('id').single()
      if (err || !data) {
        setError(err?.message ?? 'Could not start the profile.')
        return
      }
      router.push(`/admin/obr/${(data as { id: string }).id}`)
    })
  }

  if (mode === 'self') {
    return (
      <div>
        <button type="button" onClick={start} disabled={pending} style={primaryBtn(pending)}>
          {pending ? 'Starting…' : 'Start VS OBR intake'}
        </button>
        {error && <p style={{ color: '#CE1126', fontSize: '13px', marginTop: '8px' }}>{error}</p>}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
      <select
        value={orgId}
        onChange={(e) => setOrgId(e.target.value)}
        aria-label="Coalition partner"
        style={{ ...inputStyle, width: 'auto', minWidth: '240px', flex: '1 1 240px', maxWidth: '420px' }}
      >
        <option value="">Start OBR for a coalition partner…</option>
        {partners.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <button type="button" onClick={start} disabled={pending || !orgId} style={secondaryBtn(pending || !orgId)}>
        {pending ? 'Starting…' : 'Start'}
      </button>
      {error && <p style={{ color: '#CE1126', fontSize: '13px', margin: 0, flexBasis: '100%' }}>{error}</p>}
    </div>
  )
}
