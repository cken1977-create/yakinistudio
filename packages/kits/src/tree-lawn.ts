import type { SiteDocContent } from '@yakini/site-schema'
import { closedKind, footer, formSection, header, imageOr, inCity, noticeKind, paragraphs, photoSample, section, trimTo } from './common'
import type { KitDefinition, SampleImage, TemplateContext } from './types'

/** Tree service, lawn care and landscaping crews: services, our work, about, free estimate. */
export const TREE_LAWN_SAMPLES: readonly SampleImage[] = [
  photoSample('tree-lawn', 'arborist-cut', '7a1e0000-0000-4000-8000-000000000601', 'An arborist in a helmet and harness cutting a large branch', 'approved set #25'),
  photoSample('tree-lawn', 'striped-lawn', '7a1e0000-0000-4000-8000-000000000602', 'A freshly mowed striped lawn in front of a stone house', 'approved set #26'),
  photoSample('tree-lawn', 'chipper-crew', '7a1e0000-0000-4000-8000-000000000603', 'A bucket truck and wood chipper at a home while a worker feeds branches', 'approved set #27'),
  photoSample('tree-lawn', 'edging-path', '7a1e0000-0000-4000-8000-000000000604', 'A landscaper edging the lawn along a stone garden path', 'approved set #28'),
  photoSample('tree-lawn', 'crane-lift', '7a1e0000-0000-4000-8000-000000000605', 'A crane lifting a cut tree section over a house as the crew watches', 'approved set #29'),
  photoSample('tree-lawn', 'backyard-beds', '7a1e0000-0000-4000-8000-000000000606', 'A landscaped backyard with fresh mulch, trimmed shrubs and a patio', 'approved set #30'),
]
const sample = (key: string) => TREE_LAWN_SAMPLES.find((s) => s.key === key)
const img = (key: string) => {
  const s = sample(key)
  return s ? { assetId: s.assetId, alt: s.alt } : undefined
}

const PAGES = [
  { id: 'home', slug: '', title: 'Home', navLabel: 'Home', sectionTypes: ['header', 'hero', 'today', 'services', 'about', 'cta_band', 'testimonials', 'footer'] },
  { id: 'services', slug: 'services', title: 'Services', navLabel: 'Services', sectionTypes: ['header', 'services', 'faq', 'cta_band', 'footer'] },
  { id: 'work', slug: 'our-work', title: 'Our work', navLabel: 'Our work', sectionTypes: ['header', 'gallery', 'testimonials', 'cta_band', 'footer'] },
  { id: 'about', slug: 'about', title: 'About', navLabel: 'About', sectionTypes: ['header', 'about', 'team', 'footer'] },
  { id: 'estimate', slug: 'estimate', title: 'Free estimate', navLabel: 'Estimate', sectionTypes: ['header', 'contact_form', 'hours_location', 'footer'] },
] as const

function template(ctx: TemplateContext): SiteDocContent {
  const name = ctx.name
  const hero = imageOr(ctx, sample('arborist-cut'))
  const estimate = { kind: 'section', pageId: 'estimate', sectionId: 'estimate-form' } as const
  const ownPhotos = ctx.gallery?.length ? ctx.gallery : []
  const work = ownPhotos.length ? ownPhotos : (['striped-lawn', 'backyard-beds', 'crane-lift', 'edging-path'].map((k) => img(k)).filter(Boolean) as { assetId: string; alt: string }[])
  return {
    kitId: 'tree-lawn',
    locale: 'en-US',
    business: { name, ...(ctx.phone ? { phone: ctx.phone } : {}), ...(ctx.email ? { email: ctx.email } : {}) },
    nav: { items: PAGES.map((p) => ({ label: p.navLabel, pageId: p.id })), cta: { label: 'Free estimate', target: estimate } },
    pages: [
      {
        id: 'home', slug: '', title: 'Home',
        sections: [
          header('bar', ctx, 'Free estimate'),
          section('hero', 'hero', 'fullbleed', {
            eyebrow: trimTo(`Tree and lawn care${inCity(ctx)}`, 60),
            headline: trimTo(name, 90),
            subhead: '[[Say what you do in one sentence, like "Safe tree removal, trimming and weekly mowing, done right the first time."]]',
            ...(hero ? { image: hero } : {}),
            primaryCta: { label: 'Get a free estimate', target: estimate },
            secondaryCta: { label: 'Our services', target: { kind: 'page', pageId: 'services' } },
          }),
          section('today', 'today', 'banner', { heading: 'Today', emptyBehavior: 'hide' }),
          section('services', 'services-summary', 'cards', {
            heading: 'What we do',
            items: [
              { title: 'Tree trimming and removal', body: '[[Say what you handle, from small trims to big removals.]]', icon: 'leaf' },
              { title: 'Lawn care', body: '[[Mowing, edging and cleanup. Say how often you come.]]', icon: 'calendar' },
              { title: '[[Landscaping]]', body: '[[Beds, mulch, shrubs or stump grinding, or remove this.]]', icon: 'star' },
            ],
          }),
          section('about', 'why', 'left-image', {
            heading: 'Careful crews, clean yards',
            body: paragraphs('[[Write two or three sentences about your crew, how you work safely and how you leave the yard when you’re done.]]'),
            ...(img('chipper-crew') ? { image: img('chipper-crew') } : {}),
          }),
          section('cta_band', 'estimate-cta', 'solid', { headline: 'Get a free estimate', body: 'Tell us about your yard and we’ll come take a look.', cta: { label: 'Get a free estimate', target: estimate } }),
          section('testimonials', 'reviews', 'cards', { heading: 'What neighbors say', items: [] }),
          footer(),
        ],
      },
      {
        id: 'services', slug: 'services', title: 'Services',
        sections: [
          header('bar', ctx, 'Free estimate'),
          section('services', 'services', 'list', {
            heading: 'Services',
            intro: '[[Add a line about your area and season, like "Serving the east side, March through November."]]',
            items: [
              { title: 'Tree trimming', body: 'Shaping and thinning for healthy, safe trees.', icon: 'leaf' },
              { title: 'Tree removal', body: '[[Say how you remove trees near homes and wires, and what happens to the wood.]]', icon: 'truck' },
              { title: 'Mowing and edging', body: '[[Weekly or every other week. Say what’s included.]]', icon: 'calendar' },
              { title: '[[Seasonal cleanup]]', body: '[[Leaves, storm cleanup or snow, or remove this.]]', icon: 'clock' },
            ],
          }),
          section('faq', 'faq', 'accordion', {
            heading: 'Questions',
            items: [
              { q: 'Are you insured?', a: paragraphs('[[Say what insurance or licenses you carry.]]') },
              { q: 'Do you clean up after the job?', a: paragraphs('[[Say how you clean up: hauling branches, raking, blowing off drives.]]') },
            ],
          }),
          section('cta_band', 'services-cta', 'outline', { headline: 'Not sure what you need?', body: 'We’ll look and give you a clear price before any work starts.', cta: { label: 'Get a free estimate', target: estimate } }),
          footer(),
        ],
      },
      {
        id: 'work', slug: 'our-work', title: 'Our work',
        sections: [
          header('bar', ctx, 'Free estimate'),
          section('gallery', 'gallery', 'grid', { heading: 'Recent work', images: work }),
          section('testimonials', 'stories', 'single', { heading: 'From our customers', items: [] }),
          section('cta_band', 'work-cta', 'solid', { headline: 'Want your yard to look like this?', cta: { label: 'Get a free estimate', target: estimate } }),
          footer(),
        ],
      },
      {
        id: 'about', slug: 'about', title: 'About',
        sections: [
          header('bar', ctx, 'Free estimate'),
          section('about', 'story', 'right-image', {
            heading: 'About us',
            body: paragraphs('[[Tell your story: how you started, how long you’ve served the area and what you care about.]]'),
            ...(ctx.heroImage ? { image: ctx.heroImage } : {}),
          }),
          section('team', 'team', 'grid', { heading: 'The crew', members: [] }),
          footer(),
        ],
      },
      {
        id: 'estimate', slug: 'estimate', title: 'Free estimate',
        sections: [
          header('bar', ctx, 'Free estimate'),
          formSection('estimate-form', name, { heading: 'Get a free estimate', intro: 'Tell us what you need and the address. We’ll reply to set up a time to look.', formKey: 'estimate', fields: ['name', 'phone', 'email', 'service', 'message'], submitLabel: 'Request estimate' }, 'with-details'),
          section('hours_location', 'area', 'split', { heading: 'Hours and service area' }),
          footer(),
        ],
      },
    ],
    footer: { showHours: true, showAddress: true, showSiteByYakini: true },
    seo: { siteTitle: trimTo(name, 70), description: trimTo(`${name}: tree and lawn care${inCity(ctx)}. Trimming, removal, mowing and free estimates.`, 160) },
  }
}

export const treeLawn: KitDefinition = {
  id: 'tree-lawn',
  name: 'Tree and lawn',
  pageTemplates: PAGES,
  allowedSections: ['header', 'hero', 'about', 'services', 'schedule', 'gallery', 'hours_location', 'testimonials', 'faq', 'team', 'cta_band', 'contact_form', 'booking', 'today', 'footer'],
  defaultVariants: { header: 'bar', hero: 'fullbleed', about: 'left-image', services: 'cards', schedule: 'list', gallery: 'grid', hours_location: 'split', testimonials: 'cards', faq: 'accordion', team: 'grid', cta_band: 'solid', contact_form: 'with-details', booking: 'card', today: 'banner', footer: 'simple' },
  fontPairs: ['friendly', 'modern', 'classic'],
  copyTone: 'Down-to-earth and dependable, like a crew lead talking to a homeowner over the fence. Name the actual work: trimming, removal, mowing, cleanup. Short sentences; stress safety, clean-up and a clear price before work starts.',
  sampleImages: TREE_LAWN_SAMPLES,
  defaultPalette: { primary: '#2F6B3F', secondary: '#16241A', accent: '#E3B341' },
  todayKinds: [
    noticeKind('booking', 'Now booking'),
    noticeKind('weather', 'Weather update'),
    closedKind('No crews out today'),
  ],
  template,
}
