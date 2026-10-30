import { NextRequest, NextResponse } from 'next/server'
import { rest, clientIp, EsignConfigError } from '@/lib/esign/server'
import { rateLimited, siteUrl } from '@/lib/server/guard'
import { CLASS_SLUG, PATHS, SOURCE_TAGS, classReady, type Lang } from '@/lib/academy/config'
import { EMAIL_CONSENT, SMS_CONSENT } from '@/lib/academy/copy'
import { ipHash, isZone, sendWelcomeSeries, tablesMissing, type Signup } from '@/lib/academy/server'
import { normalizePhone } from '@/lib/academy/phone'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const MIN_FILL_MS = 3000
const RESEND_LINK_MS = 10 * 60_000

const cut = (v: unknown, n: number) => {
  const s = v == null ? '' : String(v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim()
  return s ? s.slice(0, n) : null
}

function pickSource(s: string | null, utmSource: string | null, utmMedium: string | null, referrer: string | null): string {
  const tag = s?.toLowerCase()
  if (tag && SOURCE_TAGS[tag]) return SOURCE_TAGS[tag]
  if (utmSource || utmMedium) {
    const u = (utmSource ?? '').toLowerCase()
    for (const [k, v] of Object.entries({ instagram: 'instagram', ig: 'instagram', tiktok: 'tiktok', facebook: 'facebook', fb: 'facebook', youtube: 'youtube', linkedin: 'linkedin', twitter: 'x' }))
      if (u === k && !/(cpc|paid|ads?)/i.test(utmMedium ?? '')) return v
    return 'ad'
  }
  if (!referrer) return 'direct'
  let host = ''
  try { host = new URL(referrer).hostname.replace(/^www\./, '') } catch { return 'other' }
  if (/(^|\.)instagram\.com$/.test(host)) return 'instagram'
  if (/(^|\.)tiktok\.com$/.test(host)) return 'tiktok'
  if (/(^|\.)(facebook\.com|fb\.com|fb\.me)$/.test(host)) return 'facebook'
  if (/(^|\.)(youtube\.com|youtu\.be)$/.test(host)) return 'youtube'
  if (/(^|\.)(x\.com|twitter\.com|t\.co)$/.test(host)) return 'x'
  if (/(^|\.)(linkedin\.com|lnkd\.in)$/.test(host)) return 'linkedin'
  if (host === 'yakini.digital' || host.endsWith('.yakini.digital')) return 'direct'
  return 'other'
}

const ok = (lang: Lang, base: string, s?: Pick<Signup, 'access_token'>, emailed = true) =>
  NextResponse.json({ success: true, ready: classReady(lang), emailed, watchUrl: s ? `${base}${PATHS[lang].watch}?t=${s.access_token}` : null }, { status: 200 })

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers) ?? 'unknown'
  if (rateLimited(`class:${ip}`, 5, 60 * 60_000)) return NextResponse.json({ error: 'slow' }, { status: 429 })

  const raw = await req.json().catch(() => null) as Record<string, unknown> | null
  if (!raw || typeof raw !== 'object') return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  const lang: Lang = raw.lang === 'es' ? 'es' : 'en'
  const base = siteUrl(req.url)

  // Bots: honeypot filled or submitted too fast. Pretend success, save nothing.
  const filledAt = Number(raw.loadedAt)
  if (cut(raw.website, 200) || !Number.isFinite(filledAt) || Date.now() - filledAt < MIN_FILL_MS) {
    return NextResponse.json({ success: true, ready: classReady(lang), watchUrl: null })
  }

  const firstName = cut(raw.firstName, 60)
  const email = cut(raw.email, 254)?.toLowerCase() ?? null
  const fields: Record<string, string> = {}
  if (!firstName) fields.firstName = 'name'
  if (!email || !EMAIL_RE.test(email)) fields.email = 'email'
  let country = cut(raw.country, 2)?.toUpperCase() ?? null
  if (country && !/^[A-Z]{2}$/.test(country)) country = null
  const phoneRaw = cut(raw.phone, 40)
  const phone = phoneRaw ? normalizePhone(phoneRaw, country) : null
  if (phoneRaw && !phone) fields.phone = 'phone'
  if (Object.keys(fields).length) return NextResponse.json({ error: 'invalid', fields }, { status: 400 })

  const geo = req.headers.get('x-vercel-ip-country')?.toUpperCase() ?? null
  const now = new Date().toISOString()
  const smsConsent = !!phone && raw.smsConsent === true
  const tz = cut(raw.timezone, 64)
  const utm = (k: string) => cut(raw[k], 120)
  const referrer = cut(raw.referrer, 500)
  const landing = PATHS[lang].landing
  const pageUrl = `${base}${landing}`

  const row = {
    class_slug: CLASS_SLUG,
    first_name: firstName,
    email,
    language: lang,
    landing_path: landing,
    phone,
    sms_consent: smsConsent,
    sms_consent_text: smsConsent ? `${SMS_CONSENT[lang]} ${lang === 'es' ? 'Privacidad' : 'Privacy'}: ${base}${PATHS[lang].privacy}` : null,
    sms_consent_at: smsConsent ? now : null,
    email_consent_text: `${EMAIL_CONSENT[lang]} ${lang === 'es' ? 'Privacidad' : 'Privacy'}: ${base}${PATHS[lang].privacy}`,
    consent_at: now,
    consent_page_url: pageUrl,
    ip_hash: await ipHash(ip === 'unknown' ? null : ip),
    user_agent: cut(req.headers.get('user-agent'), 400),
    country: country ?? geo,
    country_source: country ? (geo && country === geo && raw.countryTouched !== true ? 'geo' : 'form') : geo ? 'geo' : null,
    timezone: tz && isZone(tz) ? tz : null,
    source: pickSource(cut(raw.s, 20), utm('utm_source'), utm('utm_medium'), referrer),
    utm_source: utm('utm_source'), utm_medium: utm('utm_medium'), utm_campaign: utm('utm_campaign'),
    utm_content: utm('utm_content'), utm_term: utm('utm_term'),
    referrer,
  }

  try {
    // Same person again: no new row. Refresh consent, resend the link at most once per 10 minutes.
    const found = await rest<Signup[]>(`class_signups?class_slug=eq.${CLASS_SLUG}&email=eq.${encodeURIComponent(email!)}&select=*&limit=1`)
    if (tablesMissing(found)) return NextResponse.json({ error: 'not_open' }, { status: 503 })
    if (!found.ok) throw new Error(`lookup ${found.status}`)
    const existing = found.data?.[0]

    if (existing) {
      // Only refresh consent and resend the link. We don't change the name, phone or SMS
      // choice here, and we don't hand back the personal link: anyone could type this email.
      const patch: Record<string, unknown> = { consent_at: now, email_consent_text: row.email_consent_text, consent_page_url: pageUrl }
      if (existing.unsubscribed_at) { patch.unsubscribed_at = null; patch.unsubscribed_via = null }
      if (row.timezone && !existing.timezone) patch.timezone = row.timezone
      const up = await rest<Signup[]>(`class_signups?id=eq.${existing.id}`, { method: 'PATCH', prefer: 'return=representation', body: patch })
      if (!up.ok || !up.data?.[0]) throw new Error(`update ${up.status}`)
      const s = up.data[0]
      const recent = await rest<{ created_at: string }[]>(`class_emails?signup_id=eq.${s.id}&kind=eq.confirm&status=eq.sent&order=created_at.desc&limit=1&select=created_at`)
      const last = recent.ok && recent.data?.[0] ? Date.parse(recent.data[0].created_at) : 0
      if (Date.now() - last > RESEND_LINK_MS) await sendWelcomeSeries(s, base)
      return ok(s.language, base)
    }

    // Cross-server limit on the hashed IP (the in-memory limiter is per instance).
    if (row.ip_hash) {
      const since = new Date(Date.now() - 60 * 60_000).toISOString()
      const cnt = await rest<{ id: string }[]>(`class_signups?ip_hash=eq.${row.ip_hash}&created_at=gte.${encodeURIComponent(since)}&select=id&limit=6`)
      if (cnt.ok && (cnt.data?.length ?? 0) >= 5) return NextResponse.json({ error: 'slow' }, { status: 429 })
    }

    const ins = await rest<Signup[]>('class_signups', { method: 'POST', prefer: 'return=representation', body: row })
    if (tablesMissing(ins)) return NextResponse.json({ error: 'not_open' }, { status: 503 })
    if (!ins.ok || !ins.data?.[0]) {
      if (ins.error?.code === '23505') { // raced with a duplicate submit: treat as success
        return NextResponse.json({ success: true, ready: classReady(lang), watchUrl: null })
      }
      throw new Error(`insert ${ins.status} ${ins.error?.code ?? ''}`)
    }
    const s = ins.data[0]
    const sent = await sendWelcomeSeries(s, base)
    return ok(lang, base, s, sent.status === 'sent')
  } catch (e) {
    if (e instanceof EsignConfigError) return NextResponse.json({ error: 'not_open' }, { status: 503 })
    console.error('[class-signup] failed:', (e as Error)?.message)
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }
}
