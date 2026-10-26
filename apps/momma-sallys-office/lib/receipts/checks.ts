// Math and sanity checks on a receipt draft. Flags are warnings shown to the
// owner; approval needs her to acknowledge them (enforced in the database).
import type { Flag } from './types'

export type CheckLine = {
  line_no: number
  raw_text: string
  quantity: number | null
  unit_price_cents: number | null
  line_total_cents: number | null
  discount_cents?: number | null
  ignored?: boolean
}
export type CheckReceipt = {
  vendor: string | null
  receipt_date: string | null
  subtotal_cents: number | null
  tax_cents: number | null
  total_cents: number | null
}

/** Rounding slack: one cent per line on quantity × price. */
const LINE_TOLERANCE = 1

export function checkLine(l: CheckLine): Flag[] {
  if (l.ignored) return []
  const f: Flag[] = []
  if (l.line_total_cents === null) f.push({ code: 'line_total_missing', message: 'Line total is missing', line_no: l.line_no })
  if (l.quantity === null || l.quantity <= 0) f.push({ code: 'qty_missing', message: 'Quantity is missing', line_no: l.line_no })
  if (l.quantity !== null && l.unit_price_cents !== null && l.line_total_cents !== null) {
    const expected = Math.round(l.quantity * l.unit_price_cents)
    if (Math.abs(expected - l.line_total_cents) > LINE_TOLERANCE) {
      f.push({ code: 'line_math', message: `Qty × price is ${expected} cents but the line says ${l.line_total_cents}`, line_no: l.line_no })
    }
  }
  if (l.line_total_cents !== null && l.line_total_cents < 0) f.push({ code: 'negative_line', message: 'Negative line (return or credit?)', line_no: l.line_no })
  return f
}

export function checkReceipt(r: CheckReceipt, lines: CheckLine[], today = new Date()): Flag[] {
  const f: Flag[] = []
  if (!r.vendor?.trim()) f.push({ code: 'vendor_missing', message: 'Vendor is missing' })
  if (!r.receipt_date) f.push({ code: 'date_missing', message: 'Date is missing' })
  else {
    const d = Date.parse(`${r.receipt_date}T12:00:00Z`)
    if (Number.isNaN(d)) f.push({ code: 'date_invalid', message: 'Date is not a real date' })
    else if (d > today.getTime() + 2 * 86400000) f.push({ code: 'date_future', message: 'Date is in the future' })
    else if (d < today.getTime() - 400 * 86400000) f.push({ code: 'date_old', message: 'Date is more than 400 days ago' })
  }
  if (r.total_cents === null) f.push({ code: 'total_missing', message: 'Total is missing' })

  const counted = lines.filter((l) => !l.ignored)
  const allLines = lines.reduce((s, l) => s + (l.line_total_cents ?? 0) - (l.discount_cents ?? 0), 0)
  if (r.subtotal_cents !== null && lines.length) {
    const tol = Math.max(LINE_TOLERANCE, lines.length)
    if (Math.abs(allLines - r.subtotal_cents) > tol) {
      f.push({ code: 'lines_vs_subtotal', message: `Lines add up to ${allLines} cents but the subtotal is ${r.subtotal_cents}` })
    }
  }
  if (r.subtotal_cents !== null && r.total_cents !== null) {
    const expected = r.subtotal_cents + (r.tax_cents ?? 0)
    if (Math.abs(expected - r.total_cents) > 1) {
      f.push({ code: 'subtotal_tax_total', message: `Subtotal + tax is ${expected} cents but the total is ${r.total_cents}` })
    }
  } else if (r.subtotal_cents === null && r.total_cents !== null && lines.length) {
    const expected = allLines + (r.tax_cents ?? 0)
    if (Math.abs(expected - r.total_cents) > Math.max(1, lines.length)) {
      f.push({ code: 'lines_vs_total', message: `Lines + tax add up to ${expected} cents but the total is ${r.total_cents}` })
    }
  }
  if (!counted.length) f.push({ code: 'no_lines', message: 'No lines to count' })
  return f
}

/** Same vendor + same date + same total = probably the same receipt uploaded twice. */
export function isLikelyDuplicate(a: CheckReceipt, b: CheckReceipt): boolean {
  if (!a.vendor || !b.vendor || !a.receipt_date || a.total_cents === null) return false
  const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '')
  return norm(a.vendor) === norm(b.vendor) && a.receipt_date === b.receipt_date && a.total_cents === b.total_cents
}
