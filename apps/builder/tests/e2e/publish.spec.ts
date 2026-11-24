import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test'

/**
 * Phase 3 acceptance in a real browser (spec 15.4, 16.6 #5-7, #11-12, 16.7) at 390 and 1280.
 * Client sites are opened by their own host names (*.yakini.digital → this machine).
 * Test mode only: in-memory store, alerts kept in a test outbox, a paid plan set through the
 * test-only state route (billing is Phase 4).
 */
test.skip(!!process.env.E2E_BASE_URL, 'Publish tests need the local test-mode server')
const SHOTS = process.env.SHOTS_DIR
const PORT = Number(process.env.E2E_PORT || 3100)
const site = (host: string, path = '/') => `http://${host}:${PORT}${path}`

let n = 0
const freshIp = () => `198.20.${Math.floor(Math.random() * 250)}.${(++n % 250) + 1}`
const uniq = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
type Mail = { to: string[]; subject: string; text: string; tag: string }

async function shot(page: Page, name: string) {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/phase3-${name}-${test.info().project.name}.png`, fullPage: false })
}
async function skipTour(page: Page) {
  const card = page.locator('[data-tour-step]')
  if (await card.waitFor({ state: 'visible', timeout: 2500 }).then(() => true, () => false)) await page.keyboard.press('Escape')
}
async function seed(page: Page, fixture: string): Promise<string> {
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': freshIp() })
  await page.goto('/api/health')
  const out = await page.evaluate(async (f) => { const r = await fetch(`/api/dev/seed?fixture=${f}`, { method: 'POST' }); return (await r.json()) as { siteId: string } }, fixture)
  return out.siteId
}
async function signIn(page: Page, email: string) {
  await page.goto('/signin')
  await page.getByLabel('Email').fill(email)
  await page.getByRole('button', { name: 'Email me a code' }).click()
  await page.getByLabel('6-digit code').fill('246810')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL((u) => !u.pathname.startsWith('/signin'))
}
async function claim(page: Page, siteId: string, email: string) {
  await page.goto(`/d/${siteId}`)
  await page.getByRole('link', { name: 'Make it mine' }).click()
  await page.waitForURL((u) => u.pathname.startsWith('/signin') || u.pathname.startsWith(`/claim/${siteId}`))
  if (new URL(page.url()).pathname.startsWith('/signin')) {
    await page.getByLabel('Email').fill(email)
    await page.getByRole('button', { name: 'Email me a code' }).click()
    await page.getByLabel('6-digit code').fill('246810')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(new RegExp(`/claim/${siteId}`))
  }
  await page.getByLabel(/This is my business/).check()
  await page.getByRole('button', { name: 'Make it mine' }).click()
  await page.waitForURL(new RegExp(`/sites/${siteId}/edit`))
  await skipTour(page)
}
async function state(page: Page, body: Record<string, unknown>) {
  const r = await page.request.post('/api/dev/state', { data: body })
  expect(r.status()).toBe(200)
}
async function outbox(page: Page): Promise<Mail[]> {
  return ((await (await page.request.get('/api/dev/state')).json()) as { outbox: Mail[] }).outbox
}
/** Seed → claim → plan on → publish from the Publish screen. */
async function published(page: Page, opts: { fixture?: string; plan?: boolean } = {}) {
  const email = `owner-${uniq()}@mesa.example`
  const siteId = await seed(page, opts.fixture ?? 'kit-ready')
  await claim(page, siteId, email)
  await state(page, { action: 'plan', siteId, plan: opts.plan ?? true })
  const slug = `mesa-${uniq()}`
  await page.goto(`/sites/${siteId}/publish`)
  await page.getByLabel('Pick the first part of your address').fill(slug)
  await expect(page.locator('#slug-msg')).toContainText('is free')
  await page.getByTestId('publish').click()
  return { siteId, slug, host: `${slug}.yakini.digital`, email }
}
/** A request to a client host from the test runner (it can't use the browser's host mapping). */
function hostGet(page: Page, url: string) {
  const u = new URL(url)
  return page.request.get(`http://localhost:${PORT}${u.pathname}${u.search}`, { headers: { host: u.host }, failOnStatusCode: false })
}
function hostPost(page: Page, url: string, form: Record<string, string>) {
  const u = new URL(url)
  return page.request.post(`http://localhost:${PORT}${u.pathname}`, { headers: { host: u.host, origin: `http://${u.host}` }, form, failOnStatusCode: false })
}
/** Wait until a client host shows `text` (or the neutral page), returning how long it took. */
async function waitFor(page: Page, url: string, check: (body: string, status: number) => boolean): Promise<number> {
  const t0 = Date.now()
  for (;;) {
    const r = await hostGet(page, url)
    if (check(await r.text(), r.status())) return Date.now() - t0
    if (Date.now() - t0 > 15_000) throw new Error(`timed out waiting for ${url}`)
    await new Promise((res) => setTimeout(res, 250))
  }
}
async function newPage(browser: Browser, opts: Parameters<Browser['newContext']>[0] = {}): Promise<{ ctx: BrowserContext; page: Page }> {
  const info = test.info().project.use
  const ctx = await browser.newContext({ ...info, baseURL: `http://localhost:${PORT}`, extraHTTPHeaders: { 'x-forwarded-for': freshIp() }, ...opts })
  return { ctx, page: await ctx.newPage() }
}

test('publish → live within 10 s; draft edits stay private until republish; rollback within 10 s', async ({ page, browser }) => {
  const s = await published(page)
  await expect(page.getByTestId('live-result')).toBeVisible()
  await shot(page, 'publish-live')
  const first = await waitFor(page, site(s.host), (b, st) => st === 200 && b.includes('Mesa Street Tacos'))
  expect(first).toBeLessThan(10_000)

  // Edit the draft: the live site doesn't change.
  const draft = await page.evaluate(async (id) => (await (await fetch(`/api/drafts/${id}`)).json()) as { rev: number }, s.siteId)
  const save = await page.evaluate(async ([id, rev]) => (await fetch(`/api/sites/${id}/draft`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ baseRev: rev, source: 'click', ops: [{ op: 'update_business', field: 'tagline', value: 'Draft only tagline' }] }) })).status, [s.siteId, draft.rev] as const)
  expect(save).toBe(200)
  expect(await (await hostGet(page, site(s.host))).text()).not.toContain('Draft only tagline')

  // Republish: live within 10 s.
  await page.goto(`/sites/${s.siteId}/publish`)
  await page.getByTestId('publish').click()
  await expect(page.getByTestId('live-result')).toBeVisible()
  expect(await waitFor(page, site(s.host), (b) => b.includes('Draft only tagline'))).toBeLessThan(10_000)

  // Roll back to version 1 of the live site: within 10 s.
  await page.goto(`/sites/${s.siteId}/publish`)
  page.once('dialog', (d) => void d.accept())
  await page.getByRole('button', { name: 'Roll back to this' }).first().click()
  await page.waitForLoadState('load')
  expect(await waitFor(page, site(s.host), (b) => !b.includes('Draft only tagline') && b.includes('Mesa Street Tacos'))).toBeLessThan(10_000)

  // The live site itself, at this width (a fresh visitor; the owner's page is reloading).
  const { ctx, page: visitor } = await newPage(browser)
  await visitor.goto(site(s.host))
  await expect(visitor.getByRole('link', { name: 'Report this site' })).toBeVisible()
  await shot(visitor, 'live-site')
  await visitor.goto(site(s.host, '/menu'))
  await shot(visitor, 'live-menu')
  await ctx.close()
})

test('reserved and taken addresses are refused on the Publish screen', async ({ page }) => {
  const a = await published(page)
  await expect(page.getByTestId('live-result')).toBeVisible()
  const siteId = await seed(page, 'kit-ready')
  await claim(page, siteId, `owner-${uniq()}@mesa.example`)
  await state(page, { action: 'plan', siteId, plan: true })
  await page.goto(`/sites/${siteId}/publish`)
  const field = page.getByLabel('Pick the first part of your address')
  await field.fill('portal')
  await expect(page.locator('#slug-msg')).toContainText('reserved')
  await expect(page.getByTestId('publish')).toBeDisabled()
  await field.fill(a.slug)
  await expect(page.locator('#slug-msg')).toContainText('taken')
  await expect(page.getByTestId('publish')).toBeDisabled()
  await shot(page, 'slug-taken')
})

test('JS-off form post is stored, the owner gets an alert, the visitor gets nothing; thanks page', async ({ page, browser }) => {
  const s = await published(page)
  await expect(page.getByTestId('live-result')).toBeVisible()
  const { ctx, page: visitor } = await newPage(browser, { javaScriptEnabled: false })
  await visitor.goto(site(s.host, '/contact'))
  await visitor.waitForTimeout(3500) // a person takes more than 3 seconds; the form checks it
  await visitor.getByLabel('Your name').fill('Ana Ruiz')
  await visitor.getByLabel('Email').first().fill('ana@visitor.example')
  const ask = `Can you cater 40 people on Saturday? (${s.slug})`
  await visitor.getByLabel(/Message/).fill(ask)
  await visitor.getByRole('button', { name: /send/i }).first().click()
  await visitor.waitForURL(/\/thanks/)
  await expect(visitor.getByRole('heading', { name: /on its way/ })).toBeVisible()
  await shot(visitor, 'thanks')
  await ctx.close()

  const mail = (await outbox(page)).filter((m) => m.text.includes(ask))
  expect(mail).toHaveLength(1)
  expect(mail[0].to).toEqual([s.email])
  expect((await outbox(page)).flatMap((m) => m.to)).not.toContain('ana@visitor.example')
  await page.goto(`/sites/${s.siteId}/forms`)
  await expect(page.getByText(ask)).toBeVisible()
  await shot(page, 'messages')
})

test('Report link on the live site, a share-link preview and the draft preview; a JS-off report is stored and only operators are alerted', async ({ page, browser }) => {
  const s = await published(page)
  await expect(page.getByTestId('live-result')).toBeVisible()
  await page.goto(site(s.host))
  await expect(page.getByRole('link', { name: 'Report this site' })).toHaveAttribute('href', new RegExp(`/report\\?site=${s.siteId}$`))

  await page.goto('/api/health')
  const link = await page.evaluate(async (id) => (await (await fetch(`/api/sites/${id}/share-links`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })).json()) as { url: string }, s.siteId)
  const share = new URL(link.url)
  const { ctx: friendCtx, page: friend } = await newPage(browser)
  const res = await friend.goto(`${share.pathname}${share.search}`)
  expect(res!.headers()['x-robots-tag']).toContain('noindex')
  await expect(friend.getByText('Preview, not a live site.')).toBeVisible()
  await expect(friend.getByRole('link', { name: 'Report this site' }).first()).toBeVisible()
  await shot(friend, 'share-preview')
  await friendCtx.close()

  await page.goto(`/d/${s.siteId}`)
  await expect(page.getByRole('link', { name: 'Report this site' }).first()).toBeVisible()
  await shot(page, 'draft-preview')

  const { ctx, page: reporter } = await newPage(browser, { javaScriptEnabled: false })
  await reporter.goto(`/report?site=${s.siteId}`)
  await reporter.waitForTimeout(3500)
  await reporter.getByLabel('Uses my photos, logo or writing').check()
  await reporter.getByLabel('What did you see?').fill(`These are my photos. ${s.slug}`)
  await reporter.getByLabel(/Your email/).fill('reporter@example.test')
  await shot(reporter, 'report-form')
  await reporter.getByRole('button', { name: 'Send report' }).click()
  await expect(reporter.getByTestId('report-ref')).toHaveText(/^[A-Z0-9]{8}$/)
  await shot(reporter, 'report-done')
  await ctx.close()
  const mail = await outbox(page)
  expect(mail.some((m) => m.tag === 'report-alert' && m.text.includes(`These are my photos. ${s.slug}`))).toBe(true)
  expect(mail.flatMap((m) => m.to)).not.toContain('reporter@example.test')
  expect(mail.filter((m) => m.tag === 'report-alert').flatMap((m) => m.to)).not.toContain(s.email)
})

test('takedown: neutral 404 within 10 s, share links and forms stop, publish refused; restore brings the same version back', async ({ page, browser }) => {
  const s = await published(page)
  await expect(page.getByTestId('live-result')).toBeVisible()
  const link = await page.evaluate(async (id) => (await (await fetch(`/api/sites/${id}/share-links`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })).json()) as { url: string }, s.siteId)
  // A report so the site shows up in the queue.
  const { ctx: rctx, page: reporter } = await newPage(browser)
  await reporter.goto(`/report?site=${s.siteId}`)
  await reporter.waitForTimeout(3500)
  await reporter.getByLabel('Phishing or scam').check()
  await reporter.getByLabel('What did you see?').fill(`Asked me for my card number. ${s.slug}`)
  await reporter.getByRole('button', { name: 'Send report' }).click()
  await expect(reporter.getByTestId('report-ref')).toBeVisible()
  await rctx.close()

  const opEmail = `ops-${uniq()}@yakini.example`
  await state(page, { action: 'operator', email: opEmail, canOverridePublish: true, canTakedown: true })
  const { ctx, page: op } = await newPage(browser)
  await signIn(op, opEmail)
  await op.goto('/ops/reports')
  const card = op.getByTestId('report').filter({ hasText: `Asked me for my card number. ${s.slug}` })
  await shot(op, 'ops-reports')
  await card.getByRole('button', { name: 'Take down' }).click()
  await expect(op.getByRole('status')).toContainText('Site taken down')
  const down = await waitFor(page, site(s.host), (b, st) => st === 404 && b.includes('This site is unavailable'))
  expect(down).toBeLessThan(10_000)
  const neutral = await hostGet(page, site(s.host))
  expect(neutral.headers()['cache-control']).toContain('no-store')
  expect(await neutral.text()).toMatch(/noindex/)
  await op.goto(site(s.host))
  await shot(op, 'neutral')

  const share = new URL(link.url)
  expect((await page.request.get(`${share.pathname}${share.search}`, { failOnStatusCode: false })).status()).toBe(404)
  const form = await hostPost(page, site(s.host, `/api/f/${s.siteId}/contact`), { name: 'X', email: 'x@visitor.example' })
  expect(form.status()).toBe(410)
  const pub = await page.evaluate(async ([id, slug]) => (await fetch(`/api/sites/${id}/publish`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ slug }) })).status, [s.siteId, s.slug] as const)
  expect(pub).toBe(409)
  await page.goto(`/sites/${s.siteId}/edit`)
  await expect(page.getByRole('alert').filter({ hasText: 'Your site is paused' })).toBeVisible()

  await op.goto('/ops/reports?status=all')
  await op.getByTestId('report').filter({ hasText: `Asked me for my card number. ${s.slug}` }).getByRole('button', { name: 'Restore site' }).click()
  await expect(op.getByRole('status')).toContainText('Site restored')
  expect(await waitFor(page, site(s.host), (b, st) => st === 200 && b.includes('Mesa Street Tacos'))).toBeLessThan(10_000)
  await ctx.close()
})

test('review gate: an override first publish waits; Approve → live within 10 s; Reject → stays on preview; the impersonation fixture is flagged and its share link refused', async ({ page, browser }) => {
  const opEmail = `ops-${uniq()}@yakini.example`
  await state(page, { action: 'operator', email: opEmail, canOverridePublish: true, canTakedown: true })
  const { ctx, page: op } = await newPage(browser)
  await signIn(op, opEmail)

  // Impersonation fixture (16.4): flagged → review; share link refused.
  const imp = await published(page, { fixture: 'impersonation' })
  await expect(page.getByTestId('in-review')).toBeVisible()
  await shot(page, 'in-review')
  const shareStatus = await page.evaluate(async (id) => (await fetch(`/api/sites/${id}/share-links`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })).status, imp.siteId)
  expect(shareStatus).toBe(409)
  expect((await hostGet(page, site(imp.host))).status()).toBe(404)
  await op.goto('/ops/reviews')
  const review = op.getByTestId('review').filter({ has: op.locator(`a[href^="/p/${imp.siteId}"]`) })
  await expect(review).toContainText('Asks visitors to verify or pay')
  await shot(op, 'ops-reviews')
  await review.getByRole('button', { name: 'Approve' }).click()
  await expect(op.getByRole('status')).toContainText('Approved')
  expect(await waitFor(page, site(imp.host), (b, st) => st === 200 && b.includes('Secure Bank'))).toBeLessThan(10_000)

  // Operator override, no plan: first publish waits; Reject keeps it off.
  const siteId = await seed(page, 'kit-ready')
  await claim(page, siteId, `owner-${uniq()}@mesa.example`)
  await state(page, { action: 'operator', email: opEmail, canOverridePublish: true, canTakedown: true })
  await op.goto(`/sites/${siteId}/publish`)
  const slug = `ovr-${uniq()}`
  await op.getByLabel('Pick the first part of your address').fill(slug)
  await op.getByLabel(/Why publish without a plan/).fill('Paid in person, invoice 1042')
  await op.getByTestId('publish').click()
  await expect(op.getByTestId('in-review')).toBeVisible()
  await op.goto('/ops/reviews')
  const ovr = op.getByTestId('review').filter({ has: op.locator(`a[href^="/p/${siteId}"]`) })
  await ovr.getByRole('button', { name: 'Reject' }).click()
  await expect(op.getByRole('status')).toContainText('Rejected')
  expect((await hostGet(page, site(`${slug}.yakini.digital`))).status()).toBe(404)
  await ctx.close()
})

test('site quality (16.7): no broken internal links, no outside requests, no cookies, unknown host neutral, previews noindex, no sideways scroll', async ({ page, browser }) => {
  const s = await published(page)
  await expect(page.getByTestId('live-result')).toBeVisible()
  const { ctx, page: v } = await newPage(browser)
  const outside: string[] = []
  const cookies: string[] = []
  v.on('request', (r) => { const h = new URL(r.url()).hostname; if (h !== s.host && r.url().startsWith('http')) outside.push(r.url()) })
  v.on('response', (r) => { if (r.headers()['set-cookie']) cookies.push(r.url()) })

  // Crawl every internal link from the home page (spec 15.4: 0 broken internal links).
  const seen = new Set<string>(), queue = ['/']
  const broken: string[] = []
  while (queue.length) {
    const path = queue.shift()!
    if (seen.has(path)) continue
    seen.add(path)
    const res = await v.goto(site(s.host, path))
    if (!res || res.status() !== 200) { broken.push(`${path} → ${res?.status()}`); continue }
    const w = await v.evaluate(() => ({ scroll: document.documentElement.scrollWidth, view: window.innerWidth }))
    expect(w.scroll, `no sideways scroll on ${path}`).toBeLessThanOrEqual(w.view)
    const hrefs = await v.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')!))
    for (const h of hrefs) {
      if (h.startsWith('/') && !h.startsWith('//')) queue.push(h.split('#')[0] || '/')
      if (h.startsWith('#')) {
        const id = h.slice(1)
        if (id && !(await v.locator(`[id="${id}"]`).count())) broken.push(`${path}${h}`)
      }
    }
  }
  expect(broken).toEqual([])
  expect(seen.size).toBeGreaterThanOrEqual(5)
  expect(outside).toEqual([])
  expect(cookies).toEqual([])
  await ctx.close()

  const unknown = await hostGet(page, site(`nobody-${uniq()}.yakini.digital`))
  expect(unknown.status()).toBe(404)
  expect(await unknown.text()).toContain('This site is unavailable')
  expect(await unknown.text()).toMatch(/noindex/)
  const preview = await page.request.get(`/p/${s.siteId}`)
  expect(preview.headers()['x-robots-tag']).toContain('noindex')
})
