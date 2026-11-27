import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MIGRATIONS, loadSiteDoc, SiteDocError, type Page, type SiteDoc } from '@yakini/site-schema'
import { SiteView, type RenderContext } from './index'

/**
 * "Old versions keep rendering" (spec 15.3, 7.4) for the real v1 → v2 bump (design v2, plan 6.1).
 * `__snapshots__/v1-classic` holds the HTML the renderer produced for every v1 fixture page, live
 * and draft, BEFORE schema v2 (captured from the D1 step 1 commit). Each v1 doc must load through
 * the migration as `classic` and render the same markup. The only allowed differences are the new
 * root attributes (data-preset, data-surface), the JSON-LD `slogan`, and an empty section wrapper
 * that is no longer emitted for a section with nothing to show. Pixel identity is checked
 * separately by the design gallery (before/after screenshots).
 */
const V1 = join(__dirname, '..', '..', 'site-schema', 'fixtures', 'v1')
const SNAP = join(__dirname, '__snapshots__', 'v1-classic')

// The pre-v2 draft render was what the editor shows (placeholders and hints); since D1 step 5 that
// is the editing view, and the visitor preview hides them.
const ctx = (doc: SiteDoc, page: Page, mode: 'live' | 'draft'): RenderContext => ({
  doc, page, mode, editing: mode === 'draft', hrefForPage: (p) => `/${p.slug}`,
  image: (id) => ({ src: `/img/${id}`, width: 800, height: 600 }),
  formAction: (k) => `/f/${k}`, reportUrl: '/report', today: null,
})
const normalize = (h: string) => h
  .replace(/ data-preset="classic" data-surface="light"/, '')
  .replace(/,"slogan":"[^"]*"/, '')
  // Since D1 step 5 a section with nothing to show gets no (empty) wrapper on a visitor's page.
  .replace(/<div class="ys-slot"><\/div>/g, '')
  .trim()

describe('v1 docs render exactly as before under the classic preset', () => {
  const files = readdirSync(V1).filter((f) => f.endsWith('.json'))
  it.each(files)('%s', (f) => {
    const raw = JSON.parse(readFileSync(join(V1, f), 'utf8'))
    const { doc, migratedFrom } = loadSiteDoc(raw)
    expect(migratedFrom).toBe(1)
    expect(doc.style.preset).toBe('classic')
    for (const page of doc.pages) for (const mode of ['live', 'draft'] as const) {
      const before = readFileSync(join(SNAP, `${f.replace('.json', '')}--${page.id}--${mode}.html`), 'utf8')
      const now = renderToStaticMarkup(<SiteView ctx={ctx(doc, page, mode)} />)
      expect(normalize(now), `${f} ${page.id} ${mode}`).toBe(normalize(before))
    }
  })

  it('a stored v1 snapshot is never rewritten, and restoring it makes a v2 classic draft', () => {
    const stored = readFileSync(join(V1, 'food-truck-every-section.json'), 'utf8') // the site_versions row, as stored
    const restored = JSON.parse(JSON.stringify(loadSiteDoc(JSON.parse(stored)).doc)) // restore = load, then save as the new draft
    expect(JSON.parse(stored).schemaVersion).toBe(1)
    expect(restored.schemaVersion).toBe(2)
    expect(restored.style).toMatchObject({ preset: 'classic', fontPair: JSON.parse(stored).brand.fontPair })
  })

  it('the migration chain is pure: same output twice, input not mutated', () => {
    const raw = JSON.parse(readFileSync(join(V1, 'restaurant-every-section.json'), 'utf8'))
    const copy = JSON.stringify(raw)
    for (const m of MIGRATIONS) expect(JSON.stringify(m.up(raw))).toBe(JSON.stringify(m.up(raw)))
    expect(JSON.stringify(raw)).toBe(copy)
  })

  it('a doc newer than the code is refused with a plain message, never rendered', () => {
    const raw = { ...JSON.parse(readFileSync(join(V1, 'restaurant-minimal.json'), 'utf8')), schemaVersion: 3 }
    expect(() => loadSiteDoc(raw)).toThrowError(SiteDocError)
    expect(() => loadSiteDoc(raw)).toThrow('This site was saved by a newer version of the editor. Please refresh and try again.')
  })
})
