import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SiteView } from '@yakini/sections'
import { finishHref, finishItems } from '@/lib/draft/finish'
import '@yakini/sections/fonts.css'
import '@yakini/sections/styles.css'
import { loadSiteDoc, SiteDocError } from '@yakini/site-schema'
import { kitName, pageForPath, previewContext, type PreviewView } from '@/lib/draft/preview'
import { viewableDraft } from '@/lib/server/site-access'
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
  // The browser holding the draft cookie, or a signed-in member once it's claimed (spec 10.1).
  const draft = await viewableDraft(rt, siteId)
  if (!draft) notFound()
  const member = draft.member

  let doc
  try {
    doc = loadSiteDoc(draft.doc).doc
  } catch (e) {
    if (e instanceof SiteDocError && e.code === 'too_new') return <DocTooNew message={e.message} />
    if (e instanceof SiteDocError) notFound() // a stored draft that cannot be read is never half-shown
    throw e
  }
  const page = pageForPath(doc, path)
  if (!page) notFound()

  const view: PreviewView = one(query.view) === 'phone' ? 'phone' : 'desktop'
  const here = `/d/${siteId}${page.slug ? `/${page.slug}` : ''}`
  const unread = one(query.note) === 'unread'
  const kit = kitName(doc)
  const finish = finishItems(doc)

  return (
    <div className="min-h-screen bg-[#1a1714]">
      <header className="sticky top-0 z-10 border-b border-paper/10 bg-ink/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-6">
          <p className="min-w-0 flex-1 basis-64 text-sm text-paper sm:text-base">
            <strong className="font-semibold">This is your site draft.</strong> Nothing is public yet.
            {' '}<a href={`/report?site=${siteId}`} rel="nofollow" className="text-paper/70 underline underline-offset-4 hover:text-paper">Report this site</a>
          </p>
          <nav aria-label="Preview size" className="flex rounded-full border border-paper/20 p-1 text-sm">
            <a href={here} aria-current={view === 'desktop' ? 'page' : undefined}
              className={`inline-flex min-h-10 items-center rounded-full px-4 ${view === 'desktop' ? 'bg-paper text-ink' : 'text-paper/85 hover:text-paper'}`}>Desktop</a>
            <a href={`${here}?view=phone`} aria-current={view === 'phone' ? 'page' : undefined}
              className={`inline-flex min-h-10 items-center rounded-full px-4 ${view === 'phone' ? 'bg-paper text-ink' : 'text-paper/85 hover:text-paper'}`}>Phone</a>
          </nav>
          <div className="flex flex-wrap gap-2 text-sm">
            <a href="https://yakini.digital/demo" className="inline-flex min-h-10 items-center rounded-full border border-paper/25 px-4 font-semibold text-paper hover:border-gold">See your kit</a>
            {!member && <a href={`/sites/${siteId}/edit`} className="inline-flex min-h-10 items-center rounded-full border border-paper/25 px-4 font-semibold text-paper hover:border-gold">Keep editing</a>}
            {member
              ? <a href={`/sites/${siteId}/edit`} className="inline-flex min-h-10 items-center rounded-full bg-gold px-4 font-semibold text-ink hover:brightness-110">Open the editor</a>
              : <a href={`/claim/${siteId}`} className="inline-flex min-h-10 items-center rounded-full bg-gold px-4 font-semibold text-ink hover:brightness-110">Make it mine</a>}
          </div>
        </div>
        {(unread || doc.brand.colorsSource === 'kit-default') && (
          <div className="mx-auto max-w-6xl space-y-1 px-4 pb-3 text-sm text-muted sm:px-6">
            {unread && <p>We couldn’t read that website, so we started from our {kit} design with your name. You can add details next.</p>}
            {doc.brand.colorsSource === 'kit-default' && <p>Default colors — replace with yours anytime.</p>}
          </div>
        )}
        {finish.length > 0 && (
          <nav aria-label="Finish your site" className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 pb-3 text-sm sm:px-6" data-testid="finish-strip">
            <span className="font-semibold text-paper">Finish your site:</span>
            {finish.map((f) => (
              <a key={f.sectionId} href={finishHref(siteId, f)} className="inline-flex min-h-10 items-center rounded-full border border-gold/50 px-3 text-paper hover:border-gold hover:bg-gold/10">{f.label}</a>
            ))}
          </nav>
        )}
        {!member && <p className="sr-only">Your draft is kept in this browser for 14 days.</p>}
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

/** A draft saved by a newer editor is never guessed at or half-rendered (spec 7.4). */
function DocTooNew({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <h1 className="font-serif text-3xl">Please refresh</h1>
        <p className="mt-3 text-paper/80">{message}</p>
      </div>
    </main>
  )
}
