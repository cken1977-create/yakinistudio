import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, freshIp, jar, readySite } from './browser'

vi.mock('next/headers', async () => (await import('./browser')).headersMock)
vi.mock('next/cache', () => ({ revalidateTag: () => {}, unstable_cache: (fn: () => unknown) => fn }))

beforeAll(() => { vi.stubEnv('BUILDER_TEST_MODE', '1'); vi.stubEnv('VERCEL', ''); vi.stubEnv('VERCEL_ENV', '') })
afterAll(() => vi.unstubAllEnvs())
beforeEach(() => jar.clear())

const rt = async () => (await import('@/lib/server/runtime')).getRuntime()
let n = 0

/** A published, paying site and its live host. */
async function liveSite() {
  const s = await readySite({ plan: true })
  const slug = `forms-test-${++n}-${Math.random().toString(36).slice(2, 7)}`
  const { POST } = await import('@/app/api/sites/[siteId]/publish/route')
  const res = await POST(api('POST', `/api/sites/${s.siteId}/publish`, { slug }), { params: Promise.resolve({ siteId: s.siteId }) })
  if (res.status !== 200) throw new Error(`publish failed: ${res.status}`)
  return { ...s, host: `${slug}.yakini.digital` }
}

async function stamp(agoMs = 5000) {
  const { signFormTime } = await import('@/lib/server/request')
  return signFormTime(Date.now() - agoMs, (await rt()).ipPepper)
}

async function post(site: { siteId: string; host: string }, fields: Record<string, string>, o: { formKey?: string; host?: string; ip?: string; headers?: Record<string, string>; json?: boolean } = {}) {
  const { POST } = await import('@/app/api/f/[siteId]/[formKey]/route')
  const host = o.host ?? site.host
  const formKey = o.formKey ?? 'contact'
  const req = new Request(`https://${host}/api/f/${site.siteId}/${formKey}`, {
    method: 'POST',
    body: o.json ? JSON.stringify(fields) : new URLSearchParams(fields),
    headers: { host, origin: `https://${host}`, 'content-type': o.json ? 'application/json' : 'application/x-www-form-urlencoded', 'x-forwarded-for': o.ip ?? freshIp(), ...o.headers },
  })
  return POST(req, { params: Promise.resolve({ siteId: site.siteId, formKey }) })
}

async function stored(siteId: string) { return (await rt()).store.listSubmissions(siteId, 100) }
async function outbox() { return (await import('@/lib/server/mail')).testOutbox() }

describe('site forms (spec 5.8, 11.3)', () => {
  it('a JS-off post is stored, the owner gets an internal alert, the visitor gets nothing, and lands on /thanks', async () => {
    const s = await liveSite()
    const before = (await outbox()).length
    const res = await post(s, { name: 'Ana Ruiz', email: 'ana@visitor.example', message: 'Can you cater 40 people?', company_website: '', ts: await stamp() })
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe('/thanks?f=contact')
    const rows = await stored(s.siteId)
    expect(rows).toHaveLength(1)
    expect(rows[0].payload).toEqual({ name: 'Ana Ruiz', email: 'ana@visitor.example', message: 'Can you cater 40 people?' })
    const mail = (await outbox()).slice(before)
    expect(mail).toHaveLength(1)
    expect(mail[0].tag).toBe('form-alert')
    expect(mail[0].to).toEqual([expect.stringMatching(/@mesastreet\.example$/)]) // the owner
    expect(mail[0].text).toContain('Can you cater 40 people?')
    expect(mail.flatMap((m) => m.to)).not.toContain('ana@visitor.example') // never the visitor (R5)
  })

  it('JSON posts work too and answer with JSON', async () => {
    const s = await liveSite()
    const res = await post(s, { name: 'Bo', phone: '(915) 555-0100', ts: await stamp() }, { json: true })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(await stored(s.siteId)).toHaveLength(1)
  })

  it('spam fixtures are blocked and nothing is stored: honeypot, too fast, no or forged time stamp', async () => {
    const s = await liveSite()
    const base = { name: 'Bot', email: 'bot@spam.example', message: 'Buy now' }
    expect((await post(s, { ...base, company_website: 'http://spam.example', ts: await stamp() })).status).toBe(303)
    expect((await post(s, { ...base, ts: await stamp(500) })).status).toBe(303)
    expect((await post(s, base)).status).toBe(303)
    expect((await post(s, { ...base, ts: `${Date.now() - 5000}.${'0'.repeat(32)}` })).status).toBe(303)
    expect(await stored(s.siteId)).toHaveLength(0)
    // A page left open more than a day asks for a refresh instead of silently dropping it.
    const old = await post(s, { ...base, ts: await stamp(25 * 3600_000) })
    expect(old.status).toBe(400)
    expect(await old.text()).toContain('refresh the page')
  })

  it('only declared fields are kept; a missing name or way to reach them is refused', async () => {
    const s = await liveSite()
    await post(s, { name: 'Cy', email: 'cy@visitor.example', password: 'hunter2', card: '4242424242424242', ts: await stamp() })
    expect((await stored(s.siteId))[0].payload).toEqual({ name: 'Cy', email: 'cy@visitor.example' })
    expect((await post(s, { email: 'x@visitor.example', ts: await stamp() })).status).toBe(400)
    expect((await post(s, { name: 'No contact', message: 'hi', ts: await stamp() })).status).toBe(400)
    expect((await post(s, { name: 'Bad email', email: 'not-an-email', ts: await stamp() })).status).toBe(400)
  })

  it('rate limit: 5 per 10 minutes per visitor per site', async () => {
    const s = await liveSite()
    const ip = '203.0.113.77'
    for (let i = 0; i < 5; i++) expect((await post(s, { name: `V${i}`, email: 'v@visitor.example', ts: await stamp() }, { ip })).status).toBe(303)
    expect((await post(s, { name: 'V6', email: 'v@visitor.example', ts: await stamp() }, { ip })).status).toBe(429)
    expect(await stored(s.siteId)).toHaveLength(5)
  })

  it('the form must be posted on the site’s own host, from its own pages', async () => {
    const s = await liveSite()
    const other = await liveSite()
    const fields = { name: 'Dee', email: 'dee@visitor.example', ts: await stamp() }
    expect((await post(s, fields, { host: other.host })).status).toBe(410)
    expect((await post(s, fields, { host: 'unknown.yakini.digital' })).status).toBe(410)
    expect((await post(s, fields, { headers: { origin: 'https://evil.example' } })).status).toBe(403)
    expect((await post(s, fields, { formKey: 'no-such-form' })).status).toBe(410)
    expect(await stored(s.siteId)).toHaveLength(0)
  })

  it('oversized bodies are refused (413)', async () => {
    const s = await liveSite()
    expect((await post(s, { name: 'Big', email: 'b@visitor.example', message: 'x'.repeat(20_000), ts: await stamp() })).status).toBe(413)
  })

  it('after takedown the form answers 410 and stores nothing (14.8 #7)', async () => {
    const s = await liveSite()
    await (await rt()).store.takedown({ siteId: s.siteId, kind: 'operator', reason: 'phishing', note: null, userId: null })
    const res = await post(s, { name: 'Eve', email: 'e@visitor.example', ts: await stamp() })
    expect(res.status).toBe(410)
    expect(await stored(s.siteId)).toHaveLength(0)
  })
})
