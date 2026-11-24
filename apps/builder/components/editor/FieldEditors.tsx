'use client'
import { useEffect, useId, useRef, useState } from 'react'
import { getAt, type EditOp } from '@yakini/edits'
import type { LinkTarget, RichText, Section } from '@yakini/site-schema'
import { limitsFor, newListItem, type FieldNode, type Limits } from '@/lib/editor/fields'
import { linkChoices, linkToText, textToLink } from '@/lib/editor/links'
import { richToText, textToRich } from '@/lib/editor/richtext'
import { panel, useEditor } from './context'
import { PhotoPicker } from './PhotoPicker'

/**
 * One control per field kind (spec 10.3). Each control keeps what the owner is typing even when it
 * isn't valid yet (an empty required headline, say), shows why next to it, and only changes the
 * site once the value is valid. Lengths are counted live against the site format's limits.
 */
type Commit = (value: unknown, label: string) => string | null

/** A text box that follows the site, but keeps the owner's typing while it isn't valid. */
function useDraft(value: string) {
  const [text, setText] = useState(value)
  const [error, setError] = useState<string | null>(null)
  const focused = useRef(false)
  useEffect(() => { if (!focused.current || error === null) { setText(value); if (!focused.current) setError(null) } }, [value]) // eslint-disable-line react-hooks/exhaustive-deps
  return { text, setText, error, setError, bind: { onFocus: () => { focused.current = true }, onBlur: () => { focused.current = false; if (error) { setText(value); setError(null) } } } }
}

function Counter({ n, max }: { n: number; max?: number }) {
  if (!max) return null
  const near = n > max * 0.85
  return <span className={`text-xs ${n > max ? 'text-[#F2B8A8]' : near ? 'text-gold' : 'text-muted'}`} aria-live={near ? 'polite' : 'off'}>{n}/{max}</span>
}

export function TextField({ label, value, limits, multiline, commit }: { label: string; value: string | undefined; limits: Limits; multiline?: boolean; commit: Commit }) {
  const id = useId()
  const d = useDraft(value ?? '')
  const onChange = (v: string) => {
    d.setText(v)
    if (limits.maxLength && v.length > limits.maxLength) { d.setError(`Keep this under ${limits.maxLength} characters.`); return }
    const clean = multiline ? v : v.replace(/\s*\n\s*/g, ' ')
    if (!clean.trim()) {
      if (limits.required) { d.setError('This can’t be empty.'); return }
      d.setError(commit(undefined, label)); return
    }
    d.setError(commit(clean, label))
  }
  const Input = multiline ? 'textarea' : 'input'
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className={panel.label}>{label}{!limits.required && <span className="font-normal text-muted"> (optional)</span>}</label>
        <Counter n={d.text.length} max={limits.maxLength} />
      </div>
      <Input id={id} value={d.text} onChange={(e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => onChange(e.target.value)} {...d.bind}
        rows={multiline ? 3 : undefined} aria-invalid={d.error ? true : undefined} aria-describedby={d.error ? `${id}-e` : undefined} className={panel.input} />
      {d.error && <p id={`${id}-e`} className={panel.error}>{d.error}</p>}
    </div>
  )
}

export function RichTextField({ label, value, limits, commit }: { label: string; value: RichText | undefined; limits: Limits; commit: Commit }) {
  const id = useId()
  const ref = useRef<HTMLTextAreaElement>(null)
  const d = useDraft(value ? richToText(value) : '')
  const update = (v: string) => {
    d.setText(v)
    const rt = textToRich(v)
    if (!rt.length && limits.required) { d.setError('This can’t be empty.'); return }
    d.setError(commit(rt.length ? rt : undefined, label))
  }
  const wrap = (before: string, after: string) => {
    const el = ref.current
    if (!el) return
    const { selectionStart: a, selectionEnd: b, value: v } = el
    const picked = v.slice(a, b) || 'text'
    update(`${v.slice(0, a)}${before}${picked}${after}${v.slice(b)}`)
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + before.length, a + before.length + picked.length) })
  }
  const visible = value ? value.reduce((n, b) => n + b.children.reduce((m, c) => m + c.text.length, 0), 0) : 0
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className={panel.label}>{label}</label>
        <span className="text-xs text-muted">{visible} characters</span>
      </div>
      <div className="mt-1 flex gap-1" role="toolbar" aria-label={`${label} formatting`}>
        <button type="button" className={panel.icon} onClick={() => wrap('**', '**')} aria-label="Bold"><strong>B</strong></button>
        <button type="button" className={panel.icon} onClick={() => wrap('_', '_')} aria-label="Italic"><em>I</em></button>
        <button type="button" className={panel.icon} onClick={() => wrap('[', '](page:home)')} aria-label="Link">↗</button>
      </div>
      <textarea id={id} ref={ref} rows={5} value={d.text} onChange={(e) => update(e.target.value)} {...d.bind} className={panel.input}
        aria-describedby={`${id}-h`} aria-invalid={d.error ? true : undefined} />
      <p id={`${id}-h`} className={panel.hint}>**bold**, _italic_, [words](page:menu) for a link, “- ” at the start of lines for a list, a blank line for a new paragraph.</p>
      {d.error && <p className={panel.error}>{d.error}</p>}
    </div>
  )
}

export function LinkField({ label, value, limits, commit }: { label: string; value: { label: string; target: LinkTarget } | undefined; limits: Limits; commit: Commit }) {
  const { doc } = useEditor()
  const id = useId()
  const choices = linkChoices(doc)
  const current = value ? linkToText(value.target) : ''
  const known = choices.some((c) => c.value === current)
  const [custom, setCustom] = useState(known ? '' : current)
  const [error, setError] = useState<string | null>(null)
  const set = (patch: { label?: string; target?: string }) => {
    const nextLabel = patch.label ?? value?.label ?? 'Learn more'
    const t = textToLink(patch.target ?? current)
    if (!t) { setError('Pick where it goes, or type a web address starting with https://, a phone like tel:+19155550123, or mailto:you@example.com.'); return }
    setError(commit({ label: nextLabel, target: t }, label))
  }
  if (!value) {
    return (
      <div>
        <p className={panel.label}>{label}</p>
        <button type="button" className={`${panel.btn} mt-1`} onClick={() => set({ label: 'Learn more', target: choices[0]?.value ?? 'page:home' })}>Add a button</button>
      </div>
    )
  }
  return (
    <fieldset className="space-y-2 rounded-xl border border-paper/15 p-3">
      <legend className="px-1 text-sm font-semibold">{label}</legend>
      <TextField label="Button text" value={value.label} limits={{ required: true, maxLength: 30 }} commit={(v) => (typeof v === 'string' ? (set({ label: v }), null) : 'This can’t be empty.')} />
      <div>
        <label htmlFor={id} className={panel.label}>Goes to</label>
        <select id={id} className={panel.input} value={known ? current : 'other'} onChange={(e) => { if (e.target.value !== 'other') set({ target: e.target.value }) }}>
          {choices.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          <option value="other">A web address, phone or email…</option>
        </select>
      </div>
      {!known && (
        <input aria-label="Web address, phone or email" className={panel.input} value={custom} placeholder="https://…  or tel:+1…  or mailto:…"
          onChange={(e) => { setCustom(e.target.value); set({ target: e.target.value }) }} />
      )}
      {error && <p className={panel.error}>{error}</p>}
      {!limits.required && <button type="button" className="text-sm text-muted underline underline-offset-4 hover:text-paper" onClick={() => commit(undefined, label)}>Remove this button</button>}
    </fieldset>
  )
}

export function ImageField({ label, value, limits, commit }: { label: string; value: { assetId: string; alt: string } | undefined; limits: Limits; commit: Commit }) {
  const { imageUrl } = useEditor()
  const [open, setOpen] = useState(false)
  const src = value ? imageUrl(value.assetId) : null
  return (
    <div>
      <p className={panel.label}>{label}</p>
      <div className="mt-1 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- private, access-checked images; the optimizer can't fetch them */}
        {src ? <img src={src} alt="" className="h-16 w-24 rounded-lg object-cover" /> : <div className="flex h-16 w-24 items-center justify-center rounded-lg border border-dashed border-paper/30 text-xs text-muted">No photo</div>}
        <div className="flex flex-wrap gap-2">
          <button type="button" className={panel.btn} onClick={() => setOpen(true)}>{value ? 'Change photo' : 'Add a photo'}</button>
          {value && !limits.required && <button type="button" className={panel.btn} onClick={() => commit(undefined, label)}>Remove</button>}
        </div>
      </div>
      {value && (
        <div className="mt-2">
          <TextField label="Describe the photo (for people who can’t see it)" value={value.alt} limits={{ required: true, maxLength: 160 }}
            commit={(alt) => (typeof alt === 'string' ? commit({ ...value, alt }, label) : 'Please describe the photo.')} />
        </div>
      )}
      {open && <PhotoPicker title={label} onClose={() => setOpen(false)} onPick={(p) => { setOpen(false); return commit({ assetId: p.assetId, alt: p.alt }, label) }} />}
    </div>
  )
}

const DAY_LABELS: Record<string, string> = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' }
const OPTION_LABELS: Record<string, string> = { hide: 'Hide the section', 'show-text': 'Show a short note' }

export function ChoiceField({ label, value, options, commit }: { label: string; value: string | undefined; options: readonly string[]; commit: Commit }) {
  const id = useId()
  const [error, setError] = useState<string | null>(null)
  return (
    <div>
      <label htmlFor={id} className={panel.label}>{label}</label>
      <select id={id} className={panel.input} value={value ?? ''} onChange={(e) => setError(commit(e.target.value, label))}>
        {options.map((o) => <option key={o} value={o}>{DAY_LABELS[o] ?? OPTION_LABELS[o] ?? o}</option>)}
      </select>
      {error && <p className={panel.error}>{error}</p>}
    </div>
  )
}

export function TimeField({ label, value, commit }: { label: string; value: string | undefined; commit: Commit }) {
  const id = useId()
  const [error, setError] = useState<string | null>(null)
  return (
    <div>
      <label htmlFor={id} className={panel.label}>{label}</label>
      <input id={id} type="time" className={panel.input} value={value ?? ''} onChange={(e) => e.target.value && setError(commit(e.target.value, label))} />
      {error && <p className={panel.error}>{error}</p>}
    </div>
  )
}

export function BooleanField({ label, value, commit }: { label: string; value: boolean | undefined; commit: Commit }) {
  return (
    <label className="flex min-h-11 items-center gap-3 text-base">
      <input type="checkbox" className="h-5 w-5 accent-[#C9A14A]" checked={Boolean(value)} onChange={(e) => commit(e.target.checked, label)} /> {label}
    </label>
  )
}

/** Every field of a section (or of one list row), recursively. */
export function Fields({ section, pageId, nodes, base }: { section: Section; pageId: string; nodes: FieldNode[]; base: string }) {
  const { change } = useEditor()
  return (
    <div className="space-y-5">
      {nodes.map((n) => {
        const path = `${base}${n.rel}`
        const value = getAt(section.props, path)
        const limits = limitsFor(section.type, n.pattern)
        const commit: Commit = (v, label) => change([{ op: 'update_field', pageId, sectionId: section.id, path, value: v } as EditOp], label, `${pageId}/${section.id}${path}`)
        const key = path
        switch (n.kind) {
          case 'text': case 'url': return <TextField key={key} label={n.label} value={value as string | undefined} limits={limits} commit={commit} />
          case 'textarea': return <TextField key={key} label={n.label} value={value as string | undefined} limits={limits} multiline commit={commit} />
          case 'richtext': return <RichTextField key={key} label={n.label} value={value as RichText | undefined} limits={limits} commit={commit} />
          case 'link': return <LinkField key={key} label={n.label} value={value as never} limits={limits} commit={commit} />
          case 'image': return <ImageField key={key} label={n.label} value={value as never} limits={limits} commit={commit} />
          case 'select': return <ChoiceField key={key} label={n.label} value={value as string | undefined} options={n.options ?? []} commit={commit} />
          case 'day': return <ChoiceField key={key} label={n.label} value={value as string | undefined} options={Object.keys(DAY_LABELS)} commit={commit} />
          case 'time': return <TimeField key={key} label={n.label} value={value as string | undefined} commit={commit} />
          case 'boolean': return <BooleanField key={key} label={n.label} value={value as boolean | undefined} commit={commit} />
          case 'list': return <ListField key={key} node={n} section={section} pageId={pageId} path={path} />
        }
      })}
    </div>
  )
}

/** Add, remove and reorder rows (↑/↓ buttons work the same on phone and desktop). */
function ListField({ node, section, pageId, path }: { node: FieldNode; section: Section; pageId: string; path: string }) {
  const { change, doc } = useEditor()
  const rows = (getAt(section.props, path) as unknown[] | undefined) ?? []
  const limits = limitsFor(section.type, node.pattern)
  const [error, setError] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)
  const set = (next: unknown[], label: string) => setError(change([{ op: 'update_field', pageId, sectionId: section.id, path, value: next } as EditOp], label))
  const isPhotos = node.children.length === 0
  const add = () => {
    if (isPhotos) { setPicking(true); return }
    const row = newListItem(doc, section, path, node.pattern)
    if (row === null) { setError('Add one from the Chat tab, or ask Yakini to set this up.'); return }
    set([...rows, row], `Added to ${node.label}`)
  }
  const move = (i: number, d: -1 | 1) => { const n = [...rows]; const [x] = n.splice(i, 1); n.splice(i + d, 0, x); set(n, `Reordered ${node.label}`) }
  const remove = (i: number) => { if (window.confirm('Remove this one?')) set(rows.filter((_, j) => j !== i), `Removed from ${node.label}`) }
  const full = limits.maxItems !== undefined && rows.length >= limits.maxItems
  return (
    <fieldset className="rounded-xl border border-paper/15 p-3">
      <legend className="px-1 text-sm font-semibold">{node.label} <span className="font-normal text-muted">({rows.length}{limits.maxItems ? ` of ${limits.maxItems}` : ''})</span></legend>
      <ol className="space-y-3">
        {rows.map((row, i) => (
          <li key={i} className="rounded-lg bg-paper/5 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm text-muted">{i + 1}</span>
              <div className="flex gap-1">
                <button type="button" className={panel.icon} disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${i + 1} up`}>↑</button>
                <button type="button" className={panel.icon} disabled={i === rows.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${i + 1} down`}>↓</button>
                <button type="button" className={panel.icon} onClick={() => remove(i)} aria-label={`Remove ${i + 1}`}>✕</button>
              </div>
            </div>
            {isPhotos
              ? <ImageField label="Photo" value={row as never} limits={{ required: true }} commit={(v) => (v ? change([{ op: 'update_field', pageId, sectionId: section.id, path: `${path}/${i}`, value: v } as EditOp], 'Photo') : null)} />
              : <Fields section={section} pageId={pageId} nodes={node.children} base={`${path}/${i}`} />}
          </li>
        ))}
      </ol>
      <button type="button" className={`${panel.btn} mt-3`} disabled={full} onClick={add}>+ Add</button>
      {full && <p className={panel.hint}>That’s the most this section can hold.</p>}
      {error && <p className={panel.error}>{error}</p>}
      {picking && <PhotoPicker title={node.label} onClose={() => setPicking(false)} onPick={(p) => { setPicking(false); const e = change([{ op: 'update_field', pageId, sectionId: section.id, path, value: [...rows, { assetId: p.assetId, alt: p.alt }] } as EditOp], `Added a photo`); setError(e); return e }} />}
    </fieldset>
  )
}
