import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createMemoryBillingStore, createSupabaseBillingStore, type BillingStore, type MemBillingState } from './billing-store'
import { createMemoryDomainStore, createSupabaseDomainStore, type DomainStore } from './domain-store'
import { createMemoryPublishStore, createSupabasePublishStore, type MemPublishState, type PublishStore } from './publish-store'

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
  source: 'upload' | 'scraped' | 'generated' | 'kit-sample'
  sourceUrl: string | null
  sha256: string
  licenseKind: 'owner_upload' | 'owner_site' | 'generated' | 'kit_licensed'
  licenseNote: string
  redistributable: boolean
  /** Design D4: the served copies, placeholder, focus point, check result and licence of a photo. */
  imagery?: AssetImagery
}

export type AssetVariantFile = { format: 'avif' | 'webp'; width: number; height: number; crop: 'full' | 'tall'; bytes: Buffer }
export type AssetImagery = {
  variants: AssetVariantFile[]
  lqip: string
  focus: { x: number; y: number }
  dhash?: string
  quality?: { score: number; reasons: string[] }
  license?: { provider: string; model: string; prompt: string; createdAt: string }
}

/** What a renderer needs to draw a photo well (D4): exact size, placeholder, focus, served copies. */
export type AssetMeta = {
  width: number
  height: number
  lqip?: string
  focus?: { x: number; y: number }
  variants: { format: 'avif' | 'webp'; width: number; height: number; crop: 'full' | 'tall' }[]
  generated: boolean
  /** A kit library photo copied into this tenant: replaceable by images made for the site, like kit samples. */
  library?: boolean
}
/** Design D4: a kit library photo (made by hand with scripts/generate-kit-library.ts). */
export type KitLibraryImage = {
  id: string; kitId: string; slot: string; width: number; height: number; alt: string; bytes: number; sha256: string
  lqip: string | null; focus: { x: number; y: number } | null; dhash: string | null; qualityScore: number
  variants: { format: 'avif' | 'webp'; width: number; height: number; crop: 'full' | 'tall' }[]
  license: { provider: string; model: string; prompt: string; createdAt: string }
}
export type NewKitLibraryImage = Omit<KitLibraryImage, 'id' | 'bytes' | 'variants'> & { id: string; master: Buffer; variants: (KitLibraryImage['variants'][number] & { bytes: Buffer })[] }

export const variantKey = (v: { crop: string; width: number; format: string }) => `${v.crop}-${v.width}.${v.format}`

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
  /** draft_rev: bumped by every saved change (compare-and-set). */
  rev: number
  tokenHash: string | null
  expiresAt: Date | null
  deleted: boolean
  /** True once a signed-in owner claimed it (Phase 2); anonymous access stops then. */
  claimed: boolean
}

export type AiRunRow = {
  tenantId: string | null
  siteId: string | null
  kind: 'generate' | 'edit' | 'helper' | 'image' | 'image_check'
  model: string
  promptVersion: string
  inputTokens: number
  outputTokens: number
  latencyMs: number
  outcome: 'ok' | 'invalid' | 'fallback' | 'timeout' | 'error' | 'blocked'
  toolCalls: number
  /** Dollar cost (image runs; text runs are priced from tokens). */
  usd?: number
}

export type Role = 'owner' | 'editor' | 'operator'
export type TenantStatus = 'prospect' | 'trial' | 'active' | 'past_due' | 'canceled'

/** A site as the editor sees it (members only; checked by the caller with memberRole). */
export type EditorSite = {
  siteId: string
  tenantId: string
  tenantName: string
  tenantStatus: TenantStatus
  timezone: string | null
  slug: string
  doc: unknown
  rev: number
  takenDown: boolean
}

export type VersionRow = { id: string; number: number; kind: 'checkpoint' | 'published' | 'review'; note: string | null; createdAt: Date }
export type ClaimResult = 'ok' | 'not_found' | 'expired' | 'already_claimed' | 'changed'
export type AuditAction = 'restore' | 'brand.colors.change'
export type SaveResult = { ok: true; rev: number } | { ok: false; conflict: true; rev: number; doc: unknown }

/** Phase 2 additions: claiming, saving the draft, versions, chat, tutorial (spec 5.4, 10.2-10.9). */
export interface EditorStore {
  /** `doc` (business details from the claim screen) is saved only if the draft is still at `baseRev`. */
  claimDraft(c: { siteId: string; tokenHash: string; userId: string; ipHash: string; timezone: string | null; doc: unknown | null; baseRev: number | null }): Promise<ClaimResult>
  /** The user's role on the tenant (operators get 'operator' on any tenant), or null. */
  memberRole(userId: string, tenantId: string): Promise<Role | null>
  sitesForUser(userId: string): Promise<{ siteId: string; name: string; status: TenantStatus }[]>
  getEditorSite(siteId: string): Promise<EditorSite | null>
  /** Compare-and-set on draft_rev: saves only if the stored rev is still `baseRev`. */
  saveDraft(s: { siteId: string; baseRev: number; doc: unknown }): Promise<SaveResult>
  logEdit(e: { tenantId: string; siteId: string; userId: string | null; actorKind: 'owner' | 'editor' | 'operator' | 'ai' | 'anonymous'; source: 'click' | 'chat' | 'system'; ops: unknown; revAfter: number }): Promise<void>
  editsSinceLastVersion(siteId: string): Promise<{ count: number; lastVersionAt: Date | null }>
  createVersion(v: { siteId: string; doc: unknown; docSha256: string; userId: string | null; note: string | null }): Promise<{ id: string; number: number }>
  listVersions(siteId: string): Promise<VersionRow[]>
  getVersion(siteId: string, versionId: string): Promise<{ number: number; doc: unknown } | null>
  audit(a: { tenantId: string; userId: string | null; actorKind: 'owner' | 'editor' | 'operator'; action: AuditAction; targetId: string; details: Record<string, unknown> }): Promise<void>
  tenantAssetIds(tenantId: string): Promise<string[]>
  /** The tenant's own photos (not the logo) for the photo picker, newest first. */
  tenantPhotos(tenantId: string): Promise<{ id: string; width: number; height: number; alt: string; generated: boolean }[]>
  /** Chat edits in the last hour and AI tokens today for one tenant (per-tenant limits, 8.7). */
  tenantAiUsage(tenantId: string): Promise<{ editsLastHour: number; tokensToday: number }>
  saveChat(m: { tenantId: string; siteId: string; role: 'user' | 'assistant'; content: string; proposal: unknown | null }): Promise<string>
  recentChat(siteId: string, limit: number): Promise<{ role: 'user' | 'assistant'; content: string }[]>
  tutorialDone(userId: string, siteId: string): Promise<string[]>
  markTutorial(userId: string, siteId: string, step: string): Promise<void>
}

export interface DraftStore {
  createTenant(t: { id: string; name: string; kitId: string }): Promise<void>
  saveAsset(a: AssetInput): Promise<void>
  createDraft(d: NewDraft): Promise<void>
  getDraft(siteId: string): Promise<StoredDraft | null>
  getAsset(tenantId: string, assetId: string): Promise<{ bytes: Buffer; mime: string } | null>
  /** One served copy of a photo (D4), e.g. key 'full-1024.avif'; only keys the asset lists. */
  getAssetVariant(tenantId: string, assetId: string, key: string): Promise<{ bytes: Buffer; mime: string } | null>
  /** Size, placeholder, focus and served copies of the tenant's photos with these ids (D4). */
  assetMeta(tenantId: string, ids: readonly string[]): Promise<Record<string, AssetMeta>>
  /** D4: the kit library photos in use (not retired). Empty until the library is made. */
  kitLibrary(kitId: string): Promise<KitLibraryImage[]>
  /** D4: copy a library photo (file and copies) into a tenant's own photos; returns the new asset id. */
  copyLibraryImage(tenantId: string, image: KitLibraryImage): Promise<string>
  /** D4, batch script only: store a new library photo. */
  saveKitLibraryImage(image: NewKitLibraryImage): Promise<void>
  /** Dollars spent on images and image checks today, across all tenants (the images' own cap). */
  imageUsdToday(): Promise<number>
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
export function createSupabaseStore(db: SupabaseClient<any, any, any>): DraftStore & EditorStore & PublishStore & BillingStore & DomainStore {
  const fail = (what: string, error: { message?: string } | null): never => {
    // Only the operation name goes to logs/Sentry: never row contents (14.2).
    throw new Error(`Database ${what} failed${error?.message ? `: ${error.message.slice(0, 120)}` : ''}`)
  }
  return {
    ...createSupabasePublishStore(db),
    ...createSupabaseBillingStore(db),
    ...createSupabaseDomainStore(db),
    async createTenant(t) {
      const { error } = await db.from('tenants').insert({ id: t.id, name: t.name, kit_id: t.kitId, status: 'prospect' })
      if (error) fail('tenant insert', error)
    },
    async saveAsset(a) {
      const path = `${a.tenantId}/${a.id}.${extFor(a.mime)}`
      const up = await db.storage.from(BUCKET).upload(path, a.bytes, { contentType: a.mime, upsert: false, cacheControl: '31536000' })
      if (up.error) fail('asset upload', up.error)
      const variants: { format: string; width: number; height: number; crop: string; path: string }[] = []
      for (const v of a.imagery?.variants ?? []) {
        const vp = `${a.tenantId}/${a.id}/${variantKey(v)}`
        const vu = await db.storage.from(BUCKET).upload(vp, v.bytes, { contentType: `image/${v.format}`, upsert: false, cacheControl: '31536000' })
        if (vu.error) fail('asset variant upload', vu.error)
        variants.push({ format: v.format, width: v.width, height: v.height, crop: v.crop, path: vp })
      }
      const im = a.imagery
      const { error } = await db.from('assets').insert({
        id: a.id, tenant_id: a.tenantId, kind: a.kind, storage_path: path, mime: a.mime, width: a.width, height: a.height,
        bytes: a.bytes.length, alt: a.alt.slice(0, 160), source: a.source, source_url: a.sourceUrl, sha256: a.sha256,
        license_kind: a.licenseKind, license_note: a.licenseNote.slice(0, 300), redistributable: a.redistributable,
        ...(im ? {
          variants, lqip: im.lqip, focus_x: im.focus.x, focus_y: im.focus.y, dhash: im.dhash ?? null,
          quality_score: im.quality?.score ?? null, quality_reasons: im.quality?.reasons ?? [],
          license_provider: im.license?.provider ?? null, license_model: im.license?.model ?? null,
          license_prompt: im.license?.prompt.slice(0, 2000) ?? null, license_created_at: im.license?.createdAt ?? null,
        } : {}),
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
        .select('id, tenant_id, draft_doc, draft_rev, draft_token_hash, draft_expires_at, deleted_at')
        .eq('id', siteId).maybeSingle()
      if (error) fail('site read', error)
      if (!data) return null
      const members = await db.from('memberships').select('id', { count: 'exact', head: true }).eq('tenant_id', data.tenant_id).is('deleted_at', null)
      if (members.error) fail('membership read', members.error)
      return {
        siteId: data.id, tenantId: data.tenant_id, doc: data.draft_doc, rev: data.draft_rev, tokenHash: data.draft_token_hash,
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
    async getAssetVariant(tenantId, assetId, key) {
      const { data, error } = await db.from('assets').select('variants').eq('id', assetId).eq('tenant_id', tenantId).is('deleted_at', null).maybeSingle()
      if (error) fail('asset read', error)
      const v = ((data?.variants ?? []) as { format: 'avif' | 'webp'; width: number; crop: string; path: string }[]).find((x) => variantKey(x) === key)
      if (!v || !v.path.startsWith(`${tenantId}/${assetId}/`)) return null
      const file = await db.storage.from(BUCKET).download(v.path)
      if (file.error || !file.data) return null
      return { bytes: Buffer.from(await file.data.arrayBuffer()), mime: `image/${v.format}` }
    },
    async assetMeta(tenantId, ids) {
      if (!ids.length) return {}
      const { data, error } = await db.from('assets').select('id, width, height, lqip, focus_x, focus_y, variants, source')
        .eq('tenant_id', tenantId).in('id', ids.slice(0, 200)).is('deleted_at', null)
      if (error) fail('asset meta read', error)
      return Object.fromEntries((data ?? []).map((r) => [r.id as string, {
        width: (r.width as number) ?? 1600, height: (r.height as number) ?? 1000, lqip: (r.lqip as string) ?? undefined,
        focus: r.focus_x === null || r.focus_x === undefined ? undefined : { x: r.focus_x as number, y: r.focus_y as number },
        variants: ((r.variants ?? []) as AssetMeta['variants']).map((v) => ({ format: v.format, width: v.width, height: v.height, crop: v.crop })),
        generated: r.source === 'generated', library: r.source === 'kit-sample',
      } satisfies AssetMeta]))
    },
    async imageUsdToday() {
      const { data, error } = await db.rpc('ai_image_usd_today')
      if (error) fail('image spend', error)
      const n = Number(data)
      if (!Number.isFinite(n)) throw new Error('image spend unreadable') // fails closed
      return n
    },
    async kitLibrary(kitId) {
      const { data, error } = await db.from('kit_library_images')
        .select('id, kit_id, slot, width, height, alt, bytes, sha256, lqip, focus_x, focus_y, dhash, quality_score, variants, license_provider, license_model, license_prompt, license_created_at')
        .eq('kit_id', kitId).is('retired_at', null).order('created_at', { ascending: false }).limit(60)
      if (error) fail('kit library read', error)
      return (data ?? []).map((r) => ({
        id: r.id as string, kitId: r.kit_id as string, slot: r.slot as string, width: r.width as number, height: r.height as number,
        alt: r.alt as string, bytes: r.bytes as number, sha256: r.sha256 as string, lqip: (r.lqip as string | null) ?? null,
        focus: r.focus_x === null ? null : { x: r.focus_x as number, y: r.focus_y as number }, dhash: (r.dhash as string | null) ?? null,
        qualityScore: Number(r.quality_score),
        variants: ((r.variants ?? []) as KitLibraryImage['variants']).map((v) => ({ format: v.format, width: v.width, height: v.height, crop: v.crop })),
        license: { provider: r.license_provider as string, model: r.license_model as string, prompt: r.license_prompt as string, createdAt: new Date(r.license_created_at as string).toISOString() },
      }))
    },
    async copyLibraryImage(tenantId, img) {
      // Server-side copies inside the bucket: no bytes pass through here. The tenant owns its copy
      // (soft-deleted like any photo); the library's own files stay as they are.
      const id = crypto.randomUUID()
      const from = `kit-library/${img.kitId}/${img.id}`
      const path = `${tenantId}/${id}.webp`
      const c = await db.storage.from(BUCKET).copy(`${from}.webp`, path)
      if (c.error) fail('library copy', c.error)
      const variants: { format: string; width: number; height: number; crop: string; path: string }[] = []
      for (const v of img.variants) {
        const vp = `${tenantId}/${id}/${variantKey(v)}`
        const cv = await db.storage.from(BUCKET).copy(`${from}/${variantKey(v)}`, vp)
        if (cv.error) fail('library variant copy', cv.error)
        variants.push({ ...v, path: vp })
      }
      const { error } = await db.from('assets').insert({
        id, tenant_id: tenantId, kind: 'image', storage_path: path, mime: 'image/webp', width: img.width, height: img.height,
        bytes: img.bytes, alt: img.alt.slice(0, 160), source: 'kit-sample', source_url: null, sha256: img.sha256,
        license_kind: 'kit_licensed', license_note: 'Yakini kit library photo', redistributable: false,
        variants, lqip: img.lqip, focus_x: img.focus?.x ?? null, focus_y: img.focus?.y ?? null, dhash: img.dhash, quality_score: img.qualityScore,
        license_provider: img.license.provider, license_model: img.license.model, license_prompt: img.license.prompt.slice(0, 2000), license_created_at: img.license.createdAt,
      })
      if (error) fail('library asset insert', error)
      return id
    },
    async saveKitLibraryImage(img) {
      const base = `kit-library/${img.kitId}/${img.id}`
      const up = await db.storage.from(BUCKET).upload(`${base}.webp`, img.master, { contentType: 'image/webp', upsert: false, cacheControl: '31536000' })
      if (up.error) fail('library upload', up.error)
      const variants: { format: string; width: number; height: number; crop: string; path: string }[] = []
      for (const v of img.variants) {
        const vp = `${base}/${variantKey(v)}`
        const vu = await db.storage.from(BUCKET).upload(vp, v.bytes, { contentType: `image/${v.format}`, upsert: false, cacheControl: '31536000' })
        if (vu.error) fail('library variant upload', vu.error)
        variants.push({ format: v.format, width: v.width, height: v.height, crop: v.crop, path: vp })
      }
      const { error } = await db.from('kit_library_images').insert({
        id: img.id, kit_id: img.kitId, slot: img.slot, storage_path: `${base}.webp`, width: img.width, height: img.height, alt: img.alt.slice(0, 160),
        bytes: img.master.length, sha256: img.sha256, lqip: img.lqip, focus_x: img.focus?.x ?? null, focus_y: img.focus?.y ?? null,
        variants, dhash: img.dhash, quality_score: img.qualityScore,
        license_provider: img.license.provider, license_model: img.license.model, license_prompt: img.license.prompt.slice(0, 2000), license_created_at: img.license.createdAt,
      })
      if (error) fail('library insert', error)
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
        ...(r.usd ? { usd: r.usd } : {}),
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
    async claimDraft(c) {
      const { data, error } = await db.rpc('claim_draft', { p_site: c.siteId, p_token_hash: c.tokenHash, p_user: c.userId, p_ip_hash: c.ipHash, p_timezone: c.timezone, p_doc: c.doc, p_base_rev: c.baseRev })
      if (error) fail('claim', error)
      return data as ClaimResult
    },
    async memberRole(userId, tenantId) {
      // Your own site first: an operator who owns a site acts as its owner there (pays, cancels).
      const { data, error } = await db.from('memberships').select('role').eq('tenant_id', tenantId).eq('user_id', userId).is('deleted_at', null).maybeSingle()
      if (error) fail('membership read', error)
      if (data?.role) return data.role as Role
      const op = await db.from('operators').select('user_id').eq('user_id', userId).maybeSingle()
      if (op.error) fail('operator read', op.error)
      return op.data ? 'operator' : null
    },
    async sitesForUser(userId) {
      const { data, error } = await db.from('memberships')
        .select('tenant_id, tenants!inner(name, status, deleted_at, sites(id, deleted_at))').eq('user_id', userId).is('deleted_at', null)
      if (error) fail('sites read', error)
      const rows = (data ?? []) as unknown as { tenants: { name: string; status: TenantStatus; deleted_at: string | null; sites: { id: string; deleted_at: string | null }[] } }[]
      return rows.filter((r) => !r.tenants.deleted_at).flatMap((r) => r.tenants.sites.filter((x) => !x.deleted_at).map((x) => ({ siteId: x.id, name: r.tenants.name, status: r.tenants.status })))
    },
    async getEditorSite(siteId) {
      const { data, error } = await db.from('sites')
        .select('id, tenant_id, slug, draft_doc, draft_rev, takedown_at, deleted_at, tenants!inner(name, status, timezone, deleted_at)')
        .eq('id', siteId).maybeSingle()
      if (error) fail('site read', error)
      const r = data as unknown as { id: string; tenant_id: string; slug: string; draft_doc: unknown; draft_rev: number; takedown_at: string | null; deleted_at: string | null; tenants: { name: string; status: TenantStatus; timezone: string | null; deleted_at: string | null } } | null
      if (!r || r.deleted_at || r.tenants.deleted_at) return null
      return { siteId: r.id, tenantId: r.tenant_id, tenantName: r.tenants.name, tenantStatus: r.tenants.status, timezone: r.tenants.timezone, slug: r.slug, doc: r.draft_doc, rev: r.draft_rev, takenDown: Boolean(r.takedown_at) }
    },
    async saveDraft(sv) {
      const { data, error } = await db.from('sites').update({ draft_doc: sv.doc, draft_rev: sv.baseRev + 1 })
        .eq('id', sv.siteId).eq('draft_rev', sv.baseRev).is('deleted_at', null).select('draft_rev')
      if (error) fail('draft save', error)
      if (data && data.length === 1) return { ok: true, rev: data[0].draft_rev as number }
      const cur = await db.from('sites').select('draft_doc, draft_rev').eq('id', sv.siteId).maybeSingle()
      if (cur.error || !cur.data) fail('draft read', cur.error)
      return { ok: false, conflict: true, rev: cur.data!.draft_rev as number, doc: cur.data!.draft_doc }
    },
    async logEdit(e) {
      const { error } = await db.from('site_edits').insert({ tenant_id: e.tenantId, site_id: e.siteId, actor_user_id: e.userId, actor_kind: e.actorKind, source: e.source, ops: e.ops, draft_rev_after: e.revAfter })
      if (error) fail('edit log', error)
    },
    async editsSinceLastVersion(siteId) {
      const last = await db.from('site_versions').select('created_at').eq('site_id', siteId).order('number', { ascending: false }).limit(1).maybeSingle()
      if (last.error) fail('version read', last.error)
      const since = last.data?.created_at ?? '1970-01-01T00:00:00Z'
      const { count, error } = await db.from('site_edits').select('id', { count: 'exact', head: true }).eq('site_id', siteId).gt('created_at', since)
      if (error) fail('edit count', error)
      return { count: count ?? 0, lastVersionAt: last.data ? new Date(last.data.created_at) : null }
    },
    async createVersion(v) {
      const { data, error } = await db.rpc('create_version', { p_site: v.siteId, p_kind: 'checkpoint', p_doc: v.doc, p_sha: v.docSha256, p_user: v.userId, p_note: v.note ?? '' })
      if (error) fail('version create', error)
      const row = (Array.isArray(data) ? data[0] : data) as { id: string; number: number }
      return { id: row.id, number: row.number }
    },
    async listVersions(siteId) {
      const { data, error } = await db.from('site_versions').select('id, number, kind, note, created_at').eq('site_id', siteId).order('number', { ascending: false }).limit(100)
      if (error) fail('versions read', error)
      return (data ?? []).map((r) => ({ id: r.id, number: r.number, kind: r.kind, note: r.note, createdAt: new Date(r.created_at) }))
    },
    async getVersion(siteId, versionId) {
      const { data, error } = await db.from('site_versions').select('number, doc').eq('site_id', siteId).eq('id', versionId).maybeSingle()
      if (error) fail('version read', error)
      return data ? { number: data.number, doc: data.doc } : null
    },
    async audit(a) {
      const { error } = await db.from('audit_log').insert({ tenant_id: a.tenantId, actor_user_id: a.userId, actor_kind: a.actorKind, action: a.action, target_id: a.targetId, details: a.details })
      if (error) fail('audit insert', error)
    },
    async tenantAssetIds(tenantId) {
      const { data, error } = await db.from('assets').select('id').eq('tenant_id', tenantId).is('deleted_at', null).limit(500)
      if (error) fail('assets read', error)
      return (data ?? []).map((r) => r.id as string)
    },
    async tenantPhotos(tenantId) {
      const { data, error } = await db.from('assets').select('id, width, height, alt, source').eq('tenant_id', tenantId).eq('kind', 'image').is('deleted_at', null).order('created_at', { ascending: false }).limit(200)
      if (error) fail('photos read', error)
      return (data ?? []).map((r) => ({ id: r.id as string, width: r.width as number, height: r.height as number, alt: (r.alt as string) ?? '', generated: r.source === 'generated' }))
    },
    async tenantAiUsage(tenantId) {
      const hourAgo = new Date(Date.now() - 3600_000).toISOString()
      const dayStart = new Date(); dayStart.setUTCHours(0, 0, 0, 0)
      const edits = await db.from('ai_runs').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('kind', 'edit').gt('created_at', hourAgo)
      if (edits.error) fail('ai runs count', edits.error)
      const runs = await db.from('ai_runs').select('input_tokens, output_tokens').eq('tenant_id', tenantId).gte('created_at', dayStart.toISOString()).limit(5000)
      if (runs.error) fail('ai runs read', runs.error)
      return { editsLastHour: edits.count ?? 0, tokensToday: (runs.data ?? []).reduce((n, r) => n + r.input_tokens + r.output_tokens, 0) }
    },
    async saveChat(m) {
      const { data, error } = await db.from('chat_messages').insert({ tenant_id: m.tenantId, site_id: m.siteId, role: m.role, content: m.content.slice(0, 2000), proposal: m.proposal }).select('id').single()
      if (error) fail('chat insert', error)
      return data!.id as string
    },
    async recentChat(siteId, limit) {
      const { data, error } = await db.from('chat_messages').select('role, content').eq('site_id', siteId).order('created_at', { ascending: false }).limit(limit)
      if (error) fail('chat read', error)
      return (data ?? []).reverse() as { role: 'user' | 'assistant'; content: string }[]
    },
    async tutorialDone(userId, siteId) {
      const { data, error } = await db.from('tutorial_progress').select('step').eq('user_id', userId).eq('site_id', siteId)
      if (error) fail('tutorial read', error)
      return (data ?? []).map((r) => r.step as string)
    },
    async markTutorial(userId, siteId, step) {
      const { error } = await db.from('tutorial_progress').upsert({ user_id: userId, site_id: siteId, step }, { onConflict: 'user_id,site_id,step', ignoreDuplicates: true })
      if (error) fail('tutorial save', error)
    },
  }
}

// ------------------------------------------------------------------------------------------ memory

type MemSite = StoredDraft & { slug: string; rev: number; takenDown: boolean; sourceUrl: string | null }
type MemTenant = { id: string; name: string; kitId: string; status: TenantStatus; timezone: string | null; attestedIpHash: string | null; attestedAt: Date | null }
type MemState = {
  tenants: Map<string, MemTenant>
  sites: Map<string, MemSite>
  assets: Map<string, AssetInput>
  runs: (AiRunRow & { at: number })[]
  kitLibrary: NewKitLibraryImage[]
  limits: Map<string, number>
  members: { tenantId: string; userId: string; role: 'owner' | 'editor' }[]
  operators: Set<string>
  versions: (VersionRow & { siteId: string; doc: unknown })[]
  edits: { siteId: string; at: number; source: string; ops: unknown; revAfter: number; actorKind: string }[]
  audit: { tenantId: string; action: string; targetId: string; details: Record<string, unknown> }[]
  chat: { id: string; siteId: string; role: 'user' | 'assistant'; content: string; at: number }[]
  tutorial: Set<string>
}

/** In-memory store for unit tests and the CI end-to-end run. Never used on Vercel. */
export function createMemoryStore(): DraftStore & EditorStore & PublishStore & BillingStore & DomainStore & { _state: MemState; _p3: MemPublishState; _p4: MemBillingState } {
  const state: MemState = {
    tenants: new Map(), sites: new Map(), assets: new Map(), runs: [], kitLibrary: [], limits: new Map(), members: [], operators: new Set(),
    versions: [], edits: [], audit: [], chat: [], tutorial: new Set(),
  }
  const clone = <T>(v: T): T => structuredClone(v)
  const isClaimed = (tenantId: string) => state.members.some((m) => m.tenantId === tenantId)
  const p3 = createMemoryPublishStore(state)
  return {
    ...p3,
    ...createMemoryBillingStore(state, p3._p3),
    ...createMemoryDomainStore(state, p3._p3),
    _state: state,
    async createTenant(t) { state.tenants.set(t.id, { ...t, status: 'prospect', timezone: null, attestedIpHash: null, attestedAt: null }) },
    async saveAsset(a) { state.assets.set(a.id, a) },
    async createDraft(d) {
      if ([...state.sites.values()].some((s) => s.slug === d.slug)) throw new Error('slug taken')
      state.sites.set(d.siteId, { siteId: d.siteId, tenantId: d.tenantId, doc: clone(d.doc), tokenHash: d.tokenHash, expiresAt: d.expiresAt, deleted: false, claimed: false, slug: d.slug, rev: 0, takenDown: false, sourceUrl: d.sourceUrl })
      state.versions.push({ id: crypto.randomUUID(), siteId: d.siteId, number: 1, kind: 'checkpoint', note: 'First draft', createdAt: new Date(), doc: clone(d.doc) })
    },
    async getDraft(siteId) {
      const s = state.sites.get(siteId)
      return s ? { siteId: s.siteId, tenantId: s.tenantId, doc: clone(s.doc), rev: s.rev, tokenHash: s.tokenHash, expiresAt: s.expiresAt, deleted: s.deleted, claimed: s.claimed || isClaimed(s.tenantId) } : null
    },
    async getAsset(tenantId, assetId) {
      const a = state.assets.get(assetId)
      return a && a.tenantId === tenantId ? { bytes: a.bytes, mime: a.mime } : null
    },
    async getAssetVariant(tenantId, assetId, key) {
      const a = state.assets.get(assetId)
      const v = a && a.tenantId === tenantId ? a.imagery?.variants.find((x) => variantKey(x) === key) : undefined
      return v ? { bytes: v.bytes, mime: `image/${v.format}` } : null
    },
    async assetMeta(tenantId, ids) {
      const out: Record<string, AssetMeta> = {}
      for (const id of ids) {
        const a = state.assets.get(id)
        if (!a || a.tenantId !== tenantId) continue
        out[id] = {
          width: a.width, height: a.height, lqip: a.imagery?.lqip, focus: a.imagery?.focus,
          variants: (a.imagery?.variants ?? []).map((v) => ({ format: v.format, width: v.width, height: v.height, crop: v.crop })),
          generated: a.source === 'generated', library: a.source === 'kit-sample',
        }
      }
      return out
    },
    async imageUsdToday() {
      const day = new Date(); day.setUTCHours(0, 0, 0, 0)
      return state.runs.filter((r) => (r.kind === 'image' || r.kind === 'image_check') && r.at >= day.getTime()).reduce((n, r) => n + (r.usd ?? 0), 0)
    },
    async kitLibrary(kitId) {
      return state.kitLibrary.filter((x) => x.kitId === kitId).map(({ master, variants, ...rest }) => ({ ...rest, bytes: master.length, variants: variants.map(({ format, width, height, crop }) => ({ format, width, height, crop })) }))
    },
    async copyLibraryImage(tenantId, img) {
      const src = state.kitLibrary.find((x) => x.id === img.id)
      if (!src) throw new Error('library image missing')
      const id = crypto.randomUUID()
      state.assets.set(id, {
        id, tenantId, kind: 'image', bytes: src.master, mime: 'image/webp', width: src.width, height: src.height, alt: src.alt,
        source: 'kit-sample', sourceUrl: null, sha256: src.sha256, licenseKind: 'kit_licensed', licenseNote: 'Yakini kit library photo', redistributable: false,
        imagery: { variants: src.variants, lqip: src.lqip ?? '', focus: src.focus ?? { x: 0.5, y: 0.5 }, ...(src.dhash ? { dhash: src.dhash } : {}), license: src.license },
      })
      return id
    },
    async saveKitLibraryImage(img) { state.kitLibrary.push(clone(img)) },
    async hitRateLimit(key, max, windowSeconds) {
      const k = `${key}|${Math.floor(Date.now() / 1000 / windowSeconds)}`
      const n = (state.limits.get(k) ?? 0) + 1
      state.limits.set(k, n)
      return n <= max
    },
    async aiUsageToday() {
      return state.runs.reduce((u, r) => ({ inputTokens: u.inputTokens + r.inputTokens, outputTokens: u.outputTokens + r.outputTokens }), { inputTokens: 0, outputTokens: 0 })
    },
    async logAiRun(r) { state.runs.push({ ...r, at: Date.now() }) },
    async expireDrafts(now) {
      let n = 0
      for (const s of state.sites.values()) if (!s.deleted && !s.claimed && !isClaimed(s.tenantId) && s.expiresAt && s.expiresAt < now) { s.deleted = true; n++ }
      return n
    },

    async claimDraft(c) {
      const s = state.sites.get(c.siteId)
      if (!s || s.deleted) return 'not_found'
      if (s.tokenHash === null) return 'already_claimed'
      if (s.tokenHash !== c.tokenHash) return 'not_found'
      if (s.expiresAt && s.expiresAt.getTime() < Date.now()) return 'expired'
      if (c.doc !== null && c.baseRev !== s.rev) return 'changed'
      if (!state.members.some((m) => m.tenantId === s.tenantId && m.userId === c.userId)) state.members.push({ tenantId: s.tenantId, userId: c.userId, role: 'owner' })
      const t = state.tenants.get(s.tenantId)!
      if (t.status === 'prospect') Object.assign(t, { status: 'trial', attestedAt: new Date(), attestedIpHash: c.ipHash, timezone: c.timezone || t.timezone })
      s.tokenHash = null
      s.expiresAt = null
      s.claimed = true
      if (c.doc !== null) { s.doc = clone(c.doc); s.rev++ }
      return 'ok'
    },
    async memberRole(userId, tenantId) {
      const own = state.members.find((m) => m.tenantId === tenantId && m.userId === userId)?.role
      if (own) return own
      return state.operators.has(userId) ? 'operator' : null
    },
    async sitesForUser(userId) {
      return [...state.sites.values()].filter((s) => !s.deleted && state.members.some((m) => m.tenantId === s.tenantId && m.userId === userId))
        .map((s) => ({ siteId: s.siteId, name: state.tenants.get(s.tenantId)!.name, status: state.tenants.get(s.tenantId)!.status }))
    },
    async getEditorSite(siteId) {
      const s = state.sites.get(siteId)
      if (!s || s.deleted) return null
      const t = state.tenants.get(s.tenantId)!
      return { siteId, tenantId: s.tenantId, tenantName: t.name, tenantStatus: t.status, timezone: t.timezone, slug: s.slug, doc: clone(s.doc), rev: s.rev, takenDown: s.takenDown }
    },
    async saveDraft(sv) {
      const s = state.sites.get(sv.siteId)
      if (!s || s.deleted) throw new Error('site not found')
      if (s.rev !== sv.baseRev) return { ok: false, conflict: true, rev: s.rev, doc: clone(s.doc) }
      s.doc = clone(sv.doc)
      s.rev++
      return { ok: true, rev: s.rev }
    },
    async logEdit(e) { state.edits.push({ siteId: e.siteId, at: Date.now(), source: e.source, ops: clone(e.ops), revAfter: e.revAfter, actorKind: e.actorKind }) },
    async editsSinceLastVersion(siteId) {
      const last = state.versions.filter((v) => v.siteId === siteId).sort((a, b) => b.number - a.number)[0]
      const since = last?.createdAt.getTime() ?? 0
      return { count: state.edits.filter((e) => e.siteId === siteId && e.at > since).length, lastVersionAt: last?.createdAt ?? null }
    },
    async createVersion(v) {
      const number = Math.max(0, ...state.versions.filter((x) => x.siteId === v.siteId).map((x) => x.number)) + 1
      const id = crypto.randomUUID()
      state.versions.push({ id, siteId: v.siteId, number, kind: 'checkpoint', note: v.note, createdAt: new Date(), doc: clone(v.doc) })
      return { id, number }
    },
    async listVersions(siteId) {
      return state.versions.filter((v) => v.siteId === siteId).sort((a, b) => b.number - a.number).map(({ id, number, kind, note, createdAt }) => ({ id, number, kind, note, createdAt }))
    },
    async getVersion(siteId, versionId) {
      const v = state.versions.find((x) => x.siteId === siteId && x.id === versionId)
      return v ? { number: v.number, doc: clone(v.doc) } : null
    },
    async audit(a) { state.audit.push({ tenantId: a.tenantId, action: a.action, targetId: a.targetId, details: clone(a.details) }) },
    async tenantAssetIds(tenantId) { return [...state.assets.values()].filter((a) => a.tenantId === tenantId).map((a) => a.id) },
    async tenantPhotos(tenantId) {
      return [...state.assets.values()].filter((a) => a.tenantId === tenantId && a.kind === 'image').reverse().map((a) => ({ id: a.id, width: a.width, height: a.height, alt: a.alt, generated: a.source === 'generated' }))
    },
    async tenantAiUsage(tenantId) {
      const runs = state.runs.filter((r) => r.tenantId === tenantId)
      return { editsLastHour: runs.filter((r) => r.kind === 'edit' && r.at > Date.now() - 3600_000).length, tokensToday: runs.reduce((n, r) => n + r.inputTokens + r.outputTokens, 0) }
    },
    async saveChat(m) { const id = crypto.randomUUID(); state.chat.push({ id, siteId: m.siteId, role: m.role, content: m.content.slice(0, 2000), at: Date.now() }); return id },
    async recentChat(siteId, limit) { return state.chat.filter((c) => c.siteId === siteId).slice(-limit).map(({ role, content }) => ({ role, content })) },
    async tutorialDone(userId, siteId) { return [...state.tutorial].filter((k) => k.startsWith(`${userId}|${siteId}|`)).map((k) => k.split('|')[2]) },
    async markTutorial(userId, siteId, step) { state.tutorial.add(`${userId}|${siteId}|${step}`) },
  }
}
