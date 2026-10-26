// Square → office sync (read-only on Square's side).
//  - full: locations, catalog, team, customers, and orders/payments for the
//    last SQUARE_BACKFILL_DAYS (default 30).
//  - incremental: orders updated / payments created since the last good sync
//    minus a 1-day overlap (webhooks can arrive late or out of order; upserts
//    make re-reads harmless).
//  - single objects: used by webhooks, always re-fetched from Square rather
//    than trusting the webhook body.
import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSquareConfig } from './config'
import { squareApi, type SquareApi } from './api'
import { mapCatalog, mapCustomer, mapOrder, mapPayment, mapTeamMember } from './mappers'
import { needsRefresh, refreshAccessToken } from './oauth'
import { SquareApiError } from './http'
import * as store from './store'

const DAY = 24 * 3600 * 1000

export async function getApi(db: SupabaseClient, opts: { forceRefresh?: boolean } = {}): Promise<SquareApi> {
  const cfg = getSquareConfig()
  const conn = await store.getConnection(db)
  const tokens = await store.loadTokens(db, cfg.tokenEncryptionKey)
  if (!conn || conn.status === 'revoked' || conn.status === 'disconnected' || !tokens) {
    throw new Error('Square is not connected')
  }
  let access = tokens.accessToken
  if (opts.forceRefresh || needsRefresh(conn.access_expires_at)) {
    const t = await refreshAccessToken(cfg, tokens.refreshToken)
    await store.saveTokens(db, cfg.tokenEncryptionKey, t, { isRefresh: true })
    access = t.access_token
  }
  return squareApi(access)
}

async function syncOrders(db: SupabaseClient, api: SquareApi, locationIds: string[], since: string) {
  if (!locationIds.length) return 0
  let n = 0
  let batch: ReturnType<typeof mapOrder>[] = []
  const flush = async () => {
    if (!batch.length) return
    await store.upsertRows(db, 'ms_orders', batch.map((b) => b.order))
    // Replace lines for these orders (line items can change while an order is open).
    const ids = batch.map((b) => b.order.id)
    const { error } = await db.from('ms_order_lines').delete().in('order_id', ids)
    if (error) throw new Error(`clear order lines: ${error.message}`)
    await store.upsertRows(db, 'ms_order_lines', batch.flatMap((b) => b.lines), 'order_id,uid')
    n += batch.length
    batch = []
  }
  for await (const o of api.orders(locationIds, since)) {
    batch.push(mapOrder(o))
    if (batch.length >= 200) await flush()
  }
  await flush()
  return n
}

async function syncPayments(db: SupabaseClient, api: SquareApi, since: string) {
  const rows = []
  for await (const p of api.payments(since)) rows.push(mapPayment(p))
  await store.upsertRows(db, 'ms_payments', rows)
  return rows.length
}

async function syncLocations(db: SupabaseClient, api: SquareApi) {
  const locs = await api.locations()
  await store.upsertRows(db, 'ms_square_locations', locs.map((l) => ({ id: l.id, name: l.name ?? null, timezone: l.timezone ?? null, status: l.status ?? null })))
  return locs.filter((l) => l.status !== 'INACTIVE').map((l) => l.id as string)
}

async function syncCatalog(db: SupabaseClient, api: SquareApi) {
  const objs = []
  for await (const o of api.catalog()) objs.push(o)
  const { items, variations } = mapCatalog(objs)
  await store.upsertRows(db, 'ms_catalog_items', items)
  await store.upsertRows(db, 'ms_catalog_variations', variations)
  return items.length
}

async function syncCustomers(db: SupabaseClient, api: SquareApi) {
  const rows = []
  for await (const c of api.customers()) rows.push(mapCustomer(c))
  await store.upsertRows(db, 'ms_customers', rows)
  return rows.length
}

async function syncTeam(db: SupabaseClient, api: SquareApi) {
  const rows = []
  for await (const t of api.team()) rows.push(mapTeamMember(t))
  await store.upsertRows(db, 'ms_team_members', rows)
  return rows.length
}

export async function runSync(db: SupabaseClient, kind: 'full' | 'incremental', trigger: string) {
  const runId = await store.startRun(db, kind, trigger)
  const counts: Record<string, number> = {}
  try {
    const api = await getApi(db)
    const conn = await store.getConnection(db)
    const backfillDays = Math.min(400, Math.max(1, Number(process.env.SQUARE_BACKFILL_DAYS ?? 30) || 30))
    const since = kind === 'full' || !conn?.last_sync_at
      ? new Date(Date.now() - backfillDays * DAY).toISOString()
      : new Date(Date.parse(conn.last_sync_at) - DAY).toISOString()

    if (kind === 'full') {
      const merchant = await api.merchant().catch(() => null)
      if (merchant?.business_name) {
        await db.from('ms_square_connection').update({ business_name: merchant.business_name }).eq('id', 1)
      }
    }
    const locationIds = await syncLocations(db, api)
    counts.locations = locationIds.length
    if (kind === 'full') {
      counts.catalog_items = await syncCatalog(db, api)
      counts.team_members = await syncTeam(db, api)
      counts.customers = await syncCustomers(db, api)
    }
    counts.orders = await syncOrders(db, api, locationIds, since)
    counts.payments = await syncPayments(db, api, since)

    await db.from('ms_square_connection').update({ last_sync_at: new Date().toISOString(), last_error: null, status: 'connected' }).eq('id', 1)
    await store.finishRun(db, runId, counts)
    return { ok: true as const, counts }
  } catch (e) {
    await store.finishRun(db, runId, counts, e)
    if (e instanceof SquareApiError && e.status === 401) {
      await store.markError(db, new Error('Square rejected the token; reconnect may be needed'))
    }
    return { ok: false as const, counts, error: e instanceof Error ? e.message : String(e) }
  }
}

/** Re-fetch one object named by a webhook and upsert it. */
export async function syncObject(db: SupabaseClient, type: string, objectId: string | null | undefined, payload?: Record<string, unknown>) {
  const api = await getApi(db)
  /* eslint-disable @typescript-eslint/no-explicit-any */
  if (type.startsWith('order.') && objectId) {
    const orders = await api.ordersById(undefined, [objectId])
    for (const o of orders) {
      const m = mapOrder(o)
      await store.upsertRows(db, 'ms_orders', [m.order])
      await db.from('ms_order_lines').delete().eq('order_id', m.order.id)
      await store.upsertRows(db, 'ms_order_lines', m.lines, 'order_id,uid')
    }
    return
  }
  if (type.startsWith('payment.') && objectId) {
    await store.upsertRows(db, 'ms_payments', [mapPayment(await api.payment(objectId))])
    return
  }
  if (type.startsWith('refund.')) {
    const paymentId = (payload as any)?.refund?.payment_id
    if (paymentId) await store.upsertRows(db, 'ms_payments', [mapPayment(await api.payment(paymentId))])
    return
  }
  if (type === 'catalog.version.updated') { await syncCatalog(db, api); return }
  if (type.startsWith('team_member.')) { await syncTeam(db, api); return }
  if (type === 'customer.deleted' && objectId) {
    await db.from('ms_customers').update({ is_deleted: true }).eq('id', objectId)
    return
  }
  if (type.startsWith('customer.')) {
    const c = (payload as any)?.customer
    if (c?.id) await store.upsertRows(db, 'ms_customers', [mapCustomer(c)])
  }
}
