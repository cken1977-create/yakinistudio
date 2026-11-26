import { connectDomain, recheckDomains, removeDomain } from '@/lib/server/domains'
import { withEditor } from '@/lib/server/editor'
import { backTo } from '@/lib/server/form-redirect'
import { siteMember } from '@/lib/server/publish'
import { originAllowed, readCappedForm, requestOrigin } from '@/lib/server/request'

/** POST /api/sites/[siteId]/domain: connect, check or remove the site's own domain (Phase 5a). */
export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: Promise<{ siteId: string }> }): Promise<Response> {
  const { siteId } = await params
  const page = `/sites/${siteId}/domain`
  return withEditor(async (rt) => {
    if (!originAllowed(request.headers, [requestOrigin(request.url)])) return new Response('Forbidden', { status: 403 })
    const m = await siteMember(rt, siteId)
    if (!m) return new Response('Not found', { status: 404 })
    const form = await readCappedForm(request, 2048)
    const action = form?.get('action')
    if (action === 'connect') {
      const name = form?.get('domain')
      return backTo(page, await connectDomain(rt, m, typeof name === 'string' ? name : ''))
    }
    if (action === 'check') return backTo(page, await recheckDomains(rt, m))
    if (action === 'remove') {
      if (form?.get('confirm') !== 'yes') return backTo(page, 'confirm_remove')
      return backTo(page, await removeDomain(rt, m))
    }
    return backTo(page, 'bad_input')
  })
}
