import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { lintCopy } from '@yakini/ai'
import { loadSiteDoc, type Page, type SiteDoc } from '@yakini/site-schema'
import {
  AA, INSPECTORS, SiteView, contrastRatio, formatPhone, isEditablePath, jsonLdFor, readableInk, themeFor, time12,
  type RenderContext, type RenderMode,
} from './index'

const V1 = join(__dirname, '..', '..', 'site-schema', 'fixtures', 'v1')
const fixtures = readdirSync(V1).map((f) => ({ name: f, doc: loadSiteDoc(JSON.parse(readFileSync(join(V1, f), 'utf8'))).doc }))

function ctxFor(doc: SiteDoc, page: Page, mode: RenderMode, extra: Partial<RenderContext> = {}): RenderContext {
  return {
    doc, page, mode,
    hrefForPage: (p) => `/d/site/${p.slug}`,
    image: (id) => ({ src: `/img/${id}`, width: 800, height: 600 }),
    formAction: () => null,
    reportUrl: 'https://studio.yakini.digital/report?site=abc',
    today: null,
    ...extra,
  }
}
const html = (ctx: RenderContext) => renderToStaticMarkup(<SiteView ctx={ctx} />)
const text = (h: string) => h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ')

describe.each(fixtures.map((f) => [f.name, f.doc] as const))('rendering %s', (_name, doc) => {
  for (const page of doc.pages) {
    it(`page "${page.id}" renders in draft, live and export modes`, () => {
      for (const mode of ['draft', 'live', 'export'] as const) expect(() => html(ctxFor(doc, page, mode))).not.toThrow()
    })
    it(`page "${page.id}" has no scripts in a draft and only JSON-LD on a live page`, () => {
      expect(html(ctxFor(doc, page, 'draft'))).not.toMatch(/<script/i)
      const live = html(ctxFor(doc, page, 'live'))
      expect(live.match(/<script[^>]*>/g) ?? []).toEqual(['<script type="application/ld+json">'])
    })
    it(`page "${page.id}" uses safe links and alt text on every image`, () => {
      const h = html(ctxFor(doc, page, 'live'))
      expect(h).not.toMatch(/href="(javascript|data|http):/i)
      for (const m of h.matchAll(/<img [^>]*>/g)) expect(m[0]).toMatch(/ alt="[^"]+"/)
      for (const m of h.matchAll(/<a [^>]*href="https:[^"]*"[^>]*>/g)) expect(m[0]).toMatch(/rel="(noopener|noopener noreferrer|nofollow)"/)
    })
    it(`page "${page.id}" has exactly one h1`, () => {
      const h = html(ctxFor(doc, page, 'draft'))
      expect((h.match(/<h1[ >]/g) ?? []).length).toBe(1)
    })
    it(`page "${page.id}" names no vendors and never says AI-built (R7, R8)`, () => {
      expect(lintCopy(text(html(ctxFor(doc, page, 'live'))))).toEqual([])
    })
  }
})

describe('modes', () => {
  const doc = fixtures.find((f) => f.name === 'food-truck-every-section.json')!.doc
  const more = doc.pages.find((p) => p.id === 'more')!
  const home = doc.pages[0]
  it('draft forms are visibly disabled with a note; live forms post to the form endpoint', () => {
    const d = html(ctxFor(doc, more, 'draft'))
    expect(d).toContain('Forms start working once your site is published.')
    expect(d).toMatch(/<button type="submit"[^>]*disabled/)
    const l = html(ctxFor(doc, more, 'live', { formAction: (k) => `/api/f/site/${k}` }))
    expect(l).toContain('action="/api/f/site/contact"')
    expect(l).not.toContain('Forms start working')
    expect(l).toContain('name="company_website"') // honeypot (11.3)
  })
  it('the Report link and Site by Yakini link show on drafts and live sites, never in exports', () => {
    expect(html(ctxFor(doc, home, 'draft'))).toContain('Report this site')
    expect(html(ctxFor(doc, home, 'live'))).toContain('Site by Yakini')
    const e = html(ctxFor(doc, home, 'export'))
    expect(e).not.toContain('Report this site')
    expect(e).not.toContain('Site by Yakini')
  })
  it('hidden sections never render', () => {
    expect(html(ctxFor(doc, more, 'draft'))).not.toContain('Hidden section')
  })
  it('a Today section set to hide renders nothing until there is an update (Phase 1)', () => {
    const h = html(ctxFor(doc, home, 'live'))
    expect(h).not.toContain('id="today-banner"')
    expect(h).toContain('Check back for today’s update.') // show-text variant
    const withUpdate = html(ctxFor(doc, home, 'live', { today: { kind: 'stop', headline: 'Civic Plaza until 2 PM', lines: ['Green chile cheeseburgers'] } }))
    expect(withUpdate).toContain('Civic Plaza until 2 PM')
  })
  it('in a draft, a hidden-when-empty Today section shows a note so the owner can find and edit it', () => {
    const d = html(ctxFor(doc, home, 'draft'))
    expect(d).toContain('id="today-banner"')
    expect(d).toContain('Your Today update shows here when you post one.')
    expect(html(ctxFor(doc, home, 'export'))).not.toContain('Your Today update shows here')
  })
  it('offers WebP first with the JPEG as the fallback when the image has a WebP copy', () => {
    const ctx = { ...ctxFor(doc, home, 'live'), image: () => ({ src: '/a.jpg', width: 1280, height: 720, sources: [{ type: 'image/webp' as const, srcSet: '/a-sm.webp 640w, /a.webp 1280w' }] }) }
    const h = html(ctx)
    expect(h).toMatch(/<picture class="ys-pic"><source type="image\/webp" srcset="\/a-sm\.webp 640w, \/a\.webp 1280w"/i)
    expect(h).toMatch(/<img [^>]*src="\/a\.jpg"[^>]*alt="[^"]+"/)
  })
  it('escapes text from the doc: script-looking text is shown, never run', () => {
    const evil = structuredClone(doc)
    ;(evil.pages[0].sections[1].props as { headline: string }).headline = '<script>alert(1)</script>'
    const h = html(ctxFor(evil, evil.pages[0], 'live'))
    expect(h).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(h).not.toContain('<script>alert(1)')
  })
  it('JSON-LD cannot break out of its script tag', () => {
    const evil = structuredClone(doc)
    evil.business.name = '</script><script>alert(1)</script>'
    const h = html(ctxFor(evil, home, 'live'))
    expect(h).not.toContain('</script><script>alert(1)')
    expect(jsonLdFor(doc)['@type']).toBe('FoodEstablishment')
  })
  it('images that cannot be resolved are skipped, not broken', () => {
    const h = html(ctxFor(doc, home, 'live', { image: () => null }))
    expect(h).not.toMatch(/<img /)
  })
})

describe('kit templates render as drafts with visible placeholders', () => {
  it('shows [[ ]] prompts as highlighted marks, and empty lists as hints only in drafts', async () => {
    const { BUILDER_KITS, buildKitDraft, brandFor } = await import('@yakini/kits')
    for (const kit of Object.values(BUILDER_KITS)) {
      const doc = loadSiteDoc(buildKitDraft(kit!, { name: 'Test Kitchen' }, brandFor(kit!, { colors: null }))).doc
      for (const page of doc.pages) {
        const d = html(ctxFor(doc, page, 'draft'))
        expect(d).not.toContain('[[')
        const l = html(ctxFor(doc, page, 'live'))
        expect(l).not.toContain('class="ys-hint"')
        expect((d.match(/<h1[ >]/g) ?? []).length).toBe(1)
      }
      const filled = doc.pages.find((p) => p.id === 'menu') ?? doc.pages.find((p) => p.id === 'services')!
      expect(html(ctxFor(doc, filled, 'draft'))).toContain('class="ys-ph"')
    }
  })
})

describe('theme (spec 7.3, R6)', () => {
  it('injects the stored brand hex values byte for byte', () => {
    const t = themeFor({ colors: { primary: '#9a3412', secondary: '#15130F', accent: '#F59E0B' }, colorsSource: 'extracted', fontPair: 'friendly' })
    expect(t.vars['--ys-primary']).toBe('#9a3412')
    expect(t.vars['--ys-secondary']).toBe('#15130F')
    expect(t.vars['--ys-accent']).toBe('#F59E0B')
  })
  it('picks readable ink on each brand color and uses ink for text when a brand color is too light', () => {
    const t = themeFor({ colors: { primary: '#FFE600', secondary: '#111111', accent: '#FAFAFA' }, colorsSource: 'extracted', fontPair: 'modern' })
    expect(t.vars['--ys-on-primary']).toBe('#16130F')
    expect(t.vars['--ys-on-secondary']).toBe('#FFFFFF')
    expect(t.lowContrast).toEqual(['primary', 'accent'])
    expect(t.vars['--ys-primary-text']).toBe('#16130F')
    expect(t.vars['--ys-primary']).toBe('#FFE600')
  })
  it('computes WCAG contrast correctly', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5)
    expect(contrastRatio('#777777', '#FFFFFF')).toBeCloseTo(4.48, 1)
    expect(readableInk('#0B1437')).toBe('#FFFFFF')
    for (const bg of ['#9A3412', '#1E3A34', '#F59E0B', '#FFFFFF', '#000000', '#7F7F7F']) {
      expect(contrastRatio(bg, readableInk(bg))).toBeGreaterThanOrEqual(AA - 0.5)
    }
  })
})

describe('helpers', () => {
  it('formats times and phone numbers for people', () => {
    expect(time12('00:00')).toBe('12 AM')
    expect(time12('12:00')).toBe('12 PM')
    expect(time12('17:30')).toBe('5:30 PM')
    expect(formatPhone('+15055550142')).toBe('(505) 555-0142')
    expect(formatPhone('+442071838750')).toBe('+442071838750')
  })
})

describe('inspectors (spec 7.2, 8.7 allow-list)', () => {
  it('defines editable fields for every section type', () => {
    expect(Object.keys(INSPECTORS)).toHaveLength(17)
  })
  it('allows listed paths and paths inside them, nothing else', () => {
    expect(isEditablePath('hero', '/headline')).toBe(true)
    expect(isEditablePath('hero', '/image/alt')).toBe(true)
    expect(isEditablePath('menu', '/categories/2/items/14/price')).toBe(true)
    expect(isEditablePath('menu', '/categories/x/items/1/price')).toBe(false)
    expect(isEditablePath('hero', '/__proto__')).toBe(false)
    expect(isEditablePath('contact_form', '/fields')).toBe(false) // form fields are never AI-editable (14.8)
    expect(isEditablePath('contact_form', '/formKey')).toBe(false)
    expect(isEditablePath('footer', '/anything')).toBe(false)
    expect(isEditablePath('hero', 'headline')).toBe(false)
  })
})
