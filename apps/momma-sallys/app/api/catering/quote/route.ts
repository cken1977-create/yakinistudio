// Catering quote form → Momma Sally's pipeline (stage: Inquiry), then the email sequence.
// Guards: honeypot, minimum fill time, field checks, per-network limit (hashed, never the raw address).
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { funnel, funnelConfigured, type Lead } from '@/lib/funnel/db'
import { alertOwner, startSequence } from '@/lib/funnel/mailer'
import { cleanSource, EMAIL_CONSENT_TEXT, EMAIL_CONSENT_TEXT_ES, EVENT_TYPES, BUDGETS, MIN_GUESTS, MAX_GUESTS } from '@/config/funnel'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const bad = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status })
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export async function POST(req: NextRequest) {
  if (!funnelConfigured()) return bad('Quote requests open soon. Please call or text us.', 503)
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return bad('Bad request')

  // Honeypot + too-fast: answer like a success so bots learn nothing.
  const started = Number(body.started_at)
  if (str(body.company_website, 200) || !Number.isFinite(started) || Date.now() - started < 2500) {
    return NextResponse.json({ ok: true })
  }

  const full_name = str(body.full_name, 120)
  const email = str(body.email, 254).toLowerCase()
  const phoneDigits = str(body.phone, 40).replace(/[^\d+]/g, '')
  const event_date = str(body.event_date, 10)
  const headcount = Number(body.headcount)
  const event_type = str(body.event_type, 20)
  const budget = str(body.budget, 20)
  const notes = str(body.notes, 2000)
  const lang = body.lang === 'es' ? 'es' : 'en'
  const email_consent = body.email_consent === true

  if (!full_name) return bad('Please add your name.')
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) return bad('Please add a valid email so we can send your quote.')
  const phone = phoneDigits ? (phoneDigits.startsWith('+') ? phoneDigits : phoneDigits.length === 10 ? `+1${phoneDigits}` : `+${phoneDigits}`) : ''
  if (phone && !/^\+[0-9]{10,15}$/.test(phone)) return bad('Please check your phone number.')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(event_date)) return bad('Please pick your event date.')
  const today = new Date(); today.setUTCHours(0, 0, 0, 0)
  if (new Date(`${event_date}T00:00:00Z`).getTime() < today.getTime() - 86400_000) return bad('Please pick a date that has not passed.')
  if (!Number.isInteger(headcount) || headcount < MIN_GUESTS || headcount > MAX_GUESTS) return bad(`Catering starts at ${MIN_GUESTS} guests.`)
  if (!EVENT_TYPES.some((t) => t.id === event_type)) return bad('Please pick the type of event.')
  if (budget && !BUDGETS.some((b) => b.id === budget)) return bad('Please pick a budget range.')

  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || req.headers.get('x-real-ip') || ''
  const salt = process.env.OFFICE_SESSION_SECRET ?? 'ms'
  const ip_hash = ip ? createHash('sha256').update(`ms-funnel-ip-v1:${salt}:${ip}`).digest('hex') : null
  const testList = (process.env.FUNNEL_EMAIL_ALLOWLIST ?? '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean)

  try {
    const r = await funnel<{ id?: string; unsub_token?: string; dup?: boolean; error?: string }>('submit', {
      full_name, email, phone, event_date, headcount: String(headcount), event_type, budget, notes,
      source: cleanSource(str(body.source, 32)), lang, email_consent,
      consent_text: email_consent ? (lang === 'es' ? EMAIL_CONSENT_TEXT_ES : EMAIL_CONSENT_TEXT) : null,
      ip_hash, is_test: testList.includes(email),
    })
    if (r.error === 'rate') return bad('Too many requests from this network. Please call or text us.', 429)
    if (!r.id) return bad('Something went wrong. Please call or text us.', 500)
    if (!r.dup) {
      const got = await funnel<{ lead: Lead }>('get', { id: r.id })
      const lead = got.lead
      await Promise.all([startSequence(lead), alertOwner(lead)])
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[catering-quote]', String(e).slice(0, 200))
    return bad('Something went wrong. Please call or text us.', 500)
  }
}
