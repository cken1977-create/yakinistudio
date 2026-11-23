import type { MetadataRoute } from 'next'

// Phase 0: the studio is not launched; nothing is indexable.
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', disallow: '/' }] }
}
