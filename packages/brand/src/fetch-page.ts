import { lookup } from 'node:dns/promises'
import {
  FETCH_MAX_BYTES,
  FETCH_MAX_REDIRECTS,
  FETCH_TIMEOUT_MS,
  isBlockedIp,
  sanitizePublicHttpUrl,
} from './safe-url'

export type FetchedPage = {
  finalUrl: URL
  html: string
}

const UA = 'YakiniDigital/1.0 (kit-demo; +https://yakini.digital/demo)'

async function resolvePublic(hostname: string): Promise<string[]> {
  const answers = await lookup(hostname, { all: true, verbatim: true })
  const ips = answers.map((a) => a.address)
  if (!ips.length) throw new Error('We could not find that website.')
  if (ips.some((ip) => isBlockedIp(ip))) throw new Error('That website address is not allowed.')
  return ips
}

async function readLimited(res: Response, maxBytes: number): Promise<string> {
  const length = Number(res.headers.get('content-length') || '0')
  if (length && length > maxBytes) throw new Error('That page is too large to read.')
  if (!res.body) return (await res.text()).slice(0, maxBytes)

  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value) continue
    total += value.byteLength
    if (total > maxBytes) {
      try { await reader.cancel() } catch { /* ignore */ }
      throw new Error('That page is too large to read.')
    }
    chunks.push(value)
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(Buffer.concat(chunks.map((c) => Buffer.from(c))))
}

export async function fetchPublicPage(rawUrl: string): Promise<FetchedPage> {
  let current = sanitizePublicHttpUrl(rawUrl)
  if (!current.ok) throw new Error(current.error)

  for (let hop = 0; hop <= FETCH_MAX_REDIRECTS; hop++) {
    const url = current.url
    await resolvePublic(url.hostname)

    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
    let res: Response
    try {
      res = await fetch(url, {
        method: 'GET',
        redirect: 'manual',
        signal: ctrl.signal,
        headers: {
          Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.8',
          'User-Agent': UA,
        },
      })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('That website took too long to respond.')
      }
      throw new Error('We could not open that website.')
    } finally {
      clearTimeout(timer)
    }

    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const location = res.headers.get('location')
      if (!location) throw new Error('We could not open that website.')
      const next = sanitizePublicHttpUrl(new URL(location, url).toString())
      if (!next.ok) throw new Error('That website address is not allowed.')
      current = next
      continue
    }

    if (!res.ok) throw new Error('That website could not be read right now.')
    const type = (res.headers.get('content-type') || '').toLowerCase()
    if (type && !type.includes('text/html') && !type.includes('application/xhtml') && !type.includes('text/plain')) {
      throw new Error('That address does not look like a web page.')
    }

    const html = await readLimited(res, FETCH_MAX_BYTES)
    return { finalUrl: url, html }
  }

  throw new Error('That website took too many redirects.')
}
