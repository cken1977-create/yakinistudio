// Where Yakini's client portal lives. Sign-up (/start) and log-in (/enter) happen there.
// A preview deploy can point at a portal preview with NEXT_PUBLIC_PORTAL_URL.
export const PORTAL_URL = (process.env.NEXT_PUBLIC_PORTAL_URL || 'https://portal.yakini.digital').replace(/\/+$/, '')

/** Self-serve sign-up. `kit` = a plan id from the portal's kit offers (e.g. "operate", "operate-plus"). */
export function getStartedHref(kit?: string): string {
  return `${PORTAL_URL}/start${kit ? `?kit=${encodeURIComponent(kit)}` : ''}`
}

/** Returning clients: one-time email link, no password. */
export const LOGIN_HREF = `${PORTAL_URL}/enter`

/** Industries shown on the site. Open to any industry nationwide; "Other" is always there. */
export const OPEN_INDUSTRIES = [
  'Home & field services',
  'Landscaping & tree care',
  'Construction & remodeling',
  'Trucking & logistics',
  'Oil field & energy',
  'Restaurants, hospitality & events',
  'Health & wellness',
  'Beauty, salon & spa',
  'Professional offices',
  'Real estate & property',
  'Auto repair & dealerships',
  'Cleaning & janitorial',
  'Retail & shops',
  'Education & training',
  'Nonprofits & community',
  'Other: tell us what you do',
]
