import { NextRequest, NextResponse } from 'next/server'
import { adminSession, unauthorized } from '@/lib/server/guard'
import { loadSignups, readFilters, toCsv } from '@/lib/academy/admin'

// Admin-only CSV of class signups (same filters as /dashboard/class). Each export is logged.
export async function GET(req: NextRequest) {
  const admin = await adminSession()
  if (!admin) return unauthorized()
  const f = readFilters(Object.fromEntries(req.nextUrl.searchParams))
  const { rows, missing, error } = await loadSignups(f)
  if (missing) return NextResponse.json({ error: 'Class tables are not set up yet (migration not applied).' }, { status: 503 })
  if (error) return NextResponse.json({ error: 'Could not load signups.' }, { status: 500 })
  console.info(`[class-export] ${new Date().toISOString()} by ${admin.e} rows=${rows.length} filters=${JSON.stringify(f)}`)
  const name = `yakini-academy-signups-${new Date().toISOString().slice(0, 10)}.csv`
  return new NextResponse(toCsv(rows), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${name}"`, 'Cache-Control': 'no-store' },
  })
}
