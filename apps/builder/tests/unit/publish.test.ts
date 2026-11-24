import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadSiteDoc } from '@yakini/site-schema'
import { kitDefinition } from '@yakini/kits'
import { docChecks, brokenInternalLinks, visibleText } from '@/lib/publish/checks'
import { formsOf, BOOKING_FORM_KEY } from '@/lib/publish/forms'
import { slugError, suggestSlug } from '@/lib/publish/slug'
import { needsReview } from '@/lib/server/publish'
import { api, filledDoc, jar, kitDoc, p3State, readySite, signIn, signInOperator } from './browser'

vi.mock('next/headers', async () => (await import('./browser')).headersMock)
vi.mock('next/cache', () => ({ revalidateTag: () => {}, unstable_cache: (fn: () => unknown) => fn }))

beforeAll(() => { vi.stubEnv('OPERATOR_EMAIL', 'ops@yakini.example'); vi.stubEnv('BUILDER_TEST_MODE', '1'); vi.stubEnv('VERCEL', ''); vi.stubEnv('VERCEL_ENV', '') })
afterAll(() => vi.unstubAllEnvs())
beforeEach(() => jar.clear())

const ctx = (siteId: string) => ({ params: Promise.resolve({ siteId }) })
const rt = async () => (await import('@/lib/server/runtime')).getRuntime()
let n = 0
const slug = () => `mesa-tacos-${++n}-${Math.random().toString(36).slice(2, 7)}`

async function publish(siteId: string, body: Record<string, unknown>) {
  const { POST } = await import('@/app/api/sites/[siteId]/publish/route')
  const res = await POST(api('POST', `/api/sites/${siteId}/publish`, body), ctx(siteId))
  return { status: res.status, body: await res.json() as Record<string, unknown> }
}
async function live(host: string) { return (await rt()).store.siteForHost(host) }

describe('pre-publish checklist (11.1)', () => {
  const allowed = new Set((kitDefinition('food-truck')!.sampleImages ?? []).map((i) => i.assetId))
  it('a filled-in kit draft passes every blocking item', () => {
    const items = docChecks(filledDoc(), { allowedAssetIds: allowed })
    expect(items.filter((i) => i.blocking && !i.ok)).toEqual([])
  })
  it('blocks leftover “fill this in” spots, broken internal links, banned wording, foreign photos and too many pages', () => {
    const doc = kitDoc()
    expect(docChecks(doc, { allowedAssetIds: allowed }).find((i) => i.id === 'no_placeholders')!.ok).toBe(false)

    const broken = filledDoc()
    broken.nav.items.push({ label: 'Gone', pageId: 'no-such-page' })
    expect(brokenInternalLinks(broken)).toContain('menu link Gone')
    expect(docChecks(broken, { allowedAssetIds: allowed }).find((i) => i.id === 'links_ok')!.ok).toBe(false)

    const worded = filledDoc()
    worded.business.tagline = 'Our AI-built taco site, powered by magic'
    const lint = docChecks(worded, { allowedAssetIds: allowed }).find((i) => i.id === 'copy_lint')!
    expect(lint.ok).toBe(false)
    expect(lint.detail).toContain('AI-built')

    const photo = filledDoc()
    photo.brand.logo = { assetId: '00000000-0000-4000-8000-000000000001', alt: 'Logo' }
    expect(docChecks(photo, { allowedAssetIds: allowed }).find((i) => i.id === 'images_ok')!.ok).toBe(false)

    const big = filledDoc()
    expect(docChecks(big, { allowedAssetIds: allowed, maxPages: 2 }).find((i) => i.id === 'doc_size')!.ok).toBe(false)
  })
  it('warns (doesn’t block) when a button points at a section with nothing in it yet', () => {
    const doc = filledDoc()
    const schedule = doc.pages[0].sections.find((x) => x.type === 'schedule')
    if (!schedule) return
    ;(schedule.props as { stops: unknown[] }).stops = []
    const hero = doc.pages[0].sections.find((x) => x.type === 'hero')!
    ;(hero.props as { primaryCta: unknown }).primaryCta = { label: 'Find us', target: { kind: 'section', pageId: doc.pages[0].id, sectionId: schedule.id } }
    const w = docChecks(doc, { allowedAssetIds: allowed }).find((i) => i.id === 'empty_targets')!
    expect(w).toMatchObject({ ok: false, blocking: false })
    expect(w.detail).toContain('schedule')
  })
  it('a business’s own menu prices are fine (R9 is about Yakini’s price line)', () => {
    const doc = filledDoc()
    doc.business.tagline = 'Three tacos for $9'
    expect(docChecks(doc, { allowedAssetIds: allowed }).find((i) => i.id === 'copy_lint')!.ok).toBe(true)
  })
  it('visible text skips ids, keys and links', () => {
    const text = visibleText(filledDoc()).join(' ')
    expect(text).toContain('Mesa Street Tacos')
    expect(text).not.toContain('"pageId"')
  })
  it('every form section becomes a form; booking posts a booking request', () => {
    const doc = filledDoc()
    const forms = formsOf(doc)
    expect(forms.length).toBeGreaterThan(0)
    for (const f of forms) expect(['contact', 'catering', 'booking_request']).toContain(f.kind)
    if (doc.pages.some((p) => p.sections.some((s) => s.type === 'booking' && !s.hidden))) expect(forms.map((f) => f.formKey)).toContain(BOOKING_FORM_KEY)
  })
})

describe('addresses (13.2, 13.3)', () => {
  it('suggests a clean address from the business name', () => {
    expect(suggestSlug('Mamá’s Kitchen & Bar!')).toBe('mama-s-kitchen-and-bar')
    expect(suggestSlug('Al')).toBe('al-site')
  })
  it('rejects reserved, brand and badly shaped addresses', () => {
    for (const s of ['www', 'portal', 'studio', 'ops', 'admin', 'composer', 'mission', 'sign', 'send', 'draft-abc123', 'paypal', 'wells-fargo']) expect(slugError(s, undefined, false)).toMatch(/reserved/)
    expect(slugError('extra-one', 'extra-one,extra-two', false)).toMatch(/reserved/)
    for (const s of ['ab', '-abc', 'abc-', 'a--b', 'Has Caps', 'x'.repeat(41)]) expect(slugError(s, undefined, false)).not.toBeNull()
    expect(slugError('mesa-street-tacos', undefined, true)).toMatch(/taken/)
    expect(slugError('apple-valley-bakery', undefined, false)).toBeNull() // only flagged for review, not refused
  })
  it('the slug check route answers members only, and reports reserved and taken addresses', async () => {
    const a = await readySite()
    const first = slug()
    expect((await publish(a.siteId, { slug: first })).status).toBe(200)
    const b = await readySite()
    const { GET } = await import('@/app/api/slugs/check/route')
    const ask = async (s: string, site = b.siteId) => (await GET(api('GET', `/api/slugs/check?slug=${s}&site=${site}`))).json() as Promise<Record<string, unknown>>
    expect(await ask('portal')).toMatchObject({ ok: false, message: expect.stringMatching(/reserved/) })
    expect(await ask(first)).toMatchObject({ ok: false, message: expect.stringMatching(/taken/) })
    expect(await ask('fresh-new-place')).toMatchObject({ ok: true, hostname: 'fresh-new-place.yakini.digital' })
    jar.clear()
    expect((await GET(api('GET', `/api/slugs/check?slug=fresh&site=${b.siteId}`))).status).toBe(404)
  })
})

describe('review gate rules (14.8 #6, Q10)', () => {
  it('matches the spec table', () => {
    // [mode, firstLive, override, flagged] → trigger
    expect(needsReview('override_or_flagged', true, false, false)).toBeNull()
    expect(needsReview('override_or_flagged', true, true, false)).toBe('override')
    expect(needsReview('override_or_flagged', true, false, true)).toBe('risk_check')
    expect(needsReview('override_or_flagged', false, true, false)).toBeNull()
    expect(needsReview('override_or_flagged', false, false, true)).toBe('risk_check')
    expect(needsReview('all_first_publishes', true, false, false)).toBe('risk_check')
    expect(needsReview('all_first_publishes', false, false, false)).toBeNull()
    expect(needsReview('flagged_only', true, true, false)).toBeNull()
    expect(needsReview('flagged_only', true, false, true)).toBe('risk_check')
  })
})

describe('publish, rollback, unpublish (5.6, 11.2)', () => {
  it('a paying owner publishes: the subdomain serves the published version; draft edits stay off the live site until republish', async () => {
    const s = await readySite()
    const sl = slug()
    const r = await publish(s.siteId, { slug: sl })
    expect(r.status).toBe(200)
    expect(r.body).toMatchObject({ status: 'live', url: `https://${sl}.yakini.digital`, address: 'active' })
    const host = await live(`${sl}.yakini.digital`)
    expect(host?.state).toBe('live')
    expect(loadSiteDoc(host!.doc).doc.business.name).toBe('Mesa Street Tacos')

    // Edit the draft: the live site doesn't change.
    const store = (await rt()).store
    const site = (await store.getEditorSite(s.siteId))!
    const edited = { ...loadSiteDoc(site.doc).doc, business: { ...loadSiteDoc(site.doc).doc.business, tagline: 'Draft only' } }
    await store.saveDraft({ siteId: s.siteId, baseRev: site.rev, doc: edited })
    expect(loadSiteDoc((await live(`${sl}.yakini.digital`))!.doc).doc.business.tagline).not.toBe('Draft only')

    // Republish: it does.
    const r2 = await publish(s.siteId, { slug: sl })
    expect(r2.body).toMatchObject({ status: 'live' })
    expect(loadSiteDoc((await live(`${sl}.yakini.digital`))!.doc).doc.business.tagline).toBe('Draft only')

    // Roll back to the first published version.
    const versions = await store.publishedVersions(s.siteId)
    const oldest = versions.at(-1)!
    const { POST: rollback } = await import('@/app/api/sites/[siteId]/rollback/route')
    const rb = await rollback(api('POST', `/api/sites/${s.siteId}/rollback`, { versionId: oldest.id }), ctx(s.siteId))
    expect(rb.status).toBe(200)
    expect(loadSiteDoc((await live(`${sl}.yakini.digital`))!.doc).doc.business.tagline).not.toBe('Draft only')

    // Forms got their rows; publish and rollback are audited.
    const p3 = await p3State() as unknown as { forms: { siteId: string }[]; audit: { targetId: string; action: string }[] }
    expect(p3.forms.some((f) => f.siteId === s.siteId)).toBe(true)
    expect(p3.audit.filter((a) => a.targetId === s.siteId).map((a) => a.action)).toEqual(expect.arrayContaining(['publish', 'rollback']))

    // Unpublish: the address answers "being updated" with no doc.
    const { POST: unpublish } = await import('@/app/api/sites/[siteId]/unpublish/route')
    expect((await unpublish(api('POST', `/api/sites/${s.siteId}/unpublish`), ctx(s.siteId))).status).toBe(200)
    expect(await live(`${sl}.yakini.digital`)).toMatchObject({ state: 'unpublished', doc: null })
  })

  it('without a plan, an owner can’t go live (402); the checklist blocks an unfinished draft (422)', async () => {
    const s = await readySite({ plan: false })
    const r = await publish(s.siteId, { slug: slug() })
    expect(r.status).toBe(402)
    expect(r.body.error).toBe('Choose a plan to go live. Your preview still works.')

    const t = await readySite()
    const store = (await rt()).store
    const site = (await store.getEditorSite(t.siteId))!
    await store.saveDraft({ siteId: t.siteId, baseRev: site.rev, doc: kitDoc() })
    const blocked = await publish(t.siteId, { slug: slug() })
    expect(blocked.status).toBe(422)
    expect((blocked.body.items as { id: string; ok: boolean }[]).find((i) => i.id === 'no_placeholders')!.ok).toBe(false)
  })

  it('reserved and taken addresses are refused at publish', async () => {
    const a = await readySite()
    const sl = slug()
    await publish(a.siteId, { slug: sl })
    const b = await readySite()
    expect((await publish(b.siteId, { slug: sl })).body.error).toMatch(/taken/)
    expect((await publish(b.siteId, { slug: 'portal' })).body.error).toMatch(/reserved/)
  })

  it('editors and strangers can’t publish; operators need the override flag and a reason', async () => {
    const s = await readySite({ plan: false })
    jar.clear()
    await signIn('stranger@nowhere.example')
    expect((await publish(s.siteId, { slug: slug() })).status).toBe(404)

    await signInOperator({ canOverridePublish: false })
    expect((await publish(s.siteId, { slug: slug(), overrideReason: 'Paid by check' })).status).toBe(402)
    await signInOperator({ canOverridePublish: true })
    expect((await publish(s.siteId, { slug: slug() })).status).toBe(402) // no reason
    const r = await publish(s.siteId, { slug: slug(), overrideReason: 'Paid by check' })
    expect(r.body).toEqual({ status: 'in_review' }) // first live publish by override waits for review
  })

  it('a flagged site goes to review instead of live, and operators get an internal alert', async () => {
    const s = await readySite({ name: 'Secure Bank Verify Center' })
    const store = (await rt()).store
    const site = (await store.getEditorSite(s.siteId))!
    const doc = loadSiteDoc(site.doc).doc
    doc.business.tagline = 'Verify your account to keep ordering'
    await store.saveDraft({ siteId: s.siteId, baseRev: site.rev, doc })
    const sl = slug()
    const r = await publish(s.siteId, { slug: sl })
    expect(r.body).toEqual({ status: 'in_review' })
    expect(await live(`${sl}.yakini.digital`)).toBeNull()
    const review = (await store.listReviews('pending')).find((x) => x.siteId === s.siteId)!
    expect(review.flags.map((f) => f.rule)).toEqual(expect.arrayContaining(['verification_phrase', 'address']))
    const { testOutbox } = await import('@/lib/server/mail')
    const alert = testOutbox().find((m) => m.tag === 'review-alert' && m.text.includes(sl))!
    expect(alert.to).toEqual(['ops@yakini.example'])
  })
})
