import { timingSafeEqual } from 'node:crypto'
import * as Sentry from '@sentry/nextjs'
import { lapseSites } from '@/lib/server/billing'
import { getRuntime } from '@/lib/server/runtime'

/**
 * Daily draft clean-up (spec 5.2 step 7): unclaimed anonymous drafts older than 14 days are
 * soft-deleted (an operator can restore them for 30 days). Phase 4: sites whose plan has lapsed go
 * offline (nothing is deleted). Vercel Cron calls this with
 * `Authorization: Bearer $CRON_SECRET`; anything else gets a 401.
 */
export const dynamic = 'force-dynamic'

function authorized(header: string | null, secret: string | undefined): boolean {
  if (!secret || secret.length < 16 || !header) return false
  const a = Buffer.from(header)
  const b = Buffer.from(`Bearer ${secret}`)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function GET(request: Request): Promise<Response> {
  if (!authorized(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    return Response.json({ ok: false }, { status: 401, headers: { 'cache-control': 'no-store' } })
  }
  try {
    const rt = getRuntime()
    const expired = await rt.store.expireDrafts(new Date())
    const lapsed = await lapseSites(rt)
    return Response.json({ ok: true, expired, lapsed }, { headers: { 'cache-control': 'no-store' } })
  } catch (e) {
    Sentry.captureException(e, { tags: { area: 'draft-cleanup' } })
    return Response.json({ ok: false }, { status: 500, headers: { 'cache-control': 'no-store' } })
  }
}
