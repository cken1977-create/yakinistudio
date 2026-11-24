import 'server-only'
import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { rememberTestEmail } from './publish-store'
import { ConfigError, isTestMode } from './runtime'

/**
 * Studio sign-in (spec 5.4, 10.1 /signin): email only, then a one-time code or a link. Production
 * uses Supabase Auth (the email is sent by Supabase's mailer; making it come from Yakini through
 * Resend is a Supabase Auth setting, OPEN_QUESTIONS). Test mode (never on Vercel) uses a fixed
 * code and a signed cookie so browser tests can sign in without a mailbox.
 *
 * Cookies are only written from Route Handlers and Server Functions (Next 16 rule); reads in
 * Server Components never write.
 */
export type SessionUser = { id: string; email: string }

export interface AuthBackend {
  /** Email the person a sign-in code and link. Never says whether the address has an account. */
  sendCode(email: string, redirectTo: string): Promise<{ ok: boolean }>
  verifyCode(email: string, code: string): Promise<SessionUser | null>
  /** The link in the email lands on /auth/callback?code=… */
  exchangeLink(code: string): Promise<SessionUser | null>
  currentUser(): Promise<SessionUser | null>
  signOut(): Promise<void>
}

export const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]{1,64}@[a-z0-9-]+(\.[a-z0-9-]+)+$/i
export const CODE_RE = /^\d{6}$/

/** Where to go after signing in: only paths on this studio, never another site. */
export function safeNext(v: unknown, fallback = '/sites'): string {
  if (typeof v !== 'string' || !v.startsWith('/') || v.startsWith('//') || v.includes('\\') || v.length > 300) return fallback
  try {
    const u = new URL(v, 'https://studio.invalid')
    return u.origin === 'https://studio.invalid' ? `${u.pathname}${u.search}` : fallback
  } catch { return fallback }
}

export const emailHash = (email: string) => createHash('sha256').update(`email:${email.trim().toLowerCase()}`).digest('hex')

// ------------------------------------------------------------------------------------- Supabase

async function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const missing = [!url && 'NEXT_PUBLIC_SUPABASE_URL', !key && 'NEXT_PUBLIC_SUPABASE_ANON_KEY'].filter(Boolean) as string[]
  if (missing.length) throw new ConfigError(missing)
  const jar = await cookies()
  return createServerClient(url!, key!, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (list) => {
        // Server Components cannot write cookies; a refreshed session is written on the next action.
        try { for (const c of list) jar.set(c.name, c.value, { ...c.options, httpOnly: true, secure: true, sameSite: 'lax', path: '/' }) } catch { /* read-only render */ }
      },
    },
  })
}

const toUser = (u: { id: string; email?: string | null } | null | undefined): SessionUser | null => (u && u.email ? { id: u.id, email: u.email } : null)

const supabaseAuth: AuthBackend = {
  async sendCode(email, redirectTo) {
    const sb = await supabaseServer()
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo, shouldCreateUser: true } })
    return { ok: !error }
  },
  async verifyCode(email, code) {
    const sb = await supabaseServer()
    const { data, error } = await sb.auth.verifyOtp({ email, token: code, type: 'email' })
    return error ? null : toUser(data.user)
  },
  async exchangeLink(code) {
    const sb = await supabaseServer()
    const { data, error } = await sb.auth.exchangeCodeForSession(code)
    return error ? null : toUser(data.user)
  },
  async currentUser() {
    const sb = await supabaseServer()
    const { data, error } = await sb.auth.getUser() // verified with the auth server, not just the cookie
    return error ? null : toUser(data.user)
  },
  async signOut() {
    const sb = await supabaseServer()
    await sb.auth.signOut()
  },
}

// ------------------------------------------------------------------------------------- test mode

export const TEST_MODE_CODE = '246810'
const TEST_COOKIE = 'ykt_session'
const TEST_KEY = 'test-mode-session-key-not-a-secret'
const sign = (v: string) => createHmac('sha256', TEST_KEY).update(v).digest('base64url')

/** A stable fake user id per email (UUID-shaped) so test drafts and memberships line up. */
export function testUserId(email: string): string {
  const h = createHash('sha256').update(email.toLowerCase()).digest('hex')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`
}

async function setTestSession(user: SessionUser) {
  const body = Buffer.from(JSON.stringify({ ...user, exp: Date.now() + 7 * 86_400_000 })).toString('base64url')
  ;(await cookies()).set(TEST_COOKIE, `${body}.${sign(body)}`, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 7 * 86_400 })
}

const testAuth: AuthBackend = {
  async sendCode() { return { ok: true } },
  async verifyCode(email, code) {
    if (code !== TEST_MODE_CODE) return null
    const user = { id: testUserId(email), email: email.toLowerCase() }
    rememberTestEmail(user.id, user.email)
    await setTestSession(user)
    return user
  },
  async exchangeLink(code) {
    // Test links carry "email:<address>" so browser tests can follow them.
    const email = code.startsWith('email:') ? code.slice(6) : ''
    if (!EMAIL_RE.test(email)) return null
    const user = { id: testUserId(email), email: email.toLowerCase() }
    rememberTestEmail(user.id, user.email)
    await setTestSession(user)
    return user
  },
  async currentUser() {
    const raw = (await cookies()).get(TEST_COOKIE)?.value ?? ''
    const [body, sig] = raw.split('.')
    if (!body || !sig) return null
    const want = Buffer.from(sign(body)), got = Buffer.from(sig)
    if (want.length !== got.length || !timingSafeEqual(want, got)) return null
    try {
      const v = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionUser & { exp: number }
      return v.exp > Date.now() ? { id: v.id, email: v.email } : null
    } catch { return null }
  },
  async signOut() { (await cookies()).set(TEST_COOKIE, '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0 }) },
}

export function getAuth(): AuthBackend {
  return isTestMode() ? testAuth : supabaseAuth
}

/** The signed-in user, or null (also null when sign-in is not configured yet). */
export async function currentUser(): Promise<SessionUser | null> {
  try { return await getAuth().currentUser() } catch (e) { if (e instanceof ConfigError) return null; throw e }
}
