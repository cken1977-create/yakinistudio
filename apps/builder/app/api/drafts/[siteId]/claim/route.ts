import { cookies } from 'next/headers'
import { applyOps, type EditOp } from '@yakini/edits'
import { loadSiteDoc, SiteDocError } from '@yakini/site-schema'
import { parseClaimForm } from '@/lib/claim'
import { currentUser } from '@/lib/server/auth'
import { openDraft } from '@/lib/server/draft-access'
import { withRuntime } from '@/lib/server/draft-flow'
import { draftCookieName, hashDraftToken } from '@/lib/server/draft-token'
import { clientIp, hashIp, originAllowed, readCappedForm, requestOrigin } from '@/lib/server/request'
import { clearHostCookie, seeOther, signinPath } from '@/lib/server/signin'
import { memberSite } from '@/lib/server/site-access'

/**
 * POST /api/drafts/[siteId]/claim (spec 5.4, 18): signed-in + this browser's draft cookie. In one
 * database step the person becomes the owner, the tenant moves to trial with the ownership
 * attestation (time + IP hash) and time zone, the draft token is cleared, and any details they
 * typed are saved. Details are saved only onto the draft they were looking at: if it changed in
 * another window meanwhile, they're asked to check and send again, so no edit is written over.
 */
export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: Promise<{ siteId: string }> }): Promise<Response> {
  const { siteId } = await params
  return withRuntime(async (rt) => {
    if (!originAllowed(request.headers, [requestOrigin(request.url)])) return new Response('Forbidden', { status: 403 })
    const back = (e: string) => seeOther(request, `/claim/${siteId}?e=${e}`)

    const user = await currentUser()
    if (!user) return seeOther(request, signinPath(`/claim/${siteId}`))

    const draft = await openDraft(rt, siteId)
    if (!draft) return (await memberSite(rt, siteId, user)) ? seeOther(request, `/sites/${siteId}/edit`) : back('gone')
    const token = (await cookies()).get(draftCookieName(siteId))?.value ?? ''

    const form = await readCappedForm(request, 16 * 1024)
    if (!form) return back('gone')
    const parsed = parseClaimForm(form)
    if (!parsed.ok) return back(parsed.error)
    if (String(form.get('rev') ?? '') !== String(draft.rev)) return back('changed')

    let doc
    try { doc = loadSiteDoc(draft.doc).doc } catch (e) { if (e instanceof SiteDocError) return back('gone'); throw e }

    // The form is prefilled, so what it holds is what the owner wants: a cleared field is removed.
    const v = parsed.value
    const ops: EditOp[] = [
      { op: 'update_business', field: 'phone', value: v.phone },
      { op: 'update_business', field: 'address', value: v.address },
      { op: 'update_business', field: 'hours', value: v.hours },
    ]
    const applied = applyOps(doc, ops, { allowedAssetIds: new Set<string>() })
    if (!applied.ok) return back('hours') // only reachable with values the form can't produce
    const changed = JSON.stringify(applied.doc) !== JSON.stringify(doc)

    const result = await rt.store.claimDraft({
      siteId, userId: user.id,
      tokenHash: hashDraftToken(token, rt.draftPepper),
      ipHash: hashIp(clientIp(request.headers), rt.ipPepper),
      timezone: v.timezone,
      doc: changed ? applied.doc : null,
      baseRev: changed ? draft.rev : null,
    })
    if (result === 'changed') return back('changed')
    if (result === 'expired') return back('expired')
    if (result !== 'ok') return (await memberSite(rt, siteId, user)) ? seeOther(request, `/sites/${siteId}/edit`) : back('gone')

    await clearHostCookie(draftCookieName(siteId)) // the token is already void; this just tidies the browser
    return seeOther(request, `/sites/${siteId}/edit?welcome=1`)
  })
}
