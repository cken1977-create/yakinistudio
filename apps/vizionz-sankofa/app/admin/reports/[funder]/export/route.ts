// VIZIONZ SANKOFA · CSV export for one funder report.
//   kind=summary  aggregate, de-identified (anyone who can view the report)
//   kind=roster   participant-level, ONLY participants with an active
//                 share_funder consent; executive / operator only
// Every export is written to the audit log (no names or ids in the entry).

import { NextResponse, type NextRequest } from 'next/server'
import { getAccessRole, getCurrentOperator } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { funderByKey, SERVICE_COUNTY_LABELS, isServiceCounty } from '@/lib/funder-reports/funders'
import { inPeriod, mountainDate, resolvePeriod } from '@/lib/funder-reports/period'
import { loadReportData, reportFrom, consentedRoster } from '@/lib/funder-reports/load'
import { summaryCsvRows, toCsv } from '@/lib/funder-reports/aggregate'
import { scopeNote } from '../../parts'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: Promise<{ funder: string }> }) {
  const { funder: key } = await params
  const funder = funderByKey(key)
  if (!funder) return new NextResponse('Unknown funder', { status: 404 })
  const user = await getCurrentOperator()
  if (!user) return new NextResponse('Sign in required', { status: 401 })
  const role = getAccessRole(user)
  const sp = request.nextUrl.searchParams
  const kind = sp.get('kind') === 'roster' ? 'roster' : 'summary'
  if (kind === 'roster' && role !== 'executive' && role !== 'operator')
    return new NextResponse('Only executives and operators can export the participant list', { status: 403 })

  const period = resolvePeriod({ period: sp.get('period'), from: sp.get('from'), to: sp.get('to') }, mountainDate(new Date()))
  const supabase = await createClient()
  const { data, error } = await loadReportData(supabase, funder, period)
  if (!data) return new NextResponse(`Could not build report: ${error?.message ?? 'unknown error'}`, { status: 500 })
  const report = reportFrom(data, funder, period)

  let rows: (string | number)[][]
  if (kind === 'summary') {
    rows = summaryCsvRows(report, scopeNote(role))
  } else {
    const roster = await consentedRoster(supabase, report, funder, period)
    if (roster.error) return new NextResponse(`Could not build list: ${roster.error.message}`, { status: 500 })
    rows = [['First name', 'Last name', 'Service county', 'Intake date', 'Services in period', 'Units in period', 'First service', 'Last service']]
    for (const p of roster.people.sort((a, b) => a.last_name.localeCompare(b.last_name))) {
      const mine = roster.services.filter((s) => s.participant_id === p.id && inPeriod(mountainDate(s.delivered_at), period))
      const dates = mine.map((s) => mountainDate(s.delivered_at)).sort()
      rows.push([
        p.first_name,
        p.last_name,
        SERVICE_COUNTY_LABELS[isServiceCounty(p.service_county) ? p.service_county : 'unspecified'],
        p.intake_date ?? '',
        mine.length,
        mine.reduce((n, s) => n + (Number(s.units) || 0), 0),
        dates[0] ?? '',
        dates[dates.length - 1] ?? '',
      ])
    }
  }

  const { error: logError } = await supabase.rpc('vs_log_event', {
    p_action: 'EXPORT',
    p_table_name: 'funder_report',
    p_record_id: funder.key,
    p_details: { kind, format: 'csv', rows: rows.length - 1, period_start: period.start, period_end: period.end },
  })
  // No audit entry, no export.
  if (logError) return new NextResponse('Export could not be logged, so it was not created', { status: 500 })

  const file = `vs-${funder.key}-${kind}-${period.start}-to-${period.end}.csv`
  return new NextResponse('\uFEFF' + toCsv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${file}"`,
      'Cache-Control': 'no-store',
    },
  })
}
