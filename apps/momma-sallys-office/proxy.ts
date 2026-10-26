// Next 16 proxy. The whole office is OFF unless OFFICE_ENABLED=true:
// every path returns a plain 404 (no hint that an app lives here).
import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  if (process.env.OFFICE_ENABLED !== 'true') {
    return new NextResponse('Not found', { status: 404, headers: { 'X-Robots-Tag': 'noindex' } })
  }
  // Square webhooks and cron don't carry a user session.
  const p = request.nextUrl.pathname
  if (p.startsWith('/api/square/webhook') || p.startsWith('/api/cron/')) return NextResponse.next()
  return updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
