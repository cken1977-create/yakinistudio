import 'server-only'
import { createHmac } from 'node:crypto'

/**
 * Request helpers: client IP (hashed before it is stored or used as a key, spec 14.7) and the
 * Origin checks for state-changing routes (spec 14.6).
 */

/** The visitor's IP as Vercel reports it. Only ever used hashed. */
export function clientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for')
  const first = xff?.split(',')[0]?.trim()
  return first || headers.get('x-real-ip')?.trim() || 'unknown'
}

export function hashIp(ip: string, pepper: string): string {
  if (!pepper || pepper.length < 16) throw new Error('IP_HASH_PEPPER is not set')
  return createHmac('sha256', pepper).update(`ip:${ip}`).digest('hex')
}

function originOf(headers: Headers): string | null {
  const o = headers.get('origin')
  if (o && o !== 'null') return o
  // Some browsers omit Origin on top-level form POSTs; fall back to the Referer's origin.
  const ref = headers.get('referer')
  if (!ref) return null
  try { return new URL(ref).origin } catch { return null }
}

/**
 * /start accepts a cross-site POST only from the /demo origin (and the studio itself). Every other
 * state-changing studio route accepts its own origin only.
 */
export function originAllowed(headers: Headers, allowed: readonly string[]): boolean {
  const o = originOf(headers)
  return o !== null && allowed.includes(o)
}

/** An https origin and its www. twin (yakini.digital may be reached either way). */
export function withWww(origin: string): string[] {
  try {
    const u = new URL(origin)
    const host = u.hostname.startsWith('www.') ? u.hostname.slice(4) : u.hostname
    return [`${u.protocol}//${host}${u.port ? `:${u.port}` : ''}`, `${u.protocol}//www.${host}${u.port ? `:${u.port}` : ''}`]
  } catch { return [] }
}

/** The studio's own origin for this request (preview deployments use their own host). */
export function requestOrigin(url: string): string {
  return new URL(url).origin
}

/**
 * Bot protection for /new without a third-party captcha (spec 14.4, R2): the form carries a signed
 * time it was shown; a submit sooner than 3 seconds or older than 2 hours is refused.
 */
export function signFormTime(now: number, pepper: string): string {
  return `${now}.${createHmac('sha256', pepper).update(`form-time:${now}`).digest('hex').slice(0, 32)}`
}

export function checkFormTime(value: string | null, pepper: string, now: number): 'ok' | 'too_fast' | 'expired' | 'bad' {
  const m = /^(\d{13})\.([0-9a-f]{32})$/.exec(value ?? '')
  if (!m) return 'bad'
  if (signFormTime(Number(m[1]), pepper) !== value) return 'bad'
  const age = now - Number(m[1])
  if (age < 3_000) return 'too_fast'
  if (age > 2 * 60 * 60 * 1000) return 'expired'
  return 'ok'
}
