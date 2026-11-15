import type { MetadataRoute } from 'next'
import { config } from '@/config/brand'

const site = config.seo.siteUrl.replace(/\/$/, '')

// Public marketing routes only. Portal, pay, and API stay off the sitemap.
const routes = [
  '/',
  '/menu',
  '/food-truck',
  '/catering',
  '/events',
  '/about',
  '/contact',
  '/services',
  '/portfolio',
]

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((path) => ({
    url: path === '/' ? `${site}/` : `${site}${path}`,
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : 0.7,
  }))
}
