import { NextResponse, type NextRequest } from 'next/server'
import { decideHost } from '@/lib/hosts'

// Next.js 16 renamed middleware.ts to proxy.ts (spec 13.5 calls it middleware.ts).
export function proxy(request: NextRequest) {
  const d = decideHost(request.headers.get('host'), request.nextUrl.pathname, process.env.STUDIO_HOST || undefined)
  if (d.kind === 'block') {
    return new NextResponse('Not found', { status: 404, headers: { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' } })
  }
  if (d.kind === 'site') {
    const url = request.nextUrl.clone()
    url.pathname = d.rewriteTo
    const res = NextResponse.rewrite(url)
    res.headers.set('X-Robots-Tag', 'noindex') // Phase 0: no client sites are live yet
    return res
  }
  const res = NextResponse.next()
  // Phase 0: the studio is not launched, so every studio response is noindex (robots.ts agrees).
  res.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
