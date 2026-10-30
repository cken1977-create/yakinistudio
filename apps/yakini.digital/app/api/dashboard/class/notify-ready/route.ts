import { NextRequest, NextResponse } from 'next/server'
import { rest } from '@/lib/esign/server'
import { adminSession, rateLimited, siteUrl, tooMany, unauthorized } from '@/lib/server/guard'
import { CLASS_SLUG, classReady, type Lang } from '@/lib/academy/config'
import { scheduleReminders, sendClassEmail, tablesMissing, type Signup } from '@/lib/academy/server'

// Admin-only. Once a class video is published (CLASS_VIDEO in lib/academy/config.ts), this emails
// "your class is ready" to everyone in that language who signed up before it was live, then schedules
// their two reminders. Up to 100 people per click; click again until it reports 0 left.
export async function POST(req: NextRequest) {
  const admin = await adminSession()
  if (!admin) return unauthorized()
  if (rateLimited(`class-ready:${admin.e}`, 30, 60 * 60_000)) return tooMany()
  const lang: Lang = req.nextUrl.searchParams.get('lang') === 'es' ? 'es' : 'en'
  if (!classReady(lang)) return NextResponse.json({ error: `The ${lang} class video is not published yet.` }, { status: 409 })

  const list = await rest<Signup[]>(`class_signups?class_slug=eq.${CLASS_SLUG}&language=eq.${lang}&unsubscribed_at=is.null&watched_at=is.null&select=*&order=created_at.asc&limit=1000`)
  if (tablesMissing(list)) return NextResponse.json({ error: 'Migration not applied.' }, { status: 503 })
  if (!list.ok) return NextResponse.json({ error: 'Could not load signups.' }, { status: 500 })
  const done = await rest<{ signup_id: string }[]>(`class_emails?kind=eq.ready&status=in.(sent,skipped)&select=signup_id&limit=50000`)
  const already = new Set((done.data ?? []).map((d) => d.signup_id))
  const confirmedAfter = await rest<{ signup_id: string }[]>(`class_emails?kind=eq.reminder_1&select=signup_id&limit=50000`)
  const hasReminders = new Set((confirmedAfter.data ?? []).map((d) => d.signup_id))
  const todo = (list.data ?? []).filter((s) => !already.has(s.id) && !hasReminders.has(s.id))
  const batch = todo.slice(0, 100)
  const base = siteUrl(req.url)
  let sent = 0, failed = 0
  for (const s of batch) {
    const r = await sendClassEmail(s, 'ready', base)
    if (r.status === 'sent') { sent++; await scheduleReminders(s, base) } else if (r.status === 'failed') failed++
    await new Promise((res) => setTimeout(res, 150)) // stay under the sending rate limit
  }
  console.info(`[class-ready] by ${admin.e} lang=${lang} sent=${sent} failed=${failed}`)
  return NextResponse.json({ sent, failed, remaining: todo.length - batch.length })
}
