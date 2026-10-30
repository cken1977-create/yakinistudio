import { requireOwner } from '@/lib/funnel/owner'
import { weeklyNumbers, money, srcList, replyTime, type Weekly } from '@/lib/funnel/weekly'

export const dynamic = 'force-dynamic'

const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : '—')

function rows(w: Weekly): [string, string, string?][] {
  return [
    ['Visits to the catering page', String(w.visits), srcList(w.visits_by_source)],
    ['Quote requests (leads)', String(w.leads), srcList(w.leads_by_source)],
    ['Visit → lead', pct(w.leads, w.visits)],
    ['Quotes sent', String(w.quoted)],
    ['Booked', String(w.booked), w.booked_cents ? `${money(w.booked_cents)} in quotes` : undefined],
    ['Lost', String(w.lost)],
    ['Still open in the pipeline', String(w.open_pipeline)],
    ['Typical time to first reply', replyTime(w.median_reply_minutes)],
  ]
}

export default async function WeeklyPage() {
  await requireOwner()
  const [thisW, lastW] = await Promise.all([weeklyNumbers('this'), weeklyNumbers('last')])
  return (
    <>
      <h1 style={{ fontSize: 'clamp(30px, 6vw, 44px)', margin: '0 0 6px' }}>Weekly results</h1>
      <p className="of-muted" style={{ fontSize: 15, margin: '0 0 20px' }}>Counted from the website&rsquo;s own records (Monday–Sunday, Central time). You also get last week&rsquo;s numbers by email every Monday morning.</p>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        {[['This week so far', thisW], ['Last week', lastW]].map(([title, w]) => (
          <div key={title as string} className="of-card">
            <b>{title as string}</b> <span className="of-muted">{(w as Weekly).label}</span>
            <table className="of-table" style={{ marginTop: 8 }}>
              <tbody>
                {rows(w as Weekly).map(([k, v, note]) => (
                  <tr key={k}><td>{k}{note && <div className="of-muted">{note}</div>}</td><td style={{ fontWeight: 800, fontSize: 20, textAlign: 'right' }}>{v}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </>
  )
}
