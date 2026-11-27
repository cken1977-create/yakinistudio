import { z } from 'zod'
import { HHMM, type SiteDocContent } from '@yakini/site-schema'
import { consentText, footer, header, imageOr, inCity, paragraphs, photoSample, section, trimTo } from './common'
import type { KitDefinition, SampleImage, TemplateContext } from './types'

/**
 * The general kit: any business that doesn't have a kit of its own yet (a law firm, a barber, a
 * plumber, a holding company). Home, Services, About and Contact, written for the owner's chosen
 * industry. Photos only appear where they really show the work; otherwise the hero is text.
 */
export const SERVICE_SAMPLES: readonly SampleImage[] = [
  photoSample('service', 'ac-repair', '7a1e0000-0000-4000-8000-000000000301', 'A technician repairing an outdoor air conditioning unit', 'approved set #43'),
  photoSample('service', 'service-van', '7a1e0000-0000-4000-8000-000000000302', 'A clean white service van parked in a driveway', 'approved set #44'),
  photoSample('service', 'panel-testing', '7a1e0000-0000-4000-8000-000000000303', 'An electrician in gloves testing an open breaker panel', 'approved set #45'),
  photoSample('service', 'kitchen-clean', '7a1e0000-0000-4000-8000-000000000304', 'A cleaner in gloves wiping down a kitchen island', 'approved set #46'),
  photoSample('service', 'pipe-fitting', '7a1e0000-0000-4000-8000-000000000305', 'A plumber tightening a fitting under a bathroom sink', 'approved set #47'),
  photoSample('service', 'tablet-signoff', '7a1e0000-0000-4000-8000-000000000306', 'A homeowner signing a tablet held by a service worker at the door', 'approved set #48'),
]
/** Home headline (D1 step 5): the kit's default line, never just the name (the name is in the header). */
export const HOME_HEADLINE = 'Good work, *done right.*'

const sample = (key: string | undefined) => (key ? SERVICE_SAMPLES.find((s) => s.key === key) : undefined)

const PAGES = [
  { id: 'home', slug: '', title: 'Home', navLabel: 'Home', sectionTypes: ['header', 'hero', 'today', 'about', 'services', 'cta_band', 'gallery', 'testimonials', 'footer'] },
  { id: 'services', slug: 'services', title: 'Services', navLabel: 'Services', sectionTypes: ['header', 'services', 'faq', 'cta_band', 'footer'] },
  { id: 'about', slug: 'about', title: 'About', navLabel: 'About', sectionTypes: ['header', 'about', 'team', 'gallery', 'footer'] },
  { id: 'contact', slug: 'contact', title: 'Contact', navLabel: 'Contact', sectionTypes: ['header', 'contact_form', 'hours_location', 'footer'] },
] as const

function template(ctx: TemplateContext): SiteDocContent {
  const name = ctx.name
  const kind = ctx.industry?.label
  const hero = imageOr(ctx, sample(ctx.industry?.photo))
  const gallery = ctx.gallery?.length ? ctx.gallery : []
  const contact = { kind: 'section', pageId: 'contact', sectionId: 'contact-form' } as const
  const servicesPage = { kind: 'page', pageId: 'services' } as const
  const items = [
    { title: '[[Your main service]]', body: '[[One or two sentences on what it includes and who it is for.]]', icon: 'star' as const },
    { title: '[[A second service]]', body: '[[What the customer gets and how it works.]]', icon: 'calendar' as const },
    { title: '[[A third service]]', body: '[[Add another service, or remove this one.]]', icon: 'users' as const },
  ]
  return {
    kitId: 'service',
    locale: 'en-US',
    business: {
      name,
      ...(ctx.phone ? { phone: ctx.phone } : {}),
      ...(ctx.email ? { email: ctx.email } : {}),
    },
    nav: {
      items: PAGES.map((p) => ({ label: p.navLabel, pageId: p.id })),
      cta: { label: 'Get in touch', target: contact },
    },
    pages: [
      {
        id: 'home', slug: '', title: 'Home',
        sections: [
          header('bar', ctx, 'Get in touch'),
          section('hero', 'hero', hero ? 'split' : 'minimal', {
            ...(kind || ctx.city ? { eyebrow: trimTo(`${kind ?? 'Local business'}${inCity(ctx)}`, 60) } : {}),
            headline: HOME_HEADLINE,
            subhead: '[[Say what you do and who you do it for in one sentence.]]',
            ...(hero ? { image: hero } : {}),
            primaryCta: { label: 'Get in touch', target: contact },
            secondaryCta: { label: 'Our services', target: servicesPage },
          }),
          section('today', 'today', 'banner', { heading: 'Today', emptyBehavior: 'hide' }),
          section('about', 'intro', 'text-only', {
            heading: 'Who we are',
            body: paragraphs('[[Write two or three sentences about your business and what makes working with you different.]]'),
          }),
          section('services', 'services-summary', 'cards', { heading: 'What we do', items }),
          section('cta_band', 'contact-cta', 'solid', {
            headline: 'Ready to talk?',
            body: 'Tell us what you need and we will get back to you.',
            cta: { label: 'Get in touch', target: contact },
          }),
          section('gallery', 'home-photos', 'grid', { heading: 'A closer look', images: (ctx.gallery ?? []).slice(0, 6) }, (ctx.gallery ?? []).length < 3),
          section('testimonials', 'reviews', 'cards', { heading: 'What clients say', items: [] }),
          footer(),
        ],
      },
      {
        id: 'services', slug: 'services', title: 'Services',
        sections: [
          header('bar', ctx, 'Get in touch'),
          section('services', 'services', 'list', {
            heading: 'Services',
            intro: '[[Add a line about how you work, like "Clear pricing, on time, and we clean up after ourselves."]]',
            items,
          }),
          section('faq', 'faq', 'accordion', {
            heading: 'Questions',
            items: [
              { q: 'What areas do you serve?', a: paragraphs(ctx.city ? `We work in and around ${ctx.city}. [[Add nearby areas you serve.]]` : '[[List the areas you serve.]]') },
              { q: 'How do I get started?', a: paragraphs('Send us a message with what you need, and we will reply to set up a time to talk.') },
            ],
          }),
          section('cta_band', 'services-cta', 'outline', {
            headline: 'Not sure what you need?',
            body: 'Tell us about it and we will point you in the right direction.',
            cta: { label: 'Get in touch', target: contact },
          }),
          footer(),
        ],
      },
      {
        id: 'about', slug: 'about', title: 'About',
        sections: [
          header('bar', ctx, 'Get in touch'),
          section('about', 'story', ctx.heroImage ? 'right-image' : 'text-only', {
            heading: 'Our story',
            body: paragraphs('[[Tell your story: how the business started, who you serve and what you care about.]]'),
            ...(ctx.heroImage ? { image: ctx.heroImage } : {}),
          }),
          section('team', 'team', 'grid', { heading: 'The team', members: [] }),
          section('gallery', 'gallery', 'grid', { heading: 'Our work', images: gallery }, gallery.length === 0),
          footer(),
        ],
      },
      {
        id: 'contact', slug: 'contact', title: 'Contact',
        sections: [
          header('bar', ctx, 'Get in touch'),
          section('contact_form', 'contact-form', 'with-details', {
            heading: 'Get in touch',
            intro: 'Tell us a little about what you need. We will reply as soon as we can.',
            formKey: 'contact',
            fields: ['name', 'email', 'phone', 'service', 'message'],
            submitLabel: 'Send message',
            consentText: consentText(trimTo(name, 120)),
          }),
          section('hours_location', 'hours', 'split', { heading: 'Hours and location' }),
          footer(),
        ],
      },
    ],
    footer: { showHours: true, showAddress: true, showSiteByYakini: true },
    seo: {
      siteTitle: trimTo(name, 70),
      description: trimTo(`${name}: ${(kind ?? 'local business').toLowerCase()}${inCity(ctx)}. Services, about us and how to get in touch.`, 160),
    },
  }
}

export const service: KitDefinition = {
  id: 'service',
  name: 'Business and services',
  pageTemplates: PAGES,
  allowedSections: ['header', 'hero', 'about', 'services', 'schedule', 'gallery', 'hours_location', 'testimonials', 'faq', 'team', 'cta_band', 'contact_form', 'booking', 'today', 'footer'],
  defaultVariants: {
    header: 'bar', hero: 'split', about: 'right-image', services: 'cards', schedule: 'list', gallery: 'grid',
    hours_location: 'split', testimonials: 'cards', faq: 'accordion', team: 'grid', cta_band: 'solid', contact_form: 'with-details',
    booking: 'card', today: 'banner', footer: 'simple',
  },
  fontPairs: ['modern', 'classic', 'editorial', 'friendly'],
  copyTone: 'Clear, confident and plain-spoken, like a trusted local pro explaining what they do. Write for the exact kind of business in BUSINESS_FACTS.industry: use the words its customers use, name the real services, and make the next step obvious. Short sentences, no jargon, no hype.',
  sampleImages: SERVICE_SAMPLES,
  defaultPalette: { primary: '#1F4E79', secondary: '#14202B', accent: '#E0A526' },
  todayKinds: [
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
    {
      id: 'notice',
      label: 'Notice',
      fields: z.object({ title: z.string().min(1).max(80), description: z.string().max(200).optional() }).strict(),
    },
  ],
  template,
}
