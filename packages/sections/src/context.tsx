import type { ReactNode } from 'react'
import { preload } from 'react-dom'
import { splitAccent, type Day, type LinkTarget, type Page, type RichText, type SiteDoc } from '@yakini/site-schema'

/**
 * Where a render is going:
 * - `draft`: the private draft preview. Empty sections show a dashed "add this" hint and forms
 *   show a note instead of submitting.
 * - `live`: a published site. Empty sections render nothing.
 * - `export`: ready-to-host pages for "Download my site" (Phase 4). No Report or Site by Yakini link.
 */
export type RenderMode = 'draft' | 'live' | 'export'

export type ResolvedImage = {
  src: string
  srcSet?: string
  width: number
  height: number
  /** Better formats offered first (e.g. WebP); `src` stays the file every browser can show. */
  sources?: readonly { type: 'image/webp' | 'image/avif'; srcSet: string }[]
}

/** The active Today update (spec 11.5). Phase 1 never has one; Phase 6 fills it in. */
export type TodayUpdate = { kind: string; headline: string; lines: string[] } | null

export type RenderContext = {
  doc: SiteDoc
  page: Page
  mode: RenderMode
  /** URL of a page of this site, e.g. `/d/<id>/menu` in a draft or `/menu` on a live host. */
  hrefForPage: (page: Page) => string
  /** Resolve an asset id to a URL, or null when it is not available (the image is skipped). */
  image: (assetId: string) => ResolvedImage | null
  /** Where a site form posts. Null means forms cannot submit here (drafts, Phase 1). */
  formAction: (formKey: string) => string | null
  /** Signed "form shown at" value for live forms (spam check, spec 11.3). */
  formStamp?: string | null
  /** The "Report this site" link (7.3), or null where it is not shown. */
  reportUrl: string | null
  today: TodayUpdate
  /**
   * True only in the editor canvas: [[fill this in]] spots show as ghost text and empty sections
   * stay visible to click on. Everywhere else (the draft preview, share previews, the live site)
   * a site never shows a placeholder or an empty section (D1 step 5).
   */
  editing?: boolean
}

/** Whether empty sections and their "add this" hints are shown: only while editing a draft. */
export const showEmpty = (ctx: RenderContext) => ctx.mode === 'draft' && ctx.editing === true

export const PLACEHOLDER_RE = /\[\[([^\]]{1,200})\]\]/g

export function hasPlaceholder(text: string): boolean {
  PLACEHOLDER_RE.lastIndex = 0
  return PLACEHOLDER_RE.test(text)
}

/** Text with every [[placeholder]] removed (what a visitor sees). */
export function stripPlaceholders(text: string): string {
  if (!text.includes('[[')) return text // untouched: spacing between rich-text runs matters
  return text.replace(PLACEHOLDER_RE, '').replace(/[ \t]{2,}/g, ' ').trim()
}

export function richTextHasWords(value: RichText): boolean {
  return value.some((b) => b.children.some((c) => c.text.trim().length > 0))
}

/** Keys that make a list item worth showing: without them the item is dropped from a preview. */
const ITEM_KEYS = ['title', 'name', 'q', 'quote'] as const

function strip(value: unknown): unknown {
  if (typeof value === 'string') return stripPlaceholders(value)
  if (Array.isArray(value)) {
    const out = value.map(strip)
    // Rich text: drop empty runs, then empty blocks.
    if (out.every((b) => b && typeof b === 'object' && 'type' in (b as object) && Array.isArray((b as { children?: unknown }).children))) {
      return (out as { children: { text: string }[] }[])
        .map((b) => ({ ...b, children: b.children.filter((c) => c.text.length > 0) }))
        .filter((b) => b.children.length > 0)
    }
    // Lists (services, FAQ, reviews, team, menu items): drop items whose main text was only a placeholder.
    return out.filter((item) => {
      if (!item || typeof item !== 'object') return true
      const o = item as Record<string, unknown>
      if (ITEM_KEYS.some((k) => k in o && o[k] === '')) return false
      if ('q' in o && Array.isArray(o.a) && o.a.length === 0) return false
      return true
    })
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, strip(v)]))
  }
  return value
}

/**
 * The site as a visitor sees it (D1 step 5): every [[placeholder]] removed from section content
 * and business details, list items with nothing real in them dropped. Sections left with nothing
 * to show are then hidden by each section's own empty rule. Render-only: never stored.
 */
export function withoutPlaceholders(doc: SiteDoc): SiteDoc {
  return {
    ...doc,
    business: strip(doc.business) as SiteDoc['business'],
    nav: strip(doc.nav) as SiteDoc['nav'],
    footer: strip(doc.footer) as SiteDoc['footer'],
    pages: doc.pages.map((p) => ({ ...p, sections: p.sections.map((sec) => ({ ...sec, props: strip(sec.props) }) as typeof sec) })),
  }
}

/** Text with [[placeholders]] shown as highlighted prompts for the owner. Always escaped by React. */
export function Txt({ children }: { children: string }): ReactNode {
  if (!children.includes('[[')) return children
  const out: ReactNode[] = []
  let last = 0
  for (const m of children.matchAll(PLACEHOLDER_RE)) {
    if (m.index! > last) out.push(children.slice(last, m.index))
    out.push(<mark key={m.index} className="ys-ph">{m[1]}</mark>)
    last = m.index! + m[0].length
  }
  if (last < children.length) out.push(children.slice(last))
  return out
}

/**
 * A headline or heading: the one `*accent*` phrase (design v2) as <em class="ys-accent">, the rest
 * as plain text (placeholders still shown in drafts by Txt).
 */
export function HeadTxt({ children }: { children: string }): ReactNode {
  const parts = splitAccent(children)
  if (!parts) return <Txt>{children}</Txt>
  const before = glueShortWords(parts.before), accent = glueShortWords(parts.accent), after = glueShortWords(parts.after)
  return <>{before ? <Txt>{before}</Txt> : null}<em className="ys-accent"><Txt>{accent}</Txt></em>{after ? <Txt>{after}</Txt> : null}</>
}

/**
 * Headline typesetting for accented headlines (design v2): a one- or two-letter word ("in", "a",
 * "to") is kept with the word after it by a no-break space, so it never hangs alone at the end of a
 * line. Besides reading better, this keeps balanced headlines breaking in the same place whether
 * the web font or its fallback is showing, so nothing moves when the font arrives (CLS). Only
 * accented headlines (never in an old site), so classic pages keep their exact markup.
 */
export function glueShortWords(s: string): string {
  if (!s || s.includes('[[')) return s
  return s.replace(/(^|[\s\u00A0])([^\s\u00A0]{1,2}) (?=\S)/g, '$1$2\u00A0').replace(/(^|[\s\u00A0])([^\s\u00A0]{1,2}) (?=\S)/g, '$1$2\u00A0')
}

export function pageById(doc: SiteDoc, id: string): Page | undefined {
  return doc.pages.find((p) => p.id === id)
}

/** First form section in the site (booking falls back to it until portal booking ships). */
export function firstForm(doc: SiteDoc): { page: Page; sectionId: string } | null {
  for (const page of doc.pages) for (const s of page.sections) {
    if ((s.type === 'contact_form' || s.type === 'catering_request') && !s.hidden) return { page, sectionId: s.id }
  }
  return null
}

function formSection(doc: SiteDoc, formKey: string): { page: Page; sectionId: string } | null {
  for (const page of doc.pages) for (const s of page.sections) {
    if ((s.type === 'contact_form' || s.type === 'catering_request') && s.props.formKey === formKey) return { page, sectionId: s.id }
  }
  return null
}

function bookingSection(doc: SiteDoc): { page: Page; sectionId: string } | null {
  for (const page of doc.pages) for (const s of page.sections) if (s.type === 'booking' && !s.hidden) return { page, sectionId: s.id }
  return firstForm(doc)
}

export type ResolvedLink = { href: string; external: boolean }

/** Turn a LinkTarget into an href. Unsafe or dangling links resolve to null and are not rendered. */
/**
 * True when a section shows nothing on a live site (hidden, or nothing filled in yet), mirroring
 * each section's own empty rule. Links to such a section go to its page instead of a dead anchor,
 * and the publish checklist flags them (spec 11.1 item 5).
 */
export function liveSectionEmpty(doc: SiteDoc, s: Page['sections'][number], hasToday = false): boolean {
  if (s.hidden) return true
  const b = doc.business
  switch (s.type) {
    case 'about': return !s.props.image && !richTextHasWords(s.props.body)
    case 'services': case 'testimonials': case 'faq': return s.props.items.length === 0
    case 'menu': return !s.props.categories.some((c) => c.items.length > 0)
    case 'schedule': return s.props.stops.length === 0
    case 'gallery': return s.props.images.length === 0
    case 'team': return s.props.members.length === 0
    case 'hours_location': return !((b.hours?.length ?? 0) > 0 || b.address || b.phone || b.serviceArea)
    case 'today': return !hasToday && (s.props.emptyBehavior === 'hide' || !s.props.emptyText)
    default: return false
  }
}

export function resolveLink(ctx: RenderContext, link: LinkTarget): ResolvedLink | null {
  const at = (target: { page: Page; sectionId: string } | null) => {
    if (!target) return null
    const section = target.page.sections.find((x) => x.id === target.sectionId)
    const pageHref = target.page.id === ctx.page.id ? '' : ctx.hrefForPage(target.page)
    // Outside the editor an empty section isn't drawn, so a link to it goes to its page instead.
    if (!showEmpty(ctx) && (!section || liveSectionEmpty(ctx.doc, section, Boolean(ctx.today)))) {
      return { href: pageHref || ctx.hrefForPage(target.page), external: false }
    }
    return { href: `${pageHref}#${target.sectionId}`, external: false }
  }
  switch (link.kind) {
    case 'page': {
      const p = pageById(ctx.doc, link.pageId)
      return p ? { href: ctx.hrefForPage(p), external: false } : null
    }
    case 'section': {
      const p = pageById(ctx.doc, link.pageId)
      return p ? at({ page: p, sectionId: link.sectionId }) : null
    }
    case 'url': {
      try {
        const u = new URL(link.url)
        return u.protocol === 'https:' ? { href: u.toString(), external: true } : null
      } catch { return null }
    }
    case 'tel': return /^\+[1-9]\d{6,14}$/.test(link.phone) ? { href: `tel:${link.phone}`, external: false } : null
    case 'mailto': return { href: `mailto:${link.email}`, external: false }
    case 'booking': return at(bookingSection(ctx.doc))
    case 'form': return at(formSection(ctx.doc, link.formKey))
  }
}

export function Link({ ctx, to, className, children }: { ctx: RenderContext; to: LinkTarget; className?: string; children: ReactNode }) {
  const r = resolveLink(ctx, to)
  if (!r) return null
  return r.external
    ? <a className={className} href={r.href} rel="noopener noreferrer">{children}</a>
    : <a className={className} href={r.href}>{children}</a>
}

export function RichTextView({ ctx, value }: { ctx: RenderContext; value: RichText }) {
  return (
    <>
      {value.map((block, i) => {
        const runs = block.children.map((c, j) => {
          let node: ReactNode = <Txt>{c.text}</Txt>
          if (c.bold) node = <strong>{node}</strong>
          if (c.italic) node = <em>{node}</em>
          if (c.link) {
            const r = resolveLink(ctx, c.link)
            if (r) node = r.external ? <a href={r.href} rel="noopener noreferrer">{node}</a> : <a href={r.href}>{node}</a>
          }
          return <span key={j}>{node}</span>
        })
        if (block.type === 'h3') return <h3 key={i}>{runs}</h3>
        if (block.type === 'ul') return <ul key={i}>{runs.map((r, j) => <li key={j}>{r}</li>)}</ul>
        return <p key={i}>{runs}</p>
      })}
    </>
  )
}

export function Img({ ctx, image, className, sizes, priority }: {
  ctx: RenderContext
  image: { assetId: string; alt: string; focal?: { x: number; y: number } }
  className?: string
  sizes?: string
  priority?: boolean
}) {
  const r = ctx.image(image.assetId)
  if (!r) return null
  // The first image on a page is usually the largest thing on screen: start it with the HTML
  // (a <link rel="preload"> in the head) instead of after the CSS. Not in exports (no head there).
  if (priority && ctx.mode !== 'export') {
    const best = r.sources?.[0]
    if (best) preload(r.src, { as: 'image', imageSrcSet: best.srcSet, imageSizes: sizes ?? '100vw', type: best.type, fetchPriority: 'high' })
    else preload(r.src, { as: 'image', ...(r.srcSet ? { imageSrcSet: r.srcSet, imageSizes: sizes ?? '100vw' } : {}), fetchPriority: 'high' })
  }
  const style = image.focal ? { objectPosition: `${Math.round(image.focal.x * 100)}% ${Math.round(image.focal.y * 100)}%` } : undefined
  const img = (
    // eslint-disable-next-line @next/next/no-img-element -- the same markup must work in exports and client runtimes
    <img
      className={className}
      src={r.src}
      srcSet={r.srcSet}
      sizes={r.srcSet ? sizes : undefined}
      width={r.width}
      height={r.height}
      alt={image.alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      style={style}
    />
  )
  if (!r.sources?.length) return img
  // <picture> is laid out as if absent (display: contents), so every img style and selector still applies.
  return (
    <picture className="ys-pic">
      {r.sources.map((s) => <source key={s.type} type={s.type} srcSet={s.srcSet} sizes={sizes ?? '100vw'} />)}
      {img}
    </picture>
  )
}

export const DAY_NAMES: Record<Day, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
}
export const DAY_ORDER: Day[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

/** "17:30" → "5:30 PM", "12:00" → "12 PM", "00:00" → "12 AM". */
export function time12(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const suffix = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${h12} ${suffix}` : `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}

export function timeRange(a: string, b: string): string {
  return `${time12(a)} to ${time12(b)}`
}

/** "+15055550142" → "(505) 555-0142" for US numbers; other numbers are shown as stored. */
export function formatPhone(e164: string): string {
  const m = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(e164)
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : e164
}

/** An "add this" hint for an empty section, shown only while editing (never in a preview). */
export function DraftHint({ ctx, children }: { ctx: RenderContext; children: string }) {
  if (!showEmpty(ctx)) return null
  return <p className="ys-hint"><Txt>{`[[${children}]]`}</Txt></p>
}
