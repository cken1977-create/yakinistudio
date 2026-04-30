import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const clientCookie = request.cookies.get('yakini_client')

  if (!clientCookie && 
      request.nextUrl.pathname.startsWith('/client') &&
      !request.nextUrl.pathname.startsWith('/client/login') &&
      !request.nextUrl.pathname.startsWith('/client/verify')) {
    return NextResponse.redirect(new URL('/client/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/client/:path*'],
}
