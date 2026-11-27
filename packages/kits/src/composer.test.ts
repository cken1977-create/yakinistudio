import { describe, expect, it } from 'vitest'
import type { Section, SiteDocContent } from '@yakini/site-schema'
import { designFixtures } from './design-fixtures'
import { BUILDER_KITS } from './index'
import { composeHome, plainNeighbours, rhythmSections, showsContent, showsImage } from './composer'

/**
 * Layout composer rhythm rules (design D2), on every kit, on the rich and the sparse draft.
 */
type Doc = SiteDocContent & { kitId: string }
const fixtures = Object.entries(designFixtures()) as [string, Doc][]
const kits = Object.values(BUILDER_KITS).filter((k) => !!k)
const fullBleed = (s: Section) => showsContent(s) && ((s.type === 'cta_band' && s.variant === 'image') || (s.type === 'gallery' && s.variant === 'filmstrip'))
const nonHeroPhotos = (d: Doc) => d.pages.flatMap((p) => p.sections).some((s) => s.type !== 'hero' && showsImage(s))

describe.each(fixtures)('%s', (name, doc) => {
  const home = doc.pages.find((p) => p.slug === '')!

  it('Home follows the D2 order: cinematic hero, ticker, feature rows, highlights, stats, big quote, image band, statement footer', () => {
    const types = home.sections.map((s) => s.type)
    expect(types[0]).toBe('header')
    expect(types.at(-1)).toBe('footer')
    const hero = home.sections.find((s) => s.type === 'hero')!
    if (hero.props.image) expect(hero.variant).toBe('cinematic')
    const at = (t: string) => types.indexOf(t as Section['type'])
    expect(at('hero')).toBe(1)
    if (at('ticker') >= 0) expect(at('ticker')).toBeLessThan(at('feature_rows'))
    expect(at('feature_rows')).toBeGreaterThan(at('hero'))
    expect(at('stats')).toBeGreaterThan(at('feature_rows'))
    if (at('testimonials') >= 0) {
      expect(home.sections[at('testimonials')].variant).toBe('big-quote')
      expect(at('stats')).toBeLessThan(at('testimonials'))
    }
    const gallery = home.sections.find((s) => s.type === 'gallery')
    if (gallery) expect(gallery.variant).toBe('mosaic')
    // Home ends on its one full-bleed moment when there is a photo for it.
    if (nonHeroPhotos(doc)) expect(home.sections.at(-2)).toMatchObject({ type: 'cta_band', variant: 'image' })
    for (const p of doc.pages) expect(p.sections.at(-1)).toMatchObject({ type: 'footer', variant: 'statement' })
  })

  it('rule 1: no two photo-less sections touch on Home (unless the draft has no photo to use)', () => {
    if (name.endsWith('-rich') || nonHeroPhotos(doc)) expect(plainNeighbours(home.sections)).toEqual([])
  })

  it('rule 1 elsewhere: where photo-less sections still touch, there was nothing that could take a photo', () => {
    for (const p of doc.pages) {
      if (p === home || !plainNeighbours(p.sections).length || !nonHeroPhotos(doc)) continue
      const visible = rhythmSections(p.sections)
      const plainBand = visible.some((s) => s.type === 'cta_band' && !showsImage(s)) && !visible.some(fullBleed)
      const textAbout = visible.some((s) => s.type === 'about' && !s.props.image)
      const textHero = visible.some((s) => s.type === 'hero' && !s.props.image)
      // Any candidate left must not have been able to help (it was tried and didn't reduce the count).
      if (plainBand || textAbout || textHero) {
        const before = plainNeighbours(p.sections).length
        const photo = { assetId: '7a1e0000-0000-4000-8000-0000000000ff', alt: 'x' }
        const tried = p.sections.map((s) => (s.type === 'cta_band' && plainBand ? { ...s, variant: 'image', props: { ...s.props, image: photo } } : (s.type === 'about' || s.type === 'hero') && !s.props.image ? { ...s, props: { ...s.props, image: photo } } : s) as Section)
        expect(plainNeighbours(tried).length, `${p.id}`).toBe(before)
      }
    }
  })

  it('rule 2: at most one full-bleed moment besides the hero on every page; exactly one on Home when there is a photo', () => {
    for (const p of doc.pages) expect(p.sections.filter(fullBleed).length, p.id).toBeLessThanOrEqual(1)
    if (nonHeroPhotos(doc)) expect(home.sections.filter(fullBleed)).toHaveLength(1)
  })

  it('nothing is invented: stats and feature rows start empty, the ticker repeats the site\'s own service names', () => {
    const all = doc.pages.flatMap((p) => p.sections)
    for (const s of all) {
      if (s.type === 'stats') expect(s.props.items).toEqual([])
      if (s.type === 'feature_rows') expect(s.props.items).toEqual([])
      if (s.type === 'testimonials' && name.endsWith('-sparse')) expect(s.props.items).toEqual([])
    }
    const services = new Set(all.flatMap((s) => (s.type === 'services' ? s.props.items.map((i) => i.title.trim()) : [])))
    for (const s of all) if (s.type === 'ticker') for (const t of s.props.items) expect(services.has(t)).toBe(true)
  })

  it('composing again changes nothing (the final pass on a finished draft is safe)', () => {
    const kit = BUILDER_KITS[doc.kitId as keyof typeof BUILDER_KITS]!
    const again = composeHome(kit, doc)
    expect(again.pages).toEqual(doc.pages)
  })
})

describe('composer', () => {
  it('every kit allows the new D2 sections', () => {
    for (const k of kits) for (const t of ['ticker', 'stats', 'feature_rows']) expect(k.allowedSections, k.id).toContain(t)
  })

  it('a stats band only shows with two or more of the owner\'s numbers, so an empty one is never seen', () => {
    const s = { id: 's', type: 'stats', variant: 'band', hidden: false, props: { items: [{ value: '12', label: 'years' }] } } as Section
    expect(showsContent(s)).toBe(false)
    expect(showsContent({ ...s, props: { items: [{ value: '12', label: 'years' }, { value: '400', label: 'trees' }] } } as Section)).toBe(true)
  })
})
