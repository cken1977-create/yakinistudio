import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { allBuilderProducts, planAmounts } from '@yakini/pricing/products'
import { STUDIO, form, jar, readySite, signInOperator, where } from './browser'

vi.mock('next/headers', async () => (await import('./browser')).headersMock)
vi.mock('next/cache', () => ({ revalidateTag: () => {}, unstable_cache: (fn: () => unknown) => fn }))

beforeAll(() => { vi.stubEnv('OPERATOR_EMAIL', 'ops@yakini.example'); vi.stubEnv('BUILDER_TEST_MODE', '1'); vi.stubEnv('VERCEL', ''); vi.stubEnv('VERCEL_ENV', '') })
afterAll(() => vi.unstubAllEnvs())
beforeEach(() => jar.clear())

const rt = async () => (await import('@/lib/server/runtime')).getRuntime()
const ctx = <T extends Record<string, string>>(p: T) => ({ params: Promise.resolve(p) })
const fake = async () => (await import('@/lib/server/paypal')).fakePayPalState()
let n = 0

async function plansReady() {
  const r = await rt()
  if ((await r.store.activePlans()).length === 0) await (await import('@/lib/server/billing')).setupPlans(r, 'test-operator')
}

/** An unpaid owner's ready site, then Continue to PayPal for its recommended plan. */
async function checkout(product = 'kit:food-truck:small') {
  await plansReady()
  const s = await readySite({ plan: false })
  const { POST } = await import('@/app/api/sites/[siteId]/billing/checkout/route')
  const res = await POST(form(`/api/sites/${s.siteId}/billing/checkout`, { product }), ctx({ siteId: s.siteId }))
  expect(res.status).toBe(303)
  const subId = new URL(res.headers.get('location')!, STUDIO).searchParams.get('subscription_id')!
  return { ...s, subId }
}

/** What PayPal's approval does, then the owner coming back to the plan page. */
async function approve(s: { tenantId: string; subId: string }) {
  const sub = (await fake()).subs.get(s.subId)!
  sub.status = 'ACTIVE'; sub.payerId = 'PAYER'; sub.nextBillingTime = new Date(Date.now() + 30 * 86_400_000)
  const { syncSubscription } = await import('@/lib/server/billing')
  return syncSubscription(await rt(), s.subId, null, s.tenantId)
}

async function webhook(body: unknown, signature?: string) {
  const sig = signature ?? (await import('@/lib/server/paypal')).FAKE_WEBHOOK_SIG
  const { POST } = await import('@/app/api/billing/paypal/webhook/route')
  return POST(new Request(`${STUDIO}/api/billing/paypal/webhook`, { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json', 'paypal-transmission-sig': sig } }))
}
const event = (type: string, subId: string, id = `WH-${++n}`) => ({ id, event_type: type, resource: { id: subId } })
const tenantStatus = async (tenantId: string) => ((await rt()).store as unknown as { _state: { tenants: Map<string, { status: string }> } })._state.tenants.get(tenantId)!.status

describe('plans come from the pricing config (R9)', () => {
  it('the operator sets up one PayPal plan per product at exactly the config amounts; pressing again keeps them', async () => {
    await signInOperator()
    const { POST } = await import('@/app/api/ops/billing/plans/route')
    const res = await POST(form('/api/ops/billing/plans', {}))
    expect(where(res)).toBe('/ops/billing?result=plans_ready')
    const plans = await (await rt()).store.activePlans()
    expect(plans.length).toBe(allBuilderProducts().length)
    for (const p of allBuilderProducts()) {
      const plan = plans.find((x) => x.productKey === p.key)!
      expect({ setup: plan.setup, monthly: plan.monthly }).toEqual(planAmounts(p))
      const sent = (await fake()).plans.get(plan.providerPlanId)!
      expect({ setup: sent.setup, monthly: sent.monthly, currency: sent.currency }).toEqual({ ...planAmounts(p), currency: 'USD' })
    }
    const before = (await fake()).plans.size
    await POST(form('/api/ops/billing/plans', {}))
    expect((await fake()).plans.size).toBe(before)
  })
  it('only operators can set up plans', async () => {
    await readySite()
    const { POST } = await import('@/app/api/ops/billing/plans/route')
    expect((await POST(form('/api/ops/billing/plans', {}))).status).toBe(404)
  })
  it('a general-kit site is offered the Template website first; a kit site its own kit first', async () => {
    const { planChoices } = await import('@/lib/server/billing')
    await plansReady()
    expect((await planChoices(await rt(), 'service')).map((c) => [c.key, c.recommended])).toEqual([['website-simple', true]])
    const landlord = await planChoices(await rt(), 'landlord')
    expect(landlord[0]).toMatchObject({ key: 'kit:landlord:small', recommended: true, available: true })
    expect(landlord.map((c) => c.key)).toContain('website-simple')
  })
})

describe('choosing a plan (Flow J)', () => {
  it('checkout sends the owner to PayPal and records nothing as paid yet', async () => {
    const s = await checkout()
    const sub = (await fake()).subs.get(s.subId)!
    expect(sub.customId).toBe(s.tenantId)
    expect(sub.returnUrl).toBe(`${STUDIO}/sites/${s.siteId}/plan?paid=1`)
    const r = await rt()
    expect((await r.store.tenantSubscriptions(s.tenantId))[0]).toMatchObject({ status: 'pending', productKey: 'kit:food-truck:small' })
    expect((await r.store.publishInfo(s.siteId))!.hasPlan).toBe(false)
  })
  it('after approval the plan is active and the owner publishes without an operator', async () => {
    const s = await checkout()
    expect(await approve(s)).toBe('recorded')
    const r = await rt()
    expect((await r.store.publishInfo(s.siteId))!.hasPlan).toBe(true)
    expect(await tenantStatus(s.tenantId)).toBe('active')
    const { POST } = await import('@/app/api/sites/[siteId]/publish/route')
    const res = await POST(new Request(`${STUDIO}/api/sites/${s.siteId}/publish`, { method: 'POST', body: JSON.stringify({ slug: `paid-${Date.now().toString(36)}` }), headers: { origin: STUDIO, 'content-type': 'application/json' } }), ctx({ siteId: s.siteId }))
    expect(await res.json()).toMatchObject({ status: 'live' })
    const { testOutbox } = await import('@/lib/server/mail')
    expect(testOutbox().some((m) => m.tag === 'billing-alert' && m.subject === 'Your plan is active')).toBe(true)
  })
  it('refuses a second plan, a plan the kit does not offer, other origins and non-owners', async () => {
    const s = await checkout()
    await approve(s)
    const { POST } = await import('@/app/api/sites/[siteId]/billing/checkout/route')
    expect(where(await POST(form(`/api/sites/${s.siteId}/billing/checkout`, { product: 'kit:food-truck:small' }), ctx({ siteId: s.siteId })))).toContain('result=has_plan')
    const t = await readySite({ plan: false })
    expect(where(await POST(form(`/api/sites/${t.siteId}/billing/checkout`, { product: 'kit:oilfield:larger' }), ctx({ siteId: t.siteId })))).toContain('result=bad_plan')
    expect((await POST(form(`/api/sites/${t.siteId}/billing/checkout`, { product: 'website-simple' }, { origin: 'https://evil.example' }), ctx({ siteId: t.siteId }))).status).toBe(403)
    jar.clear()
    expect((await POST(form(`/api/sites/${t.siteId}/billing/checkout`, { product: 'website-simple' }), ctx({ siteId: t.siteId }))).status).toBe(404)
  })
  it('the return page never trusts the address bar: a subscription for another tenant is refused', async () => {
    const a = await checkout()
    const b = await checkout()
    ;(await fake()).subs.get(a.subId)!.status = 'ACTIVE'
    const { syncSubscription } = await import('@/lib/server/billing')
    expect(await syncSubscription(await rt(), a.subId, null, b.tenantId)).toBe('conflict')
    expect((await (await rt()).store.publishInfo(b.siteId))!.hasPlan).toBe(false)
  })
})

describe('the PayPal webhook', () => {
  it('refuses anything PayPal did not sign, and bad bodies', async () => {
    const s = await checkout()
    ;(await fake()).subs.get(s.subId)!.status = 'ACTIVE'
    expect((await webhook(event('BILLING.SUBSCRIPTION.ACTIVATED', s.subId), 'forged')).status).toBe(400)
    expect(await tenantStatus(s.tenantId)).not.toBe('active')
    const { POST } = await import('@/app/api/billing/paypal/webhook/route')
    expect((await POST(new Request(`${STUDIO}/api/billing/paypal/webhook`, { method: 'POST', body: 'not json' }))).status).toBe(400)
    expect((await POST(new Request(`${STUDIO}/api/billing/paypal/webhook`, { method: 'POST', body: 'x'.repeat(70_000) }))).status).toBe(400)
  })
  it('reads the status from PayPal, not from the event, and ignores repeats', async () => {
    const s = await checkout()
    await approve(s)
    ;(await fake()).subs.get(s.subId)!.status = 'SUSPENDED'
    const e = event('BILLING.SUBSCRIPTION.ACTIVATED', s.subId) // the event type says activated; PayPal says suspended
    expect((await webhook(e)).status).toBe(200)
    expect(await tenantStatus(s.tenantId)).toBe('past_due')
    ;(await fake()).subs.get(s.subId)!.status = 'ACTIVE'
    expect((await webhook(e)).status).toBe(200) // same event id again
    expect(await tenantStatus(s.tenantId)).toBe('past_due')
    expect((await webhook(event('PAYMENT.SALE.COMPLETED', 'ignored'))).status).toBe(200)
  })
  it('a payment event finds its subscription through billing_agreement_id', async () => {
    const s = await checkout()
    await approve(s)
    ;(await fake()).subs.get(s.subId)!.status = 'SUSPENDED'
    expect((await webhook({ id: `WH-sale-${++n}`, event_type: 'PAYMENT.SALE.DENIED', resource: { id: 'SALE-1', billing_agreement_id: s.subId } })).status).toBe(200)
    expect(await tenantStatus(s.tenantId)).toBe('past_due')
  })
})

describe('cancel, lapse and search engines', () => {
  it('a canceled plan stays in force for the paid month, then the site goes offline (nothing deleted)', async () => {
    const s = await checkout()
    await approve(s)
    const r = await rt()
    const pub = await import('@/app/api/sites/[siteId]/publish/route')
    const slug = `lapse-${Date.now().toString(36)}`
    await pub.POST(new Request(`${STUDIO}/api/sites/${s.siteId}/publish`, { method: 'POST', body: JSON.stringify({ slug }), headers: { origin: STUDIO, 'content-type': 'application/json' } }), ctx({ siteId: s.siteId }))
    expect((await r.store.siteForHost(`${slug}.yakini.digital`))!.state).toBe('live')

    const { POST } = await import('@/app/api/sites/[siteId]/billing/cancel/route')
    expect(where(await POST(form(`/api/sites/${s.siteId}/billing/cancel`, {}), ctx({ siteId: s.siteId })))).toContain('result=confirm_cancel')
    expect(where(await POST(form(`/api/sites/${s.siteId}/billing/cancel`, { confirm: 'yes' }), ctx({ siteId: s.siteId })))).toContain('result=canceled')
    expect((await fake()).subs.get(s.subId)!.status).toBe('CANCELLED')
    expect((await r.store.publishInfo(s.siteId))!.hasPlan).toBe(true)

    const { lapseSites } = await import('@/lib/server/billing')
    await lapseSites(r)
    expect((await r.store.siteForHost(`${slug}.yakini.digital`))!.state).toBe('live')
    const mem = r.store as unknown as { _p4: { subs: { providerSubscriptionId: string; paidThrough: Date | null }[] } }
    mem._p4.subs.find((x) => x.providerSubscriptionId === s.subId)!.paidThrough = new Date(Date.now() - 60_000)
    expect(await lapseSites(r)).toBe(1)
    expect((await r.store.siteForHost(`${slug}.yakini.digital`))!.state).toBe('unpublished')
    expect(await tenantStatus(s.tenantId)).toBe('canceled')
    expect((await r.store.publishedVersions(s.siteId)).length).toBeGreaterThan(0)
    const { testOutbox } = await import('@/lib/server/mail')
    expect(testOutbox().some((m) => m.subject === 'Your site is offline for now')).toBe(true)
  })
  it('a payment that stays failed past the grace period also lapses', async () => {
    const s = await checkout()
    await approve(s)
    ;(await fake()).subs.get(s.subId)!.status = 'SUSPENDED'
    await webhook(event('BILLING.SUBSCRIPTION.SUSPENDED', s.subId))
    const r = await rt()
    const { lapseSites } = await import('@/lib/server/billing')
    await lapseSites(r)
    expect(await tenantStatus(s.tenantId)).toBe('past_due')
    const mem = r.store as unknown as { _p4: { subs: { providerSubscriptionId: string; pastDueSince: Date | null }[] } }
    mem._p4.subs.find((x) => x.providerSubscriptionId === s.subId)!.pastDueSince = new Date(Date.now() - 8 * 86_400_000)
    await lapseSites(r)
    expect(await tenantStatus(s.tenantId)).toBe('canceled')
  })
  it('search engines: paid owners only, and the live site follows the switch', async () => {
    const unpaid = await readySite({ plan: false })
    const { POST } = await import('@/app/api/sites/[siteId]/indexing/route')
    expect(where(await POST(form(`/api/sites/${unpaid.siteId}/indexing`, { on: '1' }), ctx({ siteId: unpaid.siteId })))).toContain('result=needs_plan')
    const s = await checkout()
    await approve(s)
    expect(where(await POST(form(`/api/sites/${s.siteId}/indexing`, { on: '1' }), ctx({ siteId: s.siteId })))).toContain('result=indexing_on')
    expect(await (await rt()).store.siteIndexable(s.siteId)).toBe(true)
    expect(where(await POST(form(`/api/sites/${s.siteId}/indexing`, { on: '0' }), ctx({ siteId: s.siteId })))).toContain('result=indexing_off')
    expect(await (await rt()).store.siteIndexable(s.siteId)).toBe(false)
  })
})

describe('subscriptions the studio did not start', () => {
  it('are acknowledged and left alone (PayPal does not retry forever)', async () => {
    const s = await readySite({ plan: false })
    const st = await fake()
    st.subs.set('I-999999', { id: 'I-999999', status: 'ACTIVE', planId: 'P-NOT-OURS', customId: s.tenantId, payerId: null, nextBillingTime: null, returnUrl: '', cancelUrl: '' })
    expect((await webhook(event('BILLING.SUBSCRIPTION.ACTIVATED', 'I-999999'))).status).toBe(200)
    expect((await (await rt()).store.publishInfo(s.siteId))!.hasPlan).toBe(false)
  })
})
