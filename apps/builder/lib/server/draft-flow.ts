import 'server-only'
import { randomUUID } from 'node:crypto'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'
import { isBuilderKit, kitDefinition } from '@yakini/kits'
import { KITS, type KitId } from '@yakini/pricing'
import { createDraft, type DraftRequest, type ProgressStep } from '@/lib/pipeline/draft'
import { draftCookieHeader, newDraftToken } from './draft-token'
import { clientIp, hashIp } from './request'
import { ConfigError, getRuntime, type Runtime } from './runtime'

/**
 * Shared by POST /start (from /demo) and POST /api/drafts (from /new): rate limits, the streamed
 * progress page, and a redirect to the new draft. Messages never mention AI or vendors (10.8), and
 * every error is plain words + what to do + a reference code, never a stack trace.
 */

export const STEP_COPY: Record<ProgressStep, string> = {
  reading: 'Reading your website…',
  photos: 'Picking your best photos…',
  writing: 'Writing your pages…',
  finishing: 'Almost ready…',
}

/** spec 14.4: /start and /new share 5 per hour and 30 per day per IP. */
export async function underRateLimit(rt: Runtime, headers: Headers): Promise<boolean> {
  const ipHash = hashIp(clientIp(headers), rt.ipPepper)
  const [hour, day] = await Promise.all([
    rt.store.hitRateLimit(`draft:h:${ipHash}`, 5, 3600),
    rt.store.hitRateLimit(`draft:d:${ipHash}`, 30, 86_400),
  ])
  return hour && day
}

const KNOWN_KITS = new Set<string>(KITS.map((k) => k.id))
const text = (max: number) => z.string().max(max).transform((s) => s.replace(/\s+/g, ' ').trim())

/** The /demo hand-off fields (spec 5.2 step 3). Unknown kits are refused. */
export const DemoHandoff = z.object({
  sourceUrl: text(2048).optional().default(''),
  businessName: text(120).optional().default(''),
  kitId: z.string().refine((k) => KNOWN_KITS.has(k), 'Unknown kit'),
  features: z.array(z.string().regex(/^[a-z0-9-]{1,60}$/)).max(30).default([]),
  sizeId: z.enum(['small', 'growing', 'larger']).optional(),
}).refine((v) => v.sourceUrl || v.businessName, 'A website or a business name is needed')

export function readHandoff(form: FormData) {
  return DemoHandoff.safeParse({
    sourceUrl: form.get('sourceUrl') ?? undefined,
    businessName: form.get('businessName') ?? undefined,
    kitId: form.get('kitId') ?? '',
    features: form.getAll('features[]').concat(form.getAll('features')).map(String),
    sizeId: (form.get('sizeId') || undefined) ?? undefined,
  })
}

// ------------------------------------------------------------------------------------------ HTML

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

const PAGE_HEAD = (title: string) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>${esc(title)} · Yakini Studio</title>
<style>
:root{color-scheme:dark}*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0A0908;color:#F5F2EA;font:17px/1.55 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:24px}
main{width:100%;max-width:520px}
h1{font:600 2rem/1.15 ui-serif,Georgia,serif;margin:0 0 8px}
p{margin:0 0 16px;color:#d8d2c4}
ol{list-style:none;padding:0;margin:28px 0;display:grid;gap:14px}
li{display:flex;gap:12px;align-items:center;font-size:1.05rem}
li::before{content:"";width:14px;height:14px;border-radius:50%;border:2px solid #C9A14A;flex:none}
li:last-child::before{background:#C9A14A;animation:p 1.2s ease-in-out infinite}
@keyframes p{50%{opacity:.35}}@media (prefers-reduced-motion:reduce){li:last-child::before{animation:none}}
a.btn{display:inline-flex;align-items:center;min-height:48px;padding:0 24px;border-radius:999px;background:#C9A14A;color:#0A0908;font-weight:700;text-decoration:none}
.small{font-size:.875rem;color:#B9B2A3}
</style></head><body><main>`
// Browsers wait for ~1 KB before painting a streamed page; this comment makes the first step show at once.
const PADDING = `<!--${' '.repeat(1100)}-->`

export function plainPage(title: string, body: string, status = 200): Response {
  return new Response(`${PAGE_HEAD(title)}${body}</main></body></html>`, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' },
  })
}

export function errorPage(kind: 'rate' | 'origin' | 'bad' | 'kit' | 'config' | 'server', ref?: string): Response {
  const back = '<p><a class="btn" href="https://yakini.digital/demo">Back to the demo</a></p>'
  switch (kind) {
    case 'rate': return plainPage('Please wait a bit', `<h1>That’s a lot of drafts for now.</h1><p>Please try again in an hour. Your earlier drafts are still saved in this browser.</p>${back}`, 429)
    case 'origin': return plainPage('Start from the demo', `<h1>Let’s start from the demo.</h1><p>Open the free demo and tap “Start my setup” there.</p>${back}`, 403)
    case 'bad': return plainPage('Missing details', '<h1>We need a little more.</h1><p>Add your website or your business name, then try again.</p><p><a class="btn" href="/new">Describe your business</a></p>', 400)
    case 'kit': return plainPage('Coming soon', '<h1>This kind of site is coming soon.</h1><p>Right now the studio builds food truck and restaurant sites. Yakini can still set up your kit with you.</p>' + back, 400)
    case 'config': return plainPage('Almost open', `<h1>The studio isn’t open yet.</h1><p>Please try again soon.</p><p class="small">Reference: ${esc(ref ?? 'setup')}</p>${back}`, 503)
    case 'server': return plainPage('Something went wrong', `<h1>Something went wrong on our side.</h1><p>Please try again in a minute.</p><p class="small">Reference: ${esc(ref ?? 'unknown')}</p>${back}`, 500)
  }
}

/**
 * Stream the progress page while the draft is built, then send the browser to it. Works with
 * JavaScript off (meta refresh + a link). The draft cookie is set on this response, before the
 * work starts, so it is already in place when the browser arrives at the draft.
 */
export function streamDraft(req: DraftRequest, rt: Runtime): Response {
  const siteId = randomUUID()
  const token = newDraftToken()
  const kitName = req.kitId && isBuilderKit(req.kitId) ? kitDefinition(req.kitId)!.name.toLowerCase() : null
  const enc = new TextEncoder()
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (s: string) => controller.enqueue(enc.encode(s))
      send(`${PAGE_HEAD('Building your draft')}${PADDING}<h1>Building your site draft</h1><p>This takes about a minute. No email or phone needed.</p><ol aria-live="polite">`)
      const seen = new Set<ProgressStep>()
      const progress = (s: ProgressStep) => {
        if (req.source === 'prompt' && s === 'reading') return
        if (!seen.has(s)) { seen.add(s); send(`<li>${esc(STEP_COPY[s])}</li>`) }
      }
      try {
        const r = await createDraft(req, rt, progress, { siteId, token })
        if (r.kind === 'blocked') {
          send(`</ol><p>${esc(r.message)}</p><p><a class="btn" href="https://yakini.digital">Back to Yakini</a></p></main></body></html>`)
        } else {
          const note = req.source === 'demo' && req.sourceUrl && !r.siteRead ? '?note=unread' : ''
          const href = `/d/${siteId}${note}`
          send(`</ol><meta http-equiv="refresh" content="0;url=${esc(href)}"><p>Your draft is ready.</p><p><a class="btn" href="${esc(href)}">Open your draft</a></p></main></body></html>`)
        }
      } catch (e) {
        const ref = Sentry.captureException(e, { tags: { area: 'draft-pipeline' } }) || randomUUID().slice(0, 8)
        send(`</ol><h1>Something went wrong on our side.</h1><p>Please try again in a minute${kitName ? `, or start from our ${esc(kitName)} design on the demo` : ''}.</p><p class="small">Reference: ${esc(String(ref))}</p><p><a class="btn" href="https://yakini.digital/demo">Back to the demo</a></p></main></body></html>`)
      } finally {
        controller.close()
      }
    },
  })
  return new Response(body, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
      'set-cookie': draftCookieHeader(siteId, token),
      // Let the stream through proxies as it is written.
      'x-accel-buffering': 'no',
    },
  })
}

/** Runs `fn` with the runtime, turning missing configuration into the friendly 503 page. */
export async function withRuntime(fn: (rt: Runtime) => Promise<Response>): Promise<Response> {
  let rt: Runtime
  try {
    rt = getRuntime()
  } catch (e) {
    if (e instanceof ConfigError) {
      Sentry.captureMessage(`Builder config missing: ${e.missing.join(', ')}`, 'error')
      return errorPage('config')
    }
    throw e
  }
  try {
    return await fn(rt)
  } catch (e) {
    // A setting needed later in the flow (for example sign-in's public key) is missing.
    if (e instanceof ConfigError) {
      Sentry.captureMessage(`Builder config missing: ${e.missing.join(', ')}`, 'error')
      return errorPage('config')
    }
    const ref = Sentry.captureException(e, { tags: { area: 'draft-route' } })
    return errorPage('server', ref || undefined)
  }
}

export function asKit(id: string | undefined): KitId | undefined {
  return id && isBuilderKit(id) ? id : undefined
}
