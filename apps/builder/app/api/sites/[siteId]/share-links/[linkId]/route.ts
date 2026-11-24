import { json, NOT_FOUND, withEditor } from '@/lib/server/editor'
import { siteMember } from '@/lib/server/publish'
import { originAllowed, requestOrigin } from '@/lib/server/request'

/** DELETE /api/sites/[siteId]/share-links/[linkId] (spec 14.8 #3): turn a preview link off. Owners, editors, operators. */
export const dynamic = 'force-dynamic'

export async function DELETE(request: Request, { params }: { params: Promise<{ siteId: string; linkId: string }> }): Promise<Response> {
  const { siteId, linkId } = await params
  return withEditor(async (rt) => {
    if (!originAllowed(request.headers, [requestOrigin(request.url)])) return json({ error: 'Forbidden' }, 403)
    const m = await siteMember(rt, siteId)
    if (!m || !/^[0-9a-f-]{36}$/.test(linkId)) return NOT_FOUND()
    const ok = await rt.store.revokeShareLink({ siteId, linkId, userId: m.user.id, actorKind: m.role })
    return ok ? json({ revoked: true }) : NOT_FOUND()
  })
}
