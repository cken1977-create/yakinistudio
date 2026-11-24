import { createHash } from 'node:crypto'
import { HONEYPOT_FIELD } from '@yakini/sections'
import * as Sentry from '@sentry/nextjs'
import { normalizeHost } from '@/lib/hosts'
import { readFormFields, summary } from '@/lib/site/form-input'
import { sendAlert } from '@/lib/server/mail'
import { checkFormTime, clientIp, hashIp, readCappedForm } from '@/lib/server/request'
import { ConfigError, getRuntime } from '@/lib/server/runtime'
import { studioOrigin } from '@/lib/server/settings'
import { cachedSiteForHost } from '@/lib/server/site-cache'

/**
 * POST /api/f/[siteId]/[formKey] (spec 5.8, 11.3): a visitor's form on a published site. Works with
 * JavaScript off (form post → 303 to /thanks) and with JSON. The message is stored and the owner
 * gets an internal email alert. The visitor gets nothing automatically (R4, R5). Forwarding to
 * the portal arrives in Phase 6.
 */
export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const MAX_BODY = 16 * 1024
const FORM_MAX_AGE_MS = 24 * 60 * 60 * 1000

/** A short plain page for the JS-off visitor; no vendor names, noindex. */
function page(status: number, title: string, body: string): Response {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)}</title></head><body style="font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem;line-height:1.5"><h1 style="font-size:1.5rem">${esc(title)}</h1><p>${esc(body)}</p><p><a href="/">Back to the site</a></p></body></html>`
  return new Response(html, { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } })
}

export async function POST(request: Request, { params }: { params: Promise<{ siteId: string; formKey: string }> }): Promise<Response> {
  const { siteId, formKey } = await params
  const wantsJson = (request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')
  const fail = (status: number, title: string, body: string) => (wantsJson ? Response.json({ error: body }, { status, headers: { 'cache-control': 'no-store' } }) : page(status, title, body))
  const thanks = () => (wantsJson ? Response.json({ ok: true }, { headers: { 'cache-control': 'no-store' } })
    : new Response(null, { status: 303, headers: { location: `/thanks?f=${encodeURIComponent(formKey)}`, 'cache-control': 'no-store' } }))
  const gone = () => fail(410, 'This form is closed', 'This site isn’t taking messages right now.')

  if (!UUID.test(siteId) || !/^[a-z0-9-]{1,40}$/.test(formKey)) return gone()
  let rt
  try { rt = getRuntime() } catch (e) { if (e instanceof ConfigError) return gone(); throw e }
  try {
    // The site is resolved by the host the visitor is on, and must be this site (11.3).
    const host = normalizeHost(request.headers.get('host'))
    const hs = await cachedSiteForHost(rt, host)
    if (!hs || hs.siteId !== siteId || hs.state !== 'live') return gone() // takedown / unpublished: 410, nothing stored
    const origin = request.headers.get('origin')
    if (origin && origin !== 'null' && normalizeHost(origin.replace(/^https?:\/\//, '')) !== host) return fail(403, 'Please try again', 'Please send the form from the site’s own page.')

    let get: (name: string) => unknown
    if (wantsJson) {
      const text = await new Response(request.body).text().catch(() => '')
      if (text.length > MAX_BODY) return fail(413, 'Too long', 'That message is too long.')
      let body: Record<string, unknown>
      try { body = JSON.parse(text) } catch { return fail(400, 'Please try again', 'That form couldn’t be read.') }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return fail(400, 'Please try again', 'That form couldn’t be read.')
      get = (n) => body[n]
    } else {
      const data = await readCappedForm(request, MAX_BODY)
      if (!data) return fail(413, 'Too long', 'That message is too long.')
      get = (n) => data.get(n) ?? undefined
    }

    // Spam checks (14.4): honeypot and a signed render time (≥ 3 s, < 24 h). Bots get the normal
    // thank-you so they learn nothing; nothing is stored.
    const honey = get(HONEYPOT_FIELD)
    if (typeof honey === 'string' && honey.trim() !== '') return thanks()
    const ts = checkFormTime(typeof get('ts') === 'string' ? (get('ts') as string) : null, rt.ipPepper, Date.now(), FORM_MAX_AGE_MS)
    if (ts === 'too_fast' || ts === 'bad') return thanks()
    if (ts === 'expired') return fail(400, 'Please send it again', 'This page was open for a long time. Please go back, refresh the page and send your message again.')

    const ipHash = hashIp(clientIp(request.headers), rt.ipPepper)
    if (!(await rt.store.hitRateLimit(`form:${siteId}:${ipHash}`, 5, 600))) return fail(429, 'Please wait a few minutes', 'You’ve sent several messages in a row. Please wait a few minutes and try again.')
    if (!(await rt.store.hitRateLimit(`form-day:${siteId}`, 200, 86_400))) return fail(429, 'Please try again tomorrow', 'This site has received a lot of messages today. Please call instead or try again tomorrow.')

    const form = await rt.store.siteForm(siteId, formKey)
    if (!form) return gone()
    const input = readFormFields(form.fields, get)
    if (!input.ok) return fail(400, 'Please check the form', input.problem === 'missing' ? 'Please add your name and a way to reach you.' : 'One of the answers didn’t look right. Please check it and send again.')

    const ua = request.headers.get('user-agent')
    await rt.store.saveSubmission({
      siteId, tenantId: form.tenantId, formId: form.formId, payload: input.values, ipHash,
      uaHash: ua ? createHash('sha256').update(`ua:${ua}`).digest('hex') : null, spamScore: 0, status: 'received',
    })

    // Internal alert to the owner (5.8 step 5). Never to the visitor.
    const to = [...form.notifyEmails, ...(await rt.store.ownerEmails(form.tenantId))]
    const kind = form.kind === 'booking_request' ? 'booking request' : form.kind === 'catering' ? 'catering request' : 'message'
    await sendAlert({
      to, tag: 'form-alert',
      subject: `New ${kind} from your website`,
      text: `You have a new ${kind} from ${host}.\n\n${summary(input.values)}\n\nSee all your messages: ${studioOrigin()}/sites/${siteId}/forms\n\nThis person has not been sent anything. Reply to them yourself when you’re ready.\n`,
    })
    return thanks()
  } catch (e) {
    Sentry.captureException(e, { tags: { area: 'site-form' } })
    return fail(500, 'Something went wrong', 'Your message wasn’t sent. Please try again, or call instead.')
  }
}
