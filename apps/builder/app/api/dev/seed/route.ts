import { createHash, randomUUID } from 'node:crypto'
import { brandFor, buildKitDraft, kitDefinition } from '@yakini/kits'
import { loadSiteDoc } from '@yakini/site-schema'
import foodTruckEvery from '@yakini/site-schema/fixtures/v1/food-truck-every-section.json'
import restaurantEvery from '@yakini/site-schema/fixtures/v1/restaurant-every-section.json'
import { DRAFT_TTL_SECONDS, draftCookieHeader, hashDraftToken, newDraftToken } from '@/lib/server/draft-token'
import { getRuntime, isTestMode } from '@/lib/server/runtime'

/**
 * Test mode only (BUILDER_TEST_MODE=1, refused on Vercel): make an anonymous draft from a fixture
 * and hand this browser its cookie, so the browser tests can open the editor on a site with every
 * section without going through the whole hand-off each time. Anywhere else: 404.
 */
export const dynamic = 'force-dynamic'

/** The kit draft with every [[fill this in]] spot filled: ready to publish. */
function readyKit(name: string, extra: (d: Record<string, any>) => void = () => {}, kitId: 'food-truck' | 'restaurant' = 'food-truck') { // eslint-disable-line @typescript-eslint/no-explicit-any
  const kit = kitDefinition(kitId)!
  const fill = (v: unknown): unknown => typeof v === 'string' ? v.replace(/\[\[[^\]]{1,200}\]\]/g, 'Fresh tacos daily')
    : Array.isArray(v) ? v.map(fill) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fill(x)])) : v
  const doc = fill(buildKitDraft(kit, { name, city: 'El Paso' }, brandFor(kit, { colors: { primary: '#9A3412', secondary: '#15130F', accent: '#F59E0B' } }))) as Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
  doc.business.phone = '+19155550142'
  doc.business.hours = [{ day: 'tue', open: '11:00', close: '20:00' }, { day: 'sat', open: '10:00', close: '21:00' }]
  doc.seo.description = `${name} in El Paso.`
  extra(doc)
  return doc
}

const FIXTURES: Record<string, () => unknown> = {
  'kit-ready': () => readyKit('Mesa Street Tacos'),
  'restaurant-ready': () => readyKit('Casa Lupita Kitchen', () => {}, 'restaurant'),
  // Spec 16.4 impersonation fixture: a "Secure Bank" page asking visitors to verify their account.
  'impersonation': () => readyKit('Secure Bank', (d) => { d.business.tagline = 'Verify your account to keep your card active' }),
  'food-truck-every-section': () => foodTruckEvery,
  'restaurant-every-section': () => restaurantEvery,
  'kit-food-truck': () => {
    const kit = kitDefinition('food-truck')!
    return buildKitDraft(kit, { name: 'Mesa Street Tacos', city: 'Austin' }, brandFor(kit, { colors: { primary: '#9A3412', secondary: '#15130F', accent: '#F59E0B' } }))
  },
}

export async function POST(request: Request): Promise<Response> {
  if (!isTestMode()) return new Response('Not found', { status: 404 })
  const name = new URL(request.url).searchParams.get('fixture') ?? ''
  const make = FIXTURES[name]
  if (!make) return new Response('Unknown fixture', { status: 400 })
  const rt = getRuntime()
  const doc = loadSiteDoc(structuredClone(make())).doc
  const tenantId = randomUUID(), siteId = randomUUID(), token = newDraftToken()
  await rt.store.createTenant({ id: tenantId, name: doc.business.name, kitId: doc.kitId })
  await rt.store.createDraft({
    tenantId, siteId, slug: `draft-${siteId.slice(0, 8)}`, kitId: doc.kitId, doc,
    docSha256: createHash('sha256').update(JSON.stringify(doc)).digest('hex'),
    tokenHash: hashDraftToken(token, rt.draftPepper), expiresAt: new Date(Date.now() + DRAFT_TTL_SECONDS * 1000), sourceUrl: null,
  })
  return new Response(JSON.stringify({ siteId }), { status: 201, headers: { 'content-type': 'application/json', 'set-cookie': draftCookieHeader(siteId, token) } })
}
