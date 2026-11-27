/**
 * Host routing decision (spec 13.5). Pure so it can be unit-tested; proxy.ts applies it.
 *   studio host / *.vercel.app preview / localhost  → studio routes (previews are noindex)
 *   /api/f/*                                         → form endpoint (site checked inside, Phase 3)
 *   /kit-samples/*                                   → shared sample photos (static files)
 *   anything else                                    → rewrite to the renderer /_site/{host}{path}
 */
export type HostDecision =
  | { kind: 'studio'; noindex: boolean }
  | { kind: 'form' }
  | { kind: 'site'; host: string; rewriteTo: string }
  | { kind: 'static' }
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
  // Kit sample photos are plain files in the studio's public folder, shared by every site.
  if (pathname.startsWith('/kit-samples/')) return { kind: 'static' }
  // The published-site stylesheet and fonts (built by scripts/build-site-css.mjs), shared by every site.
  if (pathname.startsWith('/_site-assets/')) return { kind: 'static' }
  // Next reserves a sitemap.xml folder for its own sitemap convention, so the route lives at sitemap-xml.
  const path = pathname === '/' ? '' : pathname === '/sitemap.xml' ? '/sitemap-xml' : pathname
  return { kind: 'site', host, rewriteTo: `/_site/${encodeURIComponent(host)}${path}` }
}
