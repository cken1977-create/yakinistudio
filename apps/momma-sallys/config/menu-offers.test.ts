import assert from 'node:assert/strict'
import { test } from 'node:test'
import { config } from './brand.ts'
import {
  CATERING_DESSERTS,
  CATERING_PACKAGES,
  CATERING_SIDES,
  EXTRA_DESSERT_PER_GUEST,
  EXTRA_MEAT_PER_GUEST,
  EXTRA_SIDE_PER_GUEST,
} from './catering.ts'
import {
  THANKSGIVING_PAN_COUNT,
  THANKSGIVING_SIDES,
  THANKSGIVING_SPECIAL,
  THANKSGIVING_TOTAL_USD,
  buildThanksgivingRequestText,
  validateThanksgivingRequest,
  thanksgivingPublicCopy,
} from './thanksgiving.ts'

const NEW_SIDES = [
  { name: 'Green Beans', es: 'Ejotes', id: 'green-beans' },
  { name: 'White Rice', es: 'Arroz blanco', id: 'white-rice' },
  { name: 'Salad', es: 'Ensalada', id: 'salad' },
  { name: 'Corn', es: 'Maíz', id: 'corn' },
] as const

function category(name: string) {
  const cat = config.menu!.categories.find((c) => c.name === name)
  assert.ok(cat, `missing category ${name}`)
  return cat
}

test('menu sides include the four new sides once, unpriced, with Spanish', () => {
  const sides = category('Sides')
  assert.deepEqual(
    sides.items.map((item) => item.name),
    ['Beans', 'Mac & Cheese', 'Potato Salad', 'Green Beans', 'White Rice', 'Salad', 'Corn'],
  )
  for (const item of sides.items) {
    assert.equal(item.price, undefined, `${item.name} should stay unpriced`)
    assert.equal(item.description, undefined)
  }
  for (const side of NEW_SIDES) {
    const matches = sides.items.filter((item) => item.name === side.name)
    assert.equal(matches.length, 1)
    assert.equal(matches[0].nameTranslated, side.es)
  }
  assert.equal(sides.items.filter((item) => item.name === 'Potato Salad').length, 1)
  assert.equal(sides.items.find((item) => item.name === 'Beans')!.nameTranslated, 'Frijoles')
})

test('catering sides list the same four without changing category pricing', () => {
  assert.deepEqual(
    CATERING_SIDES.map((side) => side.name),
    ['Beans', 'Mac & Cheese', 'Potato Salad', 'Green Beans', 'White Rice', 'Salad', 'Corn'],
  )
  for (const side of NEW_SIDES) {
    const match = CATERING_SIDES.find((item) => item.id === side.id)
    assert.equal(match?.name, side.name)
    assert.equal(match?.es, side.es)
  }
  assert.equal(new Set(CATERING_SIDES.map((side) => side.id)).size, CATERING_SIDES.length)
  assert.equal(EXTRA_SIDE_PER_GUEST, 3)
  assert.equal(EXTRA_MEAT_PER_GUEST, 5)
  assert.equal(EXTRA_DESSERT_PER_GUEST, 3)
  assert.deepEqual(
    CATERING_PACKAGES.map((pkg) => [pkg.id, pkg.perGuest, pkg.sidesIncluded]),
    [
      ['classic', 16, 2],
      ['pitmaster', 22, 2],
      ['full-spread', 28, 3],
    ],
  )
  assert.deepEqual(
    CATERING_DESSERTS.map((item) => item.name),
    ['Banana Pudding', 'Peach Cobbler', 'Cookies & Brownies'],
  )
})

test('existing plate, dessert, and drink prices stay as they were', () => {
  const plates = category('Meat Plates')
  assert.equal(plates.items.find((item) => item.name === '1 Meat Plate')!.price, '$15')
  assert.equal(plates.items.find((item) => item.name === '2 Meat Plate')!.price, '$25')
  assert.equal(plates.note, 'Plates include sides. · Los platos incluyen acompañamientos.')

  const desserts = category('Desserts')
  assert.deepEqual(
    desserts.items.map((item) => [item.name, item.price, item.nameTranslated]),
    [
      ['Cookies or Brownie', '$2', 'Galletas o brownie'],
      ['Banana Pudding', '$5', 'Pudín de plátano'],
      ['Pie', '$2', 'Pay'],
    ],
  )

  const drinks = category('Drinks')
  assert.deepEqual(
    drinks.items.map((item) => [item.name, item.price]),
    [
      ['Soda', '$2'],
      ['Powerade', '$2'],
      ['Monster', '$4'],
      ['Water', 'Market Price'],
    ],
  )
})

const THANKSGIVING_ONLY = [
  'Fried Cabbage',
  'Candied Yams',
  'Dressing with Giblet Gravy',
  'Mashed Potatoes',
  'Corn on the Cob',
  'Collard Greens',
]

test('Thanksgiving sides are the confirmed list and stay off the daily menu', () => {
  assert.deepEqual(
    THANKSGIVING_SIDES.map((dish) => dish.name),
    [
      'Fried Cabbage',
      'Candied Yams',
      'Dressing with Giblet Gravy',
      'Mashed Potatoes',
      'Corn on the Cob',
      'Mac and Cheese',
      'Beans',
      'Potato Salad',
      'Green Beans',
      'Rice',
      'Collard Greens',
    ],
  )
  assert.equal(THANKSGIVING_SIDES.filter((dish) => dish.name === 'Dressing with Giblet Gravy').length, 1)
  assert.equal(THANKSGIVING_SIDES.some((dish) => /added ingredients/i.test(dish.name + dish.es)), false)

  const dailyNames = config.menu!.categories.flatMap((cat) => cat.items.map((item) => item.name))
  for (const name of THANKSGIVING_ONLY) {
    assert.equal(dailyNames.includes(name), false, `${name} is Thanksgiving-only`)
  }
  assert.equal(dailyNames.includes('Rice'), false)
  assert.equal(dailyNames.includes('White Rice'), true)
  assert.equal(dailyNames.includes('Salad'), true)
  assert.equal(dailyNames.includes('Corn'), true)
})

test('Thanksgiving special is five half pans for $125 total, with an honest request', () => {
  assert.equal(THANKSGIVING_PAN_COUNT, 5)
  assert.equal(THANKSGIVING_TOTAL_USD, 125)
  assert.equal('priceEach' in THANKSGIVING_SPECIAL, false)

  const copy = thanksgivingPublicCopy().join('\n')
  assert.match(copy, /Five half pans/)
  assert.match(copy, /Cinco medias charolas/)
  assert.match(copy, /Mix and match any five half pans of sides and desserts\./)
  assert.match(copy, /Combina cinco medias charolas de acompañamientos y postres\./)
  assert.match(copy, /No meat\./)
  assert.match(copy, /Sin carne\./)
  assert.match(copy, /one total/)
  assert.match(copy, /\$125/)
  assert.match(copy, /does not save it, take payment, or reserve a pickup/)
  assert.match(copy, /Call or text to confirm which desserts are available/)
  assert.match(copy, /Llama o envía un texto para confirmar cuáles hay/)
  assert.doesNotMatch(copy, /Cookies or Brownie|Banana Pudding|Pie|Pudín|Galletas|peach cobbler/i)
  assert.doesNotMatch(copy, /\$25\b/)
  assert.doesNotMatch(copy, /\b25\b/)
  assert.doesNotMatch(copy, /per pan|per guest|serving|tax|deposit|deadline|hours|brisket|peach cobbler|added ingredients/i)

  const repeat = buildThanksgivingRequestText({
    selection: { 'green-beans': 3, 'fried-cabbage': 2 },
    name: 'Ada West',
    phone: '(325) 555-0100',
    pickup: 'Friday afternoon in Abilene',
  })
  assert.ok(repeat)
  assert.match(repeat, /3 Green Beans/)
  assert.match(repeat, /2 Fried Cabbage/)
  assert.match(repeat, /5 half pans for \$125 total/)
  assert.match(repeat, /Desserts: call or text to confirm which half pans are available\./)
  assert.match(repeat, /Not a paid order\. Pickup is not reserved\./)
  assert.doesNotMatch(repeat, /Cookies or Brownie|Banana Pudding|Pie/)
  assert.match(repeat, /Ada West/)
  assert.match(repeat, /Friday afternoon in Abilene/)
  assert.doesNotMatch(repeat, /\$25|paid in full|confirmed|reserved pickup|tax|deposit/i)

  assert.equal(buildThanksgivingRequestText({
    selection: { 'green-beans': 4 },
    name: 'Ada West',
    phone: '3255550100',
    pickup: 'Friday afternoon',
  }), null)
  assert.deepEqual(
    validateThanksgivingRequest({
      selection: { brisket: 5 },
      name: 'Ada West',
      phone: '3255550100',
      pickup: 'Friday afternoon',
    }).ok ? [] : validateThanksgivingRequest({
      selection: { brisket: 5 },
      name: 'Ada West',
      phone: '3255550100',
      pickup: 'Friday afternoon',
    }),
    { ok: false, errors: ['unknown-dish'] },
  )
  for (const id of ['peach-cobbler', 'cookies-or-brownie', 'banana-pudding', 'pie']) {
    assert.equal(buildThanksgivingRequestText({
      selection: { [id]: 5 },
      name: 'Ada West',
      phone: '3255550100',
      pickup: 'Friday afternoon',
    }), null)
  }
  const mixed = validateThanksgivingRequest({
    selection: { 'banana-pudding': 1, rice: 4 },
    name: 'Ada West',
    phone: '3255550100',
    pickup: 'Friday afternoon',
  })
  assert.deepEqual(mixed, { ok: false, errors: ['unknown-dish'] })
})
