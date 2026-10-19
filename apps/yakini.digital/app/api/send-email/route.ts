import { NextRequest, NextResponse } from 'next/server'
import { adminSession, rateLimited, sendEmail, tooMany, unauthorized } from '@/lib/server/guard'

// Admin-only. The sender is fixed (Yakini Contracts <admin@yakini.digital>); callers can't change it.
// The dashboard no longer uses this route; it stays for signed-in admin use only.
export async function POST(req: NextRequest) {
  const admin = await adminSession()
  if (!admin) return unauthorized()
  if (rateLimited(`send-email:${admin.e}`, 20, 60 * 60_000)) return tooMany()
  const body = await req.json().catch(() => null)
  const to = Array.isArray(body?.to) ? body.to : [body?.to]
  const subject = String(body?.subject ?? '').slice(0, 200)
  const html = String(body?.html ?? '')
  const list = to.map((t: unknown) => String(t ?? '').trim()).filter((t: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t))
  if (list.length === 0 || list.length > 5 || !subject || !html || html.length > 100_000) {
    return NextResponse.json({ error: 'Need 1–5 valid recipients, a subject and a body' }, { status: 400 })
  }
  const results = []
  for (const t of list) results.push(await sendEmail(t, subject, html))
  if (results.includes('failed')) return NextResponse.json({ error: 'Email failed', results }, { status: 502 })
  return NextResponse.json({ success: true, results })
}
