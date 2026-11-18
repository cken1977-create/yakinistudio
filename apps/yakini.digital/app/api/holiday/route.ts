import { NextRequest, NextResponse } from 'next/server'
import { clientIp, rest } from '@/lib/esign/server'
import { tablesMissing } from '@/lib/academy/server'
import { esc, rateLimited, sendEmail, sha256Hex, tooMany } from '@/lib/server/guard'
import {
  HOLIDAY_CAMPAIGN, HOLIDAY_NOTIFY_TO, HOLIDAY_PATH, LIMITS, holidayClosed, validateHoliday,
  type HolidayInput, type HolidayType,
} from '@/lib/holiday'

// ═════════════════════════════════════════════════════════════════════════
// HOLIDAY GIVEAWAY API (/api/holiday)
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
      else u.searchParams.set('error', error === 'closed' ? 'closed' : status === 400 ? 'missing' : 'failed')
      if (type) u.searchParams.set('form', type)
      u.hash = 'forms'
      return NextResponse.redirect(u, 303)
    }
    return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error, fields }, { status })
  }

  if (!raw) return reply(false, null, 400, 'Bad request')
  const type: HolidayType | null = raw.type === 'apply' || raw.type === 'nominate' ? raw.type : null
  if (!type) return reply(false, null, 400, 'Bad request')

  // Honeypot: real people never see or fill this field. Pretend it worked, save nothing.
  if (str(raw.website) || str(raw.company_url)) return reply(true, type, 200)

  if (holidayClosed()) return reply(false, type, 410, 'closed')
  if (rateLimited(`holiday:${clientIp(req.headers) ?? 'unknown'}`, 6, 60 * 60_000)) {
    return isForm ? reply(false, type, 429, 'Too many requests') : tooMany()
  }

  const input = { type } as HolidayInput
  for (const k of TEXT_FIELDS) input[k] = str(raw[k], LIMITS[k] + 1)
  if (type === 'apply') { input.nominator_name = ''; input.nominator_email = ''; input.nominator_phone = '' }
  const problems = validateHoliday(input)
  if (Object.keys(problems).length) return reply(false, type, 400, 'Please check the highlighted fields.', problems as Record<string, string>)

  const ip = clientIp(req.headers)
  const row = {
    campaign: HOLIDAY_CAMPAIGN,
    type,
    name: input.name,
    business_name: input.business_name,
    email: input.email ? input.email.toLowerCase() : null,
    phone: input.phone || null,
    location: input.location,
    what_they_do: input.what_they_do,
    why_help: input.why_help,
    nominator_name: type === 'nominate' ? input.nominator_name : null,
    nominator_email: type === 'nominate' ? input.nominator_email.toLowerCase() : null,
    nominator_phone: type === 'nominate' ? input.nominator_phone || null : null,
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

type Row = Record<string, string | null>

function subjectFor(r: Row) {
  return r.type === 'nominate'
    ? `Holiday Giveaway nomination: ${r.business_name} (from ${r.nominator_name})`
    : `Holiday Giveaway application: ${r.business_name}`
}

function emailHtml(r: Row, saved: boolean, note: string) {
  const line = (k: string, v: string | null) =>
    v ? `<tr><td style="padding:6px 12px 6px 0;color:#667;vertical-align:top;white-space:nowrap">${k}</td><td style="padding:6px 0;color:#111">${esc(v).replace(/\n/g, '<br>')}</td></tr>` : ''
  const nom = r.type === 'nominate'
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px">
  <h2 style="margin:0 0 4px">${nom ? 'New nomination' : 'New application'} · Holiday Giveaway</h2>
  <p style="margin:0 0 16px;color:#667">From yakini.digital/holiday. ${saved ? 'Saved to the dashboard.' : `<b style="color:#b42318">Not saved to the database: ${esc(note)}.</b> This email is the only copy.`}</p>
  <table style="border-collapse:collapse;font-size:14px">
    ${line(nom ? 'Nominee' : 'Name', r.name)}
    ${line('Business / org', r.business_name)}
    ${line('Email', r.email)}
    ${line('Phone', r.phone)}
    ${line('Location', r.location)}
    ${line('What they do', r.what_they_do)}
    ${line('Why they need help', r.why_help)}
    ${nom ? line('Nominated by', r.nominator_name) + line('Nominator email', r.nominator_email) + line('Nominator phone', r.nominator_phone) : ''}
    ${line('Ad source', [r.utm_source, r.utm_medium, r.utm_campaign, r.utm_content].filter(Boolean).join(' / ') || null)}
  </table>
  <p style="margin-top:20px;font-size:13px"><a href="https://yakini.digital/dashboard/holiday">See every entry on the dashboard</a></p>
</div>`
}
