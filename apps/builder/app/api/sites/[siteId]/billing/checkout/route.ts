import { startCheckout } from '@/lib/server/billing'
import { withEditor } from '@/lib/server/editor'
import { backTo } from '@/lib/server/form-redirect'
import { siteMember } from '@/lib/server/publish'
import { originAllowed, readCappedForm, requestOrigin } from '@/lib/server/request'

/**
 * POST /api/sites/[siteId]/billing/checkout (Phase 4, Flow J step 2): a plain form post from the
 * plan page. Creates the PayPal subscription and sends the owner to PayPal to approve it.
 */
export const dynamic = 'force-dynamic'

const CODES: Record<number, string> = { 403: 'owner_only', 409: 'has_plan', 422: 'bad_plan', 429: 'slow_down', 502: 'paypal_down', 503: 'not_ready' }

export async function POST(request: Request, { params }: { params: Promise<{ siteId: string }> }): Promise<Response> {
  const { siteId } = await params
  return withEditor(async (rt) => {
    if (!originAllowed(request.headers, [requestOrigin(request.url)])) return new Response('Forbidden', { status: 403 })
    const m = await siteMember(rt, siteId)
    if (!m) return new Response('Not found', { status: 404 })
    const form = await readCappedForm(request, 2048)
    const product = form?.get('product')
    if (typeof product !== 'string' || product.length > 60) return backTo(`/sites/${siteId}/plan`, 'bad_plan')
    const r = await startCheckout(rt, m, product, requestOrigin(request.url))
    if ('error' in r) return backTo(`/sites/${siteId}/plan`, CODES[r.code] ?? 'failed')
    return new Response(null, { status: 303, headers: { location: r.url, 'cache-control': 'no-store' } })
  })
}
