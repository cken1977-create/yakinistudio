import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, CLIENT_COOKIE, REP_COOKIE } from '@/lib/auth/session'

export async function POST(req: NextRequest) {
  const to = req.nextUrl.searchParams.get('to')
  if (to === 'reps') {
    // Rep sign-out only ends the Demo Library session.
    const res = NextResponse.redirect(new URL('/reps/login?signedout=1', req.url), { status: 303 })
    res.cookies.delete(REP_COOKIE)
    return res
  }
  const toDashboard = to === 'dashboard'
  const res = NextResponse.redirect(new URL(toDashboard ? '/dashboard/login' : '/client/login', req.url), { status: 303 })
  res.cookies.delete(ADMIN_COOKIE)
  res.cookies.delete(CLIENT_COOKIE)
  return res
}
