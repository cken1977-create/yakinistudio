import { FOUNDING_PROMO } from '@/lib/server/billing'
import { operatorOf, opsRedirect } from '@/lib/server/ops'
import { originAllowed, readCappedForm, requestOrigin } from '@/lib/server/request'
import { getRuntime } from '@/lib/server/runtime'

/** POST /api/ops/billing/promo: turn the Founding offer on or off, set its spots and end date. Operators only; audited. */
export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<Response> {
  if (!originAllowed(request.headers, [requestOrigin(request.url)])) return new Response('Forbidden', { status: 403 })
  const rt = getRuntime()
  const o = await operatorOf(rt)
  if (!o) return new Response('Not found', { status: 404 })
  const f = await readCappedForm(request, 2048)
  const max = Number(f?.get('max'))
  const until = String(f?.get('freeUntil') ?? '')
  if (!Number.isInteger(max) || max < 0 || max > 10000 || !/^\d{4}-\d{2}-\d{2}$/.test(until) || Number.isNaN(Date.parse(`${until}T00:00:00Z`))) {
    return opsRedirect('/ops/billing', 'bad_input')
  }
  await rt.store.setPromo(FOUNDING_PROMO, { active: f?.get('active') === 'on', maxClaims: max, freeUntil: until }, o.user.id)
  return opsRedirect('/ops/billing', 'offer_saved')
}
