import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadSiteDoc } from '@yakini/site-schema'
import { form as post, jar, makeDraft, signIn, where } from './browser'

vi.mock('next/headers', async () => (await import('./browser')).headersMock)

beforeAll(() => { vi.stubEnv('BUILDER_TEST_MODE', '1'); vi.stubEnv('VERCEL', ''); vi.stubEnv('VERCEL_ENV', '') })
afterAll(() => vi.unstubAllEnvs())
beforeEach(() => jar.clear())

const claimFields = (rev: number, more: Record<string, string> = {}) => ({ rev: String(rev), attest: 'on', ...more })

describe('claim form parsing', () => {
  it('needs the ownership box and nothing else', async () => {
    const { parseClaimForm } = await import('@/lib/claim')
    const f = (o: Record<string, string>) => { const d = new FormData(); for (const [k, v] of Object.entries(o)) d.set(k, v); return d }
    expect(parseClaimForm(f({}))).toEqual({ ok: false, error: 'attest' })
    expect(parseClaimForm(f({ attest: 'on' }))).toEqual({ ok: true, value: { attested: true, timezone: null } })
  })

  it('reads US phone numbers in any common shape and refuses the rest', async () => {
    const { normalizeUsPhone } = await import('@/lib/claim')
    for (const p of ['(915) 555-0123', '915.555.0123', '+1 915 555 0123', '19155550123']) expect(normalizeUsPhone(p)).toBe('+19155550123')
    for (const p of ['555-0123', '015-555-0123', '+44 20 7946 0958', 'call me']) expect(normalizeUsPhone(p)).toBeNull()
  })

  it('takes a whole address or none, hours per day, and a time zone from the picker or the address', async () => {
    const { parseClaimForm } = await import('@/lib/claim')
    const f = (o: Record<string, string>) => { const d = new FormData(); d.set('attest', 'on'); for (const [k, v] of Object.entries(o)) d.set(k, v); return d }
    expect(parseClaimForm(f({ city: 'El Paso' }))).toEqual({ ok: false, error: 'address' })
    const r = parseClaimForm(f({ line1: '100 Mesa St', city: 'El Paso', state: 'tx', postal: '79901', 'mon-open': '11:00', 'mon-close': '21:00', 'tue-closed': 'on' }))
    expect(r).toEqual({ ok: true, value: {
      attested: true, timezone: 'America/Denver', // El Paso keeps Mountain time, though Texas is mostly Central
      address: { line1: '100 Mesa St', city: 'El Paso', region: 'TX', postal: '79901', country: 'US' },
      hours: [{ day: 'mon', open: '11:00', close: '21:00' }, { day: 'tue', closed: true }],
    } })
    expect(parseClaimForm(f({ 'wed-open': '11:00' }))).toEqual({ ok: false, error: 'hours' })
    expect(parseClaimForm(f({ line1: '1 Main', city: 'Austin', state: 'TX', postal: '78701', timezone: 'America/Phoenix' })).ok && 'ok').toBe('ok')
    const picked = parseClaimForm(f({ line1: '1 Main', city: 'Austin', state: 'TX', postal: '78701', timezone: 'America/Phoenix' }))
    expect(picked.ok && picked.value.timezone).toBe('America/Phoenix')
    const bogus = parseClaimForm(f({ timezone: 'Europe/Paris' }))
    expect(bogus.ok && bogus.value.timezone).toBeNull()
  })

  it('only ever sends people to a path on the studio after sign-in', async () => {
    const { safeNext } = await import('@/lib/server/auth')
    expect(safeNext('/claim/abc?e=1')).toBe('/claim/abc?e=1')
    for (const bad of ['//evil.example/x', 'https://evil.example', '/\\evil.example', 'javascript:alert(1)', '', undefined, '/x'.repeat(200)]) expect(safeNext(bad)).toBe('/sites')
  })
})

describe('sign in by email code', () => {
  it('sends a code, keeps the email out of the URL, and signs in with the right code only', async () => {
    const { POST: code } = await import('@/app/api/auth/code/route')
    const { POST: verify } = await import('@/app/api/auth/verify/route')
    const { currentUser, TEST_MODE_CODE } = await import('@/lib/server/auth')
    const sent = await code(post('/api/auth/code', { email: 'Rosa@Example.com', next: '/claim/abc' }))
    expect(sent.status).toBe(303)
    expect(where(sent)).toBe('/signin?step=code&next=%2Fclaim%2Fabc')
    expect(sent.headers.get('location')).not.toMatch(/rosa|example/i)
    expect(where(await verify(post('/api/auth/verify', { code: '000000' })))).toContain('e=code')
    expect(await currentUser()).toBeNull()
    expect(where(await verify(post('/api/auth/verify', { code: TEST_MODE_CODE })))).toBe('/claim/abc')
    expect((await currentUser())?.email).toBe('rosa@example.com')
    expect(jar.has('__Host-yk-signin')).toBe(false)
  })

  it('refuses bad emails, other origins, and stops code guessing', async () => {
    const { POST: code } = await import('@/app/api/auth/code/route')
    const { POST: verify } = await import('@/app/api/auth/verify/route')
    expect(where(await code(post('/api/auth/code', { email: 'not-an-email' })))).toContain('e=email')
    expect(where(await code(post('/api/auth/code', { email: 'a@b.co' }, { origin: 'https://evil.example' })))).toContain('e=origin')
    expect(where(await verify(post('/api/auth/verify', { code: '123456' })))).toContain('e=expired') // no code was asked for
    await code(post('/api/auth/code', { email: 'guess@example.com' }))
    const fixedIp = { 'x-forwarded-for': '192.0.2.77' }
    const results = []
    for (let i = 0; i < 11; i++) results.push(where(await verify(post('/api/auth/verify', { code: '111111' }, fixedIp))))
    expect(results.slice(0, 10).every((r) => r.includes('e=code'))).toBe(true)
    expect(results[10]).toContain('e=rate')
  })

  it('caps sign-in emails per address', async () => {
    const { POST: code } = await import('@/app/api/auth/code/route')
    const out = []
    for (let i = 0; i < 6; i++) out.push(where(await code(post('/api/auth/code', { email: 'flood@example.com' }))))
    expect(out.slice(0, 5).every((r) => r.includes('step=code'))).toBe(true)
    expect(out[5]).toContain('e=rate')
  })

  it('a tampered session cookie is not a session', async () => {
    const { currentUser } = await import('@/lib/server/auth')
    await signIn('owner@mesastreet.example')
    const v = jar.get('ykt_session')!
    const [body, sig] = v.split('.')
    const forged = Buffer.from(JSON.stringify({ id: 'x', email: 'evil@example.com', exp: Date.now() + 1e9 })).toString('base64url')
    jar.set('ykt_session', `${forged}.${sig}`)
    expect(await currentUser()).toBeNull()
    jar.set('ykt_session', `${body}.${sig}`)
    expect((await currentUser())?.email).toBe('owner@mesastreet.example')
  })
})

describe('POST /api/drafts/[siteId]/claim (Make it mine)', () => {
  it('makes the signed-in cookie holder the owner, saves details and time zone, and opens the editor', async () => {
    const { rt, siteId, tenantId, cookie } = await makeDraft()
    const userId = await signIn()
    const { POST } = await import('@/app/api/drafts/[siteId]/claim/route')
    const res = await POST(post(`/api/drafts/${siteId}/claim`, claimFields(0, {
      phone: '(915) 555-0123', line1: '100 Mesa St', city: 'El Paso', state: 'TX', postal: '79901', 'sat-open': '10:00', 'sat-close': '16:00',
    })), { params: Promise.resolve({ siteId }) })
    expect(res.status).toBe(303)
    expect(where(res)).toBe(`/sites/${siteId}/edit?welcome=1`)
    expect(await rt.store.memberRole(userId, tenantId)).toBe('owner')
    const site = (await rt.store.getEditorSite(siteId))!
    expect(site.tenantStatus).toBe('trial')
    expect(site.timezone).toBe('America/Denver')
    expect(site.rev).toBe(1)
    const doc = loadSiteDoc(site.doc).doc
    expect(doc.business.phone).toBe('+19155550123')
    expect(doc.business.address?.postal).toBe('79901')
    expect(doc.business.hours).toEqual([{ day: 'sat', open: '10:00', close: '16:00' }])
    expect(jar.has(cookie)).toBe(false)
    expect((await rt.store.getDraft(siteId))!.tokenHash).toBeNull()
  })

  it('claiming again, or from a second tab, goes to the editor and changes nothing', async () => {
    const { rt, siteId, token, cookie } = await makeDraft()
    await signIn()
    const { POST } = await import('@/app/api/drafts/[siteId]/claim/route')
    await POST(post(`/api/drafts/${siteId}/claim`, claimFields(0)), { params: Promise.resolve({ siteId }) })
    expect((await rt.store.getEditorSite(siteId))!.rev).toBe(0) // nothing typed, so the draft is untouched
    jar.set(cookie, token) // a second tab that still had the old cookie
    const again = await POST(post(`/api/drafts/${siteId}/claim`, claimFields(0)), { params: Promise.resolve({ siteId }) })
    expect(where(again)).toBe(`/sites/${siteId}/edit`)
  })

  it('needs the box, a signed-in person, this browser’s draft cookie, and the studio origin', async () => {
    const { rt, siteId, tenantId, cookie } = await makeDraft()
    const { POST } = await import('@/app/api/drafts/[siteId]/claim/route')
    const call = (f: Record<string, string>, h?: Record<string, string>) => POST(post(`/api/drafts/${siteId}/claim`, f, h), { params: Promise.resolve({ siteId }) })

    expect(where(await call(claimFields(0)))).toBe(`/signin?next=%2Fclaim%2F${siteId}`)
    const userId = await signIn()
    expect((await call(claimFields(0), { origin: 'https://evil.example' })).status).toBe(403)
    expect(where(await call({ rev: '0' }))).toBe(`/claim/${siteId}?e=attest`)
    expect(where(await call(claimFields(0, { phone: '555' })))).toBe(`/claim/${siteId}?e=phone`)
    const held = jar.get(cookie)!
    jar.delete(cookie)
    expect(where(await call(claimFields(0)))).toBe(`/claim/${siteId}?e=gone`)
    jar.set(cookie, 'A'.repeat(43)) // someone else's guess at a token
    expect(where(await call(claimFields(0)))).toBe(`/claim/${siteId}?e=gone`)
    expect(await rt.store.memberRole(userId, tenantId)).toBeNull()
    jar.set(cookie, held)
    expect(where(await call(claimFields(0)))).toBe(`/sites/${siteId}/edit?welcome=1`)
  })

  it('never writes the claim screen’s details over an edit made in another window', async () => {
    const { rt, siteId, tenantId } = await makeDraft({ phone: '+19155550100' })
    const userId = await signIn()
    // Another window saves an edit after the claim screen was opened at rev 0.
    const d = (await rt.store.getDraft(siteId))!
    await rt.store.saveDraft({ siteId, baseRev: 0, doc: d.doc })
    const { POST } = await import('@/app/api/drafts/[siteId]/claim/route')
    const res = await POST(post(`/api/drafts/${siteId}/claim`, claimFields(0, { phone: '(915) 555-0199' })), { params: Promise.resolve({ siteId }) })
    expect(where(res)).toBe(`/claim/${siteId}?e=changed`)
    expect(await rt.store.memberRole(userId, tenantId)).toBeNull()
    expect(loadSiteDoc((await rt.store.getDraft(siteId))!.doc).doc.business.phone).toBe('+19155550100')
  })

  it('a cleared field on the claim screen is removed from the site', async () => {
    const { rt, siteId } = await makeDraft({ phone: '+19155550100' })
    await signIn()
    const { POST } = await import('@/app/api/drafts/[siteId]/claim/route')
    await POST(post(`/api/drafts/${siteId}/claim`, claimFields(0, { phone: '' })), { params: Promise.resolve({ siteId }) })
    expect(loadSiteDoc((await rt.store.getEditorSite(siteId))!.doc).doc.business.phone).toBeUndefined()
  })
})
