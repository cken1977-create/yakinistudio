/**
 * The Builder's safe fetcher (spec 14.3). Server-only: it uses node:dns, node:http and node:https.
 *
 * Differences from fetch-page.ts (kept as-is for the /demo):
 * - DNS is resolved, checked against private ranges, and the connection is made to THAT address
 *   (the hostname is kept for TLS/SNI and the Host header). A DNS answer that changes between the
 *   check and the connect (DNS rebinding) cannot reach an internal address.
 * - Every redirect hop is re-checked (max 3), each hop has its own 6 s timeout, bodies are capped
 *   (800 KB pages, 5 MB images) after decompression, and content types are allow-listed.
 * - It identifies itself as YakiniSiteReader and, through robots.ts, honors robots.txt.
 */
import { lookup as dnsLookup } from 'node:dns/promises'
import http from 'node:http'
import https from 'node:https'
import type { LookupFunction } from 'node:net'
import { Readable } from 'node:stream'
import zlib from 'node:zlib'
import { FETCH_MAX_BYTES, FETCH_MAX_REDIRECTS, FETCH_TIMEOUT_MS, isBlockedIp, sanitizePublicHttpUrl } from './safe-url'

export const READER_USER_AGENT = 'YakiniSiteReader/1.0 (+https://yakini.digital/bot)'
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024
export const ROBOTS_MAX_BYTES = 100 * 1024

export type FetchKind = 'html' | 'image' | 'text'

const TYPES: Record<FetchKind, readonly string[]> = {
  html: ['text/html', 'application/xhtml+xml'],
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif'],
  text: ['text/plain'],
}
const ACCEPT: Record<FetchKind, string> = {
  html: 'text/html,application/xhtml+xml;q=0.9',
  image: 'image/avif,image/webp,image/png,image/jpeg,image/gif,image/svg+xml;q=0.8',
  text: 'text/plain',
}

export class SafeFetchError extends Error {
  constructor(
    public readonly code: 'blocked' | 'dns' | 'timeout' | 'too_large' | 'bad_type' | 'http' | 'redirects' | 'network',
    message: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'SafeFetchError'
  }
}

export type SafeResponse = { url: URL; status: number; contentType: string; body: Buffer }

export type ResolvedAddress = { address: string; family: 4 | 6 }

export type TransportResponse = { status: number; headers: Record<string, string | string[] | undefined>; body: Readable }

/** Opens one HTTP(S) request to `url`, connecting only to `address`. Injected in tests. */
export type Transport = (url: URL, address: ResolvedAddress, headers: Record<string, string>, signal: AbortSignal) => Promise<TransportResponse>

export type SafeFetchDeps = {
  resolve: (hostname: string) => Promise<ResolvedAddress[]>
  transport: Transport
}

async function defaultResolve(hostname: string): Promise<ResolvedAddress[]> {
  const answers = await dnsLookup(hostname, { all: true, verbatim: true })
  return answers.map((a) => ({ address: a.address, family: a.family === 6 ? 6 : 4 }))
}

/** Node transport that pins the TCP connection to the vetted address. */
const nodeTransport: Transport = (url, address, headers, signal) =>
  new Promise((resolve, reject) => {
    const pinned: LookupFunction = (_host, opts, cb) => {
      const o = opts as { all?: boolean }
      if (o?.all) (cb as unknown as (e: null, a: { address: string; family: number }[]) => void)(null, [{ address: address.address, family: address.family }])
      else cb(null, address.address, address.family)
    }
    const mod = url.protocol === 'https:' ? https : http
    const req = mod.request(url, { method: 'GET', headers, agent: false, lookup: pinned, signal }, (res) => {
      resolve({ status: res.statusCode ?? 0, headers: res.headers, body: res })
    })
    req.on('error', reject)
    req.end()
  })

export const DEFAULT_DEPS: SafeFetchDeps = { resolve: defaultResolve, transport: nodeTransport }

function header(h: TransportResponse['headers'], name: string): string {
  const v = h[name]
  return (Array.isArray(v) ? v[0] : v) ?? ''
}

async function readCapped(body: Readable, encoding: string, maxBytes: number): Promise<Buffer> {
  let stream: Readable = body
  const enc = encoding.trim().toLowerCase()
  // Decompress ourselves so the size cap applies to what we actually hold in memory.
  if (enc === 'gzip' || enc === 'x-gzip') stream = body.pipe(zlib.createGunzip())
  else if (enc === 'deflate') stream = body.pipe(zlib.createInflate())
  else if (enc === 'br') stream = body.pipe(zlib.createBrotliDecompress())
  else if (enc && enc !== 'identity') { body.destroy(); throw new SafeFetchError('bad_type', 'That website sent data we cannot read.') }
  const chunks: Buffer[] = []
  let total = 0
  try {
    for await (const chunk of stream) {
      const b = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array)
      total += b.byteLength
      if (total > maxBytes) throw new SafeFetchError('too_large', 'That page is too large to read.')
      chunks.push(b)
    }
  } catch (e) {
    body.destroy()
    if (e instanceof SafeFetchError) throw e
    throw new SafeFetchError('network', 'We could not read that website.')
  }
  return Buffer.concat(chunks)
}

export type SafeFetchOptions = {
  kind: FetchKind
  maxBytes?: number
  timeoutMs?: number
  maxRedirects?: number
}

/**
 * Fetch a public URL safely. Throws SafeFetchError with a plain-English message on any problem;
 * callers treat every error the same way ("we couldn't read that page") and move on.
 */
export async function safeFetch(rawUrl: string, opts: SafeFetchOptions, deps: SafeFetchDeps = DEFAULT_DEPS): Promise<SafeResponse> {
  const maxBytes = opts.maxBytes ?? (opts.kind === 'image' ? IMAGE_MAX_BYTES : opts.kind === 'text' ? ROBOTS_MAX_BYTES : FETCH_MAX_BYTES)
  const maxRedirects = opts.maxRedirects ?? FETCH_MAX_REDIRECTS
  let checked = sanitizePublicHttpUrl(rawUrl)
  if (!checked.ok) throw new SafeFetchError('blocked', checked.error)

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const url = checked.url
    let addresses: ResolvedAddress[]
    try {
      addresses = await deps.resolve(url.hostname.replace(/^\[|\]$/g, ''))
    } catch {
      throw new SafeFetchError('dns', 'We could not find that website.')
    }
    if (!addresses.length) throw new SafeFetchError('dns', 'We could not find that website.')
    // Refuse if ANY answer is internal: a mixed answer is a classic rebinding setup.
    if (addresses.some((a) => isBlockedIp(a.address))) throw new SafeFetchError('blocked', 'That website address is not allowed.')
    const address = addresses[0]

    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? FETCH_TIMEOUT_MS)
    try {
      let res: TransportResponse
      try {
        res = await deps.transport(url, address, {
          accept: ACCEPT[opts.kind],
          'accept-language': 'en-US,en;q=0.8',
          'accept-encoding': 'gzip, deflate, br',
          'user-agent': READER_USER_AGENT,
        }, ctrl.signal)
      } catch {
        if (ctrl.signal.aborted) throw new SafeFetchError('timeout', 'That website took too long to respond.')
        throw new SafeFetchError('network', 'We could not open that website.')
      }

      if ([301, 302, 303, 307, 308].includes(res.status)) {
        res.body.destroy()
        const location = header(res.headers, 'location')
        if (!location) throw new SafeFetchError('http', 'We could not open that website.', res.status)
        let nextUrl: string
        try { nextUrl = new URL(location, url).toString() } catch { throw new SafeFetchError('http', 'We could not open that website.', res.status) }
        const next = sanitizePublicHttpUrl(nextUrl)
        if (!next.ok) throw new SafeFetchError('blocked', 'That website address is not allowed.')
        checked = next
        continue
      }
      if (res.status < 200 || res.status >= 300) {
        res.body.destroy()
        throw new SafeFetchError('http', 'That website could not be read right now.', res.status)
      }
      const length = Number(header(res.headers, 'content-length') || '0')
      if (length > maxBytes) { res.body.destroy(); throw new SafeFetchError('too_large', 'That page is too large to read.') }
      const contentType = header(res.headers, 'content-type').split(';')[0].trim().toLowerCase()
      if (!TYPES[opts.kind].includes(contentType)) {
        res.body.destroy()
        throw new SafeFetchError('bad_type', 'That address does not look like what we expected.')
      }
      const body = await readCapped(res.body, header(res.headers, 'content-encoding'), maxBytes)
      return { url, status: res.status, contentType, body }
    } catch (e) {
      if (ctrl.signal.aborted && !(e instanceof SafeFetchError && e.code !== 'network')) {
        throw new SafeFetchError('timeout', 'That website took too long to respond.')
      }
      if (e instanceof SafeFetchError) throw e
      throw new SafeFetchError('network', 'We could not read that website.')
    } finally {
      clearTimeout(timer)
    }
  }
  throw new SafeFetchError('redirects', 'That website took too many redirects.')
}
