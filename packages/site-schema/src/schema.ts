/**
 * SiteDoc: the single definition of a valid site (spec 7.1). Shared by the AI tools,
 * API routes, editor and renderer. Limits are part of the schema; anything over a
 * limit is rejected.
 *
 * Phase 1: sections are validated per type (spec 7.2, `sections.ts`), and the whole doc is
 * checked for integrity: unique page and section ids, menu links and in-site links that point
 * at real pages/sections, and form links that point at a real form.
 */
import { z } from 'zod'
import { KITS, SITE_ONLY_KIT_IDS, type SiteKitId } from '@yakini/pricing'
import { Day, E164, HexColor, HHMM, HttpsUrl, Id, LinkTarget, Section } from './sections'

export * from './sections'

export const CURRENT_SCHEMA_VERSION = 2 as const

const kitIds = [...KITS.map((k) => k.id), ...SITE_ONLY_KIT_IDS] as unknown as [SiteKitId, ...SiteKitId[]]
export const KitIdSchema = z.enum(kitIds)

/**
 * Font pairs. The first five are the original ones (classic sites keep them).
 * D3 adds `paper` (editorial), `poster`, `craft` and `clean`.
 */
export const FONT_PAIRS = ['editorial', 'modern', 'friendly', 'classic', 'signature', 'paper', 'poster', 'craft', 'clean'] as const
export type FontPair = (typeof FONT_PAIRS)[number]

/**
 * Art direction (design v2, plan 6.1). `classic` is the original look, given to every v1 doc on
 * read. Presets never change brand colors (R6) or content.
 */
export const STYLE_PRESETS = ['classic', 'signature', 'editorial', 'poster', 'craft', 'clean'] as const
export type StylePreset = (typeof STYLE_PRESETS)[number]
export const Style = z.object({
  preset: z.enum(STYLE_PRESETS),
  /** Page ground. `dark` uses brand.colors.secondary exactly as stored. */
  surface: z.enum(['dark', 'light']),
  /** Moves here from brand; brand.fontPair stays for v1 docs. */
  fontPair: z.enum(FONT_PAIRS),
  radius: z.enum(['none', 'soft', 'round']),
  motion: z.enum(['full', 'subtle', 'off']),
}).strict()
export type Style = z.infer<typeof Style>

export const SOCIAL_KINDS = ['facebook', 'instagram', 'tiktok', 'youtube', 'x', 'linkedin', 'yelp', 'google'] as const

export const Page = z.object({
  id: Id,
  slug: z.union([z.literal(''), Id]),
  title: z.string().min(1).max(80),
  seo: z.object({
    title: z.string().max(70).optional(),
    description: z.string().max(160).optional(),
    noindex: z.boolean().optional(),
  }).strict().optional(),
  sections: z.array(Section).min(1).max(20),
}).strict()
export type Page = z.infer<typeof Page>

export const HARD_MAX_PAGES = 12
export const TEMPLATE_PLAN_MAX_PAGES = 5

export const Business = z.object({
  name: z.string().min(1).max(120),
  tagline: z.string().max(160).optional(),
  phone: E164.optional(),
  email: z.email().max(254).optional(),
  address: z.object({
    line1: z.string().min(1).max(120),
    line2: z.string().max(120).optional(),
    city: z.string().min(1).max(80),
    region: z.string().min(1).max(40),
    postal: z.string().min(1).max(12),
    country: z.literal('US'),
  }).strict().optional(),
  hours: z.array(z.union([
    z.object({ day: Day, open: HHMM, close: HHMM }).strict(),
    z.object({ day: Day, closed: z.literal(true) }).strict(),
  ])).max(14).optional(),
  serviceArea: z.string().max(200).optional(),
  social: z.array(z.object({
    kind: z.enum(SOCIAL_KINDS),
    url: HttpsUrl,
  }).strict()).max(8).optional(),
}).strict()
export type Business = z.infer<typeof Business>

/** READ-ONLY to AI and operators (R6). Stored hex values are never modified. */
export const Brand = z.object({
  logo: z.object({ assetId: z.uuid(), alt: z.string().min(1).max(120) }).strict().optional(),
  colors: z.object({ primary: HexColor, secondary: HexColor, accent: HexColor }).strict(),
  colorsSource: z.enum(['extracted', 'owner', 'kit-default']),
  fontPair: z.enum(FONT_PAIRS),
}).strict()
export type Brand = z.infer<typeof Brand>

export const Integrations = z.object({
  portalRoomId: z.uuid().optional(),
  bookingEnabled: z.boolean(),
  formsEnabled: z.boolean(),
}).strict()
export type Integrations = z.infer<typeof Integrations>

const SiteDocV1Object = z.object({
  schemaVersion: z.literal(1),
  kitId: KitIdSchema,
  locale: z.literal('en-US'),
  business: Business,
  brand: Brand,
  nav: z.object({
    items: z.array(z.object({ label: z.string().min(1).max(30), pageId: Id }).strict()).max(7),
    cta: z.object({ label: z.string().min(1).max(30), target: LinkTarget }).strict().optional(),
  }).strict(),
  pages: z.array(Page).min(1).max(HARD_MAX_PAGES),
  footer: z.object({
    showHours: z.boolean(),
    showAddress: z.boolean(),
    legalName: z.string().max(160).optional(),
    extraLinks: z.array(LinkTarget).max(6).optional(),
    /** "Site by Yakini" link: on by default, owner can hide it (Q6). */
    showSiteByYakini: z.boolean().default(true),
  }).strict(),
  seo: z.object({
    siteTitle: z.string().max(70),
    description: z.string().max(160),
    ogImageAssetId: z.uuid().optional(),
  }).strict(),
  integrations: Integrations,
}).strict()

type DocLike = Pick<z.infer<typeof SiteDocV1Object>, 'pages' | 'nav' | 'footer'>

const LINK_KINDS = new Set(['page', 'section', 'url', 'tel', 'mailto', 'booking', 'form'])
const LINK_KEYS = new Set(['kind', 'pageId', 'sectionId', 'url', 'phone', 'email', 'formKey'])

/** Walk any JSON value and call `fn` for every object that is shaped like a LinkTarget. */
function eachLink(value: unknown, fn: (link: LinkTarget) => void): void {
  if (Array.isArray(value)) { for (const v of value) eachLink(v, fn); return }
  if (!value || typeof value !== 'object') return
  const o = value as Record<string, unknown>
  if (typeof o.kind === 'string' && LINK_KINDS.has(o.kind) && Object.keys(o).every((k) => LINK_KEYS.has(k))) {
    fn(o as LinkTarget)
    return
  }
  for (const v of Object.values(o)) eachLink(v, fn)
}

/** Every LinkTarget in a doc (nav, footer and section props). */
export function linksIn(doc: DocLike): LinkTarget[] {
  const out: LinkTarget[] = []
  eachLink([doc.nav, doc.footer, doc.pages.map((p) => p.sections.map((s) => s.props))], (l) => out.push(l))
  return out
}

/** Integrity checks shared by the full doc and the AI content schema. */
function checkIntegrity(doc: DocLike, ctx: z.RefinementCtx): void {
  const pageIds = new Set<string>()
  const slugs = new Set<string>()
  const sectionsByPage = new Map<string, Set<string>>()
  const formKeys = new Set<string>()
  doc.pages.forEach((p, i) => {
    if (pageIds.has(p.id)) ctx.addIssue({ code: 'custom', message: `Duplicate page id "${p.id}"`, path: ['pages', i, 'id'] })
    if (slugs.has(p.slug)) ctx.addIssue({ code: 'custom', message: `Duplicate page address "${p.slug || '(home)'}"`, path: ['pages', i, 'slug'] })
    pageIds.add(p.id); slugs.add(p.slug)
    const ids = new Set<string>()
    p.sections.forEach((s, j) => {
      if (ids.has(s.id)) ctx.addIssue({ code: 'custom', message: `Duplicate section id "${s.id}" on page "${p.id}"`, path: ['pages', i, 'sections', j, 'id'] })
      ids.add(s.id)
      if (s.type === 'contact_form' || s.type === 'catering_request') {
        if (formKeys.has(s.props.formKey)) ctx.addIssue({ code: 'custom', message: `Two forms use the key "${s.props.formKey}"`, path: ['pages', i, 'sections', j, 'props', 'formKey'] })
        formKeys.add(s.props.formKey)
      }
    })
    sectionsByPage.set(p.id, ids)
  })
  if (!slugs.has('')) ctx.addIssue({ code: 'custom', message: 'The site needs a home page (address "")', path: ['pages'] })
  doc.nav.items.forEach((item, i) => {
    if (!pageIds.has(item.pageId)) ctx.addIssue({ code: 'custom', message: `Menu links to a missing page "${item.pageId}"`, path: ['nav', 'items', i] })
  })
  for (const link of linksIn(doc)) {
    if ((link.kind === 'page' || link.kind === 'section') && !pageIds.has(link.pageId)) {
      ctx.addIssue({ code: 'custom', message: `A link points to a missing page "${link.pageId}"`, path: ['pages'] })
    } else if (link.kind === 'section' && !sectionsByPage.get(link.pageId)?.has(link.sectionId)) {
      ctx.addIssue({ code: 'custom', message: `A link points to a missing section "${link.sectionId}" on page "${link.pageId}"`, path: ['pages'] })
    } else if (link.kind === 'form' && !formKeys.has(link.formKey)) {
      ctx.addIssue({ code: 'custom', message: `A link points to a missing form "${link.formKey}"`, path: ['pages'] })
    }
  }
}

export const SiteDocV1 = SiteDocV1Object.superRefine(checkIntegrity)

/** Version 2 (design v2): adds `style`. v1 docs migrate on read to the classic look (7.4). */
const SiteDocV2Object = SiteDocV1Object.extend({
  schemaVersion: z.literal(2),
  style: Style,
})
export const SiteDocV2 = SiteDocV2Object.superRefine(checkIntegrity)

export const SiteDoc = SiteDocV2
export type SiteDoc = z.infer<typeof SiteDoc>
/** The shape before defaults are applied (what callers may pass in). */
export type SiteDocInput = z.input<typeof SiteDoc>

/**
 * What the AI fills in (spec 8.5): the SiteDoc minus `brand`, `integrations`, `style` and
 * `schemaVersion`. The server sets those itself, so the model cannot change colors or the logo
 * even if it tries (R6).
 */
export const SiteDocContent = SiteDocV2Object.omit({ schemaVersion: true, brand: true, integrations: true, style: true }).superRefine(checkIntegrity)
export type SiteDocContent = z.infer<typeof SiteDocContent>

/** Max stored size of a draft doc (matches the DB check on sites.draft_doc). */
export const MAX_DOC_BYTES = 200 * 1024

/** JSON Schema for the AI tools (spec 7.1). */
export function siteDocJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(SiteDoc, { unrepresentable: 'any', io: 'input' }) as Record<string, unknown>
}

/** JSON Schema for the `submit_site` tool parameters (spec 8.5). */
export function siteDocContentJsonSchema(): Record<string, unknown> {
  const schema = z.toJSONSchema(SiteDocContent, { unrepresentable: 'any', io: 'input' }) as Record<string, unknown>
  delete schema.$schema
  return schema
}

export function formatIssues(err: z.ZodError, max = 25): string[] {
  const out = err.issues.slice(0, max).map((i) => `${i.path.length ? i.path.join('.') : '(root)'}: ${i.message}`)
  if (err.issues.length > max) out.push(`…and ${err.issues.length - max} more`)
  return out
}

/**
 * Validate a candidate doc that is about to be STORED (a new draft, an AI result). This is not
 * a reader: stored docs are always read through `loadSiteDoc()`. Returns plain-English issues
 * with paths, suitable for sending back to the model on a retry.
 */
export function validateNewDoc(candidate: unknown): { ok: true; doc: SiteDoc } | { ok: false; issues: string[] } {
  const r = SiteDoc.safeParse(candidate)
  if (!r.success) return { ok: false, issues: formatIssues(r.error) }
  const bytes = new TextEncoder().encode(JSON.stringify(r.data)).length
  if (bytes > MAX_DOC_BYTES) return { ok: false, issues: [`The site is too large (${bytes} bytes; max ${MAX_DOC_BYTES}).`] }
  return { ok: true, doc: r.data }
}

/** Validate AI content (spec 8.4/8.5). Same contract as validateNewDoc. */
export function validateContent(candidate: unknown): { ok: true; content: SiteDocContent } | { ok: false; issues: string[] } {
  const r = SiteDocContent.safeParse(candidate)
  return r.success ? { ok: true, content: r.data } : { ok: false, issues: formatIssues(r.error) }
}

export * from './links'
