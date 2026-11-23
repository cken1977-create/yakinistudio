/**
 * Host routing decision (spec 13.5). Pure so it can be unit-tested; proxy.ts applies it.
 *   studio host / *.vercel.app preview / localhost  → studio routes (previews are noindex)
 *   /api/f/*                                         → form endpoint (site checked inside, Phase 3)
 *   anything else                                    → rewrite to the renderer /_site/{host}{path}
 */
export type HostDecision =
  | { kind: 'studio'; noindex: boolean }
  | { kind: 'form' }
  | { kind: 'site'; host: string; rewriteTo: string }
  | { kind: 'block' }

export const DEFAULT_STUDIO_HOST = 'studio.yakini.digital'

export function normalizeHost(raw: string | null | undefined): string {
  const h = (raw ?? '').trim().toLowerCase()
  // Strip port; keep IPv6 literals intact.
  if (h.startsWith('[')) return h.slice(0, h.indexOf(']') + 1)
  return h.split(':')[0].replace(/\.$/, '')
}

export function decideHost(rawHost: string | null | undefined, pathname: string, studioHost = DEFAULT_STUDIO_HOST): HostDecision {
  const host = normalizeHost(rawHost)
  // The renderer route is internal; never reachable directly from any host.
  if (pathname === '/_site' || pathname.startsWith('/_site/') || pathname.startsWith('/%5Fsite')) return { kind: 'block' }
  if (host === studioHost) return { kind: 'studio', noindex: false }
  if (host.endsWith('.vercel.app') || host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '') {
    return { kind: 'studio', noindex: true }
  }
  if (pathname.startsWith('/api/f/')) return { kind: 'form' }
  const path = pathname === '/' ? '' : pathname
  return { kind: 'site', host, rewriteTo: `/_site/${encodeURIComponent(host)}${path}` }
}
