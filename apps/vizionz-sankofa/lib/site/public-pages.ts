// Public What We Do links and community photo slots.
// The homepage used to build /programs/<title-slug>. Those addresses are not
// the program pages, so Learn More returned 404. The addresses below are the
// public program slugs. Card photos are community scenes, not proof of who
// participates in a program.

import { config } from '@/config/brand'

export type WhatWeDoLink = {
  title: string
  slug: string
  href: string
  /** Public image path. Null until a photo is supplied for this box. */
  photo: string | null
  photoAlt: string
  illustrative?: boolean
  credit?: string
  creditHref?: string
}

/** Stock photo for Housing Stability. Models, not clients. See housing-illustrative-credit.txt. */
export const HOUSING_ILLUSTRATION = {
  src: '/community/housing-illustrative.jpg',
  alt: 'Illustrative photo of a family together at home.',
  illustrative: true,
  credit: 'William Fortunato / Pexels',
  creditHref: 'https://www.pexels.com/photo/smiling-multiracial-parents-with-little-daughter-on-sofa-6393119/',
  license: 'Pexels License',
  licenseHref: 'https://www.pexels.com/license/',
} as const

const LINKS: { title: string; slug: string; photo: string | null; photoAlt: string; illustrative?: boolean; credit?: string; creditHref?: string }[] = [
  {
    title: 'Unsheltered Outreach & Stabilization',
    slug: 'unsheltered',
    photo: '/community/outdoor-supplies.jpg',
    photoAlt: 'People organizing supplies on tables outside a community building.',
  },
  {
    title: 'Refugee & Immigrant Services',
    slug: 'refugee-immigrant',
    photo: '/community/gathering-room.jpg',
    photoAlt: 'People gathered in a community room.',
  },
  {
    title: 'Housing Stability',
    slug: 'housing',
    photo: HOUSING_ILLUSTRATION.src,
    photoAlt: HOUSING_ILLUSTRATION.alt,
    illustrative: true,
    credit: HOUSING_ILLUSTRATION.credit,
    creditHref: HOUSING_ILLUSTRATION.creditHref,
  },
  {
    title: 'Youth Mentorship & Education',
    slug: 'youth',
    photo: '/community/seated-panel.jpg',
    photoAlt: 'People seated together at a community gathering.',
  },
  {
    title: 'Family & Caregiver Support',
    slug: 'family-caregiver',
    photo: '/community/large-group.jpg',
    photoAlt: 'A large group gathered in a community room.',
  },
  {
    title: 'Sankofa Center',
    slug: 'sankofa-center',
    photo: '/community/four-people.jpg',
    photoAlt: 'Four people standing together indoors.',
  },
  {
    title: 'Readiness Pilot',
    slug: 'readiness-pilot',
    photo: '/community/meeting-tables.jpg',
    photoAlt: 'People seated around tables in a community room.',
  },
]

export const WHAT_WE_DO: WhatWeDoLink[] = LINKS.map((item) => ({
  ...item,
  href: `/programs/${item.slug}`,
}))

/** Footer program links. Each one is a What We Do page, not a guessed title. */
export const FOOTER_PROGRAM_LINKS = [
  { label: 'Unsheltered Outreach', href: '/programs/unsheltered' },
  { label: 'Refugee & Immigrant', href: '/programs/refugee-immigrant' },
  { label: 'Housing Stability', href: '/programs/housing' },
  { label: 'Youth & Education', href: '/programs/youth' },
] as const

/** Header destinations. Each href is a page that exists in this app. */
export const HEADER_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Programs', href: '/programs' },
  { label: 'Events', href: '/gallery' },
  { label: 'Coalition', href: '/partners' },
  { label: 'Stories', href: '/voices' },
  { label: 'Contact', href: '/contact' },
] as const

/**
 * Footer labels. An entry without href is text only.
 * Leadership and Volunteer have no public page, so they are not links.
 */
export const FOOTER_ABOUT = [
  { label: 'Our Story', href: '/about' },
  { label: 'Leadership' },
  { label: 'Coalition', href: '/partners' },
  { label: 'Events', href: '/gallery' },
] as const

export const FOOTER_ENGAGE = [
  { label: 'Get Help', href: '/get-help' },
  { label: 'Donate', href: '/contact' },
  { label: 'Volunteer' },
  { label: 'Contact', href: '/contact' },
] as const

export function footerHrefs(): string[] {
  const hrefs: string[] = []
  for (const item of [...FOOTER_ABOUT, ...FOOTER_PROGRAM_LINKS, ...FOOTER_ENGAGE]) {
    if ('href' in item) hrefs.push(item.href)
  }
  return hrefs
}

export function whatWeDoHref(title: string): string {
  return WHAT_WE_DO.find((item) => item.title === title)?.href ?? '/programs'
}

export function whatWeDoPhoto(title: string): {
  src: string
  alt: string
  illustrative?: boolean
  credit?: string
  creditHref?: string
} | null {
  const item = WHAT_WE_DO.find((entry) => entry.title === title)
  if (!item?.photo) return null
  return {
    src: item.photo,
    alt: item.photoAlt,
    illustrative: item.illustrative,
    credit: item.credit,
    creditHref: item.creditHref,
  }
}

export type BrandProgram = {
  slug: string
  title: string
  description: string
  features: string[]
}

export function brandProgramBySlug(slug: string): BrandProgram | null {
  const link = WHAT_WE_DO.find((item) => item.slug === slug)
  if (!link) return null
  const service = config.services.items.find((item) => item.title === link.title)
  if (!service) return null
  return {
    slug,
    title: service.title,
    description: service.description,
    features: service.features ?? [],
  }
}

/** Community photo above Our Mission. The type stays on the white section below. */
export const missionFamilyPhoto: { src: string | null; alt: string } = {
  src: '/community/gathering-celebration.jpg',
  alt: 'People gathered together at a community celebration.',
}

/**
 * Kept in the project for a later placement. Not shown on a page.
 * The file stays as supplied. The site does not name anyone in it.
 */
export const RESERVED_COMMUNITY_PHOTOS = [
  { src: '/community/three-people.jpg' },
] as const

export type ProgramFigure = {
  src: string
  alt: string
  fit: 'contain' | 'natural'
  illustrative?: boolean
  credit?: string
  creditHref?: string
}

const SERVICES_FLYER: ProgramFigure = {
  src: '/community/services-flyer.jpg',
  alt: 'Vizionz Sankofa flyer listing community services.',
  fit: 'contain',
}

/** Photos for a program page, in order. Group photos use the whole frame. */
export function programFigures(slug: string): ProgramFigure[] {
  const figures: ProgramFigure[] = []
  const card = WHAT_WE_DO.find((item) => item.slug === slug)
  if (card?.photo) {
    figures.push({
      src: card.photo,
      alt: card.photoAlt,
      fit: 'natural',
      illustrative: card.illustrative,
      credit: card.credit,
      creditHref: card.creditHref,
    })
  }
  if (slug === 'unsheltered' || slug === 'sankofa-center') figures.push(SERVICES_FLYER)
  return figures
}

/** First program photo, or null when the page has none. */
export function programFigure(slug: string): ProgramFigure | null {
  return programFigures(slug)[0] ?? null
}

export const COMMUNITY_GALLERY = [
  { src: '/community/gathering-celebration.jpg', alt: 'People gathered together at a community celebration.' },
  { src: '/community/gathering-room.jpg', alt: 'People gathered in a community room.' },
  { src: '/community/outdoor-supplies.jpg', alt: 'People organizing supplies on tables outside a community building.' },
  { src: '/community/large-group.jpg', alt: 'A large group gathered in a community room.' },
  { src: '/community/four-people.jpg', alt: 'Four people standing together indoors.' },
  { src: '/community/seated-panel.jpg', alt: 'People seated together at a community gathering.' },
  { src: '/community/meeting-tables.jpg', alt: 'People seated around tables in a community room.' },
  { src: '/community/group-indoors.jpg', alt: 'A group gathered indoors.' },
  { src: '/community/people-with-bags.jpg', alt: 'People standing together indoors.' },
  { src: '/community/outdoor-group.jpg', alt: 'A group gathered outside a community building.' },
  { src: '/community/food-tables.jpg', alt: 'Tables set with food in a community room.' },
  { src: '/community/meeting-room.jpg', alt: 'People meeting around tables in a community room.' },
] as const

export const STAFF_BANNER = {
  src: '/community/food-tables.jpg',
  alt: 'Tables set with food in a community room.',
} as const

export const STAFF_LOGIN_PHOTO = {
  src: '/community/people-with-bags.jpg',
  alt: 'People standing together indoors.',
} as const

export function legacyTitleSlug(title: string): string {
  return title.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
