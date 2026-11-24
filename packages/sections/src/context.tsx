import type { ReactNode } from 'react'
import type { Day, LinkTarget, Page, RichText, SiteDoc } from '@yakini/site-schema'

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
}

export const PLACEHOLDER_RE = /\[\[([^\]]{1,200})\]\]/g

export function hasPlaceholder(text: string): boolean {
  PLACEHOLDER_RE.lastIndex = 0
  return PLACEHOLDER_RE.test(text)
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
    if (ctx.mode !== 'draft' && (!section || liveSectionEmpty(ctx.doc, section, Boolean(ctx.today)))) {
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

/** A dashed "add this" hint, shown only in the draft preview for an empty section. */
export function DraftHint({ ctx, children }: { ctx: RenderContext; children: string }) {
  if (ctx.mode !== 'draft') return null
  return <p className="ys-hint"><Txt>{`[[${children}]]`}</Txt></p>
}
