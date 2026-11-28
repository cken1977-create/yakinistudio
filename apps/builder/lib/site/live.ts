import type { RenderContext } from '@yakini/sections'
import type { Page, SiteDoc } from '@yakini/site-schema'
import { sampleImageById } from '@yakini/kits'
import { assetIdsIn } from '@/lib/draft/preview'
import { assetResolved, imageOptions, sampleResolved, type AssetMetaMap, type ImageOptions } from '@/lib/images/resolve'

/**
 * How a published site resolves its pages, photos, forms and Report link (spec 7.3, 11.3, 13.5).
 * Pages are plain paths on the site's own host; the business's photos come from /assets/<id> on
 * that host (only ids the published doc refers to); forms post to /api/f/<siteId>/<formKey>.
 */
export const hrefForSlug = (slug: string) => (slug ? `/${slug}` : '/')

export function liveImage(assetId: string, known: ReadonlySet<string>, meta?: AssetMetaMap, o: ImageOptions = { gradeOwn: false, legacy: false }) {
  // Kit samples resolve to the shared /kit-samples files; the site's own photos to /assets/<id>.
  const sample = sampleImageById(assetId)
  if (sample) return sampleResolved(sample, o.legacy)
  return known.has(assetId) ? assetResolved(`/assets/${assetId}`, meta?.[assetId], o) : null
}

export function liveContext(doc: SiteDoc, page: Page, o: { siteId: string; reportUrl: string | null; formStamp: string | null; forms: boolean; assets?: AssetMetaMap }): RenderContext {
  const known = assetIdsIn(doc)
  const opts = imageOptions(doc)
  return {
    doc, page, mode: 'live',
    hrefForPage: (p) => hrefForSlug(p.slug),
    image: (id) => liveImage(id, known, o.assets, opts),
    formAction: (formKey) => (o.forms ? `/api/f/${o.siteId}/${encodeURIComponent(formKey)}` : null),
    formStamp: o.formStamp,
    reportUrl: o.reportUrl,
    today: null, // Today updates arrive in Phase 6
  }
}

/** The thank-you page after a form post (spec 5.8 step 4): the site's header and footer around a short note. */
export function thanksPage(doc: SiteDoc, kind: string | null): Page {
  const home = doc.pages.find((p) => p.slug === '') ?? doc.pages[0]
  const chrome = home.sections.filter((s) => (s.type === 'header' || s.type === 'footer') && !s.hidden)
  const headline = kind === 'booking-request' ? 'Thanks! Your request is on its way.' : 'Thanks! Your message is on its way.'
  const note = {
    id: 'thanks', type: 'cta_band', variant: 'outline', hidden: false,
    props: { headline, body: `${doc.business.name} will get back to you soon.`, cta: { label: 'Back to the home page', target: { kind: 'page', pageId: home.id } } },
  }
  const header = chrome.filter((s) => s.type === 'header')
  const footer = chrome.filter((s) => s.type === 'footer')
  return { id: 'thanks', slug: 'thanks', title: 'Thank you', seo: { noindex: true }, sections: [...header, note, ...footer] } as unknown as Page
}
