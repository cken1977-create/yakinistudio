import { z } from 'zod'
import { loadSiteDoc, SiteDocError } from '@yakini/site-schema'
import { runChatEdit, type ChatEditResult } from '@/lib/chat/edit'
import { chatLimits, editContext, editorAccess, json, NOT_FOUND, readJson, withEditor } from '@/lib/server/editor'
import { clientIp, hashIp, originAllowed, requestOrigin } from '@/lib/server/request'

/**
 * POST /api/ai/edit (spec 8.6-8.7, 10.4, 18): "Ask for a change". Returns a proposal (the changes
 * in plain words plus the operations) and saves nothing: the owner taps Apply, and the editor
 * saves it through the normal save route, which checks every rule again. Limits per tenant: 20 an
 * hour on trial (and before claiming), 120 when active, and a daily token cap; before claiming,
 * also per IP.
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const Id = z.string().regex(/^[a-z0-9][a-z0-9-]{0,39}$/)
const Body = z.object({
  siteId: z.uuid(),
  request: z.string().min(1).max(1000),
  selected: z.object({ pageId: Id, sectionId: Id }).strict().nullable().optional(),
  pageId: Id.nullable().optional(),
}).strict()

const BUSY = 'You’ve asked for a lot of changes this hour. Try again a little later, or click any text to edit it directly.'

function outcomeOf(r: ChatEditResult) {
  switch (r.meta.outcome) {
    case 'ok': return 'ok' as const
    case 'invalid': return 'invalid' as const
    case 'skipped': return 'blocked' as const
    default: return 'error' as const
  }
}

export async function POST(request: Request): Promise<Response> {
  return withEditor(async (rt) => {
    if (!originAllowed(request.headers, [requestOrigin(request.url)])) return json({ error: 'Forbidden' }, 403)
    const parsed = Body.safeParse(await readJson(request, 8 * 1024))
    if (!parsed.success) return json({ error: 'Tell me what you’d like to change, in up to 1,000 characters.' }, 400)
    const body = parsed.data
    const a = await editorAccess(rt, body.siteId)
    if (!a) return NOT_FOUND()

    let doc
    try { doc = loadSiteDoc(a.doc).doc } catch (e) {
      if (e instanceof SiteDocError && e.code === 'too_new') return json({ error: e.message }, 409)
      throw e
    }

    const limits = chatLimits(a.tenantStatus)
    const usage = await rt.store.tenantAiUsage(a.tenantId)
    if (usage.tokensToday >= limits.tokensPerDay) return json({ kind: 'paused', message: 'Chat edits are paused until tomorrow. You can still click to edit anything.' })
    if (usage.editsLastHour >= limits.perHour) return json({ kind: 'busy', message: BUSY })
    if (a.kind === 'anonymous' && !(await rt.store.hitRateLimit(`chat:ip:${hashIp(clientIp(request.headers), rt.ipPepper)}`, 30, 3600))) {
      return json({ kind: 'busy', message: BUSY })
    }

    const history = (await rt.store.recentChat(a.siteId, 6)).map((m) => ({ role: m.role, content: m.content }))
    const result = await runChatEdit({
      doc, request: body.request, selected: body.selected ?? null, pageId: body.pageId ?? null,
      history, ctx: await editContext(rt, a, doc), chat: rt.chat,
    })

    if (result.meta.attempts > 0) {
      await rt.store.logAiRun({
        tenantId: a.tenantId, siteId: a.siteId, kind: 'edit', model: result.meta.model ?? 'none', promptVersion: result.meta.promptVersion,
        inputTokens: result.meta.inputTokens, outputTokens: result.meta.outputTokens, latencyMs: result.meta.latencyMs,
        outcome: outcomeOf(result), toolCalls: result.meta.toolCalls,
      })
    }

    const said = result.kind === 'proposal' ? result.lines.join('\n') : result.kind === 'question' ? result.question : result.message
    await rt.store.saveChat({ tenantId: a.tenantId, siteId: a.siteId, role: 'user', content: body.request, proposal: null })
    await rt.store.saveChat({ tenantId: a.tenantId, siteId: a.siteId, role: 'assistant', content: said, proposal: result.kind === 'proposal' ? { ops: result.ops } : null })

    switch (result.kind) {
      case 'proposal': return json({ kind: 'proposal', lines: result.lines, ops: result.ops, changed: result.changed, doc: result.doc, baseRev: a.rev })
      case 'question': return json({ kind: 'question', question: result.question, choices: result.choices })
      default: return json({ kind: result.kind, message: result.message })
    }
  })
}
