import { createHash, randomUUID } from 'node:crypto'
import { encodePhoto, sniffImage } from '@/lib/pipeline/images'
import { editorAccess, json, NOT_FOUND, withEditor } from '@/lib/server/editor'
import { clientIp, hashIp, originAllowed, readCappedForm, requestOrigin } from '@/lib/server/request'

/**
 * POST /api/assets (spec 10.3, 14.5, 18): upload a photo from the editor. Members, and the
 * anonymous draft holder with a lower limit. JPEG, PNG or WebP up to 10 MB, checked by its bytes
 * (not its name), re-encoded to WebP (which drops location and camera data), max 1600 px wide.
 * The owner's own upload, so it may go in their downloads later.
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const MAX_BYTES = 10 * 1024 * 1024
const OK_KINDS = new Set(['jpeg', 'png', 'webp'])

export async function POST(request: Request): Promise<Response> {
  return withEditor(async (rt) => {
    if (!originAllowed(request.headers, [requestOrigin(request.url)])) return json({ error: 'Forbidden' }, 403)
    if (!(request.headers.get('content-type') ?? '').startsWith('multipart/form-data')) return json({ error: 'Please choose a photo to upload.' }, 400)
    const form = await readCappedForm(request, MAX_BYTES + 16 * 1024)
    if (!form) return json({ error: 'That photo is too large. Please use one under 10 MB.' }, 413)
    const siteId = String(form.get('siteId') ?? '')
    const a = await editorAccess(rt, siteId)
    if (!a) return NOT_FOUND()

    const key = a.kind === 'member' ? `upload:t:${a.tenantId}` : `upload:ip:${hashIp(clientIp(request.headers), rt.ipPepper)}`
    if (!(await rt.store.hitRateLimit(key, a.kind === 'member' ? 100 : 20, 3600))) return json({ error: 'That’s a lot of photos for now. Please try again in an hour.' }, 429)

    const file = form.get('file')
    if (!file || typeof file === 'string' || file.size === 0) return json({ error: 'Please choose a photo to upload.' }, 400)
    const bytes = Buffer.from(await file.arrayBuffer())
    if (!OK_KINDS.has(sniffImage(bytes) ?? '')) return json({ error: 'Please use a JPG, PNG or WebP photo.' }, 415)
    const alt = String(form.get('alt') ?? '').replace(/\s+/g, ' ').trim().slice(0, 160)

    let photo
    try { photo = await encodePhoto(bytes) } catch { return json({ error: 'We couldn’t read that photo. Please try another one.' }, 422) }
    const id = randomUUID()
    await rt.store.saveAsset({
      id, tenantId: a.tenantId, kind: 'image', bytes: photo.bytes, mime: 'image/webp', width: photo.width, height: photo.height,
      alt: alt || 'Photo', source: 'upload', sourceUrl: null, sha256: createHash('sha256').update(photo.bytes).digest('hex'),
      licenseKind: 'owner_upload', licenseNote: 'Uploaded by the owner in the editor', redistributable: true,
    })
    return json({ id, width: photo.width, height: photo.height }, 201)
  })
}
