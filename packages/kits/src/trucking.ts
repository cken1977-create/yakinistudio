import type { SiteDocContent } from '@yakini/site-schema'
import { closedKind, footer, formSection, header, imageOr, inCity, noticeKind, paragraphs, photoSample, section, trimTo } from './common'
import type { KitDefinition, SampleImage, TemplateContext } from './types'

/** Trucking companies and owner-operators: services, lanes, drivers (hiring), about, request a quote. */
export const TRUCKING_SAMPLES: readonly SampleImage[] = [
  photoSample('trucking', 'highway-sunset', '7a1e0000-0000-4000-8000-000000000901', 'A white semi truck on the highway at sunset', 'approved set #49'),
  photoSample('trucking', 'truck-row', '7a1e0000-0000-4000-8000-000000000902', 'A row of semi trucks parked at a terminal at dusk', 'approved set #50'),
  photoSample('trucking', 'cab-view', '7a1e0000-0000-4000-8000-000000000903', 'A driver’s hands on the wheel on a mountain highway', 'approved set #51'),
  photoSample('trucking', 'flatbed-load', '7a1e0000-0000-4000-8000-000000000904', 'A flatbed loaded with strapped lumber and steel pipe at a dock', 'approved set #52'),
  photoSample('trucking', 'pre-trip', '7a1e0000-0000-4000-8000-000000000905', 'A driver checking trailer tires with a flashlight at dawn', 'approved set #53'),
  photoSample('trucking', 'desert-highway', '7a1e0000-0000-4000-8000-000000000906', 'An aerial view of a semi truck on a desert highway', 'approved set #54'),
]
/** Home headline (D1 step 5): the kit's default line, never just the name (the name is in the header). */
export const HOME_HEADLINE = 'Your freight, *in good hands.*'

const sample = (key: string) => TRUCKING_SAMPLES.find((s) => s.key === key)

const PAGES = [
  { id: 'home', slug: '', title: 'Home', navLabel: 'Home', sectionTypes: ['header', 'hero', 'today', 'services', 'about', 'cta_band', 'gallery', 'testimonials', 'footer'] },
  { id: 'services', slug: 'services', title: 'Services', navLabel: 'Services', sectionTypes: ['header', 'services', 'gallery', 'faq', 'cta_band', 'footer'] },
  { id: 'drivers', slug: 'drivers', title: 'Drive with us', navLabel: 'Drivers', sectionTypes: ['header', 'hero', 'services', 'faq', 'contact_form', 'footer'] },
  { id: 'about', slug: 'about', title: 'About', navLabel: 'About', sectionTypes: ['header', 'about', 'team', 'footer'] },
  { id: 'quote', slug: 'quote', title: 'Request a quote', navLabel: 'Get a quote', sectionTypes: ['header', 'contact_form', 'hours_location', 'footer'] },
] as const

function template(ctx: TemplateContext): SiteDocContent {
  const name = ctx.name
  const hero = imageOr(ctx, sample('highway-sunset'))
  const gallery = ctx.gallery?.length ? ctx.gallery : []
  const quote = { kind: 'section', pageId: 'quote', sectionId: 'quote-form' } as const
  const apply = { kind: 'section', pageId: 'drivers', sectionId: 'driver-form' } as const
  return {
    kitId: 'trucking',
    locale: 'en-US',
    business: { name, ...(ctx.phone ? { phone: ctx.phone } : {}), ...(ctx.email ? { email: ctx.email } : {}) },
    nav: { items: PAGES.map((p) => ({ label: p.navLabel, pageId: p.id })), cta: { label: 'Get a quote', target: quote } },
    pages: [
      {
        id: 'home', slug: '', title: 'Home',
        sections: [
          header('bar', ctx, 'Get a quote'),
          section('hero', 'hero', 'fullbleed', {
            eyebrow: trimTo(`Trucking${inCity(ctx)}`, 60),
            headline: HOME_HEADLINE,
            subhead: '[[Say what you haul and where, like "Flatbed and dry van freight across the Southwest, on time and communicated."]]',
            ...(hero ? { image: hero } : {}),
            primaryCta: { label: 'Get a quote', target: quote },
            secondaryCta: { label: 'Drive with us', target: { kind: 'page', pageId: 'drivers' } },
          }),
          section('today', 'today', 'banner', { heading: 'Today', emptyBehavior: 'hide' }),
          section('services', 'services-summary', 'cards', {
            heading: 'What we haul',
            items: [
              { title: '[[Dry van]]', body: '[[What freight you take and the lanes you run.]]', icon: 'truck' },
              { title: '[[Flatbed]]', body: '[[Equipment, load types and securement.]]', icon: 'truck' },
              { title: '[[Local or regional]]', body: '[[Your service area and typical turnaround.]]', icon: 'map-pin' },
            ],
          }),
          section('about', 'why', 'left-image', {
            heading: 'Freight you can count on',
            body: paragraphs('[[Write two or three sentences about your fleet, your drivers and how you keep shippers updated.]]'),
            ...(imageOr(ctx, sample('pre-trip')) ? { image: imageOr(ctx, sample('pre-trip')) } : {}),
          }),
          section('cta_band', 'quote-cta', 'solid', { headline: 'Have a load to move?', body: 'Send the pickup, delivery and dates. We’ll get back to you with a quote.', cta: { label: 'Get a quote', target: quote } }),
          section('gallery', 'home-photos', 'grid', { heading: 'A closer look', images: (ctx.gallery ?? []).slice(0, 6) }, (ctx.gallery ?? []).length < 3),
          section('testimonials', 'reviews', 'cards', { heading: 'What shippers say', items: [] }),
          footer(),
        ],
      },
      {
        id: 'services', slug: 'services', title: 'Services',
        sections: [
          header('bar', ctx, 'Get a quote'),
          section('services', 'services', 'list', {
            heading: 'Services',
            intro: '[[A line about your operating authority and the areas you cover. Only list numbers and credentials you really hold.]]',
            items: [
              { title: '[[Full truckload]]', body: '[[Trailer types, weights and lanes.]]', icon: 'truck' },
              { title: '[[Expedited or hotshot]]', body: '[[When you can pick up and how fast you deliver.]]', icon: 'clock' },
              { title: '[[Dedicated runs]]', body: '[[Regular routes for steady shippers, or remove this.]]', icon: 'calendar' },
            ],
          }),
          section('gallery', 'fleet', 'grid', { heading: 'Our fleet', images: gallery }, gallery.length === 0),
          section('faq', 'faq', 'accordion', {
            heading: 'Shipper questions',
            items: [
              { q: 'How do I get a rate?', a: paragraphs('Send the pickup and delivery locations, dates, weight and freight type on the quote form. We’ll reply with a rate.') },
              { q: 'Are loads insured?', a: paragraphs('[[Say what cargo and liability coverage you carry.]]') },
            ],
          }),
          section('cta_band', 'services-cta', 'outline', { headline: 'Let’s move it', cta: { label: 'Get a quote', target: quote } }),
          footer(),
        ],
      },
      {
        id: 'drivers', slug: 'drivers', title: 'Drive with us',
        sections: [
          header('bar', ctx, 'Get a quote'),
          section('hero', 'drivers-hero', 'split', {
            eyebrow: 'Drivers', headline: 'Drive with us', subhead: '[[Say what kind of drivers you’re looking for and what home time looks like.]]',
            ...(imageOr(ctx, sample('cab-view')) ? { image: imageOr(ctx, sample('cab-view')) } : {}),
            primaryCta: { label: 'Apply to drive', target: apply },
          }),
          section('services', 'driver-perks', 'list', {
            heading: 'What to expect',
            items: [
              { title: 'Home time', body: '[[How often drivers get home.]]', icon: 'clock' },
              { title: 'Equipment', body: '[[The trucks and trailers drivers run.]]', icon: 'truck' },
              { title: 'Support', body: '[[How dispatch and maintenance back drivers up.]]', icon: 'phone' },
            ],
          }),
          section('faq', 'driver-faq', 'accordion', { heading: 'Driver questions', items: [{ q: 'What do I need to apply?', a: paragraphs('[[List license class, experience and anything else you require.]]') }] }),
          formSection('driver-form', name, { heading: 'Apply to drive', intro: 'Tell us about your license and experience. We’ll call you back.', formKey: 'driver', fields: ['name', 'phone', 'email', 'message'], submitLabel: 'Send' }),
          footer(),
        ],
      },
      {
        id: 'about', slug: 'about', title: 'About',
        sections: [
          header('bar', ctx, 'Get a quote'),
          section('about', 'story', 'right-image', {
            heading: 'About us',
            body: paragraphs('[[Tell your story: how the company started, how many trucks you run, and what you’re known for.]]'),
            ...(imageOr(ctx, sample('truck-row')) ? { image: imageOr(ctx, sample('truck-row')) } : {}),
          }),
          section('team', 'team', 'grid', { heading: 'The team', members: [] }),
          footer(),
        ],
      },
      {
        id: 'quote', slug: 'quote', title: 'Request a quote',
        sections: [
          header('bar', ctx, 'Get a quote'),
          formSection('quote-form', name, { heading: 'Request a quote', intro: 'Include pickup and delivery cities, dates, weight and freight type.', formKey: 'quote', fields: ['name', 'email', 'phone', 'service', 'message'], submitLabel: 'Request quote' }, 'with-details'),
          section('hours_location', 'office', 'split', { heading: 'Dispatch hours and yard' }),
          footer(),
        ],
      },
    ],
    footer: { showHours: true, showAddress: true, showSiteByYakini: true },
    seo: { siteTitle: trimTo(name, 70), description: trimTo(`${name}: trucking${inCity(ctx)}. Freight services, quotes and driver jobs.`, 160) },
  }
}

export const trucking: KitDefinition = {
  id: 'trucking',
  name: 'Trucking',
  pageTemplates: PAGES,
  allowedSections: ['header', 'hero', 'about', 'services', 'gallery', 'hours_location', 'testimonials', 'faq', 'team', 'cta_band', 'contact_form', 'today', 'footer', 'ticker', 'stats', 'feature_rows'],
  defaultVariants: { header: 'bar', hero: 'fullbleed', about: 'left-image', services: 'cards', gallery: 'grid', hours_location: 'split', testimonials: 'cards', faq: 'accordion', team: 'grid', cta_band: 'solid', contact_form: 'with-details', today: 'banner', footer: 'simple' },
  fontPairs: ['modern', 'classic', 'editorial'],
  copyTone: 'Straight-talking and reliable, like a dispatcher who keeps their word. Name the freight, trailers and lanes. Never invent authority numbers, safety ratings, insurance amounts or driver pay.',
  sampleImages: TRUCKING_SAMPLES,
  defaultPalette: { primary: '#B22222', secondary: '#1C1C1C', accent: '#F2B705' },
  todayKinds: [
    noticeKind('hiring', 'Now hiring drivers'),
    noticeKind('capacity', 'Trucks available'),
    closedKind('Office closed today'),
  ],
  template,
}
