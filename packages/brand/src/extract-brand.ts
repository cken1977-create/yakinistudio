import type { KitId, SizeId } from '@yakini/pricing'
import { isSafePublicLogoUrl } from './safe-url'

export type BrandColors = {
  primary: string
  secondary: string
  accent: string
}

export type BrandProfile = {
  name: string
  logoUrl: string | null
  colors: BrandColors
  sourceUrl: string | null
  fetched: boolean
  suggestedKit?: KitId
  suggestedSize?: SizeId
  intro?: string
}

export const FALLBACK_COLORS: BrandColors = {
  primary: '#0B1437',
  secondary: '#15130F',
  accent: '#C9A14A',
}

const ATTR = `['"]([^'"]+)['"]`

function allMatches(html: string, re: RegExp): string[] {
  const out: string[] = []
  const copy = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g')
  let m: RegExpExecArray | null
  while ((m = copy.exec(html))) out.push(m[1].trim())
  return out
}

function decode(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function firstMeta(html: string, names: string[]): string | null {
  for (const name of names) {
    const prop = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(
      `<meta[^>]+(?:property|name)\\s*=\\s*['"]${prop}['"][^>]+content\\s*=\\s*${ATTR}[^>]*>|<meta[^>]+content\\s*=\\s*${ATTR}[^>]+(?:property|name)\\s*=\\s*['"]${prop}['"][^>]*>`,
      'ig',
    )
    const m = re.exec(html)
    if (m?.[1] || m?.[2]) return decode(m[1] || m[2])
  }
  return null
}

function titleTag(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i)
  return m ? decode(m[1]) : null
}

function cleanName(raw: string): string {
  let name = raw.replace(/\s+/g, ' ').trim()
  // Prefer the business name before a tagline separator (· | - – — • :).
  const parts = name.split(/\s+[|·•–—]\s+|\s+-\s+|\s*:\s+/)
  if (parts[0] && parts[0].length >= 2 && parts[0].length <= 60) name = parts[0]
  name = name.replace(/^\s*welcome to\s+/i, '')
  return name.trim().slice(0, 80)
}

function iconHrefs(html: string): { href: string; score: number }[] {
  const found: { href: string; score: number }[] = []
  const re = /<link\b[^>]*>/ig
  let tag: RegExpExecArray | null
  while ((tag = re.exec(html))) {
    const el = tag[0]
    const rel = (el.match(/rel\s*=\s*['"]([^'"]+)['"]/i) || [])[1]?.toLowerCase() || ''
    const href = (el.match(/href\s*=\s*['"]([^'"]+)['"]/i) || [])[1]
    if (!href) continue
    const sizes = (el.match(/sizes\s*=\s*['"]([^'"]+)['"]/i) || [])[1] || ''
    const type = (el.match(/type\s*=\s*['"]([^'"]+)['"]/i) || [])[1] || ''
    let score = 0
    if (rel.includes('apple-touch-icon')) score += 50
    else if (rel.includes('apple-touch')) score += 40
    else if (/\bicon\b/.test(rel) && !rel.includes('mask-icon')) score += 20
    else if (rel.includes('shortcut')) score += 15
    else continue
    const dim = Math.max(...sizes.split(/\s+/).map((s) => parseInt(s, 10) || 0), 0)
    score += Math.min(dim, 256) / 4
    if (type.includes('svg') || href.endsWith('.svg')) score += 25
    if (href.includes('favicon') && dim <= 32) score -= 8
    found.push({ href: decode(href), score })
  }
  return found.sort((a, b) => b.score - a.score)
}

function normalizeHex(color: string): string | null {
  const value = color.trim()
  const short = value.match(/^#([0-9a-f]{3})$/i)
  if (short) {
    const [r, g, b] = short[1].split('')
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
  }
  const long = value.match(/^#([0-9a-f]{6})$/i)
  if (long) return `#${long[1].toUpperCase()}`
  const rgb = value.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i)
  if (rgb) {
    const nums = [rgb[1], rgb[2], rgb[3]].map(Number)
    if (nums.every((n) => n >= 0 && n <= 255)) {
      return `#${nums.map((n) => n.toString(16).padStart(2, '0')).join('')}`.toUpperCase()
    }
  }
  return null
}

function isNeutral(hex: string): boolean {
  const n = hex.replace('#', '')
  const r = parseInt(n.slice(0, 2), 16)
  const g = parseInt(n.slice(2, 4), 16)
  const b = parseInt(n.slice(4, 6), 16)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const avg = (r + g + b) / 3
  if (max - min < 18 && (avg < 30 || avg > 230)) return true
  return false
}

function collectColors(html: string): string[] {
  const colors: string[] = []
  const push = (raw?: string | null) => {
    if (!raw) return
    const hex = normalizeHex(raw)
    if (!hex || isNeutral(hex)) return
    if (!colors.includes(hex)) colors.push(hex)
  }
  push(firstMeta(html, ['theme-color', 'msapplication-TileColor', 'msapplication-navbutton-color']))
  const vars = allMatches(
    html,
    /(?:--(?:color-)?(?:primary|brand|accent|secondary|theme|main)|--brandColor)\s*:\s*(#[0-9a-f]{3,8}|rgba?\([^)]+\))/ig,
  )
  vars.forEach(push)
  // A few hex colors from inline styles, skipping long binary-looking blobs.
  const styleBlocks = html.match(/<style[^>]*>[\s\S]{0,8000}?<\/style>/gi) || []
  for (const block of styleBlocks.slice(0, 4)) {
    const hexes = block.match(/#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/gi) || []
    for (const h of hexes.slice(0, 20)) push(h)
  }
  return colors
}

const KIT_HINTS: { kit: KitId; words: string[] }[] = [
  { kit: 'food-truck', words: ['food truck', 'foodtruck', 'taco truck', 'catering truck'] },
  { kit: 'restaurant', words: ['restaurant', 'bistro', 'cafe', 'café', 'diner', 'eatery'] },
  { kit: 'landlord', words: ['apartments', 'property management', 'rental units', 'landlord', 'residences'] },
  { kit: 'real-estate', words: ['real estate', 'realtor', 'realty', 'brokerage', 'homes for sale'] },
  { kit: 'tree-lawn', words: ['tree service', 'lawn care', 'landscaping', 'arborist', 'lawn'] },
  { kit: 'nonprofit', words: ['nonprofit', 'non-profit', '501(c)', 'foundation', 'charity'] },
  { kit: 'training-school', words: ['training school', 'academy', 'trade school', 'vocational', 'students'] },
  { kit: 'trucking', words: ['trucking', 'freight', 'logistics', 'dispatch', 'owner operator'] },
  { kit: 'oilfield', words: ['oilfield', 'oil field', 'oil & gas', 'oil and gas', 'well service'] },
]

export function suggestKitFromText(text: string): KitId | undefined {
  const hay = text.toLowerCase()
  for (const hint of KIT_HINTS) {
    if (hint.words.some((w) => hay.includes(w))) return hint.kit
  }
  return undefined
}

export function extractBrand(html: string, pageUrl: URL, fallbackName?: string): BrandProfile {
  const rawName =
    firstMeta(html, ['og:site_name', 'application-name', 'og:title', 'twitter:title', 'dc.title']) ||
    titleTag(html) ||
    fallbackName ||
    pageUrl.hostname.replace(/^www\./, '')

  const name = cleanName(rawName) || fallbackName || pageUrl.hostname.replace(/^www\./, '')

  const icons = iconHrefs(html)
  const ogImage = firstMeta(html, ['og:image', 'og:image:url', 'twitter:image', 'msapplication-TileImage'])
  const candidates = [...icons.map((i) => i.href), ogImage].filter((v): v is string => Boolean(v))
  let logoUrl: string | null = null
  for (const href of candidates) {
    try {
      const abs = new URL(href, pageUrl)
      if (isSafePublicLogoUrl(abs.toString(), pageUrl)) {
        logoUrl = abs.toString()
        break
      }
    } catch {
      /* skip */
    }
  }

  const extracted = collectColors(html)
  const colors: BrandColors = {
    primary: extracted[0] || FALLBACK_COLORS.primary,
    secondary: extracted[1] || FALLBACK_COLORS.secondary,
    accent: extracted[2] || extracted[0] || FALLBACK_COLORS.accent,
  }

  const suggestedKit = suggestKitFromText(`${name} ${titleTag(html) || ''} ${firstMeta(html, ['og:description', 'description']) || ''}`)

  return {
    name,
    logoUrl,
    colors,
    sourceUrl: pageUrl.toString(),
    fetched: true,
    suggestedKit,
  }
}

export function contrastInk(bg: string): string {
  const hex = (normalizeHex(bg) || FALLBACK_COLORS.primary).replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16) / 255
  const g = parseInt(hex.slice(2, 4), 16) / 255
  const b = parseInt(hex.slice(4, 6), 16) / 255
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  return L > 0.55 ? '#15130F' : '#F7F4EC'
}

export function withAlpha(hex: string, alpha: number): string {
  const n = (normalizeHex(hex) || FALLBACK_COLORS.primary).replace('#', '')
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0')
  return `#${n}${a}`
}

const KIT_IDS = new Set<KitId>([
  'food-truck',
  'landlord',
  'real-estate',
  'restaurant',
  'tree-lawn',
  'nonprofit',
  'training-school',
  'trucking',
  'oilfield',
  'specialized',
  'cannabis',
  'home-healthcare',
  'reentry',
])

/** Map a model or free-text kit id onto a known catalog id. */
export function asKitId(value: string | undefined): KitId | undefined {
  if (!value) return undefined
  const raw = value.trim().toLowerCase().replace(/[\s_]+/g, '-')
  const mapped = raw === 'training' || raw === 'school' ? 'training-school' : raw
  return KIT_IDS.has(mapped as KitId) ? (mapped as KitId) : undefined
}

export function asSizeId(value: string | undefined): SizeId | undefined {
  if (value === 'small' || value === 'growing' || value === 'larger') return value
  return undefined
}

/** Visible text from a page, kept only for the current request. Never store this. */
export function pageExcerpt(html: string, max = 1600): string {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

export function looksLikeHostName(name: string): boolean {
  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(name.trim())
}

export function colorsLookWeak(colors: BrandColors): boolean {
  return colors.primary === FALLBACK_COLORS.primary && colors.accent === FALLBACK_COLORS.accent
}
