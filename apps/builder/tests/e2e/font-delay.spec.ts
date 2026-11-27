import { expect, test } from '@playwright/test'
import { RICH, fixtureUrl } from './design-fixtures'

/**
 * Slow-font check (CLS <= 0.02 even when fonts are late): every rich design fixture at the project
 * width (390 and 1280) with every font file held back 1.5 s, so the page first draws with the
 * size-matched fallbacks and the web fonts swap in afterwards. The layout shifts that swap causes
 * must add up to no more than 0.02 (the D1 budget), and the web fonts must really arrive.
 */
test.skip(!!process.env.E2E_BASE_URL, 'Needs the local test-mode server')

for (const f of RICH) {
  test(`fonts arriving 1.5 s late move nothing: ${f.name}`, async ({ page }) => {
    test.setTimeout(30_000)
    await page.addInitScript(() => {
      const w = window as unknown as { __shifts: number[] }
      w.__shifts = []
      new PerformanceObserver((list) => {
        for (const e of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) if (!e.hadRecentInput) w.__shifts.push(e.value)
      }).observe({ type: 'layout-shift', buffered: true })
    })
    let fonts = 0
    await page.route(/\.woff2(\?|$)/, async (r) => { fonts++; await new Promise((res) => setTimeout(res, 1500)); await r.continue() })
    await page.goto(fixtureUrl(f.name, '', 'live'))
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(600)
    expect(fonts, 'web fonts requested').toBeGreaterThan(0)
    const shifts = await page.evaluate(() => (window as unknown as { __shifts: number[] }).__shifts)
    const cls = shifts.reduce((n, v) => n + v, 0)
    expect(cls, `layout shift ${cls.toFixed(4)}`).toBeLessThanOrEqual(0.02)
  })
}
