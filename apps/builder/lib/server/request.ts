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

/** The studio's own origin for this request (preview deployments use their own host). */
export function requestOrigin(url: string): string {
  return new URL(url).origin
}
