import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { designFixtures } from '@yakini/kits/design-fixtures'
import { SiteView, type RenderContext } from '@yakini/sections'
import '@yakini/sections/fonts.css'
import '@yakini/sections/styles.css'
import { loadSiteDoc } from '@yakini/site-schema'
import foodTruckEvery from '@yakini/site-schema/fixtures/v1/food-truck-every-section.json'
import foodTruckMinimal from '@yakini/site-schema/fixtures/v1/food-truck-minimal.json'
import restaurantEvery from '@yakini/site-schema/fixtures/v1/restaurant-every-section.json'
import restaurantMinimal from '@yakini/site-schema/fixtures/v1/restaurant-minimal.json'
import { draftImage } from '@/lib/draft/preview'
import { isTestMode } from '@/lib/server/runtime'

/**
 * Test mode only (BUILDER_TEST_MODE=1, refused on Vercel): the design-quality harness (D1). Renders
 * any design fixture (`<kit>-rich`, `<kit>-sparse`) or v1 fixture the way a client site renders:
 * outside the studio layout (no studio scripts or styles), in published (`?mode=live`, the default)
 * or draft preview (`?mode=draft`) mode. Used by the design gallery, axe and Lighthouse runs.
 * Anywhere else this is a plain 404.
 */
export const metadata: Metadata = { robots: { index: false, follow: false }, icons: { icon: 'data:,' } }

const V1: Record<string, unknown> = {
  'food-truck-every-section': foodTruckEvery, 'food-truck-minimal': foodTruckMinimal,
  'restaurant-every-section': restaurantEvery, 'restaurant-minimal': restaurantMinimal,
}
const FALLBACK_IMAGE = '7a1e0000-0000-4000-8000-000000000101'

type Props = { params: Promise<{ name: string; path?: string[] }>; searchParams: Promise<{ mode?: string }> }

function fixtureByName(name: string): unknown {
  const design = designFixtures()
  return Object.hasOwn(design, name) ? design[name] : Object.hasOwn(V1, name) ? V1[name] : null
}

export default async function DevSite({ params, searchParams }: Props) {
  await connection() // per-request render, like the real renderer (CSP nonce)
  if (!isTestMode()) notFound()
  const [{ name, path }, { mode }] = await Promise.all([params, searchParams])
  const raw = fixtureByName(name)
  if (!raw) notFound()
  const { doc } = loadSiteDoc(structuredClone(raw))
  const page = doc.pages.find((p) => p.slug === (path ?? []).join('/'))
  if (!page) notFound()
  const renderMode: RenderContext['mode'] = mode === 'draft' ? 'draft' : 'live'
  const q = renderMode === 'draft' ? '?mode=draft' : ''
  const ctx: RenderContext = {
    doc, page, mode: renderMode,
    hrefForPage: (p) => `/dev-site/${name}${p.slug ? `/${p.slug}` : ''}${q}`,
    // Kit samples resolve to their real files; v1 fixture stand-ins show the first food truck photo.
    image: (id) => draftImage('fixture', id, new Set()) ?? draftImage('fixture', FALLBACK_IMAGE, new Set()),
    formAction: (key) => (renderMode === 'live' ? `/api/forms/${key}` : null),
    reportUrl: renderMode === 'live' ? '/report' : null,
    today: null,
  }
  return <SiteView ctx={ctx} />
}
