import 'server-only'
import * as Sentry from '@sentry/nextjs'
import { loadSiteDoc, type Page, type SiteDoc } from '@yakini/site-schema'
import { pageForPath } from '@/lib/draft/preview'
import { getRuntime } from '@/lib/server/runtime'
import { phase3Settings } from '@/lib/server/settings'
import { cachedSiteForHost } from '@/lib/server/site-cache'

/**
 * What a client host shows (spec 11.2, 11.4, 13.5, 14.8 #9). One place decides, so the page,
 * its metadata, robots.txt and sitemap.xml always agree.
 */
export type SiteView =
  | { kind: 'unknown' } | { kind: 'taken_down' } | { kind: 'missing' } | { kind: 'updating' } | { kind: 'error' }
  | { kind: 'redirect'; to: string }
  | ({ kind: 'page'; page: Page } & LiveSite)
  | ({ kind: 'thanks'; page: Page; formKey: string | null } & LiveSite)

export type LiveSite = { siteId: string; versionId: string | null; doc: SiteDoc; canonicalHost: string; indexable: boolean; reportLinkHidden: boolean }

const HOST_RE = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{1,62}$/

export async function liveSite(host: string): Promise<{ kind: 'site'; site: LiveSite; primaryHost: string | null } | { kind: 'unknown' | 'taken_down' | 'updating' | 'error' }> {
  if (!HOST_RE.test(host) || host.length > 253) return { kind: 'unknown' }
  let hs
  try { hs = await cachedSiteForHost(getRuntime(), host) } catch (e) {
    Sentry.captureException(e, { tags: { area: 'renderer' } }) // host only; no doc contents
    return { kind: 'error' }
  }
  if (!hs) return { kind: 'unknown' }
  if (hs.state === 'taken_down') return { kind: 'taken_down' }
  if (hs.state === 'unpublished' || !hs.doc) return { kind: 'updating' }
  let doc: SiteDoc
  try { doc = loadSiteDoc(hs.doc).doc } catch {
    // 7.4: a published version that can't be read is never half-shown.
    Sentry.captureMessage('published version failed to load', { level: 'error', tags: { area: 'renderer', version: hs.versionId ?? '' } })
    return { kind: 'error' }
  }
  const canonicalHost = hs.primaryHost ?? host
  const root = phase3Settings().rootDomain
  // Q11: the Report link may be hidden only on a paid site whose main address is its own domain.
  const ownDomain = !canonicalHost.endsWith(`.${root}`)
  return {
    kind: 'site', primaryHost: hs.primaryHost,
    site: { siteId: hs.siteId, versionId: hs.versionId, doc, canonicalHost, indexable: hs.hasPlan && hs.indexable, reportLinkHidden: hs.reportLinkHidden && hs.hasPlan && ownDomain },
  }
}

export async function siteView(host: string, path: string[] | undefined, formKey: string | null = null): Promise<SiteView> {
  const s = await liveSite(host)
  if (s.kind !== 'site') return { kind: s.kind } as SiteView
  if (s.primaryHost && s.primaryHost !== host) {
    const rest = (path ?? []).map(encodeURIComponent).join('/')
    return { kind: 'redirect', to: `https://${s.primaryHost}/${rest}` }
  }
  const segs = path ?? []
  if (segs.length === 1 && segs[0] === 'thanks' && !s.site.doc.pages.some((p) => p.slug === 'thanks')) {
    return { kind: 'thanks', page: s.site.doc.pages[0], formKey: formKey && /^[a-z0-9-]{1,40}$/.test(formKey) ? formKey : null, ...s.site }
  }
  const page = pageForPath(s.site.doc, segs)
  return page ? { kind: 'page', page, ...s.site } : { kind: 'missing' }
}
