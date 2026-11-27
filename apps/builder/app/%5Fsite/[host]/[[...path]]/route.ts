import * as Sentry from '@sentry/nextjs'
import { siteRenderer } from '@/lib/site/renderer'
import { siteView } from '@/lib/site/resolve'
import { freshFormStamp } from '@/lib/server/form-stamp'
import { studioOrigin } from '@/lib/server/settings'

/**
 * Multi-tenant renderer (spec 13.5). The proxy rewrites every client host to /_site/<host>/<path>.
 * Published pages are served as plain HTML with no framework JavaScript (perf decision
 * 2026-11-27): one server render, the site's first-party stylesheet, JSON-LD and nothing else.
 * Only a published version is ever shown; drafts never reach this route. Unknown hosts and sites
 * under takedown or auto-hold get the neutral "This site is unavailable." page (404, noindex,
 * no-store); an unpublished site gets "This site is being updated" (noindex).
 */
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ host: string; path?: string[] }> }

const FALLBACK = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>This site is being updated</title></head><body style="margin:0;font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center"><main><h1 style="font-size:1.75rem;font-weight:600;margin:0">This site is being updated</h1><p style="color:#555">Please check back soon.</p></main></body></html>'
const NO_STORE = 'private, no-cache, no-store, max-age=0, must-revalidate'
const html = (body: string, status: number, extra: Record<string, string> = {}) =>
  new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': NO_STORE, ...extra } })

async function render(request: Request, { params }: Ctx): Promise<Response> {
  const { host, path } = await params
  const hostname = decodeURIComponent(host)
  const f = new URL(request.url).searchParams.get('f')
  const v = await siteView(hostname, path, f)

  let renderer
  try { renderer = siteRenderer() } catch (e) {
    // The renderer bundle is built with the app (npm run build); if it's ever missing, say so plainly.
    Sentry.captureException(e, { tags: { area: 'site-renderer' } })
    return html(FALLBACK, 503, { 'x-robots-tag': 'noindex', 'retry-after': '60' })
  }
  const { neutralHtml, renderPublished } = renderer
  if (v.kind === 'unknown' || v.kind === 'taken_down' || v.kind === 'missing') {
    return html(neutralHtml('This site is unavailable.', 'Please check the address and try again.'), 404, { 'x-robots-tag': 'noindex' })
  }
  if (v.kind === 'redirect') return new Response(null, { status: 308, headers: { location: v.to, 'cache-control': NO_STORE } })
  if (v.kind === 'error' || v.kind === 'updating') {
    return html(neutralHtml('This site is being updated', 'Please check back soon.'), 200, { 'x-robots-tag': 'noindex' })
  }

  const reportUrl = v.reportLinkHidden ? null : `${studioOrigin()}/report?site=${v.siteId}`
  const body = renderPublished({
    doc: v.doc, pageId: v.kind === 'page' ? v.page.id : null, thanks: v.kind === 'thanks' ? { formKey: v.formKey } : null,
    siteId: v.siteId, reportUrl, formStamp: freshFormStamp(), canonicalHost: v.canonicalHost, indexable: v.indexable,
    // D7: 3D-plan sites will pass their first-party islands and the request nonce here. None today.
    islands: [], nonce: request.headers.get('x-nonce'),
  })
  return html(body, 200)
}

export const GET = render
export async function HEAD(request: Request, ctx: Ctx): Promise<Response> {
  const res = await render(request, ctx)
  return new Response(null, { status: res.status, headers: res.headers })
}
