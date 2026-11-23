import { isBuilderKit } from '@yakini/kits'
import type { KitId } from '@yakini/pricing'
import { errorPage, readHandoff, streamDraft, underRateLimit, withRuntime } from '@/lib/server/draft-flow'
import { originAllowed, requestOrigin, withWww } from '@/lib/server/request'

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
    if (Number(request.headers.get('content-length') ?? 0) > 16_384) return errorPage('bad')
    let form: FormData
    try { form = await request.formData() } catch { return errorPage('bad') }
    const parsed = readHandoff(form)
    if (!parsed.success) {
      return parsed.error.issues.some((i) => i.path[0] === 'kitId') ? errorPage('kit') : errorPage('bad')
    }
    const h = parsed.data
    if (!isBuilderKit(h.kitId)) return errorPage('kit')
    if (!(await underRateLimit(rt, request.headers))) return errorPage('rate')
    return streamDraft({
      source: 'demo',
      businessName: h.businessName,
      sourceUrl: h.sourceUrl || undefined,
      kitId: h.kitId as KitId,
      features: h.features,
    }, rt)
  })
}
