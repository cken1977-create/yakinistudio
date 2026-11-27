import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { loadSiteDoc, type Page, type SiteDoc } from '@yakini/site-schema'
import { SiteView, type RenderContext } from './index'

/**
 * Design lint (D1 quality harness). Renders every design fixture in published mode and checks:
 * - no [[ ]] placeholder text;
 * - no section without content (only a heading, or nothing at all);
 * - the H1 is not just the business name;
 * - rich fixtures show at least 3 images on Home;
 * - the display size never goes below the token minimum.
 *
 * Today's renderer fails some of these by design: those are recorded in design-lint-baseline.json and
 * each later D1 step removes its entries. A violation not in the baseline fails, and so does a
 * baseline entry that no longer happens (so the file only ever shrinks). UPDATE_BASELINE=1 rewrites it.
 */
const DIR = join(__dirname, '..', '..', 'site-schema', 'fixtures', 'design')
const BASELINE_FILE = join(__dirname, 'design-lint-baseline.json')
/** Smallest allowed display (H1) size, in rem. Step 3 moves this to the type tokens. */
export const DISPLAY_MIN_REM = 2.25

const fixtures = readdirSync(DIR).filter((f) => f.endsWith('.json')).sort()
  .map((f) => ({ name: f.replace(/\.json$/, ''), doc: loadSiteDoc(JSON.parse(readFileSync(join(DIR, f), 'utf8'))).doc }))

function ctx(doc: SiteDoc, page: Page): RenderContext {
  return {
    doc, page, mode: 'live', hrefForPage: (p) => `/${p.slug}`,
    image: (id) => ({ src: `/img/${id}`, width: 1600, height: 1000 }),
    formAction: (k) => `/api/forms/${k}`, reportUrl: '/report', today: null,
  }
}
const text = (h: string) => h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim()

/** Every violation on one page, as stable strings ("fixture/page rule detail"). */
export function lintPage(name: string, doc: SiteDoc, page: Page): string[] {
  const out: string[] = []
  const at = `${name}/${page.id}`
  const h = renderToStaticMarkup(<SiteView ctx={ctx(doc, page)} />)
  const body = h.replace(/<script[\s\S]*?<\/script>/g, '')
  if (/\[\[[^\]]*\]\]/.test(text(body))) out.push(`${at} placeholder-text`)
  for (const m of body.matchAll(/<section\b[^>]*?(?:id="([^"]*)")?[^>]*>([\s\S]*?)<\/section>/g)) {
    const inner = m[2]
    const heading = text((inner.match(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/) ?? [''])[0])
    const rest = text(inner).replace(heading, '').trim()
    if (!rest && !/<(img|iframe|form)\b/.test(inner)) out.push(`${at} empty-section ${m[1] ?? '?'}`)
  }
  const h1 = text((body.match(/<h1[^>]*>[\s\S]*?<\/h1>/) ?? [''])[0])
  if (h1 && h1.toLowerCase() === doc.business.name.trim().toLowerCase()) out.push(`${at} h1-is-business-name`)
  if (page.slug === '' && name.endsWith('-rich')) {
    const imgs = (body.match(/<img\b/g) ?? []).length
    if (imgs < 3) out.push(`${at} home-images ${imgs}`)
  }
  return out
}

function displayMinRem(): number {
  const css = readFileSync(join(__dirname, 'styles.css'), 'utf8')
  const m = /\.ys-display\s*\{[^}]*font-size:\s*clamp\(\s*([\d.]+)rem/.exec(css)
  return m ? Number(m[1]) : 0
}

describe('design lint (published mode)', () => {
  const actual = fixtures.flatMap((f) => f.doc.pages.flatMap((p) => lintPage(f.name, f.doc, p))).sort()

  it('the display size is never below the token minimum', () => {
    expect(displayMinRem()).toBeGreaterThanOrEqual(DISPLAY_MIN_REM)
  })
  it('no violations beyond the recorded baseline, and the baseline only shrinks', () => {
    if (process.env.UPDATE_BASELINE === '1') writeFileSync(BASELINE_FILE, `${JSON.stringify(actual, null, 2)}\n`)
    const baseline: string[] = existsSync(BASELINE_FILE) ? JSON.parse(readFileSync(BASELINE_FILE, 'utf8')) : []
    const added = actual.filter((v) => !baseline.includes(v))
    const fixed = baseline.filter((v) => !actual.includes(v))
    expect(added, `new design-lint violations:\n${added.join('\n')}`).toEqual([])
    expect(fixed, `fixed: remove these from design-lint-baseline.json:\n${fixed.join('\n')}`).toEqual([])
  })
  it('the lint catches what it should (self-check)', () => {
    const f = fixtures.find((x) => x.name === 'food-truck-sparse')!
    const home = f.doc.pages.find((p) => p.slug === '')!
    const v = lintPage('x', f.doc, home)
    expect(v.some((s) => s.endsWith('h1-is-business-name'))).toBe(true)
    const rich = fixtures.find((x) => x.name === 'food-truck-rich')!
    expect(lintPage('y', rich.doc, rich.doc.pages.find((p) => p.id === 'menu')!).filter((s) => s.includes('placeholder'))).toEqual([])
  })
})
