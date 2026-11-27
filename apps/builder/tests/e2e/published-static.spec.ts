import { expect, test, type Page } from '@playwright/test'

/**
 * Published sites ship zero framework JavaScript (perf decision 2026-11-27). A real published
 * site, opened by its own host name (*.yakini.digital → this machine): every page loads without a
 * single script request, carries no script but JSON-LD, styles from the first-party stylesheet, and
 * its forms still submit with JavaScript off.
 */
test.skip(!!process.env.E2E_BASE_URL, 'Needs the local test-mode server')
const PORT = Number(process.env.E2E_PORT || 3100)
const SHOTS = process.env.SHOTS_DIR
const site = (host: string, path = '/') => `http://${host}:${PORT}${path}`
let n = 0
const freshIp = () => `198.43.${Math.floor(Math.random() * 250)}.${(++n % 250) + 1}`
const uniq = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

async function publishedSite(page: Page) {
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': freshIp() })
  await page.goto('/api/health')
  const { siteId } = await page.evaluate(async () => (await (await fetch('/api/dev/seed?fixture=kit-ready', { method: 'POST' })).json()) as { siteId: string })
  await page.goto(`/claim/${siteId}`)
  await page.waitForURL((u) => u.pathname.startsWith('/signin') || u.pathname.startsWith(`/claim/${siteId}`))
  if (new URL(page.url()).pathname.startsWith('/signin')) {
    await page.getByLabel('Email').fill(`owner-${uniq()}@mesa.example`)
    await page.getByRole('button', { name: 'Email me a code' }).click()
    await page.getByLabel('6-digit code').fill('246810')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(new RegExp(`/claim/${siteId}`))
  }
  await page.getByLabel(/This is my business/).check()
  await page.getByRole('button', { name: 'Make it mine' }).click()
  await page.waitForURL(new RegExp(`/sites/${siteId}/edit`))
  expect((await page.request.post('/api/dev/state', { data: { action: 'plan', siteId, plan: true } })).status()).toBe(200)
  const slug = `static-${uniq()}`
  await page.goto(`/sites/${siteId}/publish`)
  await page.getByLabel('Pick the first part of your address').fill(slug)
  await expect(page.locator('#slug-msg')).toContainText('is free')
  await page.getByTestId('publish').click()
  await expect(page.getByTestId('live-result')).toBeVisible({ timeout: 20_000 })
  return `${slug}.yakini.digital`
}

test('every published page loads with zero framework JavaScript', async ({ page, browser }) => {
  const host = await publishedSite(page)
  const ctx = await browser.newContext({ ...test.info().project.use, extraHTTPHeaders: { 'x-forwarded-for': freshIp() } })
  const visitor = await ctx.newPage()
  const scriptRequests: string[] = []
  visitor.on('request', (r) => { if (r.resourceType() === 'script') scriptRequests.push(r.url()) })
  await visitor.goto(site(host))
  const paths = await visitor.locator('.ys-site header a[href^="/"]').evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute('href')!.split('#')[0]))])
  expect(paths.length).toBeGreaterThanOrEqual(3)
  for (const path of [...paths, '/no-such-page']) {
    const res = await visitor.goto(site(host, path))
    const html = await res!.text()
    expect(html.match(/<script\b[^>]*>/g) ?? [], path).toEqual(path === '/no-such-page' ? [] : ['<script type="application/ld+json">'])
    expect(html, path).not.toMatch(/\/_next\/|self\.__next_f/)
    if (path !== '/no-such-page') {
      // Styled by the first-party stylesheet (the site wrapper gets its layout from site.css).
      await expect(visitor.locator('link[rel="stylesheet"]')).toHaveAttribute('href', /^\/_site-assets\/site\.css\?v=/)
      expect(await visitor.locator('.ys-site').evaluate((el) => getComputedStyle(el).containerType)).toBe('inline-size')
      await visitor.evaluate(() => document.fonts.ready)
    }
  }
  if (SHOTS) await visitor.screenshot({ path: `${SHOTS}/static-site-${test.info().project.name}.png`, fullPage: true })
  expect(scriptRequests).toEqual([])
  await ctx.close()
})

test('forms on a published page still submit with JavaScript off', async ({ page, browser }) => {
  const host = await publishedSite(page)
  const ctx = await browser.newContext({ ...test.info().project.use, javaScriptEnabled: false, extraHTTPHeaders: { 'x-forwarded-for': freshIp() } })
  const visitor = await ctx.newPage()
  await visitor.goto(site(host, '/contact'))
  await visitor.waitForTimeout(3500) // a person takes more than 3 seconds; the form checks it
  await visitor.getByLabel('Your name').fill('Ana Ruiz')
  await visitor.getByLabel('Email').first().fill('ana@visitor.example')
  await visitor.getByLabel(/Message/).fill(`Static form check ${uniq()}`)
  await visitor.getByRole('button', { name: /send/i }).first().click()
  await visitor.waitForURL(/\/thanks/)
  await expect(visitor.getByRole('heading', { name: /on its way/ })).toBeVisible()
  expect((await visitor.content()).match(/<script\b[^>]*>/g) ?? []).toEqual(['<script type="application/ld+json">'])
  await ctx.close()
})

test('the headline font is made at publish: every page view reads it from the cache, none cuts it', async ({ page }) => {
  test.setTimeout(90_000)
  const host = await publishedSite(page)
  // The very first visitor, a repeat visit and another page: all cache hits (x-headline-font is a
  // test-mode-only header the renderer sets: "hit" = read from the cache, "miss" = made now).
  for (const path of ['/', '/', '/about']) {
    const res = (await page.goto(site(host, path)))!
    expect(res.status(), path).toBe(200)
    expect(res.headers()['x-headline-font'], path).toBe('hit')
    expect(await res.text()).toContain("font-family:'YS Headline'")
  }
})
