// Thin Square REST client: bearer auth, pinned API version, backoff with
// jitter on 429 / 5xx (Square publishes no numeric rate limits; it asks
// for exponential backoff). Never logs tokens or response bodies.
import { SQUARE_BASE_URL, SQUARE_VERSION } from './config'

export class SquareApiError extends Error {
  constructor(public status: number, public codes: string[], message: string) {
    super(message)
  }
}

type FetchLike = typeof fetch
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function backoffMs(attempt: number, random = Math.random): number {
  const base = Math.min(30_000, 500 * 2 ** attempt)
  return Math.round(base / 2 + random() * (base / 2))
}

export async function squareFetch<T>(
  path: string,
  opts: { token?: string; method?: 'GET' | 'POST'; body?: unknown; authHeader?: string; fetchImpl?: FetchLike; maxRetries?: number } = {},
): Promise<T> {
  const { method = 'GET', body, fetchImpl = fetch, maxRetries = 5 } = opts
  const headers: Record<string, string> = {
    'Square-Version': SQUARE_VERSION,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  if (opts.authHeader) headers.Authorization = opts.authHeader
  else if (opts.token) headers.Authorization = `Bearer ${opts.token}`

  for (let attempt = 0; ; attempt++) {
    const res = await fetchImpl(`${SQUARE_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    })
    if (res.ok) return (await res.json()) as T
    const retryable = res.status === 429 || res.status >= 500
    if (retryable && attempt < maxRetries) {
      await sleep(backoffMs(attempt))
      continue
    }
    let codes: string[] = []
    try {
      const j = (await res.json()) as { errors?: { code?: string }[] }
      codes = (j.errors ?? []).map((e) => e.code ?? 'UNKNOWN')
    } catch { /* non-JSON error body */ }
    throw new SquareApiError(res.status, codes, `Square ${method} ${path.split('?')[0]} failed: ${res.status} ${codes.join(',')}`)
  }
}

/** Follows Square's cursor pagination for list/search endpoints. */
export async function* paginate<T>(
  fetchPage: (cursor?: string) => Promise<{ items: T[]; cursor?: string }>,
  maxPages = 200,
): AsyncGenerator<T> {
  let cursor: string | undefined
  for (let i = 0; i < maxPages; i++) {
    const page = await fetchPage(cursor)
    for (const item of page.items) yield item
    if (!page.cursor) return
    cursor = page.cursor
  }
  throw new Error('Square pagination exceeded the page limit')
}
