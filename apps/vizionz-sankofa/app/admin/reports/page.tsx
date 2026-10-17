// VIZIONZ SANKOFA · /admin/reports — Funder Reports
//
// Six funder reports built from the single participant entry (brief v3 +
// the Oct 17 Housing New Mexico update). Counts come from the participants
// and services Carly already logs; nothing is entered twice. Aggregate and
// de-identified. RLS scopes the rows: a case manager's reports cover their
// own caseload only.

import Link from 'next/link'
import { requireOperatorOrEmployee, touchLastActive, getAccessRole } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { AdminCrumbs } from '@/components/admin/nav/AdminCrumbs'
import { Card, MONO, Notice, PageIntro, Pill, SERIF, TONES, isMissingTable } from '@/components/admin/ui'
import { FUNDERS } from '@/lib/funder-reports/funders'
import { resolvePeriod, mountainDate } from '@/lib/funder-reports/period'
import { loadReportData, reportFrom } from '@/lib/funder-reports/load'
import { PeriodPicker, REPORT_ACCENT, periodQuery, scopeNote } from './parts'

export const dynamic = 'force-dynamic'

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ period?: string; from?: string; to?: string }> }) {
  const user = await requireOperatorOrEmployee()
  void touchLastActive(user.id)
  const role = getAccessRole(user)
  const sp = await searchParams
  const period = resolvePeriod(sp, mountainDate(new Date()))
  const supabase = await createClient()
  const { data, error } = await loadReportData(supabase, null, period)
  const missing = isMissingTable(error)

  return (
    <div>
      <AdminCrumbs trail={[{ label: 'Funder Reports' }]} fallbackHref="/admin" fallbackLabel="Operations" accent={REPORT_ACCENT} />
      <PageIntro kicker="Funder Reports" title="Funder Reports" accent={REPORT_ACCENT}>
        One entry, six funders. Each report counts the participants and services already logged in Vizionz Sankofa; tag a service
        with its funder (and service county) when you log it.
      </PageIntro>

      {role === 'case_manager' && (
        <Notice tone="navy">
          <strong>Your caseload only.</strong> These reports count only the participants assigned to you.
        </Notice>
      )}
      {missing && (
        <Notice tone="amber">
          Funder reporting needs the database update <code>20261017000900_vs_funder_reporting.sql</code>. Ask Clarence to apply
          it; until then reports can&apos;t be built.
        </Notice>
      )}
      {error && !missing && <Notice tone="red">Could not load report data: {error.message}</Notice>}

      <PeriodPicker basePath="/admin/reports" period={period} />
      <div style={{ fontSize: '13px', color: 'rgba(10,10,10,0.6)', marginBottom: '16px', fontFamily: MONO }}>
        {period.label} · {scopeNote(role)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
        {FUNDERS.map((f) => {
          const r = data ? reportFrom(data, f, period) : null
          return (
            <Link
              key={f.key}
              href={`/admin/reports/${f.key}?${periodQuery(period)}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
              data-testid={`funder-card-${f.key}`}
            >
              <Card style={{ height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'flex-start' }}>
                  <div style={{ fontFamily: SERIF, fontSize: '20px', lineHeight: 1.2 }}>{f.name}</div>
                  {f.scope === 'all' && <Pill {...TONES.navy}>Fiscal sponsor</Pill>}
                  {f.byCounty && <Pill {...TONES.green}>By county</Pill>}
                </div>
                <p style={{ fontSize: '13px', color: 'rgba(10,10,10,0.6)', lineHeight: 1.5, margin: '8px 0 14px' }}>{f.note}</p>
                <div style={{ display: 'flex', gap: '20px', fontFamily: MONO, fontSize: '13px' }}>
                  <span>
                    <strong style={{ fontSize: '20px' }}>{r ? r.participantsServed : '—'}</strong> served
                  </span>
                  <span>
                    <strong style={{ fontSize: '20px' }}>{r ? r.services : '—'}</strong> services
                  </span>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
