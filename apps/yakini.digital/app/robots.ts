import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/dashboard', '/sign/', '/api/', '/class/watch', '/clase/ver', '/class/unsubscribe', '/clase/baja'] },
    sitemap: 'https://yakini.digital/sitemap.xml',
  }
}
