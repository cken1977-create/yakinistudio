import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { loadSiteDoc, type Page, type SiteDoc } from '@yakini/site-schema'
import { SiteView, jsonLdFor, metaFor, type RenderContext } from './index'

/** The `*accent*` headline marker (design v2, plan 6.2): styled on the page, never in plain text. */
const raw = JSON.parse(readFileSync(join(__dirname, '..', '..', 'site-schema', 'fixtures', 'v1', 'food-truck-every-section.json'), 'utf8'))
function withAccents(): SiteDoc {
  const doc = structuredClone(loadSiteDoc(raw).doc)
  for (const p of doc.pages) for (const s of p.sections) {
    if (s.type === 'hero') s.props.headline = 'Street food, *made right here.*'
    if (s.type === 'cta_band') s.props.headline = 'Hungry *yet?*'
    if (s.type === 'faq' && s.props.heading) s.props.heading = 'Good *to know*'
  }
  doc.business.tagline = undefined
  doc.seo.description = ''
  doc.seo.siteTitle = ''
  for (const p of doc.pages) delete p.seo
  return doc
}
const ctx = (doc: SiteDoc, page: Page, mode: 'live' | 'draft' = 'live'): RenderContext => ({
  doc, page, mode, hrefForPage: (p) => `/${p.slug}`, image: (id) => ({ src: `/img/${id}`, width: 800, height: 600 }),
  formAction: () => null, reportUrl: null, today: null,
})
const all = (doc: SiteDoc, mode: 'live' | 'draft' = 'live') => doc.pages.map((p) => renderToStaticMarkup(<SiteView ctx={ctx(doc, p, mode)} />)).join('\n')
const strip = (h: string) => h.replace(/<script[\s\S]*?<\/script>/g, '')

describe('accent phrase', () => {
  const doc = withAccents()
  it('renders as <em class="ys-accent"> in hero, CTA band and section headings, live and draft', () => {
    for (const mode of ['live', 'draft'] as const) {
      const h = all(doc, mode)
      expect(h).toContain('Street food, <em class="ys-accent">made right here.</em>')
      expect(h).toContain('Hungry <em class="ys-accent">yet?</em>')
      expect(h).toContain('Good <em class="ys-accent">to\u00A0know</em>') // short words stay with the next word
      expect(strip(h)).not.toMatch(/\*/)
    }
  })
  it('the page title and meta description never carry the marker', () => {
    for (const p of doc.pages) {
      const m = metaFor(doc, p)
      expect(m.title).not.toContain('*')
      expect(m.description ?? '').not.toContain('*')
    }
    // With no description set, the home headline is the fallback, as plain text.
    expect(metaFor(doc, doc.pages[0]).description).toBe('Street food, made right here.')
  })
  it('JSON-LD carries the headline as a plain slogan', () => {
    const ld = jsonLdFor(doc)
    expect(ld.slogan).toBe('Street food, made right here.')
    expect(JSON.stringify(ld)).not.toContain('*')
    const live = renderToStaticMarkup(<SiteView ctx={ctx(doc, doc.pages[0])} />)
    expect(live.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1]).not.toContain('*')
  })
})

describe('short words stay with the next word in accented headlines (no hanging "in" at a line end)', () => {
  it('glues one- and two-letter words, including runs of them and across the accent edge', async () => {
    const { glueShortWords } = await import('./context')
    const NB = '\u00A0'
    expect(glueShortWords('in good hands.')).toBe(`in${NB}good hands.`)
    expect(glueShortWords('Built to last a lifetime')).toBe(`Built to${NB}last a${NB}lifetime`)
    expect(glueShortWords('We ')).toBe(`We `) // the edge before the accent is left to the next segment
    expect(glueShortWords('go to a show')).toBe(`go${NB}to${NB}a${NB}show`)
    expect(glueShortWords('[[Add a headline]]')).toBe('[[Add a headline]]')
  })
})
