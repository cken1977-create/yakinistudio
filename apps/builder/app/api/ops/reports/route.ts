import { json, withEditor } from '@/lib/server/editor'
import { operatorOf } from '@/lib/server/ops'

/** GET /api/ops/reports (spec 18): open reports for operators. */
export const dynamic = 'force-dynamic'

export async function GET(request: Request): Promise<Response> {
  const all = new URL(request.url).searchParams.get('status') === 'all'
  return withEditor(async (rt) => {
    if (!(await operatorOf(rt))) return json({ error: 'Not found' }, 404)
    return json({ reports: await rt.store.listReports(all ? 'all' : 'open') })
  })
}
