import Link from 'next/link'
import { requireMember } from '@/lib/auth'
import { flags } from '@/lib/flags'

export const dynamic = 'force-dynamic'

export default async function OfficeLayout({ children }: { children: React.ReactNode }) {
  const me = await requireMember()
  const owner = me.role === 'owner'
  return (
    <>
      <header className="top">
        <strong>Momma Sally&apos;s Office</strong>
        <nav>
          <Link href="/">Home</Link>
          {owner && flags.squareSync() && <Link href="/sales">Sales</Link>}
          {owner && flags.receipts() && <Link href="/receipts">Receipts</Link>}
          {owner && flags.receipts() && <Link href="/price-book">Price book</Link>}
          {owner && flags.squareSync() && <Link href="/square">Square</Link>}
          {owner && <Link href="/team">Team</Link>}
        </nav>
        <span className="muted">{me.display_name ?? me.email} · {owner ? 'Owner' : 'Crew'}</span>
        <form action="/auth/signout" method="post"><button className="secondary" type="submit">Sign out</button></form>
      </header>
      <main>{children}</main>
    </>
  )
}
