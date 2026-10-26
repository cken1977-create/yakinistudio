import { notFound } from 'next/navigation'
import { requireOwner } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { flags } from '@/lib/flags'
import { formatCents } from '@/lib/money'
import { addDays, BUSINESS_TZ, isIsoDate, todayInTz } from '@/lib/dates'

type Day = {
  day: string; orders: number; gross_sales_cents: number; discount_cents: number; returns_cents: number; net_sales_cents: number
  tax_cents: number; tip_cents: number; fee_cents: number; card_cents: number; cash_cents: number; other_cents: number
  refunded_cents: number; items_sold: number
}
type Item = { item_name: string; variation_name: string | null; quantity: number; gross_sales_cents: number; net_cents: number }

export default async function SalesPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  if (!flags.squareSync()) notFound()
  await requireOwner()
  const sp = await searchParams
  const to = isIsoDate(sp.to) ? sp.to : todayInTz()
  const from = isIsoDate(sp.from) ? sp.from : addDays(to, -13)
  const supabase = await createClient()
  const [{ data: days, error }, { data: items }, { data: conn }] = await Promise.all([
    supabase.rpc('ms_daily_sales', { p_from: from, p_to: to, p_tz: BUSINESS_TZ }),
    supabase.rpc('ms_item_sales', { p_from: from, p_to: to, p_tz: BUSINESS_TZ }),
    supabase.from('ms_square_connection').select('status,last_sync_at').maybeSingle(),
  ])
  const rows = ((days ?? []) as Day[]).slice().reverse()
  const sum = (k: keyof Day) => rows.reduce((s, r) => s + Number(r[k] ?? 0), 0)

  return (
    <>
      <h1>Daily sales</h1>
      <p className="muted">From Square (sandbox test data in this build). Days run on Abilene time. Net sales = gross − discounts − returns, before tax and tips. Fees are what Square charged on card payments.</p>
      {conn?.status !== 'connected' && <p className="flag">Square isn&apos;t connected, so these numbers may be empty or stale.</p>}
      <form className="row card">
        <label>From <input type="date" name="from" defaultValue={from} /></label>
        <label>To <input type="date" name="to" defaultValue={to} /></label>
        <button type="submit">Show</button>
      </form>
      {error ? <p className="bad">Couldn&apos;t load sales.</p> : (
        <table>
          <thead><tr>
            <th>Day</th><th className="num">Orders</th><th className="num">Gross</th><th className="num">Discounts</th><th className="num">Returns</th>
            <th className="num">Net sales</th><th className="num">Tax</th><th className="num">Tips</th><th className="num">Square fees</th>
            <th className="num">Card</th><th className="num">Cash</th><th className="num">Other</th><th className="num">Items</th>
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.day}>
                <td>{r.day}</td><td className="num">{r.orders}</td><td className="num">{formatCents(r.gross_sales_cents)}</td>
                <td className="num">{formatCents(r.discount_cents)}</td><td className="num">{formatCents(r.returns_cents)}</td>
                <td className="num"><strong>{formatCents(r.net_sales_cents)}</strong></td><td className="num">{formatCents(r.tax_cents)}</td>
                <td className="num">{formatCents(r.tip_cents)}</td><td className="num">{formatCents(r.fee_cents)}</td>
                <td className="num">{formatCents(r.card_cents)}</td><td className="num">{formatCents(r.cash_cents)}</td>
                <td className="num">{formatCents(r.other_cents)}</td><td className="num">{Number(r.items_sold)}</td>
              </tr>
            ))}
            <tr>
              <th>Total</th><th className="num">{sum('orders')}</th><th className="num">{formatCents(sum('gross_sales_cents'))}</th>
              <th className="num">{formatCents(sum('discount_cents'))}</th><th className="num">{formatCents(sum('returns_cents'))}</th>
              <th className="num">{formatCents(sum('net_sales_cents'))}</th><th className="num">{formatCents(sum('tax_cents'))}</th>
              <th className="num">{formatCents(sum('tip_cents'))}</th><th className="num">{formatCents(sum('fee_cents'))}</th>
              <th className="num">{formatCents(sum('card_cents'))}</th><th className="num">{formatCents(sum('cash_cents'))}</th>
              <th className="num">{formatCents(sum('other_cents'))}</th><th className="num">{sum('items_sold')}</th>
            </tr>
          </tbody>
        </table>
      )}
      <h2>Top items</h2>
      <table>
        <thead><tr><th>Item</th><th>Option</th><th className="num">Sold</th><th className="num">Gross</th><th className="num">Net</th></tr></thead>
        <tbody>{((items ?? []) as Item[]).map((i, n) => (
          <tr key={n}><td>{i.item_name}</td><td>{i.variation_name ?? ''}</td><td className="num">{Number(i.quantity)}</td>
            <td className="num">{formatCents(i.gross_sales_cents)}</td><td className="num">{formatCents(i.net_cents)}</td></tr>
        ))}</tbody>
      </table>
    </>
  )
}
