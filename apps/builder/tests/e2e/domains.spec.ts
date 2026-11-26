import { expect, test, type Page } from '@playwright/test'

/**
 * Phase 5a acceptance in a real browser at 390 and 1280: a paying owner connects their own domain,
 * sees the DNS records, the domain goes live and becomes the main address, then is removed.
 * Test mode only: Vercel is never contacted; /api/dev/domains plays the part of DNS.
 */
test.skip(!!process.env.E2E_BASE_URL, 'Domain tests need the local test-mode server')
const SHOTS = process.env.SHOTS_DIR
const PORT = Number(process.env.E2E_PORT || 3100)

let n = 0
const freshIp = () => `198.41.${Math.floor(Math.random() * 250)}.${(++n % 250) + 1}`
const uniq = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

async function shot(page: Page, name: string) {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/phase5-${name}-${test.info().project.name}.png`, fullPage: true })
}
async function paidPublishedSite(page: Page): Promise<{ siteId: string; slug: string }> {
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
  expect((await page.request.post('/api/dev/state', { data: { action: 'plan', siteId, plan: true } })).status()).toBe(200)
  await page.goto(`/sites/${siteId}/publish`)
  const slug = `dom-${uniq()}`
  await page.getByLabel('Pick the first part of your address').fill(slug)
  await expect(page.locator('#slug-msg')).toContainText('is free')
  await page.getByTestId('publish').click()
  await expect(page.getByText(`${slug}.yakini.digital`).first()).toBeVisible({ timeout: 20_000 })
  return { siteId, slug }
}
const visit = (page: Page, host: string) => page.request.get(`http://localhost:${PORT}/`, { headers: { host }, failOnStatusCode: false, maxRedirects: 0 })

test('an owner connects their own domain, adds the records, it goes live as the main address, then removes it', async ({ page }) => {
  const { siteId, slug } = await paidPublishedSite(page)
  const name = `mesa${uniq()}.com`

  await page.reload()
  await page.getByRole('link', { name: 'Use your own domain' }).click()
  await page.waitForURL(new RegExp(`/sites/${siteId}/domain`))
  await shot(page, 'domain-empty')
  await page.getByLabel('Your domain').fill(`www.${name}`)
  await page.getByRole('button', { name: 'Connect domain' }).click()
  await expect(page.getByRole('status')).toContainText('Domain added')
  const records = page.getByTestId('dns-records')
  await expect(records).toContainText('216.150.1.1')
  await expect(records.locator('tbody tr')).toHaveCount(2)
  await expect(records).toContainText('CNAME')
  await expect(page.getByTestId('domain-status').first()).toContainText('Waiting for your DNS records')
  await shot(page, 'domain-records')

  // Not live yet: the free address still serves the site.
  expect((await visit(page, `${slug}.yakini.digital`)).status()).toBe(200)

  // The owner adds the records; DNS catches up; Check now.
  for (const h of [name, `www.${name}`]) expect((await page.request.post('/api/dev/domains', { data: { name: h, pointed: true } })).status()).toBe(200)
  await page.getByRole('button', { name: 'Check now' }).click()
  await expect(page.getByRole('status')).toContainText('Your domain works')
  await expect(page.getByTestId('domain-status').first()).toContainText('Working')
  await expect(page.getByTestId('domain-status').first()).toContainText('(main address)')
  await expect(page.getByTestId('dns-records')).toHaveCount(0)
  await shot(page, 'domain-live')

  // The domain serves the site; the free address and www forward to it.
  expect((await visit(page, name)).status()).toBe(200)
  for (const h of [`${slug}.yakini.digital`, `www.${name}`]) {
    const r = await visit(page, h)
    expect([301, 302, 307, 308]).toContain(r.status())
    expect(r.headers().location).toMatch(new RegExp(`^https://${name.replace(/\./g, '\\.')}/?`))
  }

  // Remove: needs the tick; the free address is main again.
  await page.getByLabel(`I want to remove ${name}`).check()
  await page.getByRole('button', { name: 'Remove domain' }).click()
  await expect(page.getByRole('status')).toContainText('Domain removed')
  await expect(page.getByRole('button', { name: 'Connect domain' })).toBeVisible()
  expect((await visit(page, `${slug}.yakini.digital`)).status()).toBe(200)
  expect((await visit(page, name)).status()).not.toBe(200)
})

test('a domain that needs ownership proof shows the TXT record', async ({ page }) => {
  const { siteId } = await paidPublishedSite(page)
  await page.goto(`/sites/${siteId}/domain`)
  await page.getByLabel('Your domain').fill(`shop.needs-txt${uniq()}.org`)
  await page.getByRole('button', { name: 'Connect domain' }).click()
  await expect(page.getByTestId('dns-records')).toContainText('TXT')
  await expect(page.getByTestId('dns-records')).toContainText('vc-domain-verify=')
  await expect(page.getByTestId('domain-status').first()).toContainText('Waiting for the TXT record')
  await shot(page, 'domain-txt')
})
