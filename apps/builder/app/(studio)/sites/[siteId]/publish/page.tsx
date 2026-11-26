import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { PublishPanel } from '@/components/publish/PublishPanel'
import { BILLING_RESULTS } from '@/lib/billing-copy'
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

export default async function PublishPage({ params, searchParams }: { params: Promise<{ siteId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { siteId } = await params
  const q = await searchParams
  const result = typeof q.result === 'string' ? q.result : undefined
  let rt
  try { rt = getRuntime() } catch { notFound() }
  const m = await siteMember(rt, siteId)
  if (!m) { if (!(await currentUser())) redirect(signinPath(`/sites/${siteId}/publish`)); notFound() }
  const loaded = await loadDraft(m.site)
  if ('error' in loaded) return <main className="mx-auto max-w-xl px-5 py-12"><h1 className="font-serif text-3xl">Publish</h1><p className="mt-3">{loaded.error}</p></main>
  const doc = loaded.doc
  const [checks, versions, links, op, indexable] = await Promise.all([
    runChecklist(rt, m, doc), rt.store.publishedVersions(siteId),
    m.role === 'owner' || m.role === 'editor' ? rt.store.listShareLinks(siteId) : Promise.resolve([]),
    m.role === 'operator' ? rt.store.operator(m.user.id) : Promise.resolve(null),
    rt.store.siteIndexable(siteId),
  ])
  const manage = m.role === 'owner' || m.role === 'operator'
  const s = phase3Settings()
  const now = nowMs()
  const live = m.info.publishedVersionId && m.info.primaryHost ? `https://${m.info.primaryHost}` : null
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-5 py-10">
      <a href={`/sites/${siteId}/edit`} className="inline-flex min-h-11 items-center text-paper/85 underline-offset-4 hover:text-gold hover:underline">← Back to the editor</a>
      <h1 className="mt-4 font-serif text-4xl">Publish</h1>
      <p className="mt-2 text-paper/85">{doc.business.name}. Publishing puts your current draft live. Later edits stay private until you publish again.</p>
      {result && BILLING_RESULTS[result] ? <p role="status" className="mt-6 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3">{BILLING_RESULTS[result]}</p> : null}
      {m.info.tenantStatus === 'past_due' ? (
        <p className="mt-6 rounded-xl border border-[#B4442C]/60 bg-[#B4442C]/15 px-4 py-3">PayPal couldn’t take your last payment. Your site is still live. <a href={`/sites/${siteId}/plan`} className="underline underline-offset-4">See your plan</a>.</p>
      ) : null}
      <section className="mt-6 rounded-2xl border border-paper/15 p-5" aria-labelledby="plan-h">
        <h2 id="plan-h" className="text-lg font-semibold">Plan</h2>
        {m.info.hasPlan ? (
          <p className="mt-1 text-paper/85">Your plan is active. <a href={`/sites/${siteId}/plan`} className="text-gold underline underline-offset-4">See your plan</a></p>
        ) : (
          <>
            <p className="mt-1 text-paper/85">Choose a plan to go live. Your preview still works.</p>
            <a href={`/sites/${siteId}/plan`} className="mt-3 inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-6 font-semibold text-ink">Choose a plan</a>
          </>
        )}
        {manage && (m.info.hasPlan || m.role === 'operator') ? (
          <p className="mt-3"><a href={`/sites/${siteId}/domain`} className="inline-flex min-h-11 items-center text-gold underline underline-offset-4">Use your own domain</a></p>
        ) : null}
        {manage && m.info.hasPlan ? (
          <form method="post" action={`/api/sites/${siteId}/indexing`} className="mt-5 border-t border-paper/15 pt-4">
            <input type="hidden" name="on" value={indexable ? '0' : '1'} />
            <p className="font-semibold">Let search engines find this site: <span data-testid="indexing-state">{indexable ? 'On' : 'Off'}</span></p>
            <p className="mt-1 text-sm text-muted">{indexable ? 'Search engines can list your site.' : 'Search engines are asked not to list your site yet.'}</p>
            <button className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full border border-paper/25 px-5 font-semibold hover:border-gold">{indexable ? 'Turn off' : 'Turn on'}</button>
          </form>
        ) : null}
      </section>
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
