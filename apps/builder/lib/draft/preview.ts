import { kitDefinition, sampleImageById } from '@yakini/kits'
import type { RenderContext, ResolvedImage } from '@yakini/sections'
import type { Page, SiteDoc } from '@yakini/site-schema'
import { assetResolved, imageOptions, sampleResolved, type AssetMetaMap, type ImageOptions } from '@/lib/images/resolve'

/**
 * How a draft preview resolves its pages and images (spec 5.2 step 5). Kit samples come from the
 * studio's own /kit-samples folder; the business's own photos come through the cookie-checked
 * asset route, so nothing in a private draft is reachable without the draft cookie.
 */
export type PreviewView = 'desktop' | 'phone'

export function pageForPath(doc: SiteDoc, path: readonly string[] | undefined): Page | null {
  const slug = (path ?? []).join('/')
  return doc.pages.find((p) => p.slug === slug) ?? null
}

export function draftHref(siteId: string, page: Page, view: PreviewView): string {
  const base = `/d/${siteId}${page.slug ? `/${page.slug}` : ''}`
  return view === 'phone' ? `${base}?view=phone` : base
}

export function draftImage(siteId: string, assetId: string, known: ReadonlySet<string>, meta?: AssetMetaMap, o: ImageOptions = { gradeOwn: false, legacy: false }): ResolvedImage | null {
  const sample = sampleImageById(assetId)
  if (sample) return sampleResolved(sample, o.legacy)
  // Only ids the stored draft itself references are linked (a doc cannot point at another tenant's file;
  // the asset route also checks the tenant).
  if (!known.has(assetId)) return null
  return assetResolved(`/api/drafts/${siteId}/assets/${assetId}`, meta?.[assetId], o)
}

/** Every asset id the doc refers to (logo, section images, social preview image). */
export function assetIdsIn(doc: SiteDoc): Set<string> {
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
  return ids
}

export function previewContext(doc: SiteDoc, page: Page, siteId: string, view: PreviewView, meta?: AssetMetaMap): RenderContext {
  const known = assetIdsIn(doc)
  const opts = imageOptions(doc)
  return {
    doc, page, mode: 'draft',
    hrefForPage: (p) => draftHref(siteId, p, view),
    image: (id) => draftImage(siteId, id, known, meta, opts),
    formAction: () => null, // forms start working once the site is published (Phase 3)
    reportUrl: `/report?site=${siteId}`, // spec 7.3: every preview carries the Report link
    today: null,
  }
}

export function kitName(doc: SiteDoc): string {
  return kitDefinition(doc.kitId)?.name ?? 'Yakini'
}
