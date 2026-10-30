// Signed session cookies (HMAC-SHA256, Web Crypto) for the client area, the admin dashboard
// and the rep Demo Library.
// Works in middleware and in route handlers. The cookie holds {kind, email, expiry} plus a signature;
// it can't be forged or edited without the server secret.

export const CLIENT_COOKIE = 'yakini_client'
export const ADMIN_COOKIE = 'yakini_admin'
export const REP_COOKIE = 'yakini_rep'
export const CLIENT_SESSION_SECONDS = 60 * 60 * 24 * 7 // 7 days
export const ADMIN_SESSION_SECONDS = 60 * 60 * 12 // 12 hours
export const REP_SESSION_SECONDS = 60 * 60 * 24 * 7 // 7 days

export type SessionKind = 'client' | 'admin' | 'rep'
export type Session = { k: SessionKind; e: string; x: number }

// Who may use /dashboard. Override with ADMIN_EMAILS (comma separated) in Vercel.
const DEFAULT_ADMINS = ['admin@yakini.digital', 'cken1977@gmail.com']

export function adminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS?.trim()
  const list = raw ? raw.split(',') : DEFAULT_ADMINS
  return list.map(e => e.trim().toLowerCase()).filter(Boolean)
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && adminEmails().includes(email.trim().toLowerCase())
}

// Who may use the rep Demo Library (/reps). Set REP_EMAILS (comma separated) in Vercel.
// Admins can always get in. Removing an email from the list signs that rep out on their next visit.
export function repEmails(): string[] {
  const raw = process.env.REP_EMAILS?.trim() ?? ''
  return raw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
}

export function isRepEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const e = email.trim().toLowerCase()
  return repEmails().includes(e) || isAdminEmail(e)
}

function secretMaterial(): string {
  // A dedicated SESSION_SECRET is preferred; otherwise derive from the server-only Supabase key.
  // Rotating either one signs everybody out, which is the safe direction.
  const s = process.env.SESSION_SECRET?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!s) throw new Error('No session secret configured')
  return `yakini-session-v1:${s}`
}

const enc = new TextEncoder()

function b64url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromB64url(s: string): Uint8Array {
  const pad = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)
  const bin = atob(pad)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function hmac(data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secretMaterial()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(data)))
}

function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let d = 0
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i]
  return d === 0
}

export async function signSession(kind: SessionKind, email: string, seconds: number): Promise<string> {
  const body: Session = { k: kind, e: email.trim().toLowerCase(), x: Math.floor(Date.now() / 1000) + seconds }
  const payload = b64url(enc.encode(JSON.stringify(body)))
  return `${payload}.${b64url(await hmac(payload))}`
}

export async function readSession(value: string | undefined | null, kind: SessionKind): Promise<Session | null> {
  if (!value) return null
  const [payload, sig, extra] = value.split('.')
  if (!payload || !sig || extra !== undefined) return null
  try {
    if (!sameBytes(fromB64url(sig), await hmac(payload))) return null
    const s = JSON.parse(new TextDecoder().decode(fromB64url(payload))) as Session
    if (s.k !== kind || typeof s.e !== 'string' || typeof s.x !== 'number') return null
    if (s.x * 1000 < Date.now()) return null
    if (kind === 'admin' && !isAdminEmail(s.e)) return null // removed from the list = signed out
    if (kind === 'rep' && !isRepEmail(s.e)) return null // removed from the rep list = signed out
    return s
  } catch {
    return null
  }
}
