import { json, NOT_FOUND, withEditor } from '@/lib/server/editor'
import { canPublish, siteMember } from '@/lib/server/publish'
import { originAllowed, requestOrigin } from '@/lib/server/request'
import { refreshSite } from '@/lib/server/site-cache'

/**
 * POST /api/sites/[siteId]/unpublish (spec 11.2): the address then shows a neutral "This site is
 * being updated" page (noindex). Versions stay; publishing again brings it back.
 */
export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: Promise<{ siteId: string }> }): Promise<Response> {
  const { siteId } = await params
  return withEditor(async (rt) => {
    if (!originAllowed(request.headers, [requestOrigin(request.url)])) return json({ error: 'Forbidden' }, 403)
    const m = await siteMember(rt, siteId)
    if (!m) return NOT_FOUND()
    if (!canPublish(m.role)) return json({ error: 'Only the owner can change the live site.' }, 403)
    const changed = await rt.store.unpublish({ siteId, userId: m.user.id, actorKind: m.role })
    await refreshSite(rt, siteId)
    return json({ status: 'unpublished', changed })
  })
}
