import { expect, test, type Page } from '@playwright/test'

/**
 * Phase 4 acceptance in a real browser at 390 and 1280: the operator sets up plans, an owner pays
 * through the stand-in PayPal page, publishes without an operator, turns on search engines, and
 * cancels. Test mode only: PayPal is never contacted.
 */
test.skip(!!process.env.E2E_BASE_URL, 'Billing tests need the local test-mode server')
const SHOTS = process.env.SHOTS_DIR
const PORT = Number(process.env.E2E_PORT || 3100)

let n = 0
const freshIp = () => `198.40.${Math.floor(Math.random() * 250)}.${(++n % 250) + 1}`
const uniq = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

async function shot(page: Page, name: string) {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/phase4-${name}-${test.info().project.name}.png`, fullPage: true })
}
async function signIn(page: Page, email: string) {
  await page.goto('/signin')
  await page.getByLabel('Email').fill(email)
  await page.getByRole('button', { name: 'Email me a code' }).click()
  await page.getByLabel('6-digit code').fill('246810')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL((u) => !u.pathname.startsWith('/signin'))
}
async function plansReady(page: Page) {
  const email = `ops-${uniq()}@yakini.example`
  expect((await page.request.post('/api/dev/state', { data: { action: 'operator', email, canOverridePublish: false, canTakedown: false } })).status()).toBe(200)
  await signIn(page, email)
  await page.goto('/ops/billing')
  await page.getByRole('button', { name: 'Set up plans in PayPal' }).click()
  await expect(page.getByRole('status')).toContainText('PayPal plans are set up')
  await expect(page.locator('table tbody tr').first()).toBeVisible()
  await shot(page, 'ops-billing')
  await page.context().clearCookies()
}
async function ownerSite(page: Page): Promise<string> {
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': freshIp() })
  await page.goto('/api/health')
  const { siteId } = await page.evaluate(async () => (await (await fetch('/api/dev/seed?fixture=kit-ready', { method: 'POST' })).json()) as { siteId: string })
  await page.goto(`/d/${siteId}`)
  await page.getByRole('link', { name: 'Make it mine' }).click()
  await page.waitForURL((u) => u.pathname.startsWith('/signin') || u.pathname.startsWith(`/claim/${siteId}`))
  if (new URL(page.url()).pathname.startsWith('/signin')) {
    await page.getByLabel('Email').fill(`owner-${uniq()}@mesa.example`)
    await page.getByRole('button', { name: 'Email me a code' }).click()
    await page.getByLabel('6-digit code').fill('246810')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(new RegExp(`/claim/${siteId}`))
  }
  await page.getByLabel(/This is my business/).check()
  await page.getByRole('button', { name: 'Make it mine' }).click()
  await page.waitForURL(new RegExp(`/sites/${siteId}/edit`))
  expect((await page.request.post('/api/dev/state', { data: { action: 'plan', siteId, plan: false } })).status()).toBe(200)
  return siteId
}
/** Plan page → Continue to PayPal → approve on the stand-in → back on the plan page. */
async function pay(page: Page, siteId: string) {
  await page.goto(`/sites/${siteId}/publish`)
  await page.getByRole('link', { name: 'Choose a plan' }).click()
  await page.waitForURL(new RegExp(`/sites/${siteId}/plan`))
  // The real PayPal page is on another site: the browser must be allowed to follow the form there.
  const csp = (await page.request.get(`/sites/${siteId}/plan`)).headers()['content-security-policy'] ?? ''
  expect(csp).toContain("form-action 'self' https://www.paypal.com https://www.sandbox.paypal.com")
  await expect(page.getByText('Recommended for your site')).toBeVisible()
  await shot(page, 'plan-choose')
  await page.getByRole('button', { name: 'Continue to PayPal' }).first().click()
  await page.waitForURL(/\/dev\/paypal\?subscription_id=I-\d{6}/)
  const subId = new URL(page.url()).searchParams.get('subscription_id')!
  await shot(page, 'paypal-standin')
  await page.getByRole('button', { name: 'Agree and subscribe' }).click()
  await page.waitForURL(new RegExp(`/sites/${siteId}/plan\\?paid=1`))
  await expect(page.getByTestId('plan-status')).toContainText('Active')
  await expect(page.getByText('Thanks! You can publish your site now.')).toBeVisible()
  await shot(page, 'plan-active')
  return subId
}

test('an owner pays through PayPal, publishes without an operator, turns on search engines, and cancels', async ({ page }) => {
  await plansReady(page)
  const siteId = await ownerSite(page)
  await pay(page, siteId)

  // Publish with no operator involved.
  await page.getByRole('link', { name: 'Go to Publish' }).click()
  const slug = `paid-${uniq()}`
  await page.getByLabel('Pick the first part of your address').fill(slug)
  await expect(page.locator('#slug-msg')).toContainText('is free')
  await page.getByTestId('publish').click()
  await expect(page.getByText(`${slug}.yakini.digital`).first()).toBeVisible({ timeout: 20_000 })
  const live = () => page.request.get(`http://localhost:${PORT}/`, { headers: { host: `${slug}.yakini.digital` }, failOnStatusCode: false })
  expect((await live()).status()).toBe(200)
  expect(await (await live()).text()).toMatch(/noindex/)

  // Search engines on: the live page drops noindex.
  await page.reload()
  await page.getByRole('button', { name: 'Turn on' }).click()
  await expect(page.getByTestId('indexing-state')).toHaveText('On')
  await expect(page.getByRole('status').first()).toContainText('Search engines can now find your site')
  await shot(page, 'publish-indexing')
  await expect.poll(async () => /name="robots" content="noindex/.test(await (await live()).text()), { timeout: 15_000 }).toBe(false)

  // Cancel: stays live for the paid month.
  await page.goto(`/sites/${siteId}/plan`)
  await page.getByLabel('I want to cancel my plan').check()
  await page.getByRole('button', { name: 'Cancel plan' }).click()
  await expect(page.getByRole('status').first()).toContainText('Your plan is canceled')
  await expect(page.getByTestId('plan-status')).toContainText('Canceled')
  await shot(page, 'plan-canceled')
  expect((await live()).status()).toBe(200)
})

test('a failed payment shows the owner a banner; the site stays live', async ({ page }) => {
  await plansReady(page)
  const siteId = await ownerSite(page)
  const subId = await pay(page, siteId)
  const r = await page.request.post('/api/dev/paypal', { data: { action: 'set', subscriptionId: subId, status: 'SUSPENDED' } })
  expect(await r.json()).toEqual({ webhook: 200 })
  await page.goto(`/sites/${siteId}/publish`)
  await expect(page.getByText('PayPal couldn’t take your last payment')).toBeVisible()
  await shot(page, 'past-due')
  await page.goto(`/sites/${siteId}/plan`)
  await expect(page.getByTestId('plan-status')).toContainText('Payment didn’t go through')
})

test('leaving PayPal without paying changes nothing', async ({ page }) => {
  await plansReady(page)
  const siteId = await ownerSite(page)
  await page.goto(`/sites/${siteId}/plan`)
  await page.getByRole('button', { name: 'Continue to PayPal' }).first().click()
  await page.getByRole('button', { name: 'Cancel and return' }).click()
  await page.waitForURL(new RegExp(`/sites/${siteId}/plan\\?canceled=1`))
  await expect(page.getByText('No payment was made.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Continue to PayPal' }).first()).toBeVisible()
})
