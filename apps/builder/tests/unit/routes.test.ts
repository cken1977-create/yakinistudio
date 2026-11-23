import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// The routes read the draft cookie through next/headers; tests hand it a plain cookie jar.
const jar = new Map<string, string>()
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined) }),
}))

let ip = 0
const nextIp = () => `203.0.113.${++ip % 250}`
const DEMO = 'https://yakini.digital'

function demoPost(fields: Record<string, string | string[]>, headers: Record<string, string> = {}) {
  const body = new URLSearchParams()
  for (const [k, v] of Object.entries(fields)) for (const x of [v].flat()) body.append(k, x)
  return new Request('https://studio.yakini.digital/start', {
    method: 'POST', body,
    headers: { origin: DEMO, 'content-type': 'application/x-www-form-urlencoded', 'x-forwarded-for': nextIp(), ...headers },
  })
}

/** Read the streamed progress page and keep the draft cookie, as a browser would. */
async function follow(res: Response) {
  const html = await res.text()
  const cookie = res.headers.get('set-cookie') ?? ''
  const [, name, value] = /^([^=]+)=([^;]+)/.exec(cookie) ?? []
  if (name) jar.set(name, value)
  const siteId = /href="\/d\/([0-9a-f-]{36})/.exec(html)?.[1]
  return { html, cookie, siteId }
}

beforeAll(() => { vi.stubEnv('BUILDER_TEST_MODE', '1'); vi.stubEnv('VERCEL', ''); vi.stubEnv('VERCEL_ENV', ''); vi.stubEnv('CRON_SECRET', 'cron-secret-for-unit-tests') })
afterAll(() => vi.unstubAllEnvs())
beforeEach(() => jar.clear())

describe('POST /start (demo hand-off)', () => {
  it('builds the draft, streams progress, sets the private cookie and links to the draft', async () => {
    const { POST } = await import('@/app/start/route')
    const res = await POST(demoPost({ sourceUrl: 'https://mesa-street-tacos.example/', businessName: '', kitId: 'food-truck', 'features[]': ['online-menu'], sizeId: 'small' }))
    expect(res.status).toBe(200)
    expect(res.headers.get('x-robots-tag')).toMatch(/noindex/)
    const { html, cookie, siteId } = await follow(res)
    expect(cookie).toMatch(/^__Host-ykd-[0-9a-f-]{36}=[A-Za-z0-9_-]{43}; Path=\/; Max-Age=1209600; HttpOnly; Secure; SameSite=Lax$/)
    expect(html).toContain('Reading your website…')
    expect(html).toContain('Open your draft')
    expect(html).not.toContain('note=unread')
    expect(siteId).toBeTruthy()
    expect(html).not.toMatch(/\bAI\b|Grok|xAI|Supabase|Vercel/)
  })

  it('an unreadable website still lands on a draft, with the "couldn’t read" note', async () => {
    const { POST } = await import('@/app/start/route')
    const { html, siteId } = await follow(await POST(demoPost({ sourceUrl: 'https://does-not-exist.invalid/', businessName: 'Rosa’s Kitchen', kitId: 'restaurant' })))
    expect(siteId).toBeTruthy()
    expect(html).toContain('?note=unread')
  })

  it('refuses other origins, unknown kits, kits the studio does not build yet and empty hand-offs', async () => {
    const { POST } = await import('@/app/start/route')
    expect((await POST(demoPost({ businessName: 'X', kitId: 'food-truck' }, { origin: 'https://evil.example' }))).status).toBe(403)
    expect((await POST(demoPost({ businessName: 'X', kitId: 'food-truck' }, { origin: 'null', referer: '' }))).status).toBe(403)
    expect((await POST(demoPost({ businessName: 'X', kitId: 'spaceship' }))).status).toBe(400)
    expect((await POST(demoPost({ kitId: 'food-truck' }))).status).toBe(400)
    const other = (await import('@yakini/pricing')).KITS.find((k) => k.id !== 'food-truck' && k.id !== 'restaurant')
    if (other) {
      const res = await POST(demoPost({ businessName: 'X', kitId: other.id }))
      expect(res.status).toBe(400)
      expect(await res.text()).toContain('coming soon')
    }
  })

  it('rate-limits one visitor to 5 drafts an hour', async () => {
    const { POST } = await import('@/app/start/route')
    const statuses: number[] = []
    for (let i = 0; i < 6; i++) {
      const res = await POST(demoPost({ businessName: 'Limit Test', kitId: 'restaurant' }, { 'x-forwarded-for': '198.51.100.77' }))
      statuses.push(res.status)
      await res.text()
    }
    expect(statuses.slice(0, 5)).toEqual([200, 200, 200, 200, 200])
    expect(statuses[5]).toBe(429)
  })

  it('GET /start sends people to the form', async () => {
    const { GET } = await import('@/app/start/route')
    const res = GET(new Request('https://studio.yakini.digital/start'))
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toMatch(/\/new$/)
  })
})

describe('POST /api/drafts (describe your business)', () => {
  async function promptPost(fields: Record<string, string>, opts: { ageMs?: number; origin?: string; logo?: Blob } = {}) {
    const { signFormTime } = await import('@/lib/server/request')
    const { getRuntime } = await import('@/lib/server/runtime')
    const form = new FormData()
    form.set('t', signFormTime(Date.now() - (opts.ageMs ?? 10_000), getRuntime().ipPepper))
    for (const [k, v] of Object.entries(fields)) form.set(k, v)
    if (opts.logo) form.set('logo', opts.logo, 'logo.png')
    return new Request('https://studio.yakini.digital/api/drafts', { method: 'POST', body: form, headers: { origin: opts.origin ?? 'https://studio.yakini.digital', 'x-forwarded-for': nextIp() } })
  }

  it('builds a draft from a description, with the owner’s colors when ticked', async () => {
    const { POST } = await import('@/app/api/drafts/route')
    const res = await POST(await promptPost({ businessName: 'Smoke & Spoke', description: 'Texas barbecue from a trailer, brisket and ribs on weekends.', city: 'Austin', useColors: 'on', primary: '#112233', secondary: '#221100', accent: '#FFCC00' }))
    const { html, siteId } = await follow(res)
    expect(html).not.toContain('Reading your website') // nothing to read in this flow
    const { getRuntime } = await import('@/lib/server/runtime')
    const { loadSiteDoc } = await import('@yakini/site-schema')
    const doc = loadSiteDoc((await getRuntime().store.getDraft(siteId!))!.doc).doc
    expect(doc.brand.colors).toEqual({ primary: '#112233', secondary: '#221100', accent: '#FFCC00' })
    expect(doc.brand.colorsSource).toBe('owner')
    expect(doc.kitId).toBe('food-truck')
  })

  it('without "use my colors" the kit’s default colors are used and labelled', async () => {
    const { POST } = await import('@/app/api/drafts/route')
    const { siteId } = await follow(await POST(await promptPost({ businessName: 'Harbor Room', description: 'Seafood restaurant with a raw bar.', kitId: 'restaurant', primary: '#000000', secondary: '#000000', accent: '#000000' })))
    const { getRuntime } = await import('@/lib/server/runtime')
    const { loadSiteDoc } = await import('@yakini/site-schema')
    expect(loadSiteDoc((await getRuntime().store.getDraft(siteId!))!.doc).doc.brand.colorsSource).toBe('kit-default')
  })

  it('refuses the honeypot, a form sent too fast or too late, another origin, and a non-image logo', async () => {
    const { POST } = await import('@/app/api/drafts/route')
    const ok = { businessName: 'Bot Bistro', description: 'We serve food.' }
    expect((await POST(await promptPost({ ...ok, website: 'http://spam.example' }))).status).toBe(400)
    expect((await POST(await promptPost(ok, { ageMs: 500 }))).status).toBe(400)
    expect((await POST(await promptPost(ok, { ageMs: 3 * 60 * 60 * 1000 }))).status).toBe(400)
    expect((await POST(await promptPost(ok, { origin: DEMO }))).status).toBe(403)
    expect((await POST(await promptPost({ businessName: 'Bot Bistro', description: '' }))).status).toBe(400)
    expect((await POST(await promptPost(ok, { logo: new Blob(['<html></html>'], { type: 'text/html' }) }))).status).toBe(400)
  })
})

describe('form time signing', () => {
  it('accepts a real form, refuses tampering, speed and old forms', async () => {
    const { checkFormTime, signFormTime } = await import('@/lib/server/request')
    const pepper = 'unit-test-pepper-0123456789'
    const now = 1_800_000_000_000
    expect(checkFormTime(signFormTime(now - 5_000, pepper), pepper, now)).toBe('ok')
    expect(checkFormTime(signFormTime(now - 1_000, pepper), pepper, now)).toBe('too_fast')
    expect(checkFormTime(signFormTime(now - 3 * 3600_000, pepper), pepper, now)).toBe('expired')
    expect(checkFormTime(signFormTime(now - 5_000, 'another-pepper-0123456789'), pepper, now)).toBe('bad')
    expect(checkFormTime(`${now - 60_000}.${'0'.repeat(32)}`, pepper, now)).toBe('bad')
    expect(checkFormTime(null, pepper, now)).toBe('bad')
  })
})

describe('draft access and private photos', () => {
  async function makeDraft() {
    const { POST } = await import('@/app/start/route')
    return follow(await POST(demoPost({ sourceUrl: 'https://mesa-street-tacos.example/', kitId: 'food-truck' })))
  }

  it('only the browser with the draft cookie can open the draft', async () => {
    const { siteId } = await makeDraft()
    const { openDraft } = await import('@/lib/server/draft-access')
    const { getRuntime } = await import('@/lib/server/runtime')
    const rt = getRuntime()
    expect(await openDraft(rt, siteId!)).not.toBeNull()
    const name = [...jar.keys()][0]
    const token = jar.get(name)!
    jar.set(name, (token[0] === 'A' ? 'B' : 'A') + token.slice(1))
    expect(await openDraft(rt, siteId!)).toBeNull()
    jar.clear()
    expect(await openDraft(rt, siteId!)).toBeNull()
    expect(await openDraft(rt, 'not-a-uuid')).toBeNull()
  })

  it('an expired, deleted or claimed draft is gone', async () => {
    const { siteId } = await makeDraft()
    const { openDraft } = await import('@/lib/server/draft-access')
    const { getRuntime } = await import('@/lib/server/runtime')
    const rt = getRuntime()
    expect(await openDraft(rt, siteId!, Date.now() + 15 * 86_400_000)).toBeNull()
    const state = (rt.store as unknown as { _state: { sites: Map<string, { claimed: boolean; deleted: boolean }> } })._state
    state.sites.get(siteId!)!.claimed = true
    expect(await openDraft(rt, siteId!)).toBeNull()
    state.sites.get(siteId!)!.claimed = false
    state.sites.get(siteId!)!.deleted = true
    expect(await openDraft(rt, siteId!)).toBeNull()
  })

  it('serves the draft’s own photos to the cookie holder only, and nothing it does not use', async () => {
    const { siteId } = await makeDraft()
    const { GET } = await import('@/app/api/drafts/[siteId]/assets/[assetId]/route')
    const { getRuntime } = await import('@/lib/server/runtime')
    const { loadSiteDoc } = await import('@yakini/site-schema')
    const { assetIdsIn } = await import('@/lib/draft/preview')
    const { sampleImageById } = await import('@yakini/kits')
    const doc = loadSiteDoc((await getRuntime().store.getDraft(siteId!))!.doc).doc
    const own = [...assetIdsIn(doc)].filter((id) => !sampleImageById(id))
    expect(own.length).toBeGreaterThan(0)
    const get = (assetId: string) => GET(new Request('https://studio.yakini.digital/x'), { params: Promise.resolve({ siteId: siteId!, assetId }) })
    const res = await get(own[0])
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/^image\/(webp|png)$/)
    expect(res.headers.get('cache-control')).toBe('private, max-age=3600')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect((await get('00000000-0000-4000-8000-000000000000')).status).toBe(404)
    jar.clear()
    expect((await get(own[0])).status).toBe(404)
  })
})

describe('GET /api/cron/cleanup', () => {
  it('needs the cron secret and expires old drafts', async () => {
    const { GET } = await import('@/app/api/cron/cleanup/route')
    const call = (auth?: string) => GET(new Request('https://studio.yakini.digital/api/cron/cleanup', { headers: auth ? { authorization: auth } : {} }))
    expect((await call()).status).toBe(401)
    expect((await call('Bearer wrong')).status).toBe(401)
    const res = await call('Bearer cron-secret-for-unit-tests')
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ ok: true })
  })
})
