import { readCappedForm, originAllowed, requestOrigin } from '@/lib/server/request'
import { getRuntime } from '@/lib/server/runtime'
import { operatorOf, opsRedirect } from '@/lib/server/ops'
import { refreshSite } from '@/lib/server/site-cache'

/** POST /api/ops/sites/[siteId]/takedown/lift (spec 14.8 #7): restore after a takedown or auto-hold. Audited. */
export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: Promise<{ siteId: string }> }): Promise<Response> {
  const { siteId } = await params
  if (!originAllowed(request.headers, [requestOrigin(request.url)])) return new Response('Forbidden', { status: 403 })
  const rt = getRuntime()
  const o = await operatorOf(rt)
  if (!o) return new Response('Not found', { status: 404 })
  if (!o.op.canTakedown) return opsRedirect('/ops/reports', 'not_allowed')
  if (!/^[0-9a-f-]{36}$/.test(siteId)) return opsRedirect('/ops/reports', 'bad_input')
  const data = await readCappedForm(request, 4096)
  const note = typeof data?.get('note') === 'string' ? (data!.get('note') as string).slice(0, 500) : null
  const ok = await rt.store.liftTakedown({ siteId, userId: o.user.id, note: note || null })
  await refreshSite(rt, siteId)
  return opsRedirect('/ops/reports', ok ? 'restored' : 'no_change')
}
