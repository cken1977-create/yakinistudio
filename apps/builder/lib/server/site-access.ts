import 'server-only'
import { currentUser, type SessionUser } from './auth'
import { openDraft } from './draft-access'
import type { Runtime } from './runtime'
import type { EditorSite, Role } from './store'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

/**
 * A signed-in member's access to a site (spec 14.2): owners, editors, and Yakini operators. Anyone
 * else gets null, which every caller shows as "not found" so a site id alone reveals nothing.
 */
export async function memberSite(rt: Runtime, siteId: string, user: SessionUser | null): Promise<{ site: EditorSite; role: Role } | null> {
  if (!user || !UUID.test(siteId)) return null
  const site = await rt.store.getEditorSite(siteId)
  if (!site) return null
  const role = await rt.store.memberRole(user.id, site.tenantId)
  return role ? { site, role } : null
}

/**
 * Who may look at a draft (spec 10.1 /d, 18 GET /api/drafts/[siteId]): the browser holding its
 * cookie while it's anonymous, or a signed-in member once it's claimed.
 */
export async function viewableDraft(rt: Runtime, siteId: string): Promise<{ doc: unknown; tenantId: string; member: boolean } | null> {
  const draft = await openDraft(rt, siteId)
  if (draft) return { doc: draft.doc, tenantId: draft.tenantId, member: false }
  const m = await memberSite(rt, siteId, await currentUser())
  return m ? { doc: m.site.doc, tenantId: m.site.tenantId, member: true } : null
}
