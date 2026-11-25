import 'server-only'

/** 303 back to a studio page with a fixed result code (no free text in URLs). */
export const backTo = (path: string, code: string) =>
  new Response(null, { status: 303, headers: { location: `${path}${path.includes('?') ? '&' : '?'}result=${encodeURIComponent(code)}`, 'cache-control': 'no-store' } })
