import type { SiteDocContent } from '@yakini/site-schema'
import { closedKind, footer, formSection, header, imageOr, inCity, noticeKind, paragraphs, photoSample, section, trimTo } from './common'
import type { KitDefinition, SampleImage, TemplateContext } from './types'

/** Trade, career and training schools: programs, class schedule, enroll, about. */
export const TRAINING_SCHOOL_SAMPLES: readonly SampleImage[] = [
  photoSample('training-school', 'classroom', '7a1e0000-0000-4000-8000-000000000801', 'Adult students at desks watching an instructor at the whiteboard', 'approved set #37'),
  photoSample('training-school', 'welding', '7a1e0000-0000-4000-8000-000000000802', 'A student welding steel at a shop table while an instructor watches', 'approved set #38'),
  photoSample('training-school', 'cdl-yard', '7a1e0000-0000-4000-8000-000000000803', 'A training truck driving through a cone course in a practice yard', 'approved set #39'),
  photoSample('training-school', 'study-notes', '7a1e0000-0000-4000-8000-000000000804', 'A student taking notes from a textbook next to a laptop', 'approved set #40'),
  photoSample('training-school', 'graduation', '7a1e0000-0000-4000-8000-000000000805', 'Graduates in caps and gowns tossing their caps in the air', 'approved set #41'),
  photoSample('training-school', 'vitals-lab', '7a1e0000-0000-4000-8000-000000000806', 'A student taking blood pressure on a training manikin in a lab', 'approved set #42'),
]
const sample = (key: string) => TRAINING_SCHOOL_SAMPLES.find((s) => s.key === key)

const PAGES = [
  { id: 'home', slug: '', title: 'Home', navLabel: 'Home', sectionTypes: ['header', 'hero', 'today', 'services', 'about', 'cta_band', 'testimonials', 'footer'] },
  { id: 'programs', slug: 'programs', title: 'Programs', navLabel: 'Programs', sectionTypes: ['header', 'services', 'faq', 'cta_band', 'footer'] },
  { id: 'schedule', slug: 'schedule', title: 'Class schedule', navLabel: 'Schedule', sectionTypes: ['header', 'schedule', 'cta_band', 'footer'] },
  { id: 'about', slug: 'about', title: 'About', navLabel: 'About', sectionTypes: ['header', 'about', 'team', 'gallery', 'footer'] },
  { id: 'enroll', slug: 'enroll', title: 'Enroll', navLabel: 'Enroll', sectionTypes: ['header', 'hero', 'faq', 'contact_form', 'hours_location', 'footer'] },
] as const

function template(ctx: TemplateContext): SiteDocContent {
  const name = ctx.name
  const hero = imageOr(ctx, sample('classroom'))
  const gallery = ctx.gallery?.length ? ctx.gallery : []
  const enroll = { kind: 'section', pageId: 'enroll', sectionId: 'enroll-form' } as const
  return {
    kitId: 'training-school',
    locale: 'en-US',
    business: { name, ...(ctx.phone ? { phone: ctx.phone } : {}), ...(ctx.email ? { email: ctx.email } : {}) },
    nav: { items: PAGES.map((p) => ({ label: p.navLabel, pageId: p.id })), cta: { label: 'Enroll', target: enroll } },
    pages: [
      {
        id: 'home', slug: '', title: 'Home',
        sections: [
          header('bar', ctx, 'Enroll'),
          section('hero', 'hero', 'split', {
            eyebrow: trimTo(`Training${inCity(ctx)}`, 60),
            headline: trimTo(name, 90),
            subhead: '[[Say what students learn and where it leads, like "Hands-on welding training that gets you job-ready in 12 weeks."]]',
            ...(hero ? { image: hero } : {}),
            primaryCta: { label: 'Enroll', target: enroll },
            secondaryCta: { label: 'See programs', target: { kind: 'page', pageId: 'programs' } },
          }),
          section('today', 'today', 'banner', { heading: 'Today', emptyBehavior: 'hide' }),
          section('services', 'programs-summary', 'cards', {
            heading: 'Programs',
            items: [
              { title: '[[Program name]]', body: '[[What students learn, how long it takes, and the certificate they earn.]]', icon: 'star' },
              { title: '[[Program name]]', body: '[[What students learn, how long it takes, and the certificate they earn.]]', icon: 'calendar' },
              { title: '[[Program name]]', body: '[[Add another program, or remove this one.]]', icon: 'users' },
            ],
          }),
          section('about', 'why', 'left-image', {
            heading: 'Learn by doing',
            body: paragraphs('[[Write two or three sentences about your instructors, your hands-on training and how you help students after they finish.]]'),
            ...(imageOr(ctx, sample('welding')) ? { image: imageOr(ctx, sample('welding')) } : {}),
          }),
          section('cta_band', 'enroll-cta', 'solid', { headline: 'Ready to start?', body: 'Ask about the next class and how to enroll.', cta: { label: 'Enroll', target: enroll } }),
          section('testimonials', 'grads', 'cards', { heading: 'What graduates say', items: [] }),
          footer(),
        ],
      },
      {
        id: 'programs', slug: 'programs', title: 'Programs',
        sections: [
          header('bar', ctx, 'Enroll'),
          section('services', 'programs', 'list', {
            heading: 'Programs',
            intro: '[[A line on who your programs are for and what students need to start.]]',
            items: [
              { title: '[[Program name]]', body: '[[Length, schedule (days or nights), what’s covered, and the certificate or license it prepares for.]]', icon: 'star' },
              { title: '[[Program name]]', body: '[[Length, schedule (days or nights), what’s covered, and the certificate or license it prepares for.]]', icon: 'calendar' },
            ],
          }),
          section('faq', 'program-faq', 'accordion', {
            heading: 'Program questions',
            items: [
              { q: 'Do I need experience?', a: paragraphs('[[Say what students need before they start.]]') },
              { q: 'How do I pay for training?', a: paragraphs('[[Explain payment plans or funding you accept. Don’t promise approval.]]') },
            ],
          }),
          section('cta_band', 'programs-cta', 'outline', { headline: 'Questions about a program?', body: 'We’ll walk you through it.', cta: { label: 'Enroll', target: enroll } }),
          footer(),
        ],
      },
      {
        id: 'schedule', slug: 'schedule', title: 'Class schedule',
        sections: [
          header('bar', ctx, 'Enroll'),
          section('schedule', 'classes', 'week', { heading: 'Class times', intro: '[[Add your regular class days and times, and when the next class starts.]]', stops: [] }),
          section('cta_band', 'schedule-cta', 'solid', { headline: 'Save your seat', cta: { label: 'Enroll', target: enroll } }),
          footer(),
        ],
      },
      {
        id: 'about', slug: 'about', title: 'About',
        sections: [
          header('bar', ctx, 'Enroll'),
          section('about', 'story', 'right-image', {
            heading: 'About the school',
            body: paragraphs('[[Tell your story: when you started, who you train, and any approvals or accreditations you really hold.]]'),
            ...(imageOr(ctx, sample('graduation')) ? { image: imageOr(ctx, sample('graduation')) } : {}),
          }),
          section('team', 'instructors', 'grid', { heading: 'Instructors', members: [] }),
          section('gallery', 'gallery', 'grid', { heading: 'Around campus', images: gallery }, gallery.length === 0),
          footer(),
        ],
      },
      {
        id: 'enroll', slug: 'enroll', title: 'Enroll',
        sections: [
          header('bar', ctx, 'Enroll'),
          section('hero', 'enroll-hero', 'minimal', { eyebrow: 'Enroll', headline: 'Start your training', subhead: 'Tell us which program you want. We’ll reply with next steps and start dates.' }),
          section('faq', 'enroll-faq', 'accordion', {
            heading: 'Enrolling',
            items: [{ q: 'What happens after I send this?', a: paragraphs('We’ll contact you about the program, start dates and what to bring on day one.') }],
          }),
          formSection('enroll-form', name, { heading: 'Enroll or ask a question', formKey: 'enroll', fields: ['name', 'email', 'phone', 'service', 'message'], submitLabel: 'Send' }, 'with-details'),
          section('hours_location', 'campus', 'split', { heading: 'Campus hours and location' }),
          footer(),
        ],
      },
    ],
    footer: { showHours: true, showAddress: true, showSiteByYakini: true },
    seo: { siteTitle: trimTo(name, 70), description: trimTo(`${name}: hands-on training${inCity(ctx)}. Programs, class schedule and how to enroll.`, 160) },
  }
}

export const trainingSchool: KitDefinition = {
  id: 'training-school',
  name: 'Training school',
  pageTemplates: PAGES,
  allowedSections: ['header', 'hero', 'about', 'services', 'schedule', 'gallery', 'hours_location', 'testimonials', 'faq', 'team', 'cta_band', 'contact_form', 'booking', 'today', 'footer'],
  defaultVariants: { header: 'bar', hero: 'split', about: 'left-image', services: 'cards', schedule: 'week', gallery: 'grid', hours_location: 'split', testimonials: 'cards', faq: 'accordion', team: 'grid', cta_band: 'solid', contact_form: 'with-details', booking: 'card', today: 'banner', footer: 'simple' },
  fontPairs: ['modern', 'friendly', 'classic'],
  copyTone: 'Encouraging and direct, like an instructor on the first day. Say what students learn, how long it takes and what it prepares them for. Never promise jobs, pay, pass rates, licenses or financial aid; only name approvals the school really has.',
  sampleImages: TRAINING_SCHOOL_SAMPLES,
  defaultPalette: { primary: '#3E5C76', secondary: '#1D2731', accent: '#F0A202' },
  todayKinds: [
    noticeKind('enrolling', 'Now enrolling'),
    noticeKind('notice', 'Student notice'),
    closedKind('No classes today'),
  ],
  template,
}
