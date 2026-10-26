'use server'
// Owner-only receipt actions. Every query runs as the signed-in owner, so
// RLS applies; approval goes through ms_approve_receipt() in the database.
import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireOwner } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { flags } from '@/lib/flags'
import { getExtractor } from '@/lib/receipts/providers'
import { draftLinesFromExtraction, lineFlags, receiptFlags, type AliasHit, type DraftLine } from '@/lib/receipts/draft'
import { isLikelyDuplicate } from '@/lib/receipts/checks'
import { BASE_UNITS, vendorKey, type Unit } from '@/lib/receipts/normalize'
import { parseDollarsToCents } from '@/lib/money'
import { isIsoDate } from '@/lib/dates'

type DB = Awaited<ReturnType<typeof createClient>>

async function guard() {
  if (!flags.receipts()) notFound()
  await requireOwner()
  return createClient()
}

async function loadAliases(db: DB, vendor: string | null): Promise<Map<string, AliasHit>> {
  const m = new Map<string, AliasHit>()
  if (!vendor) return m
  const { data } = await db.from('ms_item_aliases').select('raw_key,ingredient_id,pack_qty,pack_unit').eq('vendor_key', vendorKey(vendor))
  for (const a of data ?? []) m.set(a.raw_key, { ingredient_id: a.ingredient_id, pack_qty: a.pack_qty === null ? null : Number(a.pack_qty), pack_unit: a.pack_unit })
  return m
}

async function findDuplicate(db: DB, id: string | null, r: { vendor: string | null; receipt_date: string | null; total_cents: number | null }) {
  if (!r.vendor || !r.receipt_date || r.total_cents === null) return null
  let q = db.from('ms_receipts').select('id,vendor,receipt_date,total_cents').eq('receipt_date', r.receipt_date).eq('total_cents', r.total_cents).neq('status', 'rejected')
  if (id) q = q.neq('id', id)
  const { data } = await q
  const hit = (data ?? []).find((o) => isLikelyDuplicate({ ...r, subtotal_cents: null, tax_cents: null }, { ...o, subtotal_cents: null, tax_cents: null }))
  return hit?.id ?? null
}

/** Called after the browser uploaded the photos to private storage. */
export async function createReceipt(imagePaths: string[]) {
  const db = await guard()
  const paths = imagePaths.filter((p) => typeof p === 'string' && /^[\w/.-]+$/.test(p) && !p.includes('..')).slice(0, 6)
  if (!paths.length) throw new Error('No photos uploaded')
  const extractor = getExtractor()
  const x = await extractor.extract(paths.map((path) => ({ path, mimeType: 'image/jpeg' })))
  const aliases = await loadAliases(db, x.vendor)
  const lines = draftLinesFromExtraction(x.lines, aliases)
  const header = { vendor: x.vendor, receipt_date: x.receipt_date, subtotal_cents: x.subtotal_cents, tax_cents: x.tax_cents, total_cents: x.total_cents }
  const dup = await findDuplicate(db, null, header)
  const notes = (x.notes ?? []).map((n) => ({ code: 'reader_note', message: n }))
  const { data: rec, error } = await db.from('ms_receipts').insert({
    ...header,
    receipt_number: x.receipt_number,
    status: 'needs_review',
    image_paths: paths,
    extractor: extractor.id,
    duplicate_of: dup,
    flags: [...notes, ...(lines.length ? receiptFlags(header, lines, dup) : [])],
  }).select('id').single()
  if (error || !rec) throw new Error('Could not save the receipt')
  if (lines.length) {
    const { error: le } = await db.from('ms_receipt_lines').insert(lines.map((l) => ({ ...l, receipt_id: rec.id })))
    if (le) throw new Error('Could not save the receipt lines')
  }
  revalidatePath('/receipts')
  return rec.id as string
}

const num = (v: FormDataEntryValue | null): number | null => {
  if (v === null || String(v).trim() === '') return null
  const n = Number(String(v).replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}
const cents = (v: FormDataEntryValue | null) => parseDollarsToCents(v === null ? null : String(v))
const str = (v: FormDataEntryValue | null) => (v === null || String(v).trim() === '' ? null : String(v).trim())

/** Save the owner's edits. Replaces all lines (receipt isn't approved yet; the DB blocks edits after). */
export async function saveReceipt(id: string, form: FormData) {
  const db = await guard()
  const vendor = str(form.get('vendor'))
  const dateRaw = str(form.get('receipt_date'))
  const header = {
    vendor,
    receipt_date: isIsoDate(dateRaw) ? dateRaw : null,
    receipt_number: str(form.get('receipt_number')),
    subtotal_cents: cents(form.get('subtotal')),
    tax_cents: cents(form.get('tax')),
    total_cents: cents(form.get('total')),
    category: ['food', 'packaging', 'supplies', 'fuel', 'other'].includes(String(form.get('category'))) ? String(form.get('category')) : 'food',
    event_tag: str(form.get('event_tag')),
  }
  const count = Math.min(200, Number(form.get('line_count') ?? 0) || 0)
  const lines: DraftLine[] = []
  for (let i = 0; i < count; i++) {
    const g = (k: string) => form.get(`l${i}_${k}`)
    const raw = String(g('raw_text') ?? '').trim()
    const qty = num(g('quantity')), unit = cents(g('unit_price')), total = cents(g('line_total'))
    if (!raw && qty === null && total === null) continue
    const ing = str(g('ingredient_id'))
    const prevIng = str(g('prev_ingredient_id'))
    const prevBy = String(g('prev_mapped_by') ?? 'none')
    const packUnit = String(g('pack_unit') ?? '')
    const d: DraftLine = {
      line_no: lines.length + 1,
      raw_text: raw,
      quantity: qty,
      unit_price_cents: unit,
      line_total_cents: total,
      discount_cents: cents(g('discount')) ?? 0,
      pack_qty: num(g('pack_qty')),
      pack_unit: (BASE_UNITS as readonly string[]).includes(packUnit) ? (packUnit as Unit) : null,
      ingredient_id: ing,
      mapped_by: !ing ? 'none' : ing === prevIng && prevBy === 'alias' ? 'alias' : 'owner',
      ignored: g('ignored') === 'on',
      flags: [],
    }
    d.flags = lineFlags(d)
    lines.push(d)
  }
  const dup = await findDuplicate(db, id, header)
  const { data: existing } = await db.from('ms_receipts').select('flags').eq('id', id).single()
  const notes = ((existing?.flags ?? []) as { code: string }[]).filter((f) => f.code === 'reader_note')
  const { error } = await db.from('ms_receipts').update({
    ...header, duplicate_of: dup, flags: [...notes, ...receiptFlags(header, lines, dup)], updated_at: new Date().toISOString(),
  }).eq('id', id)
  if (error) throw new Error('Could not save (approved receipts can’t be changed)')
  await db.from('ms_receipt_lines').delete().eq('receipt_id', id)
  if (lines.length) {
    const { error: le } = await db.from('ms_receipt_lines').insert(lines.map((l) => ({ ...l, receipt_id: id })))
    if (le) throw new Error('Could not save the lines')
  }
  revalidatePath(`/receipts/${id}`)
  if (form.get('intent') === 'add_line') redirect(`/receipts/${id}?add=1`)
  redirect(`/receipts/${id}?saved=1`)
}

export async function approveReceipt(id: string, form: FormData) {
  const db = await guard()
  const { error } = await db.rpc('ms_approve_receipt', { p_receipt_id: id, p_acknowledge_flags: form.get('acknowledge') === 'on' })
  if (error) redirect(`/receipts/${id}?error=${encodeURIComponent(error.message.slice(0, 200))}`)
  revalidatePath('/price-book')
  redirect(`/receipts/${id}?approved=1`)
}

export async function rejectReceipt(id: string) {
  const db = await guard()
  await db.from('ms_receipts').update({ status: 'rejected' }).eq('id', id).neq('status', 'approved')
  redirect('/receipts')
}

export async function addIngredient(form: FormData) {
  const db = await guard()
  const name = str(form.get('name'))
  const base = String(form.get('base_unit') ?? '')
  const category = ['food', 'packaging', 'supplies', 'other'].includes(String(form.get('category'))) ? String(form.get('category')) : 'food'
  const back = str(form.get('back')) ?? '/price-book'
  if (name && (BASE_UNITS as readonly string[]).includes(base)) {
    await db.from('ms_ingredients').insert({ name, base_unit: base, category })
  }
  redirect(back.startsWith('/') && !back.startsWith('//') ? back : '/price-book')
}

export async function forgetMapping(id: string) {
  const db = await guard()
  await db.from('ms_item_aliases').delete().eq('id', id)
  revalidatePath('/price-book')
}

