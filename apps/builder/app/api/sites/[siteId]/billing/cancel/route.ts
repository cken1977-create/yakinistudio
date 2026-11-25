import { cancelPlan } from '@/lib/server/billing'
import { withEditor } from '@/lib/server/editor'
import { backTo } from '@/lib/server/form-redirect'
import { siteMember } from '@/lib/server/publish'
import { originAllowed, readCappedForm, requestOrigin } from '@/lib/server/request'

/** POST /api/sites/[siteId]/billing/cancel (Phase 4, Flow J step 6): owner only, confirmed on the form. */
export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: Promise<{ siteId: string }> }): Promise<Response> {
  const { siteId } = await params
  return withEditor(async (rt) => {
    if (!originAllowed(request.headers, [requestOrigin(request.url)])) return new Response('Forbidden', { status: 403 })
    const m = await siteMember(rt, siteId)
    if (!m) return new Response('Not found', { status: 404 })
    const form = await readCappedForm(request, 1024)
    if (form?.get('confirm') !== 'yes') return backTo(`/sites/${siteId}/plan`, 'confirm_cancel')
    const r = await cancelPlan(rt, m)
    if ('error' in r) return backTo(`/sites/${siteId}/plan`, r.code === 403 ? 'owner_only' : r.code === 409 ? 'no_plan' : 'paypal_down')
    return backTo(`/sites/${siteId}/plan`, 'canceled')
  })
}
