import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadSiteDoc } from '@yakini/site-schema'
import { STUDIO, api, freshIp, jar, makeDraft, readySite, signIn, signInOperator, where } from './browser'

vi.mock('next/headers', async () => (await import('./browser')).headersMock)
vi.mock('next/cache', () => ({ revalidateTag: () => {}, unstable_cache: (fn: () => unknown) => fn }))

beforeAll(() => { vi.stubEnv('OPERATOR_EMAIL', 'ops@yakini.example'); vi.stubEnv('BUILDER_TEST_MODE', '1'); vi.stubEnv('VERCEL', ''); vi.stubEnv('VERCEL_ENV', '') })
afterAll(() => vi.unstubAllEnvs())
beforeEach(() => jar.clear())

const rt = async () => (await import('@/lib/server/runtime')).getRuntime()
const ctx = <T extends Record<string, string>>(p: T) => ({ params: Promise.resolve(p) })
let n = 0
const slug = () => `safety-${++n}-${Math.random().toString(36).slice(2, 7)}`

async function publishedSite(opts: { plan?: boolean; name?: string } = {}) {
  const s = await readySite({ plan: true, name: opts.name })
  const sl = slug()
  const { POST } = await import('@/app/api/sites/[siteId]/publish/route')
  const res = await POST(api('POST', `/api/sites/${s.siteId}/publish`, { slug: sl }), ctx({ siteId: s.siteId }))
  if (res.status !== 200) throw new Error(`publish ${res.status}: ${await res.text()}`)
  if (opts.plan === false) (await (await import('./browser')).p3State()).tenantPlan.set(s.tenantId, false)
  return { ...s, host: `${sl}.yakini.digital` }
}

async function stamp(agoMs = 5000) {
  const { signFormTime } = await import('@/lib/server/request')
  return signFormTime(Date.now() - agoMs, (await rt()).ipPepper)
}

async function report(siteId: string, fields: Record<string, string>, ip = freshIp()) {
  const { POST } = await import('@/app/api/report/route')
  return POST(new Request(`${STUDIO}/api/report`, {
    method: 'POST', body: new URLSearchParams({ site: siteId, ts: await stamp(), details: 'Looks fake', ...fields }),
    headers: { origin: STUDIO, 'content-type': 'application/x-www-form-urlencoded', 'x-forwarded-for': ip },
  }))
}

function opsForm(path: string, fields: Record<string, string> = {}) {
  return new Request(`${STUDIO}${path}`, { method: 'POST', body: new URLSearchParams(fields), headers: { origin: STUDIO, 'content-type': 'application/x-www-form-urlencoded' } })
}

describe('share links (14.8 #3)', () => {
  it('owners make a link shown once; it previews the site, can be revoked, and expires', async () => {
    const s = await readySite()
    const { POST } = await import('@/app/api/sites/[siteId]/share-links/route')
    const res = await POST(api('POST', `/api/sites/${s.siteId}/share-links`, { days: 3 }), ctx({ siteId: s.siteId }))
    expect(res.status).toBe(201)
    const body = await res.json() as { id: string; url: string }
    const token = new URL(body.url).searchParams.get('s')!
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    const p3 = await (await import('./browser')).p3State() as unknown as { shares: { tokenHash: string }[] }
    expect(p3.shares.every((l) => l.tokenHash !== token)).toBe(true) // only the hash is stored

    const { previewAccess } = await import('@/lib/server/share')
    jar.clear() // a stranger with the link
    expect(await previewAccess(await rt(), s.siteId, token, null)).toMatchObject({ via: 'share' })
    expect(await previewAccess(await rt(), s.siteId, 'x'.repeat(43), null)).toBeNull()
    expect(await previewAccess(await rt(), s.siteId, null, null)).toBeNull()
  })

  it('a revoked or expired link stops working', async () => {
    const s = await readySite()
    const { POST } = await import('@/app/api/sites/[siteId]/share-links/route')
    const made = await (await POST(api('POST', `/api/sites/${s.siteId}/share-links`, {}), ctx({ siteId: s.siteId }))).json() as { id: string; url: string }
    const token = new URL(made.url).searchParams.get('s')!
    const { DELETE } = await import('@/app/api/sites/[siteId]/share-links/[linkId]/route')
    expect((await DELETE(api('DELETE', `/api/sites/${s.siteId}/share-links/${made.id}`), ctx({ siteId: s.siteId, linkId: made.id }))).status).toBe(200)
    const { previewAccess } = await import('@/lib/server/share')
    expect(await previewAccess(await rt(), s.siteId, token, null)).toBeNull()

    const again = await (await POST(api('POST', `/api/sites/${s.siteId}/share-links`, {}), ctx({ siteId: s.siteId }))).json() as { id: string; url: string }
    const p3 = await (await import('./browser')).p3State() as unknown as { shares: { id: string; expiresAt: Date }[] }
    p3.shares.find((l) => l.id === again.id)!.expiresAt = new Date(Date.now() - 1000)
    expect(await previewAccess(await rt(), s.siteId, new URL(again.url).searchParams.get('s'), null)).toBeNull()
  })

  it('anonymous drafts can’t make share links', async () => {
    const d = await makeDraft()
    const { POST } = await import('@/app/api/sites/[siteId]/share-links/route')
    expect((await POST(api('POST', `/api/sites/${d.siteId}/share-links`, {}), ctx({ siteId: d.siteId }))).status).toBe(404)
  })

  it('the impersonation fixture: share link refused with “a quick look first”, and a review opens', async () => {
    const s = await readySite({ name: 'Secure Bank' })
    const store = (await rt()).store
    const site = (await store.getEditorSite(s.siteId))!
    const doc = loadSiteDoc(site.doc).doc
    doc.business.tagline = 'Verify your account to keep your card active'
    await store.saveDraft({ siteId: s.siteId, baseRev: site.rev, doc })
    const { POST } = await import('@/app/api/sites/[siteId]/share-links/route')
    const res = await POST(api('POST', `/api/sites/${s.siteId}/share-links`, {}), ctx({ siteId: s.siteId }))
    expect(res.status).toBe(409)
    expect((await res.json() as { error: string }).error).toBe('We need to take a quick look first. We’ll be in touch.')
    const review = (await store.listReviews('pending')).find((r) => r.siteId === s.siteId)!
    expect(review.flags.map((f) => f.rule)).toEqual(expect.arrayContaining(['verification_phrase', 'share_link']))
  })
})

describe('reports and auto-hold (Flow I, Q12)', () => {
  it('a JS-off report is stored, operators are alerted, the reporter gets a reference and nobody else gets email', async () => {
    const s = await publishedSite()
    const { testOutbox } = await import('@/lib/server/mail')
    const before = testOutbox().length
    const res = await report(s.siteId, { reason: 'copyright', email: 'reporter@example.test', owner: 'yes' })
    expect(res.status).toBe(303)
    expect(where(res)).toMatch(/^\/report\?done=[A-Z0-9]{8}$/)
    const reports = await (await rt()).store.listReports('open')
    expect(reports.find((r) => r.siteId === s.siteId)).toMatchObject({ reason: 'copyright', reporterEmail: 'reporter@example.test', reporterSaysOwner: true })
    const mail = testOutbox().slice(before)
    expect(mail).toHaveLength(1)
    expect(mail[0]).toMatchObject({ tag: 'report-alert', to: ['ops@yakini.example'] })
    expect(mail.flatMap((m) => m.to)).not.toContain('reporter@example.test')
  })

  it('3 reports from different visitors hold an unpaid site; the same on a paid site does not; one visitor can’t flood', async () => {
    const unpaid = await publishedSite({ plan: false })
    for (const ip of ['198.18.0.1', '198.18.0.2']) await report(unpaid.siteId, { reason: 'impersonation' }, ip)
    expect((await (await rt()).store.siteForHost(unpaid.host))!.state).toBe('live')
    await report(unpaid.siteId, { reason: 'impersonation' }, '198.18.0.3')
    expect((await (await rt()).store.siteForHost(unpaid.host))!.state).toBe('taken_down')

    const paid = await publishedSite({ plan: true })
    for (const ip of ['198.18.1.1', '198.18.1.2', '198.18.1.3', '198.18.1.4']) await report(paid.siteId, { reason: 'phishing' }, ip)
    expect((await (await rt()).store.siteForHost(paid.host))!.state).toBe('live')

    const flood = await publishedSite({ plan: true })
    const codes = [] as string[]
    for (let i = 0; i < 6; i++) codes.push(where(await report(flood.siteId, { reason: 'other' }, '198.18.2.1')))
    expect(codes.slice(0, 3).every((c) => c.includes('done='))).toBe(true)
    expect(codes.slice(3).every((c) => c.includes('error=slow'))).toBe(true)
  })

  it('bots (honeypot, too fast) look sent but nothing is stored; bad input goes back with a fixed message', async () => {
    const s = await publishedSite()
    expect(where(await report(s.siteId, { reason: 'other', company_website: 'x' }))).toMatch(/done=/)
    const store = (await rt()).store
    expect((await store.listReports('all')).filter((r) => r.siteId === s.siteId)).toHaveLength(0)
    expect(where(await report(s.siteId, { reason: 'nope' }))).toContain('error=missing')
  })
})

describe('takedown, restore and the review queue (14.8)', () => {
  it('takedown: neutral page on every host, share links and forms stop, publish refused; restore brings back the same version; both audited', async () => {
    const s = await publishedSite()
    const { POST: share } = await import('@/app/api/sites/[siteId]/share-links/route')
    const link = await (await share(api('POST', `/api/sites/${s.siteId}/share-links`, {}), ctx({ siteId: s.siteId }))).json() as { url: string }
    const store = (await rt()).store
    const before = (await store.siteForHost(s.host))!.versionId

    await signInOperator({ canTakedown: false })
    const { POST: takedown } = await import('@/app/api/ops/sites/[siteId]/takedown/route')
    expect(where(await takedown(opsForm(`/api/ops/sites/${s.siteId}/takedown`, { reason: 'phishing' }), ctx({ siteId: s.siteId })))).toContain('not_allowed')
    await signInOperator({ canTakedown: true })
    expect(where(await takedown(opsForm(`/api/ops/sites/${s.siteId}/takedown`, { reason: 'phishing', note: 'test' }), ctx({ siteId: s.siteId })))).toContain('taken_down')

    expect((await store.siteForHost(s.host))).toMatchObject({ state: 'taken_down', doc: null })
    const { previewAccess } = await import('@/lib/server/share')
    expect(await previewAccess(await rt(), s.siteId, new URL(link.url).searchParams.get('s'), null)).toBeNull()
    const pub = await store.publish({ siteId: s.siteId, doc: {}, sha: 'x'.repeat(64), userId: null, slug: 'x-y-z', hostname: 'x-y-z.yakini.digital', domainStatus: 'active', forms: [], actorKind: 'owner', overrideReason: null }).catch((e: Error) => e.message)
    expect(pub).toBe('taken_down')

    const { POST: lift } = await import('@/app/api/ops/sites/[siteId]/takedown/lift/route')
    expect(where(await lift(opsForm(`/api/ops/sites/${s.siteId}/takedown/lift`), ctx({ siteId: s.siteId })))).toContain('restored')
    expect(await store.siteForHost(s.host)).toMatchObject({ state: 'live', versionId: before })
    const audit = ((await (await import('./browser')).p3State()) as unknown as { audit: { targetId: string; action: string }[] }).audit
    expect(audit.filter((a) => a.targetId === s.siteId).map((a) => a.action)).toEqual(expect.arrayContaining(['takedown', 'takedown.lift']))
  })

  it('an operator-override first publish waits in the queue; Approve → live; Reject → stays on preview', async () => {
    const store = (await rt()).store
    for (const decision of ['approve', 'reject'] as const) {
      const s = await readySite({ plan: false })
      await signInOperator({ canOverridePublish: true })
      const sl = slug()
      const { POST } = await import('@/app/api/sites/[siteId]/publish/route')
      const r = await POST(api('POST', `/api/sites/${s.siteId}/publish`, { slug: sl, overrideReason: 'Paid in person' }), ctx({ siteId: s.siteId }))
      expect(await r.json()).toEqual({ status: 'in_review' })
      expect(await store.siteForHost(`${sl}.yakini.digital`)).toBeNull()
      const review = (await store.listReviews('pending')).find((x) => x.siteId === s.siteId)!
      expect(review.trigger).toBe('override')
      const { POST: decide } = await import('@/app/api/ops/reviews/[id]/route')
      const res = await decide(opsForm(`/api/ops/reviews/${review.id}`, { decision }), ctx({ id: review.id }))
      if (decision === 'approve') {
        expect(where(res)).toContain('approved')
        expect((await store.siteForHost(`${sl}.yakini.digital`))!.state).toBe('live')
      } else {
        expect(where(res)).toContain('rejected')
        expect(await store.siteForHost(`${sl}.yakini.digital`)).toBeNull()
        expect((await store.publishInfo(s.siteId))!.reviewStatus).toBe('rejected')
      }
    }
  })

  it('operator pages and routes are for operators only', async () => {
    await signIn('owner-not-operator@example.test')
    const { POST: decide } = await import('@/app/api/ops/reviews/[id]/route')
    expect((await decide(opsForm('/api/ops/reviews/00000000-0000-4000-8000-000000000000', { decision: 'approve' }), ctx({ id: '00000000-0000-4000-8000-000000000000' }))).status).toBe(404)
    const { GET } = await import('@/app/api/ops/reports/route')
    expect((await GET(api('GET', '/api/ops/reports'))).status).toBe(404)
  })

  it('Check stored sites opens every stored version read-only and reports failures', async () => {
    await readySite()
    const store = (await rt()).store as unknown as { _state: { versions: { id: string; siteId: string; number: number; kind: string; doc: unknown; note: null; createdAt: Date }[] } }
    store._state.versions.push({ id: 'ffffffff-ffff-4fff-bfff-ffffffffffff', siteId: 'x', number: 1, kind: 'checkpoint', doc: { schemaVersion: 99 }, note: null, createdAt: new Date() })
    await signInOperator()
    const { POST } = await import('@/app/api/ops/schema-check/route')
    const res = await POST(new Request(`${STUDIO}/api/ops/schema-check`, { method: 'POST', headers: { origin: STUDIO, accept: 'application/json' } }))
    const body = await res.json() as { checked: number; failed: number; failures: { versionId: string; code: string }[] }
    expect(body.checked).toBeGreaterThan(1)
    expect(body.failures).toEqual([expect.objectContaining({ versionId: 'ffffffff-ffff-4fff-bfff-ffffffffffff', code: 'too_new' })])
  })
})
