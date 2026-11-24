'use client'
import { useState } from 'react'
import type { EditOp } from '@yakini/edits'
import { kitDefinition } from '@yakini/kits'
import { TEMPLATE_PLAN_MAX_PAGES } from '@yakini/site-schema'
import { SECTION_LABELS } from '@/lib/editor/fields'
import { BusinessPanel } from './BusinessPanel'
import { panel, useEditor } from './context'

/**
 * The Pages tab (spec 10.2, 10.3): every page (open, rename, reorder, add from the kit's page
 * templates, remove), the current page's sections in order (a keyboard-friendly way to pick one),
 * and Business info, which every section that shows it reads from.
 */
export function PagesPanel({ onPicked }: { onPicked?: () => void }) {
  const { doc, pageId, showPage, select, selected, change } = useEditor()
  const [renaming, setRenaming] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [business, setBusiness] = useState(false)
  const kit = kitDefinition(doc.kitId)
  const page = doc.pages.find((p) => p.id === pageId)!
  const run = (ops: EditOp[], label: string) => { const e = change(ops, label); setError(e); return e }
  const unused = (kit?.pageTemplates ?? []).filter((t) => !doc.pages.some((p) => p.id === t.id || p.slug === t.slug))
  const full = doc.pages.length >= TEMPLATE_PLAN_MAX_PAGES

  if (business) return <BusinessPanel onBack={() => setBusiness(false)} />

  return (
    <div className="space-y-6 p-5">
      <section aria-labelledby="pages-h">
        <h2 id="pages-h" className={panel.h2}>Pages</h2>
        <ol className="mt-3 space-y-2">
          {doc.pages.map((p, i) => (
            <li key={p.id} className={`rounded-xl border p-2 ${p.id === pageId ? 'border-gold' : 'border-paper/15'}`}>
              {renaming === p.id ? (
                <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!run([{ op: 'rename_page', pageId: p.id, title: title.trim() }], `Renamed ${p.title}`)) setRenaming(null) }}>
                  <input aria-label="Page name" className={panel.input} value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} autoFocus />
                  <button type="submit" className={panel.primary}>Save</button>
                </form>
              ) : (
                <div className="flex items-center gap-1">
                  <button type="button" className="min-h-11 flex-1 rounded-lg px-2 text-left font-semibold hover:bg-paper/5" aria-current={p.id === pageId ? 'page' : undefined}
                    onClick={() => { showPage(p.id); onPicked?.() }}>{p.title}{p.slug === '' && <span className="ml-2 text-xs font-normal text-muted">Home</span>}</button>
                  <button type="button" className={panel.icon} disabled={i === 0} aria-label={`Move ${p.title} up`} onClick={() => run([{ op: 'move_page', pageId: p.id, toIndex: i - 1 }], `Moved ${p.title}`)}>↑</button>
                  <button type="button" className={panel.icon} disabled={i === doc.pages.length - 1} aria-label={`Move ${p.title} down`} onClick={() => run([{ op: 'move_page', pageId: p.id, toIndex: i + 1 }], `Moved ${p.title}`)}>↓</button>
                  <button type="button" className={panel.icon} aria-label={`Rename ${p.title}`} onClick={() => { setRenaming(p.id); setTitle(p.title) }}>✎</button>
                  {p.slug !== '' && (
                    <button type="button" className={panel.icon} aria-label={`Remove ${p.title}`} onClick={() => {
                      if (window.confirm(`Remove the ${p.title} page? Links to it will point to Home. You can undo this.`)) {
                        if (!run([{ op: 'remove_page', pageId: p.id }], `Removed ${p.title}`) && p.id === pageId) showPage(doc.pages[0].id)
                      }
                    }}>✕</button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ol>
        {unused.length > 0 && (
          <div className="mt-3">
            <label htmlFor="add-page" className={panel.label}>Add a page</label>
            <select id="add-page" className={panel.input} value="" disabled={full}
              onChange={(e) => { const t = unused.find((x) => x.id === e.target.value); if (t && !run([{ op: 'add_page', template: t.id, title: t.title, slug: t.slug }], `Added ${t.title}`)) showPage(t.id) }}>
              <option value="">{full ? `Your plan has room for ${TEMPLATE_PLAN_MAX_PAGES} pages` : 'Choose a page…'}</option>
              {unused.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>
        )}
        {error && <p role="alert" className={panel.error}>{error}</p>}
      </section>

      <section aria-labelledby="sections-h">
        <h2 id="sections-h" className={panel.h2}>On this page</h2>
        <ol className="mt-3 space-y-1">
          {page.sections.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => { select(s.id); onPicked?.(); requestAnimationFrame(() => document.querySelector(`[data-ys-section="${s.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })) }}
                aria-current={selected === s.id ? 'true' : undefined}
                className={`flex min-h-11 w-full items-center justify-between rounded-lg px-3 text-left hover:bg-paper/5 ${selected === s.id ? 'bg-paper/10' : ''}`}>
                <span>{SECTION_LABELS[s.type]}</span>
                {s.hidden && <span className="text-xs text-muted">hidden</span>}
              </button>
            </li>
          ))}
        </ol>
      </section>

      <button type="button" className={`${panel.btn} w-full`} onClick={() => setBusiness(true)}>Business info: phone, address, hours</button>
    </div>
  )
}
