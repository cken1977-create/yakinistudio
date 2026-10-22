import type { NextConfig } from "next";

// Portal-first site (Oct 22 2026). Retired pages redirect permanently (308).
// /food-trucks is retired with no redirect: it 404s like any unknown path.
const PORTAL_SIGN_IN = "https://portal.yakini.digital/enter";

const nextConfig: NextConfig = {
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
