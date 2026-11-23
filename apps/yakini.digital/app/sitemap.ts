import type { MetadataRoute } from 'next'
import { ALL } from '@/lib/watch'

// Bump this date whenever public page content changes, so search engines re-crawl.
const LAST_MODIFIED = new Date('2026-11-22T00:00:00-07:00')

const PAGES = ['', '/portal', '/contact', '/pricing', '/demo', '/how-it-works', '/custom-builds', '/about', '/apply', '/watch', '/class', '/clase', '/privacy'] as const

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...PAGES.map((path) => ({
      url: `https://yakini.digital${path}`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly' as const,
      priority: path === '' ? 1 : 0.7,
    })),
    ...ALL.map((v) => ({ url: `https://yakini.digital/watch/${v.id}`, lastModified: LAST_MODIFIED, changeFrequency: 'monthly' as const, priority: 0.5 })),
  ]
}
