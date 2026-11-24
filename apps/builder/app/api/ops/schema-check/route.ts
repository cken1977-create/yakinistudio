import { loadSiteDoc, SiteDocError } from '@yakini/site-schema'
import { operatorOf, opsRedirect } from '@/lib/server/ops'
import { originAllowed, requestOrigin } from '@/lib/server/request'
import { getRuntime } from '@/lib/server/runtime'

/**
 * POST /api/ops/schema-check (spec 7.4 "Check stored sites"): a read-only dry run of loadSiteDoc
 * over every stored version (published, checkpoint, review). Nothing is written except the audit
 * row with the counts. Returns JSON, or redirects back to /ops for the form button.
 */
export const dynamic = 'force-dynamic'
const PAGE = 200
const MAX = 50_000

export async function POST(request: Request): Promise<Response> {
  if (!originAllowed(request.headers, [requestOrigin(request.url)])) return new Response('Forbidden', { status: 403 })
  const rt = getRuntime()
  const o = await operatorOf(rt)
  if (!o) return new Response('Not found', { status: 404 })
  let after: string | null = null, checked = 0
  const failures: { versionId: string; siteId: string; number: number; kind: string; code: string }[] = []
  while (checked < MAX) {
    const page = await rt.store.versionsPage(after, PAGE)
    if (!page.length) break
    for (const v of page) {
      checked++
      try { loadSiteDoc(v.doc) } catch (e) {
        failures.push({ versionId: v.id, siteId: v.siteId, number: v.number, kind: v.kind, code: e instanceof SiteDocError ? e.code : 'error' })
      }
    }
    after = page[page.length - 1].id
  }
  await rt.store.auditOps({ tenantId: null, userId: o.user.id, action: 'schema.check', targetId: 'all', details: { checked, failed: failures.length, sample: failures.slice(0, 20) } })
  if ((request.headers.get('accept') ?? '').includes('application/json')) return Response.json({ checked, failed: failures.length, failures: failures.slice(0, 500) })
  return opsRedirect('/ops', 'checked', `&checked=${checked}&failed=${failures.length}`)
}
