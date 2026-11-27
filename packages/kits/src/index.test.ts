import { describe, expect, it } from 'vitest'
import { lintCopy, strayPrices } from '@yakini/ai'
import { SECTION_DEFS, SiteDoc, validateContent, type SiteDocContent } from '@yakini/site-schema'
import {
  BUILDER_KITS, BUILDER_KIT_IDS, assembleDoc, brandFor, buildKitDraft, checkAgainstKit, isBuilderKit, kitDefinition,
  INDUSTRIES, INDUSTRY_GROUPS, industryById, kitRules, offeredSamples, sampleImageById, sampleImageSrc, unlicensedSamples, type KitDefinition,
} from './index'
import { KITS, SITE_ONLY_KIT_IDS } from '@yakini/pricing'

const kits = Object.values(BUILDER_KITS) as KitDefinition[]
const ctx = { name: 'Mesa Street Tacos', phone: '+15055550142', city: 'Albuquerque' }

describe('kit registry', () => {
  it('ships every kit that has approved photos, plus the general service kit', () => {
    expect([...BUILDER_KIT_IDS].sort()).toEqual(['food-truck', 'landlord', 'nonprofit', 'oilfield', 'real-estate', 'restaurant', 'service', 'training-school', 'tree-lawn', 'trucking'])
    expect(kitDefinition('service')?.name).toBe('Business and services')
    expect(kitDefinition('food-truck')?.name).toBe('Food truck')
    expect(isBuilderKit('restaurant')).toBe(true)
    expect(isBuilderKit('landlord')).toBe(true)
    expect(isBuilderKit('cannabis')).toBe(false)
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
      expect(offered.length, k.id).toBeGreaterThanOrEqual(3)
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
      // The general kit only shows a photo when the industry's own work is in it.
      const json = JSON.stringify(k.template({ name: 'Test Co', ...(k.id === 'service' ? { industry: { label: 'Plumber', photo: 'pipe-fitting' } } : {}) }))
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
  it('has its template pages, a home page first, each starting with a header and ending with a footer', () => {
    expect(content.pages).toHaveLength(kit.pageTemplates.length)
    expect(content.pages.length).toBeGreaterThanOrEqual(4)
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
    expect(r.pageTemplates).toHaveLength(kit.pageTemplates.length)
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

describe('industries (what the owner picks on /new)', () => {
  const sold = new Set<string>([...KITS.map((k) => k.id), ...SITE_ONLY_KIT_IDS])
  it('offers a broad list, every id unique, every group used', () => {
    expect(INDUSTRIES.length).toBeGreaterThanOrEqual(150)
    expect(new Set(INDUSTRIES.map((i) => i.id)).size).toBe(INDUSTRIES.length)
    for (const g of INDUSTRY_GROUPS) expect(INDUSTRIES.some((i) => i.group === g), g).toBe(true)
  })
  it('points every industry at a real kit, and photos only at real service samples', () => {
    const photos = new Set(BUILDER_KITS.service!.sampleImages.map((s) => s.key))
    for (const i of INDUSTRIES) {
      expect(sold.has(i.kit), i.id).toBe(true)
      expect(i.id).toMatch(/^[a-z0-9-]{2,40}$/)
      expect(i.label.length).toBeLessThanOrEqual(40)
      if (i.photo) expect(photos.has(i.photo), i.id).toBe(true)
    }
  })
  it('looks industries up by id only', () => {
    expect(industryById('law-firm')?.label).toBe('Law firm or attorney')
    expect(industryById('holding-company')?.kit).toBe('service')
    // Industries whose kit is built now land on it.
    for (const id of ['landlord', 'real-estate-agent', 'lawn-care', 'church', 'trade-school', 'owner-operator', 'well-service']) expect(isBuilderKit(industryById(id)!.kit), id).toBe(true)
    expect(industryById('__proto__')).toBeUndefined()
    expect(industryById('')).toBeUndefined()
  })
  it('the general kit writes the industry into the draft and leaves the hero text-only without a fitting photo', () => {
    const svc = BUILDER_KITS.service!
    const law = svc.template({ name: 'BRSA Holdings', city: 'Albuquerque', industry: { label: 'Holding company or investments' } })
    const hero = law.pages[0].sections.find((s) => s.type === 'hero')!
    expect(hero.variant).toBe('minimal')
    expect(hero.props).toMatchObject({ eyebrow: 'Holding company or investments in Albuquerque' })
    expect(JSON.stringify(law)).not.toMatch(/7a1e0000-0000-4000-8000-0000000003/)
    const plumber = svc.template({ name: 'Rio Plumbing', industry: { label: 'Plumber', photo: 'pipe-fitting' } })
    expect(plumber.pages[0].sections.find((s) => s.type === 'hero')).toMatchObject({ variant: 'cinematic', props: { image: { assetId: '7a1e0000-0000-4000-8000-000000000305' } } })
  })
})

describe('color presets', () => {
  it('are valid hex colors with unique ids, looked up by id only', async () => {
    const { COLOR_PRESETS, colorPresetById } = await import('./index')
    const { HexColor } = await import('@yakini/site-schema')
    expect(COLOR_PRESETS.length).toBeGreaterThanOrEqual(12)
    expect(new Set(COLOR_PRESETS.map((p) => p.id)).size).toBe(COLOR_PRESETS.length)
    for (const p of COLOR_PRESETS) for (const c of Object.values(p.colors)) expect(HexColor.safeParse(c).success, `${p.id} ${c}`).toBe(true)
    expect(colorPresetById('ocean')?.colors.primary).toBe('#0F6E8C')
    expect(colorPresetById('constructor')).toBeUndefined()
  })
})

describe('kit details', () => {
  it('asset ids are unique across all kits', () => {
    const all = kits.flatMap((k) => k.sampleImages.map((s) => s.assetId))
    expect(new Set(all).size).toBe(all.length)
  })
  it('every kit has a form a visitor can reach, and every in-site link points at a real page and section', () => {
    for (const k of kits) {
      const c = k.template(ctx)
      const ids = new Map(c.pages.map((p) => [p.id, new Set(p.sections.map((s) => s.id))]))
      const targets = JSON.stringify(c).match(/\{"kind":"(page|section)","pageId":"[^"]+"(,"sectionId":"[^"]+")?\}/g) ?? []
      expect(targets.length, k.id).toBeGreaterThan(0)
      for (const t of targets) {
        const o = JSON.parse(t) as { pageId: string; sectionId?: string }
        expect(ids.has(o.pageId), `${k.id} ${t}`).toBe(true)
        if (o.sectionId) expect(ids.get(o.pageId)!.has(o.sectionId), `${k.id} ${t}`).toBe(true)
      }
      expect(c.pages.some((p) => p.sections.some((s) => s.type === 'contact_form' || s.type === 'catering_request')), k.id).toBe(true)
    }
  })
  it('Today kinds: an open house must end after it starts', () => {
    const oh = BUILDER_KITS['real-estate']!.todayKinds.find((t) => t.id === 'open_house')!
    expect(oh.fields.safeParse({ place: '12 Elm St', start: '13:00', end: '15:00' }).success).toBe(true)
    expect(oh.fields.safeParse({ place: '12 Elm St', start: '15:00', end: '13:00' }).success).toBe(false)
  })
})
