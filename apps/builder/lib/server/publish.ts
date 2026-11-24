import 'server-only'
import { riskCheck } from '@yakini/abuse'
import { safeFetch, SafeFetchError } from '@yakini/brand/safe-fetch'
import { kitDefinition } from '@yakini/kits'
import { loadSiteDoc, SiteDocError, type SiteDoc } from '@yakini/site-schema'
import { domainCapacity, domainLimitFromEnv } from '@/lib/domain-limit'
import { docChecks, externalUrls, item, MAX_EXTERNAL_URLS, visibleText, blockingFailures, type CheckItem } from '@/lib/publish/checks'
import { formsOf } from '@/lib/publish/forms'
import { hostnameFor, slugError } from '@/lib/publish/slug'
import { currentUser, type SessionUser } from './auth'
import { docSha256 } from './editor'
import { serverEnv } from './env'
import { operatorEmails, sendAlert } from './mail'
import { PublishError, type PublishSiteInfo, type RiskFlagRow } from './publish-store'
import type { Runtime } from './runtime'
import { phase3Settings, studioOrigin } from './settings'
import { refreshSite } from './site-cache'
import { memberSite } from './site-access'
import type { EditorSite, Role } from './store'
import { addProjectDomain, testAddDomain } from './vercel'

/**
 * Flow D (spec 5.6, 11.1, 11.2, 14.8 #6): checklist → plan gate → review gate → address → publish.
 * Owners and operators only (spec 18). Nothing here sends anything to a visitor or prospect.
 */

export type Manager = { user: SessionUser; role: Role; site: EditorSite; info: PublishSiteInfo }

/** A signed-in member of the site with its publish info, or null (shown as "not found"). */
export async function siteMember(rt: Runtime, siteId: string): Promise<Manager | null> {
  const user = await currentUser()
  const m = await memberSite(rt, siteId, user)
  if (!m || !user) return null
  const info = await rt.store.publishInfo(siteId)
  return info ? { user, role: m.role, site: m.site, info } : null
}

export const canPublish = (role: Role) => role === 'owner' || role === 'operator'

// ------------------------------------------------------------------------------------------ checks

type UrlCheck = (url: string) => Promise<boolean>

/** An outside link works when the server answers. Bot walls (401/403/405/429) count as answering. */
function realUrlCheck(rt: Runtime): UrlCheck {
  return async (url) => {
    try {
      await safeFetch(url, { kind: 'html', timeoutMs: 5000, maxBytes: 64 * 1024 }, rt.fetchDeps)
      return true
    } catch (e) {
      if (e instanceof SafeFetchError) {
        if (e.code === 'too_large' || e.code === 'bad_type') return true
        if (e.code === 'http' && e.status !== undefined && [401, 403, 405, 429].includes(e.status)) return true
      }
      return false
    }
  }
}
/** Test mode never reaches the internet: links whose host says "broken" fail, the rest pass. */
const testUrlCheck: UrlCheck = async (url) => !new URL(url).hostname.includes('broken')

export async function loadDraft(site: EditorSite): Promise<{ doc: SiteDoc } | { error: string }> {
  try { return { doc: loadSiteDoc(site.doc).doc } } catch (e) {
    if (e instanceof SiteDocError) return { error: e.code === 'too_new' ? e.message : 'Your site file can’t be read. Please contact Yakini.' }
    throw e
  }
}

export async function runChecklist(rt: Runtime, m: Manager, doc: SiteDoc): Promise<CheckItem[]> {
  const own = await rt.store.tenantAssetIds(m.site.tenantId)
  const samples = kitDefinition(doc.kitId)?.sampleImages?.map((s) => s.assetId) ?? []
  const items = docChecks(doc, { allowedAssetIds: new Set([...own, ...samples]) })

  const urls = externalUrls(doc).filter((u) => u.startsWith('https://')).slice(0, MAX_EXTERNAL_URLS)
  const check = rt.testMode ? testUrlCheck : realUrlCheck(rt)
  const results = await Promise.all(urls.map(async (u) => ({ u, ok: await check(u) })))
  const dead = results.filter((r) => !r.ok)
  if (dead.length) {
    const i = items.findIndex((x) => x.id === 'links_ok')
    if (items[i].ok) items[i] = item('links_ok', false, true, `${dead.length} outside link${dead.length === 1 ? ' doesn’t' : 's don’t'} open: ${dead.slice(0, 3).map((d) => new URL(d.u).hostname).join(', ')}.`)
  }

  items.push(item('ownership', m.info.ownershipAttested, true, m.info.ownershipAttested ? undefined : 'Confirm this is your business from “Make it mine”.'))
  items.push(item('not_taken_down', !m.info.takedown, true, m.info.takedown ? 'Your site is paused. Please contact Yakini.' : undefined))
  items.push(item('plan_active', m.info.hasPlan, true, m.info.hasPlan ? undefined : 'Choose a plan to go live. Your preview still works.'))
  return items
}

// ------------------------------------------------------------------------------------------ review gate

export function riskFlags(doc: SiteDoc, slug: string, info: PublishSiteInfo): RiskFlagRow[] {
  return riskCheck({ businessName: doc.business.name, slug, sourceUrl: info.sourceUrl, text: visibleText(doc).join('\n'), hasOpenAbuseReport: info.openReports > 0 })
}

/**
 * 14.8 #6 and REVIEW_GATE_MODE (Q10):
 * - a flagged site is always reviewed, on any publish;
 * - otherwise only a tenant's first live publish can wait: in `override_or_flagged` (default) when
 *   it is an operator override, in `all_first_publishes` always, in `flagged_only` never.
 */
export function needsReview(mode: ReturnType<typeof phase3Settings>['reviewGate'], firstLive: boolean, override: boolean, flagged: boolean): 'override' | 'risk_check' | null {
  if (flagged) return override && firstLive ? 'override' : 'risk_check'
  if (!firstLive || mode === 'flagged_only') return null
  if (mode === 'all_first_publishes') return override ? 'override' : 'risk_check'
  return override ? 'override' : null
}

// ------------------------------------------------------------------------------------------ publish

export type PublishOutcome =
  | { status: 'live'; url: string; number: number; address: 'active' | 'pending' }
  | { status: 'in_review' }
  | { status: 'blocked'; checks: CheckItem[] }
  | { status: 'refused'; message: string; code: number }

export async function publishSite(rt: Runtime, m: Manager, input: { slug: string; overrideReason: string | null }): Promise<PublishOutcome> {
  if (!canPublish(m.role)) return { status: 'refused', message: 'Only the owner can publish this site.', code: 403 }
  if (m.info.takedown) return { status: 'refused', message: 'Your site is paused. Please contact Yakini.', code: 409 }
  const s = phase3Settings()
  const slug = input.slug.trim().toLowerCase()
  const hostname = hostnameFor(slug, s.rootDomain)
  const slugMsg = slugError(slug, s.reservedExtra, await rt.store.slugTaken(slug, hostname, m.site.siteId))
  if (slugMsg) return { status: 'refused', message: slugMsg, code: 422 }

  const loaded = await loadDraft(m.site)
  if ('error' in loaded) return { status: 'refused', message: loaded.error, code: 422 }
  const doc = loaded.doc

  // Plan gate (5.6 step 3): without a plan only an operator with the override flag may publish, with a reason.
  let override: string | null = null
  if (!m.info.hasPlan) {
    const op = m.role === 'operator' ? await rt.store.operator(m.user.id) : null
    const reason = (input.overrideReason ?? '').trim()
    if (!op?.canOverridePublish || reason.length < 5) {
      return { status: 'refused', message: 'Choose a plan to go live. Your preview still works.', code: 402 }
    }
    override = reason.slice(0, 500)
  }

  const checks = await runChecklist(rt, m, doc)
  const failing = blockingFailures(checks).filter((c) => !(c.id === 'plan_active' && override))
  if (failing.length) return { status: 'blocked', checks }

  const sha = docSha256(doc)
  const flags = riskFlags(doc, slug, m.info)
  const review = needsReview(s.reviewGate, !m.info.firstLiveAt, Boolean(override), flags.length > 0)
  if (review) {
    const meta: RiskFlagRow[] = [{ rule: 'address', match: slug }, ...(override ? [{ rule: 'override_reason', match: override }] : [])]
    await rt.store.requestReview({ siteId: m.site.siteId, doc, sha, userId: m.user.id, trigger: review, flags: [...flags, ...meta] })
    await sendAlert({
      to: operatorEmails(), tag: 'review-alert',
      subject: `Site waiting for review: ${doc.business.name}`.slice(0, 150),
      text: `A site is waiting for a quick look before it goes live.\n\nBusiness: ${doc.business.name}\nAddress: ${hostname}\nWhy: ${review === 'override' ? 'publish without a plan' : 'safety check'}${flags.length ? ` (${flags.map((f) => f.rule).join(', ')})` : ''}\n\nOpen the review queue: ${studioOrigin()}/ops/reviews\n`,
    })
    return { status: 'in_review' }
  }
  return goLive(rt, { siteId: m.site.siteId, doc, sha, userId: m.user.id, slug, hostname, actorKind: m.role === 'operator' ? 'operator' : 'owner', override })
}

/** Steps 4-9 of 11.2: address, publish, refresh. Also used when an operator approves a review. */
export async function goLive(rt: Runtime, p: { siteId: string; doc: SiteDoc; sha: string; userId: string; slug: string; hostname: string; actorKind: 'owner' | 'operator'; override: string | null }): Promise<PublishOutcome> {
  const count = await rt.store.activeDomainCount()
  if (!domainCapacity(count, domainLimitFromEnv(serverEnv('VERCEL_PROJECT_DOMAIN_LIMIT'))).ok) {
    return { status: 'refused', message: 'We can’t add a new address right now. Please contact Yakini.', code: 503 }
  }
  const address = await (rt.testMode ? testAddDomain : addProjectDomain)(p.hostname)
  if (address === 'error') return { status: 'refused', message: 'We couldn’t set up your address. Please try again in a minute.', code: 502 }
  const before = await rt.store.siteHostnames(p.siteId)
  try {
    const v = await rt.store.publish({
      siteId: p.siteId, doc: p.doc, sha: p.sha, userId: p.userId, slug: p.slug, hostname: p.hostname, domainStatus: address,
      forms: formsOf(p.doc), actorKind: p.actorKind, overrideReason: p.override,
    })
    await refreshSite(rt, p.siteId, [...before, p.hostname])
    return { status: 'live', url: `https://${p.hostname}`, number: v.number, address }
  } catch (e) {
    if (e instanceof PublishError) return refusal(e)
    throw e
  }
}

export function refusal(e: PublishError): { status: 'refused'; message: string; code: number } {
  switch (e.code) {
    case 'taken_down': return { status: 'refused', message: 'Your site is paused. Please contact Yakini.', code: 409 }
    case 'address_taken': return { status: 'refused', message: 'That address is taken. Please pick another.', code: 409 }
    case 'version_not_found': return { status: 'refused', message: 'That version can’t be found.', code: 404 }
    case 'too_many_share_links': return { status: 'refused', message: 'You have 20 preview links already. Turn one off to make another.', code: 409 }
    default: return { status: 'refused', message: 'Not found', code: 404 }
  }
}
