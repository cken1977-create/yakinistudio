'use client'
import { useEffect, useId, useRef, useState } from 'react'
import type { EditOp } from '@yakini/edits'
import type { SiteDoc } from '@yakini/site-schema'
import { panel, useEditor } from './context'

/**
 * The Chat tab, "Ask for a change" (spec 10.4). The answer comes back as a proposal: the changes in
 * plain words, with the page showing them outlined. Nothing changes until the owner taps Apply; Undo
 * puts it back; Try again asks once more. Brand, publishing and billing requests get a polite answer.
 */
export type Proposal = { doc: SiteDoc; ops: EditOp[]; lines: string[]; changed: string[]; request: string }
type Msg = { role: 'user' | 'assistant'; text: string; choices?: string[] }

const CHIPS = ['Make the headline shorter', 'Add a catering section', 'Add a photo gallery', 'Fix spelling']

export function ChatPanel({ proposal, setProposal, prefill }: { proposal: Proposal | null; setProposal: (p: Proposal | null) => void; prefill?: string }) {
  const { siteId, pageId, selected, session, doc } = useEditor()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [text, setText] = useState(prefill ?? '')
  const [busy, setBusy] = useState(false)
  const [applied, setApplied] = useState<string | null>(null)
  const [listening, setListening] = useState(false)
  const id = useId()
  const end = useRef<HTMLDivElement>(null)
  // A question handed over from the Help tab fills the box (state adjusted during render, not in an effect).
  const [lastPrefill, setLastPrefill] = useState(prefill)
  if (prefill !== lastPrefill) { setLastPrefill(prefill); if (prefill) setText(prefill) }
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [msgs, proposal, busy])

  const ask = async (request: string) => {
    const r = request.trim()
    if (!r || busy) return
    setMsgs((m) => [...m, { role: 'user', text: r }])
    setText(''); setBusy(true); setApplied(null); setProposal(null)
    try {
      const res = await fetch('/api/ai/edit', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ siteId, request: r, pageId, selected: selected ? { pageId, sectionId: selected } : null }),
      })
      const out = await res.json().catch(() => ({})) as { kind?: string; message?: string; question?: string; choices?: string[]; lines?: string[]; ops?: EditOp[]; changed?: string[]; doc?: SiteDoc; error?: string }
      if (out.kind === 'proposal' && out.doc && out.ops) {
        setProposal({ doc: out.doc, ops: out.ops, lines: out.lines ?? [], changed: out.changed ?? [], request: r })
      } else if (out.kind === 'question') {
        setMsgs((m) => [...m, { role: 'assistant', text: out.question ?? '', choices: out.choices }])
      } else {
        setMsgs((m) => [...m, { role: 'assistant', text: out.message ?? out.error ?? 'Something went wrong. Please try again.' }])
      }
    } catch {
      setMsgs((m) => [...m, { role: 'assistant', text: 'You seem to be offline. Please try again when you’re connected. You can still click to edit anything.' }])
    } finally { setBusy(false) }
  }

  const apply = () => {
    if (!proposal) return
    const r = session.apply(proposal.ops, { label: proposal.lines[0] ?? 'Chat change', source: 'chat' })
    if (!r.ok) { setMsgs((m) => [...m, { role: 'assistant', text: 'The page changed since I suggested that. Please ask again.' }]); setProposal(null); return }
    setMsgs((m) => [...m, { role: 'assistant', text: proposal.lines.join('\n') }])
    setApplied(proposal.lines[0] ?? 'that change')
    setProposal(null)
  }

  const speech = typeof window !== 'undefined' ? ((window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => SpeechRec }).webkitSpeechRecognition) : undefined
  const listen = () => {
    if (!speech || listening) return
    const rec = new speech()
    rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 1
    rec.onresult = (e) => setText((t) => `${t ? `${t} ` : ''}${e.results[0][0].transcript}`.slice(0, 1000))
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    setListening(true); rec.start()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-5" aria-live="polite">
        <h2 className={panel.h2}>Ask for a change</h2>
        {msgs.length === 0 && !proposal && <p className="text-paper/85">Tell me what to change, like “Add our Saturday hours 10 to 4” or “Make the welcome say we cater weddings.” {selected ? 'I’ll start with the section you picked.' : ''}</p>}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'ml-8 rounded-2xl bg-paper/10 px-4 py-3' : 'mr-8 rounded-2xl border border-paper/15 px-4 py-3'}>
            <p className="whitespace-pre-line">{m.text}</p>
            {m.choices && m.choices.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">{m.choices.map((c) => <button key={c} type="button" className={panel.btn} onClick={() => void ask(c)}>{c}</button>)}</div>
            )}
          </div>
        ))}
        {busy && <p className="text-paper/80">Working on it…</p>}
        {proposal && (
          <div className="rounded-2xl border border-gold/60 p-4">
            <p className="text-sm font-semibold text-gold">Here’s the change. It’s outlined on the page.</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">{proposal.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className={panel.primary} onClick={apply}>Apply</button>
              <button type="button" className={panel.btn} onClick={() => setProposal(null)}>Undo</button>
              <button type="button" className={panel.btn} onClick={() => void ask(proposal.request)}>Try again</button>
            </div>
          </div>
        )}
        {applied && !proposal && (
          <div className="flex items-center justify-between gap-2 rounded-xl bg-paper/5 px-4 py-2 text-sm">
            <span>Applied. It saves on its own.</span>
            <button type="button" className="underline underline-offset-4" onClick={() => { session.undo(); setApplied(null) }}>Undo</button>
          </div>
        )}
        <div ref={end} />
      </div>
      <div className="border-t border-paper/10 p-4">
        <div className="mb-2 flex flex-wrap gap-2">{CHIPS.map((c) => <button key={c} type="button" className="min-h-9 rounded-full border border-paper/20 px-3 text-sm hover:border-gold" onClick={() => void ask(c)}>{c}</button>)}</div>
        <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); void ask(text) }}>
          <label htmlFor={id} className="sr-only">Your request</label>
          <textarea id={id} rows={2} maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} placeholder="What would you like to change?" className={`${panel.input} mt-0 flex-1`}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void ask(text) } }} />
          {speech && <button type="button" className={panel.icon} onClick={listen} aria-label={listening ? 'Listening' : 'Speak your request'} aria-pressed={listening}>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
          </button>}
          <button type="submit" className={panel.primary} disabled={busy || !text.trim()}>Send</button>
        </form>
        <p className="mt-1 text-xs text-muted">{doc.business.name}: brand colors and logo stay as they are.</p>
      </div>
    </div>
  )
}

type SpeechRec = {
  lang: string; interimResults: boolean; maxAlternatives: number
  onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null
  onend: (() => void) | null; onerror: (() => void) | null
  start(): void
}
