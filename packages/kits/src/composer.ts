import type { ImageRef, Page, Section, SiteDocContent } from '@yakini/site-schema'
import type { KitDefinition, TemplateContext } from './types'

/**
 * Layout composer (design D2): the rhythm every new draft is built with, for every kit.
 *
 * Home: cinematic hero → ticker → feature rows (or the kit's own highlight) → stats and a big
 * quote → mosaic gallery → image CTA → statement footer. A section with nothing in it is not shown
 * (D1), so an owner who hasn't added feature rows or numbers yet simply doesn't see them.
 *
 * Rhythm rules, on what a visitor actually sees:
 * 1. Never two photo-less sections in a row, when the page has a photo section that can go between
 *    them or a call-to-action band that can carry a photo. (The ticker is a thin band under the
 *    hero, not a section, so it doesn't count.)
 * 2. At most one full-bleed moment besides the hero on any page; Home has exactly one (the image
 *    call-to-action) whenever there is a photo for it.
 * 3. Neighbouring sections alternate surface depth; that is done when the page is drawn (SiteView).
 *
 * Nothing is invented: feature rows and stats start empty for the owner to fill, the ticker only
 * repeats the site's own service names, and photos are the owner's or the kit's licensed samples.
 */
type Sec = Section
const PH = /\[\[[^\]]*\]\]/
const text = (s: string) => Boolean(s.trim()) && !PH.test(s)

const FULL_BLEED = (s: Sec) => (s.type === 'cta_band' && s.variant === 'image') || (s.type === 'gallery' && s.variant === 'filmstrip')
/** Chrome and bands that sit outside the section rhythm. */
const OUTSIDE_RHYTHM = new Set(['header', 'footer', 'today', 'ticker'])

/** True when the section shows a photo with this content. */
export function showsImage(s: Sec): boolean {
  switch (s.type) {
    case 'hero': return Boolean(s.props.image) || (s.props.images?.length ?? 0) > 0
    case 'about': return Boolean(s.props.image)
    case 'cta_band': return s.variant === 'image' && Boolean(s.props.image)
    case 'gallery': return s.props.images.length > 0
    case 'feature_rows': return s.props.items.some((i) => i.image)
    case 'menu': return s.props.categories.some((c) => c.items.some((i) => i.image))
    case 'team': return s.props.members.some((m) => m.photo)
    default: return false
  }
}

/** True when a visitor would see the section (mirrors the renderer's empty rules for rhythm purposes). */
export function showsContent(s: Sec): boolean {
  if (s.hidden) return false
  switch (s.type) {
    case 'gallery': return s.props.images.length > 0
    case 'testimonials': return s.props.items.length > 0
    case 'services': return s.props.items.length > 0
    case 'faq': return s.props.items.length > 0
    case 'stats': return s.props.items.length >= 2
    case 'feature_rows': return s.props.items.length > 0
    case 'ticker': return s.props.items.length >= 3
    case 'team': return s.props.members.length > 0
    case 'menu': return s.props.categories.some((c) => c.items.length > 0)
    case 'schedule': return s.props.stops.length > 0
    case 'about': return Boolean(s.props.image) || s.props.body.some((b) => b.children.some((c) => text(c.text)))
    case 'today': return false
    default: return true
  }
}

/** The visible sections that take part in the rhythm, in page order. */
export const rhythmSections = (sections: Sec[]) => sections.filter((s) => !OUTSIDE_RHYTHM.has(s.type) && showsContent(s))

/** Pairs of neighbouring visible sections that both have no photo. */
export function plainNeighbours(sections: Sec[]): [string, string][] {
  const seen = rhythmSections(sections)
  const out: [string, string][] = []
  for (let i = 1; i < seen.length; i++) if (!showsImage(seen[i - 1]) && !showsImage(seen[i])) out.push([seen[i - 1].id, seen[i].id])
  return out
}

/** How many neighbouring photo-less pairs a run of visible sections has (by kind only). */
const pairsOf = (kinds: boolean[]) => kinds.reduce((n, img, i) => n + (i > 0 && !img && !kinds[i - 1] ? 1 : 0), 0)

/**
 * Reorder a page so as few photo-less sections touch as possible (rule 1), moving as little as
 * possible: the page keeps its order whenever that is already as good as it gets; otherwise its
 * middle sections are dealt out alternately, photo-less and photo, each kind in its own order.
 * The header, the first hero with the bands under it, and everything from `tailFrom` on (the
 * footer, and on Home the closing image band) stay where they are. A hidden or empty section
 * keeps its place in front of the section that followed it.
 */
export function arrangeRhythm(sections: Sec[], tailFrom: (s: Sec) => boolean = (s) => s.type === 'footer'): Sec[] {
  let i = 0
  let heroSeen = false
  while (i < sections.length && !tailFrom(sections[i]) && (OUTSIDE_RHYTHM.has(sections[i].type) || (sections[i].type === 'hero' && !heroSeen))) {
    if (sections[i].type === 'hero') heroSeen = true
    i++
  }
  const head = sections.slice(0, i)
  const rest = sections.slice(i)
  const t = rest.findIndex(tailFrom)
  const middle = t < 0 ? rest : rest.slice(0, t)
  const tail = t < 0 ? [] : rest.slice(t)
  const groups: { lead: Sec; items: Sec[] }[] = []
  let pending: Sec[] = []
  for (const s of middle) {
    if (showsContent(s) && !OUTSIDE_RHYTHM.has(s.type)) { groups.push({ lead: s, items: [...pending, s] }); pending = [] } else pending.push(s)
  }
  const kinds = (gs: typeof groups) => [...rhythmSections(head), ...gs.map((g) => g.lead), ...rhythmSections(tail)].map(showsImage)
  const plain = groups.filter((g) => !showsImage(g.lead))
  const photo = groups.filter((g) => showsImage(g.lead))
  const dealt = (photoFirst: boolean) => {
    const out: typeof groups = []
    const [a, b] = photoFirst ? [[...photo], [...plain]] : [[...plain], [...photo]]
    while (a.length || b.length) { if (a.length) out.push(a.shift()!); if (b.length) out.push(b.shift()!) }
    return out
  }
  let best = groups
  for (const cand of [dealt(false), dealt(true)]) if (pairsOf(kinds(cand)) < pairsOf(kinds(best))) best = cand
  return [...head, ...best.flatMap((g) => g.items), ...pending, ...tail]
}

/** Keep at most one full-bleed moment besides the hero: extra image bands go solid, extra filmstrips become a grid. */
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

/** Up to 8 short phrases for the ticker: the site's own service names, never invented. */
export function tickerPhrases(content: SiteDocContent): string[] {
  const out: string[] = []
  for (const p of content.pages) for (const s of p.sections) if (s.type === 'services') for (const i of s.props.items) out.push(i.title)
  return [...new Set(out.map((t) => t.trim()).filter((t) => text(t) && t.length <= 40))].slice(0, 8)
}

const uniqueId = (taken: Set<string>, base: string) => { let id = base; let n = 2; while (taken.has(id)) id = `${base}-${n++}`; taken.add(id); return id }

/**
 * Photos a page may borrow: the owner's own photos first, else photos the draft already uses
 * somewhere other than a hero (so they fit this business; a general-kit draft for an industry with
 * no fitting photo has none). Never a random sample.
 */
function photoPool(content: SiteDocContent, ctx: Pick<TemplateContext, 'gallery'>): ImageRef[] {
  if (ctx.gallery?.length) return ctx.gallery
  const heroIds = new Set(content.pages.flatMap((p) => p.sections).map((s) => (s.type === 'hero' ? s.props.image?.assetId : undefined)))
  const used = new Map<string, ImageRef>()
  for (const p of content.pages) for (const s of p.sections) {
    const imgs = s.type === 'about' ? [s.props.image] : s.type === 'gallery' ? s.props.images : s.type === 'feature_rows' ? s.props.items.map((i) => i.image) : s.type === 'cta_band' ? [s.props.image] : []
    for (const img of imgs) if (img && !heroIds.has(img.assetId)) used.set(img.assetId, img)
  }
  return [...used.values()]
}

const imagesOn = (sections: Sec[]) => new Set(sections.flatMap((s) => {
  const p = s.props as { image?: ImageRef; images?: ImageRef[] }
  return [p.image?.assetId, ...(p.images ?? []).map((i) => i.assetId)].filter(Boolean) as string[]
}))

/**
 * When two photo-less sections still touch, give the page a photo where one fits, without
 * inventing anything: its call-to-action band becomes an image band (its one full-bleed moment);
 * a text-only about section takes a photo beside it; a text-only hero takes a photo. Photos come
 * from the pool, preferring ones not already on the page. `arrange` re-orders after each change
 * (Home); other pages keep the order their kit gave them (hero, steps, questions, form…).
 */
function photoWhereNeeded(sections: Sec[], pool: ImageRef[], seed: number, arrange: (s: Sec[]) => Sec[] = (s) => s): Sec[] {
  let out = sections
  for (let guard = 0; guard < 6 && pool.length && plainNeighbours(out).length; guard++) {
    const onPage = imagesOn(out)
    const fresh = pool.filter((p) => !onPage.has(p.assetId))
    const photo = (fresh.length ? fresh : pool)[(seed + guard) % (fresh.length || pool.length)]
    const before = plainNeighbours(out).length
    const tries: Sec[][] = []
    const withPhoto = (i: number, change: (x: Sec) => Sec) => { const next = [...out]; next[i] = change(next[i]); tries.push(arrange(next)) }
    const cta = out.findIndex((s) => s.type === 'cta_band' && showsContent(s) && !showsImage(s))
    if (cta >= 0 && !out.some((s) => FULL_BLEED(s) && showsContent(s))) withPhoto(cta, (x) => ({ ...x, variant: 'image', props: { ...x.props, image: (x.props as { image?: ImageRef }).image ?? photo } }) as Sec)
    out.forEach((s, i) => { if (s.type === 'about' && showsContent(s) && !s.props.image) withPhoto(i, (x) => ({ ...x, variant: 'left-image', props: { ...x.props, image: photo } }) as Sec) })
    out.forEach((s, i) => { if (s.type === 'hero' && showsContent(s) && !s.props.image) withPhoto(i, (x) => ({ ...x, variant: 'split', props: { ...x.props, image: photo } }) as Sec) })
    const better = tries.find((t) => plainNeighbours(t).length < before)
    if (!better) break
    out = better
  }
  return out
}

export function composeHome(kit: KitDefinition, content: SiteDocContent, ctx: Pick<TemplateContext, 'gallery'> = {}): SiteDocContent {
  const out = structuredClone(content)
  const homeAt = Math.max(0, out.pages.findIndex((p) => p.slug === ''))
  const home = out.pages[homeAt]
  const ids = new Set(out.pages.flatMap((p) => p.sections.map((s) => s.id)))
  const of = <T extends Sec['type']>(t: T) => home.sections.filter((s) => s.type === t) as Extract<Sec, { type: T }>[]

  const header = of('header')
  // Cinematic needs a photo; a text-only hero keeps its own look.
  const hero = of('hero').slice(0, 1).map((s) => (s.props.image ? { ...s, variant: 'cinematic' } : s) as Sec)
  const today = of('today')
  const ticker: Sec[] = of('ticker')
  const phrases = tickerPhrases(out)
  if (!ticker.length && phrases.length >= 3) ticker.push({ id: uniqueId(ids, 'ticker'), type: 'ticker', variant: 'marquee', hidden: false, props: { label: 'What we do', items: phrases } })
  const features: Sec[] = of('feature_rows')
  if (!features.length) features.push({ id: uniqueId(ids, 'features'), type: 'feature_rows', variant: 'alternating', hidden: false, props: { heading: 'What sets us *apart*', items: [] } })
  const stats: Sec[] = of('stats')
  if (!stats.length) stats.push({ id: uniqueId(ids, 'stats'), type: 'stats', variant: 'band', hidden: false, props: { heading: 'By the *numbers*', items: [] } })
  const quotes = of('testimonials').map((s) => ({ ...s, variant: 'big-quote' }) as Sec)
  const gallery = of('gallery').map((s) => ({ ...s, variant: 'mosaic' }) as Sec)
  const pool = photoPool(content, ctx)
  const photo = pool[0]
  const cta = of('cta_band').slice(0, 1).map((s) => (photo ? { ...s, variant: 'image', props: { ...s.props, image: s.props.image ?? photo } } : s) as Sec)
  const footer = of('footer')
  const placed = new Set([...header, ...hero, ...today, ...ticker, ...features, ...stats, ...quotes, ...gallery, ...cta, ...footer].map((s) => s.id))
  // The kit's own highlights (schedule, menu, services, about, hours…) keep their order, where
  // feature rows would be until the owner adds some.
  const highlights = home.sections.filter((s) => !placed.has(s.id) && !(s.type === 'cta_band'))
  const extraCtas = home.sections.filter((s) => s.type === 'cta_band' && !placed.has(s.id))

  // The closing image band stays last, so Home ends on its one full-bleed moment.
  const closing = new Set([...cta, ...footer].map((s) => s.id))
  // Empty feature rows and stats aren't seen, so they don't take part in the rhythm: they wait in
  // their own slots (feature rows under the hero bands, stats just before the quote) for the owner.
  const waiting = new Set([...features, ...stats].filter((s) => !showsContent(s)).map((s) => s.id))
  const slot = (secs: Sec[]) => {
    const rest = secs.filter((s) => !waiting.has(s.id))
    const f = features.filter((s) => waiting.has(s.id))
    const st = stats.filter((s) => waiting.has(s.id))
    let at = 0
    while (at < rest.length && ['header', 'hero', 'today', 'ticker'].includes(rest[at].type) && !(rest[at].type === 'hero' && rest.slice(0, at).some((x) => x.type === 'hero'))) at++
    rest.splice(at, 0, ...f)
    const q = rest.findIndex((s) => s.type === 'testimonials' || s.type === 'gallery' || closing.has(s.id))
    rest.splice(q < 0 ? rest.length : q, 0, ...st)
    return rest
  }
  const arrange = (secs: Sec[]) => slot(limitFullBleed(arrangeRhythm(secs, (s) => closing.has(s.id))))
  home.sections = photoWhereNeeded(arrange([
    ...header, ...hero, ...today, ...ticker, ...features, ...highlights, ...extraCtas, ...stats, ...quotes, ...gallery, ...cta, ...footer,
  ]), pool, 1, arrange)

  out.pages = out.pages.map((p, i) => {
    const page = { ...p, sections: p.sections.map((s) => (s.type === 'footer' ? ({ ...s, variant: 'statement' } as Sec) : s)) }
    return i === homeAt ? page : { ...page, sections: photoWhereNeeded(limitFullBleed(page.sections), pool, i) }
  })
  return out
}
