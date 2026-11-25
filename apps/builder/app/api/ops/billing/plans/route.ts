import * as Sentry from '@sentry/nextjs'
import { setupPlans } from '@/lib/server/billing'
import { operatorOf, opsRedirect } from '@/lib/server/ops'
import { paypalStatus } from '@/lib/server/paypal'
import { originAllowed, requestOrigin } from '@/lib/server/request'
import { getRuntime } from '@/lib/server/runtime'

/** POST /api/ops/billing/plans: create or refresh the PayPal plans from today's prices. Operators only. */
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(request: Request): Promise<Response> {
  if (!originAllowed(request.headers, [requestOrigin(request.url)])) return new Response('Forbidden', { status: 403 })
  const rt = getRuntime()
  const o = await operatorOf(rt)
  if (!o) return new Response('Not found', { status: 404 })
  if (!rt.testMode && paypalStatus().missing.length) return opsRedirect('/ops/billing', 'paypal_missing')
  try {
    await setupPlans(rt, o.user.id)
    return opsRedirect('/ops/billing', 'plans_ready')
  } catch (e) {
    Sentry.captureException(e, { tags: { area: 'billing-plans' } })
    return opsRedirect('/ops/billing', 'paypal_failed')
  }
}
