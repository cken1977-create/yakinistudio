import { isBuilderKit } from '@yakini/kits'
import { KITS, type SiteKitId as KitId } from '@yakini/pricing'
import { errorPage, readHandoff, streamDraft, underRateLimit, withRuntime } from '@/lib/server/draft-flow'
import { originAllowed, readCappedForm, requestOrigin, withWww } from '@/lib/server/request'

/**
 * POST /start: the /demo "Start my setup" hand-off (spec 5.2). A normal top-level form POST from
 * yakini.digital, so no cross-site cookies are involved. It only ever creates an anonymous draft
 * (no privileged action), which is why it may accept the /demo origin (14.6).
 * GET /start shows the same form as /new.
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export function GET(request: Request): Response {
  return Response.redirect(new URL('/new', request.url), 303)
}

export async function POST(request: Request): Promise<Response> {
  return withRuntime(async (rt) => {
    if (!originAllowed(request.headers, [...withWww(rt.demoOrigin), requestOrigin(request.url)])) return errorPage('origin')
    const type = request.headers.get('content-type') ?? ''
    if (!type.startsWith('application/x-www-form-urlencoded') && !type.startsWith('multipart/form-data')) return errorPage('bad')
    const form = await readCappedForm(request, 16_384)
    if (!form) return errorPage('bad')
    const parsed = readHandoff(form)
    if (!parsed.success) {
      return parsed.error.issues.some((i) => i.path[0] === 'kitId') ? errorPage('kit') : errorPage('bad')
    }
    const h = parsed.data
    // A kit the studio doesn't build yet starts on the general layout, named for that kit (Clarence, 2026-11-25).
    const sold = KITS.find((k) => k.id === h.kitId)
    const built = isBuilderKit(h.kitId)
    if (!(await underRateLimit(rt, request.headers))) return errorPage('rate')
    return streamDraft({
      source: 'demo',
      businessName: h.businessName,
      sourceUrl: h.sourceUrl || undefined,
      kitId: (built ? h.kitId : 'service') as KitId,
      ...(built || !sold ? {} : { industry: { label: sold.name } }),
      features: h.features,
    }, rt)
  })
}
