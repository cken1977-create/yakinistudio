import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SiteView, type RenderContext } from '@yakini/sections'
import '@yakini/sections/fonts.css'
import '@yakini/sections/styles.css'
import { loadSiteDoc, type Page } from '@yakini/site-schema'
import { sampleImageById } from '@yakini/kits'
import { assetIdsIn, pageForPath } from '@/lib/draft/preview'
import { assetResolved, imageOptions, sampleResolved, type AssetMetaMap } from '@/lib/images/resolve'
import { storedAssetIds } from '@/lib/site/asset-meta-cache'
import { getRuntime } from '@/lib/server/runtime'
import { previewAccess } from '@/lib/server/share'

/**
 * Private preview (spec 10.1 /p, 14.8 #3): members of the site, or anyone with a valid share link
 * (`?s=`). Never indexed (noindex header from the proxy, and meta). Every page says it is a preview
 * and carries the Report link. Forms don't submit here.
 */
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Preview', robots: { index: false, follow: false, nocache: true } }

type Props = { params: Promise<{ siteId: string; path?: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> }
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export default async function Preview({ params, searchParams }: Props) {
  const [{ siteId, path }, q] = await Promise.all([params, searchParams])
  if (!UUID.test(siteId)) notFound()
  let rt
  try { rt = getRuntime() } catch { notFound() }
  const token = one(q.s) ?? null
  const v = one(q.v)
  const a = await previewAccess(rt, siteId, token, v && UUID.test(v) ? v : null)
  if (!a) notFound()
  let doc
  try { doc = loadSiteDoc(a.doc).doc } catch { notFound() }
  const page = pageForPath(doc, path)
  if (!page) notFound()

  const keep = new URLSearchParams()
  if (a.token) keep.set('s', a.token)
  if (a.via === 'member' && a.versionId) keep.set('v', a.versionId)
  const qs = keep.toString() ? `?${keep}` : ''
  const known = assetIdsIn(doc)
  const ids = storedAssetIds(doc)
  const meta = ids.length ? await rt.store.assetMeta(a.tenantId, ids).catch(() => ({})) : {}
  const opts = imageOptions(doc)
  const ctx: RenderContext = {
    doc, page, mode: 'live',
    hrefForPage: (p: Page) => `/p/${siteId}${p.slug ? `/${p.slug}` : ''}${qs}`,
    image: (id) => {
      const sample = sampleImageById(id)
      if (sample) return sampleResolved(sample, opts.legacy)
      return known.has(id) ? assetResolved(`/api/previews/${siteId}/assets/${id}${qs}`, (meta as AssetMetaMap)[id], opts) : null
    },
    formAction: () => null,
    reportUrl: `/report?site=${siteId}`,
    today: null,
  }
  return (
    <div className="min-h-screen bg-white">
      <div role="note" className="sticky top-0 z-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-ink px-4 py-2 text-center text-sm text-paper">
        <strong className="font-semibold">Preview, not a live site.</strong>
        {a.expiresAt ? <span>This link stops working on {a.expiresAt.toLocaleDateString('en-US', { dateStyle: 'medium', timeZone: 'UTC' })}.</span> : null}
        <a href={`/report?site=${siteId}`} rel="nofollow" className="underline underline-offset-4">Report this site</a>
      </div>
      <SiteView ctx={ctx} />
    </div>
  )
}
