import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const clientCookie = request.cookies.get('yakini_client')
  const path = request.nextUrl.pathname

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
  matcher: ['/client/:path*'],
}
