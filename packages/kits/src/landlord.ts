import { z } from 'zod'
import type { SiteDocContent } from '@yakini/site-schema'
import { closedKind, footer, formSection, header, imageOr, inCity, noticeKind, paragraphs, photoSample, section, trimTo } from './common'
import type { KitDefinition, SampleImage, TemplateContext } from './types'

/** Landlords and property managers: rentals, a residents page with maintenance requests, and contact. */
export const LANDLORD_SAMPLES: readonly SampleImage[] = [
  photoSample('landlord', 'apartment-building', '7a1e0000-0000-4000-8000-000000000401', 'A well-kept three-story apartment building with balconies and a green lawn', 'approved set #13'),
  photoSample('landlord', 'empty-living-room', '7a1e0000-0000-4000-8000-000000000402', 'A bright, empty apartment living room with wood floors and a city view', 'approved set #14'),
  photoSample('landlord', 'key-handoff', '7a1e0000-0000-4000-8000-000000000403', 'A set of house keys handed to a new tenant at the front door', 'approved set #15'),
  photoSample('landlord', 'under-sink-repair', '7a1e0000-0000-4000-8000-000000000404', 'A maintenance worker fixing the pipes under a kitchen sink', 'approved set #16'),
  photoSample('landlord', 'duplex-row', '7a1e0000-0000-4000-8000-000000000405', 'A row of tidy two-story homes with front porches on a tree-lined street', 'approved set #17'),
]
/** Home headline (D1 step 5): the kit's default line, never just the name (the name is in the header). */
export const HOME_HEADLINE = 'Find your *next home* here.'

const sample = (key: string) => LANDLORD_SAMPLES.find((s) => s.key === key)

const PAGES = [
  { id: 'home', slug: '', title: 'Home', navLabel: 'Home', sectionTypes: ['header', 'hero', 'today', 'about', 'services', 'cta_band', 'gallery', 'testimonials', 'footer'] },
  { id: 'rentals', slug: 'rentals', title: 'Rentals', navLabel: 'Rentals', sectionTypes: ['header', 'services', 'gallery', 'faq', 'contact_form', 'footer'] },
  { id: 'residents', slug: 'residents', title: 'Residents', navLabel: 'Residents', sectionTypes: ['header', 'hero', 'services', 'contact_form', 'faq', 'footer'] },
  { id: 'about', slug: 'about', title: 'About', navLabel: 'About', sectionTypes: ['header', 'about', 'team', 'footer'] },
  { id: 'contact', slug: 'contact', title: 'Contact', navLabel: 'Contact', sectionTypes: ['header', 'contact_form', 'hours_location', 'footer'] },
] as const

function template(ctx: TemplateContext): SiteDocContent {
  const name = ctx.name
  const hero = imageOr(ctx, sample('apartment-building'))
  const gallery = ctx.gallery?.length ? ctx.gallery : []
  const repair = { kind: 'section', pageId: 'residents', sectionId: 'maintenance' } as const
  return {
    kitId: 'landlord',
    locale: 'en-US',
    business: { name, ...(ctx.phone ? { phone: ctx.phone } : {}), ...(ctx.email ? { email: ctx.email } : {}) },
    nav: { items: PAGES.map((p) => ({ label: p.navLabel, pageId: p.id })), cta: { label: 'See rentals', target: { kind: 'page', pageId: 'rentals' } } },
    pages: [
      {
        id: 'home', slug: '', title: 'Home',
        sections: [
          header('bar', ctx, 'See rentals'),
          section('hero', 'hero', 'split', {
            eyebrow: trimTo(`Rentals${inCity(ctx)}`, 60),
            headline: HOME_HEADLINE,
            subhead: '[[Say what you rent and where, like "Clean, quiet apartments near downtown, managed by people who answer the phone."]]',
            ...(hero ? { image: hero } : {}),
            primaryCta: { label: 'See rentals', target: { kind: 'page', pageId: 'rentals' } },
            secondaryCta: { label: 'Request a repair', target: repair },
          }),
          section('today', 'today', 'banner', { heading: 'Today', emptyBehavior: 'hide' }),
          section('about', 'welcome', 'text-only', {
            heading: 'A place you’ll want to stay',
            body: paragraphs('[[Write two or three sentences about your homes and how you take care of them and your residents.]]'),
          }),
          section('services', 'why', 'cards', {
            heading: 'Living with us',
            items: [
              { title: 'Fast repairs', body: 'Send a request any time and we’ll tell you when someone is coming.', icon: 'clock' },
              { title: '[[Something residents love]]', body: '[[Like parking, laundry, a yard or being close to schools.]]', icon: 'heart' },
              { title: 'Clear terms', body: 'Plain leases and straight answers about rent, deposits and move-out.', icon: 'star' },
            ],
          }),
          section('cta_band', 'rentals-cta', 'solid', { headline: 'Looking for a place?', body: 'See what’s open now and ask us about a showing.', cta: { label: 'See rentals', target: { kind: 'page', pageId: 'rentals' } } }),
          section('gallery', 'home-photos', 'grid', { heading: 'A closer look', images: (ctx.gallery ?? []).slice(0, 6) }, (ctx.gallery ?? []).length < 3),
          section('testimonials', 'reviews', 'cards', { heading: 'What residents say', items: [] }),
          footer(),
        ],
      },
      {
        id: 'rentals', slug: 'rentals', title: 'Rentals',
        sections: [
          header('bar', ctx, 'See rentals'),
          section('services', 'units', 'cards', {
            heading: 'Available now',
            intro: '[[List each open unit: size, bedrooms and baths, and when it’s ready. Remove any that are rented.]]',
            items: [
              { title: '[[2 bed, 1 bath apartment]]', body: '[[Floor, square feet, what’s included and the move-in date.]]', icon: 'map-pin' },
              { title: '[[1 bed, 1 bath apartment]]', body: '[[Floor, square feet, what’s included and the move-in date.]]', icon: 'map-pin' },
            ],
          }),
          section('gallery', 'photos', 'grid', { heading: 'Take a look', images: gallery }, gallery.length === 0),
          section('faq', 'rental-faq', 'accordion', {
            heading: 'Renting with us',
            items: [
              { q: 'How do I apply?', a: paragraphs('Send us a message below with the unit you like, and we’ll send the application and set up a showing.') },
              { q: 'Do you allow pets?', a: paragraphs('[[Say your pet policy, or remove this question.]]') },
              { q: 'What do I need to move in?', a: paragraphs('[[List what you ask for, like the first month’s rent, a deposit and a signed lease.]]') },
            ],
          }),
          formSection('rental-inquiry', name, { heading: 'Ask about a rental', intro: 'Tell us which home you’re interested in and when you’d like to move.', formKey: 'rental', fields: ['name', 'email', 'phone', 'service', 'message'], submitLabel: 'Send' }),
          footer(),
        ],
      },
      {
        id: 'residents', slug: 'residents', title: 'Residents',
        sections: [
          header('bar', ctx, 'See rentals'),
          section('hero', 'residents-hero', 'minimal', { eyebrow: 'For residents', headline: 'Here when you need us', subhead: 'Repairs, rent and questions, all in one place.', primaryCta: { label: 'Request a repair', target: repair } }),
          section('services', 'resident-help', 'list', {
            heading: 'How to reach us',
            items: [
              { title: 'Repairs', body: 'Use the form below. For a flood, fire or gas smell, call 911 first, then call us.', icon: 'phone' },
              { title: 'Paying rent', body: '[[Say how residents pay rent and when it’s due.]]', icon: 'calendar' },
              { title: 'Moving out', body: '[[Say how much notice you need and how deposits are returned.]]', icon: 'gift' },
            ],
          }),
          formSection('maintenance', name, { heading: 'Request a repair', intro: 'Tell us your unit and what’s wrong. We’ll reply with when someone can come.', formKey: 'maintenance', fields: ['name', 'phone', 'email', 'service', 'message'], submitLabel: 'Send request' }),
          section('faq', 'resident-faq', 'accordion', {
            heading: 'Resident questions',
            items: [{ q: 'What counts as an emergency?', a: paragraphs('No heat in winter, no water, a major leak, or a door that won’t lock. Call us right away for these.') }],
          }),
          footer(),
        ],
      },
      {
        id: 'about', slug: 'about', title: 'About',
        sections: [
          header('bar', ctx, 'See rentals'),
          section('about', 'story', 'right-image', {
            heading: 'About us',
            body: paragraphs('[[Tell your story: how long you’ve owned or managed homes here and how you look after them.]]'),
            ...(imageOr(ctx, sample('key-handoff')) ? { image: imageOr(ctx, sample('key-handoff')) } : {}),
          }),
          section('team', 'team', 'grid', { heading: 'Who you’ll work with', members: [] }),
          footer(),
        ],
      },
      {
        id: 'contact', slug: 'contact', title: 'Contact',
        sections: [
          header('bar', ctx, 'See rentals'),
          formSection('contact-form', name, { heading: 'Get in touch', formKey: 'contact', fields: ['name', 'email', 'phone', 'message'], submitLabel: 'Send message' }, 'with-details'),
          section('hours_location', 'office', 'split', { heading: 'Office hours and location' }),
          footer(),
        ],
      },
    ],
    footer: { showHours: true, showAddress: true, showSiteByYakini: true },
    seo: { siteTitle: trimTo(name, 70), description: trimTo(`${name}: rentals${inCity(ctx)}. Available homes, resident repairs and how to reach us.`, 160) },
  }
}

export const landlord: KitDefinition = {
  id: 'landlord',
  name: 'Landlord',
  pageTemplates: PAGES,
  allowedSections: ['header', 'hero', 'about', 'services', 'gallery', 'hours_location', 'testimonials', 'faq', 'team', 'cta_band', 'contact_form', 'today', 'footer'],
  defaultVariants: { header: 'bar', hero: 'split', about: 'right-image', services: 'cards', gallery: 'grid', hours_location: 'split', testimonials: 'cards', faq: 'accordion', team: 'grid', cta_band: 'solid', contact_form: 'simple', today: 'banner', footer: 'simple' },
  fontPairs: ['modern', 'classic', 'friendly'],
  copyTone: 'Steady, clear and respectful, like a landlord residents trust. Lead with the homes and how problems get fixed. Plain words about rent, repairs and leases; never promise approval or hide terms.',
  sampleImages: LANDLORD_SAMPLES,
  defaultPalette: { primary: '#2E5E4E', secondary: '#1A2421', accent: '#D9A441' },
  todayKinds: [
    {
      id: 'vacancy',
      label: 'Unit available',
      fields: z.object({ title: z.string().min(1).max(80), description: z.string().max(200).optional() }).strict(),
    },
    noticeKind('notice', 'Resident notice'),
    closedKind('Office closed today'),
  ],
  template,
}
