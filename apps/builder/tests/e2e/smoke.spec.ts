import { expect, test } from '@playwright/test'
import { lintCopy, strayPrices } from '@yakini/ai'

const SHOTS = process.env.SHOTS_DIR

test('studio landing renders, follows copy rules and loads nothing third-party', async ({ page, baseURL }, info) => {
  const origin = new URL(baseURL!).origin
  const offsite: string[] = []
  page.on('request', (r) => { if (!r.url().startsWith(origin) && !r.url().startsWith('data:')) offsite.push(r.url()) })

  const res = await page.goto('/')
  expect(res?.status()).toBe(200)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your website, set up in your brand.')
  await expect(page.getByTestId('price-line')).toHaveText('Setup from $299. Monthly plans from $149.')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')

  // Previews and the unlaunched studio are noindex.
  expect(res?.headers()['x-robots-tag'] ?? '').toContain('noindex')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)

  const text = await page.locator('body').innerText()
  expect(lintCopy(text), 'banned terms in rendered copy').toEqual([])
  expect(strayPrices(text), 'stray prices in rendered copy').toEqual([])

  // No horizontal scroll; tap targets at least 44px tall.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(0)
  const small = await page.locator('a, button').evaluateAll((els) =>
    els.filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.height < 44 }).map((e) => e.textContent?.trim()))
  expect(small, 'tap targets under 44px').toEqual([])

  await page.waitForLoadState('networkidle')
  expect(offsite, 'requests to other domains').toEqual([])

  if (SHOTS) await page.screenshot({ path: `${SHOTS}/studio-landing-${info.project.name}.png`, fullPage: true })
})

test('health endpoint answers without secrets', async ({ request }) => {
  const r = await request.get('/api/health')
  expect(r.ok()).toBe(true)
  expect(await r.json()).toEqual({ ok: true, app: 'builder', phase: 1, schemaVersion: 1 })
})

test('unknown client host gets the neutral unavailable page, noindex', async ({ request }) => {
  const r = await request.get('/', { headers: { host: 'unknown-site.example.com' } })
  expect(r.status()).toBe(404)
  expect(r.headers()['x-robots-tag'] ?? '').toContain('noindex')
  expect(await r.text()).toContain('This site is unavailable.')
})

test('the internal renderer path cannot be reached directly', async ({ request }) => {
  const r = await request.get('/_site/evil.example.com')
  expect(r.status()).toBe(404)
})
