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
// Clarence's personal LinkedIn (founder profile; connected in Buffer).
export const FOUNDER_LINKEDIN = 'https://www.linkedin.com/in/clarence-kennedy-819a0a5a'

export const TERMS_URL = 'https://portal.yakini.digital/terms'

// Location (Clarence, Nov 20 2026: "Everything Albuquerque"). City-level only; no street
// address is published yet. Add streetAddress / postalCode here once one is chosen.
export const ORGANIZATION_ADDRESS: Record<string, string> | null = {
  '@type': 'PostalAddress',
  addressLocality: 'Albuquerque',
  addressRegion: 'NM',
  addressCountry: 'US',
}

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
    founder: { '@type': 'Person', name: 'Clarence Kennedy', jobTitle: 'Founder & CEO', url: `${SITE_URL}/about`, sameAs: [FOUNDER_LINKEDIN] },
    parentOrganization: { '@type': 'Organization', name: 'BRSA Holdings, Inc.' },
    contactPoint: [{ '@type': 'ContactPoint', contactType: 'customer service', telephone: OFFICE_PHONE, email: HELLO_EMAIL, availableLanguage: ['English'] }],
    sameAs: SOCIAL_LINKS.map((s) => s.href),
  }
  if (ORGANIZATION_ADDRESS) org.address = ORGANIZATION_ADDRESS
  return org
}
