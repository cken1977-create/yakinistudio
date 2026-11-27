import type { SiteDoc } from '@yakini/site-schema'
import { neutralHtml, publishedPageHtml, type SiteIsland } from './html'
import { draftImage } from '@/lib/draft/preview'
import type { RenderContext } from '@yakini/sections'
import { liveContext, thanksPage } from './live'
import { headlineFont, type HeadlineFont } from './headline-font'

/**
 * Entry point of the standalone published-page renderer (scripts/build-site-renderer.mjs bundles
 * it, with its own React, into .site-renderer/render.cjs). Next.js doesn't allow react-dom/server in
 * App Router code, and published pages must ship no framework JavaScript, so the renderer route
 * loads this bundle at runtime. Pure: plain data in, an HTML string out.
 */
export type PublishedInput = {
  doc: SiteDoc
  pageId: string | null
  thanks: { formKey: string | null } | null
  siteId: string
  reportUrl: string | null
  formStamp: string | null
  canonicalHost: string
  indexable: boolean
  islands?: SiteIsland[]
  nonce?: string | null
  /** From headlineFont(doc), awaited by the route first. */
  headline?: HeadlineFont | null
}

export { headlineFont }

export function renderPublished(i: PublishedInput): string {
  const page = i.thanks ? thanksPage(i.doc, i.thanks.formKey) : i.doc.pages.find((p) => p.id === i.pageId)
  if (!page) throw new Error('page not found')
  const ctx = liveContext(i.doc, page, { siteId: i.siteId, reportUrl: i.reportUrl, formStamp: i.formStamp, forms: true })
  return publishedPageHtml({ doc: i.doc, page, ctx, canonicalHost: i.canonicalHost, indexable: i.indexable, thanks: Boolean(i.thanks), islands: i.islands, nonce: i.nonce, headline: i.headline })
}

export { neutralHtml }

/**
 * Test mode only (the /dev-site route): a fixture rendered exactly like a published page, so the
 * design gallery, axe and Lighthouse measure what visitors get. `draft` renders the visitor
 * preview of a draft (same renderer, draft mode).
 */
const FALLBACK_IMAGE = '7a1e0000-0000-4000-8000-000000000101'
export function renderFixturePage(i: { doc: SiteDoc; pageId: string; mode: 'live' | 'draft'; base: string; headline?: HeadlineFont | null; nonce?: string | null }): string {
  const page = i.doc.pages.find((p) => p.id === i.pageId)
  if (!page) throw new Error('page not found')
  const q = i.mode === 'draft' ? '?mode=draft' : ''
  const ctx: RenderContext = {
    doc: i.doc, page, mode: i.mode,
    hrefForPage: (p) => `${i.base}${p.slug ? `/${p.slug}` : ''}${q}`,
    image: (id) => draftImage('fixture', id, new Set()) ?? draftImage('fixture', FALLBACK_IMAGE, new Set()),
    formAction: (key) => (i.mode === 'live' ? `/api/forms/${key}` : null),
    reportUrl: i.mode === 'live' ? '/report' : null,
    today: null,
  }
  return publishedPageHtml({ doc: i.doc, page, ctx, canonicalHost: 'localhost', indexable: false, thanks: false, headline: i.headline, nonce: i.nonce })
}
