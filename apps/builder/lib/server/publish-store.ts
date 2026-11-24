import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { TenantStatus } from './store'

/**
 * Phase 3 storage: publishing, the review gate, takedowns, reports, share links and site forms
 * (spec 11, 14.8). Every multi-step change is one server-only SQL function
 * (migration 20261125000100) so it is atomic and audited. The memory version mirrors those
 * functions for unit tests and the CI browser run.
 */

export type ActorKind = 'owner' | 'editor' | 'operator'
export type FormKind = 'contact' | 'catering' | 'booking_request'
export type ReportReason = 'impersonation' | 'phishing' | 'copyright' | 'illegal' | 'other'
export type TakedownKind = 'operator' | 'auto_hold'
export type SiteFormDef = { formKey: string; kind: FormKind; fields: string[] }
export type RiskFlagRow = { rule: string; match: string }

export type HostState = {
  siteId: string
  tenantId: string
  state: 'live' | 'unpublished' | 'taken_down'
  versionId: string | null
  doc: unknown | null
  primaryHost: string | null
  indexable: boolean
  hasPlan: boolean
  reportLinkHidden: boolean
}

export type PublishSiteInfo = {
  siteId: string
  tenantId: string
  tenantName: string
  tenantStatus: TenantStatus
  hasPlan: boolean
  slug: string
  sourceUrl: string | null
  ownershipAttested: boolean
  firstLiveAt: Date | null
  publishedVersionId: string | null
  publishedNumber: number | null
  reviewStatus: 'not_required' | 'pending' | 'approved' | 'rejected'
  takedown: { at: Date; kind: TakedownKind; reason: string | null } | null
  primaryHost: string | null
  primaryHostStatus: string | null
  openReports: number
}

export type ReviewRow = {
  id: string; siteId: string; tenantId: string; versionId: string; versionNumber: number
  trigger: 'override' | 'risk_check'; flags: RiskFlagRow[]; status: 'pending' | 'approved' | 'rejected'
  createdAt: Date; decidedAt: Date | null; note: string | null
  slug: string; tenantName: string; sourceUrl: string | null
}

export type ReportRow = {
  id: string; siteId: string; tenantId: string; host: string; reason: ReportReason; details: string | null
  reporterEmail: string | null; reporterSaysOwner: boolean; status: 'open' | 'dismissed' | 'actioned'; createdAt: Date
  slug: string; tenantName: string; tenantStatus: TenantStatus; sourceUrl: string | null
  ownershipAttested: boolean; takedownKind: TakedownKind | null
}

export type ShareLinkRow = { id: string; versionId: string | null; expiresAt: Date; revokedAt: Date | null; lastUsedAt: Date | null; createdAt: Date }
export type SubmissionRow = { id: string; formKey: string; kind: FormKind; payload: Record<string, string>; status: string; createdAt: Date }
export type OperatorRow = { canOverridePublish: boolean; canTakedown: boolean }
export type StoredVersion = { id: string; siteId: string; number: number; kind: string; doc: unknown }

/** Errors a Phase 3 function can refuse with. Callers turn each into a plain message. */
export type PublishErrorCode = 'taken_down' | 'not_found' | 'version_not_found' | 'address_taken' | 'too_many_share_links'
export class PublishError extends Error {
  constructor(public readonly code: PublishErrorCode) { super(code); this.name = 'PublishError' }
}

export interface PublishStore {
  siteForHost(hostname: string): Promise<HostState | null>
  publishInfo(siteId: string): Promise<PublishSiteInfo | null>
  /** True when another site already uses this slug or its address. */
  slugTaken(slug: string, hostname: string, exceptSiteId: string): Promise<boolean>
  /** Every address a site has ever had (cache tags are revalidated for all of them). */
  siteHostnames(siteId: string): Promise<string[]>
  activeDomainCount(): Promise<number>
  operator(userId: string): Promise<OperatorRow | null>

  publish(p: { siteId: string; doc: unknown; sha: string; userId: string | null; slug: string; hostname: string; domainStatus: 'active' | 'pending'; forms: SiteFormDef[]; actorKind: 'owner' | 'operator'; overrideReason: string | null }): Promise<{ versionId: string; number: number }>
  requestReview(r: { siteId: string; doc: unknown; sha: string; userId: string | null; trigger: 'override' | 'risk_check'; flags: RiskFlagRow[] }): Promise<{ reviewId: string; versionId: string; number: number }>
  decideReview(d: { reviewId: string; operatorId: string; approve: boolean; note: string | null }): Promise<boolean>
  getReview(reviewId: string): Promise<(ReviewRow & { doc: unknown; docSha: string }) | null>
  listReviews(status: 'pending' | 'all'): Promise<ReviewRow[]>
  rollback(r: { siteId: string; versionId: string; userId: string | null; actorKind: ActorKind }): Promise<number>
  unpublish(u: { siteId: string; userId: string | null; actorKind: ActorKind }): Promise<boolean>
  publishedVersions(siteId: string): Promise<{ id: string; number: number; createdAt: Date }[]>

  takedown(t: { siteId: string; kind: TakedownKind; reason: ReportReason; note: string | null; userId: string | null }): Promise<boolean>
  liftTakedown(l: { siteId: string; userId: string; note: string | null }): Promise<boolean>
  fileReport(r: { siteId: string; host: string; reason: ReportReason; details: string; email: string | null; saysOwner: boolean; ipHash: string; threshold: number; windowHours: number }): Promise<{ reportId: string; held: boolean }>
  decideReport(d: { reportId: string; operatorId: string; status: 'dismissed' | 'actioned'; note: string | null }): Promise<boolean>
  listReports(status: 'open' | 'all'): Promise<ReportRow[]>
  openReportCount(siteId: string): Promise<number>

  createShareLink(s: { siteId: string; versionId: string | null; tokenHash: string; userId: string; days: number; maxActive: number }): Promise<string>
  revokeShareLink(r: { siteId: string; linkId: string; userId: string; actorKind: ActorKind }): Promise<boolean>
  useShareLink(tokenHash: string): Promise<{ siteId: string; tenantId: string; versionId: string | null; expiresAt: Date } | null>
  listShareLinks(siteId: string): Promise<ShareLinkRow[]>

  siteForm(siteId: string, formKey: string): Promise<{ formId: string; tenantId: string; kind: FormKind; fields: string[]; notifyEmails: string[] } | null>
  saveSubmission(s: { siteId: string; tenantId: string; formId: string; payload: Record<string, string>; ipHash: string; uaHash: string | null; spamScore: number; status: 'received' | 'spam' }): Promise<string>
  listSubmissions(siteId: string, limit: number): Promise<SubmissionRow[]>
  ownerEmails(tenantId: string): Promise<string[]>

  /** Read-only page through every stored version for Check stored sites (7.4). */
  versionsPage(afterId: string | null, limit: number): Promise<StoredVersion[]>
  auditOps(a: { tenantId: string | null; userId: string; action: 'schema.check'; targetId: string; details: Record<string, unknown> }): Promise<void>
}

const ERR_CODES: Record<string, PublishErrorCode> = {
  site_taken_down: 'taken_down', site_not_found: 'not_found', version_not_found: 'version_not_found',
  address_taken: 'address_taken', too_many_share_links: 'too_many_share_links',
}

// ------------------------------------------------------------------------------------------ Supabase

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- schema types are not generated for the builder schema yet
export function createSupabasePublishStore(db: SupabaseClient<any, any, any>): PublishStore {
  const fail = (what: string, error: { message?: string } | null): never => {
    const known = Object.keys(ERR_CODES).find((k) => error?.message?.includes(k))
    if (known) throw new PublishError(ERR_CODES[known])
    if (error?.message?.includes('domains_hostname_key') || error?.message?.includes('sites_slug_key')) throw new PublishError('address_taken')
    // Only the operation name goes to logs/Sentry: never row contents (14.2).
    throw new Error(`Database ${what} failed${error?.message ? `: ${error.message.slice(0, 120)}` : ''}`)
  }
  const first = <T>(data: unknown): T => (Array.isArray(data) ? data[0] : data) as T
  const reviewRow = (r: Record<string, any>): ReviewRow => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    id: r.id, siteId: r.site_id, tenantId: r.tenant_id, versionId: r.version_id, versionNumber: r.site_versions?.number ?? 0,
    trigger: r.trigger, flags: Array.isArray(r.risk_flags) ? r.risk_flags : [], status: r.status,
    createdAt: new Date(r.created_at), decidedAt: r.decided_at ? new Date(r.decided_at) : null, note: r.decision_note,
    slug: r.sites?.slug ?? '', tenantName: r.sites?.tenants?.name ?? '', sourceUrl: r.sites?.source_url ?? null,
  })
  return {
    async siteForHost(hostname) {
      const { data, error } = await db.rpc('site_for_host', { p_hostname: hostname })
      if (error) fail('host lookup', error)
      const r = first<Record<string, unknown> | undefined>(data)
      if (!r) return null
      return {
        siteId: r.site_id as string, tenantId: r.tenant_id as string, state: r.state as HostState['state'],
        versionId: (r.version_id as string) ?? null, doc: r.doc ?? null, primaryHost: (r.primary_host as string) ?? null,
        indexable: Boolean(r.indexable), hasPlan: Boolean(r.has_plan), reportLinkHidden: Boolean(r.report_link_hidden),
      }
    },
    async publishInfo(siteId) {
      const { data, error } = await db.from('sites')
        .select('id, tenant_id, slug, source_url, published_version_id, review_status, takedown_at, takedown_kind, takedown_reason, deleted_at, tenants!inner(name, status, ownership_attested_at, first_live_at, deleted_at), site_versions!sites_published_version_fk(number), domains(hostname, is_primary, status, deleted_at)')
        .eq('id', siteId).maybeSingle()
      if (error) fail('publish info', error)
      const r = data as unknown as Record<string, any> | null // eslint-disable-line @typescript-eslint/no-explicit-any
      if (!r || r.deleted_at || r.tenants.deleted_at) return null
      const plan = await db.rpc('tenant_has_plan', { p_tenant: r.tenant_id })
      if (plan.error) fail('plan read', plan.error)
      const reports = await db.from('abuse_reports').select('id', { count: 'exact', head: true }).eq('site_id', siteId).eq('status', 'open')
      if (reports.error) fail('reports count', reports.error)
      const primary = (r.domains as { hostname: string; is_primary: boolean; status: string; deleted_at: string | null }[]).find((d) => d.is_primary && !d.deleted_at)
      return {
        siteId: r.id, tenantId: r.tenant_id, tenantName: r.tenants.name, tenantStatus: r.tenants.status, hasPlan: plan.data === true,
        slug: r.slug, sourceUrl: r.source_url, ownershipAttested: Boolean(r.tenants.ownership_attested_at),
        firstLiveAt: r.tenants.first_live_at ? new Date(r.tenants.first_live_at) : null,
        publishedVersionId: r.published_version_id, publishedNumber: r.site_versions?.number ?? null, reviewStatus: r.review_status,
        takedown: r.takedown_at ? { at: new Date(r.takedown_at), kind: r.takedown_kind, reason: r.takedown_reason } : null,
        primaryHost: primary?.hostname ?? null, primaryHostStatus: primary?.status ?? null, openReports: reports.count ?? 0,
      }
    },
    async slugTaken(slug, hostname, exceptSiteId) {
      const s = await db.from('sites').select('id').eq('slug', slug).neq('id', exceptSiteId).limit(1)
      if (s.error) fail('slug check', s.error)
      if (s.data?.length) return true
      const d = await db.from('domains').select('id').eq('hostname', hostname).neq('site_id', exceptSiteId).is('deleted_at', null).limit(1)
      if (d.error) fail('address check', d.error)
      return Boolean(d.data?.length)
    },
    async siteHostnames(siteId) {
      const { data, error } = await db.from('domains').select('hostname').eq('site_id', siteId).limit(50)
      if (error) fail('hosts read', error)
      return (data ?? []).map((d) => d.hostname as string)
    },
    async activeDomainCount() {
      const { count, error } = await db.from('domains').select('id', { count: 'exact', head: true }).is('deleted_at', null)
      if (error) fail('domain count', error)
      return count ?? 0
    },
    async operator(userId) {
      const { data, error } = await db.from('operators').select('can_override_publish, can_takedown').eq('user_id', userId).maybeSingle()
      if (error) fail('operator read', error)
      return data ? { canOverridePublish: data.can_override_publish, canTakedown: data.can_takedown } : null
    },

    async publish(p) {
      const { data, error } = await db.rpc('publish_site', {
        p_site: p.siteId, p_doc: p.doc, p_sha: p.sha, p_user: p.userId, p_slug: p.slug, p_hostname: p.hostname,
        p_domain_status: p.domainStatus, p_forms: p.forms, p_actor_kind: p.actorKind, p_override_reason: p.overrideReason,
      })
      if (error) fail('publish', error)
      const r = first<{ version_id: string; version_number: number }>(data)
      return { versionId: r.version_id, number: r.version_number }
    },
    async requestReview(r) {
      const { data, error } = await db.rpc('request_review', { p_site: r.siteId, p_doc: r.doc, p_sha: r.sha, p_user: r.userId, p_trigger: r.trigger, p_flags: r.flags })
      if (error) fail('review request', error)
      const row = first<{ review_id: string; version_id: string; version_number: number }>(data)
      return { reviewId: row.review_id, versionId: row.version_id, number: row.version_number }
    },
    async decideReview(d) {
      const { data, error } = await db.rpc('decide_review', { p_review: d.reviewId, p_operator: d.operatorId, p_approve: d.approve, p_note: d.note })
      if (error) fail('review decision', error)
      return data === true
    },
    async getReview(reviewId) {
      const { data, error } = await db.from('publish_reviews')
        .select('*, site_versions(number, doc, doc_sha256), sites(slug, source_url, tenants(name))').eq('id', reviewId).maybeSingle()
      if (error) fail('review read', error)
      if (!data) return null
      return { ...reviewRow(data), doc: data.site_versions?.doc, docSha: data.site_versions?.doc_sha256 }
    },
    async listReviews(status) {
      let q = db.from('publish_reviews').select('*, site_versions(number), sites(slug, source_url, tenants(name))').order('created_at', { ascending: false }).limit(100)
      if (status === 'pending') q = q.eq('status', 'pending')
      const { data, error } = await q
      if (error) fail('reviews read', error)
      return (data ?? []).map(reviewRow)
    },
    async rollback(r) {
      const { data, error } = await db.rpc('rollback_site', { p_site: r.siteId, p_version: r.versionId, p_user: r.userId, p_actor_kind: r.actorKind === 'editor' ? 'owner' : r.actorKind })
      if (error) fail('rollback', error)
      return Number(data)
    },
    async unpublish(u) {
      const { data, error } = await db.rpc('unpublish_site', { p_site: u.siteId, p_user: u.userId, p_actor_kind: u.actorKind === 'editor' ? 'owner' : u.actorKind })
      if (error) fail('unpublish', error)
      return data === true
    },
    async publishedVersions(siteId) {
      const { data, error } = await db.from('site_versions').select('id, number, created_at').eq('site_id', siteId).eq('kind', 'published').order('number', { ascending: false }).limit(100)
      if (error) fail('published versions', error)
      return (data ?? []).map((v) => ({ id: v.id, number: v.number, createdAt: new Date(v.created_at) }))
    },

    async takedown(t) {
      const { data, error } = await db.rpc('takedown_site', { p_site: t.siteId, p_kind: t.kind, p_reason: t.reason, p_note: t.note, p_user: t.userId })
      if (error) fail('takedown', error)
      return data === true
    },
    async liftTakedown(l) {
      const { data, error } = await db.rpc('lift_takedown', { p_site: l.siteId, p_user: l.userId, p_note: l.note })
      if (error) fail('takedown lift', error)
      return data === true
    },
    async fileReport(r) {
      const { data, error } = await db.rpc('file_abuse_report', {
        p_site: r.siteId, p_host: r.host, p_reason: r.reason, p_details: r.details, p_email: r.email, p_says_owner: r.saysOwner,
        p_ip_hash: r.ipHash, p_threshold: r.threshold, p_window_hours: r.windowHours,
      })
      if (error) fail('report', error)
      const row = first<{ report_id: string; held: boolean }>(data)
      return { reportId: row.report_id, held: row.held }
    },
    async decideReport(d) {
      const { data, error } = await db.rpc('decide_report', { p_report: d.reportId, p_operator: d.operatorId, p_status: d.status, p_note: d.note })
      if (error) fail('report decision', error)
      return data === true
    },
    async listReports(status) {
      let q = db.from('abuse_reports').select('*, sites(slug, source_url, takedown_kind, tenants(name, status, ownership_attested_at))').order('created_at', { ascending: false }).limit(200)
      if (status === 'open') q = q.eq('status', 'open')
      const { data, error } = await q
      if (error) fail('reports read', error)
      return (data ?? []).map((r) => ({
        id: r.id, siteId: r.site_id, tenantId: r.tenant_id, host: r.host, reason: r.reason, details: r.details,
        reporterEmail: r.reporter_email, reporterSaysOwner: r.reporter_says_owner, status: r.status, createdAt: new Date(r.created_at),
        slug: r.sites?.slug ?? '', tenantName: r.sites?.tenants?.name ?? '', tenantStatus: r.sites?.tenants?.status ?? 'prospect',
        sourceUrl: r.sites?.source_url ?? null, ownershipAttested: Boolean(r.sites?.tenants?.ownership_attested_at), takedownKind: r.sites?.takedown_kind ?? null,
      }))
    },
    async openReportCount(siteId) {
      const { count, error } = await db.from('abuse_reports').select('id', { count: 'exact', head: true }).eq('site_id', siteId).eq('status', 'open')
      if (error) fail('reports count', error)
      return count ?? 0
    },

    async createShareLink(s) {
      const { data, error } = await db.rpc('create_share_link', { p_site: s.siteId, p_version: s.versionId, p_token_hash: s.tokenHash, p_user: s.userId, p_days: s.days, p_max_active: s.maxActive })
      if (error) fail('share link', error)
      return data as string
    },
    async revokeShareLink(r) {
      const { data, error } = await db.rpc('revoke_share_link', { p_site: r.siteId, p_link: r.linkId, p_user: r.userId, p_actor_kind: r.actorKind === 'editor' ? 'owner' : r.actorKind })
      if (error) fail('share revoke', error)
      return data === true
    },
    async useShareLink(tokenHash) {
      const { data, error } = await db.rpc('use_share_link', { p_token_hash: tokenHash })
      if (error) fail('share link read', error)
      const r = first<Record<string, string> | undefined>(data)
      return r ? { siteId: r.site_id, tenantId: r.tenant_id, versionId: r.version_id ?? null, expiresAt: new Date(r.expires_at) } : null
    },
    async listShareLinks(siteId) {
      const { data, error } = await db.from('share_links').select('id, version_id, expires_at, revoked_at, last_used_at, created_at').eq('site_id', siteId).order('created_at', { ascending: false }).limit(50)
      if (error) fail('share links read', error)
      return (data ?? []).map((l) => ({
        id: l.id, versionId: l.version_id, expiresAt: new Date(l.expires_at), revokedAt: l.revoked_at ? new Date(l.revoked_at) : null,
        lastUsedAt: l.last_used_at ? new Date(l.last_used_at) : null, createdAt: new Date(l.created_at),
      }))
    },

    async siteForm(siteId, formKey) {
      const { data, error } = await db.from('forms').select('id, tenant_id, kind, fields, notify_emails').eq('site_id', siteId).eq('form_key', formKey).maybeSingle()
      if (error) fail('form read', error)
      return data ? { formId: data.id, tenantId: data.tenant_id, kind: data.kind, fields: Array.isArray(data.fields) ? data.fields : [], notifyEmails: data.notify_emails ?? [] } : null
    },
    async saveSubmission(s) {
      const { data, error } = await db.from('form_submissions').insert({
        tenant_id: s.tenantId, site_id: s.siteId, form_id: s.formId, payload: s.payload, visitor_ip_hash: s.ipHash,
        user_agent_hash: s.uaHash, spam_score: s.spamScore, status: s.status,
      }).select('id').single()
      if (error) fail('submission insert', error)
      return data!.id as string
    },
    async listSubmissions(siteId, limit) {
      const { data, error } = await db.from('form_submissions').select('id, payload, status, created_at, forms(form_key, kind)')
        .eq('site_id', siteId).neq('status', 'spam').order('created_at', { ascending: false }).limit(limit)
      if (error) fail('submissions read', error)
      return (data ?? []).map((r) => {
        const f = (r as unknown as { forms: { form_key: string; kind: FormKind } }).forms
        return { id: r.id, formKey: f?.form_key ?? '', kind: f?.kind ?? 'contact', payload: r.payload, status: r.status, createdAt: new Date(r.created_at) }
      })
    },
    async ownerEmails(tenantId) {
      const { data, error } = await db.from('memberships').select('user_id').eq('tenant_id', tenantId).eq('role', 'owner').is('deleted_at', null).limit(5)
      if (error) fail('owners read', error)
      const out: string[] = []
      for (const m of data ?? []) {
        const u = await db.auth.admin.getUserById(m.user_id as string)
        if (u.data.user?.email) out.push(u.data.user.email)
      }
      return out
    },

    async versionsPage(afterId, limit) {
      let q = db.from('site_versions').select('id, site_id, number, kind, doc').order('id', { ascending: true }).limit(limit)
      if (afterId) q = q.gt('id', afterId)
      const { data, error } = await q
      if (error) fail('versions page', error)
      return (data ?? []).map((v) => ({ id: v.id, siteId: v.site_id, number: v.number, kind: v.kind, doc: v.doc }))
    },
    async auditOps(a) {
      const { error } = await db.from('audit_log').insert({ tenant_id: a.tenantId, actor_user_id: a.userId, actor_kind: 'operator', action: a.action, target_id: a.targetId, details: a.details })
      if (error) fail('audit insert', error)
    },
  }
}

// ------------------------------------------------------------------------------------------ memory

/** What the memory publish store adds to the Phase 1-2 memory state. */
export type MemPublishState = {
  site: Map<string, { publishedVersionId: string | null; reviewStatus: PublishSiteInfo['reviewStatus']; takedown: { at: Date; kind: TakedownKind; reason: string } | null; indexable: boolean; reportLinkHidden: boolean; sourceUrl: string | null }>
  tenantPlan: Map<string, boolean>
  firstLive: Map<string, Date>
  domains: { id: string; siteId: string; tenantId: string; hostname: string; status: 'active' | 'pending' | 'removed'; isPrimary: boolean; deleted: boolean }[]
  forms: { id: string; siteId: string; tenantId: string; formKey: string; kind: FormKind; fields: string[] }[]
  submissions: { id: string; siteId: string; formId: string; payload: Record<string, string>; status: string; ipHash: string; createdAt: Date }[]
  reviews: { id: string; siteId: string; tenantId: string; versionId: string; trigger: 'override' | 'risk_check'; flags: RiskFlagRow[]; status: 'pending' | 'approved' | 'rejected'; createdAt: Date; decidedAt: Date | null; note: string | null }[]
  reports: { id: string; siteId: string; tenantId: string; host: string; reason: ReportReason; details: string | null; email: string | null; saysOwner: boolean; ipHash: string; status: 'open' | 'dismissed' | 'actioned'; createdAt: Date }[]
  shares: { id: string; siteId: string; tenantId: string; versionId: string | null; tokenHash: string; expiresAt: Date; revokedAt: Date | null; lastUsedAt: Date | null; createdAt: Date }[]
  operators: Map<string, OperatorRow>
  emails: Map<string, string>
  audit: { tenantId: string | null; action: string; targetId: string; details: Record<string, unknown> }[]
}

/** The Phase 1-2 memory state this store reads and updates (see store.ts). */
export type MemBase = {
  tenants: Map<string, { id: string; name: string; status: TenantStatus; attestedAt: Date | null }>
  sites: Map<string, { siteId: string; tenantId: string; slug: string; deleted: boolean; takenDown: boolean; sourceUrl?: string | null }>
  members: { tenantId: string; userId: string; role: 'owner' | 'editor' }[]
  operators: Set<string>
  versions: { id: string; siteId: string; number: number; kind: 'checkpoint' | 'published' | 'review'; note: string | null; createdAt: Date; doc: unknown }[]
}

const testEmails = globalThis as typeof globalThis & { __yakiniTestEmails?: Map<string, string> }
/** Test sign-in records each user's email here so form alerts can find the owner (memory only). */
export function rememberTestEmail(userId: string, email: string): void {
  (testEmails.__yakiniTestEmails ??= new Map()).set(userId, email)
}

export function createMemoryPublishStore(base: MemBase): PublishStore & { _p3: MemPublishState } {
  const st: MemPublishState = {
    site: new Map(), tenantPlan: new Map(), firstLive: new Map(), domains: [], forms: [], submissions: [], reviews: [], reports: [],
    shares: [], operators: new Map(), emails: (testEmails.__yakiniTestEmails ??= new Map()), audit: [],
  }
  const clone = <T>(v: T): T => structuredClone(v)
  const meta = (siteId: string) => {
    let m = st.site.get(siteId)
    if (!m) { m = { publishedVersionId: null, reviewStatus: 'not_required', takedown: null, indexable: false, reportLinkHidden: false, sourceUrl: base.sites.get(siteId)?.sourceUrl ?? null }; st.site.set(siteId, m) }
    return m
  }
  const live = (siteId: string) => { const s = base.sites.get(siteId); if (!s || s.deleted) throw new PublishError('not_found'); return s }
  const hasPlan = (tenantId: string) => st.tenantPlan.get(tenantId) ?? ['active', 'past_due'].includes(base.tenants.get(tenantId)?.status ?? '')
  const nextNumber = (siteId: string) => Math.max(0, ...base.versions.filter((v) => v.siteId === siteId).map((v) => v.number)) + 1
  const audit = (tenantId: string | null, action: string, targetId: string, details: Record<string, unknown> = {}) => st.audit.push({ tenantId, action, targetId, details })
  const takedownNow = (siteId: string, kind: TakedownKind, reason: string, note: string | null) => {
    const s = live(siteId), m = meta(siteId)
    if (m.takedown) return false
    m.takedown = { at: new Date(), kind, reason }
    s.takenDown = true
    for (const l of st.shares) if (l.siteId === siteId && !l.revokedAt) l.revokedAt = new Date()
    audit(s.tenantId, kind === 'operator' ? 'takedown' : 'takedown.auto_hold', siteId, { reason, note })
    return true
  }
  const reviewRow = (r: MemPublishState['reviews'][number]): ReviewRow => {
    const s = base.sites.get(r.siteId)!
    return {
      id: r.id, siteId: r.siteId, tenantId: r.tenantId, versionId: r.versionId, versionNumber: base.versions.find((v) => v.id === r.versionId)?.number ?? 0,
      trigger: r.trigger, flags: clone(r.flags), status: r.status, createdAt: r.createdAt, decidedAt: r.decidedAt, note: r.note,
      slug: s.slug, tenantName: base.tenants.get(r.tenantId)?.name ?? '', sourceUrl: meta(r.siteId).sourceUrl,
    }
  }

  return {
    _p3: st,
    async siteForHost(hostname) {
      const d = st.domains.find((x) => x.hostname === hostname.toLowerCase() && x.status === 'active' && !x.deleted)
      if (!d) return null
      const s = base.sites.get(d.siteId)
      if (!s || s.deleted) return null
      const m = meta(d.siteId)
      const state = m.takedown ? 'taken_down' : m.publishedVersionId ? 'live' : 'unpublished'
      const v = state === 'live' ? base.versions.find((x) => x.id === m.publishedVersionId) : undefined
      return {
        siteId: s.siteId, tenantId: s.tenantId, state, versionId: v?.id ?? null, doc: v ? clone(v.doc) : null,
        primaryHost: st.domains.find((x) => x.siteId === s.siteId && x.isPrimary && x.status === 'active' && !x.deleted)?.hostname ?? null,
        indexable: m.indexable, hasPlan: hasPlan(s.tenantId), reportLinkHidden: m.reportLinkHidden,
      }
    },
    async publishInfo(siteId) {
      const s = base.sites.get(siteId)
      if (!s || s.deleted) return null
      const t = base.tenants.get(s.tenantId)!, m = meta(siteId)
      const primary = st.domains.find((x) => x.siteId === siteId && x.isPrimary && !x.deleted)
      return {
        siteId, tenantId: s.tenantId, tenantName: t.name, tenantStatus: t.status, hasPlan: hasPlan(s.tenantId), slug: s.slug, sourceUrl: m.sourceUrl,
        ownershipAttested: Boolean(t.attestedAt), firstLiveAt: st.firstLive.get(s.tenantId) ?? null, publishedVersionId: m.publishedVersionId,
        publishedNumber: base.versions.find((v) => v.id === m.publishedVersionId)?.number ?? null, reviewStatus: m.reviewStatus,
        takedown: m.takedown ? { ...m.takedown } : null, primaryHost: primary?.hostname ?? null, primaryHostStatus: primary?.status ?? null,
        openReports: st.reports.filter((r) => r.siteId === siteId && r.status === 'open').length,
      }
    },
    async slugTaken(slug, hostname, exceptSiteId) {
      return [...base.sites.values()].some((s) => s.slug === slug && s.siteId !== exceptSiteId)
        || st.domains.some((d) => d.hostname === hostname && d.siteId !== exceptSiteId && !d.deleted)
    },
    async siteHostnames(siteId) { return st.domains.filter((d) => d.siteId === siteId).map((d) => d.hostname) },
    async activeDomainCount() { return st.domains.filter((d) => !d.deleted).length },
    async operator(userId) { return st.operators.get(userId) ?? (base.operators.has(userId) ? { canOverridePublish: false, canTakedown: false } : null) },

    async publish(p) {
      const s = live(p.siteId), m = meta(p.siteId)
      if (m.takedown) throw new PublishError('taken_down')
      if ([...base.sites.values()].some((x) => x.slug === p.slug && x.siteId !== p.siteId)) throw new PublishError('address_taken')
      st.domains = st.domains.filter((d) => !(d.hostname === p.hostname && d.siteId !== p.siteId && d.deleted))
      if (st.domains.some((d) => d.hostname === p.hostname && d.siteId !== p.siteId)) throw new PublishError('address_taken')
      const number = nextNumber(p.siteId), versionId = crypto.randomUUID()
      base.versions.push({ id: versionId, siteId: p.siteId, number, kind: 'published', note: 'Published', createdAt: new Date(), doc: clone(p.doc) })
      s.slug = p.slug
      for (const d of st.domains) if (d.siteId === p.siteId && d.hostname !== p.hostname && !d.deleted) Object.assign(d, { status: 'removed', isPrimary: false, deleted: true })
      const existing = st.domains.find((d) => d.hostname === p.hostname)
      const otherPrimary = st.domains.some((d) => d.siteId === p.siteId && d !== existing && d.isPrimary && !d.deleted)
      if (existing) Object.assign(existing, { status: existing.status === 'active' ? 'active' : p.domainStatus, deleted: false, isPrimary: !otherPrimary })
      else st.domains.push({ id: crypto.randomUUID(), siteId: p.siteId, tenantId: s.tenantId, hostname: p.hostname, status: p.domainStatus, isPrimary: !otherPrimary, deleted: false })
      for (const f of p.forms) {
        const row = st.forms.find((x) => x.siteId === p.siteId && x.formKey === f.formKey)
        if (row) Object.assign(row, { kind: f.kind, fields: [...f.fields] })
        else st.forms.push({ id: crypto.randomUUID(), siteId: p.siteId, tenantId: s.tenantId, formKey: f.formKey, kind: f.kind, fields: [...f.fields] })
      }
      m.publishedVersionId = versionId
      if (!st.firstLive.has(s.tenantId)) st.firstLive.set(s.tenantId, new Date())
      audit(s.tenantId, 'publish', p.siteId, { version: number, host: p.hostname })
      if (p.overrideReason) audit(s.tenantId, 'override.publish', p.siteId, { version: number, reason: p.overrideReason })
      return { versionId, number }
    },
    async requestReview(r) {
      const s = live(r.siteId), m = meta(r.siteId)
      if (m.takedown) throw new PublishError('taken_down')
      const number = nextNumber(r.siteId), versionId = crypto.randomUUID(), reviewId = crypto.randomUUID()
      base.versions.push({ id: versionId, siteId: r.siteId, number, kind: 'review', note: 'Waiting for a quick look', createdAt: new Date(), doc: clone(r.doc) })
      for (const x of st.reviews) if (x.siteId === r.siteId && x.status === 'pending') Object.assign(x, { status: 'rejected', decidedAt: new Date(), note: 'Replaced by a newer version' })
      st.reviews.push({ id: reviewId, siteId: r.siteId, tenantId: s.tenantId, versionId, trigger: r.trigger, flags: clone(r.flags), status: 'pending', createdAt: new Date(), decidedAt: null, note: null })
      m.reviewStatus = 'pending'
      return { reviewId, versionId, number }
    },
    async decideReview(d) {
      const r = st.reviews.find((x) => x.id === d.reviewId)
      if (!r || r.status !== 'pending') return false
      Object.assign(r, { status: d.approve ? 'approved' : 'rejected', decidedAt: new Date(), note: d.note })
      meta(r.siteId).reviewStatus = d.approve ? 'approved' : 'rejected'
      audit(r.tenantId, d.approve ? 'review.approve' : 'review.reject', r.siteId, { review: r.id })
      return true
    },
    async getReview(reviewId) {
      const r = st.reviews.find((x) => x.id === reviewId)
      if (!r) return null
      const v = base.versions.find((x) => x.id === r.versionId)!
      return { ...reviewRow(r), doc: clone(v.doc), docSha: '' }
    },
    async listReviews(status) {
      return st.reviews.filter((r) => status === 'all' || r.status === 'pending').slice().reverse().map(reviewRow)
    },
    async rollback(r) {
      const s = live(r.siteId), m = meta(r.siteId)
      if (m.takedown) throw new PublishError('taken_down')
      const v = base.versions.find((x) => x.id === r.versionId && x.siteId === r.siteId && x.kind === 'published')
      if (!v) throw new PublishError('version_not_found')
      m.publishedVersionId = v.id
      audit(s.tenantId, 'rollback', r.siteId, { version: v.number })
      return v.number
    },
    async unpublish(u) {
      const s = live(u.siteId), m = meta(u.siteId)
      if (!m.publishedVersionId) return false
      m.publishedVersionId = null
      audit(s.tenantId, 'unpublish', u.siteId)
      return true
    },
    async publishedVersions(siteId) {
      return base.versions.filter((v) => v.siteId === siteId && v.kind === 'published').sort((a, b) => b.number - a.number).map((v) => ({ id: v.id, number: v.number, createdAt: v.createdAt }))
    },

    async takedown(t) { return takedownNow(t.siteId, t.kind, t.reason, t.note) },
    async liftTakedown(l) {
      const s = live(l.siteId), m = meta(l.siteId)
      if (!m.takedown) return false
      audit(s.tenantId, 'takedown.lift', l.siteId, { was: m.takedown.kind, note: l.note })
      m.takedown = null
      s.takenDown = false
      return true
    },
    async fileReport(r) {
      const s = live(r.siteId), m = meta(r.siteId)
      const reportId = crypto.randomUUID()
      st.reports.push({ id: reportId, siteId: r.siteId, tenantId: s.tenantId, host: r.host.toLowerCase().slice(0, 253), reason: r.reason, details: r.details, email: r.email, saysOwner: r.saysOwner, ipHash: r.ipHash, status: 'open', createdAt: new Date() })
      audit(s.tenantId, 'report.create', r.siteId, { report: reportId, reason: r.reason })
      let held = false
      if (!m.takedown && !hasPlan(s.tenantId)) {
        const since = Date.now() - r.windowHours * 3600_000
        const ips = new Set(st.reports.filter((x) => x.siteId === r.siteId && x.status === 'open' && x.createdAt.getTime() > since).map((x) => x.ipHash))
        if (r.reason === 'phishing' || ips.size >= r.threshold) held = takedownNow(r.siteId, 'auto_hold', r.reason, 'Automatic hold after reports')
      }
      return { reportId, held }
    },
    async decideReport(d) {
      const r = st.reports.find((x) => x.id === d.reportId)
      if (!r || r.status !== 'open') return false
      r.status = d.status
      audit(r.tenantId, d.status === 'dismissed' ? 'report.dismiss' : 'report.actioned', r.siteId, { report: r.id })
      return true
    },
    async listReports(status) {
      return st.reports.filter((r) => status === 'all' || r.status === 'open').slice().reverse().map((r) => {
        const s = base.sites.get(r.siteId)!, t = base.tenants.get(r.tenantId)!
        return {
          id: r.id, siteId: r.siteId, tenantId: r.tenantId, host: r.host, reason: r.reason, details: r.details, reporterEmail: r.email,
          reporterSaysOwner: r.saysOwner, status: r.status, createdAt: r.createdAt, slug: s.slug, tenantName: t.name, tenantStatus: t.status,
          sourceUrl: meta(r.siteId).sourceUrl, ownershipAttested: Boolean(t.attestedAt), takedownKind: meta(r.siteId).takedown?.kind ?? null,
        }
      })
    },
    async openReportCount(siteId) { return st.reports.filter((r) => r.siteId === siteId && r.status === 'open').length },

    async createShareLink(s) {
      const site = live(s.siteId)
      if (meta(s.siteId).takedown) throw new PublishError('taken_down')
      if (s.days < 1 || s.days > 30) throw new Error('share links last 1 to 30 days')
      if (s.versionId && !base.versions.some((v) => v.id === s.versionId && v.siteId === s.siteId)) throw new PublishError('version_not_found')
      if (st.shares.filter((l) => l.siteId === s.siteId && !l.revokedAt && l.expiresAt.getTime() > Date.now()).length >= s.maxActive) throw new PublishError('too_many_share_links')
      const id = crypto.randomUUID()
      st.shares.push({ id, siteId: s.siteId, tenantId: site.tenantId, versionId: s.versionId, tokenHash: s.tokenHash, expiresAt: new Date(Date.now() + s.days * 86_400_000), revokedAt: null, lastUsedAt: null, createdAt: new Date() })
      audit(site.tenantId, 'share.create', s.siteId, { link: id, days: s.days })
      return id
    },
    async revokeShareLink(r) {
      const l = st.shares.find((x) => x.id === r.linkId && x.siteId === r.siteId)
      if (!l || l.revokedAt) return false
      l.revokedAt = new Date()
      audit(l.tenantId, 'share.revoke', r.siteId, { link: l.id })
      return true
    },
    async useShareLink(tokenHash) {
      const l = st.shares.find((x) => x.tokenHash === tokenHash && !x.revokedAt && x.expiresAt.getTime() > Date.now())
      if (!l) return null
      const s = base.sites.get(l.siteId)
      if (!s || s.deleted || meta(l.siteId).takedown) return null
      l.lastUsedAt = new Date()
      return { siteId: l.siteId, tenantId: l.tenantId, versionId: l.versionId, expiresAt: l.expiresAt }
    },
    async listShareLinks(siteId) {
      return st.shares.filter((l) => l.siteId === siteId).slice().reverse().map(({ id, versionId, expiresAt, revokedAt, lastUsedAt, createdAt }) => ({ id, versionId, expiresAt, revokedAt, lastUsedAt, createdAt }))
    },

    async siteForm(siteId, formKey) {
      const f = st.forms.find((x) => x.siteId === siteId && x.formKey === formKey)
      return f ? { formId: f.id, tenantId: f.tenantId, kind: f.kind, fields: [...f.fields], notifyEmails: [] } : null
    },
    async saveSubmission(s) {
      const id = crypto.randomUUID()
      st.submissions.push({ id, siteId: s.siteId, formId: s.formId, payload: { ...s.payload }, status: s.status, ipHash: s.ipHash, createdAt: new Date() })
      return id
    },
    async listSubmissions(siteId, limit) {
      return st.submissions.filter((x) => x.siteId === siteId && x.status !== 'spam').slice(-limit).reverse().map((x) => {
        const f = st.forms.find((y) => y.id === x.formId)!
        return { id: x.id, formKey: f.formKey, kind: f.kind, payload: { ...x.payload }, status: x.status, createdAt: x.createdAt }
      })
    },
    async ownerEmails(tenantId) {
      return base.members.filter((m) => m.tenantId === tenantId && m.role === 'owner').map((m) => st.emails.get(m.userId)).filter((e): e is string => Boolean(e))
    },

    async versionsPage(afterId, limit) {
      const all = base.versions.slice().sort((a, b) => a.id.localeCompare(b.id))
      return all.filter((v) => !afterId || v.id > afterId).slice(0, limit).map((v) => ({ id: v.id, siteId: v.siteId, number: v.number, kind: v.kind, doc: clone(v.doc) }))
    },
    async auditOps(a) { audit(a.tenantId, a.action, a.targetId, a.details) },
  }
}
