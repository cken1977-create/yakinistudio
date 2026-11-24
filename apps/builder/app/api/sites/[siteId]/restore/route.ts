import { z } from 'zod'
import { loadSiteDoc, SiteDocError, validateNewDoc } from '@yakini/site-schema'
import { canManageVersions, CONFLICT_MESSAGE, docSha256, editorAccess, json, NOT_FOUND, readJson, userIdOf, withEditor } from '@/lib/server/editor'
import { originAllowed, requestOrigin } from '@/lib/server/request'

/**
 * POST /api/sites/[siteId]/restore (spec 10.5, 18): make the draft a copy of an earlier version.
 * Owners and editors only. The current draft is saved as a version first, so a restore can itself
 * be undone. Old versions are upgraded to the current format on the way in (7.4); the brand stays
 * as it is now, because colors and logo only change in Brand settings (R6). Publishing is separate.
 */
export const dynamic = 'force-dynamic'

const Body = z.object({ versionId: z.uuid(), baseRev: z.number().int().min(0) }).strict()

export async function POST(request: Request, { params }: { params: Promise<{ siteId: string }> }): Promise<Response> {
  const { siteId } = await params
  return withEditor(async (rt) => {
    if (!originAllowed(request.headers, [requestOrigin(request.url)])) return json({ error: 'Forbidden' }, 403)
    const a = await editorAccess(rt, siteId)
    if (!a || a.kind !== 'member') return NOT_FOUND()
    if (!canManageVersions(a)) return json({ error: 'Only the owner or an editor can restore a version.' }, 403)
    const parsed = Body.safeParse(await readJson(request, 1024))
    if (!parsed.success) return json({ error: 'That version couldn’t be read.' }, 400)
    const { versionId, baseRev } = parsed.data

    let current, old
    try {
      current = loadSiteDoc(a.doc).doc
      const v = await rt.store.getVersion(siteId, versionId)
      if (!v) return NOT_FOUND()
      old = { number: v.number, doc: loadSiteDoc(v.doc).doc }
    } catch (e) {
      if (e instanceof SiteDocError && e.code === 'too_new') return json({ error: e.message }, 409)
      if (e instanceof SiteDocError) return json({ error: 'That version can’t be opened.' }, 422)
      throw e
    }
    if (baseRev !== a.rev) return json({ error: CONFLICT_MESSAGE, conflict: true, rev: a.rev, doc: current }, 409)

    const restored = validateNewDoc({ ...old.doc, brand: current.brand, integrations: current.integrations })
    if (!restored.ok) return json({ error: 'That version can’t be restored as it is. Please contact Yakini.' }, 422)

    const backup = await rt.store.createVersion({ siteId, doc: current, docSha256: docSha256(current), userId: userIdOf(a), note: `Before restoring version ${old.number}` })
    const saved = await rt.store.saveDraft({ siteId, baseRev, doc: restored.doc })
    if (!saved.ok) return json({ error: CONFLICT_MESSAGE, conflict: true, rev: saved.rev, doc: saved.doc }, 409)

    await rt.store.audit({
      tenantId: a.tenantId, userId: userIdOf(a), actorKind: a.role, action: 'restore', targetId: siteId,
      details: { restoredVersion: old.number, backupVersion: backup.number, revAfter: saved.rev },
    })
    await rt.store.logEdit({ tenantId: a.tenantId, siteId, userId: userIdOf(a), actorKind: a.role, source: 'system', ops: [{ op: 'restore_version', number: old.number }], revAfter: saved.rev })
    return json({ rev: saved.rev, doc: restored.doc, restored: old.number, backup: backup.number })
  })
}
