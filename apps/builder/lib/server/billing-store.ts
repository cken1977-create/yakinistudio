import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { MemBase, MemPublishState } from './publish-store'

/**
 * Phase 4 storage: PayPal plans, subscriptions, the search engines switch and lapsed plans
 * (docs/spec/phase-4.md). The Supabase version calls the server-only functions of migration
 * 20261126000100; the memory version mirrors them for unit tests and the browser run.
 */

export type SubStatus = 'pending' | 'active' | 'past_due' | 'canceled'
export type PlanRow = { productKey: string; providerProductId: string; providerPlanId: string; setup: number; monthly: number; currency: string; active: boolean }
export type SubRow = {
  tenantId: string; providerSubscriptionId: string; productKey: string; status: SubStatus
  paidThrough: Date | null; pastDueSince: Date | null; cancelAtPeriodEnd: boolean; updatedAt: Date
  /** The offer this subscription was started with (e.g. the Founding 20), if any. */
  promoId: string | null
}
export type PromoRow = { id: string; label: string; active: boolean; maxClaims: number; freeUntil: string; used: number }
export type PromoClaimRow = { tenantId: string; tenantName: string; subscriptionId: string | null; claimedAt: Date; releasedAt: Date | null }
export type SubOpsRow = SubRow & { tenantName: string; tenantStatus: string }
export type RecordInput = {
  tenantId: string; subscriptionId: string; planId: string | null; productKey: string | null; status: SubStatus
  paidThrough: Date | null; customerId: string | null; eventId: string | null; eventType: string | null
}
export type RecordResult = 'recorded' | 'duplicate' | 'conflict'

export class BillingError extends Error {
  constructor(public readonly code: 'no_plan' | 'not_found') { super(code); this.name = 'BillingError' }
}

export interface BillingStore {
  activePlans(): Promise<PlanRow[]>
  /** Any plan PayPal might name, including replaced ones (an old subscriber keeps their plan). */
  planByProviderId(planId: string): Promise<PlanRow | null>
  saveBillingPlan(p: Omit<PlanRow, 'active'>, userId: string): Promise<void>
  recordSubscription(r: RecordInput): Promise<RecordResult>
  tenantSubscriptions(tenantId: string): Promise<SubRow[]>
  listSubscriptions(): Promise<SubOpsRow[]>
  siteIndexable(siteId: string): Promise<boolean>
  setSiteIndexable(siteId: string, userId: string, on: boolean): Promise<boolean>
  lapseDueSites(graceDays: number): Promise<{ tenantId: string; siteId: string }[]>
  promo(id: string): Promise<PromoRow | null>
  promoClaims(id: string): Promise<PromoClaimRow[]>
  /** True when this business holds a spot (new or already its own). */
  claimPromo(id: string, tenantId: string): Promise<boolean>
  attachPromo(id: string, tenantId: string, subscriptionId: string): Promise<boolean>
  releaseStalePromoClaims(): Promise<number>
  setPromo(id: string, p: { active: boolean; maxClaims: number; freeUntil: string }, userId: string): Promise<void>
}

const d = (v: unknown) => (v ? new Date(v as string) : null)

export function createSupabaseBillingStore(db: SupabaseClient<any, any, any>): BillingStore { // eslint-disable-line @typescript-eslint/no-explicit-any
  const fail = (what: string, error: { message?: string } | null): never => {
    if (error?.message?.includes('no_plan')) throw new BillingError('no_plan')
    if (error?.message?.includes('site_not_found')) throw new BillingError('not_found')
    throw new Error(`billing ${what} failed`)
  }
  const plan = (r: Record<string, unknown>): PlanRow => ({
    productKey: r.product_key as string, providerProductId: r.provider_product_id as string, providerPlanId: r.provider_plan_id as string,
    setup: Number(r.setup_amount), monthly: Number(r.monthly_amount), currency: r.currency as string, active: Boolean(r.active),
  })
  const sub = (r: Record<string, unknown>): SubRow => ({
    tenantId: r.tenant_id as string, providerSubscriptionId: r.provider_subscription_id as string, productKey: r.product_key as string,
    status: r.status as SubStatus, paidThrough: d(r.paid_through), pastDueSince: d(r.past_due_since),
    cancelAtPeriodEnd: Boolean(r.cancel_at_period_end), updatedAt: new Date(r.updated_at as string), promoId: (r.promo_id as string) ?? null,
  })
  const SUB_COLS = 'tenant_id, provider_subscription_id, product_key, status, paid_through, past_due_since, cancel_at_period_end, updated_at, promo_id'
  return {
    async activePlans() {
      const { data, error } = await db.from('billing_plans').select('*').eq('active', true).order('product_key')
      if (error) fail('plans', error)
      return (data ?? []).map(plan)
    },
    async planByProviderId(planId) {
      const { data, error } = await db.from('billing_plans').select('*').eq('provider_plan_id', planId).maybeSingle()
      if (error) fail('plan', error)
      return data ? plan(data) : null
    },
    async saveBillingPlan(p, userId) {
      const { error } = await db.rpc('save_billing_plan', {
        p_product_key: p.productKey, p_product_id: p.providerProductId, p_plan_id: p.providerPlanId,
        p_setup: p.setup, p_monthly: p.monthly, p_currency: p.currency, p_user: userId,
      })
      if (error) fail('save plan', error)
    },
    async recordSubscription(r) {
      const { data, error } = await db.rpc('record_subscription', {
        p_tenant: r.tenantId, p_sub_id: r.subscriptionId, p_plan_id: r.planId, p_product_key: r.productKey, p_status: r.status,
        p_paid_through: r.paidThrough?.toISOString() ?? null, p_customer_id: r.customerId, p_event_id: r.eventId, p_event_type: r.eventType,
      })
      if (error) fail('record', error)
      return data as RecordResult
    },
    async tenantSubscriptions(tenantId) {
      const { data, error } = await db.from('subscriptions').select(SUB_COLS).eq('tenant_id', tenantId).order('updated_at', { ascending: false })
      if (error) fail('subscriptions', error)
      return (data ?? []).map(sub)
    },
    async listSubscriptions() {
      const { data, error } = await db.from('subscriptions').select(`${SUB_COLS}, tenants!inner(name, status)`).order('updated_at', { ascending: false }).limit(500)
      if (error) fail('all subscriptions', error)
      return (data ?? []).map((r) => {
        const t = (r as unknown as { tenants: { name: string; status: string } }).tenants
        return { ...sub(r), tenantName: t.name, tenantStatus: t.status }
      })
    },
    async siteIndexable(siteId) {
      const { data, error } = await db.from('sites').select('indexable').eq('id', siteId).maybeSingle()
      if (error) fail('indexable', error)
      return Boolean(data?.indexable)
    },
    async setSiteIndexable(siteId, userId, on) {
      const { data, error } = await db.rpc('set_site_indexable', { p_site: siteId, p_user: userId, p_on: on })
      if (error) fail('indexing', error)
      return data === true
    },
    async lapseDueSites(graceDays) {
      const { data, error } = await db.rpc('lapse_due_sites', { p_grace_days: graceDays })
      if (error) fail('lapse', error)
      return ((data ?? []) as { tenant_id: string; site_id: string }[]).map((r) => ({ tenantId: r.tenant_id, siteId: r.site_id }))
    },
    async promo(id) {
      const { data, error } = await db.from('billing_promos').select('id, label, active, max_claims, free_until').eq('id', id).maybeSingle()
      if (error) fail('promo', error)
      if (!data) return null
      const used = await db.from('promo_claims').select('tenant_id', { count: 'exact', head: true }).eq('promo_id', id).is('released_at', null)
      if (used.error) fail('promo count', used.error)
      return { id: data.id, label: data.label, active: Boolean(data.active), maxClaims: Number(data.max_claims), freeUntil: String(data.free_until), used: used.count ?? 0 }
    },
    async promoClaims(id) {
      const { data, error } = await db.from('promo_claims').select('tenant_id, subscription_id, claimed_at, released_at, tenants!inner(name)').eq('promo_id', id).order('claimed_at')
      if (error) fail('promo claims', error)
      return (data ?? []).map((r) => ({
        tenantId: r.tenant_id as string, tenantName: (r as unknown as { tenants: { name: string } }).tenants.name, subscriptionId: (r.subscription_id as string) ?? null,
        claimedAt: new Date(r.claimed_at as string), releasedAt: d(r.released_at),
      }))
    },
    async claimPromo(id, tenantId) {
      const { data, error } = await db.rpc('claim_promo', { p_promo: id, p_tenant: tenantId })
      if (error) fail('claim', error)
      return data === true
    },
    async attachPromo(id, tenantId, subscriptionId) {
      const { data, error } = await db.rpc('attach_promo', { p_promo: id, p_tenant: tenantId, p_sub_id: subscriptionId })
      if (error) fail('attach', error)
      return data === true
    },
    async releaseStalePromoClaims() {
      const { data, error } = await db.rpc('release_stale_promo_claims')
      if (error) fail('release', error)
      return Number(data ?? 0)
    },
    async setPromo(id, p, userId) {
      const { error } = await db.rpc('set_promo', { p_promo: id, p_active: p.active, p_max: p.maxClaims, p_free_until: p.freeUntil, p_user: userId })
      if (error) fail('set promo', error)
    },
  }
}

export type MemBillingState = {
  plans: (PlanRow & { id: string })[]
  subs: SubRow[]
  events: Map<string, { type: string; error: string | null }>
  promos: Map<string, Omit<PromoRow, 'used'>>
  claims: { promoId: string; tenantId: string; subscriptionId: string | null; claimedAt: Date; releasedAt: Date | null }[]
}

export function createMemoryBillingStore(base: MemBase, p3: MemPublishState): BillingStore & { _p4: MemBillingState } {
  const st: MemBillingState = {
    plans: [], subs: [], events: new Map(), claims: [],
    promos: new Map([['founders', { id: 'founders', label: 'Founding 20', active: true, maxClaims: 20, freeUntil: '2027-01-31' }]]),
  }
  const today = () => new Date().toISOString().slice(0, 10)
  const held = (id: string) => st.claims.filter((c) => c.promoId === id && !c.releasedAt)
  const meta = (siteId: string) => p3.site.get(siteId)
  const hasPlan = (tenantId: string) => p3.tenantPlan.get(tenantId) ?? (['active', 'past_due'].includes(base.tenants.get(tenantId)?.status ?? '')
    || st.subs.some((s) => s.tenantId === tenantId && (s.status === 'active' || s.status === 'past_due')))
  const later = (a: Date | null, b: Date | null) => (!a ? b : !b ? a : a > b ? a : b)
  return {
    _p4: st,
    async activePlans() { return st.plans.filter((p) => p.active).map((p) => ({ ...p })) },
    async planByProviderId(planId) { const p = st.plans.find((x) => x.providerPlanId === planId); return p ? { ...p } : null },
    async saveBillingPlan(p, userId) {
      for (const x of st.plans) if (x.productKey === p.productKey && x.active) x.active = false
      st.plans.push({ ...p, id: crypto.randomUUID(), active: true })
      p3.audit.push({ tenantId: null, action: 'billing.plans', targetId: p.productKey, details: { plan: p.providerPlanId, by: userId } })
    },
    async recordSubscription(r) {
      if (r.eventId) {
        if (st.events.has(r.eventId)) return 'duplicate'
        st.events.set(r.eventId, { type: r.eventType ?? 'unknown', error: null })
      }
      const t = base.tenants.get(r.tenantId)
      if (!t) { if (r.eventId) st.events.get(r.eventId)!.error = 'unknown tenant'; return 'conflict' }
      const old = st.subs.find((s) => s.providerSubscriptionId === r.subscriptionId)
      if (old && old.tenantId !== r.tenantId) { if (r.eventId) st.events.get(r.eventId)!.error = 'tenant mismatch'; return 'conflict' }
      if (old) {
        old.status = r.status
        old.productKey = r.productKey ?? old.productKey
        old.paidThrough = later(old.paidThrough, r.paidThrough)
        old.cancelAtPeriodEnd = r.status === 'canceled'
        old.pastDueSince = r.status === 'past_due' ? old.pastDueSince ?? new Date() : null
        old.updatedAt = new Date()
      } else {
        if (!r.productKey) throw new Error('product_key required for a new subscription')
        st.subs.push({
          tenantId: r.tenantId, providerSubscriptionId: r.subscriptionId, productKey: r.productKey, status: r.status, paidThrough: r.paidThrough,
          pastDueSince: r.status === 'past_due' ? new Date() : null, cancelAtPeriodEnd: r.status === 'canceled', updatedAt: new Date(), promoId: null,
        })
      }
      const mine = st.subs.filter((s) => s.tenantId === r.tenantId)
      t.status = mine.some((s) => s.status === 'active') ? 'active' : mine.some((s) => s.status === 'past_due') ? 'past_due' : t.status
      p3.tenantPlan.delete(r.tenantId) // billing now decides (test fixtures may have set a plan by hand)
      p3.audit.push({ tenantId: r.tenantId, action: 'billing.change', targetId: r.subscriptionId, details: { status: r.status } })
      return 'recorded'
    },
    async tenantSubscriptions(tenantId) {
      return st.subs.filter((s) => s.tenantId === tenantId).sort((a, b) => +b.updatedAt - +a.updatedAt).map((s) => ({ ...s }))
    },
    async listSubscriptions() {
      return st.subs.map((s) => ({ ...s, tenantName: base.tenants.get(s.tenantId)?.name ?? '', tenantStatus: base.tenants.get(s.tenantId)?.status ?? '' }))
    },
    async siteIndexable(siteId) { return Boolean(meta(siteId)?.indexable) },
    async setSiteIndexable(siteId, userId, on) {
      const s = base.sites.get(siteId)
      if (!s || s.deleted) throw new BillingError('not_found')
      if (on && !hasPlan(s.tenantId)) throw new BillingError('no_plan')
      let m = meta(siteId)
      if (!m) { m = { publishedVersionId: null, reviewStatus: 'not_required', takedown: null, indexable: false, reportLinkHidden: false, sourceUrl: null }; p3.site.set(siteId, m) }
      if (m.indexable === on) return false
      m.indexable = on
      p3.audit.push({ tenantId: s.tenantId, action: 'indexing.change', targetId: siteId, details: { on, by: userId } })
      return true
    },
    async lapseDueSites(graceDays) {
      const out: { tenantId: string; siteId: string }[] = []
      const now = Date.now()
      for (const t of base.tenants.values()) {
        if (t.status !== 'active' && t.status !== 'past_due') continue
        const mine = st.subs.filter((s) => s.tenantId === t.id)
        if (!mine.length || mine.some((s) => s.status === 'active')) continue
        const pastDue = mine.filter((s) => s.status === 'past_due')
        const due = pastDue.length
          ? pastDue.some((s) => s.pastDueSince && s.pastDueSince.getTime() < now - Math.max(graceDays, 0) * 86_400_000)
          : Math.max(...mine.map((s) => s.paidThrough?.getTime() ?? -Infinity)) < now
        if (!due) continue
        t.status = 'canceled'
        p3.tenantPlan.delete(t.id)
        for (const s of base.sites.values()) {
          if (s.tenantId !== t.id || s.deleted) continue
          const m = meta(s.siteId)
          if (!m) continue
          m.indexable = false
          if (!m.publishedVersionId) continue
          m.publishedVersionId = null
          p3.audit.push({ tenantId: t.id, action: 'billing.lapse', targetId: s.siteId, details: {} })
          out.push({ tenantId: t.id, siteId: s.siteId })
        }
      }
      return out
    },
    async promo(id) {
      const p = st.promos.get(id)
      return p ? { ...p, used: held(id).length } : null
    },
    async promoClaims(id) {
      return st.claims.filter((c) => c.promoId === id).map((c) => ({ tenantId: c.tenantId, tenantName: base.tenants.get(c.tenantId)?.name ?? '', subscriptionId: c.subscriptionId, claimedAt: c.claimedAt, releasedAt: c.releasedAt }))
    },
    async claimPromo(id, tenantId) {
      const p = st.promos.get(id)
      if (!p || !p.active || today() > p.freeUntil) return false
      if (held(id).some((c) => c.tenantId === tenantId)) return true
      if (held(id).length >= p.maxClaims) return false
      const old = st.claims.find((c) => c.promoId === id && c.tenantId === tenantId)
      if (old) Object.assign(old, { releasedAt: null, claimedAt: new Date(), subscriptionId: null })
      else st.claims.push({ promoId: id, tenantId, subscriptionId: null, claimedAt: new Date(), releasedAt: null })
      p3.audit.push({ tenantId, action: 'billing.promo_claim', targetId: id, details: {} })
      return true
    },
    async attachPromo(id, tenantId, subscriptionId) {
      const sub = st.subs.find((x) => x.tenantId === tenantId && x.providerSubscriptionId === subscriptionId)
      if (!sub) return false
      sub.promoId = id
      const c = held(id).find((x) => x.tenantId === tenantId)
      if (c) c.subscriptionId = subscriptionId
      return Boolean(c)
    },
    async releaseStalePromoClaims() {
      let n = 0
      for (const c of st.claims) {
        if (c.releasedAt || c.claimedAt.getTime() > Date.now() - 86_400_000) continue
        if (st.subs.some((x) => x.tenantId === c.tenantId && x.promoId === c.promoId && x.status !== 'pending')) continue
        c.releasedAt = new Date(); n++
      }
      return n
    },
    async setPromo(id, p, userId) {
      const cur = st.promos.get(id)
      if (!cur) throw new Error('promo_not_found')
      st.promos.set(id, { ...cur, ...p })
      p3.audit.push({ tenantId: null, action: 'billing.promo', targetId: id, details: { ...p, by: userId } })
    },
  }
}
