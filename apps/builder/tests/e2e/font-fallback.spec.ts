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
  return page.evaluate(async () => {
    // The web fonts the hero uses, Latin file: loaded for real (or, with the files blocked, failed).
    const used = new Set([...document.querySelectorAll('#hero h1, #hero h1 em, #hero p, main section h1')].map((e) => {
      const cs = getComputedStyle(e)
      return `${cs.fontStyle}|${cs.fontFamily.split(',')[0].replace(/"/g, '').trim()}`
    }))
    const latin = [...document.fonts].filter((f) => used.has(`${f.style}|${f.family.replace(/"/g, '')}`) && /^U\+0-FF\b/.test(f.unicodeRange))
    await Promise.allSettled(latin.map((f) => f.loaded))
    const hero = document.querySelector('#hero') ?? document.querySelector('main section')
    const box = hero!.getBoundingClientRect()
    const lines = [...hero!.querySelectorAll('h1, p, a')].map((e) => Math.round(e.getBoundingClientRect().height))
    return { hero: Math.round(box.height), lines, page: document.documentElement.scrollHeight, fonts: latin.map((f) => `${f.family} ${f.style}: ${f.status}`) }
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
    // Make sure we really compared web fonts against fallbacks.
    expect(web.fonts.length).toBeGreaterThan(0)
    for (const f of web.fonts) expect(f).toMatch(/: loaded$/)
    for (const f of fallback.fonts) expect(f).toMatch(/: error$/)
    expect(fallback.hero, 'hero height').toBe(web.hero)
    expect(fallback.lines, 'hero text and buttons').toEqual(web.lines)
    expect(Math.abs(fallback.page - web.page) / web.page, 'page height').toBeLessThanOrEqual(0.01)
  })
}
