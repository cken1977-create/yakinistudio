import 'server-only'
import { domainCapacity, domainLimitFromEnv } from '@/lib/domain-limit'
import { apexOf, hostLabel, parseDomainInput, type DomainInputError } from '@/lib/domain/parse'
import { DomainError, type CustomDomainRow, type DnsRecord, type DomainCheck, type DomainStatus } from './domain-store'
import { serverEnv } from './env'
import { canPublish, type Manager } from './publish'
import type { Runtime } from './runtime'
import { phase3Settings } from './settings'
import { refreshSite } from './site-cache'
import { vercelConfigured } from './vercel'
import { realDomainApi, testDomainApi, type DomainApi, type DomainInfo } from './vercel-domains'

/**
 * Phase 5a (docs/spec/phase-5.md): connect a client's own domain, show the DNS records Vercel asks
 * for, check them, make the domain the main address once it works, and remove it.
 */
export type DomainResultCode = DomainInputError | 'owner_only' | 'needs_plan' | 'has_custom_domain' | 'address_taken' | 'taken_down'
  | 'full' | 'not_ready' | 'vercel_down' | 'connected' | 'checked' | 'live' | 'removed' | 'no_domain'

export const domainApiFor = (rt: Runtime): DomainApi => (rt.testMode ? testDomainApi() : realDomainApi())
const ready = (rt: Runtime) => rt.testMode || vercelConfigured()

/** Which records the owner adds at their DNS provider, from Vercel's own answer. */
export function recordsFor(name: string, info: DomainInfo): DnsRecord[] {
  const apex = apexOf(name)
  const out: DnsRecord[] = []
  if (name === apex) for (const ip of info.ips) out.push({ type: 'A', host: '@', value: ip })
  else if (info.cname) out.push({ type: 'CNAME', host: hostLabel(name, apex), value: info.cname })
  for (const v of info.verification) {
    if (v.type.toUpperCase() !== 'TXT') continue
    const host = v.domain === apex ? '@' : v.domain.endsWith(`.${apex}`) ? hostLabel(v.domain, apex) : v.domain
    out.push({ type: 'TXT', host, value: v.value })
  }
  return out
}

export function statusFrom(info: DomainInfo | null): { status: DomainStatus; reason: string | null } {
  if (!info) return { status: 'error', reason: 'We couldn’t check this name just now.' }
  if (!info.verified) return { status: 'verifying', reason: 'Add the TXT record so we know the domain is yours.' }
  if (info.misconfigured) return { status: 'misconfigured', reason: 'The records aren’t showing yet. DNS changes can take up to a day.' }
  return { status: 'active', reason: null }
}

async function mayManage(rt: Runtime, m: Manager): Promise<DomainResultCode | null> {
  if (!canPublish(m.role)) return 'owner_only'
  if (!m.info.hasPlan && m.role !== 'operator') return 'needs_plan'
  if (m.info.takedown) return 'taken_down'
  if (!ready(rt)) return 'not_ready'
  return null
}

export async function connectDomain(rt: Runtime, m: Manager, input: string): Promise<DomainResultCode> {
  const gate = await mayManage(rt, m)
  if (gate) return gate
  const parsed = parseDomainInput(input, phase3Settings().rootDomain)
  if ('error' in parsed) return parsed.error
  if ((await rt.store.customDomains(m.site.siteId)).length) return 'has_custom_domain'
  const count = await rt.store.activeDomainCount()
  if (!domainCapacity(count, domainLimitFromEnv(serverEnv('VERCEL_PROJECT_DOMAIN_LIMIT')), parsed.names.length).ok) return 'full'

  const api = domainApiFor(rt)
  const added: string[] = []
  for (const n of parsed.names) {
    const r = await api.add(n)
    if (r !== 'ok') {
      for (const a of added) await api.remove(a)
      return r === 'taken' ? 'address_taken' : 'vercel_down'
    }
    added.push(n)
  }
  try {
    await rt.store.addCustomDomain(m.site.siteId, m.user.id, parsed.names, api.project)
  } catch (e) {
    for (const a of added) await api.remove(a)
    if (e instanceof DomainError && e.code !== 'not_found') return e.code
    throw e
  }
  await checkSiteDomains(rt, m.site.siteId)
  return 'connected'
}

/** Ask Vercel about each name, store the records and status; the main name goes primary once live. */
export async function checkSiteDomains(rt: Runtime, siteId: string): Promise<CustomDomainRow[]> {
  const rows = await rt.store.customDomains(siteId)
  if (!rows.length || !ready(rt)) return rows
  const api = domainApiFor(rt)
  const main = rows[0].hostname
  let changed = false
  for (const r of rows) {
    const info = await api.inspect(r.hostname)
    if (!info) {
      // Vercel unreachable: keep what we knew; a missing name is re-added once.
      if (r.status !== 'active' && (await api.add(r.hostname)) === 'ok') continue
      await rt.store.setDomainStatus(r.hostname, r.status === 'active' ? 'active' : 'error', r.check, false)
      continue
    }
    const { status, reason } = statusFrom(info)
    const check: DomainCheck = { records: recordsFor(r.hostname, info), reason }
    if (status !== r.status || (status === 'active' && r.hostname === main && !r.isPrimary)) changed = true
    await rt.store.setDomainStatus(r.hostname, status, check, r.hostname === main)
  }
  if (changed) await refreshSite(rt, siteId)
  return rt.store.customDomains(siteId)
}

export async function recheckDomains(rt: Runtime, m: Manager): Promise<DomainResultCode> {
  if (!canPublish(m.role)) return 'owner_only'
  const rows = await checkSiteDomains(rt, m.site.siteId)
  if (!rows.length) return 'no_domain'
  return rows[0].status === 'active' ? 'live' : 'checked'
}

export async function removeDomain(rt: Runtime, m: Manager): Promise<DomainResultCode> {
  if (!canPublish(m.role)) return 'owner_only'
  const before = await rt.store.siteHostnames(m.site.siteId)
  const gone = await rt.store.removeCustomDomain(m.site.siteId, m.user.id)
  if (!gone.length) return 'no_domain'
  if (ready(rt)) {
    const api = domainApiFor(rt)
    for (const n of gone) await api.remove(n)
  }
  await refreshSite(rt, m.site.siteId, before)
  return 'removed'
}

/** Nightly: check custom domains still waiting for DNS. */
export async function checkWaitingDomains(rt: Runtime, limit = 50): Promise<number> {
  if (!ready(rt)) return 0
  const sites = await rt.store.sitesWithWaitingDomains(limit)
  for (const s of sites) await checkSiteDomains(rt, s).catch(() => undefined)
  return sites.length
}

export const DOMAIN_RESULTS: Record<string, string> = {
  owner_only: 'Only the owner can change the domain.',
  needs_plan: 'Choose a plan first. Your own domain comes with every plan.',
  has_custom_domain: 'This site already has a domain. Remove it first to use another.',
  address_taken: 'That domain is already used by another website. If it’s yours, remove it there first.',
  taken_down: 'Your site is paused. Please contact Yakini.',
  full: 'We can’t add a new domain right now. Please contact Yakini.',
  not_ready: 'Domains aren’t set up yet. Please contact Yakini.',
  vercel_down: 'We couldn’t add your domain just now. Please try again in a minute.',
  connected: 'Domain added. Now add the records below where you bought your domain.',
  checked: 'Checked. It isn’t ready yet; see below.',
  live: 'Your domain works! It is now your site’s main address.',
  removed: 'Domain removed. Your free address is the main one again.',
  no_domain: 'There’s no domain to change.',
}
