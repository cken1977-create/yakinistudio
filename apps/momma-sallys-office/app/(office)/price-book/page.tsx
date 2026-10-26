import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireOwner } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { flags } from '@/lib/flags'
import { formatCents } from '@/lib/money'
import { BASE_UNITS } from '@/lib/receipts/normalize'
import { addIngredient, forgetMapping } from '../receipts/actions'

const per = (c: number | string | null, unit: string) => {
  if (c === null) return '—'
  const n = Number(c)
  return n < 100 ? `${n.toFixed(n < 10 ? 2 : 1)}¢/${unit}` : `${formatCents(Math.round(n))}/${unit}`
}

export default async function PriceBookPage() {
  if (!flags.receipts()) notFound()
  await requireOwner()
  const db = await createClient()
  const [{ data: current }, { data: ingredients }, { data: aliases }] = await Promise.all([
    db.from('ms_price_book_current').select('*').order('ingredient_name'),
    db.from('ms_ingredients').select('id,name,base_unit,category').order('name'),
    db.from('ms_item_aliases').select('id,vendor_key,raw_key,pack_qty,pack_unit,times_used,ingredient_id').order('last_used_at', { ascending: false }).limit(200),
  ])
  const names = new Map((ingredients ?? []).map((i) => [i.id, i.name]))
  const priced = new Set((current ?? []).map((c) => c.ingredient_id))
  return (
    <>
      <h1>Price book</h1>
      <p className="muted">What you last paid for each ingredient, from approved receipts only.</p>
      <table>
        <thead><tr><th>Ingredient</th><th className="num">Latest cost</th><th>Bought</th><th>From</th><th className="num">Receipts</th></tr></thead>
        <tbody>
          {(current ?? []).map((c) => (
            <tr key={c.ingredient_id}><td>{c.ingredient_name}</td><td className="num">{per(c.cost_per_base_cents, c.base_unit)}</td>
              <td><Link href={`/receipts/${c.receipt_id}`}>{c.observed_on}</Link></td><td>{c.vendor}</td><td className="num">{c.observations}</td></tr>
          ))}
          {(ingredients ?? []).filter((i) => !priced.has(i.id)).map((i) => (
            <tr key={i.id}><td>{i.name}</td><td className="num muted">no approved receipt yet</td><td /><td /><td /></tr>
          ))}
        </tbody>
      </table>
      <details className="card" style={{ marginTop: 16 }}>
        <summary>Add an ingredient</summary>
        <form action={addIngredient} className="row" style={{ marginTop: 8 }}>
          <input name="name" placeholder="e.g. Collard greens" required />
          <label>measured in <select name="base_unit" defaultValue="lb">{BASE_UNITS.map((u) => <option key={u}>{u}</option>)}</select></label>
          <select name="category" defaultValue="food">{['food', 'packaging', 'supplies', 'other'].map((c) => <option key={c}>{c}</option>)}</select>
          <button type="submit" className="secondary">Add</button>
        </form>
      </details>
      <h2>Remembered matches</h2>
      <p className="muted">When a line from the same vendor looks like one of these, it&apos;s matched for you (you still check it).</p>
      <table>
        <thead><tr><th>Vendor</th><th>Line text</th><th>Ingredient</th><th>Pack</th><th className="num">Used</th><th /></tr></thead>
        <tbody>{(aliases ?? []).map((a) => (
          <tr key={a.id}><td>{a.vendor_key}</td><td>{a.raw_key}</td><td>{names.get(a.ingredient_id) ?? '?'}</td>
            <td>{a.pack_qty ? `${Number(a.pack_qty)} ${a.pack_unit}` : ''}</td><td className="num">{a.times_used}</td>
            <td><form action={forgetMapping.bind(null, a.id)}><button className="secondary" type="submit">Forget</button></form></td></tr>
        ))}</tbody>
      </table>
    </>
  )
}
