import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { MemBase, MemPublishState } from './publish-store'

/**
 * Phase 5a storage: a site's own domain (docs/spec/phase-5.md). Writes go through the server-only
 * functions of migration 20261126000300; the memory version mirrors them for tests.
 */

export type DomainStatus = 'pending' | 'verifying' | 'active' | 'misconfigured' | 'error'
export type DnsRecord = { type: 'A' | 'CNAME' | 'TXT'; host: string; value: string }
/** What we last learned from Vercel about a name: the records to add, and why it isn't live yet. */
export type DomainCheck = { records: DnsRecord[]; reason: string | null }
export type CustomDomainRow = { hostname: string; status: DomainStatus; isPrimary: boolean; check: DomainCheck | null; lastCheckedAt: Date | null }

export class DomainError extends Error {
  constructor(public readonly code: 'has_custom_domain' | 'address_taken' | 'taken_down' | 'not_found') { super(code); this.name = 'DomainError' }
}

export interface DomainStore {
  customDomains(siteId: string): Promise<CustomDomainRow[]>
  addCustomDomain(siteId: string, userId: string, names: string[], project: string | null): Promise<void>
  setDomainStatus(hostname: string, status: DomainStatus, check: DomainCheck | null, makePrimary: boolean): Promise<void>
  removeCustomDomain(siteId: string, userId: string): Promise<string[]>
  /** Sites with a custom domain that isn't live yet (the nightly check). */
  sitesWithWaitingDomains(limit: number): Promise<string[]>
}

export function createSupabaseDomainStore(db: SupabaseClient<any, any, any>): DomainStore { // eslint-disable-line @typescript-eslint/no-explicit-any
  const fail = (what: string, error: { message?: string } | null): never => {
    for (const code of ['has_custom_domain', 'address_taken', 'taken_down'] as const) if (error?.message?.includes(code)) throw new DomainError(code)
    if (error?.message?.includes('domains_hostname_key')) throw new DomainError('address_taken')
    if (error?.message?.includes('not_found')) throw new DomainError('not_found')
    throw new Error(`domain ${what} failed`)
  }
  return {
    async customDomains(siteId) {
      const { data, error } = await db.from('domains').select('hostname, status, is_primary, verification, last_checked_at, created_at')
        .eq('site_id', siteId).eq('kind', 'custom').is('deleted_at', null).order('created_at')
      if (error) fail('read', error)
      return (data ?? []).map((r) => ({
        hostname: r.hostname as string, status: r.status as DomainStatus, isPrimary: Boolean(r.is_primary),
        check: (r.verification as DomainCheck | null) ?? null, lastCheckedAt: r.last_checked_at ? new Date(r.last_checked_at as string) : null,
      }))
    },
    async addCustomDomain(siteId, userId, names, project) {
      const { error } = await db.rpc('add_custom_domain', { p_site: siteId, p_user: userId, p_names: names, p_project: project })
      if (error) fail('add', error)
    },
    async setDomainStatus(hostname, status, check, makePrimary) {
      const { error } = await db.rpc('set_domain_status', { p_hostname: hostname, p_status: status, p_verification: check, p_make_primary: makePrimary })
      if (error) fail('status', error)
    },
    async removeCustomDomain(siteId, userId) {
      const { data, error } = await db.rpc('remove_custom_domain', { p_site: siteId, p_user: userId })
      if (error) fail('remove', error)
      return ((data ?? []) as unknown[]).map((r) => (typeof r === 'string' ? r : String((r as Record<string, unknown>).remove_custom_domain ?? '')))
    },
    async sitesWithWaitingDomains(limit) {
      const { data, error } = await db.from('domains').select('site_id').eq('kind', 'custom').is('deleted_at', null).neq('status', 'active').limit(limit)
      if (error) fail('waiting', error)
      return [...new Set((data ?? []).map((r) => r.site_id as string))]
    },
  }
}

export function createMemoryDomainStore(base: MemBase, p3: MemPublishState): DomainStore {
  const live = (siteId: string) => p3.domains.filter((d) => d.siteId === siteId && !d.deleted)
  return {
    async customDomains(siteId) {
      return live(siteId).filter((d) => d.kind === 'custom').map((d) => ({
        hostname: d.hostname, status: d.status as DomainStatus, isPrimary: d.isPrimary,
        check: (d.verification as DomainCheck | undefined) ?? null, lastCheckedAt: d.lastCheckedAt ?? null,
      }))
    },
    async addCustomDomain(siteId, userId, names) {
      const s = base.sites.get(siteId)
      if (!s || s.deleted) throw new DomainError('not_found')
      if (s.takenDown) throw new DomainError('taken_down')
      if (live(siteId).some((d) => d.kind === 'custom')) throw new DomainError('has_custom_domain')
      for (const n of names) if (p3.domains.some((d) => d.hostname === n && !d.deleted)) throw new DomainError('address_taken')
      p3.domains = p3.domains.filter((d) => !(names.includes(d.hostname) && d.deleted))
      for (const n of names) p3.domains.push({ id: crypto.randomUUID(), siteId, tenantId: s.tenantId, hostname: n, status: 'pending', isPrimary: false, deleted: false, kind: 'custom', lastCheckedAt: null })
      p3.audit.push({ tenantId: s.tenantId, action: 'domain.add', targetId: siteId, details: { names, by: userId } })
    },
    async setDomainStatus(hostname, status, check, makePrimary) {
      const d = p3.domains.find((x) => x.hostname === hostname && !x.deleted)
      if (!d) throw new DomainError('not_found')
      d.status = status; d.verification = check; d.lastCheckedAt = new Date()
      if (makePrimary && status === 'active' && !d.isPrimary) {
        for (const o of live(d.siteId)) o.isPrimary = false
        d.isPrimary = true
      }
    },
    async removeCustomDomain(siteId, userId) {
      const gone = live(siteId).filter((d) => d.kind === 'custom')
      for (const d of gone) { d.deleted = true; d.isPrimary = false; d.status = 'removed' }
      if (!live(siteId).some((d) => d.isPrimary)) {
        const sub = live(siteId).filter((d) => d.kind !== 'custom').at(-1)
        if (sub) sub.isPrimary = true
      }
      p3.audit.push({ tenantId: base.sites.get(siteId)?.tenantId ?? null, action: 'domain.remove', targetId: siteId, details: { by: userId } })
      return gone.map((d) => d.hostname)
    },
    async sitesWithWaitingDomains(limit) {
      return [...new Set(p3.domains.filter((d) => d.kind === 'custom' && !d.deleted && d.status !== 'active').map((d) => d.siteId))].slice(0, limit)
    },
  }
}
