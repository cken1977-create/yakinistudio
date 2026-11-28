import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { BUILDER_KIT_IDS } from '@yakini/kits'
import { libraryGuard, makeKitLibrary } from '@/lib/pipeline/kit-library'
import { testImageProvider, testVisionChecker } from '@/lib/pipeline/test-images'
import { createMemoryStore } from '@/lib/server/store'

/**
 * Design D4: the kit library is made only by hand, with images switched on, and never in CI or on
 * deploy. Its spend is capped and logged like the app's.
 */
const ROOT = join(__dirname, '..', '..', '..', '..')
const ON = { AI_IMAGE_GENERATION_ENABLED: '1', AI_IMAGE_DAILY_USD_CAP: '5', AI_GLOBAL_DAILY_USD_CAP: '20' }

describe('kit library guard', () => {
  it('refuses in CI, on Vercel builds, with images off, with no budget, or without --yes', () => {
    for (const k of ['CI', 'GITHUB_ACTIONS', 'VERCEL', 'VERCEL_ENV']) expect(libraryGuard({ ...ON, [k]: '1' }, ['--all', '--yes'], BUILDER_KIT_IDS).ok, k).toBe(false)
    expect(libraryGuard({}, ['--all', '--yes'], BUILDER_KIT_IDS).ok).toBe(false)
    expect(libraryGuard({ ...ON, AI_IMAGE_DAILY_USD_CAP: '0' }, ['--all', '--yes'], BUILDER_KIT_IDS).ok).toBe(false)
    expect(libraryGuard(ON, ['--all'], BUILDER_KIT_IDS).ok).toBe(false)
    expect(libraryGuard(ON, ['--yes'], BUILDER_KIT_IDS).ok).toBe(false)
    expect(libraryGuard(ON, ['--kit=nope', '--yes'], BUILDER_KIT_IDS).ok).toBe(false)
    expect(libraryGuard(ON, ['--kit=restaurant', '--yes'], BUILDER_KIT_IDS)).toEqual({ ok: true, kits: ['restaurant'] })
  })
  it('nothing automatic runs it: no workflow, package script or deploy config names it', () => {
    const files: string[] = []
    const wf = join(ROOT, '.github', 'workflows')
    if (existsSync(wf)) for (const f of readdirSync(wf)) files.push(join(wf, f))
    for (const f of ['package.json', 'apps/builder/package.json', 'vercel.json', 'apps/builder/vercel.json', 'apps/builder/next.config.ts']) if (existsSync(join(ROOT, f))) files.push(join(ROOT, f))
    expect(files.length).toBeGreaterThan(2)
    for (const f of files) expect(readFileSync(f, 'utf8'), f).not.toMatch(/generate-kit-library/)
  })
})

describe('making a kit library (test providers)', () => {
  it('adds the kit\'s shots with licence and check score, logs every priced call, and stops at the budget', async () => {
    const store = createMemoryStore()
    const r = await makeKitLibrary('restaurant', { store, provider: testImageProvider(), checker: testVisionChecker(), env: ON })
    expect(r).toMatchObject({ kit: 'restaurant', stopped: false })
    expect(r.made).toBeGreaterThan(8)
    const lib = await store.kitLibrary('restaurant')
    expect(lib).toHaveLength(r.made)
    for (const x of lib) {
      expect(x.license.prompt).toMatch(/No identifiable faces/)
      expect(x.qualityScore).toBeGreaterThan(0.5)
      expect(x.variants.some((v) => v.format === 'avif')).toBe(true)
    }
    expect(store._state.runs.filter((x) => x.kind === 'image' && x.tenantId === null)).toHaveLength(r.made)

    const tight = createMemoryStore()
    const s = await makeKitLibrary('restaurant', { store: tight, provider: testImageProvider({ priceUsd: 0.04 }), checker: testVisionChecker(), env: { ...ON, AI_IMAGE_DAILY_USD_CAP: '0.1' } })
    expect(s.stopped).toBe(true)
    expect(s.made).toBeLessThan(3)
  }, 240_000)
})
