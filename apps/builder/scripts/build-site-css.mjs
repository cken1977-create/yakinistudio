#!/usr/bin/env node
/**
 * Builds the one stylesheet a published client site loads (spec 7.3, R2; perf decision 2026-11-27).
 * Published pages are plain HTML with no framework JavaScript, so they can't use Next.js's CSS
 * pipeline. This inlines @yakini/sections fonts.css + styles.css (following every @import, including
 * the self-hosted @fontsource files), copies the font files next to it, and writes:
 *   public/_site-assets/site.css         the stylesheet (first-party, same origin)
 *   public/_site-assets/fonts/*.woff2     the fonts it points at
 *   public/_site-assets/manifest.json     { css, fonts: per-pair download sizes }
 * Runs before `build`, `dev` and the browser tests. Output is generated, never committed.
 *
 * Font budget (decision 2026-11-27): self-hosted woff2, subset, at most 100 KB per published site.
 * The Latin file of each font (the one an English page downloads) is subset here: only the weight
 * range the site styles use, and only its own Latin characters. The build fails if any font pair's
 * Latin files add up to more than the budget. Other scripts (Cyrillic, Greek, Vietnamese, Latin
 * Extended) keep their files; browsers fetch those only for pages that use those letters.
 */
import { createHash } from 'node:crypto'
import { copyFileSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const app = resolve(here, '..')
const require = createRequire(join(app, 'package.json'))
const OUT = process.env.SITE_ASSETS_OUT ? resolve(process.env.SITE_ASSETS_OUT) : join(app, 'public', '_site-assets')
const FONTS = join(OUT, 'fonts')
export const FONT_BUDGET = 100 * 1024

/** Weight range each font is used at on a published site (number = one fixed weight). */
const WEIGHTS = {
  'inter-normal': { min: 400, max: 800 },
  'nunito-normal': { min: 300, max: 900 },
  'source-sans-3-normal': { min: 300, max: 900 },
  'fraunces-normal': { min: 400, max: 900 },
  'playfair-display-normal': { min: 400, max: 900 },
  'lora-normal': { min: 400, max: 700 },
  // Signature: display at 500, the accent phrase in italic at 400, labels at 500.
  'cormorant-garamond-normal': 500,
  'cormorant-garamond-italic': 400,
  'jetbrains-mono-normal': 500,
}
/** The Latin files each font pair's site downloads (shared with the page head, which preloads them). */
const PAIRS = JSON.parse(readFileSync(join(app, 'lib', 'site', 'font-files.json'), 'utf8'))

/** Code points listed in a unicode-range descriptor. */
function codePoints(range) {
  const out = []
  for (const part of range.split(',').map((p) => p.trim().replace(/^U\+/i, ''))) {
    const [a, b] = part.split('-').map((h) => parseInt(h, 16))
    for (let c = a; c <= (b ?? a); c++) out.push(c)
  }
  return out
}

function resolveImport(spec, fromFile) {
  if (spec.startsWith('.')) return resolve(dirname(fromFile), spec)
  return createRequire(fromFile).resolve(spec)
}

const seen = new Set()
const subsetJobs = []
const latinFiles = {}
function inline(file) {
  if (seen.has(file)) return ''
  seen.add(file)
  let css = readFileSync(file, 'utf8')
  // Fonts: copy each local file (subset the Latin ones) and point at the copy.
  css = css.replace(/@font-face\s*{[^}]*}/g, (block) => block.replace(/url\((['"]?)(\.\/files\/[^'")]+)\1\)/g, (_m, _q, rel) => {
    const src = resolve(dirname(file), rel)
    const name = basename(src)
    const latin = name.match(/^(.+)-latin-wght-(normal|italic)\.woff2$/)
    const key = latin && `${latin[1]}-${latin[2]}`
    if (key && WEIGHTS[key] !== undefined) {
      const range = block.match(/unicode-range:\s*([^;]+);/)
      if (!range) throw new Error(`no unicode-range for ${name}`)
      subsetJobs.push({ src, name, key, text: String.fromCodePoint(...codePoints(range[1])) })
      latinFiles[key] = name
    } else copyFileSync(src, join(FONTS, name))
    return `url(/_site-assets/fonts/${name})`
  }).replace(/font-weight:\s*[^;]+;/, (decl) => {
    // Every file of a font (all its scripts) declares the same weights as its subset Latin file, so
    // the browser sees one font and uses the right file for each letter; a font cut to one weight
    // says so, so the browser never stretches it to fake other weights.
    const key = Object.keys(WEIGHTS).find((k) => {
      const [, family, style] = k.match(/^(.+)-(normal|italic)$/)
      return new RegExp(`files/${family}-[a-z]+(?:-ext)?-wght-${style}\\.woff2`).test(block)
    })
    const w = key && WEIGHTS[key]
    return typeof w === 'number' ? `font-weight: ${w};` : w ? `font-weight: ${w.min} ${w.max};` : decl
  }))
  return css.replace(/@import\s+['"]([^'"]+)['"]\s*;/g, (_m, spec) => inline(resolveImport(spec, file)))
}


rmSync(OUT, { recursive: true, force: true })
mkdirSync(FONTS, { recursive: true })
const sections = dirname(require.resolve('@yakini/sections/styles.css'))
let css = inline(join(sections, 'fonts.css')) + '\n' + inline(join(sections, 'styles.css'))
// Smaller download: drop comments and blank lines (rules are untouched).
css = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\n\s*\n+/g, '\n').trim() + '\n'
if (/url\(\s*['"]?https?:/i.test(css)) throw new Error('site.css must not load anything from another site (R2)')
writeFileSync(join(OUT, 'site.css'), css)

const subsetFont = require('subset-font')
for (const job of subsetJobs) {
  const w = WEIGHTS[job.key]
  const out = await subsetFont(readFileSync(job.src), job.text, { targetFormat: 'woff2', variationAxes: { wght: w } })
  writeFileSync(join(FONTS, job.name), out)
}
const fonts = {}
for (const [pair, keys] of Object.entries(PAIRS)) {
  const missing = keys.filter((k) => !latinFiles[k])
  if (missing.length) throw new Error(`font pair ${pair}: no Latin file for ${missing.join(', ')}`)
  fonts[pair] = keys.reduce((n, k) => n + statSync(join(FONTS, latinFiles[k])).size, 0)
}
const over = Object.entries(fonts).filter(([, n]) => n > FONT_BUDGET)
if (over.length) throw new Error(`font budget ${FONT_BUDGET / 1024} KB per site exceeded: ${over.map(([p, n]) => `${p} ${(n / 1024).toFixed(1)} KB`).join(', ')}`)

const v = createHash('sha256').update(css).digest('hex').slice(0, 12)
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify({ css: `/_site-assets/site.css?v=${v}`, fonts, fontBudget: FONT_BUDGET }) + '\n')
console.log(`site.css ${Math.round(css.length / 1024)} KB, version ${v}; fonts per site: ${Object.entries(fonts).map(([p, n]) => `${p} ${(n / 1024).toFixed(1)} KB`).join(', ')}`)
