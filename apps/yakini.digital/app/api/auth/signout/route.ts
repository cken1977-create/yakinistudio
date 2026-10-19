import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, CLIENT_COOKIE } from '@/lib/auth/session'

export async function POST(req: NextRequest) {
  const toDashboard = req.nextUrl.searchParams.get('to') === 'dashboard'
  const res = NextResponse.redirect(new URL(toDashboard ? '/dashboard/login' : '/client/login', req.url), { status: 303 })
  res.cookies.delete(ADMIN_COOKIE)
  res.cookies.delete(CLIENT_COOKIE)
  return res
}
