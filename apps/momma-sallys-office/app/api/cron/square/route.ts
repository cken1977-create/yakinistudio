// Daily: refresh the Square token if it's within 7 days of expiring, then an
// incremental sync (catches anything a webhook missed). Needs CRON_SECRET.
import { NextResponse } from 'next/server'
import { flags } from '@/lib/flags'
import { getApi, runSync } from '@/lib/square/sync'
import { getConnection } from '@/lib/square/store'
import { createAdminClient } from '@/lib/supabase/admin'
import { cronAuthorized } from '@/lib/route-guards'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: Request) {
  if (!flags.squareSync() || !cronAuthorized(req)) return new NextResponse('Not found', { status: 404 })
  const db = createAdminClient()
  const conn = await getConnection(db)
  if (conn?.status !== 'connected') return NextResponse.json({ skipped: 'not connected' })
  try { await getApi(db) } catch { return NextResponse.json({ ok: false, step: 'refresh' }) }
  const r = await runSync(db, 'incremental', 'cron')
  return NextResponse.json({ ok: r.ok, counts: r.counts })
}
