import 'server-only'
import * as Sentry from '@sentry/nextjs'
import { KITS, type KitId, type SiteKitId } from '@yakini/pricing'
import { allBuilderProducts, builderProducts, defaultProduct, planAmounts, productByKey } from '@yakini/pricing/products'
import { BillingError, type RecordResult, type SubRow, type SubStatus } from './billing-store'
import { serverEnv } from './env'
import { operatorEmails, sendAlert } from './mail'
import { fakePayPal, mapStatus, PayPalError, realPayPal, type PayPalApi } from './paypal'
import { loadDraft, type Manager } from './publish'
import type { Runtime } from './runtime'
import { studioOrigin } from './settings'
import { refreshSite } from './site-cache'

/**
 * Billing with PayPal (docs/spec/phase-4.md). Amounts only ever come from @yakini/pricing (R9).
 * Nothing here writes to a visitor or a prospect (R4/R5): only the owner and the operator get an
 * email when a plan changes.
 */

let real: PayPalApi | null = null
export function paypalFor(rt: Runtime): PayPalApi {
  if (rt.testMode) return fakePayPal()
  return (real ??= realPayPal())
}

export const graceDays = () => {
  const n = Number(serverEnv('PAST_DUE_GRACE_DAYS') ?? 7)
  return Number.isFinite(n) && n >= 0 && n <= 60 ? Math.floor(n) : 7
}

// ------------------------------------------------------------------------------------------ plans

export type PlanChoice = { key: string; name: string; setup: number; monthly: number; recommended: boolean; available: boolean }

/** What this site's owner can buy: the recommended plan first, then the kit's other sizes. */
export async function planChoices(rt: Runtime, kitId: SiteKitId): Promise<PlanChoice[]> {
  const sold = KITS.some((k) => k.id === kitId && k.ready)
  const rec = defaultProduct(kitId)
  const list = [rec, ...(sold ? builderProducts(kitId as KitId) : [])].filter((p, i, a) => a.findIndex((x) => x.key === p.key) === i)
  const active = new Set((await rt.store.activePlans()).map((p) => p.productKey))
  return list.flatMap((p) => {
    const a = planAmounts(p)
    return a ? [{ key: p.key, name: p.name, setup: a.setup, monthly: a.monthly, recommended: p.key === rec.key, available: active.has(p.key) }] : []
  })
}

/**
 * Operator: make sure PayPal has one active plan per product at today's prices. Plans whose
 * amounts already match are kept; changed ones get a new plan and the old one is deactivated.
 */
export async function setupPlans(rt: Runtime, userId: string): Promise<{ created: string[]; kept: string[] }> {
  const api = paypalFor(rt)
  const active = new Map((await rt.store.activePlans()).map((p) => [p.productKey, p]))
  const created: string[] = [], kept: string[] = []
  for (const product of allBuilderProducts()) {
    const a = planAmounts(product)
    if (!a) continue
    const cur = active.get(product.key)
    if (cur && cur.setup === a.setup && cur.monthly === a.monthly && cur.currency === 'USD') { kept.push(product.key); continue }
    const productId = cur?.providerProductId ?? await api.createProduct(`Yakini ${product.name}`)
    const planId = await api.createPlan({ productKey: product.key, productId, name: `${product.name}, monthly`, setup: a.setup, monthly: a.monthly, currency: 'USD' })
    await rt.store.saveBillingPlan({ productKey: product.key, providerProductId: productId, providerPlanId: planId, setup: a.setup, monthly: a.monthly, currency: 'USD' }, userId)
    if (cur) await api.deactivatePlan(cur.providerPlanId).catch(() => {}) // existing subscribers keep their plan either way
    created.push(product.key)
  }
  return { created, kept }
}

// ------------------------------------------------------------------------------------------ owner

export type CheckoutResult = { url: string } | { error: string; code: number }

/** The kit a site is built on (read from its draft), for choosing its plans. */
export async function siteKit(m: Manager): Promise<SiteKitId> {
  const d = await loadDraft(m.site)
  return 'doc' in d ? d.doc.kitId : 'service'
}

export async function startCheckout(rt: Runtime, m: Manager, productKey: string): Promise<CheckoutResult> {
  if (m.role !== 'owner') return { error: 'Only the owner can choose a plan.', code: 403 }
  const choice = (await planChoices(rt, await siteKit(m))).find((c) => c.key === productKey)
  if (!choice) return { error: 'That plan isn’t available for this site.', code: 422 }
  const subs = await rt.store.tenantSubscriptions(m.site.tenantId)
  if (subs.some((s) => s.status === 'active' || s.status === 'past_due')) return { error: 'You already have a plan.', code: 409 }
  if (!(await rt.store.hitRateLimit(`checkout:${m.site.tenantId}`, 10, 3600))) return { error: 'Please wait a few minutes and try again.', code: 429 }
  const plan = (await rt.store.activePlans()).find((p) => p.productKey === productKey)
  if (!plan) return { error: 'Plans aren’t set up yet. Please contact Yakini.', code: 503 }
  try {
    const back = `${studioOrigin()}/sites/${m.site.siteId}/plan`
    const sub = await paypalFor(rt).createSubscription({ planId: plan.providerPlanId, customId: m.site.tenantId, returnUrl: `${back}?paid=1`, cancelUrl: `${back}?canceled=1` })
    // Linked to this tenant now, so no later event can move it to another tenant.
    await rt.store.recordSubscription({ tenantId: m.site.tenantId, subscriptionId: sub.id, planId: plan.providerPlanId, productKey, status: 'pending', paidThrough: null, customerId: null, eventId: null, eventType: 'checkout.start' })
    return { url: sub.approveUrl }
  } catch (e) {
    Sentry.captureException(e, { tags: { area: 'billing-checkout' } })
    return { error: 'We couldn’t reach PayPal. Please try again in a minute.', code: 502 }
  }
}

/**
 * Read a subscription from PayPal and record it. The query string and the webhook body are never
 * trusted for status, plan or tenant: PayPal's own copy is.
 */
export async function syncSubscription(rt: Runtime, subscriptionId: string, event: { id: string; type: string } | null, expectTenant?: string): Promise<RecordResult | 'unknown'> {
  const sub = await paypalFor(rt).getSubscription(subscriptionId)
  if (!sub || !sub.customId || !/^[0-9a-f-]{36}$/i.test(sub.customId)) return 'unknown'
  if (expectTenant && sub.customId !== expectTenant) return 'conflict'
  const plan = sub.planId ? await rt.store.planByProviderId(sub.planId) : null
  const status = mapStatus(sub.status)
  const before = (await rt.store.tenantSubscriptions(sub.customId)).find((s) => s.providerSubscriptionId === sub.id)
  const result = await rt.store.recordSubscription({
    tenantId: sub.customId, subscriptionId: sub.id, planId: sub.planId, productKey: plan?.productKey ?? null, status,
    paidThrough: status === 'active' ? sub.nextBillingTime : null, customerId: sub.payerId, eventId: event?.id ?? null, eventType: event?.type ?? 'return',
  })
  if (result === 'recorded' && before?.status !== status && status !== 'pending') await notifyChange(rt, sub.customId, status, plan?.productKey ?? before?.productKey ?? '')
  return result
}

const STATUS_WORDS: Record<Exclude<SubStatus, 'pending'>, { subject: string; owner: string }> = {
  active: { subject: 'Your plan is active', owner: 'Thanks! Your plan is active. You can publish your site any time from the studio.' },
  past_due: { subject: 'Your payment didn’t go through', owner: 'PayPal couldn’t take your last payment. Your site stays live for now. Please update your payment in PayPal so it stays up.' },
  canceled: { subject: 'Your plan is canceled', owner: 'Your plan is canceled. Your site stays live until the end of the month you paid for. You can choose a plan again any time.' },
}

async function notifyChange(rt: Runtime, tenantId: string, status: Exclude<SubStatus, 'pending'> | 'pending', productKey: string): Promise<void> {
  if (status === 'pending') return
  const words = STATUS_WORDS[status]
  const name = productByKey(productKey)?.name ?? 'Plan'
  const owners = await rt.store.ownerEmails(tenantId).catch(() => [] as string[])
  if (owners.length) await sendAlert({ to: owners, tag: 'billing-alert', subject: words.subject, text: `${words.owner}\n\nPlan: ${name}\n\nOpen the studio: ${studioOrigin()}/sites\n` })
  await sendAlert({ to: operatorEmails(), tag: 'billing-alert', subject: `Billing: ${status} (${name})`.slice(0, 150), text: `A plan changed.\n\nTenant: ${tenantId}\nPlan: ${name}\nStatus: ${status}\n\n${studioOrigin()}/ops/billing\n` })
}

export async function cancelPlan(rt: Runtime, m: Manager): Promise<{ ok: true } | { error: string; code: number }> {
  if (m.role !== 'owner') return { error: 'Only the owner can cancel the plan.', code: 403 }
  const sub = (await rt.store.tenantSubscriptions(m.site.tenantId)).find((s) => s.status === 'active' || s.status === 'past_due')
  if (!sub) return { error: 'There’s no plan to cancel.', code: 409 }
  try {
    await paypalFor(rt).cancelSubscription(sub.providerSubscriptionId, 'Canceled by the owner in Yakini Studio')
    await syncSubscription(rt, sub.providerSubscriptionId, null, m.site.tenantId)
    return { ok: true }
  } catch (e) {
    Sentry.captureException(e, { tags: { area: 'billing-cancel' } })
    return { error: 'We couldn’t reach PayPal. Please try again in a minute.', code: 502 }
  }
}

export async function setIndexing(rt: Runtime, m: Manager, on: boolean): Promise<{ ok: true; changed: boolean } | { error: string; code: number }> {
  if (m.role !== 'owner' && m.role !== 'operator') return { error: 'Only the owner can change this.', code: 403 }
  try {
    const changed = await rt.store.setSiteIndexable(m.site.siteId, m.user.id, on)
    await refreshSite(rt, m.site.siteId)
    return { ok: true, changed }
  } catch (e) {
    if (e instanceof BillingError && e.code === 'no_plan') return { error: 'Choose a plan first. Search engines can find paid sites only.', code: 402 }
    throw e
  }
}

/** The owner's current plan, for the plan page and banners. */
export function currentSub(subs: SubRow[]): SubRow | null {
  return subs.find((s) => s.status === 'active') ?? subs.find((s) => s.status === 'past_due') ?? subs.find((s) => s.status === 'canceled' && s.paidThrough && s.paidThrough.getTime() > Date.now()) ?? null
}

// ------------------------------------------------------------------------------------------ webhook

const SUB_ID = /^[A-Z0-9-]{3,64}$/i

/** POST from PayPal. 400 unless PayPal verifies the event; 500 makes PayPal retry. */
export async function handleWebhook(rt: Runtime, headers: Headers, raw: string): Promise<number> {
  let event: { id?: unknown; event_type?: unknown; resource?: Record<string, unknown> }
  try { event = JSON.parse(raw) } catch { return 400 }
  if (!event || typeof event !== 'object' || typeof event.id !== 'string' || typeof event.event_type !== 'string') return 400
  if (!(await paypalFor(rt).verifyWebhook(headers, event))) return 400
  const type = event.event_type
  const r = event.resource ?? {}
  const subId = type.startsWith('BILLING.SUBSCRIPTION.') ? r.id : type.startsWith('PAYMENT.SALE.') ? r.billing_agreement_id : null
  if (typeof subId !== 'string' || !SUB_ID.test(subId)) return 200 // not a subscription event: nothing to do
  try {
    await syncSubscription(rt, subId, { id: event.id.slice(0, 100), type: type.slice(0, 100) })
    return 200
  } catch (e) {
    Sentry.captureException(e, { tags: { area: 'billing-webhook', paypal: e instanceof PayPalError ? e.step : 'store' } })
    return 500
  }
}

// ------------------------------------------------------------------------------------------ lapse

/** Nightly: take lapsed sites offline (nothing is deleted) and tell the owner and the operator once. */
export async function lapseSites(rt: Runtime): Promise<number> {
  const lapsed = await rt.store.lapseDueSites(graceDays())
  const tenants = new Set<string>()
  for (const l of lapsed) {
    await refreshSite(rt, l.siteId)
    tenants.add(l.tenantId)
  }
  for (const t of tenants) {
    const owners = await rt.store.ownerEmails(t).catch(() => [] as string[])
    if (owners.length) await sendAlert({ to: owners, tag: 'billing-alert', subject: 'Your site is offline for now', text: `Your plan has ended, so your site is offline for now. Nothing was deleted. Choose a plan and publish again to bring it back.\n\n${studioOrigin()}/sites\n` })
    await sendAlert({ to: operatorEmails(), tag: 'billing-alert', subject: 'Billing: a site went offline (plan ended)', text: `Tenant: ${t}\n\n${studioOrigin()}/ops/billing\n` })
  }
  return lapsed.length
}
