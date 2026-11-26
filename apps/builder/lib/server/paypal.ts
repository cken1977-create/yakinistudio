import 'server-only'
import { serverEnv } from './env'

/**
 * PayPal subscriptions (docs/spec/phase-4.md). The client id and secret are read only here and
 * never logged or returned. `PAYPAL_ENV=live` uses real money; anything else uses the sandbox.
 * The test stand-in (BUILDER_TEST_MODE) keeps subscriptions in memory and never calls PayPal.
 */

export type PayPalStatus = 'APPROVAL_PENDING' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED'
export type PayPalSubscription = {
  id: string
  status: PayPalStatus
  planId: string | null
  customId: string | null
  payerId: string | null
  /** The next charge date: what has been paid for runs until then. */
  nextBillingTime: Date | null
  /** When monthly billing starts (later than today for the Founding offer). */
  startTime: Date | null
}
export type NewPlan = { productKey: string; name: string; setup: number; monthly: number; currency: string; productId?: string }

export interface PayPalApi {
  createProduct(name: string): Promise<string>
  createPlan(p: NewPlan & { productId: string }): Promise<string>
  deactivatePlan(planId: string): Promise<void>
  /** `startTime` delays the first monthly charge (the setup fee is still taken at sign-up). */
  createSubscription(s: { planId: string; customId: string; returnUrl: string; cancelUrl: string; startTime?: Date }): Promise<{ id: string; approveUrl: string }>
  getSubscription(id: string): Promise<PayPalSubscription | null>
  cancelSubscription(id: string, reason: string): Promise<void>
  /** True only when PayPal confirms this exact event was signed for our webhook. */
  verifyWebhook(headers: Headers, event: unknown): Promise<boolean>
}

export class PayPalError extends Error {
  constructor(public readonly step: string, public readonly status?: number) { super(`paypal ${step} failed${status ? ` (${status})` : ''}`); this.name = 'PayPalError' }
}

export const PAYPAL_SETTINGS = ['PAYPAL_ENV', 'PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_WEBHOOK_ID'] as const

/** Names of missing settings (never values), and which PayPal the studio would use. */
export function paypalStatus(): { mode: 'live' | 'sandbox'; missing: string[] } {
  const missing = PAYPAL_SETTINGS.filter((n) => n !== 'PAYPAL_ENV' && !serverEnv(n))
  return { mode: serverEnv('PAYPAL_ENV') === 'live' ? 'live' : 'sandbox', missing }
}

/** PayPal's own status, mapped to ours (spec: Webhook, status map). */
export function mapStatus(s: PayPalStatus): 'pending' | 'active' | 'past_due' | 'canceled' {
  switch (s) {
    case 'ACTIVE': return 'active'
    case 'SUSPENDED': return 'past_due'
    case 'CANCELLED': case 'EXPIRED': return 'canceled'
    default: return 'pending'
  }
}

const money = (n: number, currency: string) => ({ value: n.toFixed(2), currency_code: currency })

// ------------------------------------------------------------------------------------------ real

export function realPayPal(): PayPalApi {
  const base = serverEnv('PAYPAL_ENV') === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'
  let token: { value: string; until: number } | null = null

  async function accessToken(): Promise<string> {
    if (token && token.until > Date.now() + 60_000) return token.value
    const id = serverEnv('PAYPAL_CLIENT_ID'), secret = serverEnv('PAYPAL_CLIENT_SECRET')
    if (!id || !secret) throw new PayPalError('not configured')
    const res = await fetch(`${base}/v1/oauth2/token`, {
      method: 'POST',
      headers: { authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`, 'content-type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials', signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new PayPalError('token', res.status)
    const body = (await res.json()) as { access_token: string; expires_in: number }
    token = { value: body.access_token, until: Date.now() + body.expires_in * 1000 }
    return token.value
  }

  async function call<T>(step: string, method: string, path: string, body?: unknown, okMissing = false): Promise<T | null> {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: { authorization: `Bearer ${await accessToken()}`, 'content-type': 'application/json', prefer: 'return=representation' },
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15_000),
    })
    if (okMissing && res.status === 404) return null
    if (!res.ok) throw new PayPalError(step, res.status)
    if (res.status === 204) return null
    return (await res.json().catch(() => null)) as T | null
  }

  return {
    async createProduct(name) {
      const r = await call<{ id: string }>('product', 'POST', '/v1/catalogs/products', { name: name.slice(0, 127), type: 'SERVICE', category: 'SOFTWARE' })
      return r!.id
    },
    async createPlan(p) {
      const r = await call<{ id: string }>('plan', 'POST', '/v1/billing/plans', {
        product_id: p.productId, name: p.name.slice(0, 127), status: 'ACTIVE',
        billing_cycles: [{ frequency: { interval_unit: 'MONTH', interval_count: 1 }, tenure_type: 'REGULAR', sequence: 1, total_cycles: 0, pricing_scheme: { fixed_price: money(p.monthly, p.currency) } }],
        payment_preferences: { auto_bill_outstanding: true, setup_fee: money(p.setup, p.currency), setup_fee_failure_action: 'CANCEL', payment_failure_threshold: 3 },
      })
      return r!.id
    },
    async deactivatePlan(planId) {
      await call('deactivate', 'POST', `/v1/billing/plans/${encodeURIComponent(planId)}/deactivate`)
    },
    async createSubscription(s) {
      const r = await call<{ id: string; links: { rel: string; href: string }[] }>('subscribe', 'POST', '/v1/billing/subscriptions', {
        plan_id: s.planId, custom_id: s.customId,
        ...(s.startTime ? { start_time: s.startTime.toISOString().replace(/\.\d{3}Z$/, 'Z') } : {}),
        application_context: { brand_name: 'Yakini', shipping_preference: 'NO_SHIPPING', user_action: 'SUBSCRIBE_NOW', return_url: s.returnUrl, cancel_url: s.cancelUrl },
      })
      const approve = r?.links.find((l) => l.rel === 'approve')?.href
      if (!r?.id || !approve || !/^https:\/\/www\.(sandbox\.)?paypal\.com\//.test(approve)) throw new PayPalError('subscribe link')
      return { id: r.id, approveUrl: approve }
    },
    async getSubscription(id) {
      if (!/^[A-Z0-9-]{3,64}$/i.test(id)) return null
      const r = await call<{ id: string; status: PayPalStatus; plan_id?: string; custom_id?: string; start_time?: string; subscriber?: { payer_id?: string }; billing_info?: { next_billing_time?: string } }>(
        'read', 'GET', `/v1/billing/subscriptions/${encodeURIComponent(id)}`, undefined, true)
      if (!r) return null
      return {
        id: r.id, status: r.status, planId: r.plan_id ?? null, customId: r.custom_id ?? null, payerId: r.subscriber?.payer_id ?? null,
        nextBillingTime: r.billing_info?.next_billing_time ? new Date(r.billing_info.next_billing_time) : null,
        startTime: r.start_time ? new Date(r.start_time) : null,
      }
    },
    async cancelSubscription(id, reason) {
      await call('cancel', 'POST', `/v1/billing/subscriptions/${encodeURIComponent(id)}/cancel`, { reason: reason.slice(0, 127) })
    },
    async verifyWebhook(headers, event) {
      const webhookId = serverEnv('PAYPAL_WEBHOOK_ID')
      const h = (n: string) => headers.get(n)
      const need = ['paypal-auth-algo', 'paypal-cert-url', 'paypal-transmission-id', 'paypal-transmission-sig', 'paypal-transmission-time']
      if (!webhookId || need.some((n) => !h(n))) return false
      try {
        const r = await call<{ verification_status: string }>('verify', 'POST', '/v1/notifications/verify-webhook-signature', {
          auth_algo: h('paypal-auth-algo'), cert_url: h('paypal-cert-url'), transmission_id: h('paypal-transmission-id'),
          transmission_sig: h('paypal-transmission-sig'), transmission_time: h('paypal-transmission-time'), webhook_id: webhookId, webhook_event: event,
        })
        return r?.verification_status === 'SUCCESS'
      } catch { return false }
    },
  }
}

// ------------------------------------------------------------------------------------------ test stand-in

type FakeState = { subs: Map<string, PayPalSubscription & { returnUrl: string; cancelUrl: string }>; plans: Map<string, NewPlan & { productId: string; active: boolean }>; n: number }
const g = globalThis as typeof globalThis & { __yakiniFakePayPal?: FakeState }
export const fakePayPalState = (): FakeState => (g.__yakiniFakePayPal ??= { subs: new Map(), plans: new Map(), n: 0 })
/** The test stand-in accepts a webhook only with this signature header. */
export const FAKE_WEBHOOK_SIG = 'test-signature-ok'

export function fakePayPal(): PayPalApi {
  const st = fakePayPalState()
  const id = (p: string) => `${p}-${(++st.n).toString().padStart(6, '0')}`
  return {
    async createProduct() { return id('PROD') },
    async createPlan(p) { const pid = id('P'); st.plans.set(pid, { ...p, active: true }); return pid },
    async deactivatePlan(planId) { const p = st.plans.get(planId); if (p) p.active = false },
    async createSubscription(s) {
      const sid = id('I')
      st.subs.set(sid, { id: sid, status: 'APPROVAL_PENDING', planId: s.planId, customId: s.customId, payerId: null, nextBillingTime: null, startTime: s.startTime ?? null, returnUrl: s.returnUrl, cancelUrl: s.cancelUrl })
      return { id: sid, approveUrl: `/dev/paypal?subscription_id=${sid}` }
    },
    async getSubscription(sid) {
      const s = st.subs.get(sid)
      return s ? { id: s.id, status: s.status, planId: s.planId, customId: s.customId, payerId: s.payerId, nextBillingTime: s.nextBillingTime, startTime: s.startTime } : null
    },
    async cancelSubscription(sid) { const s = st.subs.get(sid); if (s) s.status = 'CANCELLED' },
    async verifyWebhook(headers) { return headers.get('paypal-transmission-sig') === FAKE_WEBHOOK_SIG },
  }
}
