// Sends, schedules and cancels funnel emails, and logs every attempt in the database.
// Safety: outside production, mail only goes to FUNNEL_EMAIL_ALLOWLIST (test inboxes). In production,
// nothing sends unless FUNNEL_EMAIL_LIVE=1 and a mailing address is set (fails closed).
import 'server-only'
import { funnel, type Lead } from './db'
import { buildLeadEmail, buildOwnerAlert, buildQuoteEmail, type EmailKind } from './emails'
import { FOLLOWUP_DAYS } from '@/config/funnel'
import { daysLaterAt10 } from './time'

const isProd = () => process.env.VERCEL_ENV === 'production'

export function fromAddress() {
  return process.env.FUNNEL_FROM?.trim() || "Momma Sally's BBQ <catering@mamasallys.com>"
}
export function replyTo() {
  return process.env.FUNNEL_REPLY_TO?.trim() || process.env.OWNER_EMAIL?.trim() || 'hello@mamasallys.com'
}
export function mailingAddress() {
  return process.env.FUNNEL_MAILING_ADDRESS?.trim() || ''
}
export function siteBase() {
  const explicit = process.env.FUNNEL_SITE_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, '')
  if (process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_BRANCH_URL) return `https://${process.env.VERCEL_BRANCH_URL}`
  if (process.env.VERCEL_URL && !isProd()) return `https://${process.env.VERCEL_URL}`
  return 'https://mamasallys.com'
}

function allowlist(): string[] {
  return (process.env.FUNNEL_EMAIL_ALLOWLIST ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
}

/** Why an email must not go out, or null when it may. */
export function blockReason(to: string | null): string | null {
  if (!to) return 'no email address'
  if (!process.env.RESEND_API_KEY) return 'email key not configured'
  if (!mailingAddress()) return 'FUNNEL_MAILING_ADDRESS not set (fail closed)'
  if (isProd()) {
    if (process.env.FUNNEL_EMAIL_LIVE !== '1') return 'FUNNEL_EMAIL_LIVE is off'
    return null
  }
  return allowlist().includes(to.toLowerCase()) ? null : 'preview: recipient not on the test allowlist'
}

/** Preview-only: follow-ups land after N minutes instead of days, so the whole sequence can be tested. */
function testMinutes(): number[] | null {
  if (isProd()) return null
  const raw = process.env.FUNNEL_TEST_FOLLOWUP_MINUTES?.trim()
  if (!raw) return null
  const m = raw.split(',').map((x) => Number(x.trim()))
  return m.length === 3 && m.every((x) => Number.isFinite(x) && x >= 1 && x <= 600) ? m : null
}

type Send = { status: 'sent' | 'scheduled' | 'skipped' | 'failed'; id?: string; error?: string }

async function deliver(to: string, m: { subject: string; html: string; text: string }, unsub: string | null, at?: Date): Promise<Send> {
  try {
    const headers: Record<string, string> = {}
    if (unsub) {
      headers['List-Unsubscribe'] = `<${unsub}>`
      headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click'
    }
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: fromAddress(), to: [to], reply_to: replyTo(), subject: m.subject, html: m.html, text: m.text, headers,
        ...(at ? { scheduled_at: at.toISOString() } : {}),
      }),
    })
    const j = (await r.json().catch(() => null)) as { id?: string; message?: string } | null
    if (!r.ok) return { status: 'failed', error: `send failed (${r.status}) ${String(j?.message ?? '').slice(0, 160)}` }
    return { status: at ? 'scheduled' : 'sent', id: j?.id }
  } catch (e) {
    return { status: 'failed', error: `send error ${String((e as Error)?.message ?? e).slice(0, 160)}` }
  }
}

async function log(leadId: string | null, kind: EmailKind, to: string | null, res: Send, at?: Date) {
  await funnel('email_log', { lead_id: leadId, kind, to_email: to, status: res.status, send_id: res.id ?? null, scheduled_for: at?.toISOString() ?? null, error: res.error ?? null })
    .catch((e) => console.warn('[funnel] email log failed', String(e).slice(0, 120)))
}

export function leadUrls(lead: Pick<Lead, 'unsub_token' | 'id'>) {
  const base = siteBase()
  return {
    unsub: `${base}/catering/unsubscribe?t=${lead.unsub_token}`,
    oneClick: `${base}/api/catering/unsubscribe?t=${lead.unsub_token}`,
    quote: `${base}/catering?src=email#quote`,
    office: `${base}/office/lead/${lead.id}`,
  }
}

function vars(lead: Lead) {
  const u = leadUrls(lead)
  return {
    firstName: lead.full_name.split(/\s+/)[0] || lead.full_name,
    eventDate: lead.event_date, headcount: lead.headcount, eventType: lead.event_type, lang: lead.lang,
    quoteUrl: u.quote, unsubUrl: u.unsub, mailingAddress: mailingAddress(),
  }
}

/** Day 0 confirmation now; day 1/3/7 scheduled only when they ticked the consent box. */
export async function startSequence(lead: Lead) {
  const out: Record<string, Send> = {}
  const u = leadUrls(lead)
  const block = blockReason(lead.email)
  const confirm = block ? ({ status: block.startsWith('preview') || block === 'no email address' ? 'skipped' : 'failed', error: block } as Send)
    : await deliver(lead.email!, buildLeadEmail('confirm', vars(lead)), u.oneClick)
  await log(lead.id, 'confirm', lead.email, confirm)
  out.confirm = confirm
  if (!lead.email_consent || lead.unsubscribed_at) return out
  const mins = testMinutes()
  const plan: ['day1' | 'day3' | 'day7', Date][] = (['day1', 'day3', 'day7'] as const).map((k, i) => [
    k, mins ? new Date(Date.now() + mins[i] * 60_000) : daysLaterAt10(FOLLOWUP_DAYS[k]),
  ])
  for (const [kind, at] of plan) {
    const res = block ? ({ status: 'skipped', error: block } as Send) : await deliver(lead.email!, buildLeadEmail(kind, vars(lead)), u.oneClick, at)
    await log(lead.id, kind, lead.email, res, at)
    out[kind] = res
  }
  return out
}

/** Cancel every follow-up still waiting for this lead (reply, booked, lost, or unsubscribe). */
export async function stopSequence(leadId: string, why: string) {
  const rows = await funnel<{ id: string; send_id: string | null; kind: string }[]>('scheduled_for_lead', { lead_id: leadId })
  let canceled = 0
  for (const e of rows ?? []) {
    let ok = !e.send_id
    let alreadySent = false
    if (e.send_id && process.env.RESEND_API_KEY) {
      const auth = { Authorization: `Bearer ${process.env.RESEND_API_KEY}` }
      try {
        const c = await fetch(`https://api.resend.com/emails/${encodeURIComponent(e.send_id)}/cancel`, { method: 'POST', headers: auth })
        ok = c.ok
        if (!ok) {
          // Too late to cancel? Then it already went out at its scheduled time.
          const g = await fetch(`https://api.resend.com/emails/${encodeURIComponent(e.send_id)}`, { headers: auth })
          const j = (await g.json().catch(() => null)) as { last_event?: string } | null
          alreadySent = !!j?.last_event && j.last_event !== 'scheduled' && j.last_event !== 'canceled'
        }
      } catch { ok = false }
    }
    await funnel('email_set_status', ok ? { id: e.id, status: 'canceled', error: why }
      : alreadySent ? { id: e.id, status: 'sent', error: null }
      : { id: e.id, status: 'scheduled', error: `cancel failed (${why}); check before send time` })
    if (ok) canceled++
  }
  return canceled
}

export async function alertOwner(lead: Lead) {
  const to = process.env.OWNER_EMAIL?.trim() || null
  const m = buildOwnerAlert({ name: lead.full_name, email: lead.email, phone: lead.phone, eventDate: lead.event_date, headcount: lead.headcount, eventType: lead.event_type, budget: lead.budget, source: lead.source, notes: lead.notes, leadUrl: leadUrls(lead).office, consent: lead.email_consent })
  const block = blockReason(to)
  const res = block ? ({ status: 'skipped', error: block } as Send) : await deliver(to!, m, null)
  await log(lead.id, 'owner_alert', to, res)
  return res
}

export async function sendQuote(lead: Lead) {
  const amount = lead.quote_amount_cents != null ? `$${(lead.quote_amount_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null
  const m = buildQuoteEmail({ ...vars(lead), amount, note: lead.quote_note, depositUrl: lead.deposit_url })
  const block = lead.unsubscribed_at ? 'unsubscribed' : blockReason(lead.email)
  const res = block ? ({ status: 'skipped', error: block } as Send) : await deliver(lead.email!, m, leadUrls(lead).oneClick)
  await log(lead.id, 'quote', lead.email, res)
  return res
}

export async function sendRaw(kind: EmailKind, to: string | null, m: { subject: string; html: string; text: string }) {
  const block = blockReason(to)
  const res = block ? ({ status: 'skipped', error: block } as Send) : await deliver(to!, m, null)
  await log(null, kind, to, res)
  return res
}
