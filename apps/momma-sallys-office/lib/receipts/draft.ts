// Turns an extracted (or owner-edited) receipt into database rows: applies
// learned mappings, guesses pack sizes, and computes flags. Pure; no I/O.
import { checkLine, checkReceipt } from './checks'
import { aliasKey, parsePackSize, type Unit } from './normalize'
import type { ExtractedLine, Flag } from './types'

export type AliasHit = { ingredient_id: string; pack_qty: number | null; pack_unit: string | null }

export type DraftLine = {
  line_no: number
  raw_text: string
  quantity: number | null
  unit_price_cents: number | null
  line_total_cents: number | null
  discount_cents: number
  pack_qty: number | null
  pack_unit: Unit | null
  ingredient_id: string | null
  mapped_by: 'none' | 'alias' | 'owner'
  ignored: boolean
  flags: Flag[]
}

export function draftLinesFromExtraction(lines: ExtractedLine[], aliases: Map<string, AliasHit>): DraftLine[] {
  return lines.map((l, i) => {
    const hit = aliases.get(aliasKey(l.raw_text))
    const guess = parsePackSize(l.raw_text)
    const d: DraftLine = {
      line_no: i + 1,
      raw_text: l.raw_text,
      quantity: l.quantity,
      unit_price_cents: l.unit_price_cents,
      line_total_cents: l.line_total_cents,
      discount_cents: l.discount_cents ?? 0,
      pack_qty: hit?.pack_qty ?? guess?.qty ?? null,
      pack_unit: (hit?.pack_unit as Unit | null) ?? guess?.unit ?? null,
      ingredient_id: hit?.ingredient_id ?? null,
      mapped_by: hit ? 'alias' : 'none',
      ignored: false,
      flags: [],
    }
    d.flags = lineFlags(d, l.confidence)
    return d
  })
}

export function lineFlags(d: DraftLine, confidence?: number): Flag[] {
  const f = checkLine(d)
  if (!d.ignored && confidence !== undefined && confidence < 0.7) {
    f.push({ code: 'low_confidence', message: 'The reader wasn’t sure about this line', line_no: d.line_no })
  }
  return f
}

export function receiptFlags(r: Parameters<typeof checkReceipt>[0], lines: DraftLine[], duplicateOf: string | null, today = new Date()): Flag[] {
  const f = checkReceipt(r, lines, today)
  if (duplicateOf) f.push({ code: 'possible_duplicate', message: 'Same vendor, date and total as another receipt' })
  return f
}
