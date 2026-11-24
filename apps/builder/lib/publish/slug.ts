import { IMPERSONATION_NAMES, slugProblem } from '@yakini/abuse'

/** Subdomains (spec 5.6 step 4, 13.2, 13.3). */
export const DEFAULT_ROOT_DOMAIN = 'yakini.digital'

/** A first suggestion from the business name: lowercase letters, digits and single dashes. */
export function suggestSlug(name: string): string {
  const base = name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/, '')
  return base.length >= 3 ? base : `${base || 'site'}-site`.slice(0, 40)
}

export const hostnameFor = (slug: string, root = DEFAULT_ROOT_DOMAIN) => `${slug}.${root}`

/** A plain-English problem with the slug, or null. `taken` is checked by the caller against the database. */
export function slugError(slug: string, extraReserved: string | undefined, taken: boolean): string | null {
  const problem = slugProblem(slug, extraReserved)
  if (problem) return problem
  // A big brand's own name is never an address (13.3). Names that only contain one are checked by the review gate.
  if (BRAND_SLUGS.has(slug)) return 'That address is reserved. Please pick another.'
  return taken ? 'That address is taken. Please pick another.' : null
}

const BRAND_SLUGS = new Set(IMPERSONATION_NAMES.map((n) => n.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')))
