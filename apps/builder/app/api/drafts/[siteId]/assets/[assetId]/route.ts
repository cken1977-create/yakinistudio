import { viewableDraft } from '@/lib/server/site-access'
import { getRuntime } from '@/lib/server/runtime'
import { assetFile } from '@/lib/images/serve'

/**
 * A private draft's own photos and logo (spec 5.2, 14.2). Only the browser holding that draft's
 * cookie (or, once claimed, a signed-in member) gets them, and only files of that draft's own
 * tenant (its photo library, for the editor's photo picker). Bytes are
 * served as the re-encoded WebP/PNG we stored, never the original upload.
 */
export const dynamic = 'force-dynamic'

const NOT_FOUND = () => new Response('Not found', { status: 404, headers: { 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } })

export async function GET(req: Request, { params }: { params: Promise<{ siteId: string; assetId: string }> }): Promise<Response> {
  const { siteId, assetId } = await params
  let rt
  try { rt = getRuntime() } catch { return NOT_FOUND() }
  const draft = await viewableDraft(rt, siteId)
  if (!draft) return NOT_FOUND()
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(assetId)) return NOT_FOUND()
  const asset = await assetFile(rt.store, draft.tenantId, assetId, new URL(req.url).searchParams.get('img'))
  if (!asset) return NOT_FOUND()
  return new Response(new Uint8Array(asset.bytes), {
    status: 200,
    headers: {
      'content-type': asset.mime,
      'content-length': String(asset.bytes.length),
      'cache-control': 'private, max-age=3600',
      'x-content-type-options': 'nosniff',
      'content-security-policy': "default-src 'none'; sandbox",
      'x-robots-tag': 'noindex',
    },
  })
}
