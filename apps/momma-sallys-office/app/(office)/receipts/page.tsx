import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireOwner } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { flags } from '@/lib/flags'
import { formatCents } from '@/lib/money'

const LABEL: Record<string, string> = { draft: 'Draft', needs_review: 'Needs review', approved: 'Approved', rejected: 'Not counted' }

export default async function ReceiptsPage() {
  if (!flags.receipts()) notFound()
  await requireOwner()
  const db = await createClient()
  const { data } = await db.from('ms_receipts').select('id,status,vendor,receipt_date,total_cents,flags,category,event_tag,created_at').order('created_at', { ascending: false }).limit(200)
  return (
    <>
      <div className="row"><h1 style={{ marginRight: 'auto' }}>Receipts</h1><Link className="btn" href="/receipts/new">Add a receipt</Link></div>
      <p className="muted">Nothing counts toward your costs until you check it and press Approve.</p>
      <table>
        <thead><tr><th>Date</th><th>Vendor</th><th>For</th><th className="num">Total</th><th>Status</th><th>Flags</th></tr></thead>
        <tbody>{(data ?? []).map((r) => (
          <tr key={r.id}>
            <td><Link href={`/receipts/${r.id}`}>{r.receipt_date ?? 'no date'}</Link></td>
            <td>{r.vendor ?? <span className="muted">unknown</span>}</td>
            <td>{r.category}{r.event_tag ? ` · ${r.event_tag}` : ''}</td>
            <td className="num">{formatCents(r.total_cents)}</td>
            <td><span className="pill">{LABEL[r.status] ?? r.status}</span></td>
            <td className="flag">{(r.flags as unknown[]).length || ''}</td>
          </tr>
        ))}</tbody>
      </table>
    </>
  )
}
