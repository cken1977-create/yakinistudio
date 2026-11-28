import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { loadSiteDoc, type SiteDoc } from '@yakini/site-schema'
import { sampleImageById } from '@yakini/kits'
import { createDraft, type DraftRequest } from '@/lib/pipeline/draft'
import { providersFor, runImagery } from '@/lib/pipeline/imagery-run'
import { imageSlots } from '@/lib/pipeline/slots'
import { mockFetchDeps, mockGenerateChat } from '@/lib/pipeline/test-mode'
import type { Runtime } from '@/lib/server/runtime'
import { createMemoryStore } from '@/lib/server/store'

/**
 * Design D4 end to end on the in-memory store: the imported-photo filter and hero choice, a sparse
 * draft getting a full image set (library first, then generated in test mode), the owner's photos and
 * edits never overwritten, and generation off in production until it is switched on.
 */
vi.mock('next/cache', () => ({ revalidateTag: () => {}, unstable_cache: (fn: () => unknown) => fn }))
const SITES = join(__dirname, '..', '..', '..', '..', 'packages', 'ai', 'evals', 'sites')
const PEPPER = 'unit-test-pepper-0123456789'

function runtime() {
  const store = createMemoryStore()
  const rt: Runtime = { testMode: true, store, fetchDeps: mockFetchDeps(SITES), chat: mockGenerateChat, draftPepper: PEPPER, ipPepper: PEPPER, demoOrigin: 'https://yakini.digital' }
  return { rt, store }
}
async function draft(rt: Runtime, req: DraftRequest) {
  const r = await createDraft(req, rt)
  if (r.kind !== 'created') throw new Error('expected a draft')
  return r.siteId
}
const docOf = async (store: ReturnType<typeof createMemoryStore>, siteId: string) => loadSiteDoc((await store.getDraft(siteId))!.doc).doc
const homeHero = (doc: SiteDoc) => (doc.pages.find((p) => p.slug === '')!.sections.find((s) => s.type === 'hero')!.props as { image?: { assetId: string; alt: string } }).image

describe('imported photos (rise-and-crumb fixture)', () => {
  it('leaves out the screenshot and the blurry photo, keeps the rest with variants, and the best wide photo is the hero', async () => {
    const { rt, store } = runtime()
    const siteId = await draft(rt, { source: 'demo', businessName: '', sourceUrl: 'https://rise-and-crumb.example/', kitId: 'restaurant', features: [] })
    const assets = [...store._state.assets.values()].filter((a) => a.kind === 'image')
    const alts = assets.map((a) => a.alt)
    expect(alts).not.toContain('Our menu page') // screenshot
    expect(alts).not.toContain('The bakery storefront') // blurry
    expect(alts).toEqual(expect.arrayContaining(['The pastry counter', 'Fresh sourdough loaves on the rack', 'A layer cake']))
    const doc = await docOf(store, siteId)
    expect(homeHero(doc)?.alt).toBe('Fresh sourdough loaves on the rack')
    for (const a of assets) {
      expect(a.imagery?.lqip.startsWith('data:image/webp;base64,'), a.alt).toBe(true)
      expect(a.imagery!.variants.some((v) => v.format === 'avif') && a.imagery!.variants.some((v) => v.format === 'webp'), a.alt).toBe(true)
    }
    // The hero photo also has its phone (4:5) crop; the small one is not hero material.
    expect(assets.find((a) => a.alt.startsWith('Fresh sourdough'))!.imagery!.variants.some((v) => v.crop === 'tall')).toBe(true)
  }, 120_000)

  it('generation never replaces the owner\'s own photos', async () => {
    const { rt, store } = runtime()
    const siteId = await draft(rt, { source: 'demo', businessName: '', sourceUrl: 'https://rise-and-crumb.example/', kitId: 'restaurant', features: [] })
    const before = homeHero(await docOf(store, siteId))
    await runImagery(rt, siteId)
    expect(homeHero(await docOf(store, siteId))).toEqual(before)
  }, 180_000)
})

describe('sparse draft: library first, then generated (test mode)', () => {
  it('fills every image place; generated images carry their check score and licence; spend is logged', async () => {
    const { rt, store } = runtime()
    const siteId = await draft(rt, { source: 'prompt', businessName: 'Ember and Oak', kitId: 'restaurant' })
    const first = await docOf(store, siteId)
    // Library first: the draft opens with the kit's photos, so nothing waits.
    expect(sampleImageById(homeHero(first)!.assetId)).toBeTruthy()

    const r = await runImagery(rt, siteId)
    expect(r.status).toBe('done')
    expect(r.placed).toBeGreaterThan(5)
    const doc = await docOf(store, siteId)
    const slots = imageSlots(doc)
    expect(slots.length).toBeGreaterThan(6)
    // No empty image places: every single-photo place has a photo, and every gallery that shows has photos
    // (galleries with none stay hidden, so they are never an empty box on the page).
    expect(slots.filter((s) => s.role !== 'gallery' && !s.current)).toEqual([])
    for (const page of doc.pages) for (const s of page.sections) {
      if (s.type === 'gallery' && !s.hidden && (s.props as { images: unknown[] }).images.length > 0) expect((s.props as { images: unknown[] }).images.length).toBeGreaterThanOrEqual(3)
    }
    const generated = [...store._state.assets.values()].filter((a) => a.source === 'generated')
    expect(generated.length).toBe(r.generated)
    expect(homeHero(doc)!.assetId).toBe(generated.find((g) => homeHero(doc)!.assetId === g.id)!.id)
    for (const g of generated) {
      expect(g.licenseKind).toBe('generated')
      expect(g.imagery!.license).toMatchObject({ provider: 'test', model: 'test-image' })
      expect(g.imagery!.license!.prompt).toMatch(/No identifiable faces/)
      expect(g.imagery!.quality!.score).toBeGreaterThan(0.5)
      expect(g.imagery!.variants.length).toBeGreaterThan(3)
    }
    // The Home gallery is filled and shown.
    const gallery = doc.pages.find((p) => p.slug === '')!.sections.find((s) => s.type === 'gallery')!
    expect(gallery.hidden).toBe(false)
    expect((gallery.props as { images: unknown[] }).images).toHaveLength(6)
    // Every image and check was priced and logged.
    expect(store._state.runs.filter((x) => x.kind === 'image').length).toBe(generated.length)
    expect(store._state.runs.filter((x) => x.kind === 'image_check').length).toBe(generated.length)
  }, 240_000)

  it('an owner edit made while images are being made is kept (that place is skipped)', async () => {
    const { rt, store } = runtime()
    const siteId = await draft(rt, { source: 'prompt', businessName: 'Corner Table', kitId: 'restaurant' })
    // The owner swaps the hero photo for their own before generation finishes.
    const d = (await store.getDraft(siteId))!
    const doc = loadSiteDoc(d.doc).doc
    const own = { assetId: '11111111-2222-4333-8444-555555555555', alt: 'Our own photo' }
    ;(doc.pages.find((p) => p.slug === '')!.sections.find((s) => s.type === 'hero')!.props as { image: unknown }).image = own
    store._state.assets.set(own.assetId, { id: own.assetId, tenantId: d.tenantId, kind: 'image', bytes: Buffer.from(''), mime: 'image/webp', width: 1600, height: 1000, alt: own.alt, source: 'upload', sourceUrl: null, sha256: '0'.repeat(64), licenseKind: 'owner_upload', licenseNote: '', redistributable: true })
    await store.saveDraft({ siteId, baseRev: d.rev, doc })
    await runImagery(rt, siteId)
    expect(homeHero(await docOf(store, siteId))).toEqual(own)
  }, 240_000)
})

describe('switched off in production', () => {
  it('does nothing without the flag, a cap and the key', async () => {
    expect(providersFor({ testMode: false })).toBeNull()
    vi.stubEnv('AI_IMAGE_GENERATION_ENABLED', '1')
    expect(providersFor({ testMode: false })).toBeNull() // no cap set
    vi.stubEnv('AI_IMAGE_DAILY_USD_CAP', '3')
    vi.stubEnv('XAI_API_KEY', '')
    expect(providersFor({ testMode: false })).toBeNull() // no key
    vi.unstubAllEnvs()
    const { rt, store } = runtime()
    const siteId = await draft(rt, { source: 'prompt', businessName: 'Quiet Cafe', kitId: 'restaurant' })
    expect(await runImagery({ ...rt, testMode: false }, siteId)).toMatchObject({ status: 'off', generated: 0 })
    expect([...store._state.assets.values()].some((a) => a.source === 'generated')).toBe(false)
  }, 120_000)
})
