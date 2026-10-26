import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac, randomBytes } from 'node:crypto'
import { expectedSignature, verifySquareSignature, parseSquareEvent } from '../square/webhook'
import { encryptSecret, decryptSecret, safeEqual } from '../square/crypto'
import { getSquareConfig, SquareConfigError } from '../square/config'
import { buildAuthorizeUrl, needsRefresh } from '../square/oauth'
import { mapOrder, mapPayment, mapCatalog, mapTeamMember } from '../square/mappers'
import { backoffMs, squareFetch, paginate } from '../square/http'

const url = 'https://office.example.test/api/square/webhook'
const key = 'test-signature-key'
const body = '{"merchant_id":"M1","type":"payment.updated","event_id":"e-1","data":{"id":"P1"}}'

test('webhook signature: matches an independent HMAC-SHA256(url + body) in base64', () => {
  const independent = createHmac('sha256', key).update(url + body).digest('base64')
  assert.equal(expectedSignature(body, url, key), independent)
  assert.equal(verifySquareSignature({ rawBody: body, signatureHeader: independent, notificationUrl: url, signatureKey: key }), true)
})

test('webhook signature: rejects a changed body, wrong URL, wrong key, or missing header', () => {
  const good = expectedSignature(body, url, key)
  assert.equal(verifySquareSignature({ rawBody: body + ' ', signatureHeader: good, notificationUrl: url, signatureKey: key }), false)
  assert.equal(verifySquareSignature({ rawBody: body, signatureHeader: good, notificationUrl: url + '/', signatureKey: key }), false)
  assert.equal(verifySquareSignature({ rawBody: body, signatureHeader: good, notificationUrl: url, signatureKey: 'other' }), false)
  assert.equal(verifySquareSignature({ rawBody: body, signatureHeader: null, notificationUrl: url, signatureKey: key }), false)
  assert.equal(verifySquareSignature({ rawBody: body, signatureHeader: good, notificationUrl: url, signatureKey: '' }), false)
})

test('webhook parse: needs type and event_id', () => {
  assert.equal(parseSquareEvent(body)?.event_id, 'e-1')
  assert.equal(parseSquareEvent('{"type":"x"}'), null)
  assert.equal(parseSquareEvent('not json'), null)
})

test('token encryption round-trips and detects tampering', () => {
  const k = randomBytes(32).toString('base64')
  const blob = encryptSecret('EAAA-fake-token', k)
  assert.ok(!blob.includes('EAAA'))
  assert.equal(decryptSecret(blob, k), 'EAAA-fake-token')
  const parts = blob.split(':'); parts[3] = Buffer.from('tampered').toString('base64')
  assert.throws(() => decryptSecret(parts.join(':'), k))
  assert.throws(() => decryptSecret(blob, randomBytes(32).toString('base64')))
  assert.throws(() => encryptSecret('x', Buffer.from('short').toString('base64')))
  assert.equal(safeEqual('abc', 'abc'), true)
  assert.equal(safeEqual('abc', 'abd'), false)
})

const env = {
  SQUARE_APPLICATION_ID: 'sandbox-sq0idb-fake',
  SQUARE_APPLICATION_SECRET: 'fake-secret-value',
  SQUARE_REDIRECT_URL: 'https://office.example.test/api/square/callback',
  SQUARE_WEBHOOK_SIGNATURE_KEY: 'k',
  SQUARE_WEBHOOK_NOTIFICATION_URL: url,
  SQUARE_TOKEN_ENCRYPTION_KEY: randomBytes(32).toString('base64'),
}

test('config: sandbox only, and errors never include secret values', () => {
  assert.equal(getSquareConfig(env).applicationId, 'sandbox-sq0idb-fake')
  assert.throws(() => getSquareConfig({ ...env, SQUARE_APPLICATION_ID: 'sq0idp-production' }), SquareConfigError)
  assert.throws(() => getSquareConfig({ ...env, SQUARE_ENVIRONMENT: 'production' }), SquareConfigError)
  assert.throws(() => getSquareConfig({ ...env, SQUARE_WEBHOOK_NOTIFICATION_URL: 'http://x.test/hook' }), SquareConfigError)
  try { getSquareConfig({ ...env, SQUARE_WEBHOOK_SIGNATURE_KEY: '' }) } catch (e) {
    assert.ok(!(e as Error).message.includes('fake-secret-value'))
    assert.match((e as Error).message, /SQUARE_WEBHOOK_SIGNATURE_KEY/)
  }
})

test('oauth: authorize URL targets the sandbox with read-only scopes', () => {
  const u = new URL(buildAuthorizeUrl(getSquareConfig(env), 'state123'))
  assert.equal(u.origin, 'https://connect.squareupsandbox.com')
  assert.equal(u.searchParams.get('state'), 'state123')
  const scopes = u.searchParams.get('scope')!.split(' ')
  assert.ok(scopes.every((s) => s.endsWith('_READ')), 'every scope is a _READ scope')
  assert.ok(!u.toString().includes('fake-secret-value'))
})

test('oauth: refresh when within 7 days of expiry', () => {
  const now = new Date('2026-10-25T12:00:00Z')
  assert.equal(needsRefresh('2026-11-20T00:00:00Z', now), false)
  assert.equal(needsRefresh('2026-10-30T00:00:00Z', now), true)
  assert.equal(needsRefresh(null, now), true)
})

test('mapOrder: cents, gross sales from lines, returns', () => {
  const { order, lines } = mapOrder({
    id: 'O1', location_id: 'L1', state: 'COMPLETED', closed_at: '2026-10-20T18:00:00Z',
    total_money: { amount: 2706, currency: 'USD' }, total_tax_money: { amount: 206 },
    total_discount_money: { amount: 500 }, total_tip_money: { amount: 300 },
    return_amounts: { total_money: { amount: 0 } },
    line_items: [
      { uid: 'a', name: 'Brisket Plate', quantity: '2', base_price_money: { amount: 1500 }, gross_sales_money: { amount: 3000 }, total_money: { amount: 2700 }, total_discount_money: { amount: 300 } },
      { uid: 'b', name: 'Tea', quantity: '1', base_price_money: { amount: 250 }, total_money: { amount: 250 } },
    ],
  })
  assert.equal(order.gross_sales_cents, 3250)
  assert.equal(order.tax_cents, 206)
  assert.equal(order.tip_cents, 300)
  assert.equal(lines[0].quantity, 2)
  assert.equal(lines[1].gross_sales_cents, 250)
})

test('mapPayment: sums processing fee entries', () => {
  const p = mapPayment({ id: 'P1', status: 'COMPLETED', source_type: 'CARD', amount_money: { amount: 2406 }, tip_money: { amount: 300 }, total_money: { amount: 2706 },
    processing_fee: [{ amount_money: { amount: 85 } }, { amount_money: { amount: -10 } }], card_details: { card: { card_brand: 'VISA' } } })
  assert.equal(p.processing_fee_cents, 75)
  assert.equal(p.total_cents, 2706)
  assert.equal(p.card_brand, 'VISA')
})

test('mapCatalog: category names and variation prices', () => {
  const { items, variations } = mapCatalog([
    { type: 'CATEGORY', id: 'C1', category_data: { name: 'Plates' } },
    { type: 'ITEM', id: 'I1', item_data: { name: 'Brisket Plate', categories: [{ id: 'C1' }], variations: [{ id: 'V1', item_variation_data: { name: 'Regular', price_money: { amount: 1500 } } }] } },
  ])
  assert.equal(items[0].category_name, 'Plates')
  assert.equal(variations[0].price_cents, 1500)
})

test('mapTeamMember drops wages', () => {
  const t = mapTeamMember({ id: 'T1', given_name: 'A', wage_setting: { job_assignments: [{ hourly_rate: { amount: 1500 } }] } })
  assert.ok(!('wage_setting' in t))
  assert.ok(!JSON.stringify(t).includes('1500'))
})

test('http: retries 429 then succeeds; backoff grows and is capped', async () => {
  let calls = 0
  const fake = (async () => {
    calls++
    return calls < 2 ? new Response('{}', { status: 429 }) : new Response('{"ok":true}', { status: 200 })
  }) as unknown as typeof fetch
  const r = await squareFetch<{ ok: boolean }>('/v2/x', { token: 't', fetchImpl: fake })
  assert.equal(r.ok, true)
  assert.equal(calls, 2)
  assert.ok(backoffMs(0, () => 0) >= 250)
  assert.ok(backoffMs(20, () => 1) <= 30000)
})

test('http: sends the token only in the Authorization header, and errors omit it', async () => {
  const fake = (async (_u: string, init: RequestInit) => {
    assert.equal((init.headers as Record<string, string>).Authorization, 'Bearer secret-token-xyz')
    return new Response('{"errors":[{"code":"UNAUTHORIZED"}]}', { status: 401 })
  }) as unknown as typeof fetch
  await assert.rejects(squareFetch('/v2/x', { token: 'secret-token-xyz', fetchImpl: fake }), (e: Error) => !e.message.includes('secret-token-xyz') && /401/.test(e.message))
})

test('paginate follows cursors', async () => {
  const pages: Record<string, { items: number[]; cursor?: string }> = { '': { items: [1, 2], cursor: 'c2' }, c2: { items: [3] } }
  const out: number[] = []
  for await (const n of paginate<number>(async (c) => pages[c ?? ''])) out.push(n)
  assert.deepEqual(out, [1, 2, 3])
})
