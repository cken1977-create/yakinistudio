import { describe, expect, it } from 'vitest'
import { designFixtures } from '@yakini/kits/design-fixtures'
import { loadSiteDoc } from '@yakini/site-schema'
import { neutralHtml, renderPublished } from '@/lib/site/render-entry'
import { fontPreloads } from '@/lib/site/html'
import FONT_FILES from '@/lib/site/font-files.json'

/**
 * Published pages ship no framework JavaScript (perf decision 2026-11-27). Every page of every
 * design fixture, plus the thank-you and neutral pages, rendered by the real published renderer:
 * the only <script> allowed is JSON-LD (data, never run). D7 may add first-party islands; with none
 * given there are none.
 */
const scripts = (html: string) => html.match(/<script\b[^>]*>/g) ?? []
const fixtures = Object.entries(designFixtures()).map(([name, raw]) => ({ name, doc: loadSiteDoc(structuredClone(raw)).doc }))
const base = { siteId: '7a1e0000-0000-4000-8000-0000000000aa', reportUrl: 'https://studio.yakini.digital/report?site=x', formStamp: 'stamp', canonicalHost: 'mesa.yakini.digital', indexable: false }

describe('published pages are plain HTML', () => {
  it('every page of every design fixture: a full document, our stylesheet, JSON-LD and no other script', () => {
    let pages = 0
    for (const f of fixtures) for (const p of f.doc.pages) {
      const html = renderPublished({ ...base, doc: f.doc, pageId: p.id, thanks: null })
      pages++
      expect(html.startsWith('<!doctype html><html lang="en">'), `${f.name}/${p.id}`).toBe(true)
      expect(scripts(html), `${f.name}/${p.id}`).toEqual(['<script type="application/ld+json">'])
      expect(html, `${f.name}/${p.id}`).not.toMatch(/_next\/|__next|self\.__next_f|webpack|turbopack/i)
      expect(html).toMatch(/<link rel="stylesheet" href="\/_site-assets\/site\.css\?v=[A-Za-z0-9_-]+"\/>/)
      expect(html).not.toMatch(/\son[a-z]+="/i) // no inline event handlers either
    }
    expect(pages).toBeGreaterThan(40)
  })
  it('the hero photo is still preloaded from <head>', () => {
    const f = fixtures.find((x) => x.name === 'food-truck-rich')!
    const html = renderPublished({ ...base, doc: f.doc, pageId: f.doc.pages[0].id, thanks: null })
    const head = html.slice(0, html.indexOf('</head>'))
    expect(head).toMatch(/<link rel="preload"[^>]*as="image"[^>]*fetchPriority="high"/)
  })
  it('the thank-you page and the neutral page carry no script at all beyond JSON-LD', () => {
    const f = fixtures[0]
    expect(scripts(renderPublished({ ...base, doc: f.doc, pageId: null, thanks: { formKey: 'contact' } }))).toEqual(['<script type="application/ld+json">'])
    expect(scripts(neutralHtml('This site is unavailable.', 'Please check the address and try again.'))).toEqual([])
  })
  it('title, description, canonical and robots come through as before', () => {
    const f = fixtures.find((x) => x.name === 'restaurant-rich')!
    const html = renderPublished({ ...base, doc: f.doc, pageId: f.doc.pages[0].id, thanks: null, indexable: true })
    expect(html).toContain(`<title>${f.doc.seo.siteTitle}</title>`)
    expect(html).toContain('<link rel="canonical" href="https://mesa.yakini.digital"/>')
    expect(html).toContain('<meta name="robots" content="index, follow"/>')
    expect(renderPublished({ ...base, doc: f.doc, pageId: f.doc.pages[0].id, thanks: null })).toContain('<meta name="robots" content="noindex, nofollow"/>')
  })
  it('D7 hook: a 3D-plan site can add its own first-party island, nonce-tagged; nothing else can appear', () => {
    const f = fixtures[0]
    const html = renderPublished({ ...base, doc: f.doc, pageId: f.doc.pages[0].id, thanks: null, islands: [{ src: '/_site-assets/3d/hero.js' }], nonce: 'abc123' })
    // React hoists an async script to <head>; order doesn't matter.
    expect(scripts(html).sort()).toEqual(['<script src="/_site-assets/3d/hero.js" type="module" async="" nonce="abc123">', '<script type="application/ld+json">'].sort())
  })
})

describe('font preloads (no swap, no layout shift)', () => {
  it('every page preloads exactly its own font pair\'s Latin files, first-party, and nothing else', () => {
    for (const f of fixtures) {
      const html = renderPublished({ ...base, doc: f.doc, pageId: f.doc.pages[0].id, thanks: null })
      const head = html.match(/<head>[\s\S]*?<\/head>/)![0]
      const fonts = [...head.matchAll(/<link rel="preload" href="([^"]+)" as="font"[^>]*>/g)].map((m) => m[1])
      expect(fonts, f.name).toEqual(fontPreloads(f.doc.style.fontPair))
      expect(fonts.length, f.name).toBe((FONT_FILES as Record<string, string[]>)[f.doc.style.fontPair].length)
      for (const u of fonts) expect(u).toMatch(/^\/_site-assets\/fonts\/[a-z0-9-]+-latin-wght-(normal|italic)\.woff2$/)
      for (const tag of head.match(/<link rel="preload"[^>]*as="font"[^>]*>/g) ?? []) expect(tag).toMatch(/crossorigin=""/)
    }
  })
})
