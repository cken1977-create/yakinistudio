import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { loadSiteDoc, type SiteDoc } from '@yakini/site-schema'
import { SiteView, type RenderContext } from './index'
import { heroFacts } from './sections/content'

/** Cinematic hero (D1 step 4), from the v2 every-section fixtures. */
const v2 = (kit: string) => loadSiteDoc(JSON.parse(readFileSync(join(__dirname, '..', '..', 'site-schema', 'fixtures', 'v2', `${kit}-every-section.json`), 'utf8'))).doc
const ctx = (doc: SiteDoc, pageId: string, mode: 'live' | 'draft' = 'live'): RenderContext => ({
  doc, page: doc.pages.find((p) => p.id === pageId)!, mode, hrefForPage: (p) => `/${p.slug}`,
  image: (id) => ({ src: `/img/${id}.jpg`, width: 1600, height: 1000, sources: [{ type: 'image/webp', srcSet: `/img/${id}-800.webp 800w, /img/${id}.webp 1600w` }] }),
  formAction: () => null, reportUrl: null, today: null,
})
const section = (h: string, id: string) => h.match(new RegExp(`<section[^>]*id="${id}"[\\s\\S]*?</section>`))![0]

describe.each(['food-truck', 'restaurant'])('%s cinematic hero', (kit) => {
  const doc = v2(kit)
  const home = renderToStaticMarkup(<SiteView ctx={ctx(doc, doc.pages[0].id)} />)
  const cine = section(home, 'cinema')

  it('full-bleed photo in a <picture>, framed on its focal point, plus a scrim', () => {
    expect(cine).toMatch(/class="ys-s ys-hero ys-v-cinematic has-img"/)
    expect(cine).toMatch(/<picture class="ys-pic"><source type="image\/webp"[^>]*sizes="100vw"/)
    expect(cine).toMatch(/class="ys-cine-img"[^>]*style="object-position:40% 60%"/)
    expect(cine).toContain('class="ys-cine-scrim"')
  })
  it('eyebrow, display headline with its accent, subhead, primary and ghost CTA', () => {
    expect(cine).toMatch(/<p class="ys-eyebrow">/)
    expect(cine).toMatch(/<h[12][^>]*class="ys-display ys-cine-headline"[^>]*>[^<]*<em class="ys-accent">/)
    expect(cine).toMatch(/class="ys-lead"/)
    expect(cine).toMatch(/class="ys-btn ys-btn-primary"/)
    expect(cine).toMatch(/class="ys-btn ys-btn-ghost"/)
  })
  it('fact badges come only from the business facts (services and city), at most two', () => {
    const facts = heroFacts(doc)
    expect(facts.length).toBeGreaterThan(0)
    expect(facts.length).toBeLessThanOrEqual(2)
    const titles = doc.pages.flatMap((p) => p.sections).flatMap((s) => (s.type === 'services' ? s.props.items.map((i) => i.title) : []))
    for (const f of facts) expect(f.split(' · ').every((part) => titles.includes(part)) || f.startsWith(doc.business.address!.city)).toBe(true)
    for (const f of facts) expect(cine).toContain(`<li class="ys-cine-fact">${f.replace(/&/g, '&amp;')}</li>`)
  })
  it('with no photo it is a typographic hero with a ghosted initial, never a flat panel', () => {
    const page2 = renderToStaticMarkup(<SiteView ctx={ctx(doc, doc.pages[1].id)} />)
    const typo = section(page2, 'cinema-type')
    expect(typo).toMatch(/ys-v-cinematic no-img/)
    expect(typo).not.toMatch(/<img/)
    expect(typo).toContain(`<span class="ys-cine-initial" aria-hidden="true">${doc.business.name.charAt(0).toUpperCase()}</span>`)
    expect(typo).not.toContain('ys-hero-panel')
  })
  it('has no facts when the business has none', () => {
    const bare = structuredClone(doc)
    delete bare.business.address
    for (const p of bare.pages) p.sections = p.sections.filter((s) => s.type !== 'services')
    expect(heroFacts(bare)).toEqual([])
  })
})
