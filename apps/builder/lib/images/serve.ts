import 'server-only'
import type { DraftStore } from '@/lib/server/store'
import { VARIANT_KEY } from './resolve'

/**
 * The bytes an asset route sends (design D4): the stored file, or with `?img=<crop>-<width>.<format>`
 * one of its AVIF/WebP copies. Callers have already checked who may see the asset; this only checks
 * the copy name (a strict pattern, so nothing else reaches storage paths) and the file type.
 */
const SAFE_TYPES = new Set(['image/webp', 'image/png', 'image/jpeg', 'image/avif'])

export async function assetFile(store: DraftStore, tenantId: string, assetId: string, img: string | null): Promise<{ bytes: Buffer; mime: string } | null> {
  if (img !== null) {
    if (!VARIANT_KEY.test(img)) return null
    const v = await store.getAssetVariant(tenantId, assetId, img)
    return v && SAFE_TYPES.has(v.mime) ? v : null
  }
  const file = await store.getAsset(tenantId, assetId)
  return file && SAFE_TYPES.has(file.mime) && file.mime !== 'image/avif' ? { bytes: file.bytes, mime: file.mime } : null
}
