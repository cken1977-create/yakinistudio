import type { SiteDocContent } from '@yakini/site-schema'
import { closedKind, footer, formSection, header, imageOr, inCity, noticeKind, paragraphs, photoSample, section, trimTo } from './common'
import type { KitDefinition, SampleImage, TemplateContext } from './types'

/** Nonprofits, ministries and community groups: mission, programs, get involved, about, contact. */
export const NONPROFIT_SAMPLES: readonly SampleImage[] = [
  photoSample('nonprofit', 'food-boxes', '7a1e0000-0000-4000-8000-000000000701', 'Volunteers packing fresh produce and canned food into boxes', 'approved set #31'),
  photoSample('nonprofit', 'community-circle', '7a1e0000-0000-4000-8000-000000000702', 'Community members sitting in a circle during a group meeting', 'approved set #32'),
  photoSample('nonprofit', 'garden-volunteers', '7a1e0000-0000-4000-8000-000000000703', 'Volunteers in matching shirts planting a neighborhood garden', 'approved set #34'),
]
/** Home headline (D1 step 5): the kit's default line, never just the name (the name is in the header). */
export const HOME_HEADLINE = 'Stronger together, *starting here.*'

const sample = (key: string) => NONPROFIT_SAMPLES.find((s) => s.key === key)

const PAGES = [
  { id: 'home', slug: '', title: 'Home', navLabel: 'Home', sectionTypes: ['header', 'hero', 'today', 'about', 'services', 'cta_band', 'gallery', 'testimonials', 'footer'] },
  { id: 'programs', slug: 'programs', title: 'Programs', navLabel: 'Programs', sectionTypes: ['header', 'services', 'schedule', 'faq', 'footer'] },
  { id: 'involved', slug: 'get-involved', title: 'Get involved', navLabel: 'Get involved', sectionTypes: ['header', 'hero', 'services', 'contact_form', 'footer'] },
  { id: 'about', slug: 'about', title: 'About', navLabel: 'About', sectionTypes: ['header', 'about', 'team', 'gallery', 'footer'] },
  { id: 'contact', slug: 'contact', title: 'Contact', navLabel: 'Contact', sectionTypes: ['header', 'contact_form', 'hours_location', 'footer'] },
] as const

function template(ctx: TemplateContext): SiteDocContent {
  const name = ctx.name
  const hero = imageOr(ctx, sample('garden-volunteers'))
  const gallery = ctx.gallery?.length ? ctx.gallery : []
  const involved = { kind: 'page', pageId: 'involved' } as const
  const volunteer = { kind: 'section', pageId: 'involved', sectionId: 'volunteer-form' } as const
  return {
    kitId: 'nonprofit',
    locale: 'en-US',
    business: { name, ...(ctx.phone ? { phone: ctx.phone } : {}), ...(ctx.email ? { email: ctx.email } : {}) },
    nav: { items: PAGES.map((p) => ({ label: p.navLabel, pageId: p.id })), cta: { label: 'Get involved', target: involved } },
    pages: [
      {
        id: 'home', slug: '', title: 'Home',
        sections: [
          header('bar', ctx, 'Get involved'),
          section('hero', 'hero', 'split', {
            ...(ctx.city ? { eyebrow: trimTo(`Serving ${ctx.city}`, 60) } : {}),
            headline: HOME_HEADLINE,
            subhead: '[[State your mission in one sentence, like "Making sure no family in our county goes hungry."]]',
            ...(hero ? { image: hero } : {}),
            primaryCta: { label: 'Get involved', target: involved },
            secondaryCta: { label: 'Our programs', target: { kind: 'page', pageId: 'programs' } },
          }),
          section('today', 'today', 'banner', { heading: 'Today', emptyBehavior: 'hide' }),
          section('about', 'mission', 'text-only', { heading: 'Our mission', body: paragraphs('[[Write two or three sentences on who you serve, the need you meet, and the change you’re working toward.]]') }),
          section('services', 'programs-summary', 'cards', {
            heading: 'What we do',
            items: [
              { title: '[[Your main program]]', body: '[[Who it serves and what it provides.]]', icon: 'heart' },
              { title: '[[A second program]]', body: '[[Who it serves and what it provides.]]', icon: 'users' },
              { title: '[[A third program]]', body: '[[Add another program, or remove this one.]]', icon: 'gift' },
            ],
          }),
          section('cta_band', 'involved-cta', 'solid', { headline: 'Join us', body: 'Volunteer, give or partner with us. Every bit helps.', cta: { label: 'Get involved', target: involved } }),
          section('gallery', 'home-photos', 'grid', { heading: 'A closer look', images: (ctx.gallery ?? []).slice(0, 6) }, (ctx.gallery ?? []).length < 3),
          section('testimonials', 'stories', 'single', { heading: 'Stories from our community', items: [] }),
          footer(),
        ],
      },
      {
        id: 'programs', slug: 'programs', title: 'Programs',
        sections: [
          header('bar', ctx, 'Get involved'),
          section('services', 'programs', 'list', {
            heading: 'Programs',
            intro: '[[A line on who can take part and whether there is any cost.]]',
            items: [
              { title: '[[Program name]]', body: '[[What happens, who it’s for, and how to sign up.]]', icon: 'heart' },
              { title: '[[Program name]]', body: '[[What happens, who it’s for, and how to sign up.]]', icon: 'users' },
            ],
          }),
          section('schedule', 'schedule', 'list', { heading: 'When we meet', intro: '[[Add regular days and times, like a weekly food pantry or meeting.]]', stops: [] }),
          section('faq', 'faq', 'accordion', {
            heading: 'Questions',
            items: [{ q: 'Who can get help?', a: paragraphs('[[Explain who is eligible and what to bring, in plain words.]]') }],
          }),
          footer(),
        ],
      },
      {
        id: 'involved', slug: 'get-involved', title: 'Get involved',
        sections: [
          header('bar', ctx, 'Get involved'),
          section('hero', 'involved-hero', 'split', {
            eyebrow: 'Get involved', headline: 'Lend a hand', subhead: 'There’s a place for everyone, whatever time you have.',
            ...(imageOr(ctx, sample('food-boxes')) ? { image: imageOr(ctx, sample('food-boxes')) } : {}),
            primaryCta: { label: 'Volunteer', target: volunteer },
          }),
          section('services', 'ways', 'cards', {
            heading: 'Ways to help',
            items: [
              { title: 'Volunteer', body: '[[Say what volunteers do and how often.]]', icon: 'users' },
              { title: 'Give', body: '[[Say how people can give: online, by check or in person.]]', icon: 'heart' },
              { title: 'Partner with us', body: '[[Businesses, churches and groups: say how you work together.]]', icon: 'star' },
            ],
          }),
          formSection('volunteer-form', name, { heading: 'Sign up to help', intro: 'Tell us how you’d like to help and we’ll be in touch.', formKey: 'volunteer', fields: ['name', 'email', 'phone', 'service', 'message'], submitLabel: 'Sign me up' }),
          footer(),
        ],
      },
      {
        id: 'about', slug: 'about', title: 'About',
        sections: [
          header('bar', ctx, 'Get involved'),
          section('about', 'story', 'right-image', {
            heading: 'Our story',
            body: paragraphs('[[Tell how you started, who you serve, and what you’ve done so far. Real numbers only.]]'),
            ...(imageOr(ctx, sample('community-circle')) ? { image: imageOr(ctx, sample('community-circle')) } : {}),
          }),
          section('team', 'team', 'grid', { heading: 'Our people', members: [] }),
          section('gallery', 'gallery', 'grid', { heading: 'In the community', images: gallery }, gallery.length === 0),
          footer(),
        ],
      },
      {
        id: 'contact', slug: 'contact', title: 'Contact',
        sections: [
          header('bar', ctx, 'Get involved'),
          formSection('contact-form', name, { heading: 'Contact us', formKey: 'contact', fields: ['name', 'email', 'phone', 'message'], submitLabel: 'Send message' }, 'with-details'),
          section('hours_location', 'hours', 'split', { heading: 'Hours and location' }),
          footer(),
        ],
      },
    ],
    footer: { showHours: true, showAddress: true, showSiteByYakini: true },
    seo: { siteTitle: trimTo(name, 70), description: trimTo(`${name}${inCity(ctx)}: our mission, programs, and how to volunteer or give.`, 160) },
  }
}

export const nonprofit: KitDefinition = {
  id: 'nonprofit',
  name: 'Nonprofit',
  pageTemplates: PAGES,
  allowedSections: ['header', 'hero', 'about', 'services', 'schedule', 'gallery', 'hours_location', 'testimonials', 'faq', 'team', 'cta_band', 'contact_form', 'catering_request', 'today', 'footer', 'ticker', 'stats', 'feature_rows'],
  defaultVariants: { header: 'bar', hero: 'split', about: 'right-image', services: 'cards', schedule: 'list', gallery: 'grid', hours_location: 'split', testimonials: 'single', faq: 'accordion', team: 'grid', cta_band: 'solid', contact_form: 'simple', catering_request: 'simple', today: 'banner', footer: 'simple' },
  fontPairs: ['friendly', 'editorial', 'modern'],
  copyTone: 'Hopeful, humble and concrete, like a volunteer coordinator welcoming someone new. Lead with the people served and the work done. Real numbers only, no guilt, no exaggerated claims; respect the dignity of the people you serve.',
  sampleImages: NONPROFIT_SAMPLES,
  defaultPalette: { primary: '#6B2D5C', secondary: '#21131D', accent: '#F2B705' },
  todayKinds: [
    noticeKind('event', 'Event today'),
    noticeKind('need', 'What we need today'),
    closedKind(),
  ],
  template,
}
