import 'server-only'
import { unstable_cache } from 'next/cache'
import { sampleImageById } from '@yakini/kits'
import type { SiteDoc } from '@yakini/site-schema'
import { assetIdsIn } from '@/lib/draft/preview'
import type { AssetMetaMap } from '@/lib/images/resolve'
import type { Runtime } from '@/lib/server/runtime'

/**
 * Design D4: a published version's photo details (sizes, copies, placeholders, focus points), read
 * once per version and cached, so a page view does no database work for its photos. A published
 * version never changes and asset ids never change content, so the cache never goes stale.
 */
export type MetaSite = { siteId: string; versionId: string | null; doc: SiteDoc }

/** Stored-photo ids in a doc (kit samples resolve without the database). */
export const storedAssetIds = (doc: SiteDoc) => [...assetIdsIn(doc)].filter((id) => !sampleImageById(id)).sort()

async function read(rt: Pick<Runtime, 'store'>, s: MetaSite): Promise<AssetMetaMap> {
  const ids = storedAssetIds(s.doc)
  if (!ids.length) return {}
  const editor = await rt.store.getEditorSite(s.siteId)
  if (!editor) return {}
  return rt.store.assetMeta(editor.tenantId, ids)
}

export async function assetMetaFor(rt: Pick<Runtime, 'store' | 'testMode'>, s: MetaSite): Promise<AssetMetaMap> {
  if (rt.testMode || !s.versionId) return read(rt, s)
  return unstable_cache(() => read(rt, s), ['asset-meta', s.siteId, s.versionId], { revalidate: false, tags: [`asset-meta:${s.siteId}`] })()
}
