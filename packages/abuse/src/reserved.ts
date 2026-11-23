/** Reserved subdomains (spec 13.3). Never assignable as a site slug. */
export const RESERVED_SUBDOMAINS = new Set([
  'www', 'portal', 'studio', 'app', 'api', 'admin', 'ops', 'demo', 'mail', 'email', 'smtp', 'imap', 'pop', 'mx',
  'ftp', 'cdn', 'static', 'assets', 'img', 'images', 'docs', 'help', 'support', 'status', 'blog', 'shop', 'store',
  'pay', 'billing', 'checkout', 'login', 'signin', 'auth', 'account', 'dashboard', 'academy', 'class', 'sign',
  'preview', 'staging', 'dev', 'test', 'beta', 'new', 'ns1', 'ns2', '_dmarc', '_domainkey', 'autodiscover',
  'yakini', 'brsa',
  // Subdomains already in use on yakini.digital (refresh from Vercel/DNS before Phase 3, OPEN_QUESTIONS O-6).
  'mission',
])

export const SLUG_RE = /^[a-z0-9][a-z0-9-]{2,39}$/

export function slugProblem(slug: string, extra: string | undefined = undefined): string | null {
  if (!SLUG_RE.test(slug)) return 'Use 3 to 40 lowercase letters, numbers or dashes, starting with a letter or number.'
  if (slug.endsWith('-') || slug.includes('--')) return 'That address has a dash in an odd spot.'
  const extras = new Set((extra ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean))
  if (RESERVED_SUBDOMAINS.has(slug) || extras.has(slug)) return 'That address is reserved. Please pick another.'
  return null
}
