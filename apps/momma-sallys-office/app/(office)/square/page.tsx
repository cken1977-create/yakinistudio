import { notFound } from 'next/navigation'
import { requireOwner } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { flags } from '@/lib/flags'
import { squareConfigured } from '@/lib/square/config'
import { formatWhen } from '@/lib/dates'

const MESSAGES: Record<string, string> = {
  connected: 'Square is connected. The first sync is running; refresh in a minute.',
  synced: 'Sync finished.',
  disconnected: 'Square is disconnected. Your synced history is kept.',
  'error=state': 'That sign-in didn’t match. Please try connecting again.',
  'error=declined': 'Square access wasn’t granted.',
  'error=exchange': 'Square didn’t accept the connection. Try again.',
  'error=config': 'Square isn’t set up on this server yet.',
  'error=sync': 'The sync hit an error; see the latest run below.',
  'error=nocode': 'Square didn’t send a code back. Try again.',
}

export default async function SquarePage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  if (!flags.squareSync()) notFound()
  await requireOwner()
  const sp = await searchParams
  const msgKey = sp.error ? `error=${sp.error}` : Object.keys(sp).find((k) => MESSAGES[k])
  const supabase = await createClient()
  const [{ data: conn }, { data: runs }, { data: locations }] = await Promise.all([
    supabase.from('ms_square_connection').select('*').maybeSingle(),
    supabase.from('ms_sync_runs').select('id,kind,trigger,started_at,finished_at,status,counts,error').order('started_at', { ascending: false }).limit(10),
    supabase.from('ms_square_locations').select('id,name,status'),
  ])
  const connected = conn?.status === 'connected'
  return (
    <>
      <h1>Square</h1>
      <p className="sample">This build talks to Square&apos;s <strong>sandbox</strong> (test data) only. It can read sales, payments, menu, customers and team; it can&apos;t change anything in Square.</p>
      {msgKey && MESSAGES[msgKey] && <p className="card">{MESSAGES[msgKey]}</p>}
      <div className="card">
        <p>Status: <strong className={connected ? 'ok' : 'flag'}>{conn?.status ?? 'disconnected'}</strong>
          {conn?.business_name ? ` · ${conn.business_name}` : ''}</p>
        <p className="muted">Last sync: {formatWhen(conn?.last_sync_at)} · Access renews automatically (next by {formatWhen(conn?.access_expires_at)})</p>
        {conn?.last_error && <p className="flag">Last problem: {conn.last_error}</p>}
        <div className="row">
          {!connected && (squareConfigured() ? <a className="btn" href="/api/square/connect">Connect Square (sandbox)</a> : <span className="muted">Square isn&apos;t set up on this server yet.</span>)}
          {connected && (
            <>
              <form action="/api/square/sync" method="post"><button type="submit">Sync now</button></form>
              <form action="/api/square/sync" method="post"><input type="hidden" name="kind" value="full" /><button className="secondary" type="submit">Full re-sync</button></form>
              <form action="/api/square/disconnect" method="post"><button className="secondary" type="submit">Disconnect</button></form>
            </>
          )}
        </div>
      </div>
      <h2>Locations</h2>
      <ul>{(locations ?? []).map((l) => <li key={l.id}>{l.name ?? l.id} <span className="muted">{l.status}</span></li>)}</ul>
      <h2>Recent syncs</h2>
      <table>
        <thead><tr><th>Started</th><th>Kind</th><th>By</th><th>Result</th><th>Counts</th></tr></thead>
        <tbody>{(runs ?? []).map((r) => (
          <tr key={r.id}><td>{formatWhen(r.started_at)}</td><td>{r.kind}</td><td>{r.trigger}</td>
            <td className={r.status === 'ok' ? 'ok' : r.status === 'error' ? 'bad' : ''}>{r.status}{r.error ? `: ${r.error}` : ''}</td>
            <td className="muted">{Object.entries(r.counts ?? {}).map(([k, v]) => `${k} ${v}`).join(' · ')}</td></tr>
        ))}</tbody>
      </table>
    </>
  )
}
