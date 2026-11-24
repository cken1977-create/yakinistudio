import { readCappedForm, originAllowed, requestOrigin } from '@/lib/server/request'
import { getRuntime } from '@/lib/server/runtime'
import { operatorOf, opsRedirect } from '@/lib/server/ops'
import { refreshSite } from '@/lib/server/site-cache'

/**
 * POST /api/ops/sites/[siteId]/takedown (spec 14.8 #7): operators with can_takedown, reason required.
 * Every address shows the neutral page at once, share links are revoked, forms answer 410, publishing
 * is refused. Nothing is deleted. Audited.
 */
export const dynamic = 'force-dynamic'
const REASONS = new Set(['impersonation', 'phishing', 'copyright', 'illegal', 'other'])

export async function POST(request: Request, { params }: { params: Promise<{ siteId: string }> }): Promise<Response> {
  const { siteId } = await params
  if (!originAllowed(request.headers, [requestOrigin(request.url)])) return new Response('Forbidden', { status: 403 })
  const rt = getRuntime()
  const o = await operatorOf(rt)
  if (!o) return new Response('Not found', { status: 404 })
  if (!o.op.canTakedown) return opsRedirect('/ops/reports', 'not_allowed')
  const data = await readCappedForm(request, 4096)
  const reason = data?.get('reason')
  if (!/^[0-9a-f-]{36}$/.test(siteId) || typeof reason !== 'string' || !REASONS.has(reason)) return opsRedirect('/ops/reports', 'bad_input')
  const note = typeof data?.get('note') === 'string' ? (data!.get('note') as string).slice(0, 500) : null
  const ok = await rt.store.takedown({ siteId, kind: 'operator', reason: reason as 'other', note: note || null, userId: o.user.id })
  await refreshSite(rt, siteId)
  return opsRedirect('/ops/reports', ok ? 'taken_down' : 'no_change')
}
