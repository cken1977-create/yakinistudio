/**
 * Outbound link policy (spec 8.8, 14.3, 14.8 #1). A client site may link out only to the
 * business's own website, its social pages and map directions. Anything else is removed from AI
 * output and flagged at publish, unless the owner adds it by hand (Phase 2+).
 */
import type { LinkTarget } from './sections'

/** Social and map hosts a site may link to (registrable domains; subdomains included). */
export const ALLOWED_SOCIAL_HOSTS = [
  'facebook.com', 'fb.com', 'instagram.com', 'tiktok.com', 'youtube.com', 'youtu.be', 'x.com', 'twitter.com',
  'linkedin.com', 'yelp.com', 'google.com', 'g.page', 'goo.gl', 'maps.app.goo.gl', 'maps.apple.com',
] as const

/** Hosts that count as "the business's own website" for a source URL (www and apex). */
export function ownHostsFor(sourceUrl: string | null | undefined): string[] {
  if (!sourceUrl) return []
  try {
    const h = new URL(sourceUrl).hostname.toLowerCase().replace(/\.$/, '')
    const apex = h.replace(/^www\./, '')
    return [...new Set([apex, `www.${apex}`])]
  } catch { return [] }
}

function hostMatches(host: string, allowed: string): boolean {
  return host === allowed || host.endsWith(`.${allowed}`)
}

/** May this https URL appear as a link on the site? */
export function isAllowedOutboundUrl(url: string, ownHosts: readonly string[]): boolean {
  let u: URL
  try { u = new URL(url) } catch { return false }
  if (u.protocol !== 'https:' || u.username || u.password) return false
  const host = u.hostname.toLowerCase().replace(/\.$/, '')
  if (ownHosts.some((h) => hostMatches(host, h.replace(/^www\./, '')))) return true
  return ALLOWED_SOCIAL_HOSTS.some((h) => hostMatches(host, h))
}

/** Is this LinkTarget allowed under the outbound policy? Non-URL links are always fine. */
export function isAllowedLink(link: LinkTarget, ownHosts: readonly string[]): boolean {
  return link.kind !== 'url' || isAllowedOutboundUrl(link.url, ownHosts)
}
