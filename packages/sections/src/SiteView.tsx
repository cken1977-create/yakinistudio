import type { CSSProperties, ReactNode } from 'react'
import type { Section, SiteDoc } from '@yakini/site-schema'
import type { RenderContext } from './context'
import { FooterSection, HeaderSection } from './sections/chrome'
import {
  AboutSection, CtaBandSection, FaqSection, GallerySection, HeroSection, MenuSection, ScheduleSection, ServicesSection,
  TeamSection, TestimonialsSection, TodaySection,
} from './sections/content'
import { BookingSection, CateringRequestSection, ContactFormSection } from './sections/forms'
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
  }
}

const NOT_MAIN = new Set(['header', 'footer', 'today'])

/**
 * One page of a client site (spec 7.3). Pure server rendering: every section reads correctly with
 * JavaScript off, and nothing loads from outside the site (no scripts, fonts, iframes or embeds).
 */
export function SiteView({ ctx }: { ctx: RenderContext }) {
  const { vars } = themeFor(ctx.doc.brand)
  const sections = ctx.page.sections.filter((s) => !s.hidden)
  const firstMain = sections.findIndex((s) => !NOT_MAIN.has(s.type))
  const header = sections.filter((s) => s.type === 'header')
  const footer = sections.filter((s) => s.type === 'footer')
  const body = sections.filter((s) => s.type !== 'header' && s.type !== 'footer')
  // In a draft each section is marked so the editor can select it with a click; live pages carry no ids.
  const mark = (s: Section) => (ctx.mode === 'draft' ? { 'data-ys-section': s.id } : {})
  return (
    <div className="ys-site" data-font={ctx.doc.brand.fontPair} data-kit={ctx.doc.kitId} style={vars as CSSProperties}>
      <a className="ys-skip" href="#ys-main">Skip to content</a>
      {header.map((s) => <div key={s.id} className="ys-slot" {...mark(s)}>{renderSection(ctx, s, false)}</div>)}
      <main id="ys-main" tabIndex={-1}>
        {body.map((s) => <div key={s.id} className="ys-slot" {...mark(s)}>{renderSection(ctx, s, sections.indexOf(s) === firstMain)}</div>)}
      </main>
      {footer.map((s) => <div key={s.id} className="ys-slot" {...mark(s)}>{renderSection(ctx, s, false)}</div>)}
      {ctx.mode !== 'draft' ? <JsonLd doc={ctx.doc} /> : null}
    </div>
  )
}

/** LocalBusiness / Restaurant structured data from validated business info only (spec 11.4). */
export function jsonLdFor(doc: SiteDoc): Record<string, unknown> {
  const b = doc.business
  const days: Record<string, string> = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' }
  return {
    '@context': 'https://schema.org',
    '@type': doc.kitId === 'restaurant' ? 'Restaurant' : doc.kitId === 'food-truck' ? 'FoodEstablishment' : 'LocalBusiness',
    name: b.name,
    ...(b.tagline ? { description: b.tagline } : {}),
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
