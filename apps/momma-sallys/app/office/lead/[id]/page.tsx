import Link from 'next/link'
import { notFound } from 'next/navigation'
import { funnel, type Lead, type LeadEmail, type LeadEvent } from '@/lib/funnel/db'
import { requireOwner } from '@/lib/funnel/owner'
import { fmtDate, fmtDateTime } from '@/lib/funnel/time'
import { BUDGET_LABEL, EMAIL_LABEL, STAGE_LABEL } from '@/lib/funnel/labels'
import { EVENT_TYPES, SOURCE_LABEL } from '@/config/funnel'
import { depositPaid, markReplied, saveQuote, setStage } from '../../actions'

export const dynamic = 'force-dynamic'

const QMSG: Record<string, string> = { saved: 'Quote saved.', sent: 'Quote emailed.', skipped: 'Quote saved, but the email was not sent (see the email log below).', failed: 'Quote saved, but the email failed. Try again.' }

export default async function LeadPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ q?: string; e?: string }> }) {
  await requireOwner()
  const { id } = await params
  const { q, e } = await searchParams
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound()
  const got = await funnel<{ lead: Lead; events: LeadEvent[]; emails: LeadEmail[] } | null>('get', { id })
  if (!got) notFound()
  const { lead: l, events, emails } = got
  const stopped = l.unsubscribed_at ? 'unsubscribed' : l.replied_at ? 'replied' : l.stage === 'booked' ? 'booked' : l.stage === 'lost' ? 'lost' : null
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <Link href="/office" className="of-muted">← Pipeline</Link>
      <div>
        <h1 style={{ fontSize: 'clamp(28px, 6vw, 42px)', margin: '0 0 6px' }}>{l.full_name} {l.is_test && <span className="of-tag" style={{ background: '#5a4300', verticalAlign: 'middle' }}>test</span>}</h1>
        <div style={{ fontSize: 17 }}><b>{STAGE_LABEL[l.stage]}</b> · {fmtDate(l.event_date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} · {l.headcount ?? '?'} guests · {EVENT_TYPES.find((t) => t.id === l.event_type)?.en}</div>
      </div>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <div className="of-card" style={{ display: 'grid', gap: 8 }}>
          <b>Contact</b>
          {l.email && <a href={`mailto:${l.email}`}>✉️ {l.email}</a>}
          {l.phone && <a href={`tel:${l.phone}`}>📞 {l.phone}</a>}
          {l.phone && <a href={`sms:${l.phone}`}>💬 Text from your phone</a>}
          <span className="of-muted">Budget: {l.budget ? BUDGET_LABEL[l.budget] : 'not given'} · From: {SOURCE_LABEL[l.source] ?? l.source} · {l.lang === 'es' ? 'Spanish' : 'English'}</span>
          <span className="of-muted">Came in {fmtDateTime(l.created_at)}</span>
          {l.notes && <p style={{ margin: '6px 0 0', whiteSpace: 'pre-wrap' }}>{l.notes}</p>}
          <span className="of-muted">Follow-up emails: {l.email_consent ? `yes — opted in ${fmtDateTime(l.consent_at)}` : 'no (confirmation and quote only)'}</span>
        </div>

        <div className="of-card" style={{ display: 'grid', gap: 10 }}>
          <b>Move it along</b>
          <form action={markReplied}><input type="hidden" name="id" value={l.id} />
            <button className="of-btn" type="submit" disabled={!!l.replied_at}>{l.replied_at ? `Replied ${fmtDateTime(l.replied_at)}` : 'They replied / I talked to them'}</button>
          </form>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(['inquiry', 'proposal_sent', 'tasting', 'booked'] as const).map((s) => (
              <form key={s} action={setStage}><input type="hidden" name="id" value={l.id} /><input type="hidden" name="stage" value={s} />
                <button className={`of-btn ${s === 'booked' ? 'of-btn-red' : ''}`} type="submit" disabled={l.stage === s}>{STAGE_LABEL[s]}</button>
              </form>
            ))}
          </div>
          <form action={setStage} style={{ display: 'flex', gap: 8 }}><input type="hidden" name="id" value={l.id} /><input type="hidden" name="stage" value="lost" />
            <input className="of-in" name="lost_reason" placeholder="Lost reason (optional)" defaultValue={l.lost_reason ?? ''} />
            <button className="of-btn" type="submit">Lost</button>
          </form>
          <span className="of-muted">{stopped ? `Follow-ups stopped (${stopped}).` : 'Follow-ups stop on their own when they reply, book, are lost, or unsubscribe.'}</span>
        </div>

        <div className="of-card" style={{ display: 'grid', gap: 10 }}>
          <b>Quote &amp; deposit</b>
          <form action={saveQuote} style={{ display: 'grid', gap: 8 }}>
            <input type="hidden" name="id" value={l.id} />
            <label className="of-muted">Quote total ($)<input className="of-in" name="amount" inputMode="decimal" defaultValue={l.quote_amount_cents != null ? (l.quote_amount_cents / 100).toFixed(2) : ''} /></label>
            <label className="of-muted">What&rsquo;s included<textarea className="of-in" name="note" rows={3} defaultValue={l.quote_note ?? ''} /></label>
            <label className="of-muted">Deposit link (optional — paste your Square payment link)<input className="of-in" name="deposit_url" type="url" placeholder="https://square.link/..." defaultValue={l.deposit_url ?? ''} /></label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="of-btn" type="submit" name="send" value="0">Save</button>
              <button className="of-btn of-btn-red" type="submit" name="send" value="1">Save &amp; email quote</button>
            </div>
          </form>
          {e === 'quote' && <span style={{ color: '#ff8a8a' }}>Check the amount and that the deposit link starts with https://</span>}
          {q && <span className="of-muted">{QMSG[q] ?? ''}</span>}
          <span className="of-muted">Quote sent: {fmtDateTime(l.quote_sent_at)} · Deposit: {l.deposit_paid_at ? `paid ${fmtDateTime(l.deposit_paid_at)}` : 'not marked paid'}</span>
          {!l.deposit_paid_at && l.deposit_url && (
            <form action={depositPaid}><input type="hidden" name="id" value={l.id} /><button className="of-btn" type="submit">Mark deposit paid</button></form>
          )}
        </div>
      </div>

      <div className="of-card">
        <b>Emails</b>
        <table className="of-table" style={{ marginTop: 8 }}>
          <tbody>
            {emails.map((m) => (
              <tr key={m.id}><td>{EMAIL_LABEL[m.kind] ?? m.kind}</td><td><span className="of-tag">{m.status}</span></td>
                <td className="of-muted">{m.scheduled_for ? `for ${fmtDateTime(m.scheduled_for)}` : fmtDateTime(m.created_at)}{m.error ? ` · ${m.error}` : ''}</td></tr>
            ))}
            {!emails.length && <tr><td className="of-muted">No emails yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="of-card">
        <b>History</b>
        <table className="of-table" style={{ marginTop: 8 }}>
          <tbody>
            {events.map((ev) => <tr key={ev.id}><td className="of-muted" style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(ev.created_at)}</td><td>{ev.body ?? ev.kind}</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  )
}
