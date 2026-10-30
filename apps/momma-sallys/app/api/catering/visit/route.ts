// Counts a visit to the catering page (one per browser tab session), tagged by ?src=. No cookies, no
// third-party trackers, nothing personal stored: just time, page and source.
import { NextRequest, NextResponse } from 'next/server'
import { funnel, funnelConfigured } from '@/lib/funnel/db'
import { cleanSource } from '@/config/funnel'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|monitor/i

export async function POST(req: NextRequest) {
  if (!funnelConfigured()) return new NextResponse(null, { status: 204 })
  if (BOT.test(req.headers.get('user-agent') ?? '')) return new NextResponse(null, { status: 204 })
  const b = (await req.json().catch(() => null)) as { path?: string; source?: string } | null
  const path = b?.path === '/events' ? '/events' : '/catering'
  await funnel('visit', { path, source: cleanSource(b?.source) }).catch((e) => console.warn('[visit]', String(e).slice(0, 120)))
  return new NextResponse(null, { status: 204 })
}
