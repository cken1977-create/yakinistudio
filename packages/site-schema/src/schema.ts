/**
 * SiteDoc: the single definition of a valid site (spec 7.1). Shared by the AI tools,
 * API routes, editor and renderer. Limits are part of the schema; anything over a
 * limit is rejected.
 *
 * Phase 0 note: per-section `props` are a bounded plain-data record here. The
 * per-type props schemas (spec 7.2) arrive with the section library in Phase 1,
 * together with schema fixtures for every type and variant.
 */
import { z } from 'zod'
import { KITS, type KitId } from '@yakini/pricing'

export const CURRENT_SCHEMA_VERSION = 1 as const

const kitIds = KITS.map((k) => k.id) as [KitId, ...KitId[]]
export const KitIdSchema = z.enum(kitIds)

export const HexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Colors are stored as 6-digit hex, e.g. #1a2b3c')
export const E164 = z.string().regex(/^\+[1-9]\d{6,14}$/, 'Phone numbers use the +1XXXXXXXXXX format')
export const HttpsUrl = z
  .string()
  .max(2048)
  .refine((v) => {
    try { return new URL(v).protocol === 'https:' } catch { return false }
  }, 'Links must start with https://')
const Id = z.string().regex(/^[a-z0-9-]{1,40}$/)
const HHMM = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
const Day = z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])

export const LinkTarget = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('page'), pageId: Id }).strict(),
  z.object({ kind: z.literal('section'), pageId: Id, sectionId: Id }).strict(),
  z.object({ kind: z.literal('url'), url: HttpsUrl }).strict(),
  z.object({ kind: z.literal('tel'), phone: E164 }).strict(),
  z.object({ kind: z.literal('mailto'), email: z.email().max(254) }).strict(),
  z.object({ kind: z.literal('booking') }).strict(),
  z.object({ kind: z.literal('form'), formKey: Id }).strict(),
])
export type LinkTarget = z.infer<typeof LinkTarget>

export const RichText = z
  .array(
    z.object({
      type: z.enum(['p', 'h3', 'ul']),
      children: z
        .array(
          z.object({
            text: z.string().max(1500),
            bold: z.boolean().optional(),
            italic: z.boolean().optional(),
            link: LinkTarget.optional(),
          }).strict(),
        )
        .max(50),
    }).strict(),
  )
  .max(40)
export type RichText = z.infer<typeof RichText>

export const ImageRef = z.object({
  assetId: z.uuid(),
  alt: z.string().min(1).max(160),
  focal: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).strict().optional(),
}).strict()
export type ImageRef = z.infer<typeof ImageRef>

export const SECTION_TYPES = [
  'header', 'hero', 'about', 'services', 'menu', 'schedule', 'gallery', 'hours_location',
  'testimonials', 'faq', 'team', 'cta_band', 'contact_form', 'booking', 'catering_request',
  'today', 'footer',
] as const
export const SectionType = z.enum(SECTION_TYPES)
export type SectionType = z.infer<typeof SectionType>

/** Plain JSON data only (no functions, no HTML is ever rendered from it). */
type Json = string | number | boolean | null | Json[] | { [k: string]: Json }
const JsonValue: z.ZodType<Json> = z.lazy(() =>
  z.union([z.string().max(5000), z.number(), z.boolean(), z.null(), z.array(JsonValue).max(200), z.record(z.string().max(60), JsonValue)]),
)

export const Section = z.object({
  id: Id,
  type: SectionType,
  variant: z.string().regex(/^[a-z0-9-]{1,30}$/),
  hidden: z.boolean(),
  props: z.record(z.string().max(60), JsonValue),
}).strict()
export type Section = z.infer<typeof Section>

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

export const SiteDocV1 = z.object({
  schemaVersion: z.literal(1),
  kitId: KitIdSchema,
  locale: z.literal('en-US'),
  business: z.object({
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
      kind: z.enum(['facebook', 'instagram', 'tiktok', 'youtube', 'x', 'linkedin', 'yelp', 'google']),
      url: HttpsUrl,
    }).strict()).max(8).optional(),
  }).strict(),
  /** READ-ONLY to AI and operators (R6). Stored hex values are never modified. */
  brand: z.object({
    logo: z.object({ assetId: z.uuid(), alt: z.string().min(1).max(120) }).strict().optional(),
    colors: z.object({ primary: HexColor, secondary: HexColor, accent: HexColor }).strict(),
    colorsSource: z.enum(['extracted', 'owner', 'kit-default']),
    fontPair: z.enum(['editorial', 'modern', 'friendly', 'classic']),
  }).strict(),
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
  integrations: z.object({
    portalRoomId: z.uuid().optional(),
    bookingEnabled: z.boolean(),
    formsEnabled: z.boolean(),
  }).strict(),
}).strict().superRefine((doc, ctx) => {
  const ids = new Set<string>()
  const slugs = new Set<string>()
  for (const p of doc.pages) {
    if (ids.has(p.id)) ctx.addIssue({ code: 'custom', message: `Duplicate page id "${p.id}"`, path: ['pages'] })
    if (slugs.has(p.slug)) ctx.addIssue({ code: 'custom', message: `Duplicate page address "${p.slug || '(home)'}"`, path: ['pages'] })
    ids.add(p.id); slugs.add(p.slug)
  }
  for (const item of doc.nav.items) {
    if (!ids.has(item.pageId)) ctx.addIssue({ code: 'custom', message: `Menu links to a missing page "${item.pageId}"`, path: ['nav'] })
  }
})

export const SiteDoc = SiteDocV1
export type SiteDoc = z.infer<typeof SiteDoc>

/** Max stored size of a draft doc (matches the DB check on sites.draft_doc). */
export const MAX_DOC_BYTES = 200 * 1024

/** JSON Schema for the AI tools (spec 7.1). */
export function siteDocJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(SiteDocV1, { unrepresentable: 'any' }) as Record<string, unknown>
}
