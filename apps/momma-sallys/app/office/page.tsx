import Link from 'next/link'
import { funnel, funnelConfigured, type Lead } from '@/lib/funnel/db'
import { isOwner } from '@/lib/funnel/owner'
import { fmtDate, fmtDateTime } from '@/lib/funnel/time'
import { EVENT_TYPES, SOURCE_LABEL } from '@/config/funnel'
import { login } from './actions'
import { STAGE_LABEL } from '@/lib/funnel/labels'

export const dynamic = 'force-dynamic'

export default async function OfficeHome({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  if (!(await isOwner())) {
    const { e } = await searchParams
    return (
      <div style={{ maxWidth: 420 }}>
        <h1 style={{ fontSize: 40, margin: '0 0 10px' }}>Sign in</h1>
        <p className="of-muted" style={{ fontSize: 15, marginBottom: 20 }}>Enter the owner access code to see your catering leads.</p>
        <form action={login} style={{ display: 'grid', gap: 12 }}>
          <input className="of-in" name="code" type="password" autoComplete="current-password" required aria-label="Access code" placeholder="Access code" />
          <button className="of-btn of-btn-red" type="submit">Open the desk</button>
          {e && <p role="alert" style={{ color: '#ff8a8a', margin: 0 }}>That code didn&rsquo;t work.</p>}
        </form>
      </div>
    )
  }
  if (!funnelConfigured()) return <p>The catering database isn&rsquo;t connected yet.</p>
  const leads = await funnel<Lead[]>('list')
  const cols = ['inquiry', 'proposal_sent', 'tasting', 'booked', 'lost'] as const
  return (
    <>
      <h1 style={{ fontSize: 'clamp(30px, 6vw, 44px)', margin: '0 0 6px' }}>Catering pipeline</h1>
      <p className="of-muted" style={{ fontSize: 15, margin: '0 0 22px' }}>New quote requests from the website land in <b>Inquiry</b>. Open one to reply, quote, add a deposit link, or mark it booked.</p>
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
        {cols.map((c) => {
          const list = leads.filter((l) => l.stage === c)
          return (
            <div key={c} style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
              <div style={{ fontWeight: 800, fontSize: 15, display: 'flex', justifyContent: 'space-between' }}>
                <span>{STAGE_LABEL[c]}</span><span className="of-tag">{list.length}</span>
              </div>
              {list.map((l) => (
                <Link key={l.id} href={`/office/lead/${l.id}`} className="of-card" style={{ display: 'grid', gap: 4 }}>
                  <strong style={{ fontSize: 16 }}>{l.full_name}{l.is_test && <span className="of-tag" style={{ marginLeft: 6, background: '#5a4300' }}>test</span>}</strong>
                  <span>{fmtDate(l.event_date)} · {l.headcount ?? '?'} guests</span>
                  <span className="of-muted">{EVENT_TYPES.find((t) => t.id === l.event_type)?.en ?? l.event_type} · {SOURCE_LABEL[l.source] ?? l.source}</span>
                  <span className="of-muted">In {fmtDateTime(l.created_at)}{l.replied_at ? ' · replied' : ''}</span>
                </Link>
              ))}
              {!list.length && <div className="of-muted" style={{ padding: '6px 2px' }}>None</div>}
            </div>
          )
        })}
      </div>
    </>
  )
}
