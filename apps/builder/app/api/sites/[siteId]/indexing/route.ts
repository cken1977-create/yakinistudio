import { setIndexing } from '@/lib/server/billing'
import { withEditor } from '@/lib/server/editor'
import { backTo } from '@/lib/server/form-redirect'
import { siteMember } from '@/lib/server/publish'
import { originAllowed, readCappedForm, requestOrigin } from '@/lib/server/request'

/** POST /api/sites/[siteId]/indexing: "Let search engines find this site" (paid sites only). */
export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: Promise<{ siteId: string }> }): Promise<Response> {
  const { siteId } = await params
  return withEditor(async (rt) => {
    if (!originAllowed(request.headers, [requestOrigin(request.url)])) return new Response('Forbidden', { status: 403 })
    const m = await siteMember(rt, siteId)
    if (!m) return new Response('Not found', { status: 404 })
    const form = await readCappedForm(request, 1024)
    const on = form?.get('on')
    if (on !== '1' && on !== '0') return backTo(`/sites/${siteId}/publish`, 'bad_input')
    const r = await setIndexing(rt, m, on === '1')
    if ('error' in r) return backTo(`/sites/${siteId}/publish`, r.code === 402 ? 'needs_plan' : 'owner_only')
    return backTo(`/sites/${siteId}/publish`, on === '1' ? 'indexing_on' : 'indexing_off')
  })
}
