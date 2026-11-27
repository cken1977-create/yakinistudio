import { designFixtures } from '@yakini/kits/design-fixtures'
import { loadSiteDoc } from '@yakini/site-schema'
import foodTruckEvery from '@yakini/site-schema/fixtures/v1/food-truck-every-section.json'
import foodTruckMinimal from '@yakini/site-schema/fixtures/v1/food-truck-minimal.json'
import restaurantEvery from '@yakini/site-schema/fixtures/v1/restaurant-every-section.json'
import restaurantMinimal from '@yakini/site-schema/fixtures/v1/restaurant-minimal.json'
import foodTruckEveryV2 from '@yakini/site-schema/fixtures/v2/food-truck-every-section.json'
import restaurantEveryV2 from '@yakini/site-schema/fixtures/v2/restaurant-every-section.json'
import { isTestMode } from '@/lib/server/runtime'
import { siteRenderer } from '@/lib/site/renderer'

/**
 * Test mode only (BUILDER_TEST_MODE=1, refused on Vercel): the design-quality harness. Renders any
 * design fixture (`<kit>-rich`, `<kit>-sparse`), v1 fixture or v2 fixture (`v2-<name>`) with the same
 * standalone renderer as published sites, so the gallery, axe and Lighthouse see exactly what a
 * visitor gets (no framework JavaScript). `?mode=draft` renders the draft's visitor preview.
 * Anywhere else this is a plain 404.
 */
export const dynamic = 'force-dynamic'

const V1: Record<string, unknown> = {
  'food-truck-every-section': foodTruckEvery, 'food-truck-minimal': foodTruckMinimal,
  'restaurant-every-section': restaurantEvery, 'restaurant-minimal': restaurantMinimal,
  'v2-food-truck-every-section': foodTruckEveryV2, 'v2-restaurant-every-section': restaurantEveryV2,
}

function fixtureByName(name: string): unknown {
  const design = designFixtures()
  return Object.hasOwn(design, name) ? design[name] : Object.hasOwn(V1, name) ? V1[name] : null
}

const notFound = () => new Response('Not found', { status: 404 })

export async function GET(request: Request, { params }: { params: Promise<{ name: string; path?: string[] }> }): Promise<Response> {
  if (!isTestMode()) return notFound()
  const { name, path } = await params
  const raw = fixtureByName(name)
  if (!raw) return notFound()
  const { doc } = loadSiteDoc(structuredClone(raw))
  const page = doc.pages.find((p) => p.slug === (path ?? []).join('/'))
  if (!page) return notFound()
  const mode = new URL(request.url).searchParams.get('mode') === 'draft' ? 'draft' : 'live'
  const r = siteRenderer()
  const headline = mode === 'live' ? await r.headlineFont(doc) : null
  const html = r.renderFixturePage({ doc, pageId: page.id, mode, base: `/dev-site/${name}`, headline, nonce: request.headers.get('x-nonce') })
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } })
}
