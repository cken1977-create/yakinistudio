import { existsSync, readdirSync, readFileSync } from 'node:fs'
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
 * It is a separate family ('YS Headline'). D4-1 (Clarence 2026-11-28): it is the ONLY source of the
 * display font on a published page. The display variable points at it, with the size-matched local
 * fallback behind it (never the web display family), so the separate display font file is never
 * downloaded. Each face covers every weight (one cut, no faux bold), and the cut always includes
 * printable ASCII and common punctuation, so text the page adds itself still has its glyphs.
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
  paper: ['fraunces-normal'], poster: ['anton-normal'], craft: ['instrument-serif-normal', 'instrument-serif-italic'], clean: ['inter-tight-normal'],
}
const SKIP_KEYS = new Set(['assetId', 'url', 'href', 'formKey', 'id', 'pageId', 'sectionId', 'slug', 'kitId', 'type', 'variant', 'icon', 'kind', 'fields', 'focal', 'locale'])
const MAX_CHARS = 400

/** Every character a visitor can see in the site's text (a superset of its headlines, cache-friendly). */
/** Always in the cut: printable ASCII and common typographic punctuation. */
const BASE_CHARS = [...Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)), '\u00a0', '…', '’', '‘', '“', '”', '–', '—', '•', '·', '✦', '×', '©', '®', '°']

export function siteCharacters(doc: SiteDoc): string {
  const chars = new Set<string>([' ', ' ', '…'])
  const walk = (v: unknown, key?: string) => {
    if (key && SKIP_KEYS.has(key)) return
    if (typeof v === 'string') { for (const c of v) if (c >= ' ' && c !== '*') chars.add(c); return }
    if (Array.isArray(v)) { for (const x of v) walk(x); return }
    if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, k)
  }
  walk(doc.business); walk(doc.nav); walk(doc.pages); walk(doc.footer)
  for (const c of BASE_CHARS) chars.delete(c)
  return [...BASE_CHARS, ...[...chars].sort().slice(0, MAX_CHARS - BASE_CHARS.length)].join('')
}

const range = (text: string) => [...text].map((c) => `U+${c.codePointAt(0)!.toString(16).toUpperCase()}`).join(',')
const fileOf = (key: string) => {
  const [, family, style] = key.match(/^(.+)-(normal|italic)$/)!
  const dir = join(process.env.SITE_ASSETS_DIR ?? join(process.cwd(), 'public', '_site-assets'), 'fonts')
  const exact = `${family}-latin-wght-${style}.woff2`
  if (existsSync(join(dir, exact))) return exact
  const hit = readdirSync(dir).find((n) => n.startsWith(`${family}-latin-`) && n.endsWith(`-${style}.woff2`) && !n.includes('-ext-'))
  if (!hit) throw new Error(`no font file for ${key}`)
  return hit
}

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
    faces.push(`@font-face{font-family:'YS Headline';font-style:${style};font-weight:1 1000;font-display:block;src:url(data:font/woff2;base64,${b64}) format('woff2');unicode-range:${range(text)}}`)
  }
  await face(files[0], 'normal', weight)
  const italic = files.find((f) => f.endsWith('-italic'))
  if (italic) await face(italic, 'italic', 400)
  // Behind the inline face: the size-matched local fallback, never the web display family.
  const fallback = stack.display.split(',').slice(1).join(',').trim()
  const family = `font-family:'YS Headline',${fallback}!important`
  const rules = [
    `.ys-site{--ys-font-display:'YS Headline',${fallback}!important}`,
    `.ys-site :is(${HEADLINES.join(',')}){${family}}`,
    `.ys-site[data-preset='classic'] :is(${CLASSIC_HEADLINES.join(',')}){${family}}`,
    files.some((f) => f.endsWith('-italic')) ? `.ys-site[data-font='${pair}'] .ys-accent{${family}}` : '',
  ].filter(Boolean)
  return { css: faces.join('') + rules.join(''), bytes, displayOnly: DISPLAY_ONLY[pair] ?? [] }
}
