import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { beforeAll, describe, expect, it } from 'vitest'
import { analyzeImage, hamming, pixelProblems } from '@/lib/images/analyze'
import { makeVariants, VARIANT_WIDTHS } from '@/lib/images/variants'
import { checkGenerated, rankImportedPhotos } from '@/lib/pipeline/image-check'
import { generateShots } from '@/lib/pipeline/imagery'
import { buildShotList, cleanOffering, PRESET_STYLE, SHOT_RULES } from '@/lib/pipeline/shot-list'
import { testImageProvider, testVisionChecker } from '@/lib/pipeline/test-images'
import { STYLE_PRESETS } from '@yakini/site-schema'
import * as F from './image-fixtures'

/**
 * Design D4: the imported-photo filter, the automatic image check (seeded bad images), the shot
 * list rules, the image spend cap, and the variants every photo is served as.
 */
let good: Buffer
beforeAll(async () => { good = await F.photoLike() }, 60_000)
const kitPhoto = (p: string) => readFileSync(join(__dirname, '..', '..', 'public', 'kit-samples', p))

describe('pixel analysis', () => {
  it('passes real and photo-like pictures; names what is wrong with bad ones', async () => {
    expect(pixelProblems(await analyzeImage(good))).toEqual([])
    for (const p of ['food-truck/truck-line.jpg', 'food-truck/griddle-tacos.jpg', 'restaurant/dining-room.jpg', 'restaurant/corner-dusk.jpg']) {
      expect(pixelProblems(await analyzeImage(kitPhoto(p))), p).toEqual([])
    }
    expect(pixelProblems(await analyzeImage(await F.blurry()))).toContain('blurry')
    expect(pixelProblems(await analyzeImage(await F.screenshot()))).toEqual(expect.arrayContaining(['screenshot', 'text_heavy']))
    expect(pixelProblems(await analyzeImage(await F.flatGraphic()))).toContain('flat_graphic')
    expect(pixelProblems(await analyzeImage(await F.blownOut()))).toContain('blown_highlights')
    expect(pixelProblems(await analyzeImage(await F.tooTiny()))).toContain('too_small')
  }, 60_000)

  it('spots a near-duplicate (smaller, re-compressed) and tells different pictures apart', async () => {
    const a = await analyzeImage(good), b = await analyzeImage(await F.nearDuplicate(good)), c = await analyzeImage(await F.photoLike(1600, 1000, 210))
    expect(hamming(a.dhash, b.dhash)).toBeLessThanOrEqual(8)
    expect(hamming(a.dhash, c.dhash)).toBeGreaterThan(8)
  }, 60_000)
})

describe('imported photos (the owner\'s own site)', () => {
  it('rejects blurry, small-for-hero, screenshot, flat and duplicate images; the best wide photo becomes the hero', async () => {
    const items = [
      { id: 'blurry', bytes: await F.blurry() },
      { id: 'screenshot', bytes: await F.screenshot() },
      { id: 'flat', bytes: await F.flatGraphic() },
      { id: 'small', bytes: await F.small() }, // fine for the gallery, too narrow for a hero
      { id: 'best', bytes: good },
      { id: 'dup', bytes: await F.nearDuplicate(good) },
      { id: 'other', bytes: kitPhoto('restaurant/corner-dusk.jpg') },
    ]
    const r = await rankImportedPhotos(items)
    const rejected = Object.fromEntries(r.rejected.map((p) => [p.item.id, p.problems]))
    expect(rejected.blurry).toContain('blurry')
    expect(rejected.screenshot).toContain('screenshot')
    expect(rejected.flat).toContain('flat_graphic')
    expect(rejected.dup).toContain('duplicate')
    expect(r.kept.map((p) => p.item.id).sort()).toEqual(['best', 'other', 'small'])
    expect(r.kept.find((p) => p.item.id === 'small')!.heroOk).toBe(false)
    // The best-scoring photo wide enough for a hero leads (a real photo outranks the synthetic one).
    const heroes = r.kept.filter((p) => p.heroOk)
    expect(r.hero).toBe(heroes[0])
    expect(heroes.every((p) => p.score <= r.hero!.score)).toBe(true)
    expect(['best', 'other']).toContain(r.hero!.item.id)
  }, 120_000)
})

describe('automatic image check (generated images)', () => {
  it('rejects seeded bad images and records why: text, face, low resolution, duplicate', async () => {
    const checker = testVisionChecker()
    const withText = await F.photoLike(1600, 1000, 300), withFace = await F.photoLike(1600, 1000, 330)
    checker.label(withText, { score: 0.7, flags: ['text'] })
    checker.label(withFace, { score: 0.8, flags: ['face'] })
    const lowRes = await F.photoLike(600, 400, 60)
    const check = (bytes: Buffer, role: 'hero' | 'other' = 'other', seen: string[] = []) => checkGenerated({ bytes, mime: 'image/jpeg', brief: 'tacos', role, seen, checker })
    expect((await check(withText)).reasons).toContain('text')
    expect((await check(withFace)).reasons).toContain('face')
    expect((await check(lowRes)).reasons).toContain('low_resolution')
    expect((await check(await F.small(), 'hero')).reasons).toContain('low_resolution') // 900 px: not a hero
    const seen = [(await analyzeImage(good)).dhash]
    expect((await check(await F.nearDuplicate(good), 'other', seen)).reasons).toContain('duplicate')
    const ok = await check(good)
    expect(ok).toMatchObject({ pass: true, reasons: [] })
    expect(ok.score).toBeGreaterThan(0.5)
    // A checker that fails or can't read the image never lets it through.
    const broken = { model: 'x', priceUsd: () => 0, check: async () => { throw new Error('down') } }
    expect(await checkGenerated({ bytes: good, mime: 'image/jpeg', brief: 'x', role: 'other', seen: [], checker: broken })).toMatchObject({ pass: false, reasons: ['check_failed'] })
    checker.label(good, { score: 0.4 })
    expect((await check(good)).reasons).toContain('low_score')
  }, 120_000)
})

describe('shot list', () => {
  it('makes 11 shots (2 heroes, 3 features, 6 gallery) that look like one shoot, with the rules on every prompt', () => {
    for (const preset of STYLE_PRESETS) {
      const shots = buildShotList({ kitId: 'food-truck', preset, offerings: ['Al pastor tacos', 'Elote'] })
      expect(shots.map((s) => s.slot)).toEqual(['hero-wide', 'hero-tall', 'feature-1', 'feature-2', 'feature-3', 'gallery-1', 'gallery-2', 'gallery-3', 'gallery-4', 'gallery-5', 'gallery-6'])
      expect(shots[0]).toMatchObject({ aspect: '16:9', size: '2k' })
      expect(shots[1]).toMatchObject({ aspect: '4:5' })
      for (const s of shots) {
        expect(s.prompt).toContain(PRESET_STYLE[preset])
        expect(s.prompt).toContain(SHOT_RULES)
        expect(s.prompt).toMatch(/No identifiable faces/)
        expect(s.prompt).toMatch(/No text/)
      }
    }
  })

  it('names only what the owner sells, never a real brand, never the business name', () => {
    const shots = buildShotList({ kitId: 'food-truck', preset: 'poster', offerings: ['Birria tacos 🌮 $4', 'Coca-Cola', 'Starbucks latte', 'Horchata™'] })
    const all = shots.map((s) => s.prompt).join(' ').toLowerCase()
    expect(all).toContain('birria tacos')
    expect(all).toContain('horchata')
    expect(all).not.toContain('starbucks')
    expect(all).not.toMatch(/\$|™/)
    expect(cleanOffering('Starbucks latte')).toBeNull()
    // No offerings: the kit's places and moments, which name no product.
    const plain = buildShotList({ kitId: 'food-truck', preset: 'craft' }).map((s) => s.subject).join(' ').toLowerCase()
    expect(plain).not.toMatch(/taco|burger|pizza|bbq|brisket/)
    // The general kit for a named industry stays in that industry.
    expect(buildShotList({ kitId: 'service', preset: 'clean', industry: 'Holding company or investments' })[0].subject).toContain('holding company or investments')
  })
})

describe('generation: spend cap, retries, fallback', () => {
  const shots = buildShotList({ kitId: 'restaurant', preset: 'signature' }).slice(0, 4)
  const on = (cap: number) => ({ enabled: true, imageDailyUsdCap: cap, overallDailyUsdCap: 10 })
  const ledger = () => { let spent = 0; return { todayUsd: async () => spent, record: async (usd: number) => { spent += usd }, get spent() { return spent } } }

  it('stops when the image cap is reached; the remaining slots keep their library images', async () => {
    const l = ledger()
    const provider = testImageProvider({ priceUsd: 0.08 }), checker = testVisionChecker({ priceUsd: 0.01 })
    const out = await generateShots(shots, { provider, checker, spend: { config: on(0.2), todayUsd: l.todayUsd, record: l.record } })
    expect(out.filter((o) => o.asset).length).toBe(2) // 2 × $0.09 fits under $0.20; the third would not
    expect(out.slice(2).every((o) => o.asset === null && o.stopped === 'spend')).toBe(true)
    expect(l.spent).toBeLessThanOrEqual(0.2)
    expect(provider.calls).toBe(2)
  }, 120_000)

  it('does nothing when images are off or no cap is set (fails closed)', async () => {
    const provider = testImageProvider()
    const off = await generateShots(shots, { provider, checker: testVisionChecker(), spend: { config: { enabled: false, imageDailyUsdCap: 5, overallDailyUsdCap: 10 }, ...ledger() } })
    expect(off.every((o) => o.asset === null && o.stopped === 'spend')).toBe(true)
    const noCap = await generateShots(shots, { provider, checker: testVisionChecker(), spend: { config: on(0), ...ledger() } })
    expect(noCap.every((o) => o.asset === null)).toBe(true)
    // Spend that can't be read stops it too.
    const unknown = await generateShots(shots, { provider, checker: testVisionChecker(), spend: { config: on(5), todayUsd: async () => { throw new Error('db down') }, record: async () => {} } })
    expect(unknown.every((o) => o.asset === null)).toBe(true)
    expect(provider.calls).toBe(0)
  })

  it('tries each slot at most twice, then falls back; a passing image carries its score, variants and licence', async () => {
    const provider = testImageProvider({ failPrompts: /dining room/ })
    const out = await generateShots(shots, { provider, checker: testVisionChecker(), spend: { config: on(5), ...ledger() } })
    const failed = out.find((o) => /dining room/.test(shots.find((s) => s.slot === o.slot)!.prompt))!
    expect(failed.asset).toBeNull()
    expect(failed.attempts).toHaveLength(2)
    const ok = out.find((o) => o.asset)!.asset!
    expect(ok.license).toMatchObject({ provider: 'test', model: 'test-image' })
    expect(ok.license.prompt).toContain(SHOT_RULES)
    expect(ok.quality.score).toBeGreaterThan(0.5)
    expect(ok.variants.lqip.startsWith('data:image/webp;base64,')).toBe(true)
    expect(ok.alt.length).toBeGreaterThan(5)
  }, 120_000)
})

describe('variants', () => {
  it('AVIF and WebP at the standard widths (never upscaled), a tiny LQIP, a focus point, and a 4:5 crop for heroes', async () => {
    const v = await makeVariants(kitPhoto('food-truck/truck-line.jpg'), { tall: true })
    expect(v).toMatchObject({ width: 1280, height: 720 })
    const full = v.variants.filter((x) => x.crop === 'full')
    expect([...new Set(full.map((x) => x.width))]).toEqual([640, 1024, 1280]) // 1600 and 2400 would be upscales
    for (const w of [640, 1024, 1280]) for (const f of ['avif', 'webp']) expect(full.some((x) => x.width === w && x.format === f), `${f} ${w}`).toBe(true)
    const avif = full.find((x) => x.format === 'avif' && x.width === 1280)!
    expect((await sharp(avif.bytes).metadata()).format).toBe('heif')
    const tall = v.variants.filter((x) => x.crop === 'tall')
    expect(tall.length).toBeGreaterThan(0)
    for (const t of tall) expect(Math.abs(t.width / t.height - 0.8)).toBeLessThan(0.02)
    expect(v.lqip.length).toBeLessThan(1200)
    expect(v.focus.x).toBeGreaterThanOrEqual(0); expect(v.focus.x).toBeLessThanOrEqual(1)
    expect(VARIANT_WIDTHS).toEqual([640, 1024, 1600, 2400])
    const big = await makeVariants(await F.photoLike(2600, 1462, 10))
    expect([...new Set(big.variants.map((x) => x.width))]).toEqual([640, 1024, 1600, 2400])
  }, 120_000)
})
