import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

// Portal-first site (Oct 22 2026). Retired pages redirect permanently (308).
// /food-trucks is retired with no redirect: it 404s like any unknown path.
const PORTAL_SIGN_IN = "https://portal.yakini.digital/enter";
const IMMERSIVE_ORIGIN = "https://yakini-immersive-concept.vercel.app";

// /watch videos stream from the public video store. This header only limits
// where video and audio may load from on those pages; nothing else changes.
const WATCH_MEDIA_CSP = "media-src 'self' https://ec22ch0piqcoe7i7.public.blob.vercel-storage.com"

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: '/watch', headers: [{ key: 'Content-Security-Policy', value: WATCH_MEDIA_CSP }] },
      { source: '/watch/:path*', headers: [{ key: 'Content-Security-Policy', value: WATCH_MEDIA_CSP }] },
    ]
  },
  // Home page (Nov 9 2026, Clarence approved): / is the immersive walkthrough, built and deployed
  // from its own project (yakini-immersive-concept) and served here through rewrites so every other
  // yakini.digital path keeps running in this app. Its static files live under /assets, /audio,
  // /rooms, /ad and /favicon.svg (none of which exist in this app). The old home is now /portal.
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: `${IMMERSIVE_ORIGIN}/` },
        { source: "/assets/:path*", destination: `${IMMERSIVE_ORIGIN}/assets/:path*` },
        { source: "/audio/:path*", destination: `${IMMERSIVE_ORIGIN}/audio/:path*` },
        { source: "/rooms/:path*", destination: `${IMMERSIVE_ORIGIN}/rooms/:path*` },
        { source: "/ad/:path*", destination: `${IMMERSIVE_ORIGIN}/ad/:path*` },
        { source: "/favicon.svg", destination: `${IMMERSIVE_ORIGIN}/favicon.svg` },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  async redirects() {
    return [
      { source: "/platforms", destination: "/custom-builds", permanent: true },
      { source: "/platforms/:path*", destination: "/custom-builds", permanent: true },
      { source: "/intelligence", destination: "/portal#portal", permanent: true },
      { source: "/intelligence/:path*", destination: "/portal#portal", permanent: true },
      { source: "/process", destination: "/how-it-works", permanent: true },
      { source: "/process/:path*", destination: "/how-it-works", permanent: true },
      { source: "/client", destination: PORTAL_SIGN_IN, permanent: true },
      { source: "/client/:path*", destination: PORTAL_SIGN_IN, permanent: true },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG ?? "yakini",
  project: process.env.SENTRY_PROJECT ?? "yakini-digital",
  // Only print source-map upload logs in CI
  silent: !process.env.CI,
  // Skip source-map upload unless SENTRY_AUTH_TOKEN is present (follow-up)
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
