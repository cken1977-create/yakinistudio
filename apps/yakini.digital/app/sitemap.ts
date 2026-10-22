import type { MetadataRoute } from 'next'

const PAGES = ['', '/pricing', '/how-it-works', '/custom-builds', '/about', '/apply'] as const

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((path) => ({
    url: `https://yakini.digital${path}`,
    changeFrequency: 'monthly',
    priority: path === '' ? 1 : 0.7,
  }))
}
