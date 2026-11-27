import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { connection } from 'next/server'
import { SiteView, metaFor } from '@yakini/sections'
import '@yakini/sections/fonts.css'
import '@yakini/sections/styles.css'
import { liveContext, thanksPage } from '@/lib/site/live'
import { siteView } from '@/lib/site/resolve'
import { freshFormStamp } from '@/lib/server/form-stamp'
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
  if (v.kind !== 'page' && v.kind !== 'thanks') return { title: { absolute: v.kind === 'updating' ? 'This site is being updated' : 'This site is unavailable' }, description: null, robots: { index: false, follow: false }, icons: { icon: 'data:,' } }
  const { doc, page, canonicalHost, indexable } = v
  // Plain text only (the headline accent marker never reaches a title or description, plan 6.2).
  // Never fall back to the studio's own description on a client site.
  const meta = metaFor(doc, page)
  const title = v.kind === 'thanks' ? `Thank you · ${doc.business.name}` : meta.title
  const description = meta.description
  const url = `https://${canonicalHost}${page.slug ? `/${page.slug}` : ''}`
  const og = doc.seo.ogImageAssetId ? [`https://${canonicalHost}/assets/${doc.seo.ogImageAssetId}`] : undefined
  return {
    metadataBase: new URL(`https://${canonicalHost}`),
    title: { absolute: title.slice(0, 120) },
    description,
    alternates: { canonical: url },
    openGraph: { title, description: description ?? undefined, url, siteName: doc.business.name, type: 'website', locale: 'en_US', ...(og ? { images: og } : {}) },
    icons: { icon: 'data:,' }, // no favicon request (a logo icon is Phase 8 polish)
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

  const stamp = freshFormStamp()
  const reportUrl = v.reportLinkHidden ? null : `${studioOrigin()}/report?site=${v.siteId}`
  const page = v.kind === 'thanks' ? thanksPage(v.doc, v.formKey) : v.page
  return <SiteView ctx={liveContext(v.doc, page, { siteId: v.siteId, reportUrl, formStamp: stamp, forms: true })} />
}

function Neutral({ title, note }: { title: string; note: string }) {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center', background: '#fff', color: '#1a1a1a', fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0 }}>{title}</h1>
        <p style={{ marginTop: '12px', color: '#555' }}>{note}</p>
      </div>
    </main>
  )
}
