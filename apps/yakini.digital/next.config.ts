import type { NextConfig } from "next";

// Portal-first site (Oct 22 2026). Retired pages redirect permanently (308).
// /food-trucks is retired with no redirect: it 404s like any unknown path.
const PORTAL_SIGN_IN = "https://portal.yakini.digital/enter";

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
  async redirects() {
    return [
      { source: "/platforms", destination: "/custom-builds", permanent: true },
      { source: "/platforms/:path*", destination: "/custom-builds", permanent: true },
      { source: "/intelligence", destination: "/#portal", permanent: true },
      { source: "/intelligence/:path*", destination: "/#portal", permanent: true },
      { source: "/process", destination: "/how-it-works", permanent: true },
      { source: "/process/:path*", destination: "/how-it-works", permanent: true },
      { source: "/client", destination: PORTAL_SIGN_IN, permanent: true },
      { source: "/client/:path*", destination: PORTAL_SIGN_IN, permanent: true },
    ];
  },
};

export default nextConfig;
