import { NextRequest, NextResponse } from 'next/server'
import { clientIp, EsignConfigError } from '@/lib/esign/server'
import { rateLimited } from '@/lib/server/guard'
import { unsubscribe } from '@/lib/academy/server'

// POST /api/class/unsubscribe?t=…
//  - One-click from the mail app (RFC 8058: body "List-Unsubscribe=One-Click").
//  - The button on /class/unsubscribe and /clase/baja (JSON body {t}).
// GET never changes anything (link scanners open links); it sends people to the page.
export async function POST(req: NextRequest) {
  if (rateLimited(`class-unsub:${clientIp(req.headers) ?? 'unknown'}`, 30, 60 * 60_000)) return NextResponse.json({ error: 'slow' }, { status: 429 })
  let token = req.nextUrl.searchParams.get('t') ?? ''
  let via: 'link' | 'one_click' = 'one_click'
  const type = req.headers.get('content-type') ?? ''
  if (type.includes('application/json')) {
    const b = await req.json().catch(() => null) as { t?: string } | null
    if (b?.t) { token = String(b.t); via = 'link' }
  }
  try {
    const r = await unsubscribe(token, via)
    if (r === 'ok') return NextResponse.json({ ok: true })
    return NextResponse.json({ ok: false, error: r }, { status: r === 'not_ready' ? 503 : 404 })
  } catch (e) {
    if (e instanceof EsignConfigError) return NextResponse.json({ ok: false, error: 'not_ready' }, { status: 503 })
    console.error('[class-unsub] failed:', (e as Error)?.message)
    return NextResponse.json({ ok: false, error: 'server' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get('t') ?? ''
  return NextResponse.redirect(new URL(`/class/unsubscribe?t=${encodeURIComponent(t)}`, req.url), 303)
}
