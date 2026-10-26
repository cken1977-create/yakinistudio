// Pure mappers from Square API objects to office rows (integer cents).
// Only the fields the office needs are kept; raw payloads aren't stored.

type Money = { amount?: number | string | null; currency?: string } | null | undefined
export const cents = (m: Money): number => {
  const n = m?.amount
  if (n === null || n === undefined) return 0
  const v = typeof n === 'string' ? Number(n) : n
  return Number.isFinite(v) ? Math.round(v) : 0
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export type OrderRow = {
  id: string; location_id: string | null; state: string | null; source_name: string | null; customer_id: string | null
  sq_created_at: string | null; sq_updated_at: string | null; closed_at: string | null
  total_cents: number; tax_cents: number; discount_cents: number; tip_cents: number; service_charge_cents: number
  gross_sales_cents: number; returns_cents: number; currency: string
}
export type OrderLineRow = {
  order_id: string; uid: string; name: string | null; variation_name: string | null; catalog_object_id: string | null
  quantity: number; base_price_cents: number; gross_sales_cents: number; discount_cents: number; total_cents: number
}

export function mapOrder(o: any): { order: OrderRow; lines: OrderLineRow[] } {
  const lines: OrderLineRow[] = (o.line_items ?? []).map((li: any, i: number) => {
    const qty = Number(li.quantity ?? 0)
    const base = cents(li.base_price_money)
    // gross_sales_money is present on Square line items; fall back to price × qty.
    const gross = li.gross_sales_money ? cents(li.gross_sales_money) : Math.round(base * qty)
    return {
      order_id: o.id,
      uid: li.uid ?? `line-${i}`,
      name: li.name ?? null,
      variation_name: li.variation_name ?? null,
      catalog_object_id: li.catalog_object_id ?? null,
      quantity: Number.isFinite(qty) ? qty : 0,
      base_price_cents: base,
      gross_sales_cents: gross,
      discount_cents: cents(li.total_discount_money),
      total_cents: cents(li.total_money),
    }
  })
  const order: OrderRow = {
    id: o.id,
    location_id: o.location_id ?? null,
    state: o.state ?? null,
    source_name: o.source?.name ?? null,
    customer_id: o.customer_id ?? null,
    sq_created_at: o.created_at ?? null,
    sq_updated_at: o.updated_at ?? null,
    closed_at: o.closed_at ?? null,
    total_cents: cents(o.total_money),
    tax_cents: cents(o.total_tax_money),
    discount_cents: cents(o.total_discount_money),
    tip_cents: cents(o.total_tip_money),
    service_charge_cents: cents(o.total_service_charge_money),
    gross_sales_cents: lines.reduce((s, l) => s + l.gross_sales_cents, 0),
    returns_cents: cents(o.return_amounts?.total_money),
    currency: o.total_money?.currency ?? 'USD',
  }
  return { order, lines }
}

export type PaymentRow = {
  id: string; order_id: string | null; location_id: string | null; status: string | null; source_type: string | null
  card_brand: string | null; sq_created_at: string | null; sq_updated_at: string | null
  amount_cents: number; tip_cents: number; total_cents: number; processing_fee_cents: number; refunded_cents: number; currency: string
}

export function mapPayment(p: any): PaymentRow {
  const fees: any[] = Array.isArray(p.processing_fee) ? p.processing_fee : []
  return {
    id: p.id,
    order_id: p.order_id ?? null,
    location_id: p.location_id ?? null,
    status: p.status ?? null,
    source_type: p.source_type ?? null,
    card_brand: p.card_details?.card?.card_brand ?? null,
    sq_created_at: p.created_at ?? null,
    sq_updated_at: p.updated_at ?? null,
    amount_cents: cents(p.amount_money),
    tip_cents: cents(p.tip_money),
    total_cents: cents(p.total_money ?? p.amount_money),
    // Fees can be adjusted (e.g. on refunds); Square lists each entry, so sum them.
    processing_fee_cents: fees.reduce((s, f) => s + cents(f.amount_money), 0),
    refunded_cents: cents(p.refunded_money),
    currency: p.amount_money?.currency ?? 'USD',
  }
}

export type CatalogItemRow = {
  id: string; name: string; description: string | null; category_id: string | null; category_name: string | null
  is_deleted: boolean; sq_updated_at: string | null
}
export type CatalogVariationRow = { id: string; item_id: string; name: string | null; price_cents: number | null; is_deleted: boolean }

export function mapCatalog(objects: any[]): { items: CatalogItemRow[]; variations: CatalogVariationRow[] } {
  const categories = new Map<string, string>()
  for (const o of objects) if (o.type === 'CATEGORY') categories.set(o.id, o.category_data?.name ?? '')
  const items: CatalogItemRow[] = []
  const variations: CatalogVariationRow[] = []
  for (const o of objects) {
    if (o.type !== 'ITEM') continue
    const d = o.item_data ?? {}
    const catId: string | null = d.categories?.[0]?.id ?? d.category_id ?? d.reporting_category?.id ?? null
    items.push({
      id: o.id,
      name: d.name ?? '(unnamed item)',
      description: d.description_plaintext ?? d.description ?? null,
      category_id: catId,
      category_name: catId ? categories.get(catId) ?? null : null,
      is_deleted: Boolean(o.is_deleted),
      sq_updated_at: o.updated_at ?? null,
    })
    for (const v of d.variations ?? []) {
      const vd = v.item_variation_data ?? {}
      variations.push({
        id: v.id,
        item_id: o.id,
        name: vd.name ?? null,
        price_cents: vd.price_money ? cents(vd.price_money) : null,
        is_deleted: Boolean(v.is_deleted || o.is_deleted),
      })
    }
  }
  return { items, variations }
}

export type CustomerRow = {
  id: string; given_name: string | null; family_name: string | null; company_name: string | null; email: string | null
  phone: string | null; sq_created_at: string | null; sq_updated_at: string | null; is_deleted: boolean
}
export function mapCustomer(c: any, deleted = false): CustomerRow {
  return {
    id: c.id,
    given_name: c.given_name ?? null,
    family_name: c.family_name ?? null,
    company_name: c.company_name ?? null,
    email: c.email_address ?? null,
    phone: c.phone_number ?? null,
    sq_created_at: c.created_at ?? null,
    sq_updated_at: c.updated_at ?? null,
    is_deleted: deleted,
  }
}

export type TeamMemberRow = {
  id: string; given_name: string | null; family_name: string | null; email: string | null; phone: string | null
  status: string | null; is_owner: boolean
}
/** Wage settings are deliberately dropped. */
export function mapTeamMember(t: any): TeamMemberRow {
  return {
    id: t.id,
    given_name: t.given_name ?? null,
    family_name: t.family_name ?? null,
    email: t.email_address ?? null,
    phone: t.phone_number ?? null,
    status: t.status ?? null,
    is_owner: Boolean(t.is_owner),
  }
}
