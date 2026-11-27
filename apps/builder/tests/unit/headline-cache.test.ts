import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadSiteDoc } from '@yakini/site-schema'
import { api, jar, readySite } from './browser'

/**
 * The inline headline font is made once per published version (at publish), never per page view:
 * a page view only reads the cache, a fresh server instance reads the shared cache rather than
 * cutting the font again, and only a new version (new content) or new font files make a new one.
 */
vi.mock('next/headers', async () => (await import('./browser')).headersMock)
// Next's shared data cache, as a store every "server instance" in this test shares (like Vercel's).
const shared = new Map<string, unknown>()
vi.mock('next/cache', () => ({
  revalidateTag: () => {},
  unstable_cache: (fn: () => Promise<unknown>, keys: string[]) => async () => {
    const k = keys.join('|')
    if (!shared.has(k)) shared.set(k, await fn())
    return shared.get(k)
  },
}))

let out = ''
beforeAll(async () => {
  vi.stubEnv('OPERATOR_EMAIL', 'ops@yakini.example'); vi.stubEnv('BUILDER_TEST_MODE', '1'); vi.stubEnv('VERCEL', ''); vi.stubEnv('VERCEL_ENV', '')
  out = mkdtempSync(join(tmpdir(), 'site-assets-'))
  execFileSync(process.execPath, [join(__dirname, '..', '..', 'scripts', 'build-site-css.mjs')], { env: { ...process.env, SITE_ASSETS_OUT: out }, stdio: 'pipe' })
  vi.stubEnv('SITE_ASSETS_DIR', out)
  // The real maker (the renderer bundle's headlineFont is this same function).
  const { headlineFont } = await import('@/lib/site/headline-font')
  ;(await import('@/lib/site/headline-cache')).setHeadlineMaker(headlineFont)
}, 60_000)
afterAll(() => { vi.unstubAllEnvs(); rmSync(out, { recursive: true, force: true }) })
beforeEach(() => jar.clear())

const cuts = async () => (await import('@/lib/site/headline-font')).headlineCuts()
const cache = async () => import('@/lib/site/headline-cache')
let n = 0

async function publishReady() {
  const s = await readySite()
  const slug = `headline-${++n}-${Math.random().toString(36).slice(2, 7)}`
  const { POST } = await import('@/app/api/sites/[siteId]/publish/route')
  const res = await POST(api('POST', `/api/sites/${s.siteId}/publish`, { slug }), { params: Promise.resolve({ siteId: s.siteId }) })
  expect(res.status).toBe(200)
  const { getRuntime } = await import('@/lib/server/runtime')
  const host = (await getRuntime().store.siteForHost(`${slug}.yakini.digital`))!
  return { siteId: s.siteId, versionId: host.versionId!, doc: loadSiteDoc(host.doc).doc }
}

describe('headline font: made at publish, never per page view', () => {
  it('publishing makes it; the first and second page views do no font cutting', async () => {
    const before = await cuts()
    const site = await publishReady()
    const afterPublish = await cuts()
    expect(afterPublish).toBeGreaterThan(before) // made once, at publish
    const { headlineFor } = await cache()
    const first = await headlineFor({ testMode: true }, site)
    const second = await headlineFor({ testMode: true }, site)
    expect(first.cached && second.cached).toBe(true)
    expect(first.font?.css).toContain("font-family:'YS Headline'")
    expect(second.font).toEqual(first.font)
    expect(await cuts()).toBe(afterPublish) // no subsetting on either view
  })

  it('production path (shared data cache): a fresh server instance reads it, it does not cut it again', async () => {
    const { headlineFor, clearHeadlineMemory } = await cache()
    const { clearHeadlineCuts } = await import('@/lib/site/headline-font')
    const site = await publishReady() // test-mode publish warms the in-process cache…
    const prod = { testMode: false }
    const made = await headlineFor(prod, site) // …production warms the shared cache the same way
    const c0 = await cuts()
    // A new instance: nothing in this process's memory, nothing in its font cut cache.
    clearHeadlineMemory(); clearHeadlineCuts()
    const view = await headlineFor(prod, site)
    expect(view.cached).toBe(true)
    expect(view.font).toEqual(made.font)
    expect(await cuts()).toBe(c0)
  })

  it('only a new version (new content) makes a new one, once', async () => {
    const { headlineFor } = await cache()
    const site = await publishReady()
    const c0 = await cuts()
    const changed = { ...site, versionId: '7a1e0000-0000-4000-8000-00000000ffff', doc: { ...site.doc, business: { ...site.doc.business, name: 'Zebra Quartz Joy' } } }
    const first = await headlineFor({ testMode: true }, changed)
    expect(first.cached).toBe(false)
    expect(await cuts()).toBeGreaterThan(c0)
    const c1 = await cuts()
    expect((await headlineFor({ testMode: true }, changed)).cached).toBe(true)
    expect(await cuts()).toBe(c1)
  })

  it('the cache key follows the deployed font files', async () => {
    const { deployedFontsVersion } = await cache()
    expect(deployedFontsVersion()).toMatch(/^[0-9a-f]{16}$/)
  })
})
