import Link from 'next/link'
import { requireMember } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { flags } from '@/lib/flags'

type MenuRow = { item_name: string; variation_name: string | null; category_name: string | null }

export default async function Home() {
  const me = await requireMember()
  if (me.role === 'owner') {
    return (
      <>
        <h1>Welcome back{me.display_name ? `, ${me.display_name}` : ''}</h1>
        <div className="card">
          <ul>
            {flags.squareSync() ? <li><Link href="/sales">Daily sales</Link> from Square</li> : <li className="muted">Square sales: turned off</li>}
            {flags.receipts() ? <li><Link href="/receipts">Receipts</Link> and the <Link href="/price-book">price book</Link></li> : <li className="muted">Receipts: turned off</li>}
            <li><Link href="/team">Team</Link>: who can sign in</li>
          </ul>
        </div>
      </>
    )
  }
  // Crew view: names only. ms_crew_menu() has no price or money columns.
  const supabase = await createClient()
  const { data } = await supabase.rpc('ms_crew_menu')
  const menu = (data ?? []) as MenuRow[]
  return (
    <>
      <h1>Hi{me.display_name ? `, ${me.display_name}` : ''}</h1>
      <h2>Menu</h2>
      {menu.length === 0 ? <p className="muted">The menu will show here once it&apos;s synced from Square.</p> : (
        <table>
          <thead><tr><th>Category</th><th>Item</th><th>Option</th></tr></thead>
          <tbody>{menu.map((m, i) => <tr key={i}><td>{m.category_name ?? ''}</td><td>{m.item_name}</td><td>{m.variation_name ?? ''}</td></tr>)}</tbody>
        </table>
      )}
    </>
  )
}
