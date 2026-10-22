import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/dashboard', '/sign/', '/api/'] },
    sitemap: 'https://yakini.digital/sitemap.xml',
  }
}
