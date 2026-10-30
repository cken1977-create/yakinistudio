// Server-only helpers for the Yakini Academy free class: database access, consent-safe
// email sending, scheduling and cancelling. Import from route handlers / server components only.
import { rest, type RestResult, isTestRecipient } from '@/lib/esign/server'
import { sha256Hex } from '@/lib/server/guard'
import { CLASS_SLUG, FOLLOWUPS_ENABLED, PATHS, WORKBOOK_URL, classReady, type Lang } from './config'
import { buildEmail, type EmailKind } from './emails'

export const CLASS_FROM = 'Clarence at Yakini <hello@yakini.digital>'
export const CLASS_REPLY_TO = 'hello@yakini.digital'

export type Signup = {
  id: string
  created_at: string
  class_slug: string
  first_name: string
  email: string
  language: Lang
  landing_path: string
  phone: string | null
  sms_consent: boolean
  country: string | null
  source: string
  timezone: string | null
  access_token: string
  started_at: string | null
  watched_at: string | null
  stage: string
  unsubscribed_at: string | null
}

/** True when the class tables don't exist yet (migration not applied). */
export function tablesMissing(r: RestResult<unknown>): boolean {
  return !r.ok && (r.status === 404 || r.error?.code === 'PGRST205' || r.error?.code === '42P01')
}

export class ClassNotReadyError extends Error {}

/** Salted hash of the IP: we never store the raw address. */
export async function ipHash(ip: string | null): Promise<string | null> {
  if (!ip) return null
  const salt = process.env.CLASS_IP_SALT?.trim() || process.env.SESSION_SECRET?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || ''
  return sha256Hex(`yakini-class-ip-v1:${salt}:${ip}`)
}

export const tokenOk = (t: string | null | undefined): t is string => !!t && /^[0-9a-f]{48}$/.test(t)

export async function signupByToken(token: string): Promise<{ signup: Signup | null; missing: boolean }> {
  if (!tokenOk(token)) return { signup: null, missing: false }
  const r = await rest<Signup[]>(`class_signups?access_token=eq.${token}&select=*&limit=1`)
  if (tablesMissing(r)) return { signup: null, missing: true }
  if (!r.ok) throw new Error(`class lookup failed (${r.status})`)
  return { signup: r.data?.[0] ?? null, missing: false }
}

export function classUrls(base: string, s: Pick<Signup, 'language' | 'access_token'>) {
  const p = PATHS[s.language]
  return {
    watch: `${base}${p.watch}?t=${s.access_token}`,
    unsubscribe: `${base}${p.unsubscribe}?t=${s.access_token}`,
    oneClick: `${base}/api/class/unsubscribe?t=${s.access_token}`,
  }
}

/** UTC instant for `hour`:00 local time, `days` days after now, in the given IANA zone. */
export function localTimeFromNow(tz: string | null, days: number, hour = 10): Date {
  const zone = tz && isZone(tz) ? tz : 'America/Denver'
  const now = new Date()
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: zone, year: 'numeric', month: 'numeric', day: 'numeric' })
    .formatToParts(now).filter((p) => p.type !== 'literal').map((p) => [p.type, Number(p.value)]))
  const guess = Date.UTC(parts.year, parts.month - 1, parts.day + days, hour, 0, 0)
  const offset = (at: number) => {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })
      .formatToParts(new Date(at)).filter((x) => x.type !== 'literal').map((x) => [x.type, Number(x.value)]))
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - at
  }
  let t = guess - offset(guess)
  t = guess - offset(t)
  return new Date(t)
}

export function isZone(tz: string): boolean {
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true } catch { return false }
}

type SendResult = { status: 'sent' | 'scheduled' | 'failed' | 'skipped'; id?: string; error?: string }

async function resendSend(to: string, subject: string, html: string, text: string, urls: ReturnType<typeof classUrls>, scheduledAt?: Date): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY
  if (!key) return { status: 'failed', error: 'email key not configured' }
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        from: CLASS_FROM,
        to: [to],
        reply_to: CLASS_REPLY_TO,
        subject, html, text,
        headers: {
          'List-Unsubscribe': `<${urls.oneClick}>, <mailto:${CLASS_REPLY_TO}?subject=unsubscribe>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
        ...(scheduledAt ? { scheduled_at: scheduledAt.toISOString() } : {}),
      }),
    })
    const j = (await r.json().catch(() => null)) as { id?: string; message?: string } | null
    if (!r.ok) return { status: 'failed', error: `send failed (${r.status}) ${String(j?.message ?? '').slice(0, 160)}` }
    return { status: scheduledAt ? 'scheduled' : 'sent', id: j?.id }
  } catch (e) {
    return { status: 'failed', error: `send error ${String((e as Error)?.message ?? e).slice(0, 160)}` }
  }
}

/**
 * Sends (or schedules) one class email and records it in class_emails.
 * Fails closed: no mailing address setting, no email. Never emails unsubscribed people or test domains.
 */
export async function sendClassEmail(s: Signup, kind: EmailKind, base: string, scheduledAt?: Date): Promise<SendResult> {
  let res: SendResult
  const address = process.env.CLASS_MAILING_ADDRESS?.trim()
  if (s.unsubscribed_at) res = { status: 'skipped', error: 'unsubscribed' }
  else if (isTestRecipient(s.email)) res = { status: 'skipped', error: 'test address' }
  else if (!address) res = { status: 'failed', error: 'CLASS_MAILING_ADDRESS not set (fail closed)' }
  else {
    const urls = classUrls(base, s)
    const m = buildEmail(kind, s.language, {
      firstName: s.first_name, watchUrl: urls.watch, unsubUrl: urls.unsubscribe, mailingAddress: address,
      classReady: classReady(s.language), workbookUrl: WORKBOOK_URL,
    })
    res = await resendSend(s.email, m.subject, m.html, m.text, urls, scheduledAt)
  }
  if (res.status === 'failed') console.warn(`[class-email] ${kind} not sent: ${res.error}`)
  await rest('class_emails', {
    method: 'POST',
    body: { signup_id: s.id, kind, send_id: res.id ?? null, scheduled_for: scheduledAt?.toISOString() ?? null, status: res.status, error: res.error?.slice(0, 300) ?? null },
  })
  return res
}

/** Confirmation now, plus the two reminders (only once the class video for that language is live). */
export async function sendWelcomeSeries(s: Signup, base: string) {
  const confirm = await sendClassEmail(s, 'confirm', base)
  if (confirm.status === 'sent' && classReady(s.language)) await scheduleReminders(s, base)
  return confirm
}

export async function scheduleReminders(s: Signup, base: string) {
  await sendClassEmail(s, 'reminder_1', base, localTimeFromNow(s.timezone, 1))
  await sendClassEmail(s, 'reminder_2', base, localTimeFromNow(s.timezone, 3))
}

/** Follow-ups after watching (days 2, 4, 7). Off until the copy is approved. */
export async function scheduleFollowups(s: Signup, base: string) {
  if (!FOLLOWUPS_ENABLED) return
  await sendClassEmail(s, 'followup_1', base, localTimeFromNow(s.timezone, 2))
  await sendClassEmail(s, 'followup_2', base, localTimeFromNow(s.timezone, 4))
  await sendClassEmail(s, 'followup_3', base, localTimeFromNow(s.timezone, 7))
}

/** Cancels scheduled emails for a signup (all, or only the given kinds). */
export async function cancelScheduled(signupId: string, kinds?: EmailKind[]) {
  const filter = kinds?.length ? `&kind=in.(${kinds.join(',')})` : ''
  const r = await rest<{ id: string; send_id: string | null }[]>(`class_emails?signup_id=eq.${signupId}&status=eq.scheduled${filter}&select=id,send_id`)
  if (!r.ok || !r.data?.length) return
  const key = process.env.RESEND_API_KEY
  for (const e of r.data) {
    let ok = !e.send_id
    if (e.send_id && key) {
      try {
        const c = await fetch(`https://api.resend.com/emails/${encodeURIComponent(e.send_id)}/cancel`, { method: 'POST', headers: { Authorization: `Bearer ${key}` } })
        ok = c.ok
        if (!c.ok) console.warn('[class-email] cancel failed', c.status)
      } catch { ok = false }
    }
    await rest(`class_emails?id=eq.${e.id}`, { method: 'PATCH', body: ok ? { status: 'canceled' } : { error: 'cancel failed; check before send time' } })
  }
}

export async function unsubscribe(token: string, via: 'link' | 'one_click'): Promise<'ok' | 'not_found' | 'not_ready'> {
  const { signup, missing } = await signupByToken(token)
  if (missing) return 'not_ready'
  if (!signup) return 'not_found'
  if (!signup.unsubscribed_at) {
    const u = await rest(`class_signups?id=eq.${signup.id}`, { method: 'PATCH', body: { unsubscribed_at: new Date().toISOString(), unsubscribed_via: via } })
    if (!u.ok) throw new Error(`unsubscribe failed (${u.status})`)
  }
  await cancelScheduled(signup.id)
  return 'ok'
}

export const classSlug = CLASS_SLUG
