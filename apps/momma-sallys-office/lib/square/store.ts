// Persistence for the Square sync. Runs with the service-role client only:
// synced tables are read-only for every signed-in user, and tokens are
// service-only. Tokens are AES-GCM encrypted before they touch the database.
import type { SupabaseClient } from '@supabase/supabase-js'
import { decryptSecret, encryptSecret } from './crypto'
import type { TokenResponse } from './oauth'

export type ConnectionRow = {
  status: 'disconnected' | 'connected' | 'revoked' | 'error'
  merchant_id: string | null
  business_name: string | null
  access_expires_at: string | null
  last_sync_at: string | null
  last_error: string | null
}

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e)).slice(0, 500)

async function check<T>(p: PromiseLike<{ data: T; error: { message: string } | null }>, what: string): Promise<T> {
  const { data, error } = await p
  if (error) throw new Error(`${what}: ${error.message}`)
  return data
}

export async function getConnection(db: SupabaseClient): Promise<ConnectionRow | null> {
  return check(db.from('ms_square_connection').select('status,merchant_id,business_name,access_expires_at,last_sync_at,last_error').eq('id', 1).maybeSingle(), 'read connection')
}

export async function saveTokens(db: SupabaseClient, keyB64: string, t: TokenResponse, extra: { businessName?: string | null; scopes?: string[]; isRefresh?: boolean }) {
  await check(db.from('ms_square_tokens').upsert({
    id: 1,
    access_token_enc: encryptSecret(t.access_token, keyB64),
    refresh_token_enc: encryptSecret(t.refresh_token, keyB64),
    updated_at: new Date().toISOString(),
  }), 'save tokens')
  const now = new Date().toISOString()
  await check(db.from('ms_square_connection').upsert({
    id: 1,
    environment: 'sandbox',
    merchant_id: t.merchant_id,
    status: 'connected',
    access_expires_at: t.expires_at,
    last_error: null,
    updated_at: now,
    ...(extra.isRefresh ? { last_refresh_at: now } : { connected_at: now }),
    ...(extra.businessName !== undefined ? { business_name: extra.businessName } : {}),
    ...(extra.scopes ? { scopes: extra.scopes } : {}),
  }), 'save connection')
}

export async function loadTokens(db: SupabaseClient, keyB64: string): Promise<{ accessToken: string; refreshToken: string } | null> {
  const row = await check(db.from('ms_square_tokens').select('access_token_enc,refresh_token_enc').eq('id', 1).maybeSingle(), 'load tokens')
  if (!row) return null
  const r = row as { access_token_enc: string; refresh_token_enc: string }
  return { accessToken: decryptSecret(r.access_token_enc, keyB64), refreshToken: decryptSecret(r.refresh_token_enc, keyB64) }
}

/** Revoked or disconnected: delete tokens, keep synced history. */
export async function markDisconnected(db: SupabaseClient, status: 'revoked' | 'disconnected', note?: string) {
  await check(db.from('ms_square_tokens').delete().eq('id', 1), 'delete tokens')
  await check(db.from('ms_square_connection').upsert({ id: 1, status, access_expires_at: null, last_error: note ?? null, updated_at: new Date().toISOString() }), 'mark disconnected')
}

export async function markError(db: SupabaseClient, e: unknown) {
  await db.from('ms_square_connection').update({ status: 'error', last_error: errMsg(e), updated_at: new Date().toISOString() }).eq('id', 1)
}

export async function startRun(db: SupabaseClient, kind: string, trigger: string): Promise<number> {
  const r = await check(db.from('ms_sync_runs').insert({ kind, trigger }).select('id').single(), 'start run')
  return (r as { id: number }).id
}

export async function finishRun(db: SupabaseClient, id: number, counts: Record<string, number>, error?: unknown) {
  await db.from('ms_sync_runs').update({
    finished_at: new Date().toISOString(),
    status: error ? 'error' : 'ok',
    counts,
    error: error ? errMsg(error) : null,
  }).eq('id', id)
}

export async function upsertRows(db: SupabaseClient, table: string, rows: Record<string, unknown>[], onConflict = 'id') {
  const now = new Date().toISOString()
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500).map((r) => (table === 'ms_order_lines' ? r : { ...r, synced_at: now }))
    await check(db.from(table).upsert(chunk, { onConflict }), `upsert ${table}`)
  }
}

/** Returns false if this event_id was already recorded (Square retries / duplicates). */
export async function recordWebhookEvent(db: SupabaseClient, e: { event_id: string; type: string; merchant_id?: string; object_id?: string | null }): Promise<boolean> {
  const { data, error } = await db.from('ms_square_webhook_events')
    .upsert({ event_id: e.event_id, type: e.type, merchant_id: e.merchant_id ?? null, object_id: e.object_id ?? null }, { onConflict: 'event_id', ignoreDuplicates: true })
    .select('event_id')
  if (error) throw new Error(`record webhook: ${error.message}`)
  return (data ?? []).length > 0
}

export async function finishWebhookEvent(db: SupabaseClient, eventId: string, status: 'processed' | 'ignored' | 'error', error?: unknown) {
  await db.from('ms_square_webhook_events').update({ status, processed_at: new Date().toISOString(), error: error ? errMsg(error) : null }).eq('event_id', eventId)
}
