import { readCappedForm, originAllowed, requestOrigin } from '@/lib/server/request'
import { getRuntime } from '@/lib/server/runtime'
import { operatorOf, opsRedirect } from '@/lib/server/ops'

/** POST /api/ops/reports/[id] (spec 5.11 step 4): Dismiss or Mark actioned. Audited. */
export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params
  if (!originAllowed(request.headers, [requestOrigin(request.url)])) return new Response('Forbidden', { status: 403 })
  const rt = getRuntime()
  const o = await operatorOf(rt)
  if (!o) return new Response('Not found', { status: 404 })
  const data = await readCappedForm(request, 4096)
  const status = data?.get('status')
  if (!/^[0-9a-f-]{36}$/.test(id) || (status !== 'dismissed' && status !== 'actioned')) return opsRedirect('/ops/reports', 'bad_input')
  const note = typeof data?.get('note') === 'string' ? (data!.get('note') as string).slice(0, 1000) : null
  const ok = await rt.store.decideReport({ reportId: id, operatorId: o.user.id, status, note: note || null })
  return opsRedirect('/ops/reports', ok ? status : 'no_change')
}
