import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { loadSiteDoc, SiteDoc, SiteDocError, type DocValidator, type Migration, type Page } from '@yakini/site-schema'
import { SiteView, type RenderContext } from './index'

/**
 * "Old versions keep rendering" (spec 15.3, 7.4). A TEST-ONLY format bump: v2 renames the hero's
 * `headline` to `title`. With CURRENT=2, every v1 fixture and a stored v1 snapshot must load
 * through the migration, render exactly as before, leave the stored bytes untouched, and restore
 * as a v2 draft. In a real bump the renderer learns the new name in the same change; here
 * `asRenderable` stands in for that one-line renderer update.
 */
const V1 = join(__dirname, '..', '..', 'site-schema', 'fixtures', 'v1')
type Raw = Record<string, unknown>

const mapHeroes = (doc: Raw, fn: (props: Raw) => Raw): Raw => ({
  ...doc,
  pages: (doc.pages as Raw[]).map((p) => ({
    ...p,
    sections: (p.sections as Raw[]).map((s) => (s.type === 'hero' ? { ...s, props: fn(s.props as Raw) } : s)),
  })),
})

const v1_to_v2: Migration = {
  from: 1, to: 2,
  up: (doc) => mapHeroes(doc as Raw, ({ headline, ...rest }) => ({ ...rest, title: headline })),
}
/** v2 → the shape today's renderer reads (the "renderer update" of a real bump). */
const asRenderable = (doc: Raw): Raw => ({ ...mapHeroes(doc, ({ title, ...rest }) => ({ ...rest, headline: title })), schemaVersion: 1 })
/** The v2 schema: a v2 doc is valid when its renderable form is a valid v1 doc and no hero keeps the old key. */
const SiteDocV2: DocValidator = {
  safeParse: (v) => {
    const doc = v as Raw
    if (doc.schemaVersion !== 2) return { success: false }
    const oldKey = (doc.pages as Raw[]).some((p) => (p.sections as Raw[]).some((s) => s.type === 'hero' && 'headline' in (s.props as Raw)))
    if (oldKey) return { success: false }
    const r = SiteDoc.safeParse(asRenderable(doc))
    return r.success ? { success: true, data: doc as never } : { success: false }
  },
}
const loadV2 = (raw: unknown) => loadSiteDoc(raw, [v1_to_v2], 2, SiteDocV2)

const ctx = (doc: SiteDoc, page: Page, width: 390 | 1280): RenderContext => ({
  doc, page, mode: 'live',
  hrefForPage: (p) => `/${p.slug}?w=${width}`,
  image: (id) => ({ src: `/img/${id}`, width: 800, height: 600 }),
  formAction: (k) => `/f/${k}`,
  reportUrl: '/report',
  today: null,
})
const render = (doc: SiteDoc, width: 390 | 1280) => doc.pages.map((p) => renderToStaticMarkup(<SiteView ctx={ctx(doc, p, width)} />))

describe('old versions keep rendering after a format bump (test-only v1 → v2)', () => {
  const files = readdirSync(V1)

  it.each(files)('%s loads as v2 and renders exactly as v1 at 390 and 1280', (f) => {
    const raw = JSON.parse(readFileSync(join(V1, f), 'utf8'))
    const v1 = loadSiteDoc(raw).doc
    const { doc: v2, migratedFrom } = loadV2(raw)
    expect(migratedFrom).toBe(1)
    expect(v2.schemaVersion).toBe(2)
    const renderable = SiteDoc.parse(asRenderable(v2 as unknown as Raw))
    for (const w of [390, 1280] as const) expect(render(renderable, w)).toEqual(render(v1, w))
  })

  it('a stored v1 snapshot is never rewritten, and restoring it makes a v2 draft', () => {
    const stored = readFileSync(join(V1, 'food-truck-every-section.json'), 'utf8') // the site_versions row, as stored
    const before = stored
    const restored = loadV2(JSON.parse(stored)).doc // restore = load through the chain, then save as the new draft
    const newDraft = JSON.parse(JSON.stringify(restored))
    expect(stored).toBe(before)
    expect(JSON.parse(stored).schemaVersion).toBe(1)
    expect(newDraft.schemaVersion).toBe(2)
    const heroes = (newDraft.pages as Raw[]).flatMap((p) => (p.sections as Raw[]).filter((s) => s.type === 'hero'))
    expect(heroes.length).toBeGreaterThan(0)
    for (const h of heroes) { expect(h.props).not.toHaveProperty('headline'); expect(h.props).toHaveProperty('title') }
  })

  it('the migration is pure: same output twice, input not mutated', () => {
    const raw = JSON.parse(readFileSync(join(V1, 'restaurant-every-section.json'), 'utf8'))
    const copy = JSON.stringify(raw)
    expect(JSON.stringify(v1_to_v2.up(raw))).toBe(JSON.stringify(v1_to_v2.up(raw)))
    expect(JSON.stringify(raw)).toBe(copy)
  })

  it('a doc newer than the code is refused with a plain message, never rendered', () => {
    const raw = { ...JSON.parse(readFileSync(join(V1, 'restaurant-minimal.json'), 'utf8')), schemaVersion: 3 }
    expect(() => loadV2(raw)).toThrowError(SiteDocError)
    expect(() => loadV2(raw)).toThrow('This site was saved by a newer version of the editor. Please refresh and try again.')
  })
})
