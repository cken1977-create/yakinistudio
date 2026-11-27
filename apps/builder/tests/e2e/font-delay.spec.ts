import { expect, test } from '@playwright/test'
import { RICH, fixtureUrl } from './design-fixtures'

/**
 * Slow-font check (CLS <= 0.02 even when fonts are late): every rich design fixture at the project
 * width (390 and 1280) with every font file held back 1.5 s, so the page first draws with the
 * size-matched fallbacks. The fonts must be asked for, and the layout shifts must add up to no more
 * than 0.02 (the D1 budget). Published pages use font-display: optional, so a late font is not
 * swapped in on that page view at all.
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
    // The headline is drawn in the site's own typeface even with the font files late: it travels
    // inside the page (the inline 'YS Headline' face, loaded, and first in the headline's stack).
    const headline = await page.evaluate(async () => {
      const h = document.querySelector('#hero h1') ?? document.querySelector('main h1')!
      const faces = [...document.fonts].filter((f) => f.family.replace(/"/g, '') === 'YS Headline')
      await Promise.allSettled(faces.map((f) => f.loaded))
      return { first: getComputedStyle(h).fontFamily.split(',')[0].replace(/["']/g, '').trim(), loaded: faces.length > 0 && faces.every((f) => f.status === 'loaded') }
    })
    expect(headline).toEqual({ first: 'YS Headline', loaded: true })
    const shifts = await page.evaluate(() => (window as unknown as { __shifts: number[] }).__shifts)
    const cls = shifts.reduce((n, v) => n + v, 0)
    expect(cls, `layout shift ${cls.toFixed(4)}`).toBeLessThanOrEqual(0.02)
  })
}
