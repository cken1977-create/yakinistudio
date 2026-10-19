import type { NextConfig } from "next";
import { PORTAL_LOGIN_URL, PORTAL_START_URL } from "./lib/pricing";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/signup', destination: PORTAL_START_URL, permanent: false },
      { source: '/get-started', destination: PORTAL_START_URL, permanent: false },
      { source: '/login', destination: PORTAL_LOGIN_URL, permanent: false },
    ]
  },
};

export default nextConfig;
