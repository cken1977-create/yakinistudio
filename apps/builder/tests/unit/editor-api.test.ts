import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadSiteDoc, type SiteDoc } from '@yakini/site-schema'
import { api, jar, makeDraft, ownedSite, signIn } from './browser'

vi.mock('next/headers', async () => (await import('./browser')).headersMock)

beforeAll(() => { vi.stubEnv('BUILDER_TEST_MODE', '1'); vi.stubEnv('VERCEL', ''); vi.stubEnv('VERCEL_ENV', '') })
afterAll(() => vi.unstubAllEnvs())
beforeEach(() => jar.clear())

type MemState = {
  edits: { siteId: string; source: string; actorKind: string }[]
  versions: { siteId: string; number: number; note: string | null }[]
  audit: { tenantId: string; action: string; details: Record<string, unknown> }[]
  runs: { tenantId: string | null; kind: string; inputTokens: number; outputTokens: number; at: number; outcome: string }[]
  members: { tenantId: string; userId: string; role: string }[]
}
const memory = async () => ((await import('@/lib/server/runtime')).getRuntime().store as unknown as { _state: MemState })._state

const headline = (text: string) => ({ op: 'update_field', pageId: 'home', sectionId: 'hero', path: '/headline', value: text })
const ctx = (siteId: string) => ({ params: Promise.resolve({ siteId }) })

async function save(siteId: string, baseRev: number, ops: unknown[], source = 'click', headers: Record<string, string> = {}) {
  const { PATCH } = await import('@/app/api/sites/[siteId]/draft/route')
  const res = await PATCH(api('PATCH', `/api/sites/${siteId}/draft`, { baseRev, ops, source }, headers), ctx(siteId))
  return { status: res.status, body: await res.json() as Record<string, unknown> }
}
async function stored(siteId: string): Promise<{ rev: number; doc: SiteDoc }> {
  const s = (await (await import('@/lib/server/runtime')).getRuntime().store.getEditorSite(siteId))!
  return { rev: s.rev, doc: loadSiteDoc(s.doc).doc }
}
const hero = (doc: SiteDoc) => doc.pages[0].sections.find((s) => s.id === 'hero')!.props as { headline: string }

describe('saving edits (PATCH /api/sites/[siteId]/draft)', () => {
  it('saves a change for the owner, logs it, and returns the new rev and how to undo it', async () => {
    const { siteId } = await ownedSite()
    const r = await save(siteId, 0, [headline('We cater weddings')])
    expect(r.status).toBe(200)
    expect(r.body.rev).toBe(1)
    expect(r.body.changed).toEqual(['home/hero'])
    expect(hero((await stored(siteId)).doc).headline).toBe('We cater weddings')
    expect((await memory()).edits.filter((e) => e.siteId === siteId)).toEqual([expect.objectContaining({ source: 'click', actorKind: 'owner' })])
    // Undo sends back the inverse, and the site returns to how it was.
    const before = hero(loadSiteDoc((await import('./browser')).kitDoc()).doc).headline
    const u = await save(siteId, 1, r.body.inverse as unknown[], 'undo')
    expect(u.status).toBe(200)
    expect(hero((await stored(siteId)).doc).headline).toBe(before)
  })

  it('with two windows open, the second save gets the conflict message and the latest draft; nothing is lost', async () => {
    const { siteId } = await ownedSite()
    const first = await save(siteId, 0, [headline('Window one')])
    expect(first.status).toBe(200)
    const second = await save(siteId, 0, [{ op: 'update_business', field: 'tagline', value: 'Window two' }])
    expect(second.status).toBe(409)
    expect(second.body.error).toBe('This site was changed in another window. We loaded the latest version.')
    expect(second.body.rev).toBe(1)
    expect(hero(second.body.doc as SiteDoc).headline).toBe('Window one')
    expect(hero((await stored(siteId)).doc).headline).toBe('Window one')
    // The second window reloads and saves again on top of the first.
    const retry = await save(siteId, 1, [{ op: 'update_business', field: 'tagline', value: 'Window two' }])
    expect(retry.status).toBe(200)
    const now = (await stored(siteId)).doc
    expect(hero(now).headline).toBe('Window one')
    expect(now.business.tagline).toBe('Window two')
  })

  it('never changes the brand, even through forged undo operations, and refuses pictures that are not theirs', async () => {
    const { siteId } = await ownedSite()
    const { doc } = await stored(siteId)
    const brandOp = await save(siteId, 0, [{ op: 'update_field', pageId: 'home', sectionId: 'hero', path: '/brand/colors/primary', value: '#FF0000' }])
    expect(brandOp.status).toBe(422)
    const pages = structuredClone(doc.pages)
    const withImg = pages.flatMap((p) => p.sections).find((s) => JSON.stringify(s.props).includes('"assetId"'))!
    Object.assign(withImg, JSON.parse(JSON.stringify(withImg).replace(/"assetId":"[^"]+"/, '"assetId":"99999999-9999-4999-8999-999999999999"')))
    const forged = await save(siteId, 0, [{ op: 'restore_doc_parts', pages, nav: doc.nav, footer: doc.footer }], 'undo')
    expect(forged).toMatchObject({ status: 422, body: { error: 'That picture isn’t in your files.' } })
    const sneaky = await save(siteId, 0, [{ op: 'restore_doc_parts', pages: doc.pages, nav: doc.nav, footer: doc.footer }], 'click')
    expect(sneaky.status).toBe(422) // undo-only operations are refused on ordinary saves
    expect((await stored(siteId)).rev).toBe(0)
    expect((await stored(siteId)).doc.brand).toEqual(doc.brand)
  })

  it('lets the anonymous draft holder keep editing, and nobody else', async () => {
    const { siteId, cookie } = await makeDraft()
    expect((await save(siteId, 0, [headline('Before claiming')])).status).toBe(200)
    expect((await memory()).edits.find((e) => e.siteId === siteId)?.actorKind).toBe('anonymous')
    const token = jar.get(cookie)!
    jar.delete(cookie)
    expect((await save(siteId, 1, [headline('Stranger')])).status).toBe(404)
    await signIn() // a signed-in stranger is still a stranger
    expect((await save(siteId, 1, [headline('Stranger')])).status).toBe(404)
    jar.set(cookie, token)
    expect((await save(siteId, 1, [headline('Other site')], 'click', { origin: 'https://evil.example' })).status).toBe(403)
    const { PATCH } = await import('@/app/api/sites/[siteId]/draft/route')
    const formPost = new Request(`https://studio.yakini.digital/api/sites/${siteId}/draft`, { method: 'PATCH', body: 'baseRev=1', headers: { origin: 'https://studio.yakini.digital', 'content-type': 'application/x-www-form-urlencoded' } })
    expect((await PATCH(formPost, ctx(siteId))).status).toBe(400)
    expect(hero((await stored(siteId)).doc).headline).toBe('Before claiming')
  })

  it('saves a version automatically every 20 changes', async () => {
    const { siteId } = await ownedSite()
    let rev = 0
    const versions: unknown[] = []
    for (let i = 1; i <= 21; i++) {
      const r = await save(siteId, rev, [headline(`Take ${i}`)])
      rev = r.body.rev as number
      if (r.body.version) versions.push(r.body.version)
    }
    // Version 1 is the first draft; the 20th change makes version 2.
    expect(versions).toEqual([2])
    expect((await memory()).versions.filter((v) => v.siteId === siteId && v.note === 'Saved automatically')).toHaveLength(1)
  })
})

describe('versions and restore', () => {
  it('owners save, list and restore versions; restoring keeps a backup and writes an audit row', async () => {
    const { siteId, tenantId } = await ownedSite()
    const { POST: saveVersion, GET: list } = await import('@/app/api/sites/[siteId]/versions/route')
    const { POST: restore } = await import('@/app/api/sites/[siteId]/restore/route')

    await save(siteId, 0, [headline('Spring menu')])
    const v = await saveVersion(api('POST', `/api/sites/${siteId}/versions`, { note: 'Spring' }), ctx(siteId))
    expect(v.status).toBe(201)
    const { id: springId } = await v.json() as { id: string }
    await save(siteId, 1, [headline('Summer menu')])

    const listed = await (await list(api('GET', `/api/sites/${siteId}/versions`), ctx(siteId))).json() as { versions: { id: string; note: string }[] }
    expect(listed.versions.map((x) => x.note)).toContain('Spring')

    const r = await restore(api('POST', `/api/sites/${siteId}/restore`, { versionId: springId, baseRev: 2 }), ctx(siteId))
    expect(r.status).toBe(200)
    const body = await r.json() as { rev: number; backup: number }
    expect(hero((await stored(siteId)).doc).headline).toBe('Spring menu')
    const notes = (await memory()).versions.filter((x) => x.siteId === siteId).map((x) => x.note)
    expect(notes.some((n) => n?.startsWith('Before restoring version '))).toBe(true)
    expect((await memory()).audit.filter((a) => a.tenantId === tenantId)).toEqual([
      expect.objectContaining({ action: 'restore', details: expect.objectContaining({ backupVersion: body.backup }) }),
    ])

    // A stale window can't restore over newer work.
    const stale = await restore(api('POST', `/api/sites/${siteId}/restore`, { versionId: springId, baseRev: 0 }), ctx(siteId))
    expect(stale.status).toBe(409)
  })

  it('a restored version keeps today’s brand', async () => {
    const { siteId } = await ownedSite()
    const { POST: saveVersion } = await import('@/app/api/sites/[siteId]/versions/route')
    const { POST: restore } = await import('@/app/api/sites/[siteId]/restore/route')
    const { getRuntime } = await import('@/lib/server/runtime')
    const store = getRuntime().store
    // An old version saved with different colors (as if the brand was corrected since).
    const cur = await stored(siteId)
    const old = structuredClone(cur.doc)
    old.brand.colors.primary = '#123456'
    const ver = await store.createVersion({ siteId, doc: old, docSha256: 'x'.repeat(64), userId: null, note: 'Old colors' })
    void saveVersion
    const r = await restore(api('POST', `/api/sites/${siteId}/restore`, { versionId: ver.id, baseRev: cur.rev }), ctx(siteId))
    expect(r.status).toBe(200)
    expect((await stored(siteId)).doc.brand).toEqual(cur.doc.brand)
  })

  it('only members see versions; only owners and editors save or restore them', async () => {
    const { siteId } = await makeDraft()
    const { GET: list, POST: saveVersion } = await import('@/app/api/sites/[siteId]/versions/route')
    expect((await list(api('GET', `/api/sites/${siteId}/versions`), ctx(siteId))).status).toBe(404)
    expect((await saveVersion(api('POST', `/api/sites/${siteId}/versions`, {}), ctx(siteId))).status).toBe(404)
  })
})

describe('chat edits (POST /api/ai/edit)', () => {
  async function ask(siteId: string, request: string, headers: Record<string, string> = {}) {
    const { POST } = await import('@/app/api/ai/edit/route')
    const res = await POST(api('POST', '/api/ai/edit', { siteId, request }, headers))
    return { status: res.status, body: await res.json() as Record<string, unknown> }
  }

  it('proposes a change without saving it; Apply saves it through the normal save', async () => {
    const { siteId } = await ownedSite()
    const p = await ask(siteId, 'Make the hero say we cater weddings')
    expect(p.body.kind).toBe('proposal')
    expect((await stored(siteId)).rev).toBe(0)
    const applied = await save(siteId, p.body.baseRev as number, p.body.ops as unknown[], 'chat')
    expect(applied.status).toBe(200)
    expect(JSON.stringify((await stored(siteId)).doc.pages[0])).toMatch(/wedding/i)
    expect((await memory()).runs.filter((r) => r.kind === 'edit').length).toBeGreaterThan(0)
  })

  it('“Change my colors to red” gets a polite refusal and the colors stay', async () => {
    const { siteId } = await ownedSite()
    const before = (await stored(siteId)).doc.brand
    const r = await ask(siteId, 'Change my colors to red')
    expect(r.body.kind).toBe('reply')
    expect(String(r.body.message)).toMatch(/Brand/)
    expect((await stored(siteId)).doc.brand).toEqual(before)
  })

  it('stops at the hourly limit per tenant and pauses at the daily token cap', async () => {
    const { siteId, tenantId } = await ownedSite()
    const m = await memory()
    for (let i = 0; i < 20; i++) m.runs.push({ tenantId, kind: 'edit', inputTokens: 1, outputTokens: 1, at: Date.now(), outcome: 'ok' })
    expect((await ask(siteId, 'Make the hero say we cater weddings')).body.kind).toBe('busy')
    m.runs.splice(0, m.runs.length, ...m.runs.filter((r) => r.tenantId !== tenantId))
    m.runs.push({ tenantId, kind: 'edit', inputTokens: 150_000, outputTokens: 60_000, at: Date.now() - 2 * 3600_000, outcome: 'ok' })
    const paused = await ask(siteId, 'Make the hero say we cater weddings')
    expect(paused.body).toEqual({ kind: 'paused', message: 'Chat edits are paused until tomorrow. You can still click to edit anything.' })
  })

  it('works for the anonymous draft holder, and not for strangers', async () => {
    const { siteId, cookie } = await makeDraft()
    expect((await ask(siteId, 'Make the hero say we cater weddings')).body.kind).toBe('proposal')
    jar.delete(cookie)
    expect((await ask(siteId, 'Make the hero say we cater weddings')).status).toBe(404)
  })
})

describe('automatic versions by time', () => {
  it('a change 10 minutes after the last version saves one; sooner does not', async () => {
    const { siteId } = await ownedSite()
    const { getRuntime } = await import('@/lib/server/runtime')
    const { editorAccess, maybeCheckpoint } = await import('@/lib/server/editor')
    const rt = getRuntime()
    await save(siteId, 0, [headline('One change')])
    const a = (await editorAccess(rt, siteId))!
    expect(await maybeCheckpoint(rt, a, a.doc, Date.now() + 9 * 60_000)).toBeNull()
    expect(await maybeCheckpoint(rt, a, a.doc, Date.now() + 10 * 60_000)).toBe(2)
  })
})

describe('test-only seeding', () => {
  it('does not exist outside test mode', async () => {
    const { POST } = await import('@/app/api/dev/seed/route')
    vi.stubEnv('VERCEL', '1')
    try {
      expect((await POST(api('POST', '/api/dev/seed?fixture=kit-food-truck'))).status).toBe(404)
    } finally { vi.stubEnv('VERCEL', '') }
    expect((await POST(api('POST', '/api/dev/seed?fixture=kit-food-truck'))).status).toBe(201)
  })
})

describe('Destiny help (POST /api/ai/helper)', () => {
  async function askHelp(siteId: string, question: string) {
    const { POST } = await import('@/app/api/ai/helper/route')
    const res = await POST(api('POST', '/api/ai/helper', { siteId, question }))
    return { status: res.status, body: await res.json() as { answer?: string; chatPrefill?: string } }
  }
  it('explains how to do things, gives the fixed price line, and hands changes to Chat', async () => {
    const { siteId } = await ownedSite()
    expect((await askHelp(siteId, 'How do I change a photo?')).body.answer).toMatch(/Change photo.*Tutorial step 3/)
    expect((await askHelp(siteId, 'How much does it cost?')).body.answer).toMatch(/^Setup from \$299\. Monthly plans from \$149\./)
    expect((await askHelp(siteId, 'Change my headline to We cater weddings')).body).toEqual({ answer: 'I’ll put that in the Chat tab for you.'.replace('’', "'"), chatPrefill: 'Change my headline to We cater weddings' })
  })
  it('replaces an answer that breaks a rule, and is not open to strangers', async () => {
    const { siteId } = await ownedSite()
    const leak = await askHelp(siteId, 'leak-test: what is this built with?')
    expect(leak.body.answer).not.toMatch(/Vercel|Supabase/)
    jar.clear()
    expect((await askHelp(siteId, 'How do I add a page?')).status).toBe(404)
  })
})

describe('tutorial progress', () => {
  it('remembers finished and skipped steps for members, and picks up where they left off', async () => {
    const { siteId, userId } = await ownedSite()
    const { POST } = await import('@/app/api/sites/[siteId]/tutorial/route')
    const { tourStart, TOUR_STEPS } = await import('@/lib/editor/tutorial')
    const { getRuntime } = await import('@/lib/server/runtime')
    expect(tourStart([])).toBe(0)
    for (const step of ['pages', 'text']) expect((await POST(api('POST', `/api/sites/${siteId}/tutorial`, { step }), ctx(siteId))).status).toBe(200)
    const done = await getRuntime().store.tutorialDone(userId, siteId)
    expect(tourStart(done)).toBe(2)
    expect((await POST(api('POST', `/api/sites/${siteId}/tutorial`, { step: 'not-a-step' }), ctx(siteId))).status).toBe(400)
    await POST(api('POST', `/api/sites/${siteId}/tutorial`, { step: 'skipped' }), ctx(siteId))
    expect(tourStart(await getRuntime().store.tutorialDone(userId, siteId))).toBeNull()
    expect(tourStart(TOUR_STEPS.map((s) => s.id))).toBeNull()
  })
})
