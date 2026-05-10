// VIZIONZ SANKOFA · Supabase middleware utility
// Refreshes the operator's session on every request and exposes the
// current pathname to server components via the x-pathname header.

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Expose the current path to server components (e.g., AdminLayout's
  // skip-check for /admin/login). Layouts can't access usePathname,
  // so we propagate via a request header set in middleware.
  supabaseResponse.headers.set('x-pathname', request.nextUrl.pathname)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          supabaseResponse.headers.set('x-pathname', request.nextUrl.pathname)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: getUser() refreshes the session if needed.
  // Do not put any logic between createServerClient and getUser
  // or sessions can silently fail to refresh.
  await supabase.auth.getUser()

  return supabaseResponse
}
