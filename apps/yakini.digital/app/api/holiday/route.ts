import { NextRequest, NextResponse } from 'next/server'
import { clientIp, rest } from '@/lib/esign/server'
import { tablesMissing } from '@/lib/academy/server'
import { esc, rateLimited, sendEmail, sha256Hex, tooMany } from '@/lib/server/guard'
import {
  HOLIDAY_CAMPAIGN, HOLIDAY_NOTIFY_TO, HOLIDAY_PATH, LIMITS, holidayClosed, isHolidayType, validateHoliday,
  type HolidayInput, type HolidayType,
} from '@/lib/holiday'

// ═════════════════════════════════════════════════════════════════════════
// HOLIDAY GIVEAWAY API (/api/holiday)
// Types: 'apply' (own business), 'nominate' (someone else's business), 'founder' (a future
// founder, nominated or self-nominated with "This is me").
// 1. Saves the application or nomination to public.holiday_giveaway_submissions
//    (server-only table, service-role key).
// 2. Emails a notification to clarence@yakini.digital through Resend.
// If the table isn't there yet (migration not applied), the email still goes out, so no
// entry is lost. Fails only when neither the save nor the email worked.
// Accepts JSON (the page's script) or a plain form post (JavaScript off: 303 back to the page).
// ═════════════════════════════════════════════════════════════════════════

const FROM = 'Yakini Holiday Giveaway <hello@yakini.digital>'
const TEXT_FIELDS = Object.keys(LIMITS) as (keyof typeof LIMITS)[]
const UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const

type Raw = Record<string, unknown>

async function readBody(req: NextRequest): Promise<{ raw: Raw | null; isForm: boolean }> {
  const ct = req.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    const j = await req.json().catch(() => null)
    return { raw: j && typeof j === 'object' ? (j as Raw) : null, isForm: false }
  }
  if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
    const f = await req.formData().catch(() => null)
    if (!f) return { raw: null, isForm: true }
    const o: Raw = {}
    f.forEach((v, k) => { if (typeof v === 'string') o[k] = v })
    return { raw: o, isForm: true }
  }
  return { raw: null, isForm: false }
}

const str = (v: unknown, max = 5000) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export async function POST(req: NextRequest) {
  const { raw, isForm } = await readBody(req)
  const reply = (ok: boolean, type: HolidayType | null, status: number, error?: string, fields?: Record<string, string>) => {
    if (isForm) {
      const u = new URL(HOLIDAY_PATH, req.url)
      if (ok && type) u.searchParams.set('sent', type)
      else u.searchParams.set('error', error === 'closed' ? 'closed' : error === 'founder_contact' ? 'founder_contact' : status === 400 ? 'missing' : 'failed')
      if (type) u.searchParams.set('form', type)
      u.hash = 'forms'
      return NextResponse.redirect(u, 303)
    }
    return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error, fields }, { status })
  }

  if (!raw) return reply(false, null, 400, 'Bad request')
  const type: HolidayType | null = isHolidayType(raw.type) ? raw.type : null
  if (!type) return reply(false, null, 400, 'Bad request')

  // Honeypot: real people never see or fill this field. Pretend it worked, save nothing.
  if (str(raw.website) || str(raw.company_url)) return reply(true, type, 200)

  if (holidayClosed()) return reply(false, type, 410, 'closed')
  if (rateLimited(`holiday:${clientIp(req.headers) ?? 'unknown'}`, 6, 60 * 60_000)) {
    return isForm ? reply(false, type, 429, 'Too many requests') : tooMany()
  }

  const input = { type, self_nominated: false } as HolidayInput
  for (const k of TEXT_FIELDS) input[k] = str(raw[k], LIMITS[k] + 1)
  if (type === 'founder') input.self_nominated = raw.self_nominated === true || raw.self_nominated === 'yes' || raw.self_nominated === 'true'
  const hasNominator = type === 'nominate' || (type === 'founder' && !input.self_nominated)
  if (!hasNominator) { input.nominator_name = ''; input.nominator_email = ''; input.nominator_phone = '' }
  const problems = validateHoliday(input)
  if (Object.keys(problems).length) {
    // Founder who checked "This is me" without both contact methods: say exactly that
    // (matters most without JavaScript, where the form can't explain it inline).
    const founderContact = type === 'founder' && input.self_nominated && (problems.email || problems.phone) && Object.keys(problems).every((k) => k === 'email' || k === 'phone')
    return reply(false, type, 400, founderContact ? 'founder_contact' : 'Please check the highlighted fields.', problems as Record<string, string>)
  }

  const ip = clientIp(req.headers)
  const row = {
    campaign: HOLIDAY_CAMPAIGN,
    type,
    name: input.name,
    business_name: input.business_name || null,
    email: input.email ? input.email.toLowerCase() : null,
    phone: input.phone || null,
    location: input.location,
    what_they_do: input.what_they_do,
    why_help: input.why_help,
    self_nominated: input.self_nominated,
    nominator_name: hasNominator ? input.nominator_name : null,
    nominator_email: hasNominator ? input.nominator_email.toLowerCase() : null,
    nominator_phone: hasNominator ? input.nominator_phone || null : null,
    ...Object.fromEntries(UTM.map((k) => [k, str(raw[k], 120) || null])),
    referrer: str(raw.referrer, 500) || null,
    ip_hash: ip ? await sha256Hex(`holiday:${ip}`) : null,
    user_agent: (req.headers.get('user-agent') || '').slice(0, 400) || null,
  }

  // 1. Save (server-only key).
  let saved = false
  let saveNote = ''
  try {
    const ins = await rest('holiday_giveaway_submissions', { method: 'POST', body: row, prefer: 'return=minimal' })
    saved = ins.ok
    if (!ins.ok) {
      saveNote = tablesMissing(ins) ? 'table not created yet (migration not applied)' : `save failed (${ins.status})`
      console.error('[holiday] save failed', ins.status, ins.error?.code)
    }
  } catch (e) {
    saveNote = 'save failed (server config)'
    console.error('[holiday] save error', e instanceof Error ? e.name : 'unknown')
  }

  // 2. Notify Clarence.
  const mail = await sendEmail(HOLIDAY_NOTIFY_TO, subjectFor(row), emailHtml(row, saved, saveNote), FROM)

  if (!saved && mail !== 'sent') return reply(false, type, 500, 'We couldn’t save that just now. Please try again in a minute.')
  return reply(true, type, 200)
}

type Row = Record<string, string | boolean | null>

function subjectFor(r: Row) {
  if (r.type === 'founder') {
    return r.self_nominated
      ? `Holiday Giveaway future founder (self): ${r.name}`
      : `Holiday Giveaway future founder: ${r.name} (from ${r.nominator_name})`
  }
  return r.type === 'nominate'
    ? `Holiday Giveaway nomination: ${r.business_name} (from ${r.nominator_name})`
    : `Holiday Giveaway application: ${r.business_name}`
}

function emailHtml(r: Row, saved: boolean, note: string) {
  const line = (k: string, v: string | boolean | null) =>
    typeof v === 'string' && v ? `<tr><td style="padding:6px 12px 6px 0;color:#667;vertical-align:top;white-space:nowrap">${k}</td><td style="padding:6px 0;color:#111">${esc(v).replace(/\n/g, '<br>')}</td></tr>` : ''
  const founder = r.type === 'founder'
  const hasNominator = r.type === 'nominate' || (founder && !r.self_nominated)
  const heading = founder ? `New future founder ${r.self_nominated ? '(self-nominated)' : 'nomination'}` : r.type === 'nominate' ? 'New nomination' : 'New application'
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px">
  <h2 style="margin:0 0 4px">${heading} · Holiday Giveaway</h2>
  <p style="margin:0 0 16px;color:#667">From yakini.digital/holiday. ${saved ? 'Saved to the dashboard.' : `<b style="color:#b42318">Not saved to the database: ${esc(note)}.</b> This email is the only copy.`}</p>
  <table style="border-collapse:collapse;font-size:14px">
    ${line(founder ? 'Future founder' : r.type === 'nominate' ? 'Nominee' : 'Name', r.name)}
    ${line(founder ? 'Business name (if any)' : 'Business / org', r.business_name)}
    ${line('Email', r.email)}
    ${line('Phone', r.phone)}
    ${line('Location', r.location)}
    ${line(founder ? 'Business idea' : 'What they do', r.what_they_do)}
    ${line('Why they need help', r.why_help)}
    ${hasNominator ? line('Nominated by', r.nominator_name) + line('Nominator email', r.nominator_email) + line('Nominator phone', r.nominator_phone) : ''}
    ${line('Ad source', [r.utm_source, r.utm_medium, r.utm_campaign, r.utm_content].filter(Boolean).join(' / ') || null)}
  </table>
  <p style="margin-top:20px;font-size:13px"><a href="https://yakini.digital/dashboard/holiday">See every entry on the dashboard</a></p>
</div>`
}
