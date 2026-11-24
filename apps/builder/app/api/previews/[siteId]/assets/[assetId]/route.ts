import { assetIdsIn } from '@/lib/draft/preview'
import { getRuntime } from '@/lib/server/runtime'
import { previewAccess } from '@/lib/server/share'

/**
 * Photos for a /p preview (spec 14.8 #3): only for someone allowed to see that preview, only ids
 * the previewed doc uses, only from the site's own tenant.
 */
export const dynamic = 'force-dynamic'

const NOT_FOUND = () => new Response('Not found', { status: 404, headers: { 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } })
const SAFE_TYPES = new Set(['image/webp', 'image/png', 'image/jpeg'])
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export async function GET(request: Request, { params }: { params: Promise<{ siteId: string; assetId: string }> }): Promise<Response> {
  const { siteId, assetId } = await params
  const q = new URL(request.url).searchParams
  if (!UUID.test(siteId) || !UUID.test(assetId)) return NOT_FOUND()
  let rt
  try { rt = getRuntime() } catch { return NOT_FOUND() }
  const v = q.get('v')
  const a = await previewAccess(rt, siteId, q.get('s'), v && UUID.test(v) ? v : null)
  if (!a) return NOT_FOUND()
  const { loadSiteDoc } = await import('@yakini/site-schema')
  let ids: Set<string>
  try { ids = assetIdsIn(loadSiteDoc(a.doc).doc) } catch { return NOT_FOUND() }
  if (!ids.has(assetId)) return NOT_FOUND()
  const file = await rt.store.getAsset(a.tenantId, assetId)
  if (!file || !SAFE_TYPES.has(file.mime)) return NOT_FOUND()
  return new Response(new Uint8Array(file.bytes), {
    headers: { 'content-type': file.mime, 'cache-control': 'private, max-age=3600', 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'none'; sandbox", 'x-robots-tag': 'noindex' },
  })
}
