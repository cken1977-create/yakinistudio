import { json, withEditor } from '@/lib/server/editor'
import { operatorOf } from '@/lib/server/ops'

/** GET /api/ops/reviews (spec 18): reviews waiting for an operator. */
export const dynamic = 'force-dynamic'

export async function GET(): Promise<Response> {
  return withEditor(async (rt) => {
    if (!(await operatorOf(rt))) return json({ error: 'Not found' }, 404)
    return json({ reviews: await rt.store.listReviews('pending') })
  })
}
