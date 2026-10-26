// Square webhooks. Verify the signature on the RAW body, de-dupe on
// event_id (Square retries for up to 24h and may send duplicates), answer
// 200 fast, then re-fetch the object from Square in the background.
import { NextResponse, after } from 'next/server'
import { flags } from '@/lib/flags'
import { getSquareConfig } from '@/lib/square/config'
import { HANDLED_EVENT_TYPES, SIGNATURE_HEADER, parseSquareEvent, verifySquareSignature } from '@/lib/square/webhook'
import { finishWebhookEvent, getConnection, markDisconnected, recordWebhookEvent } from '@/lib/square/store'
import { syncObject } from '@/lib/square/sync'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: Request) {
  if (!flags.squareSync()) return new NextResponse('Not found', { status: 404 })
  let cfg
  try { cfg = getSquareConfig() } catch { return new NextResponse('Not configured', { status: 503 }) }

  const raw = await req.text()
  const ok = verifySquareSignature({
    rawBody: raw,
    signatureHeader: req.headers.get(SIGNATURE_HEADER),
    notificationUrl: cfg.webhookNotificationUrl,
    signatureKey: cfg.webhookSignatureKey,
  })
  if (!ok) return new NextResponse('Bad signature', { status: 403 })

  const event = parseSquareEvent(raw)
  if (!event) return new NextResponse('Bad event', { status: 400 })

  const db = createAdminClient()
  const conn = await getConnection(db)
  if (conn?.merchant_id && event.merchant_id && event.merchant_id !== conn.merchant_id) {
    return NextResponse.json({ ignored: 'other merchant' })
  }
  const fresh = await recordWebhookEvent(db, { event_id: event.event_id, type: event.type, merchant_id: event.merchant_id, object_id: event.data?.id ?? null })
  if (!fresh) return NextResponse.json({ duplicate: true })

  after(async () => {
    try {
      if (!HANDLED_EVENT_TYPES.has(event.type)) return finishWebhookEvent(db, event.event_id, 'ignored')
      if (event.type === 'oauth.authorization.revoked') {
        await markDisconnected(db, 'revoked', 'Access was revoked in Square')
      } else {
        await syncObject(db, event.type, event.data?.id, event.data?.object)
      }
      await finishWebhookEvent(db, event.event_id, 'processed')
    } catch (e) {
      await finishWebhookEvent(db, event.event_id, 'error', e)
    }
  })
  return NextResponse.json({ ok: true })
}
