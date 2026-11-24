import { NextResponse, type NextRequest } from 'next/server'
import { buildSiteCsp, buildStudioCsp } from '@/lib/csp'
import { decideHost } from '@/lib/hosts'

function applyCsp(request: NextRequest, build: (requestHeaders: Headers) => NextResponse, site = false): NextResponse {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const isDev = process.env.NODE_ENV === 'development'
  const csp = site ? buildSiteCsp(nonce, { isDev }) : buildStudioCsp(nonce, { isDev, posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST })
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', csp)
  const res = build(requestHeaders)
  res.headers.set('Content-Security-Policy', csp)
  return res
}

// Next.js 16 renamed middleware.ts to proxy.ts (spec 13.5 calls it middleware.ts).
export function proxy(request: NextRequest) {
  const d = decideHost(request.headers.get('host'), request.nextUrl.pathname, process.env.STUDIO_HOST || undefined)
  if (d.kind === 'block') {
    return applyCsp(request, () => new NextResponse('Not found', { status: 404, headers: { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' } }))
  }
  if (d.kind === 'static') return NextResponse.next()
  if (d.kind === 'site') {
    const url = request.nextUrl.clone()
    url.pathname = d.rewriteTo
    return applyCsp(request, (requestHeaders) => {
      const res = NextResponse.rewrite(url, { request: { headers: requestHeaders } })
      // Spec 11.4: no client site is indexable until it has a paid plan and the owner turns on
      // "Let search engines find this site" (Phase 4+). Until then every client host is noindex by
      // header too; the renderer's meta tags and robots.txt already make the per-site decision.
      res.headers.set('X-Robots-Tag', 'noindex')
      return res
    }, true)
  }
  return applyCsp(request, (requestHeaders) => {
    const res = NextResponse.next({ request: { headers: requestHeaders } })
    // Phase 0: the studio is not launched, so every studio response is noindex (robots.ts agrees).
    res.headers.set('X-Robots-Tag', 'noindex, nofollow')
    return res
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
