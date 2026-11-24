'use client'
import { useEffect, useId, useRef, useState } from 'react'
import { kitDefinition } from '@yakini/kits'
import { panel, useEditor } from './context'

/**
 * "Change photo" (spec 10.3): pick from your photos, from the kit's photos, or upload one. A short
 * description is required, because people using screen readers hear it instead of seeing the photo.
 */
type Pick = { assetId: string; alt: string }

export function PhotoPicker({ title, onPick, onClose }: { title: string; onPick: (p: Pick) => string | null; onClose: () => void }) {
  const { doc, photos, refreshPhotos, imageUrl, siteId } = useEditor()
  const [tab, setTab] = useState<'mine' | 'kit' | 'upload'>(photos.length ? 'mine' : 'kit')
  const [chosen, setChosen] = useState<string | null>(null)
  const [alt, setAlt] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const altId = useId()
  const kit = kitDefinition(doc.kitId)
  const kitPhotos = kit?.sampleImages ?? []

  useEffect(() => { dialog.current?.showModal(); void refreshPhotos() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (id: string, suggested: string) => { setChosen(id); setAlt((a) => a || suggested); setError(null) }
  const confirm = () => {
    if (!chosen) { setError('Pick a photo first.'); return }
    if (!alt.trim()) { setError('Please describe the photo in a few words.'); return }
    const e = onPick({ assetId: chosen, alt: alt.trim().slice(0, 160) })
    if (e) setError(e)
  }
  const upload = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) { setError('Choose a photo from your device.'); return }
    if (file.size > 10 * 1024 * 1024) { setError('That photo is too large. Please use one under 10 MB.'); return }
    setBusy(true); setError(null)
    try {
      const body = new FormData()
      body.set('siteId', siteId); body.set('file', file); body.set('alt', alt)
      const res = await fetch('/api/assets', { method: 'POST', body })
      const out = await res.json().catch(() => ({})) as { id?: string; error?: string }
      if (!res.ok || !out.id) { setError(out.error ?? 'That upload didn’t work. Please try again.'); return }
      await refreshPhotos()
      setChosen(out.id)
      if (!alt.trim()) setError('Uploaded. Now describe the photo in a few words, then tap Use this photo.')
      else { const e = onPick({ assetId: out.id, alt: alt.trim().slice(0, 160) }); if (e) setError(e) }
    } catch {
      setError('You seem to be offline. Please try again when you’re connected.')
    } finally { setBusy(false) }
  }

  const tile = (id: string, suggested: string) => {
    const src = imageUrl(id)
    return (
      <li key={id}>
        <button type="button" onClick={() => choose(id, suggested)} aria-pressed={chosen === id}
          className={`block w-full overflow-hidden rounded-lg border-2 ${chosen === id ? 'border-gold' : 'border-transparent'} focus:outline-none focus-visible:border-gold`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- private, access-checked images */}
          {src ? <img src={src} alt={suggested} className="aspect-[4/3] w-full object-cover" /> : <span className="block aspect-[4/3] w-full bg-paper/10" />}
        </button>
      </li>
    )
  }

  return (
    <dialog ref={dialog} onClose={onClose} aria-label={`Choose a photo: ${title}`}
      className="m-0 mt-auto max-h-[85vh] w-full max-w-none rounded-t-2xl border border-paper/15 bg-[#121010] p-0 text-paper backdrop:bg-black/60 lg:m-auto lg:max-w-2xl lg:rounded-2xl">
      <div className="flex items-center justify-between border-b border-paper/10 px-5 py-3">
        <h2 className={panel.h2}>Choose a photo</h2>
        <button type="button" className={panel.icon} onClick={() => dialog.current?.close()} aria-label="Close">✕</button>
      </div>
      <div className="max-h-[65vh] overflow-y-auto px-5 py-4">
        <div role="tablist" className="mb-4 flex gap-2">
          {([['mine', 'Your photos'], ['kit', 'Kit photos'], ['upload', 'Upload']] as const).map(([k, l]) => (
            <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)}
              className={`min-h-11 rounded-full px-4 text-sm font-semibold ${tab === k ? 'bg-paper text-ink' : 'border border-paper/20 text-paper'}`}>{l}</button>
          ))}
        </div>
        {tab === 'mine' && (photos.length
          ? <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">{photos.map((p) => tile(p.id, p.alt))}</ul>
          : <p className="text-paper/80">No photos yet. Upload one, or use a kit photo for now.</p>)}
        {tab === 'kit' && <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">{kitPhotos.map((p) => tile(p.assetId, p.alt))}</ul>}
        {tab === 'upload' && (
          <div className="space-y-2">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Photo from your device"
              className="block w-full text-sm text-paper file:mr-4 file:min-h-11 file:rounded-full file:border-0 file:bg-paper file:px-5 file:font-semibold file:text-ink" />
            <p className={panel.hint}>JPG, PNG or WebP, up to 10 MB. We remove location data from photos.</p>
          </div>
        )}
        <div className="mt-5">
          <label htmlFor={altId} className={panel.label}>Describe the photo</label>
          <input id={altId} className={panel.input} maxLength={160} value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Brisket tacos on a paper tray" />
          <p className={panel.hint}>A few words, for people who can’t see it.</p>
        </div>
        {error && <p role="alert" className={panel.error}>{error}</p>}
      </div>
      <div className="flex justify-end gap-2 border-t border-paper/10 px-5 py-3">
        <button type="button" className={panel.btn} onClick={() => dialog.current?.close()}>Cancel</button>
        {tab === 'upload'
          ? <button type="button" className={panel.primary} disabled={busy} onClick={() => void upload()}>{busy ? 'Uploading…' : 'Upload and use'}</button>
          : <button type="button" className={panel.primary} onClick={confirm}>Use this photo</button>}
      </div>
    </dialog>
  )
}
