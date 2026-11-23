import { describe, expect, it } from 'vitest'
import { buildKitDraft, brandFor, kitDefinition } from '@yakini/kits'
import { loadSiteDoc, type SiteDoc } from '@yakini/site-schema'
import fixture from '@yakini/site-schema/fixtures/v1/food-truck-every-section.json'
import { applyOps, describeOp, emptyHistory, record, redo, undo, type EditContext, type EditOp } from './index'

const SAMPLE = '7a1e0000-0000-4000-8000-000000000102'
const OWN = '11111111-2222-4333-8444-555555555555'
let n = 0
const ctx: EditContext = { allowedAssetIds: new Set([SAMPLE, OWN]), newId: (p) => `${p}-t${++n}` }
const base = (): SiteDoc => loadSiteDoc(structuredClone(fixture)).doc
const kitDraft = (): SiteDoc => {
  const kit = kitDefinition('restaurant')!
  return loadSiteDoc(buildKitDraft(kit, { name: 'Harbor Room' }, brandFor(kit, { colors: { primary: '#1E3A34', secondary: '#111111', accent: '#C9A14A' } }))).doc
}

/** Apply, then apply the inverse: the doc must come back exactly. */
function roundTrip(doc: SiteDoc, ops: EditOp[]) {
  const r = applyOps(doc, ops, ctx)
  if (!r.ok) throw new Error(r.error)
  expect(r.doc).not.toEqual(doc)
  const back = applyOps(r.doc, r.inverse, ctx, { internal: true })
  if (!back.ok) throw new Error(back.error)
  expect(back.doc).toEqual(doc)
  // Redo with the ops as applied reproduces the same result.
  const again = applyOps(doc, r.applied, ctx, { internal: true })
  if (!again.ok) throw new Error(again.error)
  expect(again.doc).toEqual(r.doc)
  return r
}

describe('every op applies and undoes exactly (spec 16.2)', () => {
  const cases: [string, () => SiteDoc, EditOp[]][] = [
    ['update_field text', base, [{ op: 'update_field', pageId: 'home', sectionId: 'hero', path: '/headline', value: 'We cater weddings' }]],
    ['update_field add optional', base, [{ op: 'update_field', pageId: 'home', sectionId: 'hero-minimal', path: '/eyebrow', value: 'Since 2019' }]],
    ['update_field list item', base, [{ op: 'update_field', pageId: 'menu', sectionId: 'menu-cards', path: '/categories/0/items/0/price', value: '$5' }]],
    ['update_business', base, [{ op: 'update_business', field: 'tagline', value: 'Tacos on wheels' }]],
    ['update_business hours', base, [{ op: 'update_business', field: 'hours', value: [{ day: 'sat', open: '10:00', close: '16:00' }] }]],
    ['add_section', base, [{ op: 'add_section', pageId: 'home', afterSectionId: 'hero', type: 'faq', variant: 'accordion', props: { heading: 'Questions', items: [{ q: 'Do you cater?', a: [{ type: 'p', children: [{ text: 'Yes, ask us.' }] }] }] } }]],
    ['remove_section', base, [{ op: 'remove_section', pageId: 'home', sectionId: 'reviews-single' }]],
    ['move_section', base, [{ op: 'move_section', pageId: 'home', sectionId: 'cta-solid', toIndex: 1 }]],
    ['duplicate_section', base, [{ op: 'duplicate_section', pageId: 'home', sectionId: 'reviews-cards' }]],
    ['set_section_variant', base, [{ op: 'set_section_variant', pageId: 'home', sectionId: 'hero', variant: 'minimal' }]],
    ['set_section_hidden', base, [{ op: 'set_section_hidden', pageId: 'home', sectionId: 'cta-outline', hidden: true }]],
    ['set_image', base, [{ op: 'set_image', pageId: 'home', sectionId: 'hero', path: '/image', assetId: OWN, alt: 'The truck at night' }]],
    ['add_page', kitDraft, [{ op: 'remove_page', pageId: 'events' }, { op: 'add_page', template: 'events', title: 'Private parties', slug: 'parties' }]],
    ['remove_page', base, [{ op: 'remove_page', pageId: 'more' }]],
    ['rename_page', base, [{ op: 'rename_page', pageId: 'menu', title: 'Our food', slug: 'food' }]],
    ['move_page', base, [{ op: 'move_page', pageId: 'more', toIndex: 1 }]],
    ['set_seo site', base, [{ op: 'set_seo', pageId: null, title: 'Mesa Street Tacos', description: 'Street tacos around town.' }]],
    ['set_seo page', base, [{ op: 'set_seo', pageId: 'menu', description: 'Our full taco menu.' }]],
  ]
  it.each(cases)('%s', (_name, make, ops) => { roundTrip(make(), ops) })

  it('a batch of several ops undoes in one step, in reverse order', () => {
    roundTrip(base(), [
      { op: 'update_field', pageId: 'home', sectionId: 'hero', path: '/headline', value: 'New headline' },
      { op: 'move_section', pageId: 'home', sectionId: 'reviews-cards', toIndex: 2 },
      { op: 'remove_section', pageId: 'home', sectionId: 'hero-minimal' },
    ])
  })
})

describe('refusals leave the doc untouched', () => {
  const refuse = (ops: unknown[], match: RegExp) => {
    const doc = base()
    const before = JSON.stringify(doc)
    const r = applyOps(doc, ops, ctx)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(match)
    expect(JSON.stringify(doc)).toBe(before)
  }
  it('no op can reach brand colors or logo (R6)', () => {
    refuse([{ op: 'update_business', field: 'brand', value: {} }], /field/)
    refuse([{ op: 'update_field', pageId: 'home', sectionId: 'hero', path: '/../../brand', value: 'x' }], /path/i)
    refuse([{ op: 'set_brand', colors: { primary: '#ff0000' } }], /op/)
  })
  it('only fields the inspector lists can change', () => {
    refuse([{ op: 'update_field', pageId: 'home', sectionId: 'hero', path: '/notAField', value: 'x' }], /can't be changed/)
    refuse([{ op: 'update_field', pageId: 'more', sectionId: Object.keys({}).join('') || 'contact-simple', path: '/fields', value: ['name'] }], /can't be changed|no section/)
  })
  it('an invalid value is refused by the whole-site check', () => {
    refuse([{ op: 'update_field', pageId: 'home', sectionId: 'hero', path: '/headline', value: 'x'.repeat(500) }], /headline/i)
    refuse([{ op: 'update_business', field: 'phone', value: '555-1234' }], /phone/i)
  })
  it('header, footer and home page stay put', () => {
    refuse([{ op: 'remove_section', pageId: 'home', sectionId: 'header' }], /header and footer stay/)
    refuse([{ op: 'move_section', pageId: 'home', sectionId: 'footer', toIndex: 2 }], /footer at the bottom/)
    refuse([{ op: 'remove_page', pageId: 'home' }], /home page/)
  })
  it('photos must belong to this business; sections must be in the kit; styles must exist', () => {
    refuse([{ op: 'set_image', pageId: 'home', sectionId: 'hero', path: '/image', assetId: '99999999-2222-4333-8444-555555555555', alt: 'x' }], /isn't one of yours/)
    refuse([{ op: 'set_section_variant', pageId: 'home', sectionId: 'hero', variant: 'neon' }], /isn't a style/)
    refuse([{ op: 'add_section', pageId: 'home', afterSectionId: null, type: 'header', variant: 'bar', props: {} }], /already has its header/)
  })
  it('the plan page limit holds', () => {
    const doc = kitDraft()
    const r = applyOps(doc, [{ op: 'add_page', template: 'menu', title: 'Second menu', slug: 'menu-two' }], ctx)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/room for 5 pages/)
  })
  it('one bad op in a batch rejects the whole batch', () => {
    refuse([
      { op: 'update_field', pageId: 'home', sectionId: 'hero', path: '/headline', value: 'Fine' },
      { op: 'remove_page', pageId: 'home' },
    ], /home page/)
  })
})

describe('proposal wording and undo history', () => {
  it('describes changes in plain words', () => {
    const doc = base()
    expect(describeOp(doc, { op: 'update_field', pageId: 'home', sectionId: 'hero', path: '/headline', value: 'We cater weddings' })).toBe('Changed the headline on Home to “We cater weddings”')
    expect(describeOp(doc, { op: 'update_business', field: 'hours', value: [] })).toBe('Updated your hours')
    expect(describeOp(doc, { op: 'set_section_hidden', pageId: 'home', sectionId: 'cta-solid', hidden: true })).toBe('Hid the call-to-action band section on Home')
  })
  it('keeps 50 steps and redo clears on a new change', () => {
    let h = emptyHistory()
    for (let i = 0; i < 60; i++) h = record(h, { applied: [], inverse: [], label: `#${i}` })
    expect(h.past).toHaveLength(50)
    const u = undo(h)!
    expect(u.entry.label).toBe('#59')
    expect(redo(u.next)!.entry.label).toBe('#59')
    expect(record(u.next, { applied: [], inverse: [], label: 'new' }).future).toEqual([])
  })
})
