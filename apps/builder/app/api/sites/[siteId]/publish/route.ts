import { z } from 'zod'
import { json, NOT_FOUND, readJson, withEditor } from '@/lib/server/editor'
import { publishSite, siteMember } from '@/lib/server/publish'
import { originAllowed, requestOrigin } from '@/lib/server/request'

/**
 * POST /api/sites/[siteId]/publish (spec 5.6, 11.2, 18): owners and operators. Returns
 * live (with the address), in_review (14.8 #6), blocked (failing checklist items) or an error.
 */
export const dynamic = 'force-dynamic'

const Body = z.object({ slug: z.string().min(1).max(60), overrideReason: z.string().max(500).optional() }).strict()

export async function POST(request: Request, { params }: { params: Promise<{ siteId: string }> }): Promise<Response> {
  const { siteId } = await params
  return withEditor(async (rt) => {
    if (!originAllowed(request.headers, [requestOrigin(request.url)])) return json({ error: 'Forbidden' }, 403)
    const m = await siteMember(rt, siteId)
    if (!m) return NOT_FOUND()
    const parsed = Body.safeParse(await readJson(request, 2048))
    if (!parsed.success) return json({ error: 'Please pick an address for your site.' }, 400)
    if (!(await rt.store.hitRateLimit(`publish:${siteId}`, 30, 3600))) return json({ error: 'Too many publishes in a row. Please wait a few minutes.' }, 429)
    const out = await publishSite(rt, m, { slug: parsed.data.slug, overrideReason: parsed.data.overrideReason ?? null })
    if (out.status === 'refused') return json({ error: out.message }, out.code)
    if (out.status === 'blocked') return json({ status: 'blocked', items: out.checks, error: 'A few things need fixing before your site can go live.' }, 422)
    return json(out)
  })
}
