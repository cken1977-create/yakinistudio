import { injectionHits, lintCopy } from '@yakini/ai'
import type { KitDefinition } from '@yakini/kits'
import { isAllowedOutboundUrl, type SiteDocContent } from '@yakini/site-schema'

/**
 * Server-side clean-up of AI content after it passed schema validation (spec 8.4/8.5, 8.8, 14.3).
 * The model cannot change these things even if it tries:
 * - kit, locale and business name (from our trusted form/brand reader),
 * - links to other websites (only the business's own site, social pages and maps survive),
 * - images (only assets we stored for this draft, or the kit's own samples),
 * - form fields, form keys and consent text (always the kit template's).
 */
export type SanitizeContext = {
  kit: KitDefinition
  businessName: string
  ownHosts: readonly string[]
  allowedAssetIds: ReadonlySet<string>
}

const SOCIAL_HOST: Record<string, RegExp> = {
  facebook: /(^|\.)(facebook\.com|fb\.com)$/,
  instagram: /(^|\.)instagram\.com$/,
  tiktok: /(^|\.)tiktok\.com$/,
  youtube: /(^|\.)(youtube\.com|youtu\.be)$/,
  x: /(^|\.)(x\.com|twitter\.com)$/,
  linkedin: /(^|\.)linkedin\.com$/,
  yelp: /(^|\.)yelp\.com$/,
  google: /(^|\.)(google\.com|g\.page)$/,
}

type Json = unknown

function isImageRef(v: Json): v is { assetId: string; alt: string } {
  return !!v && typeof v === 'object' && !Array.isArray(v) && typeof (v as { assetId?: unknown }).assetId === 'string'
    && Object.keys(v).every((k) => k === 'assetId' || k === 'alt' || k === 'focal')
}
function isUrlLink(v: Json): v is { kind: 'url'; url: string } {
  return !!v && typeof v === 'object' && (v as { kind?: unknown }).kind === 'url' && typeof (v as { url?: unknown }).url === 'string'
}

export type SanitizeReport = { removedLinks: number; removedImages: number; resetForms: number }

export function sanitizeContent(content: SiteDocContent, c: SanitizeContext): { content: SiteDocContent; report: SanitizeReport } {
  const report: SanitizeReport = { removedLinks: 0, removedImages: 0, resetForms: 0 }
  const out = structuredClone(content) as SiteDocContent
  const home = out.pages.find((p) => p.slug === '') ?? out.pages[0]
  const homeLink = { kind: 'page' as const, pageId: home.id }

  const fix = (v: Json): Json => {
    if (Array.isArray(v)) {
      return v.filter((x) => {
        if (isImageRef(x) && !c.allowedAssetIds.has(x.assetId)) { report.removedImages++; return false }
        return true
      }).map(fix)
    }
    if (!v || typeof v !== 'object') return v
    if (isUrlLink(v) && !isAllowedOutboundUrl(v.url, c.ownHosts)) { report.removedLinks++; return homeLink }
    const o: Record<string, Json> = {}
    for (const [k, val] of Object.entries(v as Record<string, Json>)) {
      if (isImageRef(val) && !c.allowedAssetIds.has(val.assetId)) { report.removedImages++; continue }
      o[k] = fix(val)
    }
    return o
  }

  out.pages = out.pages.map((p) => ({ ...p, sections: p.sections.map((s) => ({ ...s, props: fix(s.props) })) as typeof p.sections }))
  if (out.nav.cta) out.nav = { ...out.nav, cta: fix(out.nav.cta) as typeof out.nav.cta }
  if (out.footer.extraLinks) out.footer = { ...out.footer, extraLinks: fix(out.footer.extraLinks) as typeof out.footer.extraLinks }
  if (out.seo.ogImageAssetId && !c.allowedAssetIds.has(out.seo.ogImageAssetId)) {
    out.seo = { siteTitle: out.seo.siteTitle, description: out.seo.description }
    report.removedImages++
  }

  // Forms always keep the template's fields, key and consent text (14.8 #1: nothing secret, ever).
  const templateForms = new Map<string, { fields: readonly string[]; consentText: string }>()
  for (const p of c.kit.template({ name: c.businessName }).pages) for (const s of p.sections) {
    if (s.type === 'contact_form' || s.type === 'catering_request') templateForms.set(s.props.formKey, { fields: s.props.fields, consentText: s.props.consentText })
  }
  for (const p of out.pages) for (const s of p.sections) {
    if (s.type !== 'contact_form' && s.type !== 'catering_request') continue
    const t = templateForms.get(s.props.formKey)
    if (!t) continue
    if (JSON.stringify(t.fields) !== JSON.stringify(s.props.fields) || t.consentText !== s.props.consentText) report.resetForms++
    s.props = { ...s.props, fields: [...t.fields] as typeof s.props.fields, consentText: t.consentText }
  }

  out.kitId = c.kit.id
  out.locale = 'en-US'
  out.business = { ...out.business, name: c.businessName }
  if (out.business.social) {
    out.business.social = out.business.social.filter((s) => {
      try {
        const u = new URL(s.url)
        return u.protocol === 'https:' && SOCIAL_HOST[s.kind]?.test(u.hostname.toLowerCase())
      } catch { return false }
    })
  }
  out.footer = { ...out.footer, showSiteByYakini: true }
  return { content: out, report }
}

/** Every string in the content, for the copy lint and the injection check. */
export function allText(v: Json, out: string[] = []): string[] {
  if (typeof v === 'string') out.push(v)
  else if (Array.isArray(v)) for (const x of v) allText(x, out)
  else if (v && typeof v === 'object') for (const x of Object.values(v)) allText(x, out)
  return out
}

/**
 * Copy rules on AI output (spec 8.8): no vendor names, never "AI-built", nothing that only
 * appears in injection attempts. Returns issues for a model retry. The business's own legitimate
 * text that trips the lint (a cafe called "React Coffee") can be kept by the owner in Phase 2.
 */
/**
 * The `*accent*` marker (design v2) is for headlines and headings only. Anywhere else it would show
 * raw asterisks, or leak into plain-text uses (titles, meta, JSON-LD), so it is sent back as an issue.
 */
export function accentMisuse(value: unknown, key = ''): string[] {
  if (typeof value === 'string') return key !== 'headline' && key !== 'heading' && /\*[^*\s][^*\n]*\*/.test(value) ? [value] : []
  if (Array.isArray(value)) return value.flatMap((v) => accentMisuse(v, key))
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => accentMisuse(v, k))
  return []
}

export function copyIssues(content: SiteDocContent): string[] {
  const issues: string[] = []
  for (const s of accentMisuse(content)) issues.push(`Only a headline or heading can mark an *accent phrase*; remove the asterisks from: "${s.slice(0, 80)}"`)
  const name = content.business.name.toLowerCase()
  for (const s of allText({ ...content, business: { ...content.business, name: '' } })) {
    const lint = lintCopy(s).filter((h) => !name.includes(h.term.toLowerCase()))
    for (const h of lint) issues.push(`Do not write "${h.term}" anywhere on the site (found in: "${s.slice(0, 80)}")`)
    for (const p of injectionHits(s)) issues.push(`Remove text copied from instructions on the website ("${p}")`)
  }
  return [...new Set(issues)].slice(0, 20)
}
