import { NextResponse, type NextRequest } from 'next/server'
import { ADMIN_COOKIE, readSession } from '@/lib/auth/session'

const SIGN_HOST = 'sign.yakini.digital'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const host = (request.headers.get('host') || '').toLowerCase().split(':')[0]

  // sign.yakini.digital/<token>  ->  served by /sign/<token> on this app.
  if (host === SIGN_HOST) {
    if (path.startsWith('/api/sign/') || path.startsWith('/sign/') || path.startsWith('/_next/') || path === '/favicon.ico') {
      return NextResponse.next()
    }
    // Any single path segment that could be a link token goes to the signing page, which
    // answers with its own "invalid link" state for bad ones. Files (with a dot), the bare
    // host and deeper paths go to the main site.
    const m = path.match(/^\/([A-Za-z0-9_-]{1,128})\/?$/)
    if (m) {
      const url = request.nextUrl.clone()
      url.pathname = `/sign/${m[1]}`
      return NextResponse.rewrite(url)
    }
    return NextResponse.redirect('https://yakini.digital/', 308)
  }

  // Admin dashboard and its API: a signed admin session is required.
  if (path === '/dashboard' || path.startsWith('/dashboard/') || path.startsWith('/api/dashboard/')) {
    if (path === '/dashboard/login') return NextResponse.next()
    const admin = await readSession(request.cookies.get(ADMIN_COOKIE)?.value, 'admin')
    if (!admin) {
      if (path.startsWith('/api/')) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
      return NextResponse.redirect(new URL('/dashboard/login', request.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  // Run on everything except static build assets, so the sign host can be routed.
  matcher: ['/((?!_next/static|_next/image).*)'],
}
