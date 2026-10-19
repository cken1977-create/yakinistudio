// Server-only module: import it from route handlers, never from a client component.

// Server-only access to the contracts tables in the "yakini" Supabase project.
// Uses the service-role key from the environment; nothing here reaches the browser.

export const CONTRACTS_PROJECT_REF = 'mxshsmknfqxwltucgezl'
const BASE = `https://${CONTRACTS_PROJECT_REF}.supabase.co/rest/v1`

export class EsignConfigError extends Error {}

function serviceKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!key) throw new EsignConfigError('SUPABASE_SERVICE_ROLE_KEY is not set')
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (envUrl && !envUrl.includes(CONTRACTS_PROJECT_REF)) {
    throw new EsignConfigError('NEXT_PUBLIC_SUPABASE_URL is not the contracts project, so its service key is not either')
  }
  // Legacy JWT keys carry the project ref; refuse a key for a different project.
  const parts = key.split('.')
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
      if (payload.ref && payload.ref !== CONTRACTS_PROJECT_REF) {
        throw new EsignConfigError(`service key is for project ${payload.ref}, expected ${CONTRACTS_PROJECT_REF}`)
      }
      if (payload.role && payload.role !== 'service_role') {
        throw new EsignConfigError('SUPABASE_SERVICE_ROLE_KEY is not a service_role key')
      }
    } catch (e) {
      if (e instanceof EsignConfigError) throw e
    }
  }
  return key
}

export type RestResult<T> = { ok: boolean; status: number; data: T | null; error: { code?: string; message?: string } | null }

export async function rest<T = unknown>(
  path: string,
  init: { method?: string; body?: unknown; prefer?: string } = {},
): Promise<RestResult<T>> {
  const key = serviceKey()
  const res = await fetch(`${BASE}/${path}`, {
    method: init.method ?? 'GET',
    headers: {
      apikey: key,
      // Legacy JWT keys go in Authorization too; new sb_secret_ keys must only be sent as apikey.
      ...(key.split('.').length === 3 ? { Authorization: `Bearer ${key}` } : {}),
      'Content-Type': 'application/json',
      ...(init.prefer ? { Prefer: init.prefer } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: 'no-store',
  })
  const text = await res.text()
  let json: unknown = null
  try { json = text ? JSON.parse(text) : null } catch { json = null }
  if (!res.ok) return { ok: false, status: res.status, data: null, error: (json as { code?: string; message?: string }) ?? { message: text } }
  return { ok: true, status: res.status, data: json as T, error: null }
}

/** True when PostgREST says a column in the payload does not exist yet (migration not applied). */
export function isMissingColumn(r: RestResult<unknown>): boolean {
  return !r.ok && (r.error?.code === 'PGRST204' || r.error?.code === '42703')
}

export function clientIp(h: Headers): string | null {
  const xff = h.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim() || null
  return h.get('x-real-ip')
}

/** Reserved test domains (RFC 2606 / 6761): never email them. */
export function isTestRecipient(email: string | null | undefined): boolean {
  return !!email && /@(example\.(com|net|org)|[^@]+\.(test|example|invalid))$/i.test(email.trim())
}
