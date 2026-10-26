// Text and unit normalization. aliasKey() must match public.ms_alias_key()
// in SQL; vendorKey() must match the vendor key in ms_approve_receipt().

export const BASE_UNITS = ['lb', 'oz', 'g', 'kg', 'each', 'gal', 'qt', 'floz', 'l', 'ml'] as const
export type Unit = (typeof BASE_UNITS)[number]

export function aliasKey(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9#/. ]+/g, ' ').replace(/\s+/g, ' ').trim()
}

export function vendorKey(vendor: string): string {
  return vendor.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

const UNIT_WORDS: Record<string, Unit> = {
  LB: 'lb', LBS: 'lb', '#': 'lb', POUND: 'lb', POUNDS: 'lb',
  OZ: 'oz', 'FL OZ': 'floz', FLOZ: 'floz',
  G: 'g', GR: 'g', GRAM: 'g', KG: 'kg',
  CT: 'each', EA: 'each', EACH: 'each', PC: 'each', PCS: 'each', COUNT: 'each',
  GAL: 'gal', GALLON: 'gal', QT: 'qt', L: 'l', LTR: 'l', ML: 'ml',
}

/**
 * Guess the amount in ONE purchased unit from the line text.
 * "10LB" → 10 lb · "6/5 LB" → 30 lb · "2.5#" → 2.5 lb · "200CT" → 200 each
 * "4/1 GAL" → 4 gal · "12 OZ" → 12 oz. Returns null when unsure; the owner
 * confirms every pack size in review either way.
 */
export function parsePackSize(raw: string): { qty: number; unit: Unit } | null {
  const s = ` ${raw.toUpperCase().replace(/,/g, ' ')} `
  // n/m UNIT (case of n packs × m units)
  const multi = s.match(/(?:^|[^\d.])(\d+)\s*\/\s*(\d+(?:\.\d+)?)\s*(FL OZ|FLOZ|LBS?|#|OZ|KG|G|GAL|QT|ML|L|CT|EA)(?![A-Z])/)
  if (multi) {
    const unit = UNIT_WORDS[multi[3]]
    const qty = Number(multi[1]) * Number(multi[2])
    if (unit && qty > 0) return { qty, unit }
  }
  const single = s.match(/(?:^|[^\d./])(\d+(?:\.\d+)?)\s*(FL OZ|FLOZ|LBS?|POUNDS?|#|OZ|KG|GRAMS?|GR?|GALLONS?|GAL|QT|LTR|ML|L|CT|EA|EACH|PCS?|COUNT)(?![A-Z])/)
  if (single) {
    const word = single[2].replace(/S$/, '') in UNIT_WORDS ? single[2].replace(/S$/, '') : single[2]
    const unit = UNIT_WORDS[word] ?? UNIT_WORDS[single[2]]
    const qty = Number(single[1])
    if (unit && qty > 0) return { qty, unit }
  }
  return null
}

const DIM: Record<Unit, ['mass' | 'count' | 'vol', number]> = {
  lb: ['mass', 453.59237], oz: ['mass', 28.349523125], g: ['mass', 1], kg: ['mass', 1000],
  each: ['count', 1],
  gal: ['vol', 3785.411784], qt: ['vol', 946.352946], floz: ['vol', 29.5735295625], l: ['vol', 1000], ml: ['vol', 1],
}

/** Factor to convert `from` into `to`, or null if they measure different things. Mirrors ms_private.unit_factor. */
export function unitFactor(from: Unit, to: Unit): number | null {
  const a = DIM[from], b = DIM[to]
  if (!a || !b || a[0] !== b[0]) return null
  return a[1] / b[1]
}

/** Cost per base unit in cents, same formula the database uses on approval. */
export function costPerBase(opts: { lineTotalCents: number; discountCents?: number; quantity: number; packQty: number; packUnit: Unit; baseUnit: Unit }): number | null {
  const f = unitFactor(opts.packUnit, opts.baseUnit)
  if (f === null) return null
  const base = opts.quantity * opts.packQty * f
  if (!(base > 0)) return null
  return Math.round(((opts.lineTotalCents - (opts.discountCents ?? 0)) / base) * 10000) / 10000
}
