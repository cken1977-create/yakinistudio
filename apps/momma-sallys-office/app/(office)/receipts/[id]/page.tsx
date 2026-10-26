// Side-by-side review: photo on the left, the numbers on the right.
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireOwner } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { flags } from '@/lib/flags'
import { centsToInput, formatCents } from '@/lib/money'
import { BASE_UNITS, costPerBase, type Unit } from '@/lib/receipts/normalize'
import { approveReceipt, rejectReceipt, saveReceipt, addIngredient } from '../actions'

type Flag = { code: string; message: string; line_no?: number }

export default async function ReceiptReview({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  if (!flags.receipts()) notFound()
  await requireOwner()
  const { id } = await params
  const sp = await searchParams
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound()
  const db = await createClient()
  const [{ data: r }, { data: lines }, { data: ingredients }] = await Promise.all([
    db.from('ms_receipts').select('*').eq('id', id).maybeSingle(),
    db.from('ms_receipt_lines').select('*').eq('receipt_id', id).order('line_no'),
    db.from('ms_ingredients').select('id,name,base_unit').order('name'),
  ])
  if (!r) notFound()
  const images = await Promise.all((r.image_paths as string[]).map(async (p) => {
    const { data } = await db.storage.from('ms-receipts').createSignedUrl(p, 600)
    return { path: p, url: data?.signedUrl ?? null }
  }))
  const locked = r.status === 'approved' || r.status === 'rejected'
  const rows = [...(lines ?? [])]
  const blanks = locked ? 0 : rows.length === 0 ? 5 : sp.add ? 3 : 1
  for (let i = 0; i < blanks; i++) rows.push({ id: `new${i}`, raw_text: '', quantity: null, unit_price_cents: null, line_total_cents: null, discount_cents: 0, pack_qty: null, pack_unit: null, ingredient_id: null, mapped_by: 'none', ignored: false, flags: [] })
  const ingById = new Map((ingredients ?? []).map((i) => [i.id, i]))
  const receiptFlags = (r.flags ?? []) as Flag[]
  const save = saveReceipt.bind(null, id)
  const approve = approveReceipt.bind(null, id)
  const reject = rejectReceipt.bind(null, id)

  return (
    <>
      <p><Link href="/receipts">← Receipts</Link></p>
      <h1>{r.vendor ?? 'New receipt'} <span className="pill">{r.status.replace('_', ' ')}</span></h1>
      {sp.saved && <p className="card ok">Saved. Checks re-run.</p>}
      {sp.approved && <p className="card ok">Approved. These costs are now in your price book.</p>}
      {sp.error && <p className="card bad">Not approved: {sp.error}</p>}
      {r.duplicate_of && <p className="card flag">This looks like a receipt you already added: <Link href={`/receipts/${r.duplicate_of}`}>open the other one</Link>.</p>}
      {receiptFlags.length > 0 && (
        <div className={receiptFlags.some((f) => f.code === 'reader_note') ? 'sample' : 'card'}>
          <strong>Check these:</strong>
          <ul>{receiptFlags.map((f, i) => <li key={i} className="flag">{f.message}</li>)}</ul>
        </div>
      )}
      <div className="split">
        <div>
          {images.map((im) => im.url ? (
            im.path.endsWith('.pdf') ? <p key={im.path}><a href={im.url} target="_blank" rel="noreferrer">Open PDF</a></p>
              // eslint-disable-next-line @next/next/no-img-element
              : <a key={im.path} href={im.url} target="_blank" rel="noreferrer"><img src={im.url} alt="Receipt photo" /></a>
          ) : <p key={im.path} className="muted">Photo unavailable</p>)}
        </div>
        <form action={save} className="card">
          <fieldset disabled={locked} style={{ border: 0, padding: 0, margin: 0 }}>
            <div className="row">
              <label>Vendor <input name="vendor" defaultValue={r.vendor ?? ''} /></label>
              <label>Date <input type="date" name="receipt_date" defaultValue={r.receipt_date ?? ''} /></label>
              <label>Receipt # <input name="receipt_number" defaultValue={r.receipt_number ?? ''} size={10} /></label>
            </div>
            <div className="row" style={{ marginTop: 8 }}>
              <label>Subtotal $ <input name="subtotal" inputMode="decimal" defaultValue={centsToInput(r.subtotal_cents)} size={8} /></label>
              <label>Tax $ <input name="tax" inputMode="decimal" defaultValue={centsToInput(r.tax_cents)} size={7} /></label>
              <label>Total $ <input name="total" inputMode="decimal" defaultValue={centsToInput(r.total_cents)} size={8} /></label>
              <label>For <select name="category" defaultValue={r.category}>{['food', 'packaging', 'supplies', 'fuel', 'other'].map((c) => <option key={c}>{c}</option>)}</select></label>
              <label>Event <input name="event_tag" placeholder="optional" defaultValue={r.event_tag ?? ''} size={12} /></label>
            </div>
            <h2>Lines</h2>
            <p className="muted">&ldquo;Pack&rdquo; = how much is in ONE of what you bought (a 10 lb case → 10 lb). Lines you mark &ldquo;skip&rdquo; don&apos;t count.</p>
            <input type="hidden" name="line_count" value={rows.length} />
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead><tr><th>Line text</th><th className="num">Qty</th><th className="num">Each $</th><th className="num">Line $</th><th className="num">Off $</th><th>Pack</th><th>Ingredient</th><th>Skip</th><th className="num">Cost / unit</th></tr></thead>
                <tbody>{rows.map((l, i) => {
                  const ing = l.ingredient_id ? ingById.get(l.ingredient_id) : null
                  const cpu = !l.ignored && ing && l.quantity && l.pack_qty && l.pack_unit && l.line_total_cents !== null
                    ? costPerBase({ lineTotalCents: Number(l.line_total_cents), discountCents: Number(l.discount_cents ?? 0), quantity: Number(l.quantity), packQty: Number(l.pack_qty), packUnit: l.pack_unit as Unit, baseUnit: ing.base_unit as Unit })
                    : null
                  const lf = (l.flags ?? []) as Flag[]
                  return (
                    <tr key={l.id}>
                      <td>
                        <input name={`l${i}_raw_text`} defaultValue={l.raw_text} size={24} />
                        <input type="hidden" name={`l${i}_prev_ingredient_id`} value={l.ingredient_id ?? ''} />
                        <input type="hidden" name={`l${i}_prev_mapped_by`} value={l.mapped_by} />
                        {l.mapped_by === 'alias' && <div className="muted" style={{ fontSize: '.8rem' }}>matched from last time</div>}
                        {lf.map((f, n) => <div key={n} className="flag" style={{ fontSize: '.85rem' }}>{f.message}</div>)}
                      </td>
                      <td><input name={`l${i}_quantity`} inputMode="decimal" defaultValue={l.quantity ?? ''} size={4} /></td>
                      <td><input name={`l${i}_unit_price`} inputMode="decimal" defaultValue={centsToInput(l.unit_price_cents)} size={6} /></td>
                      <td><input name={`l${i}_line_total`} inputMode="decimal" defaultValue={centsToInput(l.line_total_cents)} size={7} /></td>
                      <td><input name={`l${i}_discount`} inputMode="decimal" defaultValue={l.discount_cents ? centsToInput(l.discount_cents) : ''} size={5} /></td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <input name={`l${i}_pack_qty`} inputMode="decimal" defaultValue={l.pack_qty ?? ''} size={4} />
                        <select name={`l${i}_pack_unit`} defaultValue={l.pack_unit ?? ''}><option value="">—</option>{BASE_UNITS.map((u) => <option key={u}>{u}</option>)}</select>
                      </td>
                      <td>
                        <select name={`l${i}_ingredient_id`} defaultValue={l.ingredient_id ?? ''}>
                          <option value="">— pick —</option>
                          {(ingredients ?? []).map((g) => <option key={g.id} value={g.id}>{g.name} ({g.base_unit})</option>)}
                        </select>
                      </td>
                      <td><input type="checkbox" name={`l${i}_ignored`} defaultChecked={l.ignored} aria-label="Skip this line" /></td>
                      <td className="num">{cpu !== null && ing ? `${formatCents(Math.round(cpu))}/${ing.base_unit}` : ''}</td>
                    </tr>
                  )
                })}</tbody>
              </table>
            </div>
            {!locked && (
              <div className="row" style={{ marginTop: 12 }}>
                <button type="submit" name="intent" value="save">Save &amp; re-check</button>
                <button type="submit" name="intent" value="add_line" className="secondary">Save &amp; add lines</button>
              </div>
            )}
          </fieldset>
        </form>
      </div>

      {r.status === 'needs_review' && (
        <div className="card">
          <h2>Approve</h2>
          <p className="muted">Save first. Approving puts each counted line into your price book and remembers how you matched it for next time. After approval this receipt can&apos;t be changed.</p>
          <form action={approve} className="row">
            {(receiptFlags.length > 0 || (lines ?? []).some((l) => !l.ignored && (l.flags as unknown[]).length)) && (
              <label className="flag"><input type="checkbox" name="acknowledge" /> I checked the flagged items against the photo</label>
            )}
            <button type="submit">Approve</button>
          </form>
          <form action={reject} style={{ marginTop: 8 }}><button type="submit" className="secondary">Don&apos;t count this receipt</button></form>
        </div>
      )}

      {!locked && (
        <details className="card">
          <summary>Add an ingredient</summary>
          <form action={addIngredient} className="row" style={{ marginTop: 8 }}>
            <input type="hidden" name="back" value={`/receipts/${id}`} />
            <input name="name" placeholder="e.g. Brisket" required />
            <label>measured in <select name="base_unit" defaultValue="lb">{BASE_UNITS.map((u) => <option key={u}>{u}</option>)}</select></label>
            <select name="category" defaultValue="food">{['food', 'packaging', 'supplies', 'other'].map((c) => <option key={c}>{c}</option>)}</select>
            <button type="submit" className="secondary">Add</button>
          </form>
          <p className="muted">Save your line edits before adding an ingredient.</p>
        </details>
      )}
    </>
  )
}
