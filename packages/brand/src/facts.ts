/**
 * Scraped facts extraction (spec 8.3). No AI. Turns a fetched page into plain-text facts the model
 * may read inside UNTRUSTED_SITE_CONTENT, plus candidate photos and same-site links.
 *
 * Everything a visitor cannot see is dropped before any text is collected: scripts, styles,
 * comments, templates, hidden elements (hidden attribute, aria-hidden, inline display:none and
 * friends, screen-reader-only classes, and classes/ids a <style> block hides). Hidden text is the
 * usual home of prompt injection, so it never reaches the model (spec 14.3, 16.4).
 */
import { parseDocument } from 'htmlparser2'
import type { ChildNode, Element } from 'domhandler'

export const PAGE_TEXT_MAX = 20_000
export const SITE_TEXT_MAX = 12_000
export const MAX_IMAGE_CANDIDATES = 12

export type SocialKind = 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'x' | 'linkedin' | 'yelp' | 'google'

export type PageFacts = {
  url: string
  title?: string
  description?: string
  headings: string[]
  paragraphs: string[]
  listItems: string[]
  phones: string[]
  emails: string[]
  prices: string[]
  structured: string[]
  images: { src: string; alt: string }[]
  links: { href: string; text: string }[]
  social: { kind: SocialKind; url: string }[]
}

const DROP_TAGS = new Set(['script', 'style', 'noscript', 'template', 'svg', 'iframe', 'object', 'embed', 'canvas', 'head', 'select', 'option', 'button', 'form', 'input', 'textarea'])
const HIDDEN_STYLE = /(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0(?:\.0+)?\s*(?:;|$|!)|font-size\s*:\s*0(?:px|em|rem)?\s*(?:;|$|!)|clip\s*:\s*rect\(\s*0|clip-path\s*:\s*inset\(\s*50%|(?:left|top|text-indent)\s*:\s*-\d{3,}(?:px|em)|max-height\s*:\s*0(?:px)?\s*(?:;|$)|width\s*:\s*0(?:px)?\s*;\s*height\s*:\s*0)/i
const HIDDEN_CLASS = /(?:^|\s)(?:sr-only|visually-hidden|visuallyhidden|screen-reader-text|screen-reader-only|hidden|d-none|is-hidden|hide|invisible|offscreen)(?:\s|$)/i

const SOCIAL_HOSTS: [SocialKind, RegExp][] = [
  ['facebook', /(^|\.)(facebook\.com|fb\.com)$/],
  ['instagram', /(^|\.)instagram\.com$/],
  ['tiktok', /(^|\.)tiktok\.com$/],
  ['youtube', /(^|\.)(youtube\.com|youtu\.be)$/],
  ['x', /(^|\.)(x\.com|twitter\.com)$/],
  ['linkedin', /(^|\.)linkedin\.com$/],
  ['yelp', /(^|\.)yelp\.com$/],
  ['google', /(^|\.)(g\.page|business\.google\.com)$/],
]

/** Hosts that serve a business's own photos for common website builders (treated as "same site"). */
const OWN_IMAGE_CDNS = /(^|\.)(squarespace-cdn\.com|wixstatic\.com|wsimg\.com|shopify\.com|cdn\.shopify\.com|wp\.com|cloudfront\.net|webflow\.com|website-files\.com|googleusercontent\.com)$/

function isEl(n: ChildNode): n is Element {
  return n.type === 'tag' || n.type === 'script' || n.type === 'style'
}

export function apexOf(host: string): string {
  const h = host.toLowerCase().replace(/\.$/, '')
  const parts = h.split('.')
  // Good enough for US small businesses; two-label public suffixes (co.uk etc.) keep three labels.
  if (parts.length > 2 && /^(co|com|org|net|gov|ac)$/.test(parts[parts.length - 2]) && parts[parts.length - 1].length === 2) return parts.slice(-3).join('.')
  return parts.slice(-2).join('.')
}

export function sameSite(a: URL, b: URL): boolean {
  return apexOf(a.hostname) === apexOf(b.hostname)
}

function clean(s: string): string {
  return s
    .replace(/&nbsp;/gi, ' ')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁠-⁤﻿]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Classes and ids that a page's <style> blocks hide outright (e.g. `.promo{display:none}`). */
function stylesheetHidden(html: string): { classes: Set<string>; ids: Set<string> } {
  const classes = new Set<string>()
  const ids = new Set<string>()
  const blocks = html.match(/<style[^>]*>[\s\S]{0,60000}?<\/style>/gi) ?? []
  for (const block of blocks.slice(0, 10)) {
    for (const m of block.matchAll(/([^{}]{1,300})\{([^}]{0,2000})\}/g)) {
      if (!/display\s*:\s*none|visibility\s*:\s*hidden|font-size\s*:\s*0(?:px)?\s*(?:;|$)|opacity\s*:\s*0\s*(?:;|$)/i.test(m[2])) continue
      for (const sel of m[1].split(',')) {
        const t = sel.trim()
        const c = /^\.([a-z0-9_-]{1,80})$/i.exec(t)
        const i = /^#([a-z0-9_-]{1,80})$/i.exec(t)
        if (c) classes.add(c[1])
        if (i) ids.add(i[1])
      }
    }
  }
  return { classes, ids }
}

function isHidden(el: Element, sheet: { classes: Set<string>; ids: Set<string> }): boolean {
  const a = el.attribs ?? {}
  if ('hidden' in a) return true
  if ((a['aria-hidden'] ?? '').toLowerCase() === 'true') return true
  if (a.style && HIDDEN_STYLE.test(a.style)) return true
  if (a.class && HIDDEN_CLASS.test(a.class)) return true
  if (a.class && a.class.split(/\s+/).some((c) => sheet.classes.has(c))) return true
  if (a.id && sheet.ids.has(a.id)) return true
  return false
}

function textOf(n: ChildNode, sheet: { classes: Set<string>; ids: Set<string> }): string {
  if (n.type === 'text') return n.data
  if (!isEl(n)) return ''
  if (DROP_TAGS.has(n.name) || isHidden(n, sheet)) return ''
  const inner = n.children.map((c) => textOf(c, sheet)).join(n.name === 'br' ? '\n' : '')
  return /^(p|div|li|h[1-6]|section|article|td|th|tr|dd|dt|br)$/.test(n.name) ? ` ${inner} ` : inner
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]{1,6});/gi, (_, h) => safeChar(parseInt(h, 16)))
    .replace(/&#(\d{1,7});/g, (_, n) => safeChar(Number(n)))
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}
function safeChar(code: number): string {
  return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : ''
}

function firstAttr(el: Element, names: string[]): string | undefined {
  for (const n of names) if (el.attribs?.[n]) return el.attribs[n]
  return undefined
}

function walk(nodes: ChildNode[], visit: (el: Element) => boolean | void, sheet: { classes: Set<string>; ids: Set<string> }): void {
  for (const n of nodes) {
    if (!isEl(n)) continue
    if (isHidden(n, sheet)) continue
    if (visit(n) === false) continue
    if (n.name === 'script' || n.name === 'style' || n.name === 'template' || n.name === 'noscript') continue
    walk(n.children, visit, sheet)
  }
}

function socialKind(u: URL): SocialKind | null {
  const host = u.hostname.toLowerCase()
  for (const [kind, re] of SOCIAL_HOSTS) if (re.test(host)) return kind
  if (/(^|\.)google\.com$/.test(host) && u.pathname.startsWith('/maps')) return 'google'
  return null
}

const TYPES_OF_INTEREST = /^(LocalBusiness|Restaurant|FoodEstablishment|FoodTruck|CafeOrCoffeeShop|BarOrPub|Bakery|Menu|MenuSection|MenuItem|Organization|Store)$/

function compactJsonLd(value: unknown, out: string[], depth = 0): void {
  if (depth > 6 || out.length > 80) return
  if (Array.isArray(value)) { for (const v of value.slice(0, 60)) compactJsonLd(v, out, depth + 1); return }
  if (!value || typeof value !== 'object') return
  const o = value as Record<string, unknown>
  if (Array.isArray(o['@graph'])) compactJsonLd(o['@graph'], out, depth + 1)
  const type = ([] as unknown[]).concat(o['@type'] ?? []).map(String)
  if (type.some((t) => TYPES_OF_INTEREST.test(t))) {
    const bits: string[] = []
    const str = (k: string) => (typeof o[k] === 'string' || typeof o[k] === 'number' ? clean(String(o[k])).slice(0, 300) : '')
    for (const k of ['name', 'description', 'telephone', 'email', 'servesCuisine', 'priceRange', 'areaServed']) if (str(k)) bits.push(`${k}: ${str(k)}`)
    const addr = o.address as Record<string, unknown> | undefined
    if (addr && typeof addr === 'object') {
      const a = ['streetAddress', 'addressLocality', 'addressRegion', 'postalCode'].map((k) => (typeof addr[k] === 'string' ? clean(addr[k] as string) : '')).filter(Boolean).join(', ')
      if (a) bits.push(`address: ${a.slice(0, 200)}`)
    }
    const oh = o.openingHours
    if (typeof oh === 'string' || Array.isArray(oh)) bits.push(`openingHours: ${([] as unknown[]).concat(oh).map(String).join('; ').slice(0, 300)}`)
    const spec = o.openingHoursSpecification
    if (Array.isArray(spec)) {
      bits.push(`hours: ${spec.slice(0, 14).map((s) => {
        const x = s as Record<string, unknown>
        return `${([] as unknown[]).concat(x.dayOfWeek ?? []).map((d) => String(d).replace(/^https?:\/\/schema\.org\//, '')).join('/')} ${x.opens ?? ''}-${x.closes ?? ''}`
      }).join('; ').slice(0, 400)}`)
    }
    const offers = o.offers as Record<string, unknown> | undefined
    if (offers && typeof offers === 'object' && (typeof offers.price === 'string' || typeof offers.price === 'number')) bits.push(`price: ${String(offers.price).slice(0, 20)}`)
    if (bits.length) out.push(`${type[0]}: ${bits.join(' | ')}`)
  }
  for (const k of ['hasMenu', 'hasMenuSection', 'hasMenuItem', 'mainEntity', 'menu']) if (o[k] && typeof o[k] === 'object') compactJsonLd(o[k], out, depth + 1)
}

const PRICE_RE = /\$\s?\d{1,4}(?:[.,]\d{2})?/g

/** Extract facts from one page. Never executes anything; JSON-LD is parsed as data only. */
export function extractFacts(html: string, pageUrl: URL): PageFacts {
  const sheet = stylesheetHidden(html)
  const dom = parseDocument(html, { decodeEntities: true, lowerCaseTags: true, lowerCaseAttributeNames: true })
  const facts: PageFacts = {
    url: pageUrl.toString(), headings: [], paragraphs: [], listItems: [], phones: [], emails: [], prices: [],
    structured: [], images: [], links: [], social: [],
  }
  let budget = PAGE_TEXT_MAX
  const take = (list: string[], raw: string, max = 600) => {
    const t = clean(raw).slice(0, max)
    if (!t || t.length < 2 || budget <= 0 || list.includes(t)) return
    budget -= t.length
    list.push(t)
  }
  const seenImg = new Set<string>()
  const seenLink = new Set<string>()

  // Title and meta description live in <head>, so read them before the body walk.
  for (const n of dom.children) collectHead(n)
  function collectHead(n: ChildNode): void {
    if (!isEl(n)) return
    if (n.name === 'title' && !facts.title) facts.title = clean(n.children.map((c) => (c.type === 'text' ? c.data : '')).join('')).slice(0, 200)
    if (n.name === 'meta') {
      const name = (n.attribs.name || n.attribs.property || '').toLowerCase()
      if ((name === 'description' || name === 'og:description') && !facts.description) facts.description = clean(n.attribs.content || '').slice(0, 300)
    }
    if (n.name === 'script' && (n.attribs.type || '').toLowerCase() === 'application/ld+json') {
      const raw = n.children.map((c) => (c.type === 'text' ? c.data : '')).join('').slice(0, 100_000)
      try { compactJsonLd(JSON.parse(raw), facts.structured) } catch { /* not JSON: ignore */ }
      return
    }
    if (n.name === 'script' || n.name === 'style') return
    for (const c of n.children) collectHead(c)
  }

  walk(dom.children, (el) => {
    if (DROP_TAGS.has(el.name) && el.name !== 'head') return false
    if (el.name === 'head') return false
    if (/^h[1-3]$/.test(el.name)) { take(facts.headings, textOf(el, sheet), 200); return false }
    if (el.name === 'p' || el.name === 'blockquote') { take(facts.paragraphs, textOf(el, sheet)); return false }
    if (el.name === 'li' || el.name === 'dt' || el.name === 'dd') { take(facts.listItems, textOf(el, sheet), 300); return false }
    if (el.name === 'a') {
      const href = el.attribs.href?.trim()
      if (!href) return
      const lower = href.toLowerCase()
      if (lower.startsWith('tel:')) { const t = decodeEntities(href.slice(4)).replace(/[^\d+]/g, ''); if (t && !facts.phones.includes(t)) facts.phones.push(t.slice(0, 20)) }
      else if (lower.startsWith('mailto:')) { const e = decodeEntities(href.slice(7)).split('?')[0].trim(); if (/^[^\s@<>]{1,64}@[^\s@<>]{1,190}$/.test(e) && !facts.emails.includes(e)) facts.emails.push(e) }
      else {
        let u: URL
        try { u = new URL(href, pageUrl) } catch { return }
        if (u.protocol !== 'https:' && u.protocol !== 'http:') return
        const kind = socialKind(u)
        if (kind && u.protocol === 'https:' && !facts.social.some((s) => s.kind === kind)) facts.social.push({ kind, url: `${u.origin}${u.pathname}`.slice(0, 300) })
        else if (sameSite(u, pageUrl) && facts.links.length < 60) {
          u.hash = ''
          const key = u.toString()
          if (!seenLink.has(key)) { seenLink.add(key); facts.links.push({ href: key, text: clean(textOf(el, sheet)).slice(0, 80) }) }
        }
      }
      return
    }
    if (el.name === 'img' && facts.images.length < MAX_IMAGE_CANDIDATES * 2) {
      const raw = firstAttr(el, ['src', 'data-src', 'data-lazy-src', 'data-original']) ?? el.attribs.srcset?.split(',')[0]?.trim().split(/\s+/)[0]
      if (!raw || raw.startsWith('data:')) return
      const w = Number(el.attribs.width || 0)
      const h = Number(el.attribs.height || 0)
      if ((w && w < 120) || (h && h < 120)) return // icons, spacers, tracking pixels
      let u: URL
      try { u = new URL(raw, pageUrl) } catch { return }
      if (u.protocol !== 'https:' && u.protocol !== 'http:') return
      if (!sameSite(u, pageUrl) && !OWN_IMAGE_CDNS.test(u.hostname.toLowerCase())) return
      if (/\.svg(\?|$)/i.test(u.pathname) || /(logo|icon|sprite|pixel|badge|favicon)/i.test(u.pathname)) return
      const key = u.toString()
      if (seenImg.has(key)) return
      seenImg.add(key)
      facts.images.push({ src: key, alt: clean(el.attribs.alt || '').slice(0, 160) })
    }
  }, sheet)

  const visible = [...facts.headings, ...facts.paragraphs, ...facts.listItems].join(' ')
  facts.prices = [...new Set(visible.match(PRICE_RE) ?? [])].slice(0, 50)
  facts.images = facts.images.slice(0, MAX_IMAGE_CANDIDATES)
  return facts
}

/** Which same-site links are worth reading (spec 5.2 4d): about, menu, services, contact, hours. */
export function pickLinks(home: PageFacts, max = 4): string[] {
  const groups = [/about|story|who-we-are|our-team/, /menu|food|dishes/, /services|catering|events|private/, /contact|hours|location|visit|find-us/]
  const out: string[] = []
  const homeUrl = new URL(home.url)
  for (const re of groups) {
    const hit = home.links.find((l) => {
      const u = new URL(l.href)
      if (u.pathname === homeUrl.pathname || out.includes(l.href)) return false
      if (/\.(pdf|jpe?g|png|gif|webp|zip|docx?)$/i.test(u.pathname)) return false
      return re.test(u.pathname.toLowerCase()) || re.test(l.text.toLowerCase())
    })
    if (hit) out.push(hit.href)
    if (out.length >= max) break
  }
  return out
}

/** The text block the model sees inside UNTRUSTED_SITE_CONTENT (spec 8.4), capped at 12,000 chars. */
export function factsToText(pages: PageFacts[], max = SITE_TEXT_MAX): string {
  const parts: string[] = []
  for (const f of pages) {
    const u = new URL(f.url)
    const lines = [`# Page ${u.pathname}`]
    if (f.title) lines.push(`Title: ${f.title}`)
    if (f.description) lines.push(`Description: ${f.description}`)
    if (f.structured.length) lines.push(...f.structured.map((s) => `Data: ${s}`))
    if (f.headings.length) lines.push(`Headings: ${f.headings.join(' / ')}`)
    lines.push(...f.paragraphs)
    if (f.listItems.length) lines.push(...f.listItems.map((li) => `- ${li}`))
    if (f.phones.length) lines.push(`Phone links: ${f.phones.join(', ')}`)
    if (f.emails.length) lines.push(`Email links: ${f.emails.join(', ')}`)
    parts.push(lines.join('\n'))
  }
  let text = parts.join('\n\n')
  // The block is wrapped in a tag; never let page text close or fake it.
  text = text.replace(/<\/?\s*UNTRUSTED_SITE_CONTENT[^>]*>/gi, '[removed]')
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

/** First phone found on the site, as E.164 when it is a plain US number. */
export function phoneToE164(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10 && /^[2-9]/.test(digits)) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1') && /^1[2-9]/.test(digits)) return `+${digits}`
  return undefined
}
