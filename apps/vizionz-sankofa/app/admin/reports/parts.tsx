// Shared pieces for /admin/reports (server components).

import Link from 'next/link'
import { Card, MONO, SectionLabel, inputStyle, secondaryBtn } from '@/components/admin/ui'
import { PERIOD_PRESETS, type Period } from '@/lib/funder-reports/period'
import type { CountRow } from '@/lib/funder-reports/aggregate'
import type { VsAccessRole } from '@/lib/supabase/auth'

export const REPORT_ACCENT = '#0A2548'

export function periodQuery(p: Period): string {
  return p.preset === 'custom' ? `period=custom&from=${p.start}&to=${p.end}` : `period=${p.preset}`
}

export function scopeNote(role: VsAccessRole | null): string {
  if (role === 'case_manager') return 'Your caseload only'
  if (role === null) return 'No participant access'
  return 'All VS participants'
}

export function PeriodPicker({ basePath, period }: { basePath: string; period: Period }) {
  return (
    <div className="vs-no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '20px' }}>
      {PERIOD_PRESETS.filter((p) => p.key !== 'custom').map((p) => {
        const active = p.key === period.preset
        return (
          <Link
            key={p.key}
            href={`${basePath}?period=${p.key}`}
            aria-current={active ? 'page' : undefined}
            style={{
              fontSize: '13px',
              padding: '7px 12px',
              borderRadius: '999px',
              textDecoration: 'none',
              border: `1px solid ${active ? REPORT_ACCENT : 'rgba(10,10,10,0.15)'}`,
              background: active ? REPORT_ACCENT : '#FFFFFF',
              color: active ? '#FFFFFF' : '#0A0A0A',
              minHeight: '36px',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {p.label}
          </Link>
        )
      })}
      <form method="get" action={basePath} style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="hidden" name="period" value="custom" />
        <label style={{ fontSize: '12px', color: 'rgba(10,10,10,0.6)' }}>
          From{' '}
          <input type="date" name="from" defaultValue={period.start} style={{ ...inputStyle, width: 'auto', padding: '6px 8px' }} />
        </label>
        <label style={{ fontSize: '12px', color: 'rgba(10,10,10,0.6)' }}>
          To <input type="date" name="to" defaultValue={period.end} style={{ ...inputStyle, width: 'auto', padding: '6px 8px' }} />
        </label>
        <button type="submit" style={secondaryBtn()}>
          Apply
        </button>
      </form>
    </div>
  )
}

const th = { textAlign: 'left' as const, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(10,10,10,0.55)', fontFamily: MONO, padding: '6px 8px', borderBottom: '1px solid rgba(10,10,10,0.12)' }
const td = { fontSize: '14px', padding: '7px 8px', borderBottom: '1px solid rgba(10,10,10,0.06)' }
const tdNum = { ...td, textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' as const }

export function DataTable({ title, head, rows, testId }: { title: string; head: string[]; rows: (string | number)[][]; testId?: string }) {
  return (
    <Card style={{ marginBottom: '16px', breakInside: 'avoid' }}>
      <SectionLabel>{title}</SectionLabel>
      {rows.length === 0 ? (
        <p style={{ margin: 0, fontSize: '14px', color: 'rgba(10,10,10,0.55)' }}>Nothing in this period.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table data-testid={testId} style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {head.map((h, i) => (
                  <th key={h} style={i === 0 ? th : { ...th, textAlign: 'right' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {r.map((v, j) => (
                    <td key={j} style={j === 0 ? td : tdNum}>
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

export function CountTable({ title, rows }: { title: string; rows: CountRow[] }) {
  return <DataTable title={title} head={['', 'Participants']} rows={rows.map((r) => [r.label, r.count])} />
}

/** Print: only the report body (no header, nav, buttons or footer). */
export const PRINT_CSS = `
@media print {
  header, footer, nav, .vs-admin-section-nav, .vs-no-print { display: none !important; }
  main { padding: 0 !important; max-width: none !important; }
  body { background: #fff !important; }
  article { border-color: #999 !important; }
  .vs-print-only { display: block !important; }
}
.vs-print-only { display: none; }
`
