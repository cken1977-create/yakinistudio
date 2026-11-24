import { loadSiteDoc } from '@yakini/site-schema'
import * as Sentry from '@sentry/nextjs'
import { hostnameFor } from '@/lib/publish/slug'
import { operatorOf, opsRedirect } from '@/lib/server/ops'
import { goLive } from '@/lib/server/publish'
import { readCappedForm, originAllowed, requestOrigin } from '@/lib/server/request'
import { getRuntime } from '@/lib/server/runtime'
import { phase3Settings } from '@/lib/server/settings'

/**
 * POST /api/ops/reviews/[id] (spec 14.8 #6): Approve publishes the reviewed version (not the
 * current draft) and the site goes live; Reject keeps it on its preview. No email is sent about a
 * review (R5): the operator writes to the owner by hand when it matters. Audited.
 */
export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params
  if (!originAllowed(request.headers, [requestOrigin(request.url)])) return new Response('Forbidden', { status: 403 })
  const rt = getRuntime()
  const o = await operatorOf(rt)
  if (!o) return new Response('Not found', { status: 404 })
  const data = await readCappedForm(request, 4096)
  const decision = data?.get('decision')
  const note = typeof data?.get('note') === 'string' ? (data!.get('note') as string).slice(0, 500) || null : null
  if (!/^[0-9a-f-]{36}$/.test(id) || (decision !== 'approve' && decision !== 'reject')) return opsRedirect('/ops/reviews', 'bad_input')
  const review = await rt.store.getReview(id)
  if (!review || review.status !== 'pending') return opsRedirect('/ops/reviews', 'no_change')

  if (decision === 'reject') {
    const ok = await rt.store.decideReview({ reviewId: id, operatorId: o.user.id, approve: false, note })
    return opsRedirect('/ops/reviews', ok ? 'rejected' : 'no_change')
  }
  // A review opened by a refused preview link only clears the site for preview links; it never publishes.
  if (review.flags.some((f) => f.rule === 'share_link')) {
    const ok = await rt.store.decideReview({ reviewId: id, operatorId: o.user.id, approve: true, note })
    return opsRedirect('/ops/reviews', ok ? 'approved' : 'no_change')
  }
  try {
    const doc = loadSiteDoc(review.doc).doc
    const info = await rt.store.publishInfo(review.siteId)
    if (!info) return opsRedirect('/ops/reviews', 'failed')
    const slug = review.flags.find((f) => f.rule === 'address')?.match ?? info.slug
    const override = review.flags.find((f) => f.rule === 'override_reason')?.match ?? null
    const out = await goLive(rt, {
      siteId: review.siteId, doc, sha: review.docSha || (await import('@/lib/server/editor')).docSha256(doc), userId: o.user.id,
      slug, hostname: hostnameFor(slug, phase3Settings().rootDomain), actorKind: 'operator', override,
    })
    if (out.status !== 'live') return opsRedirect('/ops/reviews', 'failed')
    await rt.store.decideReview({ reviewId: id, operatorId: o.user.id, approve: true, note })
    return opsRedirect('/ops/reviews', 'approved')
  } catch (e) {
    Sentry.captureException(e, { tags: { area: 'ops-review' } })
    return opsRedirect('/ops/reviews', 'failed')
  }
}
