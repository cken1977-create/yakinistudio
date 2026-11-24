import 'server-only'
import { revalidateTag, unstable_cache } from 'next/cache'
import type { HostState } from './publish-store'
import type { Runtime } from './runtime'

/**
 * Renderer caching (spec 13.5, 11.2 step 7). Each host lookup is cached and tagged with the host.
 * refreshSite() revalidates every address a site has ever had, so publish, rollback, unpublish, takedown and restore refresh every address of a
 * site at once. `expire: 0` means the very next request is fresh (no stale window), which is how
 * "live within 10 seconds" holds. A 5-minute lifetime is a safety net, not the normal path.
 */
export const hostTag = (host: string) => `host:${host}`

export async function cachedSiteForHost(rt: Runtime, host: string): Promise<HostState | null> {
  if (rt.testMode) return rt.store.siteForHost(host) // the memory store lives in this process; no cache needed
  return unstable_cache(() => rt.store.siteForHost(host), ['site-for-host', host], { tags: [hostTag(host)], revalidate: 300 })()
}

/** Refresh every cached lookup for a site: all its addresses, old and new. */
export async function refreshSite(rt: Runtime, siteId: string, extraHosts: readonly string[] = []): Promise<void> {
  const hosts = new Set([...(await rt.store.siteHostnames(siteId)), ...extraHosts])
  try {
    for (const h of hosts) revalidateTag(hostTag(h), { expire: 0 })
  } catch {
    // Outside a request (unit tests) there is no cache to refresh.
  }
}
