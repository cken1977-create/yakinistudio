import { lintCopy } from '@yakini/ai'
import { hasPlaceholder } from '@yakini/sections'
import { TEMPLATE_PLAN_MAX_PAGES, type SiteDoc } from '@yakini/site-schema'
import { contrastRatio, AA } from '@yakini/sections'
import { formsOf } from './forms'

/**
 * The pre-publish checklist (spec 11.1), as pure functions over a SiteDoc that already passed
 * loadSiteDoc (item 1). The server adds the items that need the database or the network
 * (ownership, takedown, plan, external links) in lib/server/publish.ts.
 */
export const DOC_MAX_BYTES = 200 * 1024
export const MAX_EXTERNAL_URLS = 20

export type CheckId =
  | 'schema_valid' | 'no_placeholders' | 'contact_info' | 'images_ok' | 'links_ok' | 'copy_lint' | 'forms_wired'
  | 'doc_size' | 'ownership' | 'not_taken_down' | 'plan_active'
  // warnings
  | 'contrast' | 'hours' | 'seo_description' | 'risk_check'

export type CheckItem = { id: CheckId; ok: boolean; blocking: boolean; label: string; detail?: string }

const LABELS: Record<CheckId, string> = {
  schema_valid: 'Your site file is complete',
  no_placeholders: 'Every “fill this in” spot is filled in',
  contact_info: 'Visitors have a way to reach you',
  images_ok: 'Every photo has a description and is yours to use',
  links_ok: 'Every link works',
  copy_lint: 'Wording check passed',
  forms_wired: 'Your forms are connected',
  doc_size: 'Your site is within the size limits',
  ownership: 'You confirmed this is your business',
  not_taken_down: 'Your site is available',
  plan_active: 'Your plan is active',
  contrast: 'Text is easy to read on your colors',
  hours: 'Your hours are listed',
  seo_description: 'Your site has a search description',
  risk_check: 'Safety check',
}

export const item = (id: CheckId, ok: boolean, blocking: boolean, detail?: string): CheckItem =>
  ({ id, ok, blocking, label: LABELS[id], ...(detail ? { detail } : {}) })

/** Every string the visitor can read (skips ids, keys, asset ids and URLs). */
export function visibleText(doc: SiteDoc): string[] {
  const out: string[] = []
  const skip = new Set(['id', 'pageId', 'sectionId', 'assetId', 'ogImageAssetId', 'formKey', 'url', 'kind', 'type', 'variant',
    'slug', 'kitId', 'locale', 'day', 'open', 'close', 'phone', 'email', 'mode', 'colorsSource', 'fontPair', 'emptyBehavior', 'portalRoomId'])
  const walk = (v: unknown, key: string | null): void => {
    if (typeof v === 'string') { if (!key || !skip.has(key)) out.push(v); return }
    if (Array.isArray(v)) { v.forEach((x) => walk(x, key === 'fields' || key === 'tags' ? key : null)); return }
    if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { if (k !== 'brand' && k !== 'integrations') walk(x, k) }
  }
  walk({ business: doc.business, nav: doc.nav, pages: doc.pages, footer: doc.footer, seo: doc.seo }, null)
  return out.filter((s) => s.trim().length > 0)
}

type Link = { kind: string; pageId?: string; sectionId?: string; url?: string }

/** Every LinkTarget object anywhere in the doc. */
export function linksIn(doc: SiteDoc): Link[] {
  const out: Link[] = []
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) { v.forEach(walk); return }
    if (!v || typeof v !== 'object') return
    const o = v as Record<string, unknown>
    if (typeof o.kind === 'string' && ['page', 'section', 'url', 'tel', 'mailto', 'booking', 'form'].includes(o.kind) &&
        ('pageId' in o || 'url' in o || 'phone' in o || 'email' in o || 'formKey' in o || o.kind === 'booking')) out.push(o as Link)
    for (const x of Object.values(o)) walk(x)
  }
  walk(doc)
  return out
}

/** Links to pages or sections that don't exist. */
export function brokenInternalLinks(doc: SiteDoc): string[] {
  const pages = new Map(doc.pages.map((p) => [p.id, new Set(p.sections.map((s) => s.id))]))
  const bad: string[] = []
  for (const l of linksIn(doc)) {
    if (l.kind === 'page' && !pages.has(l.pageId!)) bad.push(`page ${l.pageId}`)
    if (l.kind === 'section' && !pages.get(l.pageId!)?.has(l.sectionId!)) bad.push(`section ${l.pageId}#${l.sectionId}`)
  }
  for (const item of doc.nav.items) if (!pages.has(item.pageId)) bad.push(`menu link ${item.label}`)
  return bad
}

export function externalUrls(doc: SiteDoc): string[] {
  const urls = new Set<string>()
  for (const l of linksIn(doc)) if (l.kind === 'url' && l.url) urls.add(l.url)
  for (const s of doc.business.social ?? []) urls.add(s.url)
  return [...urls]
}

/** Every asset id the doc refers to. */
export function assetIdsIn(doc: SiteDoc): string[] {
  const ids = new Set<string>()
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) { v.forEach(walk); return }
    if (!v || typeof v !== 'object') return
    for (const [k, x] of Object.entries(v)) {
      if ((k === 'assetId' || k === 'ogImageAssetId') && typeof x === 'string') ids.add(x)
      else walk(x)
    }
  }
  walk(doc)
  return [...ids]
}

/** Images whose description (alt) is empty. */
function imagesWithoutAlt(doc: SiteDoc): number {
  let n = 0
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) { v.forEach(walk); return }
    if (!v || typeof v !== 'object') return
    const o = v as Record<string, unknown>
    if (typeof o.assetId === 'string' && (typeof o.alt !== 'string' || !o.alt.trim())) n++
    for (const x of Object.values(o)) walk(x)
  }
  walk(doc)
  return n
}

export type DocCheckContext = { allowedAssetIds: ReadonlySet<string>; maxPages?: number }

/** Items 2-8 of 11.1 plus the warnings, from the doc alone. */
export function docChecks(doc: SiteDoc, ctx: DocCheckContext): CheckItem[] {
  const text = visibleText(doc)
  const joined = text.join('\n')
  const items: CheckItem[] = [item('schema_valid', true, true)]

  const placeholders = text.filter(hasPlaceholder).length
  items.push(item('no_placeholders', placeholders === 0, true, placeholders ? `${placeholders} spot${placeholders === 1 ? '' : 's'} still say “fill this in”. They’re highlighted in the editor.` : undefined))

  const b = doc.business
  const hasForm = formsOf(doc).length > 0
  const contact = Boolean(b.name.trim()) && Boolean(b.phone || b.email || hasForm)
  items.push(item('contact_info', contact, true, contact ? undefined : 'Add a phone number, an email or a contact form.'))

  const noAlt = imagesWithoutAlt(doc)
  const foreign = assetIdsIn(doc).filter((id) => !ctx.allowedAssetIds.has(id)).length
  items.push(item('images_ok', noAlt === 0 && foreign === 0, true,
    noAlt ? `${noAlt} photo${noAlt === 1 ? ' needs' : 's need'} a short description.` : foreign ? 'A photo on your site isn’t one of yours. Replace it in the editor.' : undefined))

  const broken = brokenInternalLinks(doc)
  const notHttps = externalUrls(doc).filter((u) => !u.startsWith('https://'))
  items.push(item('links_ok', broken.length === 0 && notHttps.length === 0, true,
    broken.length ? `${broken.length} link${broken.length === 1 ? ' goes' : 's go'} to a page or section that no longer exists.` : notHttps.length ? 'Every outside link must start with https://' : undefined))

  // R7/R8: no vendor names, never "AI-built". (R9 is Yakini's own price line; a business's menu
  // and service prices are its content, so they are not checked here.)
  const lint = lintCopy(joined)
  items.push(item('copy_lint', lint.length === 0, true,
    lint.length ? `Please reword: “${[...new Set(lint.map((h) => h.term))].slice(0, 3).join('”, “')}”.` : undefined))

  const forms = formsOf(doc)
  const keys = forms.map((f) => f.formKey)
  const formsOk = keys.length === new Set(keys).size && keys.every((k) => /^[a-z0-9-]{1,40}$/.test(k))
  items.push(item('forms_wired', formsOk, true, formsOk ? undefined : 'Two forms share the same name. Please contact Yakini.'))

  const bytes = Buffer.byteLength(JSON.stringify(doc))
  const maxPages = ctx.maxPages ?? TEMPLATE_PLAN_MAX_PAGES
  items.push(item('doc_size', bytes <= DOC_MAX_BYTES && doc.pages.length <= maxPages, true,
    doc.pages.length > maxPages ? `Your plan includes ${maxPages} pages.` : bytes > DOC_MAX_BYTES ? 'Your site has too much text. Shorten a long section.' : undefined))

  // Warnings (never block): contrast falls back to black/white ink, hours, SEO description.
  const { primary, secondary, accent } = doc.brand.colors
  const lowContrast = [primary, secondary, accent].some((c) => Math.max(contrastRatio(c, '#ffffff'), contrastRatio(c, '#000000')) < AA)
  items.push(item('contrast', !lowContrast, false, lowContrast ? 'One of your colors is hard to read text on, so we use black or white text there. Your colors stay as they are.' : undefined))
  items.push(item('hours', Boolean(b.hours?.length), false, b.hours?.length ? undefined : 'Add your hours so visitors know when you’re open.'))
  items.push(item('seo_description', Boolean(doc.seo.description?.trim()), false, doc.seo.description?.trim() ? undefined : 'Add a short description for search results.'))
  return items
}

export function blockingFailures(items: readonly CheckItem[]): CheckItem[] {
  return items.filter((i) => i.blocking && !i.ok)
}
