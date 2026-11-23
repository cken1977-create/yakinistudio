import 'server-only'
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * Anonymous draft access (spec 5.2 step 4g): a random 32-byte token in an httpOnly, Secure,
 * SameSite=Lax cookie on the studio host, valid 14 days. Only an HMAC of it is stored, keyed with
 * DRAFT_TOKEN_PEPPER, so a database leak alone can't open anyone's draft.
 */
export const DRAFT_TTL_DAYS = 14
export const DRAFT_TTL_SECONDS = DRAFT_TTL_DAYS * 24 * 60 * 60

export function newDraftToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashDraftToken(token: string, pepper: string): string {
  if (!pepper || pepper.length < 16) throw new Error('DRAFT_TOKEN_PEPPER is not set')
  return createHmac('sha256', pepper).update(`draft:${token}`).digest('hex')
}

/** Constant-time check of a cookie token against the stored hash. */
export function draftTokenMatches(token: string | undefined, storedHash: string | null, pepper: string): boolean {
  if (!token || !storedHash || !/^[A-Za-z0-9_-]{43}$/.test(token) || !/^[0-9a-f]{64}$/.test(storedHash)) return false
  const a = Buffer.from(hashDraftToken(token, pepper), 'hex')
  const b = Buffer.from(storedHash, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}

/** One cookie per draft. `__Host-` pins it to this exact host, https and path=/ (no Domain). */
export function draftCookieName(siteId: string): string {
  return `__Host-ykd-${siteId.replace(/[^0-9a-f-]/gi, '')}`
}

export function draftCookieHeader(siteId: string, token: string): string {
  return `${draftCookieName(siteId)}=${token}; Path=/; Max-Age=${DRAFT_TTL_SECONDS}; HttpOnly; Secure; SameSite=Lax`
}
