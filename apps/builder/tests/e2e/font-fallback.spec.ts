import { expect, test } from '@playwright/test'
import { RICH, fixtureUrl } from './design-fixtures'

/**
 * No layout shift while fonts load (decision 2026-11-27, CLS <= 0.02): every rich design fixture,
 * at the project width (390 and 1280), laid out twice — once with the web fonts and once with the
 * font files blocked, so only the size-matched local fallbacks are used. What a visitor sees first
 * (the hero) must take exactly the same space, and the whole page within 1%.
 */
test.skip(!!process.env.E2E_BASE_URL, 'Needs the local test-mode server')

const measure = async (page: import('@playwright/test').Page, url: string) => {
  await page.goto(url)
  await page.evaluate(() => document.fonts.ready)
  return page.evaluate(() => {
    const hero = document.querySelector('#hero') ?? document.querySelector('main section')
    const box = hero!.getBoundingClientRect()
    const lines = [...hero!.querySelectorAll('h1, p, a')].map((e) => Math.round(e.getBoundingClientRect().height))
    return { hero: Math.round(box.height), lines, page: document.documentElement.scrollHeight }
  })
}

for (const f of RICH) {
  test(`fallback fonts take the web fonts' space: ${f.name}`, async ({ browser }, info) => {
    const opts = { viewport: info.project.use.viewport!, baseURL: info.project.use.baseURL }
    const url = fixtureUrl(f.name, '', 'live')
    const web = await measure(await browser.newPage(opts), url)
    const blocked = await browser.newPage(opts)
    await blocked.route(/\.woff2(\?|$)/, (r) => r.abort())
    const fallback = await measure(blocked, url)
    expect(fallback.hero, 'hero height').toBe(web.hero)
    expect(fallback.lines, 'hero text and buttons').toEqual(web.lines)
    expect(Math.abs(fallback.page - web.page) / web.page, 'page height').toBeLessThanOrEqual(0.01)
  })
}
