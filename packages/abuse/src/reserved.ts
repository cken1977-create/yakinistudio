/** Reserved subdomains (spec 13.3). Never assignable as a site slug. */
export const RESERVED_SUBDOMAINS = new Set([
  'www', 'portal', 'studio', 'app', 'api', 'admin', 'ops', 'demo', 'mail', 'email', 'smtp', 'imap', 'pop', 'mx',
  'ftp', 'cdn', 'static', 'assets', 'img', 'images', 'docs', 'help', 'support', 'status', 'blog', 'shop', 'store',
  'pay', 'billing', 'checkout', 'login', 'signin', 'auth', 'account', 'dashboard', 'academy', 'class', 'sign',
  'preview', 'staging', 'dev', 'test', 'beta', 'new', 'ns1', 'ns2', '_dmarc', '_domainkey', 'autodiscover',
  'yakini', 'brsa',
  // Subdomains in use on yakini.digital (Namecheap DNS, checked 2026-11-24): composer, mission, portal,
  // sign, studio, www, plus `send` (email sending). Add new ones here or in RESERVED_SUBDOMAINS.
  'mission', 'composer', 'send', 'resend',
])

/** Prefixes kept for the studio's own use: anonymous drafts get `draft-<hex>` (Phase 1). */
export const RESERVED_PREFIXES = ['draft-'] as const

export const SLUG_RE = /^[a-z0-9][a-z0-9-]{2,39}$/

export function slugProblem(slug: string, extra: string | undefined = undefined): string | null {
  if (!SLUG_RE.test(slug)) return 'Use 3 to 40 lowercase letters, numbers or dashes, starting with a letter or number.'
  if (slug.endsWith('-') || slug.includes('--')) return 'That address has a dash in an odd spot.'
  const extras = new Set((extra ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean))
  if (RESERVED_SUBDOMAINS.has(slug) || extras.has(slug) || RESERVED_PREFIXES.some((p) => slug.startsWith(p))) return 'That address is reserved. Please pick another.'
  return null
}
