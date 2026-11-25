import type { SiteDocContent } from '@yakini/site-schema'
import { closedKind, footer, formSection, header, imageOr, inCity, noticeKind, paragraphs, photoSample, section, trimTo } from './common'
import type { KitDefinition, SampleImage, TemplateContext } from './types'

/** Oilfield service companies: services, safety, careers, about, request service. */
export const OILFIELD_SAMPLES: readonly SampleImage[] = [
  photoSample('oilfield', 'pumpjack', '7a1e0000-0000-4000-8000-000000001001', 'A pumpjack silhouetted against a sunset', 'approved set #55'),
  photoSample('oilfield', 'wellhead-crew', '7a1e0000-0000-4000-8000-000000001002', 'Two workers in hard hats working on a wellhead', 'approved set #56'),
  photoSample('oilfield', 'drill-rig', '7a1e0000-0000-4000-8000-000000001003', 'A tall drilling rig at a well site in the desert', 'approved set #57'),
  photoSample('oilfield', 'lease-road', '7a1e0000-0000-4000-8000-000000001004', 'Service pickups and a tank truck on a dusty lease road', 'approved set #58'),
  photoSample('oilfield', 'valve-wrench', '7a1e0000-0000-4000-8000-000000001005', 'A worker’s gloved hands turning a valve with a pipe wrench', 'approved set #59'),
  photoSample('oilfield', 'tank-battery', '7a1e0000-0000-4000-8000-000000001006', 'Storage tanks and separators at a well site at sunset', 'approved set #60'),
]
const sample = (key: string) => OILFIELD_SAMPLES.find((s) => s.key === key)

const PAGES = [
  { id: 'home', slug: '', title: 'Home', navLabel: 'Home', sectionTypes: ['header', 'hero', 'today', 'services', 'about', 'cta_band', 'testimonials', 'footer'] },
  { id: 'services', slug: 'services', title: 'Services', navLabel: 'Services', sectionTypes: ['header', 'services', 'gallery', 'cta_band', 'footer'] },
  { id: 'safety', slug: 'safety', title: 'Safety', navLabel: 'Safety', sectionTypes: ['header', 'about', 'services', 'faq', 'footer'] },
  { id: 'careers', slug: 'careers', title: 'Careers', navLabel: 'Careers', sectionTypes: ['header', 'hero', 'services', 'contact_form', 'footer'] },
  { id: 'contact', slug: 'contact', title: 'Request service', navLabel: 'Contact', sectionTypes: ['header', 'contact_form', 'about', 'team', 'hours_location', 'footer'] },
] as const

function template(ctx: TemplateContext): SiteDocContent {
  const name = ctx.name
  const hero = imageOr(ctx, sample('drill-rig'))
  const gallery = ctx.gallery?.length ? ctx.gallery : []
  const request = { kind: 'section', pageId: 'contact', sectionId: 'service-form' } as const
  return {
    kitId: 'oilfield',
    locale: 'en-US',
    business: { name, ...(ctx.phone ? { phone: ctx.phone } : {}), ...(ctx.email ? { email: ctx.email } : {}) },
    nav: { items: PAGES.map((p) => ({ label: p.navLabel, pageId: p.id })), cta: { label: 'Request service', target: request } },
    pages: [
      {
        id: 'home', slug: '', title: 'Home',
        sections: [
          header('bar', ctx, 'Request service'),
          section('hero', 'hero', 'fullbleed', {
            eyebrow: trimTo(`Oilfield services${inCity(ctx)}`, 60),
            headline: trimTo(name, 90),
            subhead: '[[Say what you do and where, like "Well servicing and roustabout crews across the Permian Basin, around the clock."]]',
            ...(hero ? { image: hero } : {}),
            primaryCta: { label: 'Request service', target: request },
            secondaryCta: { label: 'Our services', target: { kind: 'page', pageId: 'services' } },
          }),
          section('today', 'today', 'banner', { heading: 'Today', emptyBehavior: 'hide' }),
          section('services', 'services-summary', 'cards', {
            heading: 'What we do',
            items: [
              { title: '[[Well servicing]]', body: '[[The work your crews do and the equipment you run.]]', icon: 'flame' },
              { title: '[[Roustabout crews]]', body: '[[Lease maintenance, construction and repairs.]]', icon: 'users' },
              { title: '[[Hauling]]', body: '[[Water, equipment or pipe, or remove this.]]', icon: 'truck' },
            ],
          }),
          section('about', 'why', 'left-image', {
            heading: 'Safe, ready and on location',
            body: paragraphs('[[Write two or three sentences about your crews, your response times and your safety record. Real facts only.]]'),
            ...(imageOr(ctx, sample('wellhead-crew')) ? { image: imageOr(ctx, sample('wellhead-crew')) } : {}),
          }),
          section('cta_band', 'service-cta', 'solid', { headline: 'Need a crew?', body: 'Tell us the location and the job. We’ll call you back.', cta: { label: 'Request service', target: request } }),
          section('testimonials', 'reviews', 'cards', { heading: 'What operators say', items: [] }),
          footer(),
        ],
      },
      {
        id: 'services', slug: 'services', title: 'Services',
        sections: [
          header('bar', ctx, 'Request service'),
          section('services', 'services', 'list', {
            heading: 'Services',
            intro: '[[A line on the basins or counties you work and whether you run 24/7.]]',
            items: [
              { title: '[[Service name]]', body: '[[What it includes and the equipment you bring.]]', icon: 'flame' },
              { title: '[[Service name]]', body: '[[What it includes and the equipment you bring.]]', icon: 'truck' },
              { title: '[[Service name]]', body: '[[Add another service, or remove this one.]]', icon: 'clock' },
            ],
          }),
          section('gallery', 'gallery', 'grid', { heading: 'In the field', images: gallery }, gallery.length === 0),
          section('cta_band', 'services-cta', 'outline', { headline: 'Have a job coming up?', cta: { label: 'Request service', target: request } }),
          footer(),
        ],
      },
      {
        id: 'safety', slug: 'safety', title: 'Safety',
        sections: [
          header('bar', ctx, 'Request service'),
          section('about', 'safety', 'right-image', {
            heading: 'Safety comes first',
            body: paragraphs('[[Describe your safety program: training, meetings, and how you stop work when something isn’t right.]]'),
            ...(imageOr(ctx, sample('valve-wrench')) ? { image: imageOr(ctx, sample('valve-wrench')) } : {}),
          }),
          section('services', 'credentials', 'list', {
            heading: 'Training and credentials',
            intro: 'Only list programs and memberships you really hold.',
            items: [
              { title: '[[Safety training]]', body: '[[The courses your crews complete.]]', icon: 'star' },
              { title: '[[Compliance]]', body: '[[Registrations or networks you belong to, or remove this.]]', icon: 'heart' },
            ],
          }),
          section('faq', 'safety-faq', 'accordion', { heading: 'Safety questions', items: [{ q: 'Can we see your safety paperwork?', a: paragraphs('Yes. Ask us and we’ll send what your company needs.') }] }),
          footer(),
        ],
      },
      {
        id: 'careers', slug: 'careers', title: 'Careers',
        sections: [
          header('bar', ctx, 'Request service'),
          section('hero', 'careers-hero', 'split', {
            eyebrow: 'Careers', headline: 'Join our crew', subhead: '[[Say what positions you hire for and what a rotation or schedule looks like.]]',
            ...(imageOr(ctx, sample('lease-road')) ? { image: imageOr(ctx, sample('lease-road')) } : {}),
            primaryCta: { label: 'Apply', target: { kind: 'section', pageId: 'careers', sectionId: 'apply-form' } },
          }),
          section('services', 'positions', 'list', {
            heading: 'Open positions',
            items: [
              { title: '[[Position]]', body: '[[What the job is and what you need to apply.]]', icon: 'users' },
              { title: '[[Position]]', body: '[[What the job is and what you need to apply.]]', icon: 'users' },
            ],
          }),
          formSection('apply-form', name, { heading: 'Apply', intro: 'Tell us the job you want and your experience. We’ll call you back.', formKey: 'apply', fields: ['name', 'phone', 'email', 'service', 'message'], submitLabel: 'Send' }),
          footer(),
        ],
      },
      {
        id: 'contact', slug: 'contact', title: 'Request service',
        sections: [
          header('bar', ctx, 'Request service'),
          formSection('service-form', name, { heading: 'Request service', intro: 'Include the lease or location, the work needed and when.', formKey: 'service-request', fields: ['name', 'phone', 'email', 'service', 'message'], submitLabel: 'Send request' }, 'with-details'),
          section('about', 'story', 'text-only', { heading: 'About us', body: paragraphs('[[Tell your story: when you started, where you work and who runs the crews.]]') }),
          section('team', 'team', 'grid', { heading: 'Leadership', members: [] }),
          section('hours_location', 'yard', 'split', { heading: 'Yard and office' }),
          footer(),
        ],
      },
    ],
    footer: { showHours: true, showAddress: true, showSiteByYakini: true },
    seo: { siteTitle: trimTo(name, 70), description: trimTo(`${name}: oilfield services${inCity(ctx)}. Services, safety, careers and service requests.`, 160) },
  }
}

export const oilfield: KitDefinition = {
  id: 'oilfield',
  name: 'Oilfield',
  pageTemplates: PAGES,
  allowedSections: ['header', 'hero', 'about', 'services', 'gallery', 'hours_location', 'testimonials', 'faq', 'team', 'cta_band', 'contact_form', 'today', 'footer'],
  defaultVariants: { header: 'bar', hero: 'fullbleed', about: 'left-image', services: 'cards', gallery: 'grid', hours_location: 'split', testimonials: 'cards', faq: 'accordion', team: 'grid', cta_band: 'solid', contact_form: 'with-details', today: 'banner', footer: 'simple' },
  fontPairs: ['modern', 'classic'],
  copyTone: 'Direct, capable and safety-minded, like a field supervisor briefing an operator. Name the real services, equipment and areas worked. Never invent safety statistics, certifications, memberships or response times.',
  sampleImages: OILFIELD_SAMPLES,
  defaultPalette: { primary: '#1F3A5F', secondary: '#121A24', accent: '#E07A1F' },
  todayKinds: [
    noticeKind('hiring', 'Now hiring'),
    noticeKind('notice', 'Field notice'),
    closedKind('Office closed today'),
  ],
  template,
}
