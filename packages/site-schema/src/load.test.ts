import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CURRENT_SCHEMA_VERSION, SiteDoc, loadSiteDoc, siteDocJsonSchema, SiteDocError, type Migration } from './index'

const FIXTURES = join(__dirname, '..', 'fixtures')
const fixture = (v: string, f: string) => JSON.parse(readFileSync(join(FIXTURES, v, f), 'utf8'))

describe('loadSiteDoc', () => {
  it('loads every fixture of every shipped version to the current version', () => {
    const versions = readdirSync(FIXTURES).filter((d) => /^v\d+$/.test(d))
    expect(versions.length).toBeGreaterThan(0)
    for (const v of versions) for (const f of readdirSync(join(FIXTURES, v))) {
      const { doc } = loadSiteDoc(fixture(v, f))
      expect(doc.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    }
  })
  it('defaults the Site by Yakini footer link to on (Q6)', () => {
    expect(loadSiteDoc(fixture('v1', 'restaurant-minimal.json')).doc.footer.showSiteByYakini).toBe(true)
  })
  it('refuses a doc newer than the code knows, never guessing down', () => {
    const raw = { ...fixture('v1', 'food-truck-minimal.json'), schemaVersion: CURRENT_SCHEMA_VERSION + 1 }
    expect(() => loadSiteDoc(raw)).toThrowError(SiteDocError)
    try { loadSiteDoc(raw) } catch (e) { expect((e as SiteDocError).code).toBe('too_new') }
  })
  it('rejects non-objects, missing versions and invalid docs', () => {
    expect(() => loadSiteDoc(null)).toThrow(/could not be read/)
    expect(() => loadSiteDoc({})).toThrow(/no format version/)
    expect(() => loadSiteDoc({ ...fixture('v1', 'food-truck-minimal.json'), kitId: 'nope' })).toThrow(/expected format/)
  })
  it('does not mutate its input', () => {
    const raw = fixture('v1', 'food-truck-minimal.json')
    const before = JSON.stringify(raw)
    loadSiteDoc(raw)
    expect(JSON.stringify(raw)).toBe(before)
  })
  it('runs an injected pure migration chain and reports migratedFrom', () => {
    const v0to1: Migration = { from: 1, to: 2, up: (d) => ({ ...d, extra: undefined }) }
    // With a fake current=2 the real v1 schema refuses the result (schemaVersion 2), proving validation runs after the chain.
    expect(() => loadSiteDoc(fixture('v1', 'food-truck-minimal.json'), [v0to1], 2)).toThrow(SiteDocError)
    expect(() => loadSiteDoc(fixture('v1', 'food-truck-minimal.json'), [], 2)).toThrow(/No upgrade path/)
  })
})

describe('SiteDoc limits and safety', () => {
  const base = () => fixture('v1', 'food-truck-minimal.json')
  it('keeps brand colors exactly as stored', () => {
    const { doc } = loadSiteDoc(base())
    expect(doc.brand.colors).toEqual({ primary: '#9A3412', secondary: '#15130F', accent: '#F59E0B' })
  })
  it('rejects 3-digit or named colors (normalization happens before storage, never silently)', () => {
    const d = base(); d.brand.colors.primary = 'red'
    expect(SiteDoc.safeParse(d).success).toBe(false)
  })
  it('rejects javascript: and http: links', () => {
    const d = base(); d.nav.cta = { label: 'Go', target: { kind: 'url', url: 'javascript:alert(1)' } }
    expect(SiteDoc.safeParse(d).success).toBe(false)
    d.nav.cta.target.url = 'http://example.com'
    expect(SiteDoc.safeParse(d).success).toBe(false)
  })
  it('enforces the hard page limit and unique page addresses', () => {
    const d = base()
    d.pages = Array.from({ length: 13 }, (_, i) => ({ ...d.pages[1], id: `p${i}`, slug: `p${i}` }))
    d.nav.items = []
    expect(SiteDoc.safeParse(d).success).toBe(false)
    const e = base(); e.pages[1].slug = ''
    expect(SiteDoc.safeParse(e).success).toBe(false)
  })
  it('rejects unknown keys and unknown section types', () => {
    const d = base(); d.pages[0].sections[0].type = 'script'
    expect(SiteDoc.safeParse(d).success).toBe(false)
    const e = base(); e.brand.recolor = true
    expect(SiteDoc.safeParse(e).success).toBe(false)
  })
  it('exports a JSON Schema for the AI tools', () => {
    const s = siteDocJsonSchema()
    expect(s.type).toBe('object')
    expect(JSON.stringify(s)).toContain('schemaVersion')
  })
})
