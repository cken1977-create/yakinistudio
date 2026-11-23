import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs/config'

// Studio Content-Security-Policy (spec 13.5/14.6). Client-site responses get a stricter CSP
// from the renderer in Phase 3. Phase 0 allows inline scripts that Next.js needs for
// hydration; nonce-based CSP is tracked in OPEN_QUESTIONS.md (O-9).
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || ''
const connect = ["'self'", 'https://*.ingest.sentry.io', 'https://*.ingest.us.sentry.io', posthogHost].filter(Boolean).join(' ')
const isProd = process.env.NODE_ENV === 'production'
const STUDIO_CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src ${connect}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ')

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@yakini/site-schema', '@yakini/sections', '@yakini/kits', '@yakini/brand', '@yakini/ai', '@yakini/pricing', '@yakini/abuse', '@yakini/visits'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: STUDIO_CSP },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000' }, // no includeSubDomains: client custom domains are served here too
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  telemetry: false,
})
