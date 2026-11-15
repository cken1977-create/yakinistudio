import type { MetadataRoute } from 'next'
import { config } from '@/config/brand'

const site = config.seo.siteUrl.replace(/\/$/, '')

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/portal', '/pay', '/api/'],
    },
    sitemap: `${site}/sitemap.xml`,
  }
}
