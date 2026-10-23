// Server-only. Imported by the start page and the /api/start route, never by the browser.
import { FOUNDING_API, PORTAL_URL } from '@/lib/pricing'
import { parseCatalog, parseSeats, type Catalog, type FoundingSeats, type OrderIntake } from '@/lib/orders/logic'
import { parseSavedBuild, safeBuildToken, type BuildEmailPayload, type SavedBuild } from '@/lib/orders/saved-build'

/**
 * ORDER_INTAKE_SECRET
 * Server-only. Authorizes this site when it reserves a setup with the portal
 * (POST {PORTAL_URL}/api/orders). Never prefix it with NEXT_PUBLIC_ and never
 * commit a value.
 *
 * Live submit happens only when both are true:
 * - ORDER_INTAKE_SECRET is set, and
 * - VERCEL_ENV is production.
 * Preview, local, and production-without-the-secret stay in test mode and do
 * not call the live order endpoint, so a preview cannot create a customer.
 */
export function intakeTestMode(): boolean {
  if (process.env.VERCEL_ENV !== 'production') return true
  return !process.env.ORDER_INTAKE_SECRET?.trim()
}

export async function loadCatalog(): Promise<Catalog | null> {
  try {
    const response = await fetch(`${PORTAL_URL}/api/orders/catalog`, { cache: 'no-store' })
    if (!response.ok) return null
    return parseCatalog(await response.json())
  } catch {
    return null
  }
}

export async function loadSeats(): Promise<FoundingSeats | null> {
  try {
    const response = await fetch(FOUNDING_API, { cache: 'no-store' })
    if (!response.ok) return null
    return parseSeats(await response.json())
  } catch {
    return null
  }
}

export type SubmitResult =
  | { ok: true; testMode: true }
  | { ok: true; testMode: false; reference: string | null }
  | { ok: false; status: number }

function referenceFrom(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const record = body as Record<string, unknown>
  for (const key of ['reference', 'orderId', 'id']) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 80)
  }
  const order = record.order
  if (order && typeof order === 'object') {
    const id = (order as Record<string, unknown>).id
    if (typeof id === 'string' && id.trim()) return id.trim().slice(0, 80)
  }
  return null
}

/**
 * Forward a validated intake to the portal.
 * The secret is sent as Authorization: Bearer and as x-order-intake-secret.
 * The portal checks one of those; the value never reaches the browser.
 */
export async function submitIntake(intake: OrderIntake): Promise<SubmitResult> {
  if (intakeTestMode()) return { ok: true, testMode: true }
  const secret = process.env.ORDER_INTAKE_SECRET?.trim()
  if (!secret) return { ok: true, testMode: true }
  try {
    const response = await fetch(`${PORTAL_URL}/api/orders`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${secret}`,
        'x-order-intake-secret': secret,
      },
      body: JSON.stringify(intake),
      signal: AbortSignal.timeout(20_000),
    })
    if (!response.ok) {
      console.error('[start] portal order was not accepted', response.status)
      return { ok: false, status: response.status }
    }
    let reference: string | null = null
    try {
      reference = referenceFrom(await response.json())
    } catch {
      reference = null
    }
    return { ok: true, testMode: false, reference }
  } catch (error) {
    console.error('[start] portal order request failed', error instanceof Error ? error.name : 'error')
    return { ok: false, status: 502 }
  }
}

export type DraftSaveResult = { ok: true; testMode: boolean; sent: boolean }

/**
 * Ask the portal to email a link back to this build.
 * Preview and local stay in test mode and do not call the portal, same as order submit.
 * A missing or failing endpoint does not throw. The caller keeps the flow moving.
 */
export async function saveBuildDraft(payload: BuildEmailPayload): Promise<DraftSaveResult> {
  if (intakeTestMode()) {
    console.info('[start] test mode; build draft was not sent', { env: process.env.VERCEL_ENV ?? 'local' })
    return { ok: true, testMode: true, sent: false }
  }
  const secret = process.env.ORDER_INTAKE_SECRET?.trim()
  if (!secret) return { ok: true, testMode: true, sent: false }
  try {
    const response = await fetch(`${PORTAL_URL}/api/orders/drafts`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${secret}`,
        'x-order-intake-secret': secret,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12_000),
    })
    if (!response.ok) {
      console.error('[start] build draft was not accepted', response.status)
      return { ok: true, testMode: false, sent: false }
    }
    return { ok: true, testMode: false, sent: true }
  } catch (error) {
    console.error('[start] build draft request failed', error instanceof Error ? error.name : 'error')
    return { ok: true, testMode: false, sent: false }
  }
}

/** Restore a build from the portal. A 404, or any other miss, returns null. */
export async function loadBuildDraft(token: string): Promise<SavedBuild | null> {
  const safe = safeBuildToken(token)
  if (!safe) return null
  try {
    const headers: Record<string, string> = { accept: 'application/json' }
    const secret = process.env.ORDER_INTAKE_SECRET?.trim()
    if (secret && !intakeTestMode()) {
      headers.authorization = `Bearer ${secret}`
      headers['x-order-intake-secret'] = secret
    }
    const response = await fetch(`${PORTAL_URL}/api/orders/drafts/${encodeURIComponent(safe)}`, {
      cache: 'no-store',
      headers,
      signal: AbortSignal.timeout(12_000),
    })
    if (!response.ok) return null
    return parseSavedBuild(await response.json())
  } catch (error) {
    console.info('[start] build draft was not loaded', error instanceof Error ? error.name : 'error')
    return null
  }
}
