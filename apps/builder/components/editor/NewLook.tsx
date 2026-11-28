'use client'
import { useState } from 'react'
import type { Style } from '@yakini/site-schema'
import { lookFor } from '@yakini/kits'
import { panel, useEditor } from './context'

/**
 * "Try the new look" (design D2): opt-in only, never switched for anyone. Trying it changes the
 * draft, which is the preview: the page in the middle shows it at once, and the live site stays as it
 * is until the owner publishes. "Undo" puts the look they had back in one click (Ctrl+Z works too).
 */
export function NewLook() {
  const { doc, change } = useEditor()
  const offered = lookFor(doc.kitId)
  const [before, setBefore] = useState<Style | null>(null)
  const [error, setError] = useState<string | null>(null)
  const trying = before !== null && doc.style.preset === offered.preset

  if (trying) {
    return (
      <section aria-labelledby="new-look-h" className="rounded-2xl border border-gold/50 p-4" data-new-look="trying">
        <h3 id="new-look-h" className="font-semibold text-paper">You’re previewing the new look</h3>
        <p className="mt-1 text-sm text-paper/85">Your colors, logo and words are the same. Your live site doesn’t change until you publish.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={panel.primary} onClick={() => setBefore(null)}>Keep the new look</button>
          <button type="button" className={panel.btn} onClick={() => { setError(change([{ op: 'set_style', style: before }], 'Went back to your original look')); setBefore(null) }}>Undo</button>
        </div>
        {error && <p role="alert" className={panel.error}>{error}</p>}
      </section>
    )
  }
  if (doc.style.preset === offered.preset) return null
  return (
    <section aria-labelledby="new-look-h" className="rounded-2xl border border-paper/15 p-4" data-new-look="offer">
      <h3 id="new-look-h" className="font-semibold text-paper">Try the new look</h3>
      <p className="mt-1 text-sm text-paper/85">The new look for your kind of business, with its own type. Your colors, logo and words stay exactly as they are, and you can undo it in one click.</p>
      <button type="button" className={`${panel.btn} mt-3`} onClick={() => {
        const was = doc.style
        // The owner's photo-grade choice travels with them to the new look.
        const err = change([{ op: 'set_style', style: doc.style.photoGrade ? { ...offered, photoGrade: doc.style.photoGrade } : offered }], 'Switched to the new look')
        setError(err)
        if (!err) setBefore(was)
      }}>Preview the new look</button>
      {error && <p role="alert" className={panel.error}>{error}</p>}
    </section>
  )
}

/**
 * Design D4: photos made for the site and library photos take the look's color treatment so they sit
 * together. The owner's own photos keep their colors unless the owner turns this on. Not offered on
 * the classic look (it has no treatment).
 */
export function PhotoGrade() {
  const { doc, change } = useEditor()
  const [error, setError] = useState<string | null>(null)
  if (doc.style.preset === 'classic') return null
  const on = doc.style.photoGrade === 'all'
  const toggle = () => {
    const style: Style = { ...doc.style, photoGrade: on ? 'made' : 'all' }
    setError(change([{ op: 'set_style', style }], on ? 'Showed your own photos as they are' : 'Gave your own photos the look’s color treatment'))
  }
  return (
    <section aria-labelledby="photo-grade-h" className="rounded-2xl border border-paper/15 p-4" data-photo-grade={on ? 'all' : 'made'}>
      <h3 id="photo-grade-h" className="font-semibold text-paper">Photo color</h3>
      <label className="mt-2 flex min-h-11 cursor-pointer items-start gap-3 text-sm text-paper/85">
        <input type="checkbox" className="mt-1 size-5 accent-[#C9A14A]" checked={on} onChange={toggle} />
        <span>Give my own photos the same color treatment as the rest of the site. Your photos are never changed; you can turn this off anytime.</span>
      </label>
      {error && <p role="alert" className={panel.error}>{error}</p>}
    </section>
  )
}
