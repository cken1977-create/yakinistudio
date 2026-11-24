import { z } from 'zod'
import { TOUR_IDS, TOUR_SKIPPED } from '@/lib/editor/tutorial'
import { editorAccess, json, NOT_FOUND, readJson, withEditor } from '@/lib/server/editor'
import { originAllowed, requestOrigin } from '@/lib/server/request'

/**
 * POST /api/sites/[siteId]/tutorial {step}: remember a finished (or skipped) tour step for this
 * person on this site (spec 10.9, tutorial_progress), so the tour picks up where they left it.
 * Before claiming there is no account to remember it on, so the browser keeps it instead.
 */
export const dynamic = 'force-dynamic'

const STEPS: readonly string[] = [...TOUR_IDS, TOUR_SKIPPED]
const Body = z.object({ step: z.string().refine((s) => STEPS.includes(s)) }).strict()

export async function POST(request: Request, { params }: { params: Promise<{ siteId: string }> }): Promise<Response> {
  const { siteId } = await params
  return withEditor(async (rt) => {
    if (!originAllowed(request.headers, [requestOrigin(request.url)])) return json({ error: 'Forbidden' }, 403)
    const a = await editorAccess(rt, siteId)
    if (!a) return NOT_FOUND()
    const parsed = Body.safeParse(await readJson(request, 512))
    if (!parsed.success) return json({ error: 'Unknown step' }, 400)
    if (a.kind !== 'member') return json({ saved: false })
    await rt.store.markTutorial(a.user.id, siteId, parsed.data.step)
    return json({ saved: true })
  })
}
