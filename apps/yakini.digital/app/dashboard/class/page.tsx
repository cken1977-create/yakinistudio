import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { adminSession } from '@/lib/server/guard'
import { loadEmailStats, loadSignups, readFilters, type AdminRow } from '@/lib/academy/admin'
import { CLASS_VIDEO, FOLLOWUPS_ENABLED, SOURCES } from '@/lib/academy/config'
import { ReadyButton } from './ReadyButton'

export const metadata: Metadata = { title: 'Yakini Academy signups · Dashboard', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

const DAY = 86_400_000
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—')
const fmt = (s: string | null) => (s ? new Date(s).toLocaleString('en-US', { timeZone: 'America/Denver', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—')

function countBy(rows: AdminRow[], key: (r: AdminRow) => string | null) {
  const m = new Map<string, number>()
  for (const r of rows) { const k = key(r) ?? '—'; m.set(k, (m.get(k) ?? 0) + 1) }
  return [...m.entries()].sort((a, b) => b[1] - a[1])
}

function summarize(rows: AdminRow[]) {
  const now = Date.now()
  const recent = (r: AdminRow, days: number) => now - Date.parse(r.created_at) < days * DAY
  return {
    total: rows.length,
    last7: rows.filter((r) => recent(r, 7)).length,
    last30: rows.filter((r) => recent(r, 30)).length,
    watched: rows.filter((r) => r.watched_at).length,
    unsub: rows.filter((r) => r.unsubscribed_at).length,
    sms: rows.filter((r) => r.sms_consent).length,
    byDay: countBy(rows.filter((r) => recent(r, 30)), (r) =>
      new Date(r.created_at).toLocaleDateString('en-CA', { timeZone: 'America/Denver' })).sort((a, b) => a[0].localeCompare(b[0])),
  }
}

export default async function ClassDashboard({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!(await adminSession())) redirect('/dashboard/login')
  const sp = await searchParams
  const f = readFilters(sp)
  const { rows, missing, error } = await loadSignups(f)
  const emails = missing || error ? {} : await loadEmailStats().catch(() => ({} as Record<string, number>))
  const { total, last7, last30, watched, unsub, sms, byDay } = summarize(rows)
  const maxDay = Math.max(1, ...byDay.map((d) => d[1]))
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]).toString()

  return (
    <div className="yd">
      <style>{CSS}</style>
      <header className="yd-top">
        <div>
          <div className="yd-eyebrow">Yakini Dashboard</div>
          <h1>Yakini Academy · free class signups</h1>
        </div>
        <nav className="yd-nav">
          <a href="/dashboard/contracts">Contracts</a>
          <a href="/class" target="_blank" rel="noopener">/class ↗</a>
          <a href="/clase" target="_blank" rel="noopener">/clase ↗</a>
          <form action="/api/auth/signout?to=dashboard" method="post"><button type="submit" className="yd-link">Sign out</button></form>
        </nav>
      </header>

      {missing && <p className="yd-warn">The class tables aren&apos;t in the database yet (migration <code>20261030000100_class_signups.sql</code> not applied). Signups on /class and /clase show &ldquo;signups open soon&rdquo; and nothing is saved until it is.</p>}
      {error && <p className="yd-warn">Couldn&apos;t load signups: {error}</p>}

      <form className="yd-filters" method="get">
        <label>From <input type="date" name="from" defaultValue={f.from} /></label>
        <label>To <input type="date" name="to" defaultValue={f.to} /></label>
        <label>Language <select name="lang" defaultValue={f.lang ?? ''}><option value="">All</option><option value="en">English</option><option value="es">Spanish</option></select></label>
        <label>Country <input name="country" maxLength={2} placeholder="US" defaultValue={f.country} style={{ width: 70 }} /></label>
        <label>Source <select name="source" defaultValue={f.source ?? ''}><option value="">All</option>{SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
        <button type="submit" className="yd-btn">Apply</button>
        <a href="/dashboard/class" className="yd-link">Clear</a>
        <a href={`/api/dashboard/class/export${qs ? `?${qs}` : ''}`} className="yd-btn yd-btn-gold">Export CSV</a>
      </form>

      <section className="yd-cards">
        {[['Total signups', total], ['Last 7 days', last7], ['Last 30 days', last30], ['Watched (80%+)', `${watched} · ${pct(watched, total)}`], ['Unsubscribed', unsub], ['SMS opt-in', sms]].map(([l, v]) => (
          <div key={String(l)} className="yd-card"><div className="yd-card-l">{l}</div><div className="yd-card-v">{v}</div></div>
        ))}
      </section>

      <section className="yd-grid">
        {[['By language', countBy(rows, (r) => (r.language === 'es' ? 'Spanish' : 'English'))], ['By country', countBy(rows, (r) => r.country)], ['By source', countBy(rows, (r) => r.source)], ['Emails', Object.entries(emails)]].map(([title, list]) => (
          <div key={title as string} className="yd-panel">
            <h2>{title as string}</h2>
            {(list as [string, number][]).length === 0 ? <p className="yd-muted">No data yet</p> : (
              <table><tbody>{(list as [string, number][]).slice(0, 12).map(([k, n]) => <tr key={k}><td>{k}</td><td className="yd-num">{n}</td></tr>)}</tbody></table>
            )}
          </div>
        ))}
      </section>

      <section className="yd-panel">
        <h2>Signups per day (last 30 days, Mountain Time)</h2>
        {byDay.length === 0 ? <p className="yd-muted">No signups yet</p> : (
          <div className="yd-bars">{byDay.map(([d, n]) => (
            <div key={d} className="yd-bar" title={`${d}: ${n}`}><span style={{ height: `${(n / maxDay) * 100}%` }} /><small>{d.slice(5)}</small></div>
          ))}</div>
        )}
      </section>

      <section className="yd-panel">
        <h2>Class video &amp; emails</h2>
        <p className="yd-muted">English class video: {CLASS_VIDEO.en ? 'published' : 'coming soon'} · Spanish class video: {CLASS_VIDEO.es ? 'published' : 'coming soon'} · Follow-up emails: {FOLLOWUPS_ENABLED ? 'on' : 'off (copy pending approval)'}</p>
        <p className="yd-muted" style={{ marginBottom: 12 }}>After a class video is published in <code>lib/academy/config.ts</code>, send &ldquo;your class is ready&rdquo; to people who signed up before it was live:</p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {CLASS_VIDEO.en && <ReadyButton lang="en" label="Notify English signups" />}
          {CLASS_VIDEO.es && <ReadyButton lang="es" label="Notify Spanish signups" />}
          {!CLASS_VIDEO.en && !CLASS_VIDEO.es && <span className="yd-muted">(Available once a class video is published.)</span>}
        </div>
      </section>

      <section className="yd-panel">
        <h2>Latest signups {total > 200 ? '(newest 200; export for all)' : ''}</h2>
        <div className="yd-table-wrap">
          <table className="yd-table">
            <thead><tr><th>Name</th><th>Email</th><th>Lang</th><th>Country</th><th>Source</th><th>Signed up (MT)</th><th>Watched</th><th>SMS</th><th>Status</th></tr></thead>
            <tbody>
              {rows.slice(0, 200).map((r) => (
                <tr key={r.id}>
                  <td>{r.first_name}</td><td>{r.email}</td><td>{r.language.toUpperCase()}</td><td>{r.country ?? '—'}</td>
                  <td>{r.source}{r.utm_campaign ? ` · ${r.utm_campaign}` : ''}</td><td>{fmt(r.created_at)}</td>
                  <td>{r.watched_at ? fmt(r.watched_at) : r.started_at ? 'started' : '—'}</td><td>{r.sms_consent ? 'yes' : 'no'}</td>
                  <td>{r.unsubscribed_at ? 'unsubscribed' : r.stage}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={9} className="yd-muted">No signups{Object.keys(f).length ? ' match these filters' : ' yet'}.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

const CSS = `
  .yd { min-height:100vh; background:#0A0A0A; color:#F8F5EF; font-family:system-ui,-apple-system,sans-serif; padding:28px clamp(16px,3vw,40px) 60px; }
  .yd * { box-sizing:border-box; }
  .yd a { color:inherit; }
  .yd-top { display:flex; flex-wrap:wrap; gap:16px; justify-content:space-between; align-items:flex-end; margin-bottom:20px; }
  .yd-eyebrow { color:#C8A84B; font-size:10px; letter-spacing:4px; text-transform:uppercase; margin-bottom:8px; }
  .yd h1 { font-size:26px; font-weight:600; margin:0; }
  .yd-nav { display:flex; gap:16px; align-items:center; font-size:14px; flex-wrap:wrap; }
  .yd-nav form { margin:0; }
  .yd-link { background:none; border:0; color:#aaa; font:inherit; cursor:pointer; padding:0; text-decoration:underline; }
  .yd-warn { border:1px solid rgba(200,168,75,0.4); background:rgba(200,168,75,0.08); padding:12px 14px; font-size:14px; margin:0 0 18px; }
  .yd-filters { display:flex; flex-wrap:wrap; gap:10px 16px; align-items:flex-end; margin-bottom:20px; font-size:13px; color:#aaa; }
  .yd-filters label { display:flex; flex-direction:column; gap:4px; }
  .yd-filters input, .yd-filters select { background:#151515; border:1px solid #333; color:#F8F5EF; padding:8px 10px; font:inherit; }
  .yd-btn { display:inline-flex; align-items:center; background:#1d1d1d; color:#F8F5EF; border:1px solid #444; padding:9px 14px; font:inherit; font-size:13px; cursor:pointer; text-decoration:none; }
  .yd-btn-gold { background:#C8A84B; color:#0A0A0A; border-color:#C8A84B; font-weight:600; }
  .yd-cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; margin-bottom:16px; }
  .yd-card, .yd-panel { background:#111; border:1px solid #222; padding:16px; }
  .yd-card-l { font-size:12px; color:#888; text-transform:uppercase; letter-spacing:1px; }
  .yd-card-v { font-size:26px; color:#C8A84B; margin-top:6px; }
  .yd-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:12px; margin-bottom:16px; }
  .yd-panel { margin-bottom:16px; }
  .yd-panel h2 { font-size:14px; font-weight:600; margin:0 0 10px; color:#ddd; }
  .yd-panel table { width:100%; border-collapse:collapse; font-size:14px; }
  .yd-panel td { padding:4px 0; border-bottom:1px solid #1d1d1d; }
  .yd-num { text-align:right; color:#C8A84B; }
  .yd-muted { color:#888; font-size:14px; margin:0; }
  .yd-bars { display:flex; align-items:flex-end; gap:4px; height:140px; overflow-x:auto; }
  .yd-bar { flex:1 0 22px; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; height:100%; }
  .yd-bar span { display:block; width:100%; background:#C8A84B; min-height:2px; }
  .yd-bar small { font-size:10px; color:#777; margin-top:4px; }
  .yd-table-wrap { overflow-x:auto; }
  .yd-table { min-width:900px; }
  .yd-table th { text-align:left; font-size:11px; color:#888; text-transform:uppercase; letter-spacing:1px; padding:6px 8px 6px 0; border-bottom:1px solid #333; }
  .yd-table td { padding:8px 8px 8px 0; font-size:13px; }
`
