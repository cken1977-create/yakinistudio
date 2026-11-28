import { expect, test, type Locator, type Page } from '@playwright/test'

/**
 * Phase 2 acceptance in a real browser (spec 15.3, 16.6), at 390 and 1280: claim → editor → click
 * edit → autosave → reload keeps it; every section on every page can be picked and changed by
 * click; two windows get the conflict message and nothing is lost; chat proposals apply and the
 * brand can't be changed; versions restore. Test mode only (stand-in model, in-memory store).
 */
test.skip(!!process.env.E2E_BASE_URL, 'Editor tests need the local test-mode server')
const SHOTS = process.env.SHOTS_DIR

let n = 0
const freshIp = () => `198.19.${Math.floor(Math.random() * 250)}.${(++n % 250) + 1}`
const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1280) < 1024

type Doc = { business: { name: string }; pages: { id: string; title: string; sections: { id: string; type: string; hidden: boolean; props: unknown }[] }[] }

/** Make a draft from a fixture; the browser itself keeps the draft cookie, as after a real hand-off. */
async function seed(page: Page, fixture: string): Promise<string> {
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': freshIp() })
  await page.goto('/api/health')
  const out = await page.evaluate(async (f) => { const r = await fetch(`/api/dev/seed?fixture=${f}`, { method: 'POST' }); return { status: r.status, body: await r.json() as { siteId: string } } }, fixture)
  expect(out.status).toBe(201)
  return out.body.siteId
}
/** The draft as the server has it saved (read with this browser's own access). */
async function saved(page: Page, siteId: string): Promise<Doc & { brand: unknown }> {
  return page.evaluate(async (id) => ((await (await fetch(`/api/drafts/${id}`, { cache: 'no-store' })).json()) as { doc: Doc & { brand: unknown } }).doc, siteId)
}

/** The panel where the selected section's fields show: right column on desktop, a sheet on phones. */
function inspector(page: Page): Locator {
  return isPhone(page) ? page.locator('[role="dialog"][aria-label="edit"]') : page.locator('aside[aria-label="Editing tools"] [role="tabpanel"]')
}
async function pick(page: Page, sectionId: string) {
  const s = page.locator(`[data-ys-section="${sectionId}"]`)
  await s.evaluate((el) => el.scrollIntoView({ block: 'start' }))
  // Click just inside the section's top-left corner, away from its links and buttons.
  await s.click({ position: { x: 4, y: 10 } })
  await expect(inspector(page).locator(`[data-inspector-section="${sectionId}"]`)).toBeVisible()
}
async function closeSheet(page: Page) {
  if (!isPhone(page)) return
  const sheet = page.locator('[role="dialog"][aria-label="edit"]')
  if (await sheet.isVisible()) {
    await sheet.getByRole('button', { name: 'Close' }).first().click()
    await expect(sheet).toBeHidden()
  }
}
/** The tour starts on a first visit; these tests skip it (Escape), which is remembered. */
async function skipTour(page: Page) {
  const card = page.locator('[data-tour-step]')
  if (await card.waitFor({ state: 'visible', timeout: 2500 }).then(() => true, () => false)) {
    await page.keyboard.press('Escape')
    await expect(card).toHaveCount(0)
  }
}
async function openEditor(page: Page, url: string) {
  await page.goto(url)
  await skipTour(page)
}
const nextSave = (page: Page) => page.waitForResponse((r) => r.url().includes('/draft') && r.request().method() === 'PATCH' && r.status() === 200)

async function signInAndClaim(page: Page, siteId: string, email: string) {
  await page.goto(`/d/${siteId}`)
  await page.getByRole('link', { name: 'Make it mine' }).click()
  await page.waitForURL(/\/signin/)
  await page.getByLabel('Email').fill(email)
  await page.getByRole('button', { name: 'Email me a code' }).click()
  await page.getByLabel('6-digit code').fill('246810')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL(new RegExp(`/claim/${siteId}`))
  await page.getByLabel(/This is my business/).check()
  await page.getByRole('button', { name: 'Make it mine' }).click()
  await page.waitForURL(new RegExp(`/sites/${siteId}/edit`))
  await skipTour(page)
}

test('claim → editor → click edit headline → autosave → reload keeps it', async ({ page }, info) => {
  const siteId = await seed(page, 'kit-food-truck')
  await signInAndClaim(page, siteId, `owner-${info.project.name}-${Date.now()}@example.com`)
  await expect(page.getByText('It’s yours.')).toBeVisible()
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/editor-${info.project.name}.png`, fullPage: false })

  await pick(page, 'hero')
  const save = nextSave(page)
  await inspector(page).getByLabel('Headline', { exact: true }).fill('We cater weddings and parties')
  await expect(page.locator('[data-ys-section="hero"]')).toContainText('We cater weddings and parties') // shown at once
  await save
  await page.reload()
  await expect(page.locator('[data-ys-section="hero"]')).toContainText('We cater weddings and parties')

  // Undo puts it back, and that is saved too.
  await closeSheet(page)
  await pick(page, 'hero')
  await inspector(page).getByLabel('Headline', { exact: true }).fill('Fresh tacos, every day')
  await nextSave(page)
  const undo = nextSave(page)
  await page.getByRole('button', { name: 'Undo' }).click()
  await undo
  expect(JSON.stringify((await saved(page, siteId)).pages[0])).toContain('We cater weddings and parties')
})

test('every section on every page can be picked and changed by click', async ({ page }) => {
  test.setTimeout(240_000)
  const siteId = await seed(page, 'food-truck-every-section')
  const before = await saved(page, siteId)
  const touched: string[] = []
  for (const p of before.pages) {
    await openEditor(page, `/sites/${siteId}/edit?page=${p.id}`)
    for (const s of p.sections.filter((x) => !x.hidden)) {
      await pick(page, s.id)
      const panel = inspector(page)
      // The first filled-in text box of this section: change it and wait for the save.
      const box = panel.locator('input:not([type]), input[type="text"], textarea').filter({ hasNot: page.locator('[readonly]') })
      const count = await box.count()
      let changed = false
      for (let i = 0; i < count && !changed; i++) {
        const el = box.nth(i)
        const v = await el.inputValue()
        if (!v || v.length > 60) continue
        const save = nextSave(page)
        await el.fill(`${v.slice(0, 50)} ok`)
        await save
        changed = true
      }
      if (!changed && count > 0) {
        // Only empty optional boxes: filling one in is a change too.
        const save = nextSave(page)
        await box.first().fill('Hello')
        await save
        changed = true
      }
      if (changed) touched.push(`${p.id}/${s.id}`)
      else expect(['footer'], `${s.type} has no text to change`).toContain(s.type)
      await closeSheet(page)
    }
  }
  const after = await saved(page, siteId)
  for (const key of touched) {
    const [pid, sid] = key.split('/')
    const a = before.pages.find((x) => x.id === pid)!.sections.find((x) => x.id === sid)!
    const b = after.pages.find((x) => x.id === pid)!.sections.find((x) => x.id === sid)!
    expect(JSON.stringify(b.props), key).not.toBe(JSON.stringify(a.props))
  }
  expect(touched.length).toBeGreaterThan(10)
})

test('photos, lists and section tools work by click', async ({ page }) => {
  const siteId = await seed(page, 'food-truck-every-section')
  const before = await saved(page, siteId)
  const menuPage = before.pages.find((p) => p.sections.some((s) => s.type === 'menu'))!
  const menu = menuPage.sections.find((s) => s.type === 'menu')!
  await openEditor(page, `/sites/${siteId}/edit?page=${menuPage.id}`)
  await pick(page, menu.id)
  const panel = inspector(page)
  const dishes = panel.getByRole('group', { name: /^Dishes/ }).first()
  const rows = await dishes.locator(':scope > ol > li').count()
  let save = nextSave(page)
  await dishes.getByRole('button', { name: '+ Add' }).click()
  await save
  await expect(dishes.locator(':scope > ol > li')).toHaveCount(rows + 1)

  // Change style, hide and show, move: each saves.
  save = nextSave(page)
  await panel.getByRole('button', { name: 'Hide' }).click()
  await save
  await expect(page.locator(`[data-ys-section="${menu.id}"]`)).toHaveCount(0)
  save = nextSave(page)
  await panel.getByRole('button', { name: 'Show' }).click()
  await save
  await expect(page.locator(`[data-ys-section="${menu.id}"]`)).toHaveCount(1)

  // A photo from the kit, with its description.
  await openEditor(page, `/sites/${siteId}/edit`)
  const heroId = before.pages[0].sections.find((s) => s.type === 'hero')!.id
  await pick(page, heroId)
  await inspector(page).getByRole('button', { name: /Change photo|Add a photo/ }).first().click()
  const picker = page.getByRole('dialog', { name: /Choose a photo/ })
  await picker.getByRole('tab', { name: 'Kit photos' }).click()
  await picker.locator('ul button').first().click()
  await picker.getByLabel('Describe the photo').fill('Tacos on the grill')
  save = nextSave(page)
  await picker.getByRole('button', { name: 'Use this photo' }).click()
  await save
  expect(JSON.stringify((await saved(page, siteId)).pages[0])).toContain('Tacos on the grill')
})

test('with two windows open, the second save gets the conflict message and nothing is lost', async ({ page, context }) => {
  const siteId = await seed(page, 'kit-food-truck')
  await openEditor(page, `/sites/${siteId}/edit`)
  const other = await context.newPage()
  await openEditor(other, `/sites/${siteId}/edit`)

  await pick(page, 'hero')
  let save = nextSave(page)
  await inspector(page).getByLabel('Headline', { exact: true }).fill('Saved in window one')
  await save

  await pick(other, 'hero')
  const conflict = other.waitForResponse((r) => r.url().includes('/draft') && r.request().method() === 'PATCH' && r.status() === 409)
  await inspector(other).getByLabel('Headline', { exact: true }).fill('Typed in window two')
  await conflict
  await expect(other.getByRole('alert').filter({ hasText: 'This site was changed in another window. We loaded the latest version.' })).toBeVisible()
  await expect(other.locator('[data-ys-section="hero"]')).toContainText('Saved in window one')
  expect(JSON.stringify((await saved(page, siteId)).pages[0])).toContain('Saved in window one')

  // Window two carries on from the latest version.
  await closeSheet(other)
  await pick(other, 'hero')
  save = nextSave(other)
  await inspector(other).getByLabel('Headline', { exact: true }).fill('Now from window two')
  await save
  expect(JSON.stringify((await saved(page, siteId)).pages[0])).toContain('Now from window two')
})

test('chat proposes a change, Apply saves it, and brand colors stay as they are', async ({ page }) => {
  const siteId = await seed(page, 'kit-food-truck')
  await openEditor(page, `/sites/${siteId}/edit`)
  if (isPhone(page)) await page.getByRole('navigation', { name: 'Editor' }).getByRole('button', { name: 'Chat' }).click()
  else await page.getByRole('tab', { name: 'Chat' }).click()

  await page.getByLabel('Your request', { exact: true }).fill('Make the hero say we cater weddings')
  await page.getByRole('button', { name: 'Send' }).click()
  await expect(page.getByText('Here’s the change.')).toBeVisible()
  expect(JSON.stringify((await saved(page, siteId)).pages[0])).not.toMatch(/wedding/i) // nothing saved yet
  const save = nextSave(page)
  await page.getByRole('button', { name: 'Apply' }).click()
  await save
  expect(JSON.stringify((await saved(page, siteId)).pages[0])).toMatch(/wedding/i)

  const colors = JSON.stringify((await saved(page, siteId)).brand)
  await page.getByLabel('Your request', { exact: true }).fill('Change my colors to red')
  await page.getByRole('button', { name: 'Send' }).click()
  await expect(page.getByText(/Brand/).last()).toBeVisible()
  expect(JSON.stringify((await saved(page, siteId)).brand)).toBe(colors)
})

test('saving a version and restoring it brings the old page back', async ({ page }, info) => {
  const siteId = await seed(page, 'kit-food-truck')
  await signInAndClaim(page, siteId, `versions-${info.project.name}-${Date.now()}@example.com`)
  await pick(page, 'hero')
  let save = nextSave(page)
  await inspector(page).getByLabel('Headline', { exact: true }).fill('Spring menu is here')
  await save
  await page.goto(`/sites/${siteId}/versions`)
  await page.getByLabel(/Note/).fill('Spring')
  await page.getByRole('button', { name: 'Save a version' }).click()
  await expect(page.getByText('Spring', { exact: false }).first()).toBeVisible()

  await openEditor(page, `/sites/${siteId}/edit`)
  await pick(page, 'hero')
  save = nextSave(page)
  await inspector(page).getByLabel('Headline', { exact: true }).fill('Summer menu is here')
  await save

  await page.goto(`/sites/${siteId}/versions`)
  page.once('dialog', (d) => void d.accept())
  await page.locator('li', { hasText: 'Spring' }).getByRole('button', { name: 'Restore this version' }).click()
  await page.waitForURL(new RegExp(`/sites/${siteId}/edit`))
  await expect(page.locator('[data-ys-section="hero"]')).toContainText('Spring menu is here')
})

test('"Try the new look": opt-in preview, keep or undo in one click, colors untouched, live site unchanged', async ({ page }) => {
  const siteId = await seed(page, 'food-truck-every-section') // an older site: classic look
  const before = await saved(page, siteId) as Doc & { brand: unknown; style: { preset: string } }
  expect(before.style.preset).toBe('classic')
  await openEditor(page, `/sites/${siteId}/edit`)
  // Never switched for anyone: the page is still classic until the owner asks.
  await expect(page.locator('.ys-site')).toHaveAttribute('data-preset', 'classic')
  if (isPhone(page)) await page.locator('[data-tour="edit-phone"]').click()
  const panel = inspector(page)
  const offer = panel.locator('[data-new-look="offer"]')
  await expect(offer).toBeVisible()
  await expect(offer).toContainText('Your colors, logo and words stay exactly as they are')

  // Preview: the page in the middle changes at once, and the draft (not the live site) is saved.
  let save = nextSave(page)
  await offer.getByRole('button', { name: 'Preview the new look' }).click()
  await expect(page.locator('.ys-site')).toHaveAttribute('data-preset', 'signature')
  await save
  const trying = await saved(page, siteId) as Doc & { brand: unknown; style: { preset: string } }
  expect(trying.style.preset).toBe('signature')
  expect(trying.brand).toEqual(before.brand) // R6
  expect(trying.pages).toEqual(before.pages)
  await expect(panel.locator('[data-new-look="trying"]')).toContainText('Your live site doesn’t change until you publish')

  // One-click undo puts the original look back, saved.
  save = nextSave(page)
  await panel.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(page.locator('.ys-site')).toHaveAttribute('data-preset', 'classic')
  await save
  expect(((await saved(page, siteId)) as unknown as { style: unknown }).style).toEqual((before as unknown as { style: unknown }).style)

  // Try again and keep it: it stays after a reload.
  save = nextSave(page)
  await panel.locator('[data-new-look="offer"]').getByRole('button', { name: 'Preview the new look' }).click()
  await save
  await panel.getByRole('button', { name: 'Keep the new look' }).click()
  await page.reload()
  await skipTour(page)
  await expect(page.locator('.ys-site')).toHaveAttribute('data-preset', 'signature')
})
