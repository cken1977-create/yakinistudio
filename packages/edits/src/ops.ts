import { z } from 'zod'
import { kitDefinition, type KitDefinition } from '@yakini/kits'
import { isEditablePath, INSPECTORS } from '@yakini/sections/inspectors'
import {
  Id, SECTION_DEFS, SECTION_TYPES, validateNewDoc, type Page, type Section, type SectionType, type SiteDoc,
} from '@yakini/site-schema'
import { getAt, setAt } from './pointer'

/**
 * Editor operations (spec 8.7, 10.3-10.5). One vocabulary for click edits, chat edits, undo and
 * redo. Every batch is applied to a copy of the doc and the whole result is validated before it
 * is accepted, so a bad op can never leave a half-changed or invalid draft.
 *
 * Brand colors and logo are not reachable from any op (R6): `brand` is never written here.
 */

const Pointer = z.string().regex(/^(\/[A-Za-z0-9_]+)+$/, 'A field path looks like /headline or /items/0/title').max(200)
const SectionTypeSchema = z.enum(SECTION_TYPES as unknown as [SectionType, ...SectionType[]])
export const BUSINESS_FIELDS = ['tagline', 'phone', 'email', 'address', 'hours', 'serviceArea', 'social'] as const

/** Ops the AI may call (8.7) and the click editor uses. */
export const PublicEditOp = z.discriminatedUnion('op', [
  z.object({ op: z.literal('update_field'), pageId: Id, sectionId: Id, path: Pointer, value: z.unknown().optional() }).strict(),
  z.object({ op: z.literal('update_business'), field: z.enum(BUSINESS_FIELDS), value: z.unknown().optional() }).strict(),
  z.object({
    op: z.literal('add_section'), pageId: Id, afterSectionId: Id.nullable(), type: SectionTypeSchema,
    variant: z.string().max(40), props: z.record(z.string(), z.unknown()), id: Id.optional(),
  }).strict(),
  z.object({ op: z.literal('remove_section'), pageId: Id, sectionId: Id }).strict(),
  z.object({ op: z.literal('move_section'), pageId: Id, sectionId: Id, toIndex: z.number().int().min(0).max(19) }).strict(),
  z.object({ op: z.literal('duplicate_section'), pageId: Id, sectionId: Id, newId: Id.optional() }).strict(),
  z.object({ op: z.literal('set_section_variant'), pageId: Id, sectionId: Id, variant: z.string().max(40) }).strict(),
  z.object({ op: z.literal('set_section_hidden'), pageId: Id, sectionId: Id, hidden: z.boolean() }).strict(),
  z.object({ op: z.literal('set_image'), pageId: Id, sectionId: Id, path: Pointer, assetId: z.uuid(), alt: z.string().min(1).max(200) }).strict(),
  z.object({ op: z.literal('add_page'), template: Id, title: z.string().min(1).max(80), slug: Id, id: Id.optional() }).strict(),
  z.object({ op: z.literal('remove_page'), pageId: Id }).strict(),
  z.object({ op: z.literal('rename_page'), pageId: Id, title: z.string().min(1).max(80), slug: Id.optional() }).strict(),
  z.object({ op: z.literal('move_page'), pageId: Id, toIndex: z.number().int().min(0).max(11) }).strict(),
  z.object({ op: z.literal('set_seo'), pageId: Id.nullable(), title: z.string().max(70).optional(), description: z.string().max(160).optional() }).strict(),
])
export type PublicEditOp = z.infer<typeof PublicEditOp>

/** Ops only the editor itself produces, to undo a removal exactly. Never accepted from the AI. */
const InternalEditOp = z.discriminatedUnion('op', [
  z.object({ op: z.literal('restore_section'), pageId: Id, index: z.number().int().min(0), section: z.record(z.string(), z.unknown()) }).strict(),
  z.object({
    op: z.literal('restore_doc_parts'), pages: z.array(z.record(z.string(), z.unknown())),
    nav: z.record(z.string(), z.unknown()), footer: z.record(z.string(), z.unknown()),
  }).strict(),
  z.object({ op: z.literal('set_seo_raw'), pageId: Id.nullable(), seo: z.record(z.string(), z.unknown()).nullable() }).strict(),
  z.object({ op: z.literal('rename_page_raw'), pageId: Id, title: z.string(), slug: z.string(), navLabel: z.string().nullable() }).strict(),
])
export const EditOp = z.union([PublicEditOp, InternalEditOp])
export type EditOp = z.infer<typeof EditOp>

export type EditContext = {
  /** Asset ids this tenant may use (its own assets plus its kit's samples). */
  allowedAssetIds: ReadonlySet<string>
  /** Max pages on the plan (template plan: 5). */
  maxPages?: number
  /** Id generator for new sections/pages; tests pass a deterministic one. */
  newId?: (prefix: string) => string
}

export type ApplyResult =
  | { ok: true; doc: SiteDoc; applied: EditOp[]; inverse: EditOp[]; changed: Set<string> }
  | { ok: false; error: string; opIndex: number | null }

const DEFAULT_MAX_PAGES = 5

function randomId(prefix: string): string {
  const bytes = new Uint8Array(4)
  globalThis.crypto.getRandomValues(bytes)
  return `${prefix.slice(0, 30)}-${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`
}

class EditError extends Error {}
const fail = (msg: string): never => { throw new EditError(msg) }

function pageOf(doc: SiteDoc, pageId: string): Page {
  return doc.pages.find((p) => p.id === pageId) ?? fail(`There is no page "${pageId}".`)
}
function sectionIndex(page: Page, sectionId: string): number {
  const i = page.sections.findIndex((s) => s.id === sectionId)
  return i >= 0 ? i : fail(`There is no section "${sectionId}" on ${page.title}.`)
}
function kitOf(doc: SiteDoc): KitDefinition {
  return kitDefinition(doc.kitId) ?? fail('This kind of site cannot be edited yet.')
}
const clone = <T>(v: T): T => structuredClone(v)
function uniqueId(prefix: string, taken: Set<string>, gen: (p: string) => string): string {
  for (let i = 0; i < 20; i++) {
    const id = gen(prefix)
    if (!taken.has(id)) return id
  }
  return fail('Could not make a new id.')
}

/**
 * Apply one op to `doc` in place. Returns the op as applied (with any generated ids filled in, so
 * redo is exact) and the ops that undo it.
 */
function applyOne(doc: SiteDoc, op: EditOp, ctx: EditContext, changed: Set<string>): { applied: EditOp; inverse: EditOp[] } {
  const gen = ctx.newId ?? randomId
  switch (op.op) {
    case 'update_field': {
      const page = pageOf(doc, op.pageId)
      const s = page.sections[sectionIndex(page, op.sectionId)]
      if (!isEditablePath(s.type, op.path)) fail(`"${op.path}" can't be changed on a ${s.type.replace('_', ' ')} section.`)
      const before = getAt(s.props, op.path)
      setAt(s.props, op.path, clone(op.value))
      changed.add(`${page.id}/${s.id}`)
      return { applied: op, inverse: [{ op: 'update_field', pageId: op.pageId, sectionId: op.sectionId, path: op.path, ...(before === undefined ? {} : { value: clone(before) }) }] }
    }
    case 'update_business': {
      const before = (doc.business as Record<string, unknown>)[op.field]
      if (op.value === undefined) delete (doc.business as Record<string, unknown>)[op.field]
      else (doc.business as Record<string, unknown>)[op.field] = clone(op.value)
      changed.add('business')
      return { applied: op, inverse: [{ op: 'update_business', field: op.field, ...(before === undefined ? {} : { value: clone(before) }) }] }
    }
    case 'add_section': {
      const kit = kitOf(doc)
      if (!kit.allowedSections.includes(op.type)) fail(`A ${op.type.replace('_', ' ')} section isn't part of this kit.`)
      if (op.type === 'header' || op.type === 'footer') fail('Every page already has its header and footer.')
      if (!(SECTION_DEFS[op.type].variants as readonly string[]).includes(op.variant)) fail(`"${op.variant}" isn't a style for this section.`)
      const page = pageOf(doc, op.pageId)
      if (page.sections.length >= 20) fail('A page can have at most 20 sections.')
      const at = op.afterSectionId === null ? 1 : sectionIndex(page, op.afterSectionId) + 1
      // Keep the footer last.
      const footerAt = page.sections.findIndex((s) => s.type === 'footer')
      const index = footerAt >= 0 ? Math.min(at, footerAt) : at
      const id = op.id ?? uniqueId(op.type.replace('_', '-'), new Set(page.sections.map((s) => s.id)), gen)
      page.sections.splice(index, 0, { id, type: op.type, variant: op.variant, hidden: false, props: clone(op.props) } as unknown as Section)
      changed.add(`${page.id}/${id}`)
      return { applied: { ...op, id }, inverse: [{ op: 'remove_section', pageId: page.id, sectionId: id }] }
    }
    case 'remove_section': {
      const page = pageOf(doc, op.pageId)
      const i = sectionIndex(page, op.sectionId)
      const s = page.sections[i]
      if (s.type === 'header' || s.type === 'footer') fail('The header and footer stay on every page. You can hide parts of them instead.')
      page.sections.splice(i, 1)
      changed.add(page.id)
      return { applied: op, inverse: [{ op: 'restore_section', pageId: page.id, index: i, section: clone(s) as Record<string, unknown> }] }
    }
    case 'restore_section': {
      const page = pageOf(doc, op.pageId)
      page.sections.splice(Math.min(op.index, page.sections.length), 0, clone(op.section) as unknown as Section)
      const id = String(op.section.id)
      changed.add(`${page.id}/${id}`)
      return { applied: op, inverse: [{ op: 'remove_section', pageId: page.id, sectionId: id }] }
    }
    case 'move_section': {
      const page = pageOf(doc, op.pageId)
      const from = sectionIndex(page, op.sectionId)
      const s = page.sections[from]
      if (s.type === 'header' || s.type === 'footer') fail('The header stays at the top and the footer at the bottom.')
      const first = page.sections[0]?.type === 'header' ? 1 : 0
      const last = page.sections[page.sections.length - 1]?.type === 'footer' ? page.sections.length - 2 : page.sections.length - 1
      const to = Math.max(first, Math.min(op.toIndex, last))
      page.sections.splice(from, 1)
      page.sections.splice(to, 0, s)
      changed.add(`${page.id}/${s.id}`)
      return { applied: { ...op, toIndex: to }, inverse: [{ op: 'move_section', pageId: page.id, sectionId: s.id, toIndex: from }] }
    }
    case 'duplicate_section': {
      const page = pageOf(doc, op.pageId)
      const i = sectionIndex(page, op.sectionId)
      const s = page.sections[i]
      if (s.type === 'header' || s.type === 'footer') fail('The header and footer can\'t be copied.')
      if (page.sections.length >= 20) fail('A page can have at most 20 sections.')
      const id = op.newId ?? uniqueId(s.id.replace(/-[0-9a-f]{8}$/, ''), new Set(page.sections.map((x) => x.id)), gen)
      page.sections.splice(i + 1, 0, { ...clone(s), id })
      changed.add(`${page.id}/${id}`)
      return { applied: { ...op, newId: id }, inverse: [{ op: 'remove_section', pageId: page.id, sectionId: id }] }
    }
    case 'set_section_variant': {
      const page = pageOf(doc, op.pageId)
      const s = page.sections[sectionIndex(page, op.sectionId)]
      if (!(SECTION_DEFS[s.type].variants as readonly string[]).includes(op.variant)) fail(`"${op.variant}" isn't a style for this section.`)
      const before = s.variant
      ;(s as { variant: string }).variant = op.variant
      changed.add(`${page.id}/${s.id}`)
      return { applied: op, inverse: [{ op: 'set_section_variant', pageId: page.id, sectionId: s.id, variant: before }] }
    }
    case 'set_section_hidden': {
      const page = pageOf(doc, op.pageId)
      const s = page.sections[sectionIndex(page, op.sectionId)]
      const before = s.hidden
      s.hidden = op.hidden
      changed.add(`${page.id}/${s.id}`)
      return { applied: op, inverse: [{ op: 'set_section_hidden', pageId: page.id, sectionId: s.id, hidden: before }] }
    }
    case 'set_image': {
      if (!ctx.allowedAssetIds.has(op.assetId)) fail('That photo isn\'t one of yours. Upload it first, then pick it.')
      const page = pageOf(doc, op.pageId)
      const s = page.sections[sectionIndex(page, op.sectionId)]
      const field = INSPECTORS[s.type].find((f) => f.kind === 'image' && pathMatches(f.path, op.path))
      if (!field) fail(`"${op.path}" isn't a photo on this section.`)
      const before = getAt(s.props, op.path)
      const prev = before && typeof before === 'object' ? (before as Record<string, unknown>) : {}
      setAt(s.props, op.path, { ...(prev.focal ? { focal: prev.focal } : {}), assetId: op.assetId, alt: op.alt })
      changed.add(`${page.id}/${s.id}`)
      return { applied: op, inverse: [{ op: 'update_field', pageId: page.id, sectionId: s.id, path: op.path, ...(before === undefined ? {} : { value: clone(before) }) }] }
    }
    case 'add_page': {
      const kit = kitOf(doc)
      const max = Math.min(ctx.maxPages ?? DEFAULT_MAX_PAGES, 12)
      if (doc.pages.length >= max) fail(`Your plan has room for ${max} pages. Remove one first, or ask Yakini about more.`)
      const tpl = kit.template({ name: doc.business.name }).pages.find((p) => p.id === op.template)
      if (!tpl) fail(`"${op.template}" isn't a page this kit offers.`)
      if (doc.pages.some((p) => p.slug === op.slug)) fail(`There's already a page at /${op.slug}.`)
      const taken = new Set(doc.pages.map((p) => p.id))
      const id = op.id ?? (taken.has(op.slug) ? uniqueId(op.slug, taken, gen) : op.slug)
      const page: Page = { ...clone(tpl!) as Page, id, slug: op.slug, title: op.title }
      doc.pages.push(page)
      if (doc.nav.items.length < 7) doc.nav.items.push({ label: op.title.slice(0, 30), pageId: id })
      changed.add(id)
      return { applied: { ...op, id }, inverse: [{ op: 'remove_page', pageId: id }] }
    }
    case 'remove_page': {
      const i = doc.pages.findIndex((p) => p.id === op.pageId)
      if (i < 0) fail(`There is no page "${op.pageId}".`)
      const page = doc.pages[i]
      if (page.slug === '') fail('The home page can\'t be removed.')
      const before: EditOp = { op: 'restore_doc_parts', pages: clone(doc.pages) as unknown as Record<string, unknown>[], nav: clone(doc.nav) as unknown as Record<string, unknown>, footer: clone(doc.footer) as unknown as Record<string, unknown> }
      const formKeys = new Set(page.sections.flatMap((s) => ('formKey' in s.props ? [String((s.props as { formKey: string }).formKey)] : [])))
      doc.pages.splice(i, 1)
      doc.nav.items = doc.nav.items.filter((n) => n.pageId !== page.id)
      // Buttons and links that pointed at the removed page now go to the home page.
      const home = doc.pages.find((p) => p.slug === '')!
      const hasBooking = doc.pages.some((p) => p.sections.some((s) => s.type === 'booking'))
      const repoint = (v: unknown): unknown => {
        if (Array.isArray(v)) return v.map(repoint)
        if (!v || typeof v !== 'object') return v
        const o = v as Record<string, unknown>
        if ((o.kind === 'page' || o.kind === 'section') && o.pageId === page.id) return { kind: 'page', pageId: home.id }
        if (o.kind === 'form' && typeof o.formKey === 'string' && formKeys.has(o.formKey)) return { kind: 'page', pageId: home.id }
        if (o.kind === 'booking' && Object.keys(o).length === 1 && !hasBooking) return { kind: 'page', pageId: home.id }
        return Object.fromEntries(Object.entries(o).map(([k, x]) => [k, repoint(x)]))
      }
      doc.nav = repoint(doc.nav) as SiteDoc['nav']
      doc.footer = repoint(doc.footer) as SiteDoc['footer']
      for (const p of doc.pages) p.sections = p.sections.map((s) => ({ ...s, props: repoint(s.props) })) as Page['sections']
      changed.add('nav')
      return { applied: op, inverse: [before] }
    }
    case 'restore_doc_parts': {
      doc.pages = clone(op.pages) as unknown as Page[]
      doc.nav = clone(op.nav) as unknown as SiteDoc['nav']
      doc.footer = clone(op.footer) as unknown as SiteDoc['footer']
      changed.add('nav')
      return { applied: op, inverse: [] }
    }
    case 'rename_page':
    case 'rename_page_raw': {
      const page = pageOf(doc, op.pageId)
      const nav = doc.nav.items.find((n) => n.pageId === page.id)
      const before: EditOp = { op: 'rename_page_raw', pageId: page.id, title: page.title, slug: page.slug, navLabel: nav?.label ?? null }
      if (op.op === 'rename_page') {
        if (op.slug !== undefined && page.slug === '') fail('The home page always lives at the main address.')
        if (op.slug !== undefined && doc.pages.some((p) => p.id !== page.id && p.slug === op.slug)) fail(`There's already a page at /${op.slug}.`)
        page.title = op.title
        if (op.slug !== undefined) page.slug = op.slug
        if (nav) nav.label = op.title.slice(0, 30)
      } else {
        page.title = op.title
        page.slug = op.slug
        if (nav && op.navLabel !== null) nav.label = op.navLabel
      }
      changed.add(page.id)
      changed.add('nav')
      return { applied: op, inverse: [before] }
    }
    case 'move_page': {
      const from = doc.pages.findIndex((p) => p.id === op.pageId)
      if (from < 0) fail(`There is no page "${op.pageId}".`)
      if (doc.pages[from].slug === '') fail('The home page stays first.')
      const to = Math.max(1, Math.min(op.toIndex, doc.pages.length - 1))
      const [page] = doc.pages.splice(from, 1)
      doc.pages.splice(to, 0, page)
      // Keep the menu in page order.
      const order = new Map(doc.pages.map((p, i) => [p.id, i]))
      doc.nav.items.sort((a, b) => (order.get(a.pageId) ?? 99) - (order.get(b.pageId) ?? 99))
      changed.add('nav')
      return { applied: { ...op, toIndex: to }, inverse: [{ op: 'move_page', pageId: page.id, toIndex: from }] }
    }
    case 'set_seo':
    case 'set_seo_raw': {
      if (op.pageId === null) {
        const before = clone(doc.seo) as unknown as Record<string, unknown>
        if (op.op === 'set_seo') {
          if (op.title !== undefined) doc.seo.siteTitle = op.title
          if (op.description !== undefined) doc.seo.description = op.description
        } else if (op.seo) doc.seo = clone(op.seo) as unknown as SiteDoc['seo']
        changed.add('seo')
        return { applied: op, inverse: [{ op: 'set_seo_raw', pageId: null, seo: before }] }
      }
      const page = pageOf(doc, op.pageId)
      const before = page.seo ? (clone(page.seo) as Record<string, unknown>) : null
      if (op.op === 'set_seo') {
        page.seo = { ...(page.seo ?? {}), ...(op.title !== undefined ? { title: op.title } : {}), ...(op.description !== undefined ? { description: op.description } : {}) }
      } else if (op.seo) page.seo = clone(op.seo) as Page['seo']
      else delete page.seo
      changed.add(`${page.id}/seo`)
      return { applied: op, inverse: [{ op: 'set_seo_raw', pageId: page.id, seo: before }] }
    }
  }
}

function pathMatches(pattern: string, path: string): boolean {
  const a = pattern.split('/'), b = path.split('/')
  return a.length === b.length && a.every((p, i) => (p === '*' ? /^\d{1,3}$/.test(b[i]) : p === b[i]))
}

/**
 * Apply a batch of ops to a copy of `doc`. All or nothing: if any op is refused, or the result
 * is not a valid site, the original doc is untouched and a plain-English reason comes back.
 */
export function applyOps(doc: SiteDoc, ops: readonly unknown[], ctx: EditContext, opts: { internal?: boolean } = {}): ApplyResult {
  const work = clone(doc)
  const applied: EditOp[] = []
  const inverse: EditOp[] = []
  const changed = new Set<string>()
  for (let i = 0; i < ops.length; i++) {
    const parsed = (opts.internal ? EditOp : PublicEditOp).safeParse(ops[i])
    if (!parsed.success) return { ok: false, error: parsed.error.issues.map((x) => `${x.path.join('.') || 'op'}: ${x.message}`).slice(0, 5).join('; '), opIndex: i }
    try {
      const r = applyOne(work, parsed.data, ctx, changed)
      applied.push(r.applied)
      inverse.unshift(...r.inverse)
    } catch (e) {
      if (e instanceof EditError) return { ok: false, error: e.message, opIndex: i }
      return { ok: false, error: e instanceof Error ? e.message : 'That change could not be made.', opIndex: i }
    }
  }
  if (JSON.stringify(work.brand) !== JSON.stringify(doc.brand)) return { ok: false, error: 'Brand colors and logo are changed in Brand settings.', opIndex: null }
  const v = validateNewDoc(work)
  if (!v.ok) return { ok: false, error: v.issues.slice(0, 3).join('; '), opIndex: null }
  return { ok: true, doc: v.doc, applied, inverse, changed }
}
