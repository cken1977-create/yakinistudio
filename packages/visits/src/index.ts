/**
 * Cookie-free visit counting helpers (spec 11.6, Q17). Pure functions only: the
 * middleware (Phase 6) calls these, then builder.record_visit() via the service role.
 * No raw IP, cookie, full user agent or full referrer is ever stored.
 */
export type VisitSource = 'direct' | 'search' | 'social' | 'other'

export const BOT_UA = /(bot|crawler|spider|crawling|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|whatsapp|telegrambot|discordbot|slackbot|twitterbot|linkedinbot|pinterest|headlesschrome|lighthouse|pagespeed|curl|wget|python-requests|httpclient|go-http-client|axios|node-fetch|uptime|monitor|preview)/i

export function isBot(userAgent: string | null | undefined): boolean {
  return !userAgent || BOT_UA.test(userAgent)
}

/** Only real page views count: GET, not prefetch/prerender, HTML navigations. */
export function isCountableRequest(r: { method: string; headers: { get(name: string): string | null } }): boolean {
  if (r.method !== 'GET') return false
  const purpose = (r.headers.get('purpose') || r.headers.get('sec-purpose') || r.headers.get('x-purpose') || '').toLowerCase()
  if (purpose.includes('prefetch') || purpose.includes('prerender')) return false
  if (r.headers.get('next-router-prefetch') || r.headers.get('rsc')) return false
  const dest = r.headers.get('sec-fetch-dest')
  if (dest && dest !== 'document') return false
  return !isBot(r.headers.get('user-agent'))
}

const SEARCH = ['google.', 'bing.com', 'duckduckgo.com', 'search.yahoo.', 'yahoo.com', 'ecosia.org', 'baidu.com', 'yandex.', 'search.brave.com']
const SOCIAL = ['facebook.com', 'fb.com', 'instagram.com', 't.co', 'twitter.com', 'x.com', 'tiktok.com', 'linkedin.com', 'lnkd.in', 'pinterest.', 'youtube.com', 'reddit.com', 'nextdoor.com', 'yelp.com', 'threads.net']

/** Maps a referrer to a bucket. Only the bucket is stored, never the referrer. */
export function sourceFromReferrer(referrer: string | null | undefined, ownHosts: readonly string[] = []): VisitSource {
  if (!referrer) return 'direct'
  let host: string
  try { host = new URL(referrer).hostname.toLowerCase() } catch { return 'other' }
  if (ownHosts.includes(host)) return 'direct'
  const h = host.replace(/^(www|m|l|lm)\./, '')
  if (SEARCH.some((s) => h.includes(s))) return 'search'
  if (SOCIAL.some((s) => h === s || h.endsWith(`.${s}`) || (s.endsWith('.') && h.startsWith(s)))) return 'social'
  return 'other'
}

/** Page slug from a site path: '/' → '', '/menu/' → 'menu'; unknown pages are not counted. */
export function pageSlugFor(path: string, knownSlugs: readonly string[]): string | null {
  const slug = path.split('?')[0].replace(/^\/+|\/+$/g, '').toLowerCase()
  return knownSlugs.includes(slug) ? slug : null
}

/**
 * Daily visitor hash: sha256(daily salt + site + ip + ua). The salt is deleted after 48h
 * (visit_salts), so a hash can never be linked back. The raw IP/UA never leave memory.
 */
export async function visitorHash(saltHex: string, siteId: string, ip: string, userAgent: string): Promise<string> {
  const data = new TextEncoder().encode(`${saltHex}|${siteId}|${ip}|${userAgent}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}
