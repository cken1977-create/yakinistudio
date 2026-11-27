import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The classic look stays the original stylesheet byte for byte (plan 6.1, spec 7.4). styles.css
 * imports the parts; base.css + sections/*.css + responsive.css, in import order, must equal the
 * pre-v2 stylesheet in __snapshots__/styles-v1.css. Design-v2 files may only add custom properties
 * (tokens.css), rules scoped to a data-preset (presets/*.css), or rules for variants that did not
 * exist in v1 (variants/*.css, e.g. the cinematic hero).
 */
const dir = __dirname
const imports = [...readFileSync(join(dir, 'styles.css'), 'utf8').matchAll(/@import '\.\/([^']+)';/g)].map((m) => m[1])
const read = (f: string) => readFileSync(join(dir, f), 'utf8')

describe('stylesheet parts', () => {
  it('classic = the original stylesheet, byte for byte', () => {
    const classic = imports.filter((f) => f !== 'tokens.css' && f !== 'editor.css' && !f.startsWith('presets/') && !f.startsWith('variants/'))
    expect(classic.join('') ? classic.map(read).join('') : '').toBe(read('__snapshots__/styles-v1.css'))
  })
  it('tokens.css only sets custom properties on .ys-site', () => {
    const body = read('tokens.css').replace(/\/\*[\s\S]*?\*\//g, '')
    for (const decl of body.replace(/^\s*\.ys-site\s*\{|\}\s*$/g, '').split(';').map((d) => d.trim()).filter(Boolean)) expect(decl, decl).toMatch(/^--ys-[a-z0-9-]+\s*:/)
  })
  it('presets: classic adds no rules; every Signature selector is scoped to its data-preset', () => {
    expect(read('presets/classic.css').replace(/\/\*[\s\S]*?\*\//g, '').trim()).toBe('')
    const css = read('presets/signature.css').replace(/\/\*[\s\S]*?\*\//g, '')
    const selectors = [...css.matchAll(/(^|[}\n])\s*([^@{}\s][^{}]*?)\s*\{/g)].map((m) => m[2].trim()).filter((s) => !/^(from|to|\d+%)$/.test(s))
    expect(selectors.length).toBeGreaterThan(40)
    for (const sel of selectors) for (const part of sel.split(/,(?![^(]*\))/)) expect(part.trim(), sel).toMatch(/^\.ys-site\[data-preset='signature'\]/)
  })
  it('variant files only style variants that did not exist in v1', () => {
    const css = read('variants/hero-cinematic.css').replace(/\/\*[\s\S]*?\*\//g, '')
    const selectors = [...css.matchAll(/(^|[}\n])\s*([^@{}\s][^{}]*?)\s*\{/g)].map((m) => m[2].trim())
    for (const sel of selectors) for (const part of sel.split(/,(?![^(]*\))/)) expect(part.trim(), sel).toMatch(/ys-v-cinematic|ys-cine-/)
  })
  it('editor.css only restyles the editor-only placeholder marks and hints', () => {
    const css = read('editor.css').replace(/\/\*[\s\S]*?\*\//g, '')
    const selectors = [...css.matchAll(/(^|[}\n])\s*([^@{}\s][^{}]*?)\s*\{/g)].map((m) => m[2].trim())
    expect(selectors).toEqual(['.ys-site mark.ys-ph', '.ys-site p.ys-hint'])
  })
  it('no third-party URLs anywhere (R2)', () => {
    for (const f of ['styles.css', 'fonts.css', ...imports]) expect(read(f), f).not.toMatch(/url\(\s*['"]?https?:/i)
  })
})
