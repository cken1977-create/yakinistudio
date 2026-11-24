import 'server-only'
import { createHash } from 'node:crypto'
import { kitDefinition } from '@yakini/kits'
import type { EditContext } from '@yakini/edits'
import { TEMPLATE_PLAN_MAX_PAGES, type SiteDoc } from '@yakini/site-schema'
import * as Sentry from '@sentry/nextjs'
import { currentUser, type SessionUser } from './auth'
import { openDraft } from './draft-access'
import { serverEnv } from './env'
import { ConfigError, getRuntime, type Runtime } from './runtime'
import type { Role, TenantStatus } from './store'
import { memberSite } from './site-access'

/**
 * Who is editing (spec 5.5, 14.2, 18): a signed-in member (owner, editor, operator), or, before the
 * draft is claimed, the browser holding its cookie ("Keep editing" works without signing in).
 */
export type EditorAccess = {
  siteId: string
  tenantId: string
  tenantStatus: TenantStatus
  doc: unknown
  rev: number
} & (
  | { kind: 'member'; user: SessionUser; role: Role }
  | { kind: 'anonymous' }
)

export async function editorAccess(rt: Runtime, siteId: string): Promise<EditorAccess | null> {
  const user = await currentUser()
  const m = await memberSite(rt, siteId, user)
  if (m && user) return { kind: 'member', user, role: m.role, siteId, tenantId: m.site.tenantId, tenantStatus: m.site.tenantStatus, doc: m.site.doc, rev: m.site.rev }
  const d = await openDraft(rt, siteId)
  if (d) return { kind: 'anonymous', siteId, tenantId: d.tenantId, tenantStatus: 'prospect', doc: d.doc, rev: d.rev }
  return null
}

export const actorKind = (a: EditorAccess) => (a.kind === 'member' ? a.role : 'anonymous')
export const userIdOf = (a: EditorAccess) => (a.kind === 'member' ? a.user.id : null)
export const canManageVersions = (a: EditorAccess) => a.kind === 'member' && (a.role === 'owner' || a.role === 'editor')

/** The tenant's own pictures plus its kit's sample pictures; the template plan's page limit. */
export async function editContext(rt: Runtime, a: EditorAccess, doc: SiteDoc): Promise<EditContext> {
  const own = await rt.store.tenantAssetIds(a.tenantId)
  const samples = kitDefinition(doc.kitId)?.sampleImages?.map((s) => s.assetId) ?? []
  return { allowedAssetIds: new Set([...own, ...samples]), maxPages: TEMPLATE_PLAN_MAX_PAGES }
}

export const docSha256 = (doc: unknown) => createHash('sha256').update(JSON.stringify(doc)).digest('hex')

export const CONFLICT_MESSAGE = 'This site was changed in another window. We loaded the latest version.'

/** Checkpoints (spec 5.5, 10.5): every 20 saved changes, or 10 minutes after the last version. */
export const CHECKPOINT_EVERY_EDITS = 20
export const CHECKPOINT_EVERY_MS = 10 * 60 * 1000

export async function maybeCheckpoint(rt: Runtime, a: EditorAccess, doc: unknown, now = Date.now()): Promise<number | null> {
  const { count, lastVersionAt } = await rt.store.editsSinceLastVersion(a.siteId)
  if (count === 0) return null
  const due = count >= CHECKPOINT_EVERY_EDITS || !lastVersionAt || now - lastVersionAt.getTime() >= CHECKPOINT_EVERY_MS
  if (!due) return null
  const v = await rt.store.createVersion({ siteId: a.siteId, doc, docSha256: docSha256(doc), userId: userIdOf(a), note: 'Saved automatically' })
  return v.number
}

/** Chat-edit limits per tenant (spec 8.7): 20 an hour on trial (and before claiming), 120 when active. */
export function chatLimits(status: TenantStatus): { perHour: number; tokensPerDay: number } {
  const num = (v: string | undefined, d: number) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.floor(n) : d }
  const active = status === 'active' || status === 'past_due'
  return {
    perHour: active ? num(serverEnv('AI_EDITS_PER_HOUR_ACTIVE'), 120) : num(serverEnv('AI_EDITS_PER_HOUR_TRIAL'), 20),
    tokensPerDay: num(serverEnv('AI_DAILY_TOKEN_CAP'), 200_000),
  }
}

/** JSON bodies on editor routes: same origin, JSON content type (a cross-site form can't send it), size-capped. */
export async function readJson(request: Request, maxBytes: number): Promise<unknown | null> {
  if (!(request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) return null
  const declared = Number(request.headers.get('content-length') ?? '')
  if (Number.isFinite(declared) && declared > maxBytes) return null
  if (!request.body) return null
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) { await reader.cancel().catch(() => {}); return null }
    chunks.push(value)
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { return null }
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } })

/** Run an editor API handler: plain JSON errors, nothing internal in them (14.2). */
export async function withEditor(fn: (rt: Runtime) => Promise<Response>): Promise<Response> {
  let rt: Runtime
  try { rt = getRuntime() } catch (e) {
    if (e instanceof ConfigError) return json({ error: 'The studio isn’t open yet. Please try again soon.' }, 503)
    throw e
  }
  try { return await fn(rt) } catch (e) {
    const ref = Sentry.captureException(e, { tags: { area: 'editor-api' } })
    return json({ error: 'Something went wrong on our side. Your last saved change is safe. Please try again.', ref: ref || undefined }, 500)
  }
}

export const NOT_FOUND = () => json({ error: 'Not found' }, 404)
