import { hostnameFor, slugError } from '@/lib/publish/slug'
import { json, NOT_FOUND, withEditor } from '@/lib/server/editor'
import { siteMember } from '@/lib/server/publish'
import { phase3Settings } from '@/lib/server/settings'

/** GET /api/slugs/check?slug=&site= (spec 18, 13.3): is this subdomain free for this site? Members only. */
export const dynamic = 'force-dynamic'

export async function GET(request: Request): Promise<Response> {
  const q = new URL(request.url).searchParams
  const slug = (q.get('slug') ?? '').trim().toLowerCase().slice(0, 60)
  const siteId = q.get('site') ?? ''
  return withEditor(async (rt) => {
    const m = await siteMember(rt, siteId)
    if (!m) return NOT_FOUND()
    if (!(await rt.store.hitRateLimit(`slug:${m.user.id}`, 120, 3600))) return json({ error: 'Too many checks. Please wait a minute.' }, 429)
    const s = phase3Settings()
    const hostname = hostnameFor(slug, s.rootDomain)
    const problem = slugError(slug, s.reservedExtra, /^[a-z0-9-]{3,40}$/.test(slug) && await rt.store.slugTaken(slug, hostname, siteId))
    return json({ ok: !problem, message: problem, hostname: problem ? null : hostname })
  })
}
