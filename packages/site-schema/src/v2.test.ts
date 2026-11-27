import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CURRENT_SCHEMA_VERSION, SiteDoc, SiteDocContent, SiteDocV1, loadSiteDoc, plainText, splitAccent, validAccent, validateNewDoc } from './index'
import { v1ToV2 } from './migrations/v1_to_v2'

const V1 = join(__dirname, '..', 'fixtures', 'v1')
const v1 = readdirSync(V1).filter((f) => f.endsWith('.json')).map((f) => ({ f, raw: JSON.parse(readFileSync(join(V1, f), 'utf8')) }))

describe('schema v2 (design v2, plan 6.1)', () => {
  it('is the current version', () => expect(CURRENT_SCHEMA_VERSION).toBe(2))

  it('every v1 fixture migrates on read to the classic look with its own font pair, content unchanged', () => {
    for (const { f, raw } of v1) {
      const { doc, migratedFrom } = loadSiteDoc(raw)
      expect(migratedFrom, f).toBe(1)
      expect(doc.schemaVersion).toBe(2)
      expect(doc.style, f).toEqual({ preset: 'classic', surface: 'light', fontPair: raw.brand.fontPair, radius: 'round', motion: 'off' })
      expect(doc.brand, f).toEqual(raw.brand) // R6: brand untouched
      // Content is exactly what the v1 schema read (no asterisks in these fixtures' headlines).
      const { style: _style, schemaVersion: _v, ...rest } = doc
      const { schemaVersion: _rv, ...asV1 } = SiteDocV1.parse(raw)
      expect(JSON.parse(JSON.stringify(rest)), f).toEqual(JSON.parse(JSON.stringify(asV1)))
    }
  })

  it('the migration is pure: the input is not mutated and the result is the same every time', () => {
    const raw = structuredClone(v1[0].raw)
    const before = JSON.stringify(raw)
    expect(JSON.stringify(v1ToV2.up(raw))).toBe(JSON.stringify(v1ToV2.up(raw)))
    expect(JSON.stringify(raw)).toBe(before)
  })

  it('asterisks a v1 headline used as plain text stay literal (∗), never become an accent', () => {
    const raw = structuredClone(v1.find((x) => x.f.startsWith('food-truck-every'))!.raw)
    const hero = raw.pages[0].sections.find((s: { type: string }) => s.type === 'hero')
    hero.props.headline = '5* tacos, *really* good'
    const { doc } = loadSiteDoc(raw)
    const h = doc.pages[0].sections.find((s) => s.type === 'hero')!.props as { headline: string }
    expect(h.headline).toBe('5∗ tacos, ∗really∗ good')
    expect(splitAccent(h.headline)).toBeNull()
  })

  it('a v2 doc needs a valid style; the AI content schema has no style (the server sets it)', () => {
    const doc = loadSiteDoc(v1[0].raw).doc
    expect(SiteDoc.safeParse({ ...doc, style: { ...doc.style, preset: 'neon' } }).success).toBe(false)
    expect(SiteDoc.safeParse({ ...doc, style: undefined }).success).toBe(false)
    expect(validateNewDoc({ ...doc, style: { ...doc.style, preset: 'signature', surface: 'dark', fontPair: 'signature' } }).ok).toBe(true)
    expect(Object.keys((SiteDocContent as unknown as { _zod: { def: { in?: { shape?: object }; shape?: object } } })._zod.def.in?.shape ?? {})).not.toContain('style')
  })
})

describe('accent phrase marker (plan 6.2)', () => {
  it('splits one *phrase* and strips it for plain text', () => {
    expect(splitAccent('Street food, *made right here.*')).toEqual({ before: 'Street food, ', accent: 'made right here.', after: '' })
    expect(plainText('Street food, *made right here.*')).toBe('Street food, made right here.')
    expect(plainText('No accent here')).toBe('No accent here')
  })
  it('allows at most one well-formed marker', () => {
    expect(validAccent('Plain')).toBe(true)
    expect(validAccent('*One* phrase')).toBe(true)
    for (const bad of ['*One* and *two*', 'A lone * star', '* spaced *', '**', 'end*']) expect(validAccent(bad), bad).toBe(false)
  })
  it('the schema refuses a second marker in a hero, CTA band or section headline', () => {
    const doc = loadSiteDoc(v1.find((x) => x.f.startsWith('food-truck-every'))!.raw).doc
    const set = (type: string, key: string, value: string) => {
      const d = structuredClone(doc)
      const s = d.pages.flatMap((p) => p.sections).find((x) => x.type === type)!
      ;(s.props as Record<string, unknown>)[key] = value
      return validateNewDoc(d).ok
    }
    expect(set('hero', 'headline', 'Street food, *made right here.*')).toBe(true)
    expect(set('hero', 'headline', '*Street* food, *made here*')).toBe(false)
    expect(set('cta_band', 'headline', 'Hungry *yet?*')).toBe(true)
    expect(set('cta_band', 'headline', 'Hungry * yet')).toBe(false)
    expect(set('faq', 'heading', 'Good *to know*')).toBe(true)
    expect(set('faq', 'heading', '*Good* *to know*')).toBe(false)
  })
})

