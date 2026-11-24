import { randomUUID } from 'node:crypto'
import { brandFor, buildKitDraft, kitDefinition } from '@yakini/kits'
import { loadSiteDoc, type SiteDoc } from '@yakini/site-schema'

/**
 * A pretend browser for route tests: a cookie jar behind next/headers (wire it with
 * `vi.mock('next/headers', async () => (await import('./browser')).headersMock)`), requests from
 * the studio origin, and helpers that leave things as the real flows would.
 */
export const jar = new Map<string, string>()
export const headersMock = {
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    set: (name: string, value: string, opts?: { maxAge?: number }) => { if (opts?.maxAge === 0 || value === '') jar.delete(name); else jar.set(name, value) },
    delete: (name: string) => jar.delete(name),
  }),
}

export const STUDIO = 'https://studio.yakini.digital'
let ip = 0
export const freshIp = () => `198.51.100.${(++ip % 250) + 1}`

export function form(path: string, fields: Record<string, string>, headers: Record<string, string> = {}) {
  return new Request(`${STUDIO}${path}`, {
    method: 'POST', body: new URLSearchParams(fields),
    headers: { origin: STUDIO, 'content-type': 'application/x-www-form-urlencoded', 'x-forwarded-for': freshIp(), ...headers },
  })
}

export function api(method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
  return new Request(`${STUDIO}${path}`, {
    method, body: body === undefined ? undefined : JSON.stringify(body),
    headers: { origin: STUDIO, 'content-type': 'application/json', 'x-forwarded-for': freshIp(), ...headers },
  })
}

export const where = (res: Response) => { const u = new URL(res.headers.get('location') ?? '', STUDIO); return `${u.pathname}${u.search}` }

export function kitDoc(extra: { phone?: string } = {}): SiteDoc {
  const kit = kitDefinition('food-truck')!
  const doc = loadSiteDoc(buildKitDraft(kit, { name: 'Mesa Street Tacos', city: 'El Paso' }, brandFor(kit, { colors: { primary: '#9A3412', secondary: '#15130F', accent: '#F59E0B' } }))).doc
  if (extra.phone) doc.business.phone = extra.phone
  return doc
}

/** An anonymous draft held by this browser (its cookie is in the jar), as /start leaves it. */
export async function makeDraft(extra: { phone?: string } = {}) {
  const { getRuntime } = await import('@/lib/server/runtime')
  const { newDraftToken, hashDraftToken, draftCookieName } = await import('@/lib/server/draft-token')
  const rt = getRuntime()
  const tenantId = randomUUID(), siteId = randomUUID(), token = newDraftToken()
  await rt.store.createTenant({ id: tenantId, name: 'Mesa Street Tacos', kitId: 'food-truck' })
  await rt.store.createDraft({ tenantId, siteId, slug: `draft-${siteId.slice(0, 8)}`, kitId: 'food-truck', doc: kitDoc(extra), docSha256: 'x'.repeat(64), tokenHash: hashDraftToken(token, rt.draftPepper), expiresAt: new Date(Date.now() + 86_400_000), sourceUrl: null })
  jar.set(draftCookieName(siteId), token)
  return { rt, siteId, tenantId, cookie: draftCookieName(siteId), token }
}

let signins = 0
export async function signIn(email = `owner${++signins}@mesastreet.example`) {
  const { POST: code } = await import('@/app/api/auth/code/route')
  const { POST: verify } = await import('@/app/api/auth/verify/route')
  const { TEST_MODE_CODE, testUserId } = await import('@/lib/server/auth')
  const sent = await code(form('/api/auth/code', { email, next: '/sites' }))
  if (!where(sent).includes('step=code')) throw new Error(`sign-in code not sent: ${where(sent)}`)
  const res = await verify(form('/api/auth/verify', { code: TEST_MODE_CODE }))
  if (res.status !== 303) throw new Error('sign-in failed')
  return testUserId(email)
}

/** Sign in and claim a fresh draft: the usual starting point for editor tests. */
export async function ownedSite() {
  const d = await makeDraft()
  const userId = await signIn()
  const { POST } = await import('@/app/api/drafts/[siteId]/claim/route')
  const res = await POST(form(`/api/drafts/${d.siteId}/claim`, { rev: '0', attest: 'on' }), { params: Promise.resolve({ siteId: d.siteId }) })
  if (res.status !== 303 || !where(res).includes('/edit')) throw new Error(`claim failed: ${where(res)}`)
  return { ...d, userId }
}
