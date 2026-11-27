import { expect, test } from '@playwright/test'

/**
 * Never-empty draft preview (D1 step 5): a draft made from just a name and one line looks like a
 * site, not a to-do list. No placeholder marks, no dashed hints, no empty sections; a "Finish your
 * site" strip in the preview banner links into the editor, where the placeholders show as ghost text.
 */
test.skip(!!process.env.E2E_BASE_URL, 'Needs the local test-mode server')
const SHOTS = process.env.SHOTS_DIR
let n = 0
const freshIp = () => `198.42.${Math.floor(Math.random() * 250)}.${(++n % 250) + 1}`

test('a sparse draft preview shows no placeholders or empty sections, and the finish strip opens the editor on the right section', async ({ page }) => {
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': freshIp() })
  await page.goto('/api/health')
  const { siteId } = await page.evaluate(async () => (await (await fetch('/api/dev/seed?fixture=design:food-truck-sparse', { method: 'POST' })).json()) as { siteId: string })
  for (const path of ['', '/menu', '/about', '/catering', '/contact']) {
    await page.goto(`/d/${siteId}${path}`)
    const site = page.locator('.ys-site')
    await expect(site).toBeVisible()
    await expect(site.locator('.ys-ph, .ys-hint')).toHaveCount(0)
    expect(await site.innerText()).not.toContain('[[')
    // No section on the page is just a heading: each shows more than its title.
    const bare = await site.locator('main section').evaluateAll((els) => els.filter((el) => {
      const h = el.querySelector('h1, h2')?.textContent?.trim() ?? ''
      return (el.textContent ?? '').replace(h, '').trim().length === 0 && !el.querySelector('img, form')
    }).length)
    expect(bare, path || 'home').toBe(0)
  }
  await page.goto(`/d/${siteId}`)
  const h1 = await page.locator('.ys-site h1').innerText()
  expect(h1.toLowerCase()).not.toBe('founding test tacos')
  await expect(page.locator('.ys-site h1 em.ys-accent')).toHaveText('made right here.')
  const strip = page.getByTestId('finish-strip')
  await expect(strip.getByRole('link')).toHaveText(['Add your menu', 'Add your weekly stops', 'Add 3 photos'])
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/d1-sparse-preview-${test.info().project.name}.png`, fullPage: true })

  await strip.getByRole('link', { name: 'Add your menu' }).click()
  await page.waitForURL(/\/sites\/[^/]+\/edit\?page=menu&section=/)
  // In the editor the empty menu is visible and selected; placeholders are ghost text.
  await expect(page.locator('[data-ys-section="menu"]')).toBeVisible()
  await expect(page.locator('.ys-site mark.ys-ph').first()).toBeVisible()
})
