// One-click unsubscribe (List-Unsubscribe-Post) and the button on /catering/unsubscribe.
// Stops every waiting follow-up for that lead.
import { NextRequest, NextResponse } from 'next/server'
import { unsubscribeToken } from '@/lib/funnel/unsub'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const t = req.nextUrl.searchParams.get('t') ?? ''
  try {
    const ok = await unsubscribeToken(t, 'one_click')
    return NextResponse.json({ ok }, { status: ok ? 200 : 404 })
  } catch (e) {
    console.error('[unsubscribe]', String(e).slice(0, 160))
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
