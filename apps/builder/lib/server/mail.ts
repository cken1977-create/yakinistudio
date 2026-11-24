import 'server-only'
import * as Sentry from '@sentry/nextjs'
import { serverEnv } from './env'
import { isTestMode } from './runtime'

/**
 * Internal alerts only (spec 5.8 step 5, 5.11 step 3, 14.8): the site owner about a form message,
 * operators about reports and reviews. Never to a visitor, a reporter or a prospect (R4, R5), so
 * this module has no "reply to the sender" path at all. Plain text, no tracking.
 *
 * Sent through Resend's HTTPS API when RESEND_API_KEY and EMAIL_FROM are set. A failure never
 * fails the visitor's request; it is reported without the message body.
 */
export type Mail = { to: string[]; subject: string; text: string; tag: 'form-alert' | 'report-alert' | 'review-alert' }

const outbox = globalThis as typeof globalThis & { __yakiniOutbox?: Mail[] }
/** Test mode keeps alerts here instead of sending them (read by unit and browser tests). */
export const testOutbox = (): Mail[] => (outbox.__yakiniOutbox ??= [])

export async function sendAlert(mail: Mail): Promise<'sent' | 'skipped' | 'failed'> {
  const to = [...new Set(mail.to.map((t) => t.trim().toLowerCase()).filter((t) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)))].slice(0, 5)
  if (!to.length) return 'skipped'
  if (isTestMode()) { testOutbox().push({ ...mail, to }); return 'sent' }
  const key = serverEnv('RESEND_API_KEY')
  const from = serverEnv('EMAIL_FROM')
  if (!key || !from) return 'skipped'
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from, to, subject: mail.subject.slice(0, 150), text: mail.text.slice(0, 20_000) }),
      signal: AbortSignal.timeout(8000),
    })
    if (res.ok) return 'sent'
    Sentry.captureMessage('alert email refused', { level: 'warning', tags: { alert: mail.tag, status: String(res.status) } })
    return 'failed'
  } catch {
    Sentry.captureMessage('alert email failed', { level: 'warning', tags: { alert: mail.tag } })
    return 'failed'
  }
}

export function operatorEmails(): string[] {
  return (serverEnv('OPERATOR_EMAIL') ?? '').split(',').map((s) => s.trim()).filter(Boolean)
}
