import { handleWebhook } from '@/lib/server/billing'
import { getRuntime } from '@/lib/server/runtime'

/**
 * POST /api/billing/paypal/webhook (Phase 4): PayPal's notifications. Each one is verified with
 * PayPal before anything is read from it; the subscription is then read back from PayPal. No
 * cookies, no session: the signature is the only authority.
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const MAX_BODY = 64 * 1024

export async function POST(request: Request): Promise<Response> {
  const raw = await request.text().catch(() => '')
  if (!raw || raw.length > MAX_BODY) return new Response(null, { status: 400 })
  let rt
  try { rt = getRuntime() } catch { return new Response(null, { status: 503 }) }
  const status = await handleWebhook(rt, request.headers, raw)
  return new Response(null, { status, headers: { 'cache-control': 'no-store' } })
}
