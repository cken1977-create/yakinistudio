import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SiteView } from '@yakini/sections'
import '@yakini/sections/fonts.css'
import '@yakini/sections/styles.css'
import { loadSiteDoc, SiteDocError } from '@yakini/site-schema'
import { kitName, pageForPath, previewContext, type PreviewView } from '@/lib/draft/preview'
import { openDraft } from '@/lib/server/draft-access'
import { getRuntime } from '@/lib/server/runtime'

/**
 * Draft preview (spec 5.2 step 5): the whole site as it will look, with a phone/desktop switch.
 * Private to the browser that holds the draft cookie; noindex by header (proxy.ts) and meta.
 * Works with JavaScript off: the switch and the site's own links are plain links.
 */
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Your site draft', robots: { index: false, follow: false, nocache: true } }

type Props = {
  params: Promise<{ siteId: string; path?: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export default async function DraftPreview({ params, searchParams }: Props) {
  const [{ siteId, path }, query] = await Promise.all([params, searchParams])
  let rt
  try { rt = getRuntime() } catch { notFound() }
  const draft = await openDraft(rt, siteId)
  if (!draft) notFound()

  let doc
  try {
    doc = loadSiteDoc(draft.doc).doc
  } catch (e) {
    if (e instanceof SiteDocError) notFound() // a stored draft that cannot be read is never half-shown
    throw e
  }
  const page = pageForPath(doc, path)
  if (!page) notFound()

  const view: PreviewView = one(query.view) === 'phone' ? 'phone' : 'desktop'
  const here = `/d/${siteId}${page.slug ? `/${page.slug}` : ''}`
  const unread = one(query.note) === 'unread'
  const kit = kitName(doc)

  return (
    <div className="min-h-screen bg-[#1a1714]">
      <header className="sticky top-0 z-10 border-b border-paper/10 bg-ink/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-6">
          <p className="min-w-0 flex-1 basis-64 text-sm text-paper sm:text-base">
            <strong className="font-semibold">This is your site draft.</strong> Nothing is public yet.
          </p>
          <nav aria-label="Preview size" className="flex rounded-full border border-paper/20 p-1 text-sm">
            <a href={here} aria-current={view === 'desktop' ? 'page' : undefined}
              className={`inline-flex min-h-10 items-center rounded-full px-4 ${view === 'desktop' ? 'bg-paper text-ink' : 'text-paper/85 hover:text-paper'}`}>Desktop</a>
            <a href={`${here}?view=phone`} aria-current={view === 'phone' ? 'page' : undefined}
              className={`inline-flex min-h-10 items-center rounded-full px-4 ${view === 'phone' ? 'bg-paper text-ink' : 'text-paper/85 hover:text-paper'}`}>Phone</a>
          </nav>
          <div className="flex flex-wrap gap-2 text-sm">
            <a href="https://yakini.digital/demo" className="inline-flex min-h-10 items-center rounded-full border border-paper/25 px-4 font-semibold text-paper hover:border-gold">See your kit</a>
            <span aria-disabled="true" title="Opens soon" className="inline-flex min-h-10 cursor-not-allowed items-center rounded-full border border-paper/10 px-4 text-paper/50">Keep editing</span>
            <span aria-disabled="true" title="Opens soon" className="inline-flex min-h-10 cursor-not-allowed items-center rounded-full bg-gold/40 px-4 font-semibold text-ink/70">Make it mine</span>
          </div>
        </div>
        {(unread || doc.brand.colorsSource === 'kit-default') && (
          <div className="mx-auto max-w-6xl space-y-1 px-4 pb-3 text-sm text-muted sm:px-6">
            {unread && <p>We couldn’t read that website, so we started from our {kit} design with your name. You can add details next.</p>}
            {doc.brand.colorsSource === 'kit-default' && <p>Default colors — replace with yours anytime.</p>}
          </div>
        )}
        <p className="sr-only">Editing and saving your draft open soon. Your draft is kept in this browser for 14 days.</p>
      </header>

      <div className={view === 'phone' ? 'flex justify-center px-3 py-6 sm:py-10' : ''}>
        <div
          className={view === 'phone' ? 'w-full max-w-[390px] overflow-hidden rounded-[28px] border-8 border-black shadow-2xl' : ''}
          data-preview={view}
        >
          <SiteView ctx={previewContext(doc, page, siteId, view)} />
        </div>
      </div>
    </div>
  )
}
