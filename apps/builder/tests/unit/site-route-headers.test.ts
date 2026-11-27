import { afterEach, describe, expect, it, vi } from 'vitest'
import { designFixtures } from '@yakini/kits/design-fixtures'
import { loadSiteDoc } from '@yakini/site-schema'

/**
 * The test-mode cache header (x-headline-font) and the font-cut counter never reach production:
 * the published-site route, run as production would (no test mode, and on Vercel even with the
 * test-mode switch set by mistake), answers without the header and without anything about font
 * cuts; the dev-site harness doesn't exist there at all. Test mode does send the header, so the
 * check below really looks at the right thing.
 */
const doc = loadSiteDoc(structuredClone(designFixtures()['food-truck-rich'])).doc
vi.mock('next/cache', () => ({ revalidateTag: () => {}, unstable_cache: (fn: () => unknown) => fn }))
vi.mock('@/lib/site/resolve', () => ({
  siteView: async () => ({ kind: 'page', page: doc.pages[0], siteId: 's1', versionId: 'v1', doc, canonicalHost: 'mesa.yakini.digital', indexable: false, reportLinkHidden: false }),
}))
vi.mock('@/lib/site/renderer', () => ({
  siteRenderer: () => ({
    neutralHtml: () => '<!doctype html><title>x</title>',
    renderPublished: () => '<!doctype html><html><head></head><body>ok</body></html>',
    headlineFont: async () => ({ css: '@font-face{}', bytes: 1, displayOnly: [] }),
  }),
}))
vi.mock('@/lib/server/runtime', async (orig) => {
  const real = await orig<typeof import('@/lib/server/runtime')>()
  return { ...real, getRuntime: () => ({ testMode: real.isTestMode() }) }
})
vi.mock('@/lib/server/settings', () => ({ studioOrigin: () => 'https://studio.yakini.digital' }))
vi.mock('@/lib/server/form-stamp', () => ({ freshFormStamp: () => 'stamp' }))

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules() })

async function get(route: '_site' | 'dev-site') {
  if (route === '_site') {
    const { GET } = await import('@/app/%5Fsite/[host]/[[...path]]/route')
    return GET(new Request('https://mesa.yakini.digital/'), { params: Promise.resolve({ host: 'mesa.yakini.digital', path: [] }) })
  }
  const { GET } = await import('@/app/dev-site/[name]/[[...path]]/route')
  return GET(new Request('https://studio.yakini.digital/dev-site/food-truck-rich'), { params: Promise.resolve({ name: 'food-truck-rich', path: [] }) })
}
const debugHeaders = (res: Response) => [...res.headers.keys()].filter((k) => /headline|font|cut/i.test(k))

describe('test-mode headers stay out of production', () => {
  it('production (no test mode): a published page has no x-headline-font header', async () => {
    vi.stubEnv('BUILDER_TEST_MODE', ''); vi.stubEnv('VERCEL', '1'); vi.stubEnv('VERCEL_ENV', 'production')
    const res = await get('_site')
    expect(res.status).toBe(200)
    expect(res.headers.get('x-headline-font')).toBeNull()
    expect(debugHeaders(res)).toEqual([])
    expect(await res.text()).not.toMatch(/headline-font|headlineCuts/)
  })

  it('on Vercel even with the test-mode switch set by mistake: still no header, and no dev-site harness', async () => {
    vi.stubEnv('BUILDER_TEST_MODE', '1'); vi.stubEnv('VERCEL', '1'); vi.stubEnv('VERCEL_ENV', 'production')
    const res = await get('_site')
    expect(res.headers.get('x-headline-font')).toBeNull()
    expect(debugHeaders(res)).toEqual([])
    const harness = await get('dev-site')
    expect(harness.status).toBe(404)
    expect(debugHeaders(harness)).toEqual([])
  })

  it('test mode (local and CI only) does send it, so the checks above look at the right header', async () => {
    vi.stubEnv('BUILDER_TEST_MODE', '1'); vi.stubEnv('VERCEL', ''); vi.stubEnv('VERCEL_ENV', '')
    const res = await get('_site')
    expect(res.headers.get('x-headline-font')).toMatch(/^(hit|miss)$/)
  })
})

describe('the font-cut counter is off in production', () => {
  it('cutting a font in production leaves the counter at 0', async () => {
    const { execFileSync } = await import('node:child_process')
    const { mkdtempSync, rmSync } = await import('node:fs')
    const { tmpdir } = await import('node:os')
    const { join } = await import('node:path')
    const out = mkdtempSync(join(tmpdir(), 'site-assets-'))
    execFileSync(process.execPath, [join(__dirname, '..', '..', 'scripts', 'build-site-css.mjs')], { env: { ...process.env, SITE_ASSETS_OUT: out }, stdio: 'pipe' })
    vi.stubEnv('SITE_ASSETS_DIR', out); vi.stubEnv('BUILDER_TEST_MODE', ''); vi.stubEnv('VERCEL', '1'); vi.stubEnv('VERCEL_ENV', 'production')
    const { headlineFont, headlineCuts } = await vi.importActual<typeof import('@/lib/site/headline-font')>('@/lib/site/headline-font')
    const font = await headlineFont(doc)
    expect(font?.css).toContain('YS Headline')
    expect(headlineCuts()).toBe(0)
    rmSync(out, { recursive: true, force: true })
  }, 60_000)
})
