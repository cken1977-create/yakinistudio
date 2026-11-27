import type { Section, SiteDocContent } from '@yakini/site-schema'
import type { KitDefinition, TemplateContext } from './types'
import { offeredSamples } from './index'

/**
 * Layout composer (design D2): the rhythm rules every new draft is built with.
 * - Home for every kit: cinematic hero → ticker → feature rows (or the kit's own highlight) →
 *   stats or a big quote → mosaic gallery → image CTA → statement footer. Sections with nothing
 *   in them are dropped when the site is shown (D1).
 * - Never two photo-less sections in a row when there's a photo section that can go between them.
 * - At most one full-bleed moment per page besides the hero; Home has exactly one (the image CTA)
 *   whenever there's a photo for it.
 * Neighbouring sections alternate surface depth at render time (SiteView, design-v2 presets).
 * Nothing here invents facts: stats and feature rows start empty for the owner to fill.
 */
type Sec = Section
const PH = /\[\[[^\]]*\]\]/

const FULL_BLEED = (s: Sec) => (s.type === 'cta_band' && s.variant === 'image') || (s.type === 'gallery' && s.variant === 'filmstrip')
const isHeroLike = (s: Sec) => s.type === 'hero'
const CHROME = new Set(['header', 'footer', 'today'])

/** True when the section will show a photo with this content (used for rhythm). */
export function showsImage(s: Sec): boolean {
  const p = s.props as Record<string, unknown>
  switch (s.type) {
    case 'hero': case 'about': case 'cta_band': return Boolean(p.image)
    case 'gallery': return (p.images as unknown[]).length > 0
    case 'feature_rows': return (s.props.items).some((i) => i.image)
    case 'menu': return s.props.categories.some((c) => c.items.some((i) => i.image))
    case 'team': return s.props.members.some((m) => m.photo)
    default: return false
  }
}

/** True when the section will show anything at all (mirrors the renderer's empty rules, simplified). */
export function showsContent(s: Sec): boolean {
  if (s.hidden) return false
  const p = s.props as Record<string, unknown>
  switch (s.type) {
    case 'gallery': return (p.images as unknown[]).length > 0
    case 'testimonials': case 'services': case 'faq': return (p.items as unknown[]).length > 0
    case 'stats': return s.props.items.length >= 2
    case 'feature_rows': return s.props.items.length > 0
    case 'ticker': return s.props.items.length >= 3
    case 'team': return s.props.members.length > 0
    case 'menu': return s.props.categories.some((c) => c.items.length > 0)
    case 'schedule': return s.props.stops.length > 0
    case 'about': return Boolean(s.props.image) || s.props.body.some((b) => b.children.some((c) => c.text.trim() && !PH.test(c.text)))
    case 'today': return false
    default: return true
  }
}

/**
 * Reorder a page's middle sections so two photo-less sections don't sit together when a photo
 * section can go between them. Stable otherwise; header, first hero and footer stay put; empty
 * sections travel with the section after them.
 */
export function arrangeRhythm(sections: Sec[]): Sec[] {
  const head: Sec[] = []
  let i = 0
  while (i < sections.length && (sections[i].type === 'header' || (head.every((h) => h.type === 'header') && isHeroLike(sections[i])) || sections[i].type === 'today')) {
    head.push(sections[i]); i++
    if (isHeroLike(sections[i - 1])) break
  }
  while (i < sections.length && sections[i].type === 'today') head.push(sections[i++])
  const tail = sections.slice(i).filter((s) => s.type === 'footer')
  const middle = sections.slice(i).filter((s) => s.type !== 'footer')
  // Group each visible section with the empty ones just before it.
  const groups: { lead: Sec | null; items: Sec[] }[] = []
  let pending: Sec[] = []
  for (const s of middle) {
    if (showsContent(s)) { groups.push({ lead: s, items: [...pending, s] }); pending = [] } else pending.push(s)
  }
  const out: Sec[] = []
  const queue = [...groups]
  let prevPlain = head.length > 0 && !showsImage(head[head.length - 1])
  while (queue.length) {
    let k = 0
    if (prevPlain && !showsImage(queue[0].lead!)) {
      const j = queue.findIndex((g) => showsImage(g.lead!))
      // Pull the next photo section forward, but only if another photo-less one follows it
      // (otherwise moving it gains nothing).
      if (j > 0) k = j
    }
    const [g] = queue.splice(k, 1)
    out.push(...g.items)
    prevPlain = !showsImage(g.lead!)
  }
  return [...head, ...out, ...pending, ...tail]
}

/** Keep at most one full-bleed moment besides the hero: extra image bands become solid, extra filmstrips a grid. */
export function limitFullBleed(sections: Sec[]): Sec[] {
  let seen = false
  return sections.map((s) => {
    if (!FULL_BLEED(s) || !showsContent(s)) return s
    if (!seen) { seen = true; return s }
    if (s.type === 'cta_band') return { ...s, variant: 'solid' } as Sec
    if (s.type === 'gallery') return { ...s, variant: 'grid' } as Sec
    return s
  })
}

/** Up to 8 short phrases for the ticker: the site's own service and menu names, never invented. */
export function tickerPhrases(content: SiteDocContent): string[] {
  const out: string[] = []
  for (const p of content.pages) for (const s of p.sections) {
    if (s.type === 'services') for (const i of s.props.items) out.push(i.title)
  }
  return [...new Set(out.map((t) => t.trim()).filter((t) => t && t.length <= 40 && !PH.test(t)))].slice(0, 8)
}

const uniqueId = (taken: Set<string>, base: string) => { let id = base; let n = 2; while (taken.has(id)) id = `${base}-${n++}`; taken.add(id); return id }

export function composeHome(kit: KitDefinition, content: SiteDocContent, ctx: TemplateContext): SiteDocContent {
  const out = structuredClone(content)
  const home = out.pages.find((p) => p.slug === '') ?? out.pages[0]
  const ids = new Set(home.sections.map((s) => s.id))
  let sections = [...home.sections]

  // 1. Cinematic hero.
  const heroAt = sections.findIndex((s) => s.type === 'hero')
  if (heroAt >= 0) sections[heroAt] = { ...sections[heroAt], variant: 'cinematic' } as Sec
  // 2. Ticker and feature rows right after the hero (and today's update).
  let at = Math.max(heroAt, sections.findIndex((s) => s.type === 'today')) + 1
  const phrases = tickerPhrases(out)
  const added: Sec[] = []
  if (phrases.length >= 3 && !sections.some((s) => s.type === 'ticker')) added.push({ id: uniqueId(ids, 'ticker'), type: 'ticker', variant: 'marquee', hidden: false, props: { label: 'What we do', items: phrases } } as Sec)
  if (!sections.some((s) => s.type === 'feature_rows')) added.push({ id: uniqueId(ids, 'features'), type: 'feature_rows', variant: 'alternating', hidden: false, props: { heading: 'What makes us *different*', items: [] } } as Sec)
  sections.splice(at, 0, ...added)
  at += added.length
  // 3. Stats (owner fills) before a big quote.
  const quoteAt = sections.findIndex((s) => s.type === 'testimonials')
  if (quoteAt >= 0) sections[quoteAt] = { ...sections[quoteAt], variant: 'big-quote' } as Sec
  if (!sections.some((s) => s.type === 'stats')) {
    const stats = { id: uniqueId(ids, 'stats'), type: 'stats', variant: 'band', hidden: false, props: { heading: 'By the *numbers*', items: [] } } as Sec
    sections.splice(quoteAt >= 0 ? quoteAt : sections.length - 1, 0, stats)
  }
  // 4. Mosaic gallery; 5. image CTA with a photo (the owner's, else the kit's own).
  const photo = ctx.gallery?.[1] ?? ctx.gallery?.[0] ?? (() => { const s = offeredSamples(kit)[1] ?? offeredSamples(kit)[0]; return s ? { assetId: s.assetId, alt: s.alt } : undefined })()
  sections = sections.map((s) => {
    if (s.type === 'gallery') return { ...s, variant: 'mosaic' } as Sec
    if (s.type === 'cta_band' && photo) return { ...s, variant: 'image', props: { ...s.props, image: photo } } as Sec
    return s
  })
  // A Home CTA last before the footer, so the page ends on its one full-bleed moment.
  const ctaAt = sections.findIndex((s) => s.type === 'cta_band')
  const footerAt = sections.findIndex((s) => s.type === 'footer')
  if (ctaAt >= 0 && footerAt > ctaAt + 1) { const [cta] = sections.splice(ctaAt, 1); sections.splice(sections.findIndex((s) => s.type === 'footer'), 0, cta) }

  home.sections = limitFullBleed(arrangeRhythm(sections))
  // 6. Statement footer on every page.
  for (const p of out.pages) p.sections = p.sections.map((s) => (s.type === 'footer' ? { ...s, variant: 'statement' } as Sec : s))
  for (const p of out.pages) if (p !== home) p.sections = limitFullBleed(p.sections)
  void CHROME
  return out
}
