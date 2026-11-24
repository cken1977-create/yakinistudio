import { editorAccess, json, NOT_FOUND, withEditor } from '@/lib/server/editor'

/** GET /api/sites/[siteId]/assets: the business's own photos, for "Pick from your photos" (10.3). */
export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ siteId: string }> }): Promise<Response> {
  const { siteId } = await params
  return withEditor(async (rt) => {
    const a = await editorAccess(rt, siteId)
    if (!a) return NOT_FOUND()
    return json({ photos: await rt.store.tenantPhotos(a.tenantId) })
  })
}
