import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Everything the Phase 1 draft flow needs from storage, behind one interface. Production uses the
 * Supabase implementation (service role, server-only, spec 14.1). Tests and CI use the in-memory
 * one, so the whole flow can be exercised without a database or network.
 */
export type AssetInput = {
  id: string
  tenantId: string
  kind: 'logo' | 'image'
  bytes: Buffer
  mime: 'image/webp' | 'image/png'
  width: number
  height: number
  alt: string
  source: 'upload' | 'scraped'
  sourceUrl: string | null
  sha256: string
  licenseKind: 'owner_upload' | 'owner_site'
  licenseNote: string
  redistributable: boolean
}

export type NewDraft = {
  tenantId: string
  siteId: string
  slug: string
  kitId: string
  doc: unknown
  docSha256: string
  tokenHash: string
  expiresAt: Date
  sourceUrl: string | null
}

export type StoredDraft = {
  siteId: string
  tenantId: string
  doc: unknown
  tokenHash: string | null
  expiresAt: Date | null
  deleted: boolean
  /** True once a signed-in owner claimed it (Phase 2); anonymous access stops then. */
  claimed: boolean
}

export type AiRunRow = {
  tenantId: string | null
  siteId: string | null
  kind: 'generate'
  model: string
  promptVersion: string
  inputTokens: number
  outputTokens: number
  latencyMs: number
  outcome: 'ok' | 'invalid' | 'fallback' | 'timeout' | 'error' | 'blocked'
  toolCalls: number
}

export interface DraftStore {
  createTenant(t: { id: string; name: string; kitId: string }): Promise<void>
  saveAsset(a: AssetInput): Promise<void>
  createDraft(d: NewDraft): Promise<void>
  getDraft(siteId: string): Promise<StoredDraft | null>
  getAsset(tenantId: string, assetId: string): Promise<{ bytes: Buffer; mime: string } | null>
  /** True when the call is allowed (Postgres-backed limiter, spec 14.4). */
  hitRateLimit(key: string, max: number, windowSeconds: number): Promise<boolean>
  aiUsageToday(): Promise<{ inputTokens: number; outputTokens: number }>
  logAiRun(r: AiRunRow): Promise<void>
  /** Soft-delete anonymous drafts past their expiry (spec 5.2 step 7). Returns how many. */
  expireDrafts(now: Date): Promise<number>
}

// ------------------------------------------------------------------------------------------ Supabase

const BUCKET = 'site-assets'
const extFor = (mime: string) => (mime === 'image/png' ? 'png' : 'webp')

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- schema types are not generated for the builder schema yet
export function createSupabaseStore(db: SupabaseClient<any, any, any>): DraftStore {
  const fail = (what: string, error: { message?: string } | null): never => {
    // Only the operation name goes to logs/Sentry: never row contents (14.2).
    throw new Error(`Database ${what} failed${error?.message ? `: ${error.message.slice(0, 120)}` : ''}`)
  }
  return {
    async createTenant(t) {
      const { error } = await db.from('tenants').insert({ id: t.id, name: t.name, kit_id: t.kitId, status: 'prospect' })
      if (error) fail('tenant insert', error)
    },
    async saveAsset(a) {
      const path = `${a.tenantId}/${a.id}.${extFor(a.mime)}`
      const up = await db.storage.from(BUCKET).upload(path, a.bytes, { contentType: a.mime, upsert: false, cacheControl: '31536000' })
      if (up.error) fail('asset upload', up.error)
      const { error } = await db.from('assets').insert({
        id: a.id, tenant_id: a.tenantId, kind: a.kind, storage_path: path, mime: a.mime, width: a.width, height: a.height,
        bytes: a.bytes.length, alt: a.alt.slice(0, 160), source: a.source, source_url: a.sourceUrl, sha256: a.sha256,
        license_kind: a.licenseKind, license_note: a.licenseNote.slice(0, 300), redistributable: a.redistributable,
      })
      if (error) fail('asset insert', error)
    },
    async createDraft(d) {
      const site = await db.from('sites').insert({
        id: d.siteId, tenant_id: d.tenantId, slug: d.slug, kit_id: d.kitId, draft_doc: d.doc, draft_rev: 0,
        draft_token_hash: d.tokenHash, draft_expires_at: d.expiresAt.toISOString(), source_url: d.sourceUrl,
      })
      if (site.error) fail('site insert', site.error)
      // The first snapshot of the draft. site_versions has no 'draft' kind in Phase 0, so it is a checkpoint.
      const v = await db.from('site_versions').insert({
        tenant_id: d.tenantId, site_id: d.siteId, number: 1, kind: 'checkpoint', doc: d.doc, doc_sha256: d.docSha256, note: 'First draft',
      })
      if (v.error) {
        // Undo the half-made draft so no site row exists without its first version.
        await db.from('sites').delete().eq('id', d.siteId)
        fail('version insert', v.error)
      }
    },
    async getDraft(siteId) {
      const { data, error } = await db.from('sites')
        .select('id, tenant_id, draft_doc, draft_token_hash, draft_expires_at, deleted_at')
        .eq('id', siteId).maybeSingle()
      if (error) fail('site read', error)
      if (!data) return null
      const members = await db.from('memberships').select('id', { count: 'exact', head: true }).eq('tenant_id', data.tenant_id).is('deleted_at', null)
      if (members.error) fail('membership read', members.error)
      return {
        siteId: data.id, tenantId: data.tenant_id, doc: data.draft_doc, tokenHash: data.draft_token_hash,
        expiresAt: data.draft_expires_at ? new Date(data.draft_expires_at) : null, deleted: Boolean(data.deleted_at),
        claimed: (members.count ?? 0) > 0,
      }
    },
    async getAsset(tenantId, assetId) {
      const { data, error } = await db.from('assets').select('storage_path, mime').eq('id', assetId).eq('tenant_id', tenantId).is('deleted_at', null).maybeSingle()
      if (error) fail('asset read', error)
      if (!data) return null
      const file = await db.storage.from(BUCKET).download(data.storage_path)
      if (file.error || !file.data) return null
      return { bytes: Buffer.from(await file.data.arrayBuffer()), mime: data.mime }
    },
    async hitRateLimit(key, max, windowSeconds) {
      const { data, error } = await db.rpc('hit_rate_limit', { p_key: key, p_max: max, p_window_seconds: windowSeconds })
      if (error) fail('rate limit', error)
      return data === true
    },
    async aiUsageToday() {
      const { data, error } = await db.rpc('ai_usage_today')
      if (error) fail('ai usage', error)
      const row = Array.isArray(data) ? data[0] : data
      return { inputTokens: Number(row?.input_tokens ?? NaN), outputTokens: Number(row?.output_tokens ?? NaN) }
    },
    async logAiRun(r) {
      const { error } = await db.from('ai_runs').insert({
        tenant_id: r.tenantId, site_id: r.siteId, kind: r.kind, model: r.model, prompt_version: r.promptVersion,
        input_tokens: r.inputTokens, output_tokens: r.outputTokens, latency_ms: r.latencyMs, outcome: r.outcome, tool_calls: r.toolCalls,
      })
      if (error) fail('ai run insert', error)
    },
    async expireDrafts(now) {
      // Only drafts nobody claimed: a tenant with any membership is never touched here.
      const { data, error } = await db.from('sites')
        .select('id, tenant_id, tenants!inner(status, memberships(id))')
        .is('deleted_at', null).not('draft_token_hash', 'is', null).lt('draft_expires_at', now.toISOString()).limit(500)
      if (error) fail('expired drafts read', error)
      const rows = (data ?? []) as unknown as { id: string; tenant_id: string; tenants: { status: string; memberships: unknown[] } }[]
      const expired = rows.filter((r) => r.tenants.status === 'prospect' && r.tenants.memberships.length === 0)
      if (!expired.length) return 0
      const stamp = now.toISOString()
      const sites = await db.from('sites').update({ deleted_at: stamp }).in('id', expired.map((r) => r.id))
      if (sites.error) fail('draft expiry', sites.error)
      const tenants = await db.from('tenants').update({ deleted_at: stamp }).in('id', [...new Set(expired.map((r) => r.tenant_id))]).eq('status', 'prospect')
      if (tenants.error) fail('tenant expiry', tenants.error)
      return expired.length
    },
  }
}

// ------------------------------------------------------------------------------------------ memory

/** In-memory store for unit tests and the CI end-to-end run. Never used on Vercel. */
export function createMemoryStore(): DraftStore & { _state: { tenants: Map<string, unknown>; sites: Map<string, StoredDraft & { slug: string }>; assets: Map<string, AssetInput>; runs: AiRunRow[]; limits: Map<string, number> } } {
  const state = { tenants: new Map<string, unknown>(), sites: new Map<string, StoredDraft & { slug: string }>(), assets: new Map<string, AssetInput>(), runs: [] as AiRunRow[], limits: new Map<string, number>() }
  return {
    _state: state,
    async createTenant(t) { state.tenants.set(t.id, { ...t, status: 'prospect' }) },
    async saveAsset(a) { state.assets.set(a.id, a) },
    async createDraft(d) {
      if ([...state.sites.values()].some((s) => s.slug === d.slug)) throw new Error('slug taken')
      state.sites.set(d.siteId, { siteId: d.siteId, tenantId: d.tenantId, doc: structuredClone(d.doc), tokenHash: d.tokenHash, expiresAt: d.expiresAt, deleted: false, claimed: false, slug: d.slug })
    },
    async getDraft(siteId) {
      const s = state.sites.get(siteId)
      return s ? { ...s, doc: structuredClone(s.doc) } : null
    },
    async getAsset(tenantId, assetId) {
      const a = state.assets.get(assetId)
      return a && a.tenantId === tenantId ? { bytes: a.bytes, mime: a.mime } : null
    },
    async hitRateLimit(key, max, windowSeconds) {
      const k = `${key}|${Math.floor(Date.now() / 1000 / windowSeconds)}`
      const n = (state.limits.get(k) ?? 0) + 1
      state.limits.set(k, n)
      return n <= max
    },
    async aiUsageToday() {
      return state.runs.reduce((u, r) => ({ inputTokens: u.inputTokens + r.inputTokens, outputTokens: u.outputTokens + r.outputTokens }), { inputTokens: 0, outputTokens: 0 })
    },
    async logAiRun(r) { state.runs.push(r) },
    async expireDrafts(now) {
      let n = 0
      for (const s of state.sites.values()) if (!s.deleted && !s.claimed && s.expiresAt && s.expiresAt < now) { s.deleted = true; n++ }
      return n
    },
  }
}
