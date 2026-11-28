import { expect, test, type Page } from '@playwright/test'

/**
 * Design D4 in a real browser (test mode: test image providers, no network, no cost).
 * - A sparse draft opens with library photos, then images made for the site replace them: at 390
 *   and 1440 every photo loads, with width, height, alt, AVIF and WebP copies and a placeholder,
 *   and no image place is empty.
 * - An imported site: the screenshot and the blurry photo are left out; the best wide photo is the hero.
 * - Published pages request nothing from other sites.
 */
test.skip(!!process.env.E2E_BASE_URL, 'Needs the local test-mode server')
const SHOTS = process.env.SHOTS_DIR
let n = 0
const freshIp = () => `198.51.${Math.floor(Math.random() * 250)}.${(++n % 250) + 1}`

async function handOff(page: Page, fields: Record<string, string>) {
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': freshIp() })
  await page.goto('/api/health')
  await page.evaluate((f) => {
    const form = document.createElement('form')
    form.method = 'post'; form.action = '/start'
    for (const [k, v] of Object.entries(f)) { const i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = v; form.appendChild(i) }
    document.body.appendChild(form); form.submit()
  }, fields)
  await page.waitForURL(/\/d\/[0-9a-f-]{36}/, { timeout: 60_000 })
  return new URL(page.url()).pathname.split('/')[2]
}

/** Every photo on the page: loaded, sized, described, AVIF + WebP offered, placeholder under it. */
async function checkPhotos(page: Page, label: string) {
  for (const img of await page.locator('.ys-site img').all()) await img.scrollIntoViewIfNeeded().catch(() => {})
  await expect.poll(() => page.locator('.ys-site img').evaluateAll((imgs) => imgs.every((i) => (i as HTMLImageElement).complete)), { timeout: 20_000 }).toBe(true)
  const report = await page.locator('.ys-site img').evaluateAll((imgs) => imgs.map((el) => {
    const i = el as HTMLImageElement
    const pic = i.parentElement?.tagName === 'PICTURE' ? i.parentElement : null
    const types = pic ? [...pic.querySelectorAll('source')].map((s) => s.getAttribute('type')) : []
    return {
      src: i.currentSrc || i.src, loaded: i.naturalWidth > 0, width: i.getAttribute('width'), height: i.getAttribute('height'),
      alt: i.getAttribute('alt'), avif: types.includes('image/avif'), webp: types.includes('image/webp'),
      lqip: (i.getAttribute('style') ?? '').includes('data:image/webp;base64,'), logo: !!i.closest('header'),
    }
  }))
  const photos = report.filter((r) => !r.logo)
  expect(photos.length, label).toBeGreaterThan(3)
  for (const p of photos) {
    expect(p.loaded, `${label}: ${p.src}`).toBe(true)
    expect(Number(p.width), `${label}: width ${p.src}`).toBeGreaterThan(0)
    expect(Number(p.height), `${label}: height ${p.src}`).toBeGreaterThan(0)
    expect(p.alt?.trim().length, `${label}: alt ${p.src}`).toBeGreaterThan(0)
    expect(p.avif && p.webp, `${label}: AVIF+WebP ${p.src}`).toBe(true)
    expect(p.lqip, `${label}: placeholder ${p.src}`).toBe(true)
  }
  // No empty image places: no gallery shows without photos.
  const emptyGalleries = await page.locator('.ys-site section.ys-gallery').evaluateAll((els) => els.filter((e) => !e.querySelector('img')).length)
  expect(emptyGalleries, label).toBe(0)
  return photos
}

test('a sparse draft gets a full set of photos made for it, at 390 and 1440', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-1280', 'sets its own viewports')
  test.setTimeout(240_000)
  const siteId = await handOff(page, { businessName: 'Ember and Oak', kitId: 'restaurant' })
  // Library first: the draft opens with kit photos straight away.
  await expect(page.locator('.ys-site img').first()).toHaveAttribute('src', /\/kit-samples\//)
  // Then the photos made for this site replace them (runs after the draft is saved).
  await expect.poll(async () => {
    await page.goto(`/d/${siteId}`)
    return page.locator('.ys-site img[src*="/api/drafts/"]').count()
  }, { timeout: 180_000, intervals: [3000] }).toBeGreaterThan(4)
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
    await page.goto(`/d/${siteId}`)
    const photos = await checkPhotos(page, `sparse-${width}`)
    expect(photos.filter((p) => p.src.includes('/api/drafts/')).length).toBeGreaterThan(4)
    // Phones get the 4:5 crop of the hero.
    if (width === 390) expect(await page.locator('.ys-site picture source[media="(max-width: 699px)"]').count()).toBeGreaterThan(0)
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/d4-sparse-${width}.png`, fullPage: true })
  }
})

test('an imported site: screenshots and blurry photos are left out; the best wide photo is the hero', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-1280', 'one run is enough')
  test.setTimeout(120_000)
  const siteId = await handOff(page, { sourceUrl: 'https://rise-and-crumb.example/', businessName: '', kitId: 'restaurant' })
  await page.goto(`/d/${siteId}`)
  const alts = await page.locator('.ys-site img').evaluateAll((imgs) => imgs.map((i) => i.getAttribute('alt')))
  expect(alts).not.toContain('Our menu page')
  expect(alts).not.toContain('The bakery storefront')
  await expect(page.locator('.ys-site section.ys-hero img').first()).toHaveAttribute('alt', 'Fresh sourdough loaves on the rack')
})

test('published pages request nothing from other sites', async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin
  const offsite: string[] = []
  page.on('request', (r) => { const u = r.url(); if (!u.startsWith(origin) && !u.startsWith('data:') && !u.startsWith('blob:')) offsite.push(u) })
  for (const kit of ['restaurant', 'food-truck', 'real-estate', 'tree-lawn', 'landlord']) {
    await page.goto(`/dev-site/${kit}-rich`)
    await checkPhotos(page, `${kit}-rich`)
  }
  expect(offsite).toEqual([])
})
