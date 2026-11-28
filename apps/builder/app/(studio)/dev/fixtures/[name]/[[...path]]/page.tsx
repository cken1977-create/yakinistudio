import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SiteView, type RenderContext } from '@yakini/sections'
import '@yakini/sections/fonts.css'
import '@yakini/sections/styles.css'
import { loadSiteDoc } from '@yakini/site-schema'
import foodTruckEvery from '@yakini/site-schema/fixtures/v1/food-truck-every-section.json'
import foodTruckMinimal from '@yakini/site-schema/fixtures/v1/food-truck-minimal.json'
import restaurantEvery from '@yakini/site-schema/fixtures/v1/restaurant-every-section.json'
import restaurantMinimal from '@yakini/site-schema/fixtures/v1/restaurant-minimal.json'
import { draftImage } from '@/lib/draft/preview'
import { imageOptions } from '@/lib/images/resolve'
import { isTestMode } from '@/lib/server/runtime'

/**
 * Test mode only (BUILDER_TEST_MODE=1, refused on Vercel): renders every v1 fixture so the browser
 * tests can check every section and variant at 390 and 1280, with and without JavaScript
 * (acceptance: visual snapshots). Anywhere else this route is a plain 404.
 */
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { robots: { index: false, follow: false } }

const FIXTURES: Record<string, unknown> = {
  'food-truck-every-section': foodTruckEvery, 'food-truck-minimal': foodTruckMinimal,
  'restaurant-every-section': restaurantEvery, 'restaurant-minimal': restaurantMinimal,
}

type Props = { params: Promise<{ name: string; path?: string[] }>; searchParams: Promise<{ mode?: string }> }

export default async function FixturePreview({ params, searchParams }: Props) {
  if (!isTestMode()) notFound()
  const [{ name, path }, { mode }] = await Promise.all([params, searchParams])
  const raw = Object.hasOwn(FIXTURES, name) ? FIXTURES[name] : null
  if (!raw) notFound()
  const { doc } = loadSiteDoc(raw)
  const page = doc.pages.find((p) => p.slug === (path ?? []).join('/'))
  if (!page) notFound()
  const renderMode: RenderContext['mode'] = mode === 'live' || mode === 'export' ? mode : 'draft'
  const ctx: RenderContext = {
    doc, page, mode: renderMode,
    hrefForPage: (p) => `/dev/fixtures/${name}${p.slug ? `/${p.slug}` : ''}`,
    // Fixture photos are stand-ins: anything that is not a kit sample shows the first kit sample.
    image: (id) => draftImage('fixture', id, new Set(), undefined, imageOptions(doc)) ?? draftImage('fixture', '7a1e0000-0000-4000-8000-000000000101', new Set(), undefined, imageOptions(doc)),
    formAction: (key) => (renderMode === 'live' ? `/api/forms/${key}` : null),
    reportUrl: renderMode === 'live' ? '/report' : null,
    today: null,
  }
  return <SiteView ctx={ctx} />
}
