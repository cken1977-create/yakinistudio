import { expect, test, type Page } from '@playwright/test'
import { lintCopy, strayPrices } from '@yakini/ai'

/**
 * Phase 1 acceptance in a real browser (spec 15.2): demo hand-off and describe-your-business both
 * land on a private, noindex draft; every page renders at 390 and 1280, with JavaScript on and
 * off; nothing loads from other domains. Runs against `next start` with BUILDER_TEST_MODE=1 (the
 * stand-in model and mock websites), so it never touches a real AI, database or website.
 */
const SHOTS = process.env.SHOTS_DIR
test.skip(!!process.env.E2E_BASE_URL, 'Draft tests need the local test-mode server')

let n = 0
const freshIp = () => `198.18.${Math.floor(Math.random() * 250)}.${(++n % 250) + 1}`

/** Submit the /demo hand-off as yakini.digital would: a plain top-level form POST. */
async function handOff(page: Page, fields: Record<string, string | string[]>) {
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': freshIp() })
  await page.goto('/api/health')
  await page.evaluate((f) => {
    const form = document.createElement('form')
    form.method = 'post'
    form.action = '/start'
    for (const [k, v] of Object.entries(f)) for (const x of ([] as string[]).concat(v)) {
      const i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = x; form.appendChild(i)
    }
    document.body.appendChild(form)
    form.submit()
  }, fields)
  await page.waitForURL(/\/d\/[0-9a-f-]{36}/, { timeout: 60_000 })
  return new URL(page.url()).pathname.split('/')[2]
}

function watchOffsite(page: Page, origin: string) {
  const offsite: string[] = []
  page.on('request', (r) => { const u = r.url(); if (!u.startsWith(origin) && !u.startsWith('data:') && !u.startsWith('blob:')) offsite.push(u) })
  return offsite
}

async function checkPage(page: Page, label: string, project: string) {
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow, `${label}: horizontal scroll`).toBeLessThanOrEqual(0)
  // Lazy images below the fold load as they come into view: scroll through first, then check.
  // (Playwright scrolling works with JavaScript on or off.)
  for (const img of await page.locator('img').all()) await img.scrollIntoViewIfNeeded().catch(() => {})
  await expect.poll(() => page.locator('img').evaluateAll((imgs) => imgs.every((i) => (i as HTMLImageElement).complete)), { timeout: 10_000 }).toBe(true)
  const broken = await page.locator('img').evaluateAll((imgs) => imgs.filter((i) => !(i as HTMLImageElement).complete || (i as HTMLImageElement).naturalWidth === 0).map((i) => (i as HTMLImageElement).src))
  expect(broken, `${label}: broken images`).toEqual([])
  const site = await page.locator('.ys-site').innerText()
  expect(lintCopy(site), `${label}: banned words`).toEqual([])
  // The business's own menu prices are expected on its site. The studio's own words around the
  // draft must never quote a Yakini price other than the one public line.
  const chrome = await page.locator('body > div > header, body header.sticky').allInnerTexts()
  expect(strayPrices(chrome.join(' ')), `${label}: stray Yakini prices`).toEqual([])
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${label}-${project}.png`, fullPage: true })
}

test('demo hand-off lands on a private 5-page draft in the business’s colors', async ({ page, baseURL, context }, info) => {
  const offsite = watchOffsite(page, new URL(baseURL!).origin)
  const siteId = await handOff(page, { sourceUrl: 'https://mesa-street-tacos.example/', businessName: '', kitId: 'food-truck', 'features[]': ['online-menu'], sizeId: 'small' })

  const res = await page.reload()
  expect(res?.headers()['x-robots-tag'] ?? '').toContain('noindex')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  await expect(page.getByText('This is your site draft.')).toBeVisible()
  await expect(page.getByText('Nothing is public yet.')).toBeVisible()
  await expect(page.getByText(/couldn’t read that website/)).toHaveCount(0)

  // The brand colors are exactly the ones on the business's own site.
  const vars = await page.locator('.ys-site').evaluate((el) => (el as HTMLElement).style.cssText.toLowerCase())
  expect(vars).toContain('#9a3412')

  // All five pages render, reached through the site's own navigation.
  const hrefs = await page.locator('.ys-site header a[href^="/d/"]').evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute('href')!))])
  expect(hrefs.length).toBeGreaterThanOrEqual(5)
  for (const href of hrefs) {
    await page.goto(href)
    await checkPage(page, `draft-food-truck${href.replace(`/d/${siteId}`, '').replace(/\//g, '-') || '-home'}`, info.project.name)
  }

  // Phone view: same draft inside a 390px frame.
  await page.goto(`/d/${siteId}?view=phone`)
  await expect(page.locator('[data-preview="phone"]')).toBeVisible()
  await checkPage(page, 'draft-food-truck-phone-frame', info.project.name)

  await page.waitForLoadState('networkidle')
  expect(offsite, 'requests to other domains').toEqual([])

  // Another browser (no draft cookie) sees nothing.
  const other = await context.browser()!.newContext()
  const stranger = await other.newPage()
  expect((await stranger.goto(`/d/${siteId}`))?.status()).toBe(404)
  await other.close()
})

test('an unreadable website still gives a draft with the plain note', async ({ page }) => {
  await handOff(page, { sourceUrl: 'https://no-such-place.invalid/', businessName: 'Rosa’s Kitchen', kitId: 'restaurant' })
  await expect(page.getByText(/couldn’t read that website, so we started from our Restaurant design/)).toBeVisible()
  await expect(page.locator('.ys-site')).toContainText('Rosa’s Kitchen')
})

test('the injection fixture site changes nothing it should not', async ({ page }) => {
  await handOff(page, { sourceUrl: 'https://injection.example/', businessName: '', kitId: 'restaurant' })
  const html = await page.locator('.ys-site').innerHTML()
  expect(html).not.toMatch(/ignore (all )?previous|evil\.example|attacker/i)
})

test('describe your business: no contact info, owner colors, lands on the draft', async ({ page }, info) => {
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': freshIp() })
  await page.goto('/new')
  await expect(page.locator('input[type="email"], input[type="tel"]')).toHaveCount(0)
  await page.getByLabel('Business name').fill('Harbor Room')
  await page.getByLabel('What do you do?').fill('Seafood restaurant with a raw bar and a patio by the water.')
  await page.getByLabel(/Kind of site/).selectOption('restaurant')
  await page.getByLabel('Use my colors').check()
  await page.locator('input[name="primary"]').fill('#1e3a34')
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/new-form-${info.project.name}.png`, fullPage: true })
  await page.waitForTimeout(3_200) // the form refuses sends faster than 3 seconds
  await page.getByRole('button', { name: 'Build my draft' }).click()
  await page.waitForURL(/\/d\/[0-9a-f-]{36}/, { timeout: 60_000 })
  await expect(page.locator('.ys-site')).toContainText('Harbor Room')
  expect(await page.locator('.ys-site').evaluate((el) => (el as HTMLElement).style.cssText.toLowerCase())).toContain('#1e3a34')
})

test.describe('with JavaScript off', () => {
  test.use({ javaScriptEnabled: false })

  test('the hand-off, the draft and its menu all work', async ({ page }, info) => {
    const siteId = await handOff(page, { sourceUrl: 'https://harbor-room.example/', businessName: '', kitId: 'restaurant' })
    await expect(page.getByText('This is your site draft.')).toBeVisible()
    await checkPage(page, 'draft-restaurant-nojs', info.project.name)
    await page.goto(`/d/${siteId}/menu`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  })
})

test.describe('every section and variant (fixtures)', () => {
  for (const name of ['food-truck-every-section', 'restaurant-every-section', 'food-truck-minimal', 'restaurant-minimal']) {
    for (const js of [true, false]) {
      test(`${name} ${js ? 'with' : 'without'} JavaScript`, async ({ browser, baseURL }, info) => {
        const ctx = await browser.newContext({ ...info.project.use, javaScriptEnabled: js, baseURL })
        const page = await ctx.newPage()
        const offsite = watchOffsite(page, new URL(baseURL!).origin)
        await page.goto(`/dev/fixtures/${name}`)
        const hrefs = await page.locator('.ys-site header a[href^="/dev/fixtures/"]').evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute('href')!))])
        for (const href of hrefs.length ? hrefs : [`/dev/fixtures/${name}`]) {
          await page.goto(href)
          await checkPage(page, `fixture-${href.split('/').slice(3).join('-')}${js ? '' : '-nojs'}`, info.project.name)
        }
        await page.goto(`/dev/fixtures/${name}?mode=live`)
        await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1)
        expect(offsite).toEqual([])
        await ctx.close()
      })
    }
  }
})
