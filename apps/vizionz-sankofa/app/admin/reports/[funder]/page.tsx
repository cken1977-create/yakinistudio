// VIZIONZ SANKOFA · /admin/reports/[funder] — one funder report (printable)

import { notFound } from 'next/navigation'
import { requireOperatorOrEmployee, touchLastActive, getAccessRole } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { AdminCrumbs } from '@/components/admin/nav/AdminCrumbs'
import { MONO, Notice, PageIntro, Stat, StatStrip, isMissingTable, secondaryBtn } from '@/components/admin/ui'
import { funderByKey } from '@/lib/funder-reports/funders'
import { resolvePeriod, mountainDate } from '@/lib/funder-reports/period'
import { loadReportData, reportFrom } from '@/lib/funder-reports/load'
import { CountTable, DataTable, PRINT_CSS, PeriodPicker, REPORT_ACCENT, periodQuery, scopeNote } from '../parts'
import { PrintButton } from '../PrintButton'

export const dynamic = 'force-dynamic'

export default async function FunderReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ funder: string }>
  searchParams: Promise<{ period?: string; from?: string; to?: string }>
}) {
  const { funder: key } = await params
  const funder = funderByKey(key)
  if (!funder) notFound()
  const user = await requireOperatorOrEmployee()
  void touchLastActive(user.id)
  const role = getAccessRole(user)
  const canRoster = role === 'executive' || role === 'operator'
  const sp = await searchParams
  const today = mountainDate(new Date())
  const period = resolvePeriod(sp, today)

  const supabase = await createClient()
  const { data, error } = await loadReportData(supabase, funder, period)
  const missing = isMissingTable(error)
  const r = data ? reportFrom(data, funder, period) : null
  if (r) {
    // Aggregate view; logged without names or ids.
    await supabase.rpc('vs_log_event', {
      p_action: 'VIEW',
      p_table_name: 'funder_report',
      p_record_id: funder.key,
      p_details: { period_start: period.start, period_end: period.end, participants: r.participantsServed },
    })
  }
  const base = `/admin/reports/${funder.key}`
  const q = periodQuery(period)
  const showCounty = funder.byCounty || (r?.byCounty.length ?? 0) > 1

  return (
    <div>
      <style>{PRINT_CSS}</style>
      <div className="vs-no-print">
        <AdminCrumbs
          trail={[{ label: 'Funder Reports', href: `/admin/reports?${q}` }, { label: funder.short }]}
          fallbackHref="/admin/reports"
          fallbackLabel="Funder Reports"
          accent={REPORT_ACCENT}
        />
      </div>
      <PageIntro kicker={`Funder report · ${funder.short}`} title={funder.name} accent={REPORT_ACCENT}>
        {funder.note}
      </PageIntro>
      <div style={{ fontSize: '13px', fontFamily: MONO, marginBottom: '16px', color: 'rgba(10,10,10,0.7)' }} data-testid="report-scope">
        {period.label} · {scopeNote(role)} · prepared {today} (Mountain time)
      </div>

      {role === 'case_manager' && (
        <Notice tone="navy">
          <strong>Your caseload only.</strong> This report counts only the participants assigned to you.
        </Notice>
      )}
      {missing && (
        <Notice tone="amber">
          Funder reporting needs the database update <code>20261017000900_vs_funder_reporting.sql</code>. Ask Clarence to apply it.
        </Notice>
      )}
      {error && !missing && <Notice tone="red">Could not load report data: {error.message}</Notice>}

      <PeriodPicker basePath={base} period={period} />
      <div className="vs-no-print" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <PrintButton />
        {r && (
          <a href={`${base}/export?kind=summary&${q}`} style={secondaryBtn()} data-testid="report-csv">
            Download CSV (summary)
          </a>
        )}
        {r && canRoster && (
          <a href={`${base}/export?kind=roster&${q}`} style={secondaryBtn()} data-testid="report-roster">
            Participant list CSV (consented only)
          </a>
        )}
      </div>

      {r && (
        <>
          <StatStrip>
            <Stat label="Participants served" value={r.participantsServed} accent={REPORT_ACCENT} />
            <Stat label="New this period" value={r.newParticipants} />
            <Stat label="Services" value={r.services} />
            <Stat label="Units" value={r.units} />
          </StatStrip>

          {showCounty && (
            <DataTable
              title={funder.byCounty ? 'By service county (Housing NM provider counties)' : 'By service county'}
              head={['County', 'Participants', 'Services', 'Units']}
              rows={r.byCounty.map((c) => [c.label, c.participants, c.services, c.units])}
              testId="report-by-county"
            />
          )}
          {funder.scope === 'all' && (
            <DataTable
              title="By funder"
              head={['Funder', 'Participants', 'Services', 'Units']}
              rows={r.byFunder.map((f) => [f.label, f.participants, f.services, f.units])}
              testId="report-by-funder"
            />
          )}
          {r.medicaid && (
            <DataTable
              title="Medicaid fields"
              head={['', 'Count']}
              rows={[
                ['Participants with a Medicaid ID on file', r.medicaid.participantsWithId],
                ['Participants missing a Medicaid ID', r.medicaid.participantsMissingId],
                ['Services for participants missing a Medicaid ID', r.medicaid.servicesMissingId],
              ]}
              testId="report-medicaid"
            />
          )}
          <DataTable
            title="Services by type"
            head={['Service', 'Participants', 'Services', 'Units']}
            rows={r.byServiceType.map((t) => [`${t.name} (${t.unit})`, t.participants, t.services, t.units])}
            testId="report-by-type"
          />
          <CountTable title="Current stage (today)" rows={r.stages} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0 16px' }}>
            <CountTable title="Gender" rows={r.demographics.gender} />
            <CountTable title="Race / ethnicity" rows={r.demographics.raceEthnicity} />
            <CountTable title="Age (at period end)" rows={r.demographics.age} />
            <CountTable title="Primary language" rows={r.demographics.language} />
            <CountTable title="Veteran" rows={r.demographics.veteran} />
            <CountTable title="Disability" rows={r.demographics.disability} />
            <CountTable title="Household size" rows={r.demographics.household} />
          </div>
          <p style={{ fontSize: '12px', color: 'rgba(10,10,10,0.55)', lineHeight: 1.5 }}>
            Aggregate, de-identified counts. Race / ethnicity can list more than one per person. Age uses birth year only.
            {funder.scope === 'tagged' ? ` Counts only services tagged “${funder.short}” when they were logged.` : ''}
          </p>
        </>
      )}
    </div>
  )
}
