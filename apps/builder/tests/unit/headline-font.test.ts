import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { designFixtures } from '@yakini/kits/design-fixtures'
import { FONT_STACKS } from '@yakini/sections'
import { loadSiteDoc } from '@yakini/site-schema'
import { headlineFont, siteCharacters } from '@/lib/site/headline-font'
import { renderPublished } from '@/lib/site/render-entry'
import FONT_FILES from '@/lib/site/font-files.json'

/**
 * The site's headline font, sent with the page (follow-up to PR 140): every design fixture gets
 * its own small headline font (its display font at the headline weight, cut to its characters),
 * applied only to headline styles, first-party, and its display-only files are no longer preloaded.
 */
let out = ''
beforeAll(() => {
  out = mkdtempSync(join(tmpdir(), 'site-assets-'))
  execFileSync(process.execPath, [join(__dirname, '..', '..', 'scripts', 'build-site-css.mjs')], { env: { ...process.env, SITE_ASSETS_OUT: out }, stdio: 'pipe' })
  process.env.SITE_ASSETS_DIR = out
}, 60_000)
afterAll(() => { delete process.env.SITE_ASSETS_DIR; rmSync(out, { recursive: true, force: true }) })

const fixtures = Object.entries(designFixtures()).map(([name, raw]) => ({ name, doc: loadSiteDoc(structuredClone(raw)).doc }))
const base = { siteId: '7a1e0000-0000-4000-8000-0000000000aa', reportUrl: null, formStamp: 'stamp', canonicalHost: 'mesa.yakini.digital', indexable: false }

describe('inline headline font', () => {
  it('covers every character of the site\'s headlines (and the no-break space of short-word gluing)', () => {
    for (const f of fixtures) {
      const chars = new Set(siteCharacters(f.doc))
      expect(chars.has(' ')).toBe(true)
      for (const p of f.doc.pages) for (const s of p.sections) {
        const h = (s.props as { headline?: string; heading?: string }).headline ?? (s.props as { heading?: string }).heading
        if (h) for (const c of h.replace(/\*/g, '')) expect(chars.has(c), `${f.name} "${c}"`).toBe(true)
      }
    }
  })

  it('is small, a data: font of the display face at the headline weight, and is the only display font (D4-1)', async () => {
    for (const f of fixtures) {
      const h = (await headlineFont(f.doc))!
      expect(h, f.name).not.toBeNull()
      // A few KB per face (ASCII always included): far under the 100 KB budget even with an italic face.
      const italic = (FONT_FILES as Record<string, string[]>)[f.doc.style.fontPair].some((k) => k.endsWith('-italic'))
      expect(h.bytes, f.name).toBeLessThan(italic ? 40_000 : 25_000)
      expect(h.css).toMatch(/@font-face\{font-family:'YS Headline';font-style:normal;font-weight:1 1000;font-display:block;src:url\(data:font\/woff2;base64,[A-Za-z0-9+/=]+\) format\('woff2'\);unicode-range:U\+/)
      expect(h.css).toContain(".ys-site :is(.ys-display,.ys-h2,")
      // D4-1: every display-font use points at the inline face, then the local fallback, never the web family.
      const web = FONT_STACKS[f.doc.style.fontPair].display.split(',')[0].trim()
      expect(h.css).toContain(".ys-site{--ys-font-display:'YS Headline',")
      expect(h.css, f.name).not.toContain(web)
      // Printable ASCII is always there, so text the page adds itself never pulls in the display file.
      for (const c of 'AZaz09?!&') expect(siteCharacters(f.doc)).toContain(c)
      expect(h.css).not.toMatch(/https?:/) // first-party bytes only (R2)
      expect(h.css).not.toMatch(/<\/style/i)
      if (f.doc.style.fontPair === 'signature') expect(h.css).toContain("font-style:italic;font-weight:1 1000")
    }
  })

  it('goes into the page head with the nonce; display-only and mono label files are not preloaded', async () => {
    for (const f of fixtures) {
      const headline = await headlineFont(f.doc)
      const html = renderPublished({ ...base, doc: f.doc, pageId: f.doc.pages[0].id, thanks: null, headline, nonce: 'abc123' })
      const head = html.match(/<head>[\s\S]*?<\/head>/)![0]
      expect(head).toMatch(/<style nonce="abc123">@font-face\{font-family:'YS Headline'/)
      const preloads = [...head.matchAll(/<link rel="preload" href="\/_site-assets\/fonts\/([^"]+)" as="font"/g)].map((m) => m[1])
      for (const key of headline!.displayOnly) expect(preloads.join(' '), f.name).not.toContain(key.replace(/-(normal|italic)$/, ''))
      const all = (FONT_FILES as Record<string, string[]>)[f.doc.style.fontPair]
      expect(preloads.length).toBe(all.filter((k) => !headline!.displayOnly.includes(k) && !k.includes('-mono-')).length)
      expect(preloads.join(' ')).not.toContain('mono')
    }
  })

  it('is cached: the same site twice costs one cut', async () => {
    const doc = fixtures[0].doc
    const a = await headlineFont(doc)
    const t = performance.now()
    const b = await headlineFont(doc)
    expect(b!.css).toBe(a!.css)
    expect(performance.now() - t).toBeLessThan(20)
  })
})
