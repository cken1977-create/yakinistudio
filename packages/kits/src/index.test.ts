import { describe, expect, it } from 'vitest'
import { lintCopy, strayPrices } from '@yakini/ai'
import { SECTION_DEFS, SiteDoc, validateContent, type SiteDocContent } from '@yakini/site-schema'
import {
  BUILDER_KITS, BUILDER_KIT_IDS, assembleDoc, brandFor, buildKitDraft, checkAgainstKit, isBuilderKit, kitDefinition,
  kitRules, offeredSamples, sampleImageById, sampleImageSrc, unlicensedSamples, type KitDefinition,
} from './index'

const kits = Object.values(BUILDER_KITS) as KitDefinition[]
const ctx = { name: 'Mesa Street Tacos', phone: '+15055550142', city: 'Albuquerque' }

describe('kit registry (Phase 1)', () => {
  it('ships exactly the food truck and restaurant kits', () => {
    expect([...BUILDER_KIT_IDS].sort()).toEqual(['food-truck', 'restaurant'])
    expect(kitDefinition('food-truck')?.name).toBe('Food truck')
    expect(isBuilderKit('restaurant')).toBe(true)
    expect(isBuilderKit('landlord')).toBe(false)
    expect(isBuilderKit('__proto__')).toBe(false)
    expect(isBuilderKit(undefined)).toBe(false)
  })
  it('every sample image declares a licence and a redistributable flag', () => {
    expect(unlicensedSamples()).toEqual([])
    for (const k of kits) for (const img of k.sampleImages) {
      expect(typeof img.license.redistributable).toBe('boolean')
      expect(sampleImageById(img.assetId)).toBe(img)
      expect(img.storagePath).toMatch(/^kit-samples\/[a-z-]+\/[a-z-]+\.(svg|webp|jpg|png)$/)
    }
  })
  it('offers photos (JPEG plus WebP copies) and keeps the retired drawings resolvable for old drafts', () => {
    for (const k of kits) {
      const offered = offeredSamples(k)
      expect(offered.length, k.id).toBeGreaterThanOrEqual(5)
      for (const img of offered) {
        expect(img.mime).toBe('image/jpeg')
        expect(img.webp?.large).toMatch(/^[a-z-]+\.webp$/)
        expect(img.webp?.small).toMatch(/^[a-z-]+-sm\.webp$/)
        expect(img.alt.length).toBeGreaterThan(20)
        expect(img.alt).not.toMatch(/illustration|\bAI\b|generated/i)
        expect(sampleImageSrc(img)).toBe(`/kit-samples/${k.id}/${img.webp!.large}`)
        expect(sampleImageSrc(img, 'small')).toBe(`/kit-samples/${k.id}/${img.webp!.small}`)
      }
      for (const old of k.sampleImages.filter((s) => s.retired)) expect(sampleImageById(old.assetId)).toBe(old)
      const ids = new Set(k.sampleImages.map((s) => s.assetId))
      expect(ids.size, 'asset ids are unique').toBe(k.sampleImages.length)
    }
  })
  it('new drafts use photos, never the retired drawings', () => {
    for (const k of kits) {
      const json = JSON.stringify(k.template({ name: 'Test Co' }))
      for (const old of k.sampleImages.filter((s) => s.retired)) expect(json).not.toContain(old.assetId)
      expect(offeredSamples(k).some((s) => json.includes(s.assetId)), k.id).toBe(true)
    }
  })
  it('flags any sample image without licence info', () => {
    const base = BUILDER_KITS['food-truck']!
    const bad = { ...base, sampleImages: [{ ...base.sampleImages[0], license: { kind: 'licensed-stock', source: '', redistributable: false } }] } as KitDefinition
    expect(unlicensedSamples({ 'food-truck': bad })).toEqual(['food-truck:truck'])
  })
  it('defaultVariants only names real variants of allowed sections', () => {
    for (const k of kits) for (const [type, variant] of Object.entries(k.defaultVariants)) {
      expect(k.allowedSections).toContain(type)
      expect(SECTION_DEFS[type as keyof typeof SECTION_DEFS].variants).toContain(variant)
    }
  })
})

describe.each(kits.map((k) => [k.id, k] as const))('%s template', (_id, kit) => {
  const content = kit.template(ctx)
  it('is valid content that fits its own kit rules', () => {
    expect(validateContent(content)).toMatchObject({ ok: true })
    expect(checkAgainstKit(content, kit)).toEqual([])
  })
  it('has five pages with a home page, each starting with a header and ending with a footer', () => {
    expect(content.pages).toHaveLength(5)
    expect(content.pages[0].slug).toBe('')
    for (const p of content.pages) {
      expect(p.sections[0].type).toBe('header')
      expect(p.sections.at(-1)?.type).toBe('footer')
      expect(p.sections.map((s) => s.type)).toEqual(kit.pageTemplates.find((t) => t.id === p.id)?.sectionTypes)
    }
  })
  it('puts a Today section right after the home hero, hidden until the first update', () => {
    const home = content.pages[0].sections
    const i = home.findIndex((s) => s.type === 'hero')
    expect(home[i + 1]).toMatchObject({ type: 'today', props: { emptyBehavior: 'hide' } })
  })
  it('builds a valid fallback draft that uses the given colors exactly (R6)', () => {
    const colors = { primary: '#9a3412', secondary: '#15130F', accent: '#F59E0B' }
    const doc = SiteDoc.parse(buildKitDraft(kit, ctx, brandFor(kit, { colors })))
    expect(doc.brand.colors).toEqual(colors)
    expect(doc.brand.colorsSource).toBe('extracted')
    expect(doc.business.name).toBe('Mesa Street Tacos')
    expect(doc.footer.showSiteByYakini).toBe(true)
  })
  it('falls back to the kit palette, labelled kit-default, when there are no colors', () => {
    const doc = SiteDoc.parse(buildKitDraft(kit, { name: 'X' }, brandFor(kit, { colors: null })))
    expect(doc.brand.colors).toEqual(kit.defaultPalette)
    expect(doc.brand.colorsSource).toBe('kit-default')
  })
  it('never lets content set brand or integrations', () => {
    const sneaky = { ...content, brand: { colors: { primary: '#ff0000' } }, integrations: { bookingEnabled: true } } as unknown as SiteDocContent
    const doc = SiteDoc.parse(assembleDoc(kit, sneaky, brandFor(kit, { colors: { primary: '#123456', secondary: '#000000', accent: '#ffffff' } })))
    expect(doc.brand.colors.primary).toBe('#123456')
    expect(doc.integrations).toEqual({ bookingEnabled: false, formsEnabled: true })
  })
  it('copy names no vendors, never says AI-built and shows no prices (R7, R8, R9)', () => {
    const text = JSON.stringify(content)
    expect(lintCopy(text)).toEqual([])
    expect(strayPrices(text)).toEqual([])
    expect(kit.copyTone.length).toBeGreaterThan(40)
  })
  it('handles a very long business name and city without breaking limits', () => {
    expect(validateContent(kit.template({ name: 'A'.repeat(120), city: 'B'.repeat(80) }))).toMatchObject({ ok: true })
  })
  it('has Today kinds whose schemas refuse unknown fields', () => {
    expect(kit.todayKinds.length).toBeGreaterThan(1)
    for (const k of kit.todayKinds) expect(k.fields.safeParse({ unexpected: true }).success).toBe(false)
  })
  it('exports kit rules for the prompt', () => {
    const r = kitRules(kit)
    expect(r.pageTemplates).toHaveLength(5)
    expect(r.allowedSections).toContain('today')
  })
})

describe('Today kinds (spec 11.5)', () => {
  const ft = BUILDER_KITS['food-truck']!.todayKinds
  const rs = BUILDER_KITS.restaurant!.todayKinds
  it('food truck: stop and off', () => {
    expect(ft.map((k) => k.id)).toEqual(['stop', 'off'])
    const stop = ft[0].fields
    expect(stop.safeParse({ place: 'Civic Plaza', start: '11:00', end: '14:00' }).success).toBe(true)
    expect(stop.safeParse({ place: 'Civic Plaza', start: '14:00', end: '11:00' }).success).toBe(false)
    expect(stop.safeParse({ place: '', start: '11:00', end: '14:00' }).success).toBe(false)
    expect(stop.safeParse({ place: 'x', start: '25:00', end: '26:00' }).success).toBe(false)
    expect(ft[1].fields.safeParse({}).success).toBe(true)
    expect(ft[1].headline).toBe('Not out today')
  })
  it('restaurant: special, hours and closed', () => {
    expect(rs.map((k) => k.id)).toEqual(['special', 'hours', 'closed'])
    expect(rs[0].fields.safeParse({ title: 'Green chile stew' }).success).toBe(true)
    expect(rs[0].fields.safeParse({ title: 'x', price: '$'.repeat(21) }).success).toBe(false)
    expect(rs[1].fields.safeParse({ open: '16:00', close: '21:00' }).success).toBe(true)
    expect(rs[1].fields.safeParse({ open: '21:00', close: '16:00' }).success).toBe(false)
    expect(rs[2].headline).toBe('Closed today')
  })
})

describe('kit check (AI output must fit the kit)', () => {
  const kit = BUILDER_KITS['food-truck']!
  it('reports missing pages, wrong addresses and misplaced header/footer', () => {
    const c = kit.template(ctx)
    const broken: SiteDocContent = {
      ...c,
      pages: [
        { ...c.pages[0], sections: [...c.pages[0].sections].reverse() },
        { ...c.pages[1], slug: 'food' },
        { ...c.pages[2], id: 'blog' },
      ],
    }
    const issues = checkAgainstKit(broken, kit).join('\n')
    expect(issues).toMatch(/exactly these 5 pages/)
    expect(issues).toMatch(/first section must be the header/)
    expect(issues).toMatch(/must use the address "menu"/)
    expect(issues).toMatch(/"blog" is not one of the kit pages/)
    expect(issues).toMatch(/the "catering" page is missing/)
  })
})
