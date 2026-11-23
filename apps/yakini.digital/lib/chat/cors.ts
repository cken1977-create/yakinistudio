const EXACT = new Set([
  'https://yakini.digital',
  'https://www.yakini.digital',
  'http://127.0.0.1:4173',
  'http://localhost:4173',
  'http://127.0.0.1:3000',
  'http://localhost:3000',
])

const PREVIEW = /^https:\/\/yakini-immersive-v2(?:-git-[\w-]+)?(?:-[a-z0-9]+)?-brsa-registry\.vercel\.app$/i

export function allowOrigin(origin: string | null): string | null {
  if (!origin) return null
  if (EXACT.has(origin)) return origin
  if (PREVIEW.test(origin)) return origin
  return null
}

export function corsHeaders(req: Request, extra?: Record<string, string>): Headers {
  const headers = new Headers(extra)
  const allowed = allowOrigin(req.headers.get('origin'))
  if (allowed) {
    headers.set('Access-Control-Allow-Origin', allowed)
    headers.set('Vary', 'Origin')
    headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'content-type')
  }
  return headers
}

export function preflight(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req) })
}
