import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import '@yakini/sections/fonts.css'
import '@yakini/sections/styles.css'
import { kitDefinition } from '@yakini/kits'
import { loadSiteDoc, SiteDocError } from '@yakini/site-schema'
import { Editor } from '@/components/editor/Editor'
import { currentUser } from '@/lib/server/auth'
import { canManageVersions, editorAccess } from '@/lib/server/editor'
import { getRuntime } from '@/lib/server/runtime'
import { signinPath } from '@/lib/server/signin'

/**
 * The editor (spec 5.5, 10.2): owners, editors and operators once claimed, and the browser holding
 * the draft cookie before that ("Keep editing"). Anyone else is sent to sign in, then sees "not found".
 */
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Editor', robots: { index: false, follow: false } }

type Props = { params: Promise<{ siteId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function EditPage({ params, searchParams }: Props) {
  const [{ siteId }, q] = await Promise.all([params, searchParams])
  let rt
  try { rt = getRuntime() } catch { notFound() }
  const a = await editorAccess(rt, siteId)
  if (!a) {
    if (!(await currentUser())) redirect(signinPath(`/sites/${siteId}/edit`))
    notFound()
  }

  let doc
  try { doc = loadSiteDoc(a.doc).doc } catch (e) {
    if (e instanceof SiteDocError && e.code === 'too_new') {
      return <main className="flex min-h-screen items-center justify-center px-6 text-center"><div className="max-w-md"><h1 className="font-serif text-3xl">Please refresh</h1><p className="mt-3 text-paper/80">{e.message}</p></div></main>
    }
    throw e
  }
  const [photos, tutorialDone, info] = await Promise.all([
    rt.store.tenantPhotos(a.tenantId),
    a.kind === 'member' ? rt.store.tutorialDone(a.user.id, siteId) : Promise.resolve([]),
    a.kind === 'member' ? rt.store.publishInfo(siteId) : Promise.resolve(null),
  ])
  const publish = info && a.kind === 'member' ? {
    liveUrl: info.publishedVersionId && info.primaryHost && info.primaryHostStatus === 'active' ? `https://${info.primaryHost}` : null,
    paused: Boolean(info.takedown), inReview: info.reviewStatus === 'pending', canPublish: a.role === 'owner' || a.role === 'operator',
  } : null
  const kit = kitDefinition(doc.kitId)

  return (
    <Editor
      siteId={siteId} siteName={doc.business.name} doc={doc} rev={a.rev} photos={photos}
      kitSampleIds={kit?.sampleImages?.map((s) => s.assetId) ?? []}
      anonymous={a.kind === 'anonymous'} canManageVersions={canManageVersions(a)}
      welcome={q.welcome === '1'} publish={publish}
      initialPageId={typeof q.page === 'string' ? q.page : undefined}
      initialSectionId={typeof q.section === 'string' && /^[a-z0-9-]{1,40}$/.test(q.section) ? q.section : undefined}
      tutorialDone={tutorialDone} tourStep={typeof q.tour === 'string' ? q.tour : undefined}
    />
  )
}
