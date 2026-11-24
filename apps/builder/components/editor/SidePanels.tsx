'use client'
import { useState } from 'react'
import { kitDefinition } from '@yakini/kits'
import { SECTION_LABELS } from '@/lib/editor/fields'
import { panel, useEditor } from './context'

/** The Kit tab (spec 10.2): what this kit includes, and the walkable kit preview on the demo. */
export function KitPanel() {
  const { doc } = useEditor()
  const kit = kitDefinition(doc.kitId)
  if (!kit) return null
  return (
    <div className="space-y-4 p-5">
      <h2 className={panel.h2}>Your {kit.name.toLowerCase()} kit</h2>
      <p className="text-paper/85">These pages and sections come with your kit. Add any of them from the Pages and Edit tabs.</p>
      <div>
        <h3 className="text-sm font-semibold">Pages</h3>
        <ul className="mt-1 list-disc pl-5 text-paper/85">{kit.pageTemplates.map((t) => <li key={t.id}>{t.title}</li>)}</ul>
      </div>
      <div>
        <h3 className="text-sm font-semibold">Sections</h3>
        <p className="mt-1 text-paper/85">{kit.allowedSections.filter((t) => t !== 'header' && t !== 'footer').map((t) => SECTION_LABELS[t]).join(', ')}.</p>
      </div>
      <a href="https://yakini.digital/demo" target="_blank" rel="noopener" className={panel.btn}>Walk through the kit</a>
    </div>
  )
}

/**
 * The Help tab (spec 10.6): Destiny answers questions about the editor in a few sentences and
 * points to the tutorial step. She can't change the site: change requests go to the Chat tab,
 * filled in. Prices get the one fixed line. Text only for now (voice is optional in the spec).
 */
type Turn = { role: 'user' | 'assistant'; content: string }

export function HelpPanel({ onAskChat, onStartTour }: { onAskChat: (q: string) => void; onStartTour: () => void }) {
  const { siteId } = useEditor()
  const [turns, setTurns] = useState<Turn[]>([])
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const ask = async (question: string) => {
    const text = question.trim()
    if (!text || busy) return
    setTurns((t) => [...t, { role: 'user', content: text }]); setQ(''); setBusy(true)
    try {
      const res = await fetch('/api/ai/helper', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ siteId, question: text, history: turns.slice(-6) }) })
      const out = await res.json().catch(() => ({})) as { answer?: string; chatPrefill?: string; error?: string }
      setTurns((t) => [...t, { role: 'assistant', content: out.answer ?? out.error ?? 'I couldn’t answer just now. The tutorial below covers every step.' }])
      if (out.chatPrefill) onAskChat(out.chatPrefill)
    } catch {
      setTurns((t) => [...t, { role: 'assistant', content: 'You seem to be offline. The tutorial below works without a connection once it’s open.' }])
    } finally { setBusy(false) }
  }
  return (
    <div className="space-y-4 p-5">
      <h2 className={panel.h2}>Help from Destiny</h2>
      <p className="text-paper/85">Ask how to do anything in the editor.</p>
      <div className="space-y-2" aria-live="polite">
        {turns.map((t, i) => (
          <p key={i} className={t.role === 'user' ? 'ml-8 rounded-2xl bg-paper/10 px-4 py-2' : 'mr-8 rounded-2xl border border-paper/15 px-4 py-2'}>{t.content}</p>
        ))}
        {busy && <p className="text-paper/80">Destiny is typing…</p>}
      </div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void ask(q) }}>
        <label htmlFor="help-q" className="sr-only">Your question</label>
        <input id="help-q" className={`${panel.input} mt-0`} maxLength={500} value={q} onChange={(e) => setQ(e.target.value)} placeholder="How do I change a photo?" />
        <button type="submit" className={panel.primary} disabled={busy || !q.trim()}>Ask</button>
      </form>
      <div className="flex flex-wrap gap-2 border-t border-paper/10 pt-4">
        <button type="button" className={panel.btn} onClick={onStartTour}>Start the tour</button>
        <a href={`/sites/${siteId}/tutorial`} className={panel.btn}>Written tutorial</a>
      </div>
    </div>
  )
}
