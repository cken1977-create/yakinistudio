import { NextRequest, NextResponse } from 'next/server'
import { rest } from '@/lib/esign/server'
import { ADMIN_COOKIE, ADMIN_SESSION_SECONDS, CLIENT_COOKIE, CLIENT_SESSION_SECONDS, REP_COOKIE, REP_SESSION_SECONDS, isAdminEmail, isRepEmail, signSession } from '@/lib/auth/session'
import { ilikeExact, sha256Hex } from '@/lib/server/guard'

type Tok = { id: string; email: string; expires_at: string }

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('token') ?? ''
  const to = req.nextUrl.searchParams.get('to')
  const toDashboard = to === 'dashboard'
  const toReps = to === 'reps'
  const loginPage = toDashboard ? '/dashboard/login' : toReps ? '/reps/login' : '/client/login'
  const fail = (why: string) => NextResponse.redirect(new URL(`${loginPage}?error=${why}`, req.url))
  if (!/^[a-f0-9]{64}$/.test(code)) return fail('expired')

  try {
    // Mark used in the same request that finds it, so a link works exactly once.
    const now = new Date().toISOString()
    const r = await rest<Tok[]>(
      `auth_tokens?token=eq.${encodeURIComponent(`sha256:${await sha256Hex(code)}`)}&used=is.false&expires_at=gt.${encodeURIComponent(now)}&select=id,email,expires_at`,
      { method: 'PATCH', body: { used: true }, prefer: 'return=representation' },
    )
    if (!r.ok) throw new Error(`token update failed (${r.status})`)
    const tok = (r.data ?? [])[0]
    if (!tok?.email) return fail('expired')
    const email = tok.email.trim().toLowerCase()

    if (toDashboard) {
      if (!isAdminEmail(email)) return fail('denied')
      const res = NextResponse.redirect(new URL('/dashboard/contracts', req.url), { status: 302 })
      res.cookies.set({ name: ADMIN_COOKIE, value: await signSession('admin', email, ADMIN_SESSION_SECONDS), httpOnly: true, secure: true, sameSite: 'lax', maxAge: ADMIN_SESSION_SECONDS, path: '/' })
      return res
    }

    if (toReps) {
      if (!isRepEmail(email)) return fail('denied')
      const res = NextResponse.redirect(new URL('/reps', req.url), { status: 302 })
      res.cookies.set({ name: REP_COOKIE, value: await signSession('rep', email, REP_SESSION_SECONDS), httpOnly: true, secure: true, sameSite: 'lax', maxAge: REP_SESSION_SECONDS, path: '/' })
      return res
    }

    const c = await rest<{ email: string }[]>(`clients?select=email&email=ilike.${ilikeExact(email)}&active=is.true&limit=1`)
    if (!c.ok || (c.data ?? []).length === 0) return fail('denied')
    const res = NextResponse.redirect(new URL('/client', req.url), { status: 302 })
    res.cookies.set({ name: CLIENT_COOKIE, value: await signSession('client', email, CLIENT_SESSION_SECONDS), httpOnly: true, secure: true, sameSite: 'lax', maxAge: CLIENT_SESSION_SECONDS, path: '/' })
    return res
  } catch (err) {
    console.error('Verify error:', err instanceof Error ? err.message : err)
    return fail('failed')
  }
}
