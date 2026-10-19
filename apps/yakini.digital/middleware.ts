import { NextResponse, type NextRequest } from 'next/server'

const SIGN_HOST = 'sign.yakini.digital'

export function middleware(request: NextRequest) {
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

  const clientCookie = request.cookies.get('yakini_client')
  if (
    !clientCookie &&
    path.startsWith('/client') &&
    !path.startsWith('/client/login') &&
    !path.startsWith('/client/verify')
  ) {
    return NextResponse.redirect(new URL('/client/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Run on everything except static build assets, so the sign host can be routed.
  matcher: ['/((?!_next/static|_next/image).*)'],
}
