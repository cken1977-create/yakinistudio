import { loadSiteDoc, SiteDocError } from '@yakini/site-schema'
import { editorAccess, json, NOT_FOUND, withEditor } from '@/lib/server/editor'

/**
 * GET /api/drafts/[siteId] (spec 18): the draft for the editor, after a conflict or a reload.
 * Draft cookie holder or member; anyone else gets "Not found". Old formats are upgraded on read
 * (7.4); a draft saved by a newer editor is refused with a plain message.
 */
export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ siteId: string }> }): Promise<Response> {
  const { siteId } = await params
  return withEditor(async (rt) => {
    const a = await editorAccess(rt, siteId)
    if (!a) return NOT_FOUND()
    try {
      return json({ rev: a.rev, doc: loadSiteDoc(a.doc).doc })
    } catch (e) {
      if (e instanceof SiteDocError && e.code === 'too_new') return json({ error: e.message }, 409)
      throw e
    }
  })
}
