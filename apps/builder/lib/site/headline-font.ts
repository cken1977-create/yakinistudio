import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { FONT_STACKS } from '@yakini/sections'
import type { SiteDoc } from '@yakini/site-schema'
import FONT_FILES from './font-files.json'

/**
 * The site's own headline typeface, sent with the page (font follow-up to PR 140). Published pages
 * use font-display: optional so nothing ever moves, which on a slow first visit means the size-
 * matched fallback shows. The headline is the brand moment, so each page carries its headline font
 * inside the HTML: the display font at the headline weight, cut to just the characters this site's
 * text uses (a few KB), as a `data:` font. It is there before the first paint, every time, with no
 * swap. Body text keeps the shared, cached font files.
 *
 * It is a separate family ('YS Headline') applied only to the headline styles, which all draw at
 * the display weight; other text in the display family (quotes, initials) keeps the shared file.
 * First-party only: the bytes come from the site's own subset font files (R2).
 */
export type HeadlineFont = { css: string; bytes: number; displayOnly: string[] }

/** Headline styles: every one draws in the display family at the display weight. */
const HEADLINES = ['.ys-display', '.ys-h2', '.ys-brand-name', '.ys-footer-name', '.ys-menu-cat-name', '.ys-today-headline', '.ys-cine-headline']
/** Classic looks also set .ys-h3 and prose h3 in the display family (Signature draws them in the body font). */
const CLASSIC_HEADLINES = ['.ys-h3', '.ys-prose h3']
/** Files a pair uses only for display text; when the headline ships with the page they aren't preloaded. */
const DISPLAY_ONLY: Record<string, string[]> = {
  editorial: ['fraunces-normal'], classic: ['playfair-display-normal'], signature: ['cormorant-garamond-normal', 'cormorant-garamond-italic'],
}
const SKIP_KEYS = new Set(['assetId', 'url', 'href', 'formKey', 'id', 'pageId', 'sectionId', 'slug', 'kitId', 'type', 'variant', 'icon', 'kind', 'fields', 'focal', 'locale'])
const MAX_CHARS = 400

/** Every character a visitor can see in the site's text (a superset of its headlines, cache-friendly). */
export function siteCharacters(doc: SiteDoc): string {
  const chars = new Set<string>([' ', ' ', '…'])
  const walk = (v: unknown, key?: string) => {
    if (key && SKIP_KEYS.has(key)) return
    if (typeof v === 'string') { for (const c of v) if (c >= ' ' && c !== '*') chars.add(c); return }
    if (Array.isArray(v)) { for (const x of v) walk(x); return }
    if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, k)
  }
  walk(doc.business); walk(doc.nav); walk(doc.pages); walk(doc.footer)
  return [...chars].sort().slice(0, MAX_CHARS).join('')
}

const range = (text: string) => [...text].map((c) => `U+${c.codePointAt(0)!.toString(16).toUpperCase()}`).join(',')
const fileOf = (key: string) => { const [, family, style] = key.match(/^(.+)-(normal|italic)$/)!; return `${family}-latin-wght-${style}.woff2` }

type Subset = (font: Buffer, text: string, opts: { targetFormat: 'woff2'; variationAxes?: Record<string, number> }) => Promise<Buffer>
let subsetFont: Subset | null = null
const cache = new Map<string, string>()
let cuts = 0
/** Test mode only (never on Vercel): the counter is off in production. */
const counting = () => process.env.BUILDER_TEST_MODE === '1' && !process.env.VERCEL && !process.env.VERCEL_ENV
/** How many fonts this process has cut, in test mode (tests prove a page view cuts none). Always 0 in production. */
export const headlineCuts = () => cuts
/** Tests only: forget cut fonts, as a fresh server instance would. */
export const clearHeadlineCuts = () => cache.clear()

async function cut(file: string, text: string, weight: number): Promise<string> {
  const key = `${file}|${weight}|${text}`
  const hit = cache.get(key)
  if (hit) return hit
  if (counting()) cuts++
  subsetFont ??= createRequire(join(process.cwd(), 'package.json'))('subset-font') as Subset
  const src = readFileSync(join(process.env.SITE_ASSETS_DIR ?? join(process.cwd(), 'public', '_site-assets'), 'fonts', file))
  let out: Buffer
  try { out = await subsetFont(src, text, { targetFormat: 'woff2', variationAxes: { wght: weight } }) } catch {
    out = await subsetFont(src, text, { targetFormat: 'woff2' }) // already a single-weight file
  }
  const b64 = out.toString('base64')
  if (cache.size > 500) cache.delete(cache.keys().next().value!)
  cache.set(key, b64)
  return b64
}

/** The inline headline font and the rules that use it, for one site (null if it can't be made). */
export async function headlineFont(doc: SiteDoc): Promise<HeadlineFont | null> {
  const pair = doc.style.fontPair
  const stack = FONT_STACKS[pair]
  const files = (FONT_FILES as Record<string, string[]>)[pair]
  if (!stack || !files?.length) return null
  const text = siteCharacters(doc)
  const weight = stack.displayWeight
  const faces: string[] = []
  let bytes = 0
  const face = async (key: string, style: 'normal' | 'italic', w: number) => {
    const b64 = await cut(fileOf(key), text, w)
    bytes += Math.ceil((b64.length * 3) / 4)
    faces.push(`@font-face{font-family:'YS Headline';font-style:${style};font-weight:${w};font-display:block;src:url(data:font/woff2;base64,${b64}) format('woff2');unicode-range:${range(text)}}`)
  }
  await face(files[0], 'normal', weight)
  // Signature's accent phrase is Cormorant italic at 400.
  if (pair === 'signature' && files.includes('cormorant-garamond-italic')) await face('cormorant-garamond-italic', 'italic', 400)
  const family = `font-family:'YS Headline',${stack.display}!important`
  const rules = [
    `.ys-site :is(${HEADLINES.join(',')}){${family}}`,
    `.ys-site:not([data-preset='signature']) :is(${CLASSIC_HEADLINES.join(',')}){${family}}`,
    pair === 'signature' ? `.ys-site[data-preset='signature'] .ys-accent{${family}}` : '',
  ].filter(Boolean)
  return { css: faces.join('') + rules.join(''), bytes, displayOnly: DISPLAY_ONLY[pair] ?? [] }
}
