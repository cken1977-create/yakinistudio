import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { PublishPanel } from '@/components/publish/PublishPanel'
import { suggestSlug } from '@/lib/publish/slug'
import { currentUser } from '@/lib/server/auth'
import { canPublish, loadDraft, runChecklist, siteMember } from '@/lib/server/publish'
import { getRuntime } from '@/lib/server/runtime'
import { phase3Settings } from '@/lib/server/settings'
import { signinPath } from '@/lib/server/signin'

/** Publish screen (spec 5.6, 10.7): checklist, address, Publish, live link + QR, rollback, preview links. */
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Publish', robots: { index: false, follow: false } }

const nowMs = () => Date.now()

export default async function PublishPage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params
  let rt
  try { rt = getRuntime() } catch { notFound() }
  const m = await siteMember(rt, siteId)
  if (!m) { if (!(await currentUser())) redirect(signinPath(`/sites/${siteId}/publish`)); notFound() }
  const loaded = await loadDraft(m.site)
  if ('error' in loaded) return <main className="mx-auto max-w-xl px-5 py-12"><h1 className="font-serif text-3xl">Publish</h1><p className="mt-3">{loaded.error}</p></main>
  const doc = loaded.doc
  const [checks, versions, links, op] = await Promise.all([
    runChecklist(rt, m, doc), rt.store.publishedVersions(siteId),
    m.role === 'owner' || m.role === 'editor' ? rt.store.listShareLinks(siteId) : Promise.resolve([]),
    m.role === 'operator' ? rt.store.operator(m.user.id) : Promise.resolve(null),
  ])
  const s = phase3Settings()
  const now = nowMs()
  const live = m.info.publishedVersionId && m.info.primaryHost ? `https://${m.info.primaryHost}` : null
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-5 py-10">
      <a href={`/sites/${siteId}/edit`} className="inline-flex min-h-11 items-center text-paper/85 underline-offset-4 hover:text-gold hover:underline">← Back to the editor</a>
      <h1 className="mt-4 font-serif text-4xl">Publish</h1>
      <p className="mt-2 text-paper/85">{doc.business.name}. Publishing puts your current draft live. Later edits stay private until you publish again.</p>
      <PublishPanel
        siteId={siteId} canPublish={canPublish(m.role)} canShare={(m.role === 'owner' || m.role === 'editor') && m.info.ownershipAttested}
        operatorOverride={Boolean(op?.canOverridePublish)} hasPlan={m.info.hasPlan}
        suggestedSlug={m.info.slug.startsWith('draft-') ? suggestSlug(doc.business.name) : m.info.slug} rootDomain={s.rootDomain}
        liveUrl={live} addressPending={m.info.primaryHostStatus === 'pending'} publishedNumber={m.info.publishedNumber}
        inReview={m.info.reviewStatus === 'pending'} paused={Boolean(m.info.takedown)}
        checks={checks} versions={versions.map((v) => ({ id: v.id, number: v.number, createdAt: v.createdAt.toISOString() }))}
        links={links.map((l) => ({ id: l.id, expiresAt: l.expiresAt.toISOString(), active: !l.revokedAt && l.expiresAt.getTime() > now, lastUsedAt: l.lastUsedAt?.toISOString() ?? null }))}
      />
    </main>
  )
}
