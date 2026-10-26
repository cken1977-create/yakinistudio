// Square webhook signature check (docs: "Verify and validate an event notification").
// signature = base64( HMAC-SHA256( signatureKey, notificationUrl + rawBody ) )
// header: x-square-hmacsha256-signature. Compared in constant time.
import { createHmac } from 'node:crypto'
import { safeEqual } from './crypto'

export const SIGNATURE_HEADER = 'x-square-hmacsha256-signature'

export function expectedSignature(rawBody: string, notificationUrl: string, signatureKey: string): string {
  return createHmac('sha256', signatureKey).update(notificationUrl + rawBody).digest('base64')
}

export function verifySquareSignature(opts: {
  rawBody: string
  signatureHeader: string | null | undefined
  notificationUrl: string
  signatureKey: string
}): boolean {
  const { rawBody, signatureHeader, notificationUrl, signatureKey } = opts
  if (!signatureHeader || !signatureKey || !notificationUrl || !rawBody) return false
  return safeEqual(expectedSignature(rawBody, notificationUrl, signatureKey), signatureHeader.trim())
}

export type SquareEvent = {
  merchant_id?: string
  type: string
  event_id: string
  created_at?: string
  data?: { type?: string; id?: string; deleted?: boolean; object?: Record<string, unknown> }
}

export function parseSquareEvent(rawBody: string): SquareEvent | null {
  try {
    const e = JSON.parse(rawBody)
    if (!e || typeof e.type !== 'string' || typeof e.event_id !== 'string') return null
    return e as SquareEvent
  } catch {
    return null
  }
}

/** Webhook types slice 1 subscribes to. Anything else is logged as ignored. */
export const HANDLED_EVENT_TYPES = new Set([
  'order.created', 'order.updated',
  'payment.created', 'payment.updated',
  'refund.created', 'refund.updated',
  'catalog.version.updated',
  'customer.created', 'customer.updated', 'customer.deleted',
  'team_member.created', 'team_member.updated',
  'oauth.authorization.revoked',
])
