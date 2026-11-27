import { expect, test } from '@playwright/test'
import { RICH, fixtureUrl } from './design-fixtures'

/**
 * The fallback fonts look like the web fonts (decision 2026-11-27): every rich design fixture, at
 * the project width (390 and 1280), laid out twice — once with the web fonts (checked loaded) and
 * once with the font files blocked, so only the size-matched local fallbacks are used. Published
 * pages never swap fonts after drawing (font-display: optional; font-delay.spec.ts checks the
 * layout shift), so this guards how close a slow first visit looks, not movement: the hero within
 * 12% of its height, the page within 2%. Exact line breaks are not compared, because they can
 * differ between browser versions.
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
    expect(Math.abs(fallback.hero - web.hero) / web.hero, `hero height ${web.hero} vs ${fallback.hero}`).toBeLessThanOrEqual(0.12)
    expect(Math.abs(fallback.page - web.page) / web.page, `page height ${web.page} vs ${fallback.page}`).toBeLessThanOrEqual(0.02)
  })
}
