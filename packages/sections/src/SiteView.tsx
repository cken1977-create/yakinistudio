import type { CSSProperties, ReactNode } from 'react'
import { plainText, type Section, type SiteDoc } from '@yakini/site-schema'
import { liveSectionEmpty, withoutPlaceholders, type RenderContext } from './context'
import { FooterSection, HeaderSection } from './sections/chrome'
import {
  AboutSection, CtaBandSection, FaqSection, GallerySection, HeroSection, MenuSection, ScheduleSection, ServicesSection,
  TeamSection, TestimonialsSection, TodaySection,
} from './sections/content'
import { BookingSection, CateringRequestSection, ContactFormSection } from './sections/forms'
import { FeatureRowsSection, StatsSection, TickerSection } from './sections/d2'
import { HoursLocationSection } from './sections/hours'
import { themeFor } from './theme'

function renderSection(ctx: RenderContext, s: Section, first: boolean): ReactNode {
  switch (s.type) {
    case 'header': return <HeaderSection ctx={ctx} s={s} />
    case 'hero': return <HeroSection ctx={ctx} s={s} first={first} />
    case 'about': return <AboutSection ctx={ctx} s={s} first={first} />
    case 'services': return <ServicesSection ctx={ctx} s={s} first={first} />
    case 'menu': return <MenuSection ctx={ctx} s={s} first={first} />
    case 'schedule': return <ScheduleSection ctx={ctx} s={s} first={first} />
    case 'gallery': return <GallerySection ctx={ctx} s={s} first={first} />
    case 'hours_location': return <HoursLocationSection ctx={ctx} s={s} first={first} />
    case 'testimonials': return <TestimonialsSection ctx={ctx} s={s} first={first} />
    case 'faq': return <FaqSection ctx={ctx} s={s} first={first} />
    case 'team': return <TeamSection ctx={ctx} s={s} first={first} />
    case 'cta_band': return <CtaBandSection ctx={ctx} s={s} first={first} />
    case 'contact_form': return <ContactFormSection ctx={ctx} s={s} first={first} />
    case 'booking': return <BookingSection ctx={ctx} s={s} first={first} />
    case 'catering_request': return <CateringRequestSection ctx={ctx} s={s} first={first} />
    case 'today': return <TodaySection ctx={ctx} s={s} first={false} />
    case 'footer': return <FooterSection ctx={ctx} s={s} />
    case 'ticker': return <TickerSection ctx={ctx} s={s} />
    case 'stats': return <StatsSection ctx={ctx} s={s} first={first} />
    case 'feature_rows': return <FeatureRowsSection ctx={ctx} s={s} first={first} />
  }
}

const NOT_MAIN = new Set(['header', 'footer', 'today'])

/**
 * One page of a client site (spec 7.3). Pure server rendering: every section reads correctly with
 * JavaScript off, and nothing loads from outside the site (no scripts, fonts, iframes or embeds).
 */
const OWN_BACKDROP = new Set<Section['type']>(['hero', 'ticker', 'cta_band', 'today'])

export function SiteView({ ctx: given }: { ctx: RenderContext }) {
  // A visitor never sees a placeholder: outside the editor the doc is rendered without them (D1 step 5).
  const ctx = given.editing ? given : visitorView(given)
  const style = ctx.doc.style
  const { vars } = themeFor(ctx.doc.brand, style.fontPair, style)
  // Outside the editor a section with nothing to show is left out entirely, so the page's one h1
  // always lands on a section a visitor can see.
  const sections = ctx.page.sections.filter((s) => !s.hidden && (given.editing || NOT_MAIN.has(s.type) || !liveSectionEmpty(ctx.doc, s, Boolean(ctx.today))))
  const firstMain = sections.findIndex((s) => !NOT_MAIN.has(s.type))
  const header = sections.filter((s) => s.type === 'header')
  const footer = sections.filter((s) => s.type === 'footer')
  const body = sections.filter((s) => s.type !== 'header' && s.type !== 'footer')
  // In a draft each section is marked so the editor can select it with a click; live pages carry no ids.
  const mark = (s: Section) => (ctx.mode === 'draft' ? { 'data-ys-section': s.id } : {})
  // Rhythm rule 3 (design D2): neighbouring sections alternate surface depth on the design-v2
  // looks, so two text sections that sit together still read as two. Sections with their own
  // backdrop (hero, ticker, call-to-action bands, today's update) don't take part. Classic keeps
  // its markup exactly (plan 7.4).
  const raised = new Set<string>()
  if (style.preset !== 'classic') {
    let n = 0
    for (const s of body) if (!OWN_BACKDROP.has(s.type)) { if (n % 2 === 1) raised.add(s.id); n++ }
  }
  const depth = (s: Section) => (raised.has(s.id) ? { 'data-depth': 'raised' } : {})
  return (
    <div className="ys-site" data-preset={style.preset} data-surface={style.surface} data-font={style.fontPair} {...(style.preset === 'classic' ? {} : { 'data-motion': style.motion, 'data-radius': style.radius })} data-kit={ctx.doc.kitId} style={vars as CSSProperties}>
      <a className="ys-skip" href="#ys-main">Skip to content</a>
      {header.map((s) => <div key={s.id} className="ys-slot" {...mark(s)}>{renderSection(ctx, s, false)}</div>)}
      <main id="ys-main" tabIndex={-1}>
        {body.map((s) => <div key={s.id} className="ys-slot" {...depth(s)} {...mark(s)}>{renderSection(ctx, s, sections.indexOf(s) === firstMain)}</div>)}
        {/* Draft preview of a page with nothing filled in yet: its title, so the page is never blank. */}
        {ctx.mode === 'draft' && !given.editing && firstMain < 0 ? (
          <section className="ys-s ys-page-title" aria-labelledby="ys-page-title-h"><div className="ys-wrap"><h1 id="ys-page-title-h" className="ys-display">{ctx.page.title}</h1></div></section>
        ) : null}
      </main>
      {footer.map((s) => <div key={s.id} className="ys-slot" {...mark(s)}>{renderSection(ctx, s, false)}</div>)}
      {ctx.mode !== 'draft' ? <JsonLd doc={ctx.doc} /> : null}
    </div>
  )
}

/** LocalBusiness / Restaurant structured data from validated business info only (spec 11.4). */
/** True when a page has at least one main section a visitor would see. */
function pageHasContent(doc: SiteDoc, page: SiteDoc['pages'][number], hasToday: boolean): boolean {
  return page.sections.some((s) => !s.hidden && !NOT_MAIN.has(s.type) && !liveSectionEmpty(doc, s, hasToday))
}

function visitorView(ctx: RenderContext): RenderContext {
  let doc = withoutPlaceholders(ctx.doc)
  // Draft preview only (published output is unchanged): pages with nothing to show yet leave the menu.
  if (ctx.mode === 'draft') {
    const keep = new Set(doc.pages.filter((p) => p.slug === '' || pageHasContent(doc, p, Boolean(ctx.today))).map((p) => p.id))
    doc = { ...doc, nav: { ...doc.nav, items: doc.nav.items.filter((i) => keep.has(i.pageId)) } }
  }
  return { ...ctx, doc, page: doc.pages.find((p) => p.id === ctx.page.id) ?? ctx.page }
}

/** The home page's first hero headline as plain text (no accent marker), when it says more than the name. */
export function homeSlogan(doc: SiteDoc): string | null {
  const home = doc.pages.find((p) => p.slug === '')
  const hero = home?.sections.find((s) => s.type === 'hero' && !s.hidden)
  if (!hero || hero.type !== 'hero') return null
  const line = plainText(hero.props.headline).trim()
  return line && !line.includes('[[') && line.toLowerCase() !== doc.business.name.trim().toLowerCase() ? line : null
}

/**
 * Page <title> and meta description for a client site, as plain text: an accent marker never
 * reaches a title, a description or JSON-LD (plan 6.2).
 */
export function metaFor(doc: SiteDoc, page: { slug: string; title: string; seo?: { title?: string; description?: string } }): { title: string; description: string | null } {
  const title = page.slug === '' ? (doc.seo.siteTitle || doc.business.name) : `${page.seo?.title || page.title} · ${doc.business.name}`
  const description = page.seo?.description || doc.seo.description || doc.business.tagline || homeSlogan(doc) || null
  return { title: plainText(title).slice(0, 120), description: description ? plainText(description) : null }
}

export function jsonLdFor(doc: SiteDoc): Record<string, unknown> {
  const b = doc.business
  const slogan = homeSlogan(doc)
  const days: Record<string, string> = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' }
  return {
    '@context': 'https://schema.org',
    '@type': doc.kitId === 'restaurant' ? 'Restaurant' : doc.kitId === 'food-truck' ? 'FoodEstablishment' : 'LocalBusiness',
    name: b.name,
    ...(b.tagline ? { description: b.tagline } : {}),
    ...(slogan ? { slogan } : {}),
    ...(b.phone ? { telephone: b.phone } : {}),
    ...(b.email ? { email: b.email } : {}),
    ...(b.address ? {
      address: {
        '@type': 'PostalAddress', streetAddress: [b.address.line1, b.address.line2].filter(Boolean).join(', '),
        addressLocality: b.address.city, addressRegion: b.address.region, postalCode: b.address.postal, addressCountry: 'US',
      },
    } : {}),
    ...(b.hours?.some((h) => !('closed' in h)) ? {
      openingHoursSpecification: b.hours.filter((h): h is { day: keyof typeof days & typeof h.day; open: string; close: string } => !('closed' in h))
        .map((h) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: days[h.day], opens: h.open, closes: h.close })),
    } : {}),
    ...(b.social?.length ? { sameAs: b.social.map((s) => s.url) } : {}),
  }
}

function JsonLd({ doc }: { doc: SiteDoc }) {
  // Built only from validated data; `<` is escaped so the JSON can never close the script tag (14.6).
  const json = JSON.stringify(jsonLdFor(doc)).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
