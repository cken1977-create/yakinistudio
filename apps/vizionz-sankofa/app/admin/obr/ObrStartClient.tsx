'use client'

// Start VS's own OBR (Organizational Behavioral Readiness) intake.

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { primaryBtn } from '@/components/admin/ui'

export function ObrStartClient() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function start() {
    setError(null)
    startTransition(async () => {
      const supabase = createBrowserClient()
      const { data, error: err } = await supabase
        .from('vs_obr_profiles')
        .insert({ is_self: true, organization_id: null, display_name: 'Vizionz Sankofa', status: 'in_progress' })
        .select('id')
        .single()
      if (err || !data) {
        setError(err?.message ?? 'Could not start the intake.')
        return
      }
      router.push(`/admin/obr/${(data as { id: string }).id}`)
    })
  }

  return (
    <div>
      <button type="button" onClick={start} disabled={pending} style={primaryBtn(pending)}>
        {pending ? 'Starting…' : 'Start VS OBR intake'}
      </button>
      {error && <p style={{ color: '#CE1126', fontSize: '13px', marginTop: '8px' }}>{error}</p>}
    </div>
  )
}
