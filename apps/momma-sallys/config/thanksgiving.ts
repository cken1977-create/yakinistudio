/**
 * Thanksgiving half-pan bundle.
 * One price for five half pans. Sides here are the special, not the daily menu.
 * Dessert half pans are not listed: Nicole has not confirmed which desserts qualify.
 */

export const THANKSGIVING_PAN_COUNT = 5
export const THANKSGIVING_TOTAL_USD = 125

export const THANKSGIVING_SPECIAL = {
  eyebrow: 'Thanksgiving',
  eyebrowEs: 'Acción de Gracias',
  title: 'Five half pans',
  titleEs: 'Cinco medias charolas',
  summary: 'Mix and match any five half pans of sides and desserts.',
  summaryEs: 'Combina cinco medias charolas de acompañamientos y postres.',
  scope: 'No meat.',
  scopeEs: 'Sin carne.',
  bundle: 'Five half pans, one total.',
  bundleEs: 'Cinco medias charolas, un solo total.',
  totalLabel: 'total',
  totalLabelEs: 'en total',
  sidesHeading: 'Thanksgiving sides',
  sidesHeadingEs: 'Acompañamientos de Acción de Gracias',
  dessertsHeading: 'Desserts',
  dessertsHeadingEs: 'Postres',
  dessertsNote: 'Half-pan desserts are not listed here. Call or text to confirm which desserts are available.',
  dessertsNoteEs: 'Los postres en media charola no están en esta lista. Llama o envía un texto para confirmar cuáles hay.',
  requestNote:
    'Text or call to make the request. This page does not save it, take payment, or reserve a pickup.',
  requestNoteEs:
    'Pide por texto o por teléfono. Esta página no lo guarda, no cobra y no aparta la recogida.',
} as const

export type ThanksgivingDish = { id: string; name: string; es: string }

/** Confirmed Thanksgiving sides. Not added to the daily menu. */
export const THANKSGIVING_SIDES: readonly ThanksgivingDish[] = [
  { id: 'fried-cabbage', name: 'Fried Cabbage', es: 'Repollo frito' },
  { id: 'candied-yams', name: 'Candied Yams', es: 'Camotes glaseados' },
  { id: 'dressing-giblet-gravy', name: 'Dressing with Giblet Gravy', es: 'Relleno con salsa de menudencias' },
  { id: 'mashed-potatoes', name: 'Mashed Potatoes', es: 'Puré de papa' },
  { id: 'corn-on-the-cob', name: 'Corn on the Cob', es: 'Elote' },
  { id: 'mac-and-cheese', name: 'Mac and Cheese', es: 'Macarrones con queso' },
  { id: 'beans', name: 'Beans', es: 'Frijoles' },
  { id: 'potato-salad', name: 'Potato Salad', es: 'Ensalada de papa' },
  { id: 'green-beans', name: 'Green Beans', es: 'Ejotes' },
  { id: 'rice', name: 'Rice', es: 'Arroz' },
  { id: 'collard-greens', name: 'Collard Greens', es: 'Berza' },
]

const DISHES: readonly ThanksgivingDish[] = THANKSGIVING_SIDES
const DISH_BY_ID = new Map(DISHES.map((dish) => [dish.id, dish]))

export type ThanksgivingSelection = Record<string, number>

export type RequestErrorCode = 'pan-count' | 'unknown-dish' | 'name' | 'phone' | 'pickup'

export function thanksgivingPublicCopy(): string[] {
  const s = THANKSGIVING_SPECIAL
  return [
    s.eyebrow,
    s.eyebrowEs,
    s.title,
    s.titleEs,
    s.summary,
    s.summaryEs,
    s.scope,
    s.scopeEs,
    s.bundle,
    s.bundleEs,
    `$${THANKSGIVING_TOTAL_USD}`,
    s.totalLabel,
    s.totalLabelEs,
    s.sidesHeading,
    s.sidesHeadingEs,
    s.dessertsHeading,
    s.dessertsHeadingEs,
    s.dessertsNote,
    s.dessertsNoteEs,
    s.requestNote,
    s.requestNoteEs,
    ...DISHES.flatMap((dish) => [dish.name, dish.es]),
  ]
}

export function countedPans(selection: ThanksgivingSelection): number {
  return Object.entries(selection).reduce((sum, [, qty]) => {
    if (!Number.isInteger(qty) || qty <= 0) return sum
    return sum + qty
  }, 0)
}

/** Bundle price is fixed. It is never a per-pan price. */
export function bundleTotalUsd(selection: ThanksgivingSelection): number | null {
  return validateThanksgivingRequest({
    selection,
    name: 'Valid Name',
    phone: '3255550100',
    pickup: 'requested pickup',
  }).ok
    ? THANKSGIVING_TOTAL_USD
    : null
}

export function validateThanksgivingRequest(input: {
  selection: ThanksgivingSelection
  name: string
  phone: string
  pickup: string
}): { ok: true } | { ok: false; errors: RequestErrorCode[] } {
  const errors: RequestErrorCode[] = []
  for (const [id, qty] of Object.entries(input.selection)) {
    if (!Number.isInteger(qty) || qty < 0 || (qty > 0 && !DISH_BY_ID.has(id))) {
      errors.push('unknown-dish')
      break
    }
  }
  if (countedPans(input.selection) !== THANKSGIVING_PAN_COUNT) errors.push('pan-count')
  if (input.name.trim().length < 2) errors.push('name')
  const digits = input.phone.replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 15) errors.push('phone')
  if (input.pickup.trim().length < 3) errors.push('pickup')
  return errors.length ? { ok: false, errors } : { ok: true }
}

export function requestErrorText(code: RequestErrorCode, count = 0): { en: string; es: string } {
  switch (code) {
    case 'pan-count':
      return {
        en: `Choose exactly 5 half pans. You have ${count}.`,
        es: `Elige exactamente 5 medias charolas. Llevas ${count}.`,
      }
    case 'unknown-dish':
      return {
        en: 'One of those dishes is not on this Thanksgiving list.',
        es: 'Uno de esos platos no está en esta lista de Acción de Gracias.',
      }
    case 'name':
      return { en: 'Add your name.', es: 'Agrega tu nombre.' }
    case 'phone':
      return { en: 'Add a phone number.', es: 'Agrega un teléfono.' }
    case 'pickup':
      return {
        en: 'Add the pickup you are requesting.',
        es: 'Agrega la recogida que pides.',
      }
  }
}

/** Text the customer sends themselves. Returns null until the request is valid. */
export function buildThanksgivingRequestText(input: {
  selection: ThanksgivingSelection
  name: string
  phone: string
  pickup: string
}): string | null {
  if (!validateThanksgivingRequest(input).ok) return null
  const lines = DISHES.flatMap((dish) => {
    const qty = input.selection[dish.id] ?? 0
    return qty > 0 ? [`${qty} ${dish.name}`] : []
  })
  return [
    "Momma Sally's Thanksgiving request",
    `Name: ${input.name.trim()}`,
    `Phone: ${input.phone.trim()}`,
    `Requested pickup: ${input.pickup.trim()}`,
    `5 half pans for $125 total`,
    ...lines,
    'Desserts: call or text to confirm which half pans are available.',
    'Not a paid order. Pickup is not reserved.',
  ].join('\n')
}
