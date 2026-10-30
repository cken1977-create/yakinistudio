// Monday weekly summary email to the owner. Called by the scheduled job (Authorization: Bearer CRON_SECRET).
import { NextRequest, NextResponse } from 'next/server'
import { weeklyNumbers, weeklyLines } from '@/lib/funnel/weekly'
import { buildWeekly } from '@/lib/funnel/emails'
import { sendRaw, siteBase } from '@/lib/funnel/mailer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 })
  // ?week=this sends the week so far (handy for a manual check); the Monday job uses last week.
  const w = await weeklyNumbers(req.nextUrl.searchParams.get('week') === 'this' ? 'this' : 'last')
  const m = buildWeekly({ rangeLabel: w.label, lines: weeklyLines(w), officeUrl: `${siteBase()}/office/weekly` })
  const res = await sendRaw('weekly', process.env.OWNER_EMAIL?.trim() || null, m)
  return NextResponse.json({ ok: res.status === 'sent', status: res.status, error: res.error ?? null, week: w.label })
}
