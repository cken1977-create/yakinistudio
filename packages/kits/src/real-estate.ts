import { z } from 'zod'
import { HHMM, type SiteDocContent } from '@yakini/site-schema'
import { closedKind, footer, formSection, header, imageOr, inCity, noticeKind, paragraphs, photoSample, section, trimTo } from './common'
import type { KitDefinition, SampleImage, TemplateContext } from './types'

/** Agents and small brokerages: listings, buying, selling (home value request), about, contact. */
export const REAL_ESTATE_SAMPLES: readonly SampleImage[] = [
  photoSample('real-estate', 'family-home', '7a1e0000-0000-4000-8000-000000000501', 'A two-story family home with a green lawn at sunset', 'approved set #19'),
  photoSample('real-estate', 'open-living', '7a1e0000-0000-4000-8000-000000000502', 'A bright open living room and kitchen with a lake view', 'approved set #20'),
  photoSample('real-estate', 'home-tour', '7a1e0000-0000-4000-8000-000000000503', 'An agent showing a couple through a sunny living room', 'approved set #21'),
  photoSample('real-estate', 'aerial-neighborhood', '7a1e0000-0000-4000-8000-000000000504', 'An aerial view of a leafy suburban neighborhood near a lake', 'approved set #22'),
  photoSample('real-estate', 'staged-bedroom', '7a1e0000-0000-4000-8000-000000000505', 'A staged primary bedroom with a large window and mountain view', 'approved set #23'),
  photoSample('real-estate', 'pool-dusk', '7a1e0000-0000-4000-8000-000000000506', 'A modern backyard with a lit pool and patio at dusk', 'approved set #24'),
]
/** Home headline (D1 step 5): the kit's default line, never just the name (the name is in the header). */
export const HOME_HEADLINE = 'Your next move, *made simple.*'

const sample = (key: string) => REAL_ESTATE_SAMPLES.find((s) => s.key === key)

const PAGES = [
  { id: 'home', slug: '', title: 'Home', navLabel: 'Home', sectionTypes: ['header', 'hero', 'today', 'about', 'services', 'cta_band', 'gallery', 'testimonials', 'footer'] },
  { id: 'listings', slug: 'listings', title: 'Listings', navLabel: 'Listings', sectionTypes: ['header', 'services', 'gallery', 'cta_band', 'footer'] },
  { id: 'buy', slug: 'buy', title: 'Buying', navLabel: 'Buy', sectionTypes: ['header', 'hero', 'services', 'faq', 'contact_form', 'footer'] },
  { id: 'sell', slug: 'sell', title: 'Selling', navLabel: 'Sell', sectionTypes: ['header', 'hero', 'services', 'faq', 'contact_form', 'footer'] },
  { id: 'about', slug: 'about', title: 'About', navLabel: 'About', sectionTypes: ['header', 'about', 'team', 'testimonials', 'contact_form', 'footer'] },
] as const

function template(ctx: TemplateContext): SiteDocContent {
  const name = ctx.name
  const hero = imageOr(ctx, sample('family-home'))
  const gallery = ctx.gallery?.length ? ctx.gallery : []
  const talk = { kind: 'section', pageId: 'about', sectionId: 'contact-form' } as const
  const value = { kind: 'section', pageId: 'sell', sectionId: 'home-value' } as const
  return {
    kitId: 'real-estate',
    locale: 'en-US',
    business: { name, ...(ctx.phone ? { phone: ctx.phone } : {}), ...(ctx.email ? { email: ctx.email } : {}) },
    nav: { items: PAGES.map((p) => ({ label: p.navLabel, pageId: p.id })), cta: { label: 'Let’s talk', target: talk } },
    pages: [
      {
        id: 'home', slug: '', title: 'Home',
        sections: [
          header('bar', ctx, 'Let’s talk'),
          section('hero', 'hero', 'fullbleed', {
            eyebrow: trimTo(`Real estate${inCity(ctx)}`, 60),
            headline: HOME_HEADLINE,
            subhead: '[[Say who you help and where, like "Helping families buy and sell homes on the west side."]]',
            ...(hero ? { image: hero } : {}),
            primaryCta: { label: 'See listings', target: { kind: 'page', pageId: 'listings' } },
            secondaryCta: { label: 'What’s my home worth?', target: value },
          }),
          section('today', 'today', 'banner', { heading: 'Today', emptyBehavior: 'hide' }),
          section('about', 'intro', 'text-only', { heading: 'Your move, handled', body: paragraphs('[[Write two or three sentences about how you work with buyers and sellers and the areas you know best.]]') }),
          section('services', 'help', 'cards', {
            heading: 'How I can help',
            items: [
              { title: 'Buying a home', body: 'Find the right place, make a strong offer and get to closing without surprises.', icon: 'heart' },
              { title: 'Selling a home', body: 'Price it right, show it well and handle every step to the closing table.', icon: 'star' },
              { title: '[[Another service]]', body: '[[Like first-time buyers, relocation, land or investment property.]]', icon: 'map-pin' },
            ],
          }),
          section('cta_band', 'value-cta', 'solid', { headline: 'Thinking about selling?', body: 'Ask for a free, no-pressure home value review.', cta: { label: 'What’s my home worth?', target: value } }),
          section('gallery', 'home-photos', 'grid', { heading: 'A closer look', images: (ctx.gallery ?? []).slice(0, 6) }, (ctx.gallery ?? []).length < 3),
          section('testimonials', 'reviews', 'cards', { heading: 'What clients say', items: [] }),
          footer(),
        ],
      },
      {
        id: 'listings', slug: 'listings', title: 'Listings',
        sections: [
          header('bar', ctx, 'Let’s talk'),
          section('services', 'listings', 'cards', {
            heading: 'Featured listings',
            intro: '[[Add your current listings: address or area, beds and baths, and one line about each home. Remove any that have sold.]]',
            items: [
              { title: '[[3 bed, 2 bath on Elm Street]]', body: '[[Square feet, lot, and what makes it special.]]', icon: 'map-pin' },
              { title: '[[4 bed, 3 bath near the park]]', body: '[[Square feet, lot, and what makes it special.]]', icon: 'map-pin' },
            ],
          }),
          section('gallery', 'photos', 'grid', { heading: 'Homes we’ve helped with', images: gallery }, gallery.length === 0),
          section('cta_band', 'tour-cta', 'outline', { headline: 'Want to see one?', body: 'Ask for a showing and I’ll set it up.', cta: { label: 'Let’s talk', target: talk } }),
          footer(),
        ],
      },
      {
        id: 'buy', slug: 'buy', title: 'Buying',
        sections: [
          header('bar', ctx, 'Let’s talk'),
          section('hero', 'buy-hero', 'split', {
            eyebrow: 'Buying', headline: 'Find the right home', subhead: 'From the first showing to the keys in your hand.',
            ...(imageOr(ctx, sample('home-tour')) ? { image: imageOr(ctx, sample('home-tour')) } : {}),
            primaryCta: { label: 'Start my search', target: { kind: 'section', pageId: 'buy', sectionId: 'buyer-form' } },
          }),
          section('services', 'buy-steps', 'list', {
            heading: 'How buying works',
            items: [
              { title: 'Talk it through', body: 'What you need, where, and your budget.', icon: 'phone' },
              { title: 'Get ready to buy', body: 'Line up your financing so you can move fast when the right home comes up.', icon: 'calendar' },
              { title: 'Tour and offer', body: 'See homes together, then write an offer that fits the market.', icon: 'map-pin' },
              { title: 'Close', body: 'Inspections, appraisal and paperwork, handled step by step.', icon: 'star' },
            ],
          }),
          section('faq', 'buy-faq', 'accordion', { heading: 'Buyer questions', items: [{ q: 'Does it cost me to work with you as a buyer?', a: paragraphs('[[Explain how your buyer side is paid, in plain words.]]') }] }),
          formSection('buyer-form', name, { heading: 'Start my search', intro: 'Tell me where you want to live and what you need.', formKey: 'buyer', fields: ['name', 'email', 'phone', 'message'], submitLabel: 'Send' }),
          footer(),
        ],
      },
      {
        id: 'sell', slug: 'sell', title: 'Selling',
        sections: [
          header('bar', ctx, 'Let’s talk'),
          section('hero', 'sell-hero', 'split', {
            eyebrow: 'Selling', headline: 'Sell with confidence', subhead: 'Clear pricing, great photos and steady updates until closing.',
            ...(imageOr(ctx, sample('staged-bedroom')) ? { image: imageOr(ctx, sample('staged-bedroom')) } : {}),
            primaryCta: { label: 'What’s my home worth?', target: value },
          }),
          section('services', 'sell-steps', 'list', {
            heading: 'How selling works',
            items: [
              { title: 'Price it right', body: 'A home value review based on recent sales nearby.', icon: 'star' },
              { title: 'Get it ready', body: 'Simple fixes, staging tips and professional photos.', icon: 'heart' },
              { title: 'Market and show', body: 'Get your home in front of serious buyers.', icon: 'users' },
              { title: 'Negotiate and close', body: 'Review offers together and handle every step to closing.', icon: 'calendar' },
            ],
          }),
          section('faq', 'sell-faq', 'accordion', { heading: 'Seller questions', items: [{ q: 'How long will it take to sell?', a: paragraphs('It depends on price, condition and the market. We’ll look at recent sales near you together.') }] }),
          formSection('home-value', name, { heading: 'What’s my home worth?', intro: 'Share your address and a little about the home. I’ll send a value review.', formKey: 'home-value', fields: ['name', 'email', 'phone', 'message'], submitLabel: 'Request my review' }),
          footer(),
        ],
      },
      {
        id: 'about', slug: 'about', title: 'About',
        sections: [
          header('bar', ctx, 'Let’s talk'),
          section('about', 'story', 'right-image', {
            heading: 'About me',
            body: paragraphs('[[Tell your story: how long you’ve been in real estate, the neighborhoods you know, and why clients come back.]]'),
            ...(ctx.heroImage ? { image: ctx.heroImage } : {}),
          }),
          section('team', 'team', 'grid', { heading: 'The team', members: [] }),
          section('testimonials', 'more-reviews', 'single', { heading: 'Client stories', items: [] }),
          formSection('contact-form', name, { heading: 'Let’s talk', formKey: 'contact', fields: ['name', 'email', 'phone', 'message'], submitLabel: 'Send message' }, 'with-details'),
          footer(),
        ],
      },
    ],
    footer: { showHours: false, showAddress: true, showSiteByYakini: true },
    seo: { siteTitle: trimTo(name, 70), description: trimTo(`${name}: real estate${inCity(ctx)}. Listings, help buying and selling, and a free home value review.`, 160) },
  }
}

export const realEstate: KitDefinition = {
  id: 'real-estate',
  name: 'Real estate',
  pageTemplates: PAGES,
  allowedSections: ['header', 'hero', 'about', 'services', 'gallery', 'hours_location', 'testimonials', 'faq', 'team', 'cta_band', 'contact_form', 'booking', 'today', 'footer'],
  defaultVariants: { header: 'bar', hero: 'fullbleed', about: 'right-image', services: 'cards', gallery: 'grid', hours_location: 'split', testimonials: 'cards', faq: 'accordion', team: 'grid', cta_band: 'solid', contact_form: 'simple', booking: 'card', today: 'banner', footer: 'simple' },
  fontPairs: ['editorial', 'classic', 'modern'],
  copyTone: 'Warm, knowledgeable and calm, like a trusted local agent. Talk about homes, neighborhoods and the steps of buying or selling. Never promise a sale price, a timeline or returns, and never describe who should live in a neighborhood.',
  sampleImages: REAL_ESTATE_SAMPLES,
  defaultPalette: { primary: '#22577A', secondary: '#1B232B', accent: '#C9A227' },
  todayKinds: [
    {
      id: 'open_house',
      label: 'Open house',
      fields: z.object({ place: z.string().min(1).max(80), start: HHMM, end: HHMM, note: z.string().max(140).optional() }).strict()
        .refine((f) => f.end > f.start, 'The open house has to end after it starts'),
    },
    noticeKind('new_listing', 'New listing'),
    closedKind('Away today'),
  ],
  template,
}
