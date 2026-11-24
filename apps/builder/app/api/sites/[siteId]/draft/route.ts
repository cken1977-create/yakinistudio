import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'
import { applyOps } from '@yakini/edits'
import { loadSiteDoc, SiteDocError } from '@yakini/site-schema'
import {
  actorKind, CONFLICT_MESSAGE, editContext, editorAccess, json, maybeCheckpoint, NOT_FOUND, readJson, userIdOf, withEditor,
} from '@/lib/server/editor'
import { clientIp, hashIp, originAllowed, requestOrigin } from '@/lib/server/request'

/**
 * PATCH /api/sites/[siteId]/draft (spec 10.3-10.5, 18): save a batch of edits. The browser sends
 * operations, never a whole site: the server applies them to the stored draft, checks every rule
 * (brand untouched, kit sections, page limit, own pictures, a valid site), and saves only if the
 * draft is still at `baseRev`. Otherwise it answers 409 with the latest draft, so a second window
 * never overwrites the first and nothing is lost.
 */
export const dynamic = 'force-dynamic'

const Body = z.object({
  baseRev: z.number().int().min(0),
  ops: z.array(z.unknown()).min(1).max(60),
  // 'undo' and 'redo' replay the editor's own inverse operations (restore_* ops); everything else
  // is limited to the public edit operations.
  source: z.enum(['click', 'chat', 'undo', 'redo']),
}).strict()

export async function PATCH(request: Request, { params }: { params: Promise<{ siteId: string }> }): Promise<Response> {
  const { siteId } = await params
  return withEditor(async (rt) => {
    if (!originAllowed(request.headers, [requestOrigin(request.url)])) return json({ error: 'Forbidden' }, 403)
    const a = await editorAccess(rt, siteId)
    if (!a) return NOT_FOUND()
    const parsed = Body.safeParse(await readJson(request, 512 * 1024))
    if (!parsed.success) return json({ error: 'That change couldn’t be read. Please reload the editor.' }, 400)
    const body = parsed.data

    // Autosave runs every 1.5 s at most; these only stop runaway scripts.
    const key = a.kind === 'member' ? `save:u:${a.user.id}` : `save:ip:${hashIp(clientIp(request.headers), rt.ipPepper)}`
    if (!(await rt.store.hitRateLimit(key, a.kind === 'member' ? 1500 : 600, 3600))) {
      return json({ error: 'That’s a lot of changes in a short time. Please wait a minute; your earlier changes are saved.' }, 429)
    }

    let doc
    try { doc = loadSiteDoc(a.doc).doc } catch (e) {
      if (e instanceof SiteDocError && e.code === 'too_new') return json({ error: e.message }, 409)
      throw e
    }
    if (body.baseRev !== a.rev) return json({ error: CONFLICT_MESSAGE, conflict: true, rev: a.rev, doc }, 409)

    const internal = body.source === 'undo' || body.source === 'redo'
    const applied = applyOps(doc, body.ops, await editContext(rt, a, doc), { internal })
    if (!applied.ok) return json({ error: applied.error, opIndex: applied.opIndex }, 422)

    const saved = await rt.store.saveDraft({ siteId, baseRev: body.baseRev, doc: applied.doc })
    if (!saved.ok) {
      let latest: unknown = saved.doc
      try { latest = loadSiteDoc(saved.doc).doc } catch { /* send what's stored; the editor reloads */ }
      return json({ error: CONFLICT_MESSAGE, conflict: true, rev: saved.rev, doc: latest }, 409)
    }

    // The change is saved. The edit log and checkpoint follow; if either fails the owner's change
    // still stands, so the failure is reported to us rather than to them.
    let version: number | null = null
    try {
      await rt.store.logEdit({
        tenantId: a.tenantId, siteId, userId: userIdOf(a), actorKind: actorKind(a),
        source: body.source === 'chat' ? 'chat' : 'click', ops: applied.applied, revAfter: saved.rev,
      })
      version = await maybeCheckpoint(rt, a, applied.doc)
    } catch (e) { Sentry.captureException(e, { tags: { area: 'edit-log' } }) }
    return json({ rev: saved.rev, changed: [...applied.changed], inverse: applied.inverse, applied: applied.applied, version })
  })
}
