import 'server-only'
import { cookies } from 'next/headers'
import { EMAIL_RE, safeNext } from './auth'

/**
 * Between "send me a code" and "here's the code" the browser keeps the typed email and where to go
 * next in a short-lived, httpOnly cookie, so the email never appears in a URL or a server log.
 */
const COOKIE = '__Host-yk-signin'
const TTL_SECONDS = 15 * 60

export type SigninState = { email: string; next: string }

export async function writeSigninState(s: SigninState): Promise<void> {
  const value = Buffer.from(JSON.stringify(s)).toString('base64url')
  ;(await cookies()).set(COOKIE, value, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: TTL_SECONDS })
}

export async function readSigninState(): Promise<SigninState | null> {
  const raw = (await cookies()).get(COOKIE)?.value
  if (!raw || raw.length > 1200) return null
  try {
    const v = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as Partial<SigninState>
    if (typeof v.email !== 'string' || !EMAIL_RE.test(v.email)) return null
    return { email: v.email, next: safeNext(v.next) }
  } catch { return null }
}

/** `__Host-` cookies are only removed by a Set-Cookie that is itself Secure with Path=/. */
export async function clearHostCookie(name: string): Promise<void> {
  ;(await cookies()).set(name, '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0 })
}

export async function clearSigninState(): Promise<void> {
  await clearHostCookie(COOKIE)
}

/** 303 to a path on this studio (POST → GET). */
export function seeOther(request: Request, path: string): Response {
  return new Response(null, { status: 303, headers: { location: new URL(path, request.url).toString(), 'cache-control': 'no-store' } })
}

export const signinPath = (next: string, extra: Record<string, string> = {}) =>
  `/signin?${new URLSearchParams({ ...extra, next: safeNext(next) }).toString()}`
