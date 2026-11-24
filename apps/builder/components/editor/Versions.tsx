'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { panel } from './context'

/** "Save a version" with an optional note (spec 10.5). */
export function SaveVersion({ siteId }: { siteId: string }) {
  const [note, setNote] = useState('')
  const router = useRouter()
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const save = async () => {
    setBusy(true); setMsg(null)
    try {
      const res = await fetch(`/api/sites/${siteId}/versions`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(note.trim() ? { note: note.trim() } : {}) })
      const out = await res.json().catch(() => ({})) as { number?: number; error?: string }
      if (res.ok) { setMsg(`Saved as version ${out.number}.`); setNote(''); router.refresh() } else setMsg(out.error ?? 'That didn’t save. Please try again.')
    } catch { setMsg('You seem to be offline. Please try again.') } finally { setBusy(false) }
  }
  return (
    <form className="mt-6 flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); void save() }}>
      <label className="min-w-0 flex-1 text-sm font-semibold">Note <span className="font-normal text-muted">(optional)</span>
        <input className={panel.input} maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Before the summer menu" />
      </label>
      <button type="submit" className={panel.primary} disabled={busy}>Save a version</button>
      {msg && <p role="status" className="w-full text-sm text-paper/85">{msg}</p>}
    </form>
  )
}

/** "Restore this version": the current draft is kept as a version first, so this can be undone. */
export function RestoreButton({ siteId, versionId, number, rev }: { siteId: string; versionId: string; number: number; rev: number }) {
  const router = useRouter()
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const restore = async () => {
    if (!window.confirm(`Restore version ${number}? Your current draft is saved as a version first.`)) return
    setBusy(true); setMsg(null)
    try {
      const res = await fetch(`/api/sites/${siteId}/restore`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ versionId, baseRev: rev }) })
      const out = await res.json().catch(() => ({})) as { error?: string }
      if (res.ok) router.push(`/sites/${siteId}/edit`)
      else { setMsg(out.error ?? 'That didn’t work. Please try again.'); if (res.status === 409) setTimeout(() => router.refresh(), 1500) }
    } catch { setMsg('You seem to be offline. Please try again.') } finally { setBusy(false) }
  }
  return (
    <div className="text-right">
      <button type="button" className={panel.btn} disabled={busy} onClick={() => void restore()}>Restore this version</button>
      {msg && <p role="alert" className="mt-1 text-sm text-[#F2B8A8]">{msg}</p>}
    </div>
  )
}
