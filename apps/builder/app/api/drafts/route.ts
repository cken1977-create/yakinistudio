import { z } from 'zod'
import { HexColor } from '@yakini/site-schema'
import { asKit, errorPage, plainPage, streamDraft, underRateLimit, withRuntime } from '@/lib/server/draft-flow'
import { checkFormTime, originAllowed, readCappedForm, requestOrigin } from '@/lib/server/request'

/**
 * POST /api/drafts: "Describe your business" from /new (spec 5.3, 18). Same pipeline as /start,
 * starting at step 4e. Studio origin only.
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const LOGO_MAX = 2 * 1024 * 1024
const LOGO_TYPES = new Set(['image/png', 'image/jpeg', 'image/svg+xml'])

const clean = (max: number) => z.string().max(max).transform((s) => s.replace(/\s+/g, ' ').trim())
const PromptForm = z.object({
  businessName: clean(120).pipe(z.string().min(1)),
  description: clean(500).pipe(z.string().min(1)),
  kitId: z.string().optional(),
  city: clean(80).optional(),
  useColors: z.literal('on').optional(),
  primary: HexColor.optional(),
  secondary: HexColor.optional(),
  accent: HexColor.optional(),
})

const field = (f: FormData, k: string) => {
  const v = f.get(k)
  return typeof v === 'string' && v !== '' ? v : undefined
}

export async function POST(request: Request): Promise<Response> {
  return withRuntime(async (rt) => {
    if (!originAllowed(request.headers, [requestOrigin(request.url)])) return errorPage('origin')
    if (!(request.headers.get('content-type') ?? '').startsWith('multipart/form-data')) return errorPage('bad')
    const form = await readCappedForm(request, LOGO_MAX + 64 * 1024)
    if (!form) {
      return plainPage('Logo too large', '<h1>That logo file is too large.</h1><p>Please use a PNG, JPG or SVG under 2 MB.</p><p><a class="btn" href="/new">Try again</a></p>', 413)
    }

    // Honeypot and minimum time (spec 14.4). Bots get the same plain answer as a typo would.
    if (field(form, 'website')) return errorPage('bad')
    const time = checkFormTime(field(form, 't') ?? null, rt.ipPepper, Date.now())
    if (time !== 'ok') {
      return plainPage('Please try again', '<h1>Please try that again.</h1><p>The form timed out or was sent too quickly. Fill it in and send it once more.</p><p><a class="btn" href="/new">Back to the form</a></p>', 400)
    }

    const parsed = PromptForm.safeParse({
      businessName: field(form, 'businessName') ?? '', description: field(form, 'description') ?? '',
      kitId: field(form, 'kitId'), city: field(form, 'city'), useColors: field(form, 'useColors'),
      primary: field(form, 'primary'), secondary: field(form, 'secondary'), accent: field(form, 'accent'),
    })
    if (!parsed.success) return plainPage('Missing details', '<h1>We need a little more.</h1><p>Add your business name and one sentence about what you do.</p><p><a class="btn" href="/new">Back to the form</a></p>', 400)
    const p = parsed.data
    const colors = p.useColors && p.primary && p.secondary && p.accent ? { primary: p.primary, secondary: p.secondary, accent: p.accent } : null

    let logo: Buffer | null = null
    const file = form.get('logo')
    if (file && typeof file !== 'string' && file.size > 0) {
      if (file.size > LOGO_MAX || !LOGO_TYPES.has(file.type)) {
        return plainPage('Logo not used', '<h1>We couldn’t use that logo.</h1><p>Please use a PNG, JPG or SVG under 2 MB, or leave it out for now.</p><p><a class="btn" href="/new">Back to the form</a></p>', 400)
      }
      logo = Buffer.from(await file.arrayBuffer())
    }

    if (!(await underRateLimit(rt, request.headers))) return errorPage('rate')
    return streamDraft({
      source: 'prompt', businessName: p.businessName, description: p.description, kitId: asKit(p.kitId),
      city: p.city || undefined, colors, logoUpload: logo,
    }, rt)
  })
}
