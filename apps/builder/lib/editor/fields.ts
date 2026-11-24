import { z } from 'zod'
import { getAt } from '@yakini/edits'
import { kitDefinition } from '@yakini/kits'
import { INSPECTORS, type FieldKind, type InspectorField } from '@yakini/sections/inspectors'
import { SECTION_DEFS, type Section, type SectionType, type SiteDoc } from '@yakini/site-schema'

/**
 * What the inspector shows for a section (spec 7.2, 10.3), built from the same field list the
 * chat edits are limited to, so click and chat can change exactly the same things.
 */
export type FieldNode = {
  /** Path relative to the parent list item (or to the section's props at the top). */
  rel: string
  label: string
  kind: FieldKind
  options?: readonly string[]
  /** For lists: the fields of each item. Empty for lists of pictures (gallery). */
  children: FieldNode[]
  /** Absolute pattern with `*` for list indexes, e.g. /categories/<star>/items. */
  pattern: string
}

function build(type: SectionType, prefix: string): FieldNode[] {
  const fields = INSPECTORS[type]
  const out: FieldNode[] = []
  for (const f of fields) {
    if (!f.path.startsWith(prefix)) continue
    const rest = f.path.slice(prefix.length)
    if (!/^\/[A-Za-z0-9_]+$/.test(rest)) continue // deeper than one level: belongs to a child list
    out.push(node(type, f, rest))
  }
  return out
}
function node(type: SectionType, f: InspectorField, rel: string): FieldNode {
  return { rel, label: f.label, kind: f.kind, options: f.options, pattern: f.path, children: f.kind === 'list' ? build(type, `${f.path}/*`) : [] }
}

const layouts = new Map<SectionType, FieldNode[]>()
export function inspectorLayout(type: SectionType): FieldNode[] {
  if (!layouts.has(type)) layouts.set(type, build(type, ''))
  return layouts.get(type)!
}

// ------------------------------------------------------------------------------------ limits

export type Limits = { required: boolean; maxLength?: number; maxItems?: number; minItems?: number }
type Json = { type?: string; properties?: Record<string, Json>; required?: string[]; items?: Json; maxLength?: number; maxItems?: number; minItems?: number; anyOf?: Json[]; allOf?: Json[] }

const schemas = new Map<SectionType, Json | null>()
function jsonFor(type: SectionType): Json | null {
  if (!schemas.has(type)) {
    try { schemas.set(type, z.toJSONSchema(SECTION_DEFS[type].props as z.ZodType, { unrepresentable: 'any', io: 'input' }) as Json) } catch { schemas.set(type, null) }
  }
  return schemas.get(type)!
}

/** Length and count limits for a field, read from the site format itself (shown live as counters). */
export function limitsFor(type: SectionType, pattern: string): Limits {
  let s = jsonFor(type)
  let required = true
  for (const seg of pattern.split('/').slice(1)) {
    if (!s) return { required: false }
    while (s && !s.properties && !s.items && (s.anyOf || s.allOf)) s = (s.anyOf ?? s.allOf)!.find((x) => x.properties || x.items) ?? null
    if (!s) return { required: false }
    if (seg === '*') { s = s.items ?? null; required = true; continue }
    required = Boolean(s.required?.includes(seg))
    s = s.properties?.[seg] ?? null
  }
  return { required, maxLength: s?.maxLength, maxItems: s?.maxItems, minItems: s?.minItems }
}

// ------------------------------------------------------------------------------- new list rows

/** Concrete list paths in `props` that match a pattern like /categories/<star>/items. */
function matches(props: unknown, pattern: string): unknown[][] {
  const segs = pattern.split('/').slice(1)
  let nodes: unknown[] = [props]
  for (const seg of segs) {
    const next: unknown[] = []
    for (const n of nodes) {
      if (seg === '*') { if (Array.isArray(n)) next.push(...n) }
      else if (n && typeof n === 'object') { const v = (n as Record<string, unknown>)[seg]; if (v !== undefined) next.push(v) }
    }
    nodes = next
  }
  return nodes.filter(Array.isArray) as unknown[][]
}

/**
 * A starting row for "Add" in a list: a copy of the last row in this list, else of any row the
 * site already has in the same kind of list, else the kit's own example. Null when there's none.
 * Copies are always valid rows, so adding never breaks the site; the owner then edits the copy.
 */
export function newListItem(doc: SiteDoc, section: Section, listPath: string, pattern: string): unknown | null {
  const here = getAt(section.props, listPath)
  if (Array.isArray(here) && here.length) return structuredClone(here[here.length - 1])
  const sameType = doc.pages.flatMap((p) => p.sections).filter((s) => s.type === section.type)
  const kit = kitDefinition(doc.kitId)
  const template = kit ? kit.template({ name: doc.business.name }).pages.flatMap((p) => p.sections).filter((s) => s.type === section.type) : []
  for (const s of [...sameType, ...template]) {
    const found = matches(s.props, pattern).find((a) => a.length)
    if (found) return structuredClone(found[0])
  }
  return blankRow(section.type, pattern)
}

/** Labels of an item's fields, by key, for [[placeholder]] text in a blank row. */
function itemLabels(type: SectionType, pattern: string): Map<string, string> {
  const out = new Map<string, string>()
  for (const f of INSPECTORS[type]) {
    const rest = f.path.startsWith(`${pattern}/*/`) ? f.path.slice(pattern.length + 3) : ''
    if (rest && !rest.includes('/')) out.set(rest, f.label)
  }
  return out
}

/**
 * A row with only its required fields, filled with [[placeholders]] the site shows as "add this"
 * prompts (spec 8.5). Lists of pictures have no blank row: the photo picker adds those.
 */
function blankRow(type: SectionType, pattern: string): unknown | null {
  const json = jsonFor(type)
  if (!json) return null
  let s: Json | null = json
  for (const seg of pattern.split('/').slice(1)) s = seg === '*' ? s?.items ?? null : s?.properties?.[seg] ?? null
  const item = s?.items
  if (!item?.properties) return null
  const labels = itemLabels(type, pattern)
  const row: Record<string, unknown> = {}
  for (const key of item.required ?? []) {
    const p = item.properties[key] as Json & { enum?: string[] }
    if (key === 'start') row[key] = '11:00'
    else if (key === 'end') row[key] = '14:00'
    else if (p.enum?.length) row[key] = p.enum[0]
    else if (p.type === 'string') row[key] = `[[${labels.get(key) ?? 'New item'}]]`.slice(0, p.maxLength ?? 80)
    else if (p.type === 'array') row[key] = []
    else if (p.type === 'boolean') row[key] = false
    else return null // something only a picker can fill (a picture)
  }
  return row
}

/** Props for a newly added section: the kit's own example of that section, else a blank one. */
export function starterProps(doc: SiteDoc, type: SectionType): Record<string, unknown> | null {
  const kit = kitDefinition(doc.kitId)
  const example = kit?.template({ name: doc.business.name }).pages.flatMap((p) => p.sections).find((s) => s.type === type)
  if (example) return structuredClone(example.props) as Record<string, unknown>
  const json = jsonFor(type)
  if (!json?.properties) return null
  const labels = new Map(INSPECTORS[type].filter((f) => f.path.split('/').length === 2).map((f) => [f.path.slice(1), f.label]))
  const out: Record<string, unknown> = {}
  for (const key of json.required ?? []) {
    const p = json.properties[key] as Json & { enum?: string[] }
    if (p.enum?.length) out[key] = p.enum[0]
    else if (p.type === 'string') out[key] = `[[${labels.get(key) ?? 'Add text'}]]`.slice(0, p.maxLength ?? 80)
    else if (p.type === 'array') out[key] = []
    else if (p.type === 'boolean') out[key] = false
    else return null
  }
  return out
}

/** Sections an owner can add from the editor: the kit's, minus the header and footer every page has. */
export function addableSections(doc: SiteDoc): { type: SectionType; variant: string; label: string }[] {
  const kit = kitDefinition(doc.kitId)
  if (!kit) return []
  return kit.allowedSections
    .filter((t) => t !== 'header' && t !== 'footer')
    .map((t) => ({ type: t, variant: (kit.defaultVariants as Partial<Record<SectionType, string>>)[t] ?? SECTION_DEFS[t].variants[0], label: SECTION_LABELS[t] }))
}

export const SECTION_LABELS: Record<SectionType, string> = {
  header: 'Header', hero: 'Big welcome', about: 'About', services: 'Services', menu: 'Menu', schedule: 'Where we’ll be',
  gallery: 'Photo gallery', hours_location: 'Hours and location', testimonials: 'Reviews', faq: 'Questions', team: 'Team',
  cta_band: 'Call to action', contact_form: 'Contact form', booking: 'Booking', catering_request: 'Catering request', today: 'Today', footer: 'Footer',
}

export const VARIANT_LABELS: Record<string, string> = {
  bar: 'Bar', centered: 'Centered', split: 'Side by side', fullbleed: 'Full photo', minimal: 'Simple', 'left-image': 'Photo on the left',
  'right-image': 'Photo on the right', 'text-only': 'Text only', cards: 'Cards', list: 'List', columns: 'Columns', week: 'Week', grid: 'Grid',
  masonry: 'Mosaic', card: 'Card', single: 'One at a time', accordion: 'Fold-out', solid: 'Solid', outline: 'Outline', simple: 'Simple',
  'with-details': 'With your details', banner: 'Banner',
}
