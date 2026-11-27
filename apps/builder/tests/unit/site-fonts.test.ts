import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { FONT_STACKS } from '@yakini/sections'

/**
 * Published-site fonts (decision 2026-11-27): self-hosted woff2, subset, at most 100 KB per site,
 * and no layout shift while they load (every web font has metric-matched local fallbacks).
 * Runs the real build script into a temp folder.
 */
let out = ''
let css = ''
let manifest: { fonts: Record<string, number>; fontBudget: number }
beforeAll(() => {
  out = mkdtempSync(join(tmpdir(), 'site-assets-'))
  execFileSync(process.execPath, [join(__dirname, '..', '..', 'scripts', 'build-site-css.mjs')], { env: { ...process.env, SITE_ASSETS_OUT: out }, stdio: 'pipe' })
  css = readFileSync(join(out, 'site.css'), 'utf8')
  manifest = JSON.parse(readFileSync(join(out, 'manifest.json'), 'utf8'))
}, 60_000)
afterAll(() => rmSync(out, { recursive: true, force: true }))

const families = (stack: string) => stack.split(',').map((f) => f.trim().replace(/^'|'$/g, ''))

describe('published-site fonts', () => {
  it('every font pair downloads at most 100 KB of fonts for an English page', () => {
    expect(manifest.fontBudget).toBe(100 * 1024)
    expect(Object.keys(manifest.fonts).sort()).toEqual(Object.keys(FONT_STACKS).sort())
    for (const [pair, bytes] of Object.entries(manifest.fonts)) expect(bytes, pair).toBeLessThanOrEqual(manifest.fontBudget)
  })

  it('fonts are self-hosted woff2 (nothing from another site), and the Latin files are subset', () => {
    expect(css).not.toMatch(/url\(\s*['"]?https?:/i)
    const urls = [...css.matchAll(/@font-face\s*{[^}]*}/g)].flatMap((f) => [...f[0].matchAll(/url\(([^)]+)\)/g)].map((m) => m[1]))
    expect(urls.length).toBeGreaterThan(0)
    for (const u of urls) expect(u).toMatch(/^\/_site-assets\/fonts\/[\w-]+\.woff2$/)
    const inter = statSync(join(out, 'fonts', 'inter-latin-wght-normal.woff2')).size
    const original = statSync(require.resolve('@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')).size
    expect(inter).toBeLessThan(original)
  })

  it('every web font in every stack is followed by its metric-matched fallbacks, defined in site.css', () => {
    for (const [pair, stack] of Object.entries(FONT_STACKS)) for (const role of ['display', 'body'] as const) {
      const fam = families(stack[role])
      const web = fam[0].replace(/ Variable$/, '').replace(/^Cormorant Garamond$/, 'Cormorant')
      expect(fam.slice(1, 3), `${pair} ${role}`).toEqual([`${web} Fallback`, `${web} Fallback DV`])
      for (const fb of fam.slice(1, 3)) {
        const faces = css.match(new RegExp(`@font-face\\s*{[^}]*font-family:\\s*'${fb}'[^}]*}`, 'g')) ?? []
        expect(faces.length, fb).toBeGreaterThan(0)
        for (const f of faces) {
          expect(f, fb).toMatch(/src:\s*local\(/)
          expect(f, fb).toMatch(/size-adjust:\s*[\d.]+%/)
          expect(f, fb).toMatch(/ascent-override:\s*[\d.]+%/)
          expect(f, fb).toMatch(/descent-override:\s*[\d.]+%/)
        }
      }
    }
  })

  it('every file of a font (each script) declares the same weights, so the browser treats it as one font', () => {
    // A mismatch splits the font in two and the browser can skip the Latin file entirely.
    const seen = new Map<string, Set<string>>()
    for (const [face] of css.matchAll(/@font-face\s*{[^}]*}/g)) {
      const family = face.match(/font-family:\s*'([^']+)'/)![1]
      if (family.includes('Fallback')) continue
      const key = `${family} ${face.match(/font-style:\s*(\w+)/)?.[1] ?? 'normal'}`
      seen.set(key, (seen.get(key) ?? new Set()).add(face.match(/font-weight:\s*([^;]+);/)![1]))
    }
    expect(seen.size).toBeGreaterThan(8)
    for (const [key, weights] of seen) expect([...weights], key).toHaveLength(1)
  })

  it('fonts cut to one weight say so, so the browser never fakes other weights from them', () => {
    const face = (file: string) => css.match(new RegExp(`@font-face\\s*{[^}]*${file}[^}]*}`))?.[0] ?? ''
    expect(face('cormorant-garamond-latin-wght-normal.woff2')).toMatch(/font-weight:\s*500;/)
    expect(face('cormorant-garamond-latin-wght-italic.woff2')).toMatch(/font-weight:\s*400;/)
    expect(face('jetbrains-mono-latin-wght-normal.woff2')).toMatch(/font-weight:\s*500;/)
    expect(face('inter-latin-wght-normal.woff2')).toMatch(/font-weight:\s*400 800;/)
    // Published sites never swap fonts after drawing: optional (used if in time, else the fallback stays).
    const web = css.match(/@font-face\s*{[^}]*_site-assets[^}]*}/g) ?? []
    expect(web.length).toBeGreaterThan(10)
    for (const f of web) expect(f).toMatch(/font-display:\s*optional/)
    expect(css).not.toMatch(/font-display:\s*swap/)
  })
})
