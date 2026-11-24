/**
 * Studio Content-Security-Policy. A fresh nonce is minted per request in proxy.ts
 * so Next.js can attach it to its own scripts, which lets us drop script-src
 * 'unsafe-inline'. style-src uses the same nonce for <style> tags; React style
 * attributes (the editor tour highlight) are allowed via style-src-attr only.
 * Client-site responses get a stricter CSP from the renderer in Phase 3.
 */
export type StudioCspOptions = {
  isDev?: boolean
  posthogHost?: string
}

const NONCE_RE = /^[A-Za-z0-9+/_=-]+$/

export function buildStudioCsp(nonce: string, opts: StudioCspOptions = {}): string {
  if (!NONCE_RE.test(nonce)) throw new Error('invalid csp nonce')
  const posthogHost = (opts.posthogHost || '').trim()
  const connect = ["'self'", 'https://*.ingest.sentry.io', 'https://*.ingest.us.sentry.io', posthogHost].filter(Boolean).join(' ')
  const script = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", opts.isDev ? "'unsafe-eval'" : ''].filter(Boolean).join(' ')
  return [
    "default-src 'self'",
    `script-src ${script}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src ${connect}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ')
}
