/**
 * Design-quality fixtures (DESIGN_UPGRADE D1, quality harness). Two per kit:
 *
 * - `<kit>-rich`: every page filled in: real-looking copy in every [[fill this in]] spot, phone,
 *   email, address, hours, lists (menu, stops, reviews, team), and a gallery of 8+ photos.
 * - `<kit>-sparse`: what a fresh draft looks like when we only know the name and one line about
 *   the business (like the "Founding Test Tacos" draft): everything else is still a placeholder.
 *
 * Built from the kit templates themselves, so they follow every template change. The JSON copies in
 * packages/site-schema/fixtures/design are written by design-fixtures.test.ts (UPDATE_FIXTURES=1)
 * and checked against this file on every test run.
 */
import type { SiteKitId as KitId } from '@yakini/pricing'
import type { SiteDocContent, SiteDocInput } from '@yakini/site-schema'
import { brandFor, buildKitDraft, BUILDER_KITS, offeredSamples } from './index'
import { SERVICE_SAMPLES } from './service'
import { composeHome } from './composer'
import type { KitDefinition } from './types'

type KitCopy = {
  name: string
  city: string
  /** The one line an owner gives us on /new (the sparse fixture has only this). */
  line: string
  reviews: [string, string, string]
  team: [string, string][]
}

const COPY: Record<string, KitCopy> = {
  'food-truck': { name: 'Founding Test Tacos', city: 'El Paso', line: 'Street tacos and aguas frescas, made fresh on the truck.', reviews: ['The al pastor is the best in town, and the line moves fast.', 'They catered our office lunch and everyone asked who made the food.', 'Friendly crew, fair prices, and the salsa verde is perfect.'], team: [['Rosa Medina', 'Owner and cook'], ['Luis Medina', 'Front window']] },
  restaurant: { name: 'Casa Lupita Kitchen', city: 'Las Cruces', line: 'Family recipes from northern New Mexico, cooked from scratch.', reviews: ['The green chile stew tastes like my grandmother made it.', 'Warm service and the best sopapillas we have had in years.', 'We booked the back room for a birthday and they took care of everything.'], team: [['Guadalupe Ortiz', 'Owner and chef'], ['Marco Ortiz', 'Front of house']] },
  landlord: { name: 'Northgate Homes', city: 'Tucson', line: 'Clean, quiet apartments near the university, managed by people who answer the phone.', reviews: ['Repairs get done the same week, every time.', 'The application was simple and they explained every step.', 'Three years here and I have never had to chase anyone for anything.'], team: [['Dana Whitfield', 'Property manager'], ['Carlos Ruiz', 'Maintenance lead']] },
  'real-estate': { name: 'Mesa Ridge Realty', city: 'Albuquerque', line: 'Helping families buy and sell homes on the west side.', reviews: ['She sold our house in nine days for more than we asked.', 'Patient with first-time buyers and honest about every house.', 'Knew every street in the neighborhood and it showed.'], team: [['Angela Brooks', 'Broker and owner'], ['Tom Reyes', 'Buyer specialist']] },
  'tree-lawn': { name: 'Greenline Tree and Lawn', city: 'Lubbock', line: 'Safe tree removal, trimming and weekly mowing, done right the first time.', reviews: ['They took down a dead oak next to the house without a scratch.', 'Weekly mowing that actually shows up on the same day.', 'Fair quote, clean yard, and they hauled everything away.'], team: [['Jake Turner', 'Owner and certified arborist'], ['Ben Ortiz', 'Crew lead']] },
  nonprofit: { name: 'Westside Food Partners', city: 'Phoenix', line: 'Making sure no family on the west side goes hungry.', reviews: ['They helped my family through a hard winter with dignity.', 'Volunteering here is the best part of my week.', 'Every dollar we gave went straight to families, and they showed us how.'], team: [['Monica Hale', 'Executive director'], ['Daniel Kim', 'Volunteer coordinator']] },
  'training-school': { name: 'Southwest Trade Academy', city: 'Odessa', line: 'Hands-on welding and CDL training that gets you hired.', reviews: ['I finished the welding program and started work two weeks later.', 'Instructors who have done the job and teach it straight.', 'Night classes let me keep my job while I trained.'], team: [['Ray Delgado', 'Director and lead instructor'], ['Karen Lowe', 'Student services']] },
  trucking: { name: 'Red Mesa Freight', city: 'Amarillo', line: 'Flatbed and dry van freight across the Southwest, on time and communicated.', reviews: ['Loads show up when they say, and dispatch answers at 2 a.m.', 'Best carrier we have used for oversize flatbed.', 'Clear rates and no surprises on the invoice.'], team: [['Mike Sandoval', 'Owner'], ['Lisa Park', 'Dispatch manager']] },
  oilfield: { name: 'Permian Well Services', city: 'Midland', line: 'Well servicing and roustabout crews across the Permian Basin, around the clock.', reviews: ['Crew on location within two hours of the call.', 'Clean safety record and they leave the pad cleaner than they found it.', 'Reliable rigs and operators who know what they are doing.'], team: [['Hank Wallace', 'Owner and operations'], ['Jose Luna', 'HSE manager']] },
  service: { name: 'Brightside Cleaning Co.', city: 'Santa Fe', line: 'Home and office cleaning you can count on, every week.', reviews: ['They notice the details everyone else misses.', 'Same team every week, always on time.', 'Our office has never looked this good.'], team: [['Tasha Green', 'Owner'], ['Elena Cruz', 'Team lead']] },
}

const BUSINESS = {
  phone: '+15055550142',
  email: 'hello@example.com',
  hours: [
    { day: 'mon', closed: true },
    { day: 'tue', open: '11:00', close: '20:00' }, { day: 'wed', open: '11:00', close: '20:00' },
    { day: 'thu', open: '11:00', close: '20:00' }, { day: 'fri', open: '11:00', close: '22:00' },
    { day: 'sat', open: '10:00', close: '22:00' }, { day: 'sun', open: '10:00', close: '16:00' },
  ],
}

const MENU = [
  { name: 'Tacos', items: [
    { name: 'Al pastor', description: 'Marinated pork, pineapple, onion and cilantro on corn tortillas.', price: '$3.50' },
    { name: 'Carne asada', description: 'Grilled steak, salsa roja and lime.', price: '$4', tags: ['gf'] },
    { name: 'Calabacitas', description: 'Squash, corn and green chile with queso fresco.', price: '$3.25', tags: ['veg'] },
  ] },
  { name: 'Plates', items: [
    { name: 'Green chile stew', description: 'Pork, potato and roasted Hatch chile, with a warm tortilla.', price: '$11', tags: ['spicy'] },
    { name: 'Enchilada plate', description: 'Red or green, rice and beans, egg on top if you like.', price: '$13' },
  ] },
  { name: 'Drinks', items: [
    { name: 'Horchata', price: '$3.50' }, { name: 'Agua fresca', description: 'Watermelon, jamaica or tamarind.', price: '$3.50', tags: ['veg'] },
  ] },
]

const STOPS = [
  { day: 'tue', start: '11:00', end: '14:00', place: 'Civic Plaza', address: '1 Civic Plaza' },
  { day: 'wed', start: '11:00', end: '14:00', place: 'Medical Center', address: '4800 Alberta Ave' },
  { day: 'fri', start: '17:00', end: '21:00', place: 'Brewery Row' },
  { day: 'sat', start: '10:00', end: '14:00', place: 'Downtown Growers Market' },
]

type Json = Record<string, unknown>

/** A [[fill this in]] spot becomes its example when it gives one ("like ..."), otherwise its own wording. */
function fillText(s: string): string {
  return s.replace(/\[\[([^\]]*)\]\]/g, (_m, inner: string) => {
    const example = /like [“"]([^"”]+)[”"]/.exec(inner)?.[1]
    const t = (example ?? inner).trim()
    return t || 'More about us'
  }).replace(/\s{2,}/g, ' ').trim()
}
function fillAll(v: unknown): unknown {
  if (typeof v === 'string') return fillText(v)
  if (Array.isArray(v)) return v.map(fillAll)
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fillAll(x)]))
  return v
}

/** Eight or more photos: the kit's own, then the general set, so every kit has a full gallery. */
function photos(kit: KitDefinition): { assetId: string; alt: string }[] {
  const own = offeredSamples(kit).map((s) => ({ assetId: s.assetId, alt: s.alt }))
  const extra = SERVICE_SAMPLES.filter((s) => !s.retired && !own.some((o) => o.assetId === s.assetId)).map((s) => ({ assetId: s.assetId, alt: s.alt }))
  const all = [...own, ...extra]
  while (all.length < 8) all.push(...own)
  return all.slice(0, Math.max(8, own.length))
}

function enrich(kit: KitDefinition, doc: Json, c: KitCopy): Json {
  const pics = photos(kit)
  const business = doc.business as Json
  Object.assign(business, BUSINESS, {
    tagline: c.line.slice(0, 120),
    address: { line1: '1420 Mesa Street', city: c.city, region: 'TX', postal: '79902', country: 'US' },
  })
  for (const page of doc.pages as Json[]) {
    for (const s of page.sections as Json[]) {
      const p = s.props as Json
      switch (s.type) {
        case 'menu': if (!(p.categories as unknown[]).length) p.categories = MENU; break
        case 'schedule': if (!(p.stops as unknown[]).length) p.stops = STOPS; break
        case 'testimonials': if (!(p.items as unknown[]).length) p.items = c.reviews.map((quote, i) => ({ quote, name: ['Maria G.', 'Sam T.', 'Dana L.'][i], source: i === 0 ? 'Google' : undefined })).map((x) => (x.source ? x : { quote: x.quote, name: x.name })); break
        case 'team': if (!(p.members as unknown[] | undefined)?.length) p.members = c.team.map(([name, role], i) => ({ name, role, ...(pics[i + 2] ? { photo: pics[i + 2] } : {}) })); break
        case 'gallery': p.images = pics; s.hidden = false; break
      }
    }
  }
  doc.seo = { siteTitle: c.name, description: `${c.name} in ${c.city}. ${c.line}`.slice(0, 160), ogImageAssetId: pics[0].assetId }
  return fillAll(doc) as Json
}

/** The sparse draft: only the name and the owner's one line (in the first hero's subhead). */
function sparse(doc: Json, c: KitCopy): Json {
  for (const page of doc.pages as Json[]) {
    const hero = (page.sections as Json[]).find((s) => s.type === 'hero')
    if (hero) { (hero.props as Json).subhead = c.line; break }
  }
  return doc
}

export type DesignFixtureName = `${KitId}-${'rich' | 'sparse'}`

export function designFixtures(): Record<string, SiteDocInput> {
  const out: Record<string, SiteDocInput> = {}
  for (const [id, kit] of Object.entries(BUILDER_KITS)) {
    if (!kit) continue
    const c = COPY[id]
    if (!c) throw new Error(`design fixtures: no copy for kit ${id}`)
    const brand = brandFor(kit, { colors: null })
    const rich = structuredClone(buildKitDraft(kit, { name: c.name, city: c.city, phone: BUSINESS.phone, email: BUSINESS.email }, brand)) as unknown as Json
    // Like a real draft: the layout pass runs on the finished content, photos included.
    const full = enrich(kit, rich, c) as unknown as SiteDocInput & SiteDocContent
    out[`${id}-rich`] = { ...full, ...composeHome(kit, full, {}) } as SiteDocInput
    const thin = structuredClone(buildKitDraft(kit, { name: c.name }, brand)) as unknown as Json
    out[`${id}-sparse`] = sparse(thin, c) as unknown as SiteDocInput
  }
  return out
}
