import { expect, test } from '@playwright/test'
import { fixtureUrl } from './design-fixtures'

/**
 * The filmstrip gallery (design D2) is usable by keyboard and screen reader, with no JavaScript:
 * a named, focusable region that scrolls with the arrow keys from the first photo to the last and
 * back, and every photo announced as
 * "Photo n of N" with its own alt text.
 */
test.skip(!!process.env.E2E_BASE_URL, 'Needs the local test-mode server')

const URL = fixtureUrl('v2-food-truck-every-section', 'showcase', 'live')

for (const js of [true, false]) {
  test(`filmstrip: keyboard and screen reader${js ? '' : ', JavaScript off'}`, async ({ browser }, info) => {
    const ctx = await browser.newContext({ ...info.project.use, javaScriptEnabled: js })
    const page = await ctx.newPage()
    await page.goto(URL)

    // A named region a screen reader lists, holding a list of N photos.
    const strip = page.getByRole('region', { name: 'Behind the window, photo strip' })
    await expect(strip).toBeVisible()
    const frames = strip.getByRole('listitem')
    await expect(frames).toHaveCount(6)
    for (let i = 0; i < 6; i++) {
      await expect(frames.nth(i)).toHaveAccessibleName(`Photo ${i + 1} of 6`)
      await expect(frames.nth(i).locator('img')).toHaveAttribute('alt', /\S/)
    }

    // Reachable with Tab, with a visible focus ring.
    await strip.evaluate((el) => el.scrollIntoView({ block: 'center' }))
    let focused = false
    await page.locator('body').focus()
    for (let i = 0; i < 80 && !focused; i++) {
      await page.keyboard.press('Tab')
      focused = await strip.evaluate((el) => el === document.activeElement)
    }
    expect(focused, 'Tab reaches the filmstrip').toBe(true)
    expect(await strip.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none')

    // The arrow keys scroll it all the way to the last photo and back. The strip really overflows.
    expect(await strip.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true)
    const left = () => strip.evaluate((el) => el.scrollLeft)
    const atEnd = () => strip.evaluate((el) => Math.ceil(el.scrollLeft + el.clientWidth) >= el.scrollWidth - 2)
    await page.keyboard.press('ArrowRight')
    await expect.poll(left).toBeGreaterThan(0)
    // A person presses, sees it glide and snap, presses again: so the test waits between presses.
    const press = async (key: string) => { await page.keyboard.press(key); await page.waitForTimeout(150) }
    for (let i = 0; i < 60 && !(await atEnd()); i++) await press('ArrowRight')
    await expect.poll(atEnd).toBe(true)
    const last = frames.nth(5)
    await expect(last).toBeInViewport({ ratio: 0.9 })
    // Back to the start: the first photo is fully in view again (on wide screens the strip snaps it
    // to the page margin, so the scroll position needn't be 0).
    const firstShown = () => frames.nth(0).evaluate((el) => { const r = el.getBoundingClientRect(), s = el.closest('.ys-filmstrip')!.getBoundingClientRect(); return r.left >= s.left - 1 && r.right <= s.right + 1 })
    for (let i = 0; i < 60 && !(await firstShown()); i++) await press('ArrowLeft')
    await expect.poll(firstShown).toBe(true)
    await expect(frames.nth(0)).toBeInViewport({ ratio: 0.9 })
    await ctx.close()
  })
}
