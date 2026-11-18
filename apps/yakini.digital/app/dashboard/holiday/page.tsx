import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { adminSession } from '@/lib/server/guard'
import { rest } from '@/lib/esign/server'
import { tablesMissing } from '@/lib/academy/server'
import { HOLIDAY_CAMPAIGN, HOLIDAY_DEADLINE_LABEL } from '@/lib/holiday'

// Admin-only list of Holiday Giveaway applications and nominations (yakini.digital/holiday).
export const metadata: Metadata = { title: 'Holiday Giveaway entries · Dashboard', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

type Entry = {
  id: string; created_at: string; type: 'apply' | 'nominate' | 'founder'; name: string; business_name: string | null; self_nominated: boolean
  email: string | null; phone: string | null; location: string; what_they_do: string; why_help: string
  nominator_name: string | null; nominator_email: string | null; nominator_phone: string | null
  utm_source: string | null; utm_campaign: string | null; status: string
}

const fmt = (s: string) => new Date(s).toLocaleString('en-US', { timeZone: 'America/Denver', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

async function load(type: string): Promise<{ rows: Entry[]; missing: boolean; error: string | null }> {
  const filter = type === 'apply' || type === 'nominate' || type === 'founder' ? `&type=eq.${type}` : ''
  try {
    const r = await rest<Entry[]>(`holiday_giveaway_submissions?campaign=eq.${HOLIDAY_CAMPAIGN}${filter}&order=created_at.desc&limit=1000`)
    if (tablesMissing(r)) return { rows: [], missing: true, error: null }
    if (!r.ok) return { rows: [], missing: false, error: `status ${r.status}` }
    return { rows: r.data ?? [], missing: false, error: null }
  } catch (e) {
    return { rows: [], missing: false, error: e instanceof Error ? e.message : 'unknown error' }
  }
}

export default async function HolidayDashboard({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!(await adminSession())) redirect('/dashboard/login')
  const sp = await searchParams
  const type = typeof sp.type === 'string' ? sp.type : ''
  const { rows, missing, error } = await load(type)
  const apply = rows.filter((r) => r.type === 'apply').length
  const nominate = rows.filter((r) => r.type === 'nominate').length
  const founders = rows.filter((r) => r.type === 'founder').length

  return (
    <div className="yd">
      <style>{CSS}</style>
      <header className="yd-top">
        <div>
          <div className="yd-eyebrow">Yakini Dashboard</div>
          <h1>Holiday Giveaway · 5 businesses + 1 future founder</h1>
          <p className="yd-muted">Entries close {HOLIDAY_DEADLINE_LABEL}. Times are Mountain Time. Each entry is also emailed to clarence@yakini.digital.</p>
        </div>
        <nav className="yd-nav">
          <a href="/dashboard/contracts">Contracts</a>
          <a href="/dashboard/class">Class</a>
          <a href="/holiday" target="_blank" rel="noopener">/holiday ↗</a>
          <form action="/api/auth/signout?to=dashboard" method="post"><button type="submit" className="yd-link">Sign out</button></form>
        </nav>
      </header>

      {missing && <p className="yd-warn">The giveaway table isn&apos;t in the database yet (migration <code>20261117000100_holiday_giveaway.sql</code> not applied). Entries still arrive by email to clarence@yakini.digital until it is.</p>}
      {error && <p className="yd-warn">Couldn&apos;t load entries: {error}</p>}

      <section className="yd-cards">
        {[['Total', rows.length], ['Business applications', apply], ['Business nominations', nominate], ['Future founders', founders]].map(([l, v]) => (
          <div key={String(l)} className="yd-card"><div className="yd-card-l">{l}</div><div className="yd-card-v">{v}</div></div>
        ))}
      </section>

      <nav className="yd-nav" style={{ marginBottom: 16 }}>
        <a href="/dashboard/holiday" aria-current={!type ? 'page' : undefined}>All</a>
        <a href="/dashboard/holiday?type=apply" aria-current={type === 'apply' ? 'page' : undefined}>Applications</a>
        <a href="/dashboard/holiday?type=nominate" aria-current={type === 'nominate' ? 'page' : undefined}>Nominations</a>
        <a href="/dashboard/holiday?type=founder" aria-current={type === 'founder' ? 'page' : undefined}>Future founders</a>
      </nav>

      {rows.length === 0 && !missing && !error && <p className="yd-muted">No entries yet.</p>}
      <div className="yd-list">
        {rows.map((r) => (
          <article key={r.id} className="yd-panel">
            <div className="yd-row-top">
              <span className={`yd-tag ${r.type}`}>{r.type === 'apply' ? 'Application' : r.type === 'nominate' ? 'Nomination' : r.self_nominated ? 'Future founder · self' : 'Future founder'}</span>
              <strong>{r.type === 'founder' ? `${r.name}${r.business_name ? ` · ${r.business_name}` : ''}` : r.business_name}</strong>
              <span className="yd-muted">{r.location} · {fmt(r.created_at)}{r.utm_source ? ` · ${r.utm_source}${r.utm_campaign ? ` / ${r.utm_campaign}` : ''}` : ''}</span>
            </div>
            <p><b>{r.type === 'apply' ? 'Contact' : r.type === 'founder' ? 'Founder' : 'Nominee'}:</b> {r.name}{r.email ? <> · <a href={`mailto:${r.email}`}>{r.email}</a></> : null}{r.phone ? <> · <a href={`tel:${r.phone}`}>{r.phone}</a></> : null}</p>
            {r.nominator_name && (
              <p><b>Nominated by:</b> {r.nominator_name}{r.nominator_email ? <> · <a href={`mailto:${r.nominator_email}`}>{r.nominator_email}</a></> : null}{r.nominator_phone ? ` · ${r.nominator_phone}` : ''}</p>
            )}
            <p><b>{r.type === 'founder' ? 'Business idea' : 'What they do'}:</b> {r.what_they_do}</p>
            <p className="yd-why"><b>Why they need help:</b> {r.why_help}</p>
          </article>
        ))}
      </div>
    </div>
  )
}

const CSS = `
  .yd { min-height:100vh; background:#0A0A0A; color:#F8F5EF; font-family:system-ui,-apple-system,sans-serif; padding:28px clamp(16px,3vw,40px) 60px; }
  .yd * { box-sizing:border-box; }
  .yd a { color:inherit; }
  .yd-top { display:flex; flex-wrap:wrap; gap:16px; justify-content:space-between; align-items:flex-end; margin-bottom:20px; }
  .yd-eyebrow { color:#C8A84B; font-size:10px; letter-spacing:4px; text-transform:uppercase; margin-bottom:8px; }
  .yd h1 { font-size:26px; font-weight:600; margin:0 0 6px; }
  .yd-nav { display:flex; gap:16px; align-items:center; font-size:14px; flex-wrap:wrap; }
  .yd-nav a[aria-current] { color:#C8A84B; }
  .yd-nav form { margin:0; }
  .yd-link { background:none; border:0; color:#aaa; font:inherit; cursor:pointer; padding:0; text-decoration:underline; }
  .yd-warn { border:1px solid rgba(200,168,75,0.4); background:rgba(200,168,75,0.08); padding:12px 14px; font-size:14px; margin:0 0 18px; }
  .yd-cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; margin-bottom:16px; }
  .yd-card, .yd-panel { background:#111; border:1px solid #222; padding:16px; }
  .yd-card-l { font-size:12px; color:#888; text-transform:uppercase; letter-spacing:1px; }
  .yd-card-v { font-size:26px; color:#C8A84B; margin-top:6px; }
  .yd-muted { color:#888; font-size:14px; margin:0; }
  .yd-list { display:grid; gap:12px; }
  .yd-panel p { margin:8px 0 0; font-size:14px; line-height:1.5; }
  .yd-why { white-space:pre-wrap; }
  .yd-row-top { display:flex; flex-wrap:wrap; gap:8px 12px; align-items:baseline; }
  .yd-tag { font-size:11px; text-transform:uppercase; letter-spacing:1px; padding:2px 8px; border:1px solid #444; }
  .yd-tag.apply { color:#C8A84B; border-color:#C8A84B; }
  .yd-tag.nominate { color:#8FD3FF; border-color:#8FD3FF; }
  .yd-tag.founder { color:#C6F432; border-color:#C6F432; }
`
