import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs/config'

// Studio CSP is minted per request in proxy.ts (nonce + strict-dynamic) so Next.js
// can attach the nonce to its own scripts. Other security headers stay here.
// Client-site responses get a stricter CSP from the renderer in Phase 3.

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Published pages are rendered by a standalone bundle loaded at runtime (lib/site/renderer.ts);
  // make sure the deployed function carries it.
  outputFileTracingIncludes: { '/_site/[host]/[[...path]]': ['./.site-renderer/**'], '/%5Fsite/[host]/[[...path]]': ['./.site-renderer/**'] },
  transpilePackages: ['@yakini/site-schema', '@yakini/sections', '@yakini/edits', '@yakini/kits', '@yakini/brand', '@yakini/ai', '@yakini/pricing', '@yakini/abuse', '@yakini/visits'],
  async headers() {
    return [
      {
        // Published-site stylesheet and fonts: the page links site.css?v=<deploy>, so a day is safe.
        source: '/_site-assets/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        source: '/:path*',
        headers: [
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
