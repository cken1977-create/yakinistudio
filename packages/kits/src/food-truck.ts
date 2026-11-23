import { z } from 'zod'
import { HHMM, type SiteDocContent } from '@yakini/site-schema'
import { consentText, footer, header, imageOr, inCity, paragraphs, section, trimTo } from './common'
import type { KitDefinition, SampleImage, TemplateContext } from './types'

const YAKINI_DRAWN = {
  kind: 'yakini-owned',
  source: 'Illustration drawn by Yakini Digital for the food truck kit, Nov 2026',
  redistributable: true,
} as const

export const FOOD_TRUCK_SAMPLES: readonly SampleImage[] = [
  { key: 'truck', assetId: '7a1e0000-0000-4000-8000-000000000101', storagePath: 'kit-samples/food-truck/truck.svg', mime: 'image/svg+xml', width: 1600, height: 1000, alt: 'Illustration of a food truck with its service window open', license: YAKINI_DRAWN },
  { key: 'tacos', assetId: '7a1e0000-0000-4000-8000-000000000102', storagePath: 'kit-samples/food-truck/tacos.svg', mime: 'image/svg+xml', width: 1600, height: 1000, alt: 'Illustration of three tacos on a tray', license: YAKINI_DRAWN },
  { key: 'event', assetId: '7a1e0000-0000-4000-8000-000000000103', storagePath: 'kit-samples/food-truck/event.svg', mime: 'image/svg+xml', width: 1600, height: 1000, alt: 'Illustration of string lights over an outdoor event', license: YAKINI_DRAWN },
]
const sample = (key: string) => FOOD_TRUCK_SAMPLES.find((s) => s.key === key)

const PAGES = [
  { id: 'home', slug: '', title: 'Home', navLabel: 'Home', sectionTypes: ['header', 'hero', 'today', 'schedule', 'cta_band', 'testimonials', 'footer'] },
  { id: 'menu', slug: 'menu', title: 'Menu', navLabel: 'Menu', sectionTypes: ['header', 'menu', 'cta_band', 'footer'] },
  { id: 'about', slug: 'about', title: 'About', navLabel: 'About', sectionTypes: ['header', 'about', 'gallery', 'faq', 'footer'] },
  { id: 'catering', slug: 'catering', title: 'Catering and events', navLabel: 'Catering', sectionTypes: ['header', 'hero', 'services', 'catering_request', 'faq', 'footer'] },
  { id: 'contact', slug: 'contact', title: 'Contact', navLabel: 'Contact', sectionTypes: ['header', 'hours_location', 'contact_form', 'footer'] },
] as const

function template(ctx: TemplateContext): SiteDocContent {
  const name = ctx.name
  const hero = imageOr(ctx, sample('truck'))
  const gallery = ctx.gallery?.length ? ctx.gallery : []
  return {
    kitId: 'food-truck',
    locale: 'en-US',
    business: {
      name,
      ...(ctx.phone ? { phone: ctx.phone } : {}),
      ...(ctx.email ? { email: ctx.email } : {}),
    },
    nav: {
      items: PAGES.map((p) => ({ label: p.navLabel, pageId: p.id })),
      cta: { label: 'Book catering', target: { kind: 'page', pageId: 'catering' } },
    },
    pages: [
      {
        id: 'home', slug: '', title: 'Home',
        sections: [
          header('bar', ctx, 'Book catering'),
          section('hero', 'hero', 'split', {
            eyebrow: trimTo(`Food truck${inCity(ctx)}`, 60),
            headline: trimTo(name, 90),
            subhead: '[[Say what you serve in one sentence, like "Fresh street tacos made to order."]]',
            ...(hero ? { image: hero } : {}),
            primaryCta: { label: 'See the menu', target: { kind: 'page', pageId: 'menu' } },
            secondaryCta: { label: 'Find the truck', target: { kind: 'section', pageId: 'home', sectionId: 'schedule' } },
          }),
          section('today', 'today', 'banner', { heading: 'Today', emptyBehavior: 'hide' }),
          section('schedule', 'schedule', 'week', {
            heading: 'Where to find us',
            intro: '[[Add your regular weekly stops so people know where to find you.]]',
            stops: [],
          }),
          section('cta_band', 'menu-cta', 'solid', {
            headline: 'Hungry yet?',
            body: 'See everything we make, from the favorites to the specials.',
            cta: { label: 'See the menu', target: { kind: 'page', pageId: 'menu' } },
          }),
          section('testimonials', 'reviews', 'cards', { heading: 'What people say', items: [] }),
          footer(),
        ],
      },
      {
        id: 'menu', slug: 'menu', title: 'Menu',
        sections: [
          header('bar', ctx, 'Book catering'),
          section('menu', 'menu', 'cards', {
            heading: 'Menu',
            intro: '[[Add a line about your food, like "Everything is made fresh on the truck."]]',
            categories: [],
            note: 'Menu and prices can change. Ask at the window for today’s specials.',
          }),
          section('cta_band', 'catering-cta', 'outline', {
            headline: 'Feeding a crowd?',
            body: 'We bring the truck to parties, offices and events.',
            cta: { label: 'Plan an event', target: { kind: 'page', pageId: 'catering' } },
          }),
          footer(),
        ],
      },
      {
        id: 'about', slug: 'about', title: 'About',
        sections: [
          header('bar', ctx, 'Book catering'),
          section('about', 'story', 'left-image', {
            heading: `About ${trimTo(name, 70)}`,
            body: paragraphs('[[Tell your story: who started the truck, what you cook and why people come back.]]'),
            ...(imageOr(ctx, sample('tacos')) ? { image: imageOr(ctx, sample('tacos')) } : {}),
          }),
          section('gallery', 'gallery', 'grid', { heading: 'From the truck', images: gallery }, gallery.length === 0),
          section('faq', 'faq', 'accordion', {
            heading: 'Good to know',
            items: [
              { q: 'How do I find the truck today?', a: paragraphs('Check the schedule on our home page. When plans change, we post it there first.') },
              { q: 'Do you cater private events?', a: paragraphs('Yes. Send us the date, the place and about how many guests on our catering page, and we will get back to you.') },
              { q: 'What payment do you take?', a: paragraphs('[[List the payment types you take at the window.]]') },
            ],
          }),
          footer(),
        ],
      },
      {
        id: 'catering', slug: 'catering', title: 'Catering and events',
        sections: [
          header('bar', ctx, 'Book catering'),
          section('hero', 'catering-hero', 'minimal', {
            eyebrow: 'Catering and events',
            headline: 'We bring the truck to you',
            subhead: 'Birthdays, office lunches, weddings and block parties. Tell us about your event and we will put together a plan.',
            primaryCta: { label: 'Request a date', target: { kind: 'form', formKey: 'catering' } },
          }),
          section('services', 'packages', 'cards', {
            heading: 'Ways we can help',
            items: [
              { title: 'Truck at your event', body: 'We park, cook and serve on site.', icon: 'truck' },
              { title: 'Drop-off trays', body: '[[Describe your drop-off or pickup options, or remove this.]]', icon: 'utensils' },
              { title: 'Custom menu', body: 'Pick the dishes your guests will love.', icon: 'star' },
            ],
          }),
          section('catering_request', 'catering-form', 'simple', {
            heading: 'Tell us about your event',
            intro: 'We will reply with availability and a quote.',
            formKey: 'catering',
            fields: ['name', 'email', 'phone', 'event_date', 'guest_count', 'message'],
            submitLabel: 'Send request',
            consentText: consentText(trimTo(name, 120)),
          }),
          section('faq', 'catering-faq', 'accordion', {
            heading: 'Catering questions',
            items: [
              { q: 'How far ahead should I book?', a: paragraphs('[[Say how much notice you need, like two weeks for most events.]]') },
              { q: 'Is there a minimum?', a: paragraphs('[[Add your minimum guest count or order, or remove this question.]]') },
            ],
          }),
          footer(),
        ],
      },
      {
        id: 'contact', slug: 'contact', title: 'Contact',
        sections: [
          header('bar', ctx, 'Book catering'),
          section('hours_location', 'hours', 'split', {
            heading: 'Hours and where we park',
            note: 'Our spot changes during the week. The schedule on the home page is always up to date.',
          }),
          section('contact_form', 'contact-form', 'with-details', {
            heading: 'Send us a message',
            intro: 'Questions, feedback or special requests. We read every message.',
            formKey: 'contact',
            fields: ['name', 'email', 'phone', 'message'],
            submitLabel: 'Send message',
            consentText: consentText(trimTo(name, 120)),
          }),
          footer(),
        ],
      },
    ],
    footer: { showHours: true, showAddress: false, showSiteByYakini: true },
    seo: {
      siteTitle: trimTo(name, 70),
      description: trimTo(`${name}: food truck${inCity(ctx)}. Menu, weekly schedule and catering.`, 160),
    },
  }
}

export const foodTruck: KitDefinition = {
  id: 'food-truck',
  name: 'Food truck',
  pageTemplates: PAGES,
  allowedSections: ['header', 'hero', 'about', 'services', 'menu', 'schedule', 'gallery', 'hours_location', 'testimonials', 'faq', 'team', 'cta_band', 'contact_form', 'booking', 'catering_request', 'today', 'footer'],
  defaultVariants: {
    header: 'bar', hero: 'split', about: 'left-image', services: 'cards', menu: 'cards', schedule: 'week', gallery: 'grid',
    hours_location: 'split', testimonials: 'cards', faq: 'accordion', team: 'grid', cta_band: 'solid', contact_form: 'simple',
    booking: 'card', catering_request: 'simple', today: 'banner', footer: 'simple',
  },
  fontPairs: ['friendly', 'modern'],
  copyTone: 'Friendly, upbeat and short, like the person at the window talking to a regular. Lead with the food and where to find the truck today. Use everyday words, no hype, no exclamation points in headlines.',
  sampleImages: FOOD_TRUCK_SAMPLES,
  defaultPalette: { primary: '#B4361B', secondary: '#1F1A17', accent: '#F2A93B' },
  todayKinds: [
    {
      id: 'stop',
      label: 'Today’s stop',
      fields: z.object({
        place: z.string().min(1).max(80),
        address: z.string().max(160).optional(),
        start: HHMM,
        end: HHMM,
        note: z.string().max(140).optional(),
      }).strict().refine((f) => f.end > f.start, 'The stop has to end after it starts'),
    },
    {
      id: 'off',
      label: 'Not out today',
      headline: 'Not out today',
      fields: z.object({ note: z.string().max(140).optional() }).strict(),
    },
  ],
  template,
}
