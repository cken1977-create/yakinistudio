// Public What We Do links and photo slots.
// The homepage used to build /programs/<title-slug>. Those addresses are not
// the program pages, so Learn More returned 404. The addresses below are the
// public program slugs. Photos stay empty until the real files are supplied.

import { config } from '@/config/brand'

export type WhatWeDoLink = {
  title: string
  slug: string
  href: string
  /** Public image path. Null until a photo is supplied for this box. */
  photo: string | null
  photoAlt: string
}

const LINKS: { title: string; slug: string }[] = [
  { title: 'Unsheltered Outreach & Stabilization', slug: 'unsheltered' },
  { title: 'Refugee & Immigrant Services', slug: 'refugee-immigrant' },
  { title: 'Housing Stability', slug: 'housing' },
  { title: 'Youth Mentorship & Education', slug: 'youth' },
  { title: 'Family & Caregiver Support', slug: 'family-caregiver' },
  { title: 'Sankofa Center', slug: 'sankofa-center' },
  { title: 'Readiness Pilot', slug: 'readiness-pilot' },
]

export const WHAT_WE_DO: WhatWeDoLink[] = LINKS.map((item) => ({
  ...item,
  href: `/programs/${item.slug}`,
  photo: null,
  photoAlt: '',
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

export function whatWeDoPhoto(title: string): { src: string; alt: string } | null {
  const item = WHAT_WE_DO.find((entry) => entry.title === title)
  if (!item?.photo) return null
  return { src: item.photo, alt: item.photoAlt }
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

/** Family photo behind Our Mission. Null keeps the current white ground. */
export const missionFamilyPhoto: { src: string | null; alt: string } = {
  src: null,
  alt: 'Families with Vizionz Sankofa',
}

export function legacyTitleSlug(title: string): string {
  return title.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
