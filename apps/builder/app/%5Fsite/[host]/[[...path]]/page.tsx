import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { connection } from 'next/server'
import { SiteView } from '@yakini/sections'
import '@yakini/sections/fonts.css'
import '@yakini/sections/styles.css'
import { liveContext, thanksPage } from '@/lib/site/live'
import { siteView } from '@/lib/site/resolve'
import { signFormTime } from '@/lib/server/request'
import { getRuntime } from '@/lib/server/runtime'
import { studioOrigin } from '@/lib/server/settings'

/**
 * Multi-tenant renderer (spec 13.5). The proxy rewrites every client host to /_site/<host>/<path>.
 * Only a published version is ever shown; drafts never reach this route. Unknown hosts and sites
 * under takedown or auto-hold get the neutral "This site is unavailable." page (404, noindex,
 * no-store); an unpublished site gets "This site is being updated" (noindex).
 */
type Props = { params: Promise<{ host: string; path?: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { host, path } = await params
  const v = await siteView(decodeURIComponent(host), path)
  if (v.kind !== 'page' && v.kind !== 'thanks') return { title: { absolute: v.kind === 'updating' ? 'This site is being updated' : 'This site is unavailable' }, description: null, robots: { index: false, follow: false } }
  const { doc, page, canonicalHost, indexable } = v
  const title = v.kind === 'thanks' ? `Thank you · ${doc.business.name}` : page.slug === '' ? (doc.seo.siteTitle || doc.business.name) : `${page.seo?.title || page.title} · ${doc.business.name}`
  // Never fall back to the studio's own description on a client site.
  const description = page.seo?.description || doc.seo.description || doc.business.tagline || null
  const url = `https://${canonicalHost}${page.slug ? `/${page.slug}` : ''}`
  const og = doc.seo.ogImageAssetId ? [`https://${canonicalHost}/assets/${doc.seo.ogImageAssetId}`] : undefined
  return {
    metadataBase: new URL(`https://${canonicalHost}`),
    title: { absolute: title.slice(0, 120) },
    description,
    alternates: { canonical: url },
    openGraph: { title, description: description ?? undefined, url, siteName: doc.business.name, type: 'website', locale: 'en_US', ...(og ? { images: og } : {}) },
    robots: indexable && v.kind === 'page' && !page.seo?.noindex ? { index: true, follow: true } : { index: false, follow: false },
  }
}

export default async function SiteRenderer({ params, searchParams }: Props) {
  await connection() // per-request render: the CSP nonce changes every request
  const [{ host, path }, query] = await Promise.all([params, searchParams])
  const hostname = decodeURIComponent(host)
  const v = await siteView(hostname, path, one(query.f) ?? null)

  if (v.kind === 'unknown' || v.kind === 'taken_down' || v.kind === 'missing') return notFound()
  if (v.kind === 'redirect') return permanentRedirect(v.to)
  if (v.kind === 'error' || v.kind === 'updating') return <Neutral title="This site is being updated" note="Please check back soon." />

  const rt = getRuntime()
  const stamp = signFormTime(Date.now(), rt.ipPepper)
  const reportUrl = v.reportLinkHidden ? null : `${studioOrigin()}/report?site=${v.siteId}`
  const page = v.kind === 'thanks' ? thanksPage(v.doc, v.formKey) : v.page
  return <SiteView ctx={liveContext(v.doc, page, { siteId: v.siteId, reportUrl, formStamp: stamp, forms: true })} />
}

function Neutral({ title, note }: { title: string; note: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 text-center text-neutral-900">
      <div>
        <h1 className="font-serif text-3xl">{title}</h1>
        <p className="mt-3 text-neutral-600">{note}</p>
      </div>
    </main>
  )
}
