'use client'
import { useState } from 'react'
import type { EditOp } from '@yakini/edits'
import { SECTION_DEFS, type Section } from '@yakini/site-schema'
import { addableSections, inspectorLayout, SECTION_LABELS, starterProps, VARIANT_LABELS } from '@/lib/editor/fields'
import { panel, useEditor } from './context'
import { Fields } from './FieldEditors'
import { NewLook, PhotoGrade } from './NewLook'

/**
 * The Edit tab (spec 10.3): the selected section's toolbar (move, hide, duplicate, change style,
 * delete) and every field it has. Header and footer stay first and last on every page.
 */
export function Inspector() {
  const { doc, pageId, selected, change, select } = useEditor()
  const page = doc.pages.find((p) => p.id === pageId)!
  const index = page.sections.findIndex((s) => s.id === selected)
  const section = index >= 0 ? page.sections[index] : null
  const [error, setError] = useState<string | null>(null)

  if (!section) {
    return (
      <div className="space-y-3 p-5">
        <h2 className={panel.h2}>Edit</h2>
        <p className="text-paper/85">Tap any part of the page to change it. Your changes save on their own.</p>
        <NewLook />
        <PhotoGrade />
        <AddSection after={page.sections[page.sections.length - 2]?.id ?? null} />
      </div>
    )
  }

  const run = (ops: EditOp[], label: string) => setError(change(ops, label))
  const fixed = section.type === 'header' || section.type === 'footer'
  const first = index <= 1, last = index >= page.sections.length - 2
  const variants = SECTION_DEFS[section.type].variants as readonly string[]
  const name = SECTION_LABELS[section.type]

  return (
    <div className="space-y-5 p-5" data-inspector-section={section.id}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">{page.title} page</p>
          <h2 className={panel.h2}>{name}{section.hidden && <span className="ml-2 text-sm text-muted">(hidden)</span>}</h2>
        </div>
        <button type="button" className={panel.icon} onClick={() => select(null)} aria-label="Close">✕</button>
      </div>

      {!fixed && (
        <div className="flex flex-wrap gap-2" role="toolbar" aria-label={`${name} section`}>
          <button type="button" className={panel.icon} disabled={first} aria-label="Move up" onClick={() => run([{ op: 'move_section', pageId, sectionId: section.id, toIndex: index - 1 }], `Moved ${name} up`)}>↑</button>
          <button type="button" className={panel.icon} disabled={last} aria-label="Move down" onClick={() => run([{ op: 'move_section', pageId, sectionId: section.id, toIndex: index + 1 }], `Moved ${name} down`)}>↓</button>
          <button type="button" className={panel.btn} onClick={() => run([{ op: 'set_section_hidden', pageId, sectionId: section.id, hidden: !section.hidden }], section.hidden ? `Showed ${name}` : `Hid ${name}`)}>{section.hidden ? 'Show' : 'Hide'}</button>
          <button type="button" className={panel.btn} onClick={() => run([{ op: 'duplicate_section', pageId, sectionId: section.id }], `Duplicated ${name}`)}>Duplicate</button>
          <button type="button" className={panel.btn} onClick={() => { if (window.confirm(`Delete the ${name} section? You can undo this.`)) { const e = change([{ op: 'remove_section', pageId, sectionId: section.id }], `Deleted ${name}`); if (e) setError(e); else select(null) } }}>Delete</button>
        </div>
      )}
      {variants.length > 1 && (
        <div>
          <label htmlFor="style" className={panel.label}>Style</label>
          <select id="style" className={panel.input} value={section.variant} onChange={(e) => run([{ op: 'set_section_variant', pageId, sectionId: section.id, variant: e.target.value }], `Changed the ${name} style`)}>
            {variants.map((v) => <option key={v} value={v}>{VARIANT_LABELS[v] ?? v}</option>)}
          </select>
        </div>
      )}
      {error && <p role="alert" className={panel.error}>{error}</p>}

      <SectionFields section={section} pageId={pageId} />

      {section.type !== 'footer' && <AddSection after={section.id} />}
    </div>
  )
}

function SectionFields({ section, pageId }: { section: Section; pageId: string }) {
  const nodes = inspectorLayout(section.type)
  if (section.type === 'footer') return <p className="text-paper/85">The footer shows your business details. Change them in Business info on the Pages tab.</p>
  if (section.type === 'hours_location') return (<><Fields section={section} pageId={pageId} nodes={nodes} base="" /><p className={panel.hint}>Hours and address come from Business info on the Pages tab, so they match everywhere.</p></>)
  return <Fields key={section.id} section={section} pageId={pageId} nodes={nodes} base="" />
}

function AddSection({ after }: { after: string | null }) {
  const { doc, pageId, change, select } = useEditor()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const options = addableSections(doc)
  const add = (type: (typeof options)[number]['type'], variant: string, label: string) => {
    const props = starterProps(doc, type)
    if (!props) { setError('This section can be added from the Chat tab.'); return }
    // The new section's id is made here, so it can be selected (and its fields opened) at once.
    const id = newSectionId(type, new Set(doc.pages.flatMap((p) => p.sections.map((x) => x.id))))
    const e = change([{ op: 'add_section', pageId, afterSectionId: after, type, variant, props, id }], `Added ${label}`)
    if (e) { setError(e); return }
    setOpen(false)
    select(id)
    requestAnimationFrame(() => document.querySelector(`[data-ys-section="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  return (
    <div className="border-t border-paper/10 pt-4">
      {!open ? <button type="button" className={panel.btn} onClick={() => setOpen(true)}>+ Add a section below</button> : (
        <div>
          <p className={panel.label}>Add a section</p>
          <ul className="mt-2 grid grid-cols-2 gap-2">
            {options.map((o) => <li key={o.type}><button type="button" className={`${panel.btn} w-full`} onClick={() => add(o.type, o.variant, o.label)}>{o.label}</button></li>)}
          </ul>
          <button type="button" className="mt-2 text-sm text-muted underline underline-offset-4" onClick={() => setOpen(false)}>Cancel</button>
        </div>
      )}
      {error && <p className={panel.error}>{error}</p>}
    </div>
  )
}

function newSectionId(type: string, taken: Set<string>): string {
  for (;;) {
    const b = crypto.getRandomValues(new Uint8Array(3))
    const id = `${type.replace(/_/g, '-')}-${Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')}`
    if (!taken.has(id)) return id
  }
}
