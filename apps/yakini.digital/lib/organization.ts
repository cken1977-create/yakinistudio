// Public facts about Yakini Digital used by the footer, the About page and the
// Organization structured data (JSON-LD). Only links verified live on Nov 20 2026.

export const SITE_URL = 'https://yakini.digital'
export const OFFICE_PHONE = '+1-346-623-2199'
export const HELLO_EMAIL = 'hello@yakini.digital'

// Official Yakini Digital profiles (each verified to load and to be Yakini's own).
export const SOCIAL_LINKS = [
  { id: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/yakini.digital' },
  { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/company/yakini-digital' },
  { id: 'x', label: 'X', href: 'https://x.com/yakiniog77' },
  { id: 'youtube', label: 'YouTube', href: 'https://www.youtube.com/@yakiniog77' },
] as const

// Portal terms are the site terms; yakini.digital/terms redirects there (next.config.ts).
export const TERMS_URL = 'https://portal.yakini.digital/terms'

// TODO(Clarence): location is undecided. When it is, fill this in with a schema.org
// PostalAddress, e.g. { '@type': 'PostalAddress', addressLocality: '…', addressRegion: '…',
// addressCountry: 'US' }. While it is null, no address or location is published in the JSON-LD.
export const ORGANIZATION_ADDRESS: Record<string, string> | null = null

export function organizationJsonLd() {
  const org: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'Yakini Digital',
    alternateName: 'Yakini',
    url: SITE_URL,
    logo: `${SITE_URL}/yakini-lockup.jpg`,
    image: `${SITE_URL}/art/founder-clarence.jpg`,
    email: HELLO_EMAIL,
    telephone: OFFICE_PHONE,
    founder: { '@type': 'Person', name: 'Clarence Kennedy', jobTitle: 'Founder & CEO', url: `${SITE_URL}/about` },
    parentOrganization: { '@type': 'Organization', name: 'BRSA Holdings, Inc.' },
    contactPoint: [{ '@type': 'ContactPoint', contactType: 'customer service', telephone: OFFICE_PHONE, email: HELLO_EMAIL, availableLanguage: ['English'] }],
    sameAs: SOCIAL_LINKS.map((s) => s.href),
  }
  if (ORGANIZATION_ADDRESS) org.address = ORGANIZATION_ADDRESS
  return org
}
