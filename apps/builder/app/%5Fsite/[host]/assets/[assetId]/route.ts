import { assetIdsIn } from '@/lib/draft/preview'
import { getRuntime } from '@/lib/server/runtime'
import { assetFile } from '@/lib/images/serve'
import { liveSite } from '@/lib/site/resolve'

/**
 * A live site's own photos (spec 7.3, 14.5): only ids its published version refers to, only from
 * its own tenant. Asset ids never change content, so they (and their AVIF/WebP copies, ?img=) cache
 * for a year. No cookies.
 */
export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const missing = () => new Response('Not found', { status: 404, headers: { 'cache-control': 'no-store' } })

export async function GET(request: Request, { params }: { params: Promise<{ host: string; assetId: string }> }): Promise<Response> {
  const p = await params
  const assetId = p.assetId.toLowerCase()
  if (!UUID.test(assetId)) return missing()
  const s = await liveSite(decodeURIComponent(p.host))
  if (s.kind !== 'site' || !assetIdsIn(s.site.doc).has(assetId)) return missing()
  const rt = getRuntime()
  const editor = await rt.store.getEditorSite(s.site.siteId)
  if (!editor) return missing()
  const file = await assetFile(rt.store, editor.tenantId, assetId, new URL(request.url).searchParams.get('img'))
  if (!file) return missing()
  return new Response(new Uint8Array(file.bytes), {
    headers: { 'content-type': file.mime, 'cache-control': 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'none'; sandbox" },
  })
}
