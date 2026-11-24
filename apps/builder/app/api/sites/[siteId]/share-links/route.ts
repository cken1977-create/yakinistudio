import { z } from 'zod'
import { loadSiteDoc } from '@yakini/site-schema'
import { docSha256, json, NOT_FOUND, readJson, withEditor } from '@/lib/server/editor'
import { operatorEmails, sendAlert } from '@/lib/server/mail'
import { refusal, riskFlags, siteMember } from '@/lib/server/publish'
import { PublishError } from '@/lib/server/publish-store'
import { originAllowed, requestOrigin } from '@/lib/server/request'
import { phase3Settings, studioOrigin } from '@/lib/server/settings'
import { hashShareToken, newShareToken } from '@/lib/server/share'

/**
 * POST /api/sites/[siteId]/share-links (spec 14.8 #3, 18): owners and editors of a claimed site
 * (ownership confirmed) can make a private, expiring preview link. Anonymous drafts can't. The
 * risk check runs first: a flagged site gets "We need to take a quick look first" and a review.
 */
export const dynamic = 'force-dynamic'

const Body = z.object({ versionId: z.uuid().optional(), days: z.number().int().min(1).max(30).optional() }).strict()

export async function POST(request: Request, { params }: { params: Promise<{ siteId: string }> }): Promise<Response> {
  const { siteId } = await params
  return withEditor(async (rt) => {
    if (!originAllowed(request.headers, [requestOrigin(request.url)])) return json({ error: 'Forbidden' }, 403)
    const m = await siteMember(rt, siteId)
    if (!m) return NOT_FOUND()
    if (m.role !== 'owner' && m.role !== 'editor') return json({ error: 'Only the owner or an editor can share a preview.' }, 403)
    if (!m.info.ownershipAttested) return json({ error: 'Confirm this is your business first.' }, 403)
    if (m.info.takedown) return json({ error: 'Your site is paused. Please contact Yakini.' }, 409)
    const parsed = Body.safeParse(await readJson(request, 512))
    if (!parsed.success) return json({ error: 'That link couldn’t be made.' }, 400)
    const s = phase3Settings()

    let doc
    try { doc = loadSiteDoc(m.site.doc).doc } catch { return json({ error: 'Your site file can’t be read. Please contact Yakini.' }, 422) }
    const flags = riskFlags(doc, m.info.slug, m.info)
    // An operator who approved this site's review has already taken the quick look.
    if (flags.length && m.info.reviewStatus !== 'approved') {
      if (m.info.reviewStatus !== 'pending') {
        await rt.store.requestReview({ siteId, doc, sha: docSha256(doc), userId: m.user.id, trigger: 'risk_check', flags: [...flags, { rule: 'share_link', match: 'refused' }] })
        await sendAlert({ to: operatorEmails(), tag: 'review-alert', subject: `Preview link held for review: ${doc.business.name}`.slice(0, 150), text: `A preview link was refused by the safety check and is waiting for a look.\n\nBusiness: ${doc.business.name}\nWhy: ${flags.map((f) => f.rule).join(', ')}\n\n${studioOrigin()}/ops/reviews\n` })
      }
      return json({ error: 'We need to take a quick look first. We’ll be in touch.' }, 409)
    }

    const token = newShareToken()
    try {
      const days = parsed.data.days ?? s.shareLinkDays
      const id = await rt.store.createShareLink({ siteId, versionId: parsed.data.versionId ?? null, tokenHash: hashShareToken(token, rt.draftPepper), userId: m.user.id, days, maxActive: s.shareLinkMaxActive })
      // The token is shown once, here, and never stored or logged.
      return json({ id, url: `${studioOrigin()}/p/${siteId}?s=${token}`, days }, 201)
    } catch (e) {
      if (e instanceof PublishError) { const r = refusal(e); return json({ error: r.message }, r.code) }
      throw e
    }
  })
}

export async function GET(request: Request, { params }: { params: Promise<{ siteId: string }> }): Promise<Response> {
  const { siteId } = await params
  return withEditor(async (rt) => {
    const m = await siteMember(rt, siteId)
    if (!m) return NOT_FOUND()
    return json({ links: await rt.store.listShareLinks(siteId) })
  })
}
