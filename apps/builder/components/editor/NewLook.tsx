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
        const err = change([{ op: 'set_style', style: offered }], 'Switched to the new look')
        setError(err)
        if (!err) setBefore(was)
      }}>Preview the new look</button>
      {error && <p role="alert" className={panel.error}>{error}</p>}
    </section>
  )
}
