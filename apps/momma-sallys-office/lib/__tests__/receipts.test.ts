import { test } from 'node:test'
import assert from 'node:assert/strict'
import { aliasKey, vendorKey, parsePackSize, unitFactor, costPerBase } from '../receipts/normalize'
import { checkLine, checkReceipt, isLikelyDuplicate } from '../receipts/checks'
import { getExtractor } from '../receipts/providers'
import { parseDollarsToCents, formatCents, centsToInput } from '../money'

test('aliasKey normalizes like the SQL ms_alias_key()', () => {
  // Same expected value is asserted in supabase/tests/rls-tests.sql.
  assert.equal(aliasKey('  beef brisket,  choice 10lb* '), 'BEEF BRISKET CHOICE 10LB')
  assert.equal(aliasKey('Clamshell 9x9 (200 ct)'), 'CLAMSHELL 9X9 200 CT')
  assert.equal(vendorKey("Sam's Club #123"), 'samsclub123')
})

test('pack sizes', () => {
  assert.deepEqual(parsePackSize('BEEF BRISKET 10LB'), { qty: 10, unit: 'lb' })
  assert.deepEqual(parsePackSize('COLLARD GREENS 6/2 LB'), { qty: 12, unit: 'lb' })
  assert.deepEqual(parsePackSize('SWEET POTATO 40#'), { qty: 40, unit: 'lb' })
  assert.deepEqual(parsePackSize('CHICKEN 2.5# AVG'), { qty: 2.5, unit: 'lb' })
  assert.deepEqual(parsePackSize('CLAMSHELL 9X9 200CT'), { qty: 200, unit: 'each' })
  assert.deepEqual(parsePackSize('EGGS 15 DZ CASE 12 CT'), { qty: 12, unit: 'each' })
  assert.deepEqual(parsePackSize('VEG OIL 4/1 GAL'), { qty: 4, unit: 'gal' })
  assert.deepEqual(parsePackSize('HOT SAUCE 12 OZ'), { qty: 12, unit: 'oz' })
  assert.deepEqual(parsePackSize('SEASONING 5 LBS'), { qty: 5, unit: 'lb' })
  assert.equal(parsePackSize('PAPER TOWELS'), null)
})

test('unit conversion and cost per base unit (same as the database)', () => {
  assert.equal(unitFactor('lb', 'lb'), 1)
  assert.ok(Math.abs(unitFactor('lb', 'oz')! - 16) < 1e-9)
  assert.ok(Math.abs(unitFactor('gal', 'qt')! - 4) < 1e-9)
  assert.equal(unitFactor('lb', 'gal'), null)
  // Same case as the SQL test: 2 cases × 10 lb for $80.00 → 400 cents/lb.
  assert.equal(costPerBase({ lineTotalCents: 8000, quantity: 2, packQty: 10, packUnit: 'lb', baseUnit: 'lb' }), 400)
  assert.equal(costPerBase({ lineTotalCents: 1000, quantity: 1, packQty: 200, packUnit: 'each', baseUnit: 'each' }), 5)
  assert.equal(costPerBase({ lineTotalCents: 1000, quantity: 1, packQty: 1, packUnit: 'lb', baseUnit: 'each' }), null)
})

test('line checks', () => {
  assert.deepEqual(checkLine({ line_no: 1, raw_text: 'x', quantity: 2, unit_price_cents: 4000, line_total_cents: 8000 }), [])
  assert.equal(checkLine({ line_no: 1, raw_text: 'x', quantity: 3, unit_price_cents: 1500, line_total_cents: 4600 })[0].code, 'line_math')
  assert.ok(checkLine({ line_no: 1, raw_text: 'x', quantity: null, unit_price_cents: null, line_total_cents: null }).some((f) => f.code === 'qty_missing'))
  assert.deepEqual(checkLine({ line_no: 1, raw_text: 'x', quantity: null, unit_price_cents: null, line_total_cents: null, ignored: true }), [])
})

test('receipt checks', () => {
  const today = new Date('2026-10-25T12:00:00Z')
  const lines = [
    { line_no: 1, raw_text: 'a', quantity: 2, unit_price_cents: 4000, line_total_cents: 8000 },
    { line_no: 2, raw_text: 'b', quantity: 1, unit_price_cents: 1000, line_total_cents: 1000 },
  ]
  const good = { vendor: 'V', receipt_date: '2026-10-20', subtotal_cents: 9000, tax_cents: 74, total_cents: 9074 }
  assert.deepEqual(checkReceipt(good, lines, today), [])
  const codes = (r: typeof good) => checkReceipt(r, lines, today).map((f) => f.code)
  assert.ok(codes({ ...good, subtotal_cents: 9500, total_cents: 9574 }).includes('lines_vs_subtotal'))
  assert.ok(codes({ ...good, total_cents: 9999 }).includes('subtotal_tax_total'))
  assert.ok(codes({ ...good, receipt_date: '2026-12-01' }).includes('date_future'))
  assert.ok(codes({ ...good, vendor: ' ' }).includes('vendor_missing'))
  assert.ok(codes({ ...good, subtotal_cents: null as unknown as number, total_cents: 9500 }).includes('lines_vs_total'))
})

test('duplicate detection', () => {
  const a = { vendor: "Sam's Club", receipt_date: '2026-10-20', subtotal_cents: null, tax_cents: null, total_cents: 9074 }
  assert.equal(isLikelyDuplicate(a, { ...a, vendor: 'SAMS CLUB' }), true)
  assert.equal(isLikelyDuplicate(a, { ...a, total_cents: 9075 }), false)
})

test('providers: manual is the default; mock is labeled sample data with a deliberate math error', async () => {
  assert.equal(getExtractor(undefined).id, 'manual')
  assert.equal(getExtractor('some-paid-thing').id, 'manual')
  const m = await getExtractor('mock').extract([])
  assert.match(m.vendor!, /SAMPLE/)
  assert.ok(m.notes?.some((n) => /SAMPLE DATA/.test(n)))
  const flagged = m.lines.flatMap((l, i) => checkLine({ line_no: i + 1, ...l }))
  assert.equal(flagged.length, 1)
  const manual = await getExtractor('manual').extract([])
  assert.equal(manual.lines.length, 0)
})

test('money parsing never uses floats for stored values', () => {
  assert.equal(parseDollarsToCents('$1,234.5'), 123450)
  assert.equal(parseDollarsToCents('0.07'), 7)
  assert.equal(parseDollarsToCents('-2.10'), -210)
  assert.equal(parseDollarsToCents('12.345'), null)
  assert.equal(parseDollarsToCents('abc'), null)
  assert.equal(formatCents(123450), '$1,234.50')
  assert.equal(formatCents(-5), '-$0.05')
  assert.equal(centsToInput(705), '7.05')
})
