#!/usr/bin/env node
/**
 * Builds the one stylesheet a published client site loads (spec 7.3, R2; perf decision 2026-11-27).
 * Published pages are plain HTML with no framework JavaScript, so they can't use Next.js's CSS
 * pipeline. This inlines @yakini/sections fonts.css + styles.css (following every @import, including
 * the self-hosted @fontsource files), copies the font files next to it, and writes:
 *   public/_site-assets/site.css         the stylesheet (first-party, same origin)
 *   public/_site-assets/fonts/*.woff2     the fonts it points at
 *   public/_site-assets/manifest.json     { css: "/_site-assets/site.css?v=<content hash>" }
 * Runs before `build`, `dev` and the browser tests. Output is generated, never committed.
 */
import { createHash } from 'node:crypto'
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const app = resolve(here, '..')
const require = createRequire(join(app, 'package.json'))
const OUT = join(app, 'public', '_site-assets')
const FONTS = join(OUT, 'fonts')

function resolveImport(spec, fromFile) {
  if (spec.startsWith('.')) return resolve(dirname(fromFile), spec)
  return createRequire(fromFile).resolve(spec)
}

const seen = new Set()
function inline(file) {
  if (seen.has(file)) return ''
  seen.add(file)
  let css = readFileSync(file, 'utf8')
  // Fonts: copy each local file and point at the copy.
  css = css.replace(/url\((['"]?)(\.\/files\/[^'")]+)\1\)/g, (_m, _q, rel) => {
    const src = resolve(dirname(file), rel)
    const name = basename(src)
    copyFileSync(src, join(FONTS, name))
    return `url(/_site-assets/fonts/${name})`
  })
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
const v = createHash('sha256').update(css).digest('hex').slice(0, 12)
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify({ css: `/_site-assets/site.css?v=${v}` }) + '\n')
console.log(`site.css ${Math.round(css.length / 1024)} KB, version ${v}`)
