import { NextRequest, NextResponse } from 'next/server'
import { rest, clientIp, EsignConfigError } from '@/lib/esign/server'
import { rateLimited, siteUrl } from '@/lib/server/guard'
import { classReady } from '@/lib/academy/config'
import { cancelScheduled, scheduleFollowups, signupByToken } from '@/lib/academy/server'

// The replay page reports "started" (first play) and "watched" (80%).
export async function POST(req: NextRequest) {
  if (rateLimited(`class-progress:${clientIp(req.headers) ?? 'unknown'}`, 60, 60 * 60_000)) return NextResponse.json({ error: 'slow' }, { status: 429 })
  const body = await req.json().catch(() => null) as { t?: string; event?: string } | null
  const event = body?.event
  if (event !== 'started' && event !== 'watched') return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  try {
    const { signup, missing } = await signupByToken(String(body?.t ?? ''))
    if (missing || !signup) return NextResponse.json({ ok: false }, { status: missing ? 503 : 404 })
    if (!classReady(signup.language)) return NextResponse.json({ ok: false }, { status: 409 }) // nothing to watch yet
    const now = new Date().toISOString()
    if (event === 'started' && !signup.started_at) {
      await rest(`class_signups?id=eq.${signup.id}&started_at=is.null`, { method: 'PATCH', body: { started_at: now } })
    }
    if (event === 'watched' && !signup.watched_at) {
      const patch: Record<string, unknown> = { watched_at: now, started_at: signup.started_at ?? now }
      if (signup.stage === 'signed_up') patch.stage = 'watched'
      const u = await rest<unknown[]>(`class_signups?id=eq.${signup.id}&watched_at=is.null`, { method: 'PATCH', prefer: 'return=representation', body: patch })
      if (u.ok && Array.isArray(u.data) && u.data.length) {
        await cancelScheduled(signup.id, ['reminder_1', 'reminder_2'])
        await scheduleFollowups(signup, siteUrl(req.url))
      }
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof EsignConfigError) return NextResponse.json({ ok: false }, { status: 503 })
    console.error('[class-progress] failed:', (e as Error)?.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
