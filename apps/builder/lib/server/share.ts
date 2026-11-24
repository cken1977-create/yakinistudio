import 'server-only'
import { createHmac, randomBytes } from 'node:crypto'
import { currentUser } from './auth'
import type { Runtime } from './runtime'
import { memberSite } from './site-access'

/**
 * Share links (spec 14.8 #3): 32 random bytes shown once; only an HMAC is stored. A preview at
 * /p/<siteId>?s=<token> is open to members of the site, or to anyone holding a valid link.
 */
export const newShareToken = () => randomBytes(32).toString('base64url')
export const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/

export function hashShareToken(token: string, pepper: string): string {
  if (!pepper || pepper.length < 16) throw new Error('DRAFT_TOKEN_PEPPER is not set')
  return createHmac('sha256', pepper).update(`share:${token}`).digest('hex')
}

export type PreviewAccess = { siteId: string; tenantId: string; doc: unknown; versionId: string | null; via: 'member' | 'share'; token: string | null; expiresAt: Date | null }

/**
 * Who may see a preview, and of what: a member sees the draft (or `?v=` version); a share-link
 * holder sees what the link points at. Anything else is "not found" (no hint the site exists).
 */
export async function previewAccess(rt: Runtime, siteId: string, token: string | null, versionId: string | null): Promise<PreviewAccess | null> {
  if (token) {
    if (!TOKEN_RE.test(token)) return null
    const link = await rt.store.useShareLink(hashShareToken(token, rt.draftPepper))
    if (!link || link.siteId !== siteId) return null
    if (link.versionId) {
      const v = await rt.store.getVersion(siteId, link.versionId)
      return v ? { siteId, tenantId: link.tenantId, doc: v.doc, versionId: link.versionId, via: 'share', token, expiresAt: link.expiresAt } : null
    }
    const site = await rt.store.getEditorSite(siteId)
    return site && !site.takenDown ? { siteId, tenantId: site.tenantId, doc: site.doc, versionId: null, via: 'share', token, expiresAt: link.expiresAt } : null
  }
  const m = await memberSite(rt, siteId, await currentUser())
  if (!m) return null
  if (versionId) {
    const v = await rt.store.getVersion(siteId, versionId)
    return v ? { siteId, tenantId: m.site.tenantId, doc: v.doc, versionId, via: 'member', token: null, expiresAt: null } : null
  }
  return { siteId, tenantId: m.site.tenantId, doc: m.site.doc, versionId: null, via: 'member', token: null, expiresAt: null }
}
