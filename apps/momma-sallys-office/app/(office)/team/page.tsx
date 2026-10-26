import { requireOwner } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { flags } from '@/lib/flags'
import { formatWhen } from '@/lib/dates'
import { addCrew, revokeMember } from './actions'

const ERR: Record<string, string> = {
  email: 'That email doesn’t look right.', owner: 'That person is already an owner.', save: 'Couldn’t save.', login: 'Saved, but the login couldn’t be created. Try again.', revoke: 'Couldn’t remove access.',
}

export default async function TeamPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireOwner()
  const sp = await searchParams
  const db = await createClient()
  const [{ data: members }, { data: sqTeam }] = await Promise.all([
    db.from('ms_members').select('id,email,display_name,role,activated_at,revoked_at').order('role').order('email'),
    flags.squareSync() ? db.from('ms_team_members').select('id,given_name,family_name,email,status').order('given_name') : Promise.resolve({ data: [] as { id: string; given_name: string | null; family_name: string | null; email: string | null; status: string | null }[] }),
  ])
  return (
    <>
      <h1>Team</h1>
      <p className="muted">Crew can sign in and see the menu. They can&apos;t see sales, costs, receipts, fees or anything with a dollar amount.</p>
      {sp.added && <p className="card ok">Added. They can sign in at this site with that email.</p>}
      {sp.error && ERR[sp.error] && <p className="card bad">{ERR[sp.error]}</p>}
      <form action={addCrew} className="card row">
        <input name="display_name" placeholder="Name" />
        <input name="email" type="email" placeholder="Email" required />
        <button type="submit">Add crew</button>
      </form>
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th /></tr></thead>
        <tbody>{(members ?? []).map((m) => (
          <tr key={m.id}>
            <td>{m.display_name ?? ''}</td><td>{m.email}</td><td>{m.role === 'owner' ? 'Owner' : 'Crew'}</td>
            <td className="muted">{m.revoked_at ? `Removed ${formatWhen(m.revoked_at)}` : m.activated_at ? 'Active' : 'Hasn’t signed in yet'}</td>
            <td>{m.role === 'crew' && !m.revoked_at && <form action={revokeMember.bind(null, m.id)}><button className="secondary" type="submit">Remove access</button></form>}</td>
          </tr>
        ))}</tbody>
      </table>
      {flags.squareSync() && (
        <>
          <h2>Team in Square</h2>
          <p className="muted">From Square, for reference. Pay rates are never copied here.</p>
          <ul>{(sqTeam ?? []).map((t) => <li key={t.id}>{[t.given_name, t.family_name].filter(Boolean).join(' ')} <span className="muted">{t.email ?? ''} {t.status}</span></li>)}</ul>
        </>
      )}
    </>
  )
}
