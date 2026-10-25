import type { MetadataRoute } from 'next'
import { ALL } from '@/lib/watch'

const PAGES = ['', '/pricing', '/how-it-works', '/custom-builds', '/about', '/apply', '/watch'] as const

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...PAGES.map((path) => ({
      url: `https://yakini.digital${path}`,
      changeFrequency: 'monthly' as const,
      priority: path === '' ? 1 : 0.7,
    })),
    ...ALL.map((v) => ({ url: `https://yakini.digital/watch/${v.id}`, changeFrequency: 'monthly' as const, priority: 0.5 })),
  ]
}
