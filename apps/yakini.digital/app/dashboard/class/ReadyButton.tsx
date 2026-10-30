'use client'

import { useState } from 'react'

export function ReadyButton({ lang, label }: { lang: 'en' | 'es'; label: string }) {
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const go = async () => {
    if (!confirm(`Email "your class is ready" to ${lang.toUpperCase()} signups who haven't had it yet?`)) return
    setBusy(true)
    try {
      const r = await fetch(`/api/dashboard/class/notify-ready?lang=${lang}`, { method: 'POST' })
      const d = await r.json().catch(() => ({}))
      setMsg(r.ok ? `Sent ${d.sent}, failed ${d.failed}, ${d.remaining} left` : d.error || `Error ${r.status}`)
    } catch { setMsg('Network error') }
    setBusy(false)
  }
  return (
    <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center' }}>
      <button type="button" onClick={go} disabled={busy} className="yd-btn">{busy ? 'Sending…' : label}</button>
      {msg && <span style={{ fontSize: 13, color: '#aaa' }}>{msg}</span>}
    </span>
  )
}
