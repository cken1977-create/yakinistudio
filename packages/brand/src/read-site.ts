/**
 * Read a business's public website for a draft (spec 5.2 step 4c-d, 8.3). Server-only.
 * Home page plus up to 4 same-site pages (about, menu, services, contact/hours), all through the
 * pinned safe fetcher, honoring robots.txt. Never throws: an unreadable site is a normal outcome
 * that leads to the kit-default draft.
 */
import { extractBrand, type BrandProfile } from './extract-brand'
import { extractFacts, pickLinks, sameSite, MAX_IMAGE_CANDIDATES, type PageFacts } from './facts'
import { ALLOW_ALL, DISALLOW_ALL, parseRobots, robotsAllows, type Robots } from './robots'
import { DEFAULT_DEPS, SafeFetchError, safeFetch, type SafeFetchDeps } from './safe-fetch'
import { sanitizePublicHttpUrl } from './safe-url'

export type SiteReading =
  | { ok: true; finalUrl: URL; brand: BrandProfile; pages: PageFacts[]; images: { src: string; alt: string }[]; social: PageFacts['social'] }
  | { ok: false; reason: 'bad_url' | 'robots' | 'unreachable' }

async function loadRobots(origin: string, deps: SafeFetchDeps): Promise<Robots> {
  try {
    const r = await safeFetch(`${origin}/robots.txt`, { kind: 'text', maxRedirects: 2 }, deps)
    return parseRobots(r.body.toString('utf8'))
  } catch (e) {
    if (e instanceof SafeFetchError) {
      // No robots file (4xx) or an HTML "not found" page: nothing is disallowed (RFC 9309 2.3.1.3).
      if ((e.code === 'http' && e.status && e.status >= 400 && e.status < 500) || e.code === 'bad_type' || e.code === 'too_large') return ALLOW_ALL
    }
    // Server errors or no answer: assume complete disallow (RFC 9309 2.3.1.4).
    return DISALLOW_ALL
  }
}

const pathOf = (u: URL) => `${u.pathname}${u.search}`

export async function readSite(rawUrl: string, fallbackName: string | undefined, deps: SafeFetchDeps = DEFAULT_DEPS, maxExtraPages = 4): Promise<SiteReading> {
  const start = sanitizePublicHttpUrl(rawUrl)
  if (!start.ok) return { ok: false, reason: 'bad_url' }
  const robots = await loadRobots(start.url.origin, deps)
  if (!robotsAllows(robots, pathOf(start.url))) return { ok: false, reason: 'robots' }

  let home: { url: URL; html: string }
  try {
    const r = await safeFetch(start.url.toString(), { kind: 'html' }, deps)
    home = { url: r.url, html: r.body.toString('utf8') }
  } catch {
    return { ok: false, reason: 'unreachable' }
  }
  // A redirect may land on another host; its robots.txt is the one that applies.
  const finalRobots = home.url.origin === start.url.origin ? robots : await loadRobots(home.url.origin, deps)
  if (!robotsAllows(finalRobots, pathOf(home.url))) return { ok: false, reason: 'robots' }

  const brand = extractBrand(home.html, home.url, fallbackName)
  const homeFacts = extractFacts(home.html, home.url)
  const links = pickLinks(homeFacts, maxExtraPages).filter((href) => robotsAllows(finalRobots, pathOf(new URL(href))))
  const extra = await Promise.allSettled(links.map(async (href) => {
    const r = await safeFetch(href, { kind: 'html' }, deps)
    if (!sameSite(r.url, home.url)) throw new Error('left the site')
    return extractFacts(r.body.toString('utf8'), r.url)
  }))
  const pages = [homeFacts, ...extra.flatMap((x) => (x.status === 'fulfilled' ? [x.value] : []))]

  const seen = new Set<string>()
  const images: { src: string; alt: string }[] = []
  for (const p of pages) for (const img of p.images) {
    if (images.length >= MAX_IMAGE_CANDIDATES || seen.has(img.src)) continue
    seen.add(img.src)
    images.push(img)
  }
  const social: PageFacts['social'] = []
  for (const p of pages) for (const s of p.social) if (!social.some((x) => x.kind === s.kind)) social.push(s)
  return { ok: true, finalUrl: home.url, brand, pages, images, social }
}
