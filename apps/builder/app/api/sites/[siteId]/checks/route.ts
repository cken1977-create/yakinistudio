import { blockingFailures } from '@/lib/publish/checks'
import { json, NOT_FOUND, withEditor } from '@/lib/server/editor'
import { loadDraft, runChecklist, siteMember } from '@/lib/server/publish'
import { originAllowed, requestOrigin } from '@/lib/server/request'

/** POST /api/sites/[siteId]/checks (spec 11.1, 18): run the pre-publish checklist on the current draft. */
export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: Promise<{ siteId: string }> }): Promise<Response> {
  const { siteId } = await params
  return withEditor(async (rt) => {
    if (!originAllowed(request.headers, [requestOrigin(request.url)])) return json({ error: 'Forbidden' }, 403)
    const m = await siteMember(rt, siteId)
    if (!m) return NOT_FOUND()
    const loaded = await loadDraft(m.site)
    if ('error' in loaded) return json({ error: loaded.error }, 422)
    const items = await runChecklist(rt, m, loaded.doc)
    return json({ items, ready: blockingFailures(items).length === 0 })
  })
}
