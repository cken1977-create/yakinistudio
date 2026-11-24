import { expect, test, type Page } from '@playwright/test'

/**
 * Phase 2 acceptance: all 8 tutorial steps work on phone and desktop (spec 10.9, 15.3). Each step
 * shows its card and points at a real, visible part of the editor; Skip is remembered; "Show me"
 * on the written tutorial opens the tour at that step. Screenshots feed the written tutorial.
 */
test.skip(!!process.env.E2E_BASE_URL, 'Tutorial tests need the local test-mode server')
const SHOTS = process.env.SHOTS_DIR
let n = 0
const freshIp = () => `198.20.${Math.floor(Math.random() * 250)}.${(++n % 250) + 1}`

async function seed(page: Page): Promise<string> {
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': freshIp() })
  await page.goto('/api/health')
  return page.evaluate(async () => ((await (await fetch('/api/dev/seed?fixture=kit-food-truck', { method: 'POST' })).json()) as { siteId: string }).siteId)
}

const STEPS = ['pages', 'text', 'photo', 'sections', 'chat', 'phone', 'publish', 'domain']

test('the guided tour walks all 8 steps, each pointing at something real', async ({ page }, info) => {
  const siteId = await seed(page)
  await page.goto(`/sites/${siteId}/edit`)
  const card = page.getByRole('dialog').filter({ has: page.locator('#tour-title') })
  for (let i = 0; i < STEPS.length; i++) {
    await expect(card).toHaveAttribute('data-tour-step', STEPS[i])
    await expect(card.getByText(`Step ${i + 1} of 8`)).toBeVisible()
    if (STEPS[i] !== 'domain') {
      // The highlight ring sits over a visible target.
      const ring = page.locator('div[aria-hidden="true"].fixed.z-40')
      await expect(ring).toBeVisible()
      const box = await ring.boundingBox()
      expect(box && box.width > 12 && box.height > 12, `${STEPS[i]} target`).toBe(true)
    }
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/tutorial-${STEPS[i]}-${info.project.name === 'phone-390' ? '390' : '1280'}.png` })
    await card.getByRole('button', { name: i === STEPS.length - 1 ? 'Done' : 'Next' }).click()
  }
  await expect(card).toHaveCount(0)
  // Finished: it doesn't come back.
  await page.reload()
  await page.waitForTimeout(800)
  await expect(card).toHaveCount(0)
})

test('Skip is remembered, and “Show me” starts at that step', async ({ page }) => {
  const siteId = await seed(page)
  await page.goto(`/sites/${siteId}/edit`)
  const card = page.getByRole('dialog').filter({ has: page.locator('#tour-title') })
  await expect(card).toBeVisible()
  await card.getByRole('button', { name: 'Skip tour' }).click()
  await page.reload()
  await page.waitForTimeout(800)
  await expect(card).toHaveCount(0)

  await page.goto(`/sites/${siteId}/tutorial`)
  await expect(page.getByRole('heading', { level: 2 })).toHaveCount(8)
  await page.locator('#photo').getByRole('link', { name: 'Show me' }).click()
  await expect(card).toHaveAttribute('data-tour-step', 'photo')
})
