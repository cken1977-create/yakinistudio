import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  SECTION_DEFS, SECTION_TYPES, Section, SiteDoc, SiteDocContent, linksIn, loadSiteDoc, siteDocContentJsonSchema,
  validateContent, validateNewDoc, type SectionType,
} from './index'
import { v1ToV2 } from './migrations/v1_to_v2'

const V1 = join(__dirname, '..', 'fixtures', 'v1')
const fixture = (f: string) => JSON.parse(readFileSync(join(V1, f), 'utf8'))
/** A v1 fixture brought to the current version (raw, so tests can break it before validating). */
const every = (kit: string) => v1ToV2.up(fixture(`${kit}-every-section.json`)) as any // eslint-disable-line @typescript-eslint/no-explicit-any

describe('section library coverage (spec 7.2, 7.4 fixture corpus)', () => {
  it('has the 17 Phase 1 section types', () => {
    expect(SECTION_TYPES).toEqual([
      'header', 'hero', 'about', 'services', 'menu', 'schedule', 'gallery', 'hours_location', 'testimonials',
      'faq', 'team', 'cta_band', 'contact_form', 'booking', 'catering_request', 'today', 'footer',
    ])
  })
  it.each(['food-truck', 'restaurant'])('the %s fixture covers every section type and variant', (kit) => {
    const { doc } = loadSiteDoc(every(kit))
    const seen = new Set(doc.pages.flatMap((p) => p.sections.map((s) => `${s.type}:${s.variant}`)))
    for (const t of SECTION_TYPES) for (const v of SECTION_DEFS[t].variants) expect(seen, `${t}:${v}`).toContain(`${t}:${v}`)
  })
  it('every v1 fixture loads', () => {
    const files = readdirSync(V1)
    expect(files.length).toBeGreaterThanOrEqual(4)
    for (const f of files) expect(() => loadSiteDoc(fixture(f)), f).not.toThrow()
  })
})

const sec = (type: SectionType, props: unknown, variant: string = SECTION_DEFS[type].variants[0]) =>
  Section.safeParse({ id: 's1', type, variant, hidden: false, props })

describe('per-section props schemas', () => {
  it('accepts the minimum props of each type', () => {
    const minimum: Record<SectionType, unknown> = {
      header: {}, hero: { headline: 'Hi' }, about: { heading: 'About', body: [] }, services: { heading: 'S', items: [] },
      menu: { heading: 'Menu', categories: [] }, schedule: { heading: 'Where', stops: [] }, gallery: { images: [] },
      hours_location: { heading: 'Hours' }, testimonials: { items: [] }, faq: { items: [] }, team: { members: [] },
      cta_band: { headline: 'Go', cta: { label: 'Menu', target: { kind: 'page', pageId: 'menu' } } },
      contact_form: { heading: 'Write', formKey: 'contact', fields: ['name', 'email'], submitLabel: 'Send', consentText: 'OK' },
      booking: { heading: 'Book', mode: 'request' }, catering_request: { heading: 'Cater', formKey: 'cater', fields: ['name', 'phone'], submitLabel: 'Send', consentText: 'OK' },
      today: { emptyBehavior: 'hide' }, footer: {},
    }
    for (const t of SECTION_TYPES) expect(sec(t, minimum[t]).success, t).toBe(true)
  })
  it('rejects unknown variants and unknown props', () => {
    expect(sec('hero', { headline: 'Hi' }, 'carousel').success).toBe(false)
    expect(sec('hero', { headline: 'Hi', html: '<b>x</b>' }).success).toBe(false)
    expect(sec('footer', { poweredBy: true }).success).toBe(false)
  })
  it('enforces text limits', () => {
    expect(sec('hero', { headline: 'x'.repeat(91) }).success).toBe(false)
    expect(sec('today', { emptyBehavior: 'hide', heading: 'x'.repeat(61) }).success).toBe(false)
    expect(sec('testimonials', { items: [{ quote: 'x'.repeat(401), name: 'A' }] }).success).toBe(false)
    expect(sec('about', { heading: 'A', body: [{ type: 'p', children: [{ text: 'x'.repeat(1000) }, { text: 'y'.repeat(501) }] }] }).success).toBe(false)
    expect(sec('gallery', { images: Array.from({ length: 25 }, () => ({ assetId: '3f2a1b9c-4d5e-4f60-8a7b-1c2d3e4f5a6b', alt: 'x' })) }).success).toBe(false)
  })
  it('stores script-looking text as plain text, but refuses unsafe links', () => {
    expect(sec('hero', { headline: '<script>alert(1)</script>' }).success).toBe(true) // rendered escaped, never as HTML
    const bad = (url: string) => sec('cta_band', { headline: 'x', cta: { label: 'Go', target: { kind: 'url', url } } }).success
    expect(bad('javascript:alert(1)')).toBe(false)
    expect(bad('http://example.com')).toBe(false)
    expect(bad('https://user:pw@example.com')).toBe(false)
    expect(bad('data:text/html,hi')).toBe(false)
    expect(bad('https://example.com/menu')).toBe(true)
  })
  it('refuses control characters in text', () => {
    expect(sec('hero', { headline: 'Hi\u0000there' }).success).toBe(false)
    expect(sec('hero', { headline: 'Line one\nline two' }).success).toBe(true)
  })
  it('form fields come from a fixed allow-list that can never ask for secrets (14.8)', () => {
    const form = (fields: unknown) => sec('contact_form', { heading: 'W', formKey: 'c', fields, submitLabel: 'Send', consentText: 'OK' }).success
    expect(form(['name', 'email', 'password'])).toBe(false)
    expect(form(['name', 'email', 'card_number'])).toBe(false)
    expect(form(['name', 'email', 'ssn'])).toBe(false)
    expect(form(['name', 'name', 'email'])).toBe(false)
    expect(form(['name', 'message'])).toBe(false) // no way to reply
    expect(form(['name', 'phone'])).toBe(true)
  })
  it('requires schedule stops to end after they start and uses 24-hour times', () => {
    const stop = (start: string, end: string) => sec('schedule', { heading: 'W', stops: [{ day: 'mon', start, end, place: 'Plaza' }] }).success
    expect(stop('11:00', '14:00')).toBe(true)
    expect(stop('14:00', '11:00')).toBe(false)
    expect(stop('9:00', '14:00')).toBe(false)
  })
  it('only allows the three menu tags', () => {
    const item = (tags: unknown) => sec('menu', { heading: 'M', categories: [{ name: 'C', items: [{ name: 'Taco', tags }] }] }).success
    expect(item(['veg', 'gf'])).toBe(true)
    expect(item(['halal'])).toBe(false)
  })
})

describe('doc integrity', () => {
  const base = () => every('food-truck')
  it('refuses links to missing pages, sections and forms', () => {
    const a = base(); a.nav.cta.target = { kind: 'page', pageId: 'nowhere' }
    expect(validateNewDoc(a)).toMatchObject({ ok: false })
    const b = base(); b.pages[0].sections[1].props.secondaryCta.target = { kind: 'section', pageId: 'home', sectionId: 'nope' }
    expect(validateNewDoc(b)).toMatchObject({ ok: false })
    const c = base(); c.pages[0].sections[7].props.cta.target = { kind: 'form', formKey: 'nope' }
    expect(validateNewDoc(c)).toMatchObject({ ok: false })
  })
  it('refuses duplicate section ids on a page and duplicate form keys', () => {
    const a = base(); a.pages[1].sections[2].id = a.pages[1].sections[1].id
    expect(validateNewDoc(a)).toMatchObject({ ok: false })
    const b = base(); b.pages[2].sections[11].props.formKey = 'contact'
    const r = validateNewDoc(b)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.issues.join(' ')).toMatch(/Two forms use the key "contact"/)
  })
  it('requires a home page', () => {
    const a = base(); a.pages[0].slug = 'start'
    expect(SiteDoc.safeParse(a).success).toBe(false)
  })
  it('finds every link in nav, footer and sections', () => {
    const { doc } = loadSiteDoc(base())
    const kinds = new Set(linksIn(doc).map((l) => l.kind))
    for (const k of ['page', 'section', 'tel', 'mailto', 'form']) expect(kinds).toContain(k)
  })
  it('gives plain-English issues with paths, for a model retry', () => {
    const a = base(); a.pages[0].sections[1].props.headline = ''
    const r = validateNewDoc(a)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.issues[0]).toMatch(/^pages\.0\.sections\.1\.props\.headline: /)
  })
  it('refuses a doc over the stored size limit', () => {
    const a = base()
    a.pages = Array.from({ length: 12 }, (_, i) => ({ ...structuredClone(a.pages[2]), id: `p${i}`, slug: i === 0 ? '' : `p${i}` }))
    a.nav.items = []
    a.nav.cta = undefined
    a.footer.extraLinks = []
    for (const pg of a.pages) for (const s of pg.sections) if (s.type === 'about') s.props.body = [{ type: 'p', children: [{ text: 'x'.repeat(1490) }] }]
    for (const pg of a.pages) for (const s of pg.sections) if (s.type === 'faq') s.props.items = Array.from({ length: 20 }, () => ({ q: 'q'.repeat(160), a: [{ type: 'p', children: [{ text: 'a'.repeat(800) }] }] }))
    let n = 0
    for (const pg of a.pages) for (const s of pg.sections) if (s.type === 'contact_form' || s.type === 'catering_request') s.props.formKey = `f${n++}`
    const r = validateNewDoc(a)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.issues[0]).toMatch(/too large/)
  })
})

describe('AI content schema (spec 8.5)', () => {
  it('has no brand, integrations or schemaVersion, so the model cannot set them', () => {
    const s = siteDocContentJsonSchema() as { properties: Record<string, unknown>; required: string[] }
    expect(Object.keys(s.properties)).not.toContain('brand')
    expect(Object.keys(s.properties)).not.toContain('integrations')
    expect(Object.keys(s.properties)).not.toContain('schemaVersion')
    expect(JSON.stringify(s)).toContain('catering_request')
    expect(JSON.stringify(s).length).toBeLessThan(120_000)
  })
  it('refuses content that carries a brand block', () => {
    const { brand: _b, integrations: _i, schemaVersion: _v, style: _s, ...content } = every('restaurant')
    expect(validateContent(content)).toMatchObject({ ok: true })
    expect(SiteDocContent.safeParse({ ...content, brand: _b }).success).toBe(false)
  })
})

describe('outbound link policy (8.8, 14.8)', () => {
  it('allows the business’s own site, social pages and maps only', async () => {
    const { isAllowedOutboundUrl, ownHostsFor } = await import('./index')
    const own = ownHostsFor('https://www.mesatacos.com/menu')
    expect(own).toEqual(['mesatacos.com', 'www.mesatacos.com'])
    expect(isAllowedOutboundUrl('https://mesatacos.com/order', own)).toBe(true)
    expect(isAllowedOutboundUrl('https://order.mesatacos.com/', own)).toBe(true)
    expect(isAllowedOutboundUrl('https://www.instagram.com/mesatacos', own)).toBe(true)
    expect(isAllowedOutboundUrl('https://maps.google.com/?q=x', own)).toBe(true)
    expect(isAllowedOutboundUrl('https://evil.example', own)).toBe(false)
    expect(isAllowedOutboundUrl('https://mesatacos.com.evil.example', own)).toBe(false)
    expect(isAllowedOutboundUrl('https://notinstagram.com', own)).toBe(false)
    expect(isAllowedOutboundUrl('http://mesatacos.com', own)).toBe(false)
    expect(isAllowedOutboundUrl('https://evil.example', [])).toBe(false)
  })
})
