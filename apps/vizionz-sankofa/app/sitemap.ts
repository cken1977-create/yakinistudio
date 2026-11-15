import type { MetadataRoute } from 'next'
import { config } from '@/config/brand'

const site = config.seo.siteUrl.replace(/\/$/, '')

// Public marketing routes only. Staff, auth, API, and tokenized funder pages stay off the sitemap.
const routes = [
  '/',
  '/about',
  '/programs',
  '/services',
  '/get-help',
  '/gallery',
  '/voices',
  '/partners',
  '/portfolio',
  '/contact',
]

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((path) => ({
    url: path === '/' ? `${site}/` : `${site}${path}`,
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : 0.7,
  }))
}
