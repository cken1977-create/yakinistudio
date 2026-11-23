import { loadSiteDoc } from '@yakini/site-schema'
import { assetIdsIn } from '@/lib/draft/preview'
import { openDraft } from '@/lib/server/draft-access'
import { getRuntime } from '@/lib/server/runtime'

/**
 * A private draft's own photos and logo (spec 5.2, 14.2). Only the browser holding that draft's
 * cookie gets them, only for files the draft itself uses, and only from its own tenant. Bytes are
 * served as the re-encoded WebP/PNG we stored, never the original upload.
 */
export const dynamic = 'force-dynamic'

const NOT_FOUND = () => new Response('Not found', { status: 404, headers: { 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } })
const SAFE_TYPES = new Set(['image/webp', 'image/png', 'image/jpeg'])

export async function GET(_req: Request, { params }: { params: Promise<{ siteId: string; assetId: string }> }): Promise<Response> {
  const { siteId, assetId } = await params
  let rt
  try { rt = getRuntime() } catch { return NOT_FOUND() }
  const draft = await openDraft(rt, siteId)
  if (!draft) return NOT_FOUND()
  let used: Set<string>
  try { used = assetIdsIn(loadSiteDoc(draft.doc).doc) } catch { return NOT_FOUND() }
  if (!used.has(assetId)) return NOT_FOUND()
  const asset = await rt.store.getAsset(draft.tenantId, assetId)
  if (!asset || !SAFE_TYPES.has(asset.mime)) return NOT_FOUND()
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
