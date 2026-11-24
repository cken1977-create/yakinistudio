import { z } from 'zod'
import { canManageVersions, docSha256, editorAccess, json, NOT_FOUND, readJson, userIdOf, withEditor } from '@/lib/server/editor'
import { originAllowed, requestOrigin } from '@/lib/server/request'

/**
 * Versions (spec 10.5, 18). GET: members see the history. POST: owners and editors save a version
 * of the current draft with a short note ("Save a version").
 */
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ siteId: string }> }

export async function GET(_request: Request, { params }: Ctx): Promise<Response> {
  const { siteId } = await params
  return withEditor(async (rt) => {
    const a = await editorAccess(rt, siteId)
    if (!a || a.kind !== 'member') return NOT_FOUND()
    const versions = await rt.store.listVersions(siteId)
    return json({ versions: versions.map((v) => ({ id: v.id, number: v.number, kind: v.kind, note: v.note, createdAt: v.createdAt.toISOString() })) })
  })
}

const Body = z.object({ note: z.string().max(200).optional() }).strict()

export async function POST(request: Request, { params }: Ctx): Promise<Response> {
  const { siteId } = await params
  return withEditor(async (rt) => {
    if (!originAllowed(request.headers, [requestOrigin(request.url)])) return json({ error: 'Forbidden' }, 403)
    const a = await editorAccess(rt, siteId)
    if (!a || a.kind !== 'member') return NOT_FOUND()
    if (!canManageVersions(a)) return json({ error: 'Only the owner or an editor can save versions.' }, 403)
    const parsed = Body.safeParse(await readJson(request, 2048))
    if (!parsed.success) return json({ error: 'Notes can be up to 200 characters.' }, 400)
    if (!(await rt.store.hitRateLimit(`version:${siteId}`, 60, 3600))) return json({ error: 'Please wait a little before saving another version.' }, 429)
    const note = parsed.data.note?.replace(/\s+/g, ' ').trim() || null
    const v = await rt.store.createVersion({ siteId, doc: a.doc, docSha256: docSha256(a.doc), userId: userIdOf(a), note })
    return json({ id: v.id, number: v.number }, 201)
  })
}
