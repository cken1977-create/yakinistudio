import { z } from 'zod'
import { fakePayPalState, FAKE_WEBHOOK_SIG } from '@/lib/server/paypal'
import { isTestMode } from '@/lib/server/runtime'

/**
 * Test mode only (BUILDER_TEST_MODE=1, refused on Vercel): the stand-in for PayPal's approval page
 * and for PayPal changing a subscription. Anywhere else: 404.
 * - form post `decision=approve|cancel` from /dev/paypal: goes back to the studio like PayPal does;
 * - JSON `{ action: 'set', subscriptionId, status }`: changes the stand-in, then (like PayPal)
 *   sends a signed webhook event to the studio.
 */
export const dynamic = 'force-dynamic'

const Set_ = z.object({ action: z.literal('set'), subscriptionId: z.string().regex(/^I-\d{6}$/), status: z.enum(['ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED']), eventId: z.string().max(60).optional() })

export async function POST(request: Request): Promise<Response> {
  if (!isTestMode()) return new Response('Not found', { status: 404 })
  const st = fakePayPalState()
  if ((request.headers.get('content-type') ?? '').includes('application/json')) {
    const b = Set_.safeParse(await request.json().catch(() => null))
    if (!b.success) return new Response('Bad request', { status: 400 })
    const sub = st.subs.get(b.data.subscriptionId)
    if (!sub) return new Response('Unknown subscription', { status: 404 })
    sub.status = b.data.status
    if (b.data.status === 'ACTIVE') sub.nextBillingTime = new Date(Date.now() + 30 * 86_400_000)
    const type = { ACTIVE: 'BILLING.SUBSCRIPTION.ACTIVATED', SUSPENDED: 'BILLING.SUBSCRIPTION.SUSPENDED', CANCELLED: 'BILLING.SUBSCRIPTION.CANCELLED', EXPIRED: 'BILLING.SUBSCRIPTION.EXPIRED' }[b.data.status]
    const res = await fetch(new URL('/api/billing/paypal/webhook', request.url), {
      method: 'POST', headers: { 'content-type': 'application/json', 'paypal-transmission-sig': FAKE_WEBHOOK_SIG },
      body: JSON.stringify({ id: b.data.eventId ?? `WH-${crypto.randomUUID()}`, event_type: type, resource: { id: sub.id } }),
    })
    return Response.json({ webhook: res.status })
  }
  const form = await request.formData().catch(() => null)
  const id = form?.get('subscription_id')
  const sub = typeof id === 'string' ? st.subs.get(id) : undefined
  if (!sub) return new Response('Unknown subscription', { status: 404 })
  if (form?.get('decision') === 'approve-slow') {
    // Like real PayPal right after approval of a normal plan: approved, first payment still being taken.
    sub.status = 'APPROVED'
    sub.startTime = null
    return new Response(null, { status: 303, headers: { location: `${sub.returnUrl}&subscription_id=${sub.id}` } })
  }
  if (form?.get('decision') === 'approve') {
    sub.status = 'ACTIVE'
    sub.payerId = 'TESTPAYER01'
    sub.nextBillingTime = sub.startTime && sub.startTime.getTime() > Date.now() ? sub.startTime : new Date(Date.now() + 30 * 86_400_000)
    return new Response(null, { status: 303, headers: { location: `${sub.returnUrl}&subscription_id=${sub.id}` } })
  }
  return new Response(null, { status: 303, headers: { location: sub.cancelUrl } })
}
