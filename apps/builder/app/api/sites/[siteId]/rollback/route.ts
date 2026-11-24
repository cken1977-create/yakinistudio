import { z } from 'zod'
import { json, NOT_FOUND, readJson, withEditor } from '@/lib/server/editor'
import { canPublish, refusal, siteMember } from '@/lib/server/publish'
import { PublishError } from '@/lib/server/publish-store'
import { originAllowed, requestOrigin } from '@/lib/server/request'
import { refreshSite } from '@/lib/server/site-cache'

/** POST /api/sites/[siteId]/rollback {versionId} (spec 5.6 step 7, 11.2): live site back to an earlier published version. */
export const dynamic = 'force-dynamic'

const Body = z.object({ versionId: z.uuid() }).strict()

export async function POST(request: Request, { params }: { params: Promise<{ siteId: string }> }): Promise<Response> {
  const { siteId } = await params
  return withEditor(async (rt) => {
    if (!originAllowed(request.headers, [requestOrigin(request.url)])) return json({ error: 'Forbidden' }, 403)
    const m = await siteMember(rt, siteId)
    if (!m) return NOT_FOUND()
    if (!canPublish(m.role)) return json({ error: 'Only the owner can change the live site.' }, 403)
    const parsed = Body.safeParse(await readJson(request, 512))
    if (!parsed.success) return json({ error: 'That version couldn’t be read.' }, 400)
    try {
      const number = await rt.store.rollback({ siteId, versionId: parsed.data.versionId, userId: m.user.id, actorKind: m.role })
      await refreshSite(rt, siteId)
      return json({ status: 'live', number })
    } catch (e) {
      if (e instanceof PublishError) { const r = refusal(e); return json({ error: r.message }, r.code) }
      throw e
    }
  })
}
