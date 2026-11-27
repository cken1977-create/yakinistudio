import { z } from 'zod'
import { HHMM, type SiteDocContent } from '@yakini/site-schema'
import { consentText, footer, header, imageOr, inCity, paragraphs, section, trimTo, photoSample } from './common'
import type { KitDefinition, SampleImage, TemplateContext } from './types'

const YAKINI_DRAWN = {
  kind: 'yakini-owned',
  source: 'Illustration drawn by Yakini Digital for the restaurant kit, Nov 2026',
  redistributable: true,
} as const

export const RESTAURANT_SAMPLES: readonly SampleImage[] = [
  { key: 'dining', assetId: '7a1e0000-0000-4000-8000-000000000201', storagePath: 'kit-samples/restaurant/dining.svg', mime: 'image/svg+xml', width: 1600, height: 1000, alt: 'Illustration of a warm dining room with set tables', license: YAKINI_DRAWN, retired: true },
  { key: 'plate', assetId: '7a1e0000-0000-4000-8000-000000000202', storagePath: 'kit-samples/restaurant/plate.svg', mime: 'image/svg+xml', width: 1600, height: 1000, alt: 'Illustration of a plated dish with herbs', license: YAKINI_DRAWN, retired: true },
  { key: 'table', assetId: '7a1e0000-0000-4000-8000-000000000203', storagePath: 'kit-samples/restaurant/table.svg', mime: 'image/svg+xml', width: 1600, height: 1000, alt: 'Illustration of a long table set for a private event', license: YAKINI_DRAWN, retired: true },
  // Photos (approved Nov 2026). The drawings above stay only so older drafts keep rendering.
  photoSample('restaurant', 'corner-dusk', '7a1e0000-0000-4000-8000-000000000204', 'A corner restaurant with a lit patio and potted plants at dusk', 'approved set #12'),
  photoSample('restaurant', 'dining-room', '7a1e0000-0000-4000-8000-000000000205', 'A warm, candlelit dining room with wine glasses on a wooden table', 'approved set #07'),
  photoSample('restaurant', 'plated-fish', '7a1e0000-0000-4000-8000-000000000206', 'A chef finishing a plate of seared fish with fresh herbs', 'approved set #08'),
  photoSample('restaurant', 'family-table', '7a1e0000-0000-4000-8000-000000000207', 'Fried chicken, mac and cheese, collard greens and cornbread served family style', 'approved set #09'),
  photoSample('restaurant', 'cocktail', '7a1e0000-0000-4000-8000-000000000208', 'A bartender pouring a cocktail into a coupe glass at a candlelit bar', 'approved set #10'),
]
const sample = (key: string) => RESTAURANT_SAMPLES.find((s) => s.key === key)

const PAGES = [
  { id: 'home', slug: '', title: 'Home', navLabel: 'Home', sectionTypes: ['header', 'hero', 'today', 'about', 'cta_band', 'hours_location', 'testimonials', 'footer'] },
  { id: 'menu', slug: 'menu', title: 'Menu', navLabel: 'Menu', sectionTypes: ['header', 'menu', 'cta_band', 'footer'] },
  { id: 'about', slug: 'about', title: 'About', navLabel: 'About', sectionTypes: ['header', 'about', 'team', 'gallery', 'footer'] },
  { id: 'events', slug: 'events', title: 'Private events', navLabel: 'Events', sectionTypes: ['header', 'hero', 'services', 'catering_request', 'faq', 'footer'] },
  { id: 'contact', slug: 'contact', title: 'Contact', navLabel: 'Contact', sectionTypes: ['header', 'hours_location', 'booking', 'contact_form', 'footer'] },
] as const

function template(ctx: TemplateContext): SiteDocContent {
  const name = ctx.name
  const hero = imageOr(ctx, sample('corner-dusk'))
  const gallery = ctx.gallery?.length ? ctx.gallery : []
  const reserve = { kind: 'section', pageId: 'contact', sectionId: 'booking' } as const
  return {
    kitId: 'restaurant',
    locale: 'en-US',
    business: {
      name,
      ...(ctx.phone ? { phone: ctx.phone } : {}),
      ...(ctx.email ? { email: ctx.email } : {}),
    },
    nav: {
      items: PAGES.map((p) => ({ label: p.navLabel, pageId: p.id })),
      cta: { label: 'Book a table', target: reserve },
    },
    pages: [
      {
        id: 'home', slug: '', title: 'Home',
        sections: [
          header('centered', ctx, 'Book a table'),
          section('hero', 'hero', 'cinematic', {
            eyebrow: trimTo(`Restaurant${inCity(ctx)}`, 60),
            headline: trimTo(name, 90),
            subhead: '[[Say what you serve in one sentence, like "Wood-fired Italian, made from scratch."]]',
            ...(hero ? { image: hero } : {}),
            primaryCta: { label: 'View the menu', target: { kind: 'page', pageId: 'menu' } },
            secondaryCta: { label: 'Book a table', target: reserve },
          }),
          section('today', 'today', 'card', { heading: 'Today', emptyBehavior: 'hide' }),
          section('about', 'welcome', 'text-only', {
            heading: 'Welcome',
            body: paragraphs('[[Write two or three sentences about your food and what it is like to eat here.]]'),
          }),
          section('cta_band', 'menu-cta', 'solid', {
            headline: 'See what’s cooking',
            body: 'Our full menu, from starters to dessert.',
            cta: { label: 'View the menu', target: { kind: 'page', pageId: 'menu' } },
          }),
          section('hours_location', 'visit', 'card', { heading: 'Visit us' }),
          section('testimonials', 'reviews', 'single', { heading: 'From our guests', items: [] }),
          footer(),
        ],
      },
      {
        id: 'menu', slug: 'menu', title: 'Menu',
        sections: [
          header('centered', ctx, 'Book a table'),
          section('menu', 'menu', 'columns', {
            heading: 'Menu',
            intro: '[[Add a line about your kitchen, like "Seasonal dishes from local farms."]]',
            categories: [],
            note: 'Please tell your server about any allergies. Menu items and prices can change.',
          }),
          section('cta_band', 'events-cta', 'outline', {
            headline: 'Planning a celebration?',
            body: 'Our space works for birthdays, rehearsal dinners and team nights.',
            cta: { label: 'Private events', target: { kind: 'page', pageId: 'events' } },
          }),
          footer(),
        ],
      },
      {
        id: 'about', slug: 'about', title: 'About',
        sections: [
          header('centered', ctx, 'Book a table'),
          section('about', 'story', 'right-image', {
            heading: 'Our story',
            body: paragraphs('[[Tell your story: how the restaurant started, the food you love to cook and the people behind it.]]'),
            ...(imageOr(ctx, sample('plated-fish')) ? { image: imageOr(ctx, sample('plated-fish')) } : {}),
          }),
          section('team', 'team', 'grid', { heading: 'The team', members: [] }),
          section('gallery', 'gallery', 'masonry', { heading: 'Inside', images: gallery }, gallery.length === 0),
          footer(),
        ],
      },
      {
        id: 'events', slug: 'events', title: 'Private events',
        sections: [
          header('centered', ctx, 'Book a table'),
          section('hero', 'events-hero', 'minimal', {
            eyebrow: 'Private events',
            headline: 'Celebrate with us',
            subhead: 'Tell us your date and party size and we will plan the menu with you.',
            primaryCta: { label: 'Ask about a date', target: { kind: 'form', formKey: 'events' } },
          }),
          section('services', 'options', 'list', {
            heading: 'Event options',
            items: [
              { title: 'Private dining', body: '[[Describe your private room or space, and how many guests it holds.]]', icon: 'users' },
              { title: 'Group menus', body: 'Set menus for groups, planned with our kitchen.', icon: 'utensils' },
              { title: 'Catering', body: '[[Describe your catering or takeout trays, or remove this.]]', icon: 'gift' },
            ],
          }),
          section('catering_request', 'events-form', 'simple', {
            heading: 'Plan your event',
            intro: 'We will reply with availability and menu options.',
            formKey: 'events',
            fields: ['name', 'email', 'phone', 'event_date', 'guest_count', 'message'],
            submitLabel: 'Send request',
            consentText: consentText(trimTo(name, 120)),
          }),
          section('faq', 'events-faq', 'accordion', {
            heading: 'Event questions',
            items: [
              { q: 'How many guests can you host?', a: paragraphs('[[Add your largest party size.]]') },
              { q: 'Can you work with dietary needs?', a: paragraphs('Tell us about allergies and preferences when you send your request, and the kitchen will plan for them.') },
            ],
          }),
          footer(),
        ],
      },
      {
        id: 'contact', slug: 'contact', title: 'Contact',
        sections: [
          header('centered', ctx, 'Book a table'),
          section('hours_location', 'hours', 'split', { heading: 'Hours and location' }),
          section('booking', 'booking', 'card', {
            heading: 'Book a table',
            body: 'Send us your party size and the time you would like, and we will confirm your table.',
            mode: 'request',
            buttonLabel: 'Request a table',
          }),
          section('contact_form', 'contact-form', 'simple', {
            heading: 'Send us a message',
            formKey: 'contact',
            fields: ['name', 'email', 'phone', 'message'],
            submitLabel: 'Send message',
            consentText: consentText(trimTo(name, 120)),
          }),
          footer(),
        ],
      },
    ],
    footer: { showHours: true, showAddress: true, showSiteByYakini: true },
    seo: {
      siteTitle: trimTo(name, 70),
      description: trimTo(`${name}: restaurant${inCity(ctx)}. Menu, hours, reservations and private events.`, 160),
    },
  }
}

export const restaurant: KitDefinition = {
  id: 'restaurant',
  name: 'Restaurant',
  pageTemplates: PAGES,
  allowedSections: ['header', 'hero', 'about', 'services', 'menu', 'schedule', 'gallery', 'hours_location', 'testimonials', 'faq', 'team', 'cta_band', 'contact_form', 'booking', 'catering_request', 'today', 'footer'],
  defaultVariants: {
    header: 'centered', hero: 'cinematic', about: 'right-image', services: 'list', menu: 'columns', schedule: 'list', gallery: 'masonry',
    hours_location: 'split', testimonials: 'single', faq: 'accordion', team: 'grid', cta_band: 'solid', contact_form: 'simple',
    booking: 'card', catering_request: 'simple', today: 'card', footer: 'simple',
  },
  fontPairs: ['classic', 'editorial', 'modern'],
  copyTone: 'Warm and welcoming, like a host greeting regulars at the door. Let the food and the room do the talking. Specific dishes over adjectives, short sentences, no hype.',
  sampleImages: RESTAURANT_SAMPLES,
  defaultPalette: { primary: '#7A2E2A', secondary: '#1B1714', accent: '#C9A14A' },
  todayKinds: [
    {
      id: 'special',
      label: 'Today’s special',
      fields: z.object({
        title: z.string().min(1).max(80),
        description: z.string().max(200).optional(),
        price: z.string().max(20).optional(),
      }).strict(),
    },
    {
      id: 'hours',
      label: 'Special hours today',
      fields: z.object({ open: HHMM, close: HHMM, note: z.string().max(140).optional() }).strict()
        .refine((f) => f.close > f.open, 'Closing time has to be after opening time'),
    },
    {
      id: 'closed',
      label: 'Closed today',
      headline: 'Closed today',
      fields: z.object({ note: z.string().max(140).optional() }).strict(),
    },
  ],
  template,
}
