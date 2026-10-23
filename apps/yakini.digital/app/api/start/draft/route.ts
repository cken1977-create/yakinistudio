import { NextRequest, NextResponse } from 'next/server'
import { emailBuildPayload, parseSavedBuild, safeBuildToken } from '@/lib/orders/saved-build'
import { loadBuildDraft, saveBuildDraft } from '@/lib/orders/submit'
import { rateLimited, tooMany } from '@/lib/server/guard'

function callerIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || headers.get('x-real-ip')?.trim() || 'unknown'
}

export const dynamic = 'force-dynamic'

/** Restore from ?build=<token>. A missing portal draft is an empty result, not an error. */
export async function GET(request: NextRequest) {
  if (rateLimited(`draft-get:${callerIp(request.headers)}`, 30, 60 * 60_000)) return tooMany()
  const token = safeBuildToken(request.nextUrl.searchParams.get('token') ?? '')
  if (!token) return NextResponse.json({ build: null })
  const build = await loadBuildDraft(token)
  return NextResponse.json({ build })
}

/**
 * Email a link back to the in-progress build.
 * Preview stays in test mode. A portal miss still returns ok so the page does not stall.
 */
export async function POST(request: NextRequest) {
  if (rateLimited(`draft-post:${callerIp(request.headers)}`, 8, 60 * 60_000)) return tooMany()
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ ok: true, sent: false })
  }
  if (!raw || typeof raw !== 'object') return NextResponse.json({ ok: true, sent: false })
  const body = raw as { consent?: unknown; name?: unknown; email?: unknown; build?: unknown }
  const saved = parseSavedBuild(body.build)
  if (!saved) return NextResponse.json({ ok: true, sent: false })
  const payload = emailBuildPayload(
    saved,
    typeof body.name === 'string' ? body.name : '',
    typeof body.email === 'string' ? body.email : '',
    body.consent === true,
  )
  if (!payload) return NextResponse.json({ ok: true, sent: false })
  const result = await saveBuildDraft(payload)
  return NextResponse.json({ ok: true, testMode: result.testMode, sent: result.sent })
}
