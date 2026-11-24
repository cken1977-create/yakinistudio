import { z } from 'zod'
import {
  CHANGE_HANDOFF, checkHelperAnswer, HELPER_FALLBACK, HELPER_MAX_QUESTION, HELPER_MAX_TOKENS, HELPER_PROMPT_VERSION, HELPER_SYSTEM_PROMPT,
  HELPER_TEMPERATURE, HELPER_TIMEOUT_MS, helperShortcut, injectionHits,
} from '@yakini/ai'
import { editorAccess, json, NOT_FOUND, readJson, withEditor } from '@/lib/server/editor'
import { clientIp, hashIp, originAllowed, requestOrigin } from '@/lib/server/request'

/**
 * POST /api/ai/helper (spec 10.6, 18): Destiny in the Help tab. Text answers about using the
 * editor; prices get the one fixed line; change requests are handed to the Chat tab. Every model
 * answer is checked (no stack names, no other prices, no "log in to see the demo"); a failing one is
 * replaced with a safe answer. Members and the draft holder; 30 questions an hour per person.
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const Body = z.object({
  siteId: z.uuid(),
  question: z.string().min(1).max(HELPER_MAX_QUESTION),
  history: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(800) }).strict()).max(6).optional(),
}).strict()

export async function POST(request: Request): Promise<Response> {
  return withEditor(async (rt) => {
    if (!originAllowed(request.headers, [requestOrigin(request.url)])) return json({ error: 'Forbidden' }, 403)
    const parsed = Body.safeParse(await readJson(request, 8 * 1024))
    if (!parsed.success) return json({ error: 'Ask me a question in up to 500 characters.' }, 400)
    const { siteId, history = [] } = parsed.data
    const question = parsed.data.question.replace(/\s+/g, ' ').trim()
    const a = await editorAccess(rt, siteId)
    if (!a) return NOT_FOUND()

    const who = a.kind === 'member' ? `helper:u:${a.user.id}` : `helper:ip:${hashIp(clientIp(request.headers), rt.ipPepper)}`
    if (!(await rt.store.hitRateLimit(who, 30, 3600))) return json({ answer: 'That’s a lot of questions for now. The written tutorial in this tab covers every step.' })

    const quick = helperShortcut(question)
    if (quick) return json(quick)
    if (injectionHits(question).length) return json({ answer: HELPER_FALLBACK })

    const started = Date.now()
    let res
    try {
      res = await rt.chat({
        messages: [
          { role: 'system', content: HELPER_SYSTEM_PROMPT },
          ...history.map((h) => ({ role: h.role, content: h.content })),
          { role: 'user', content: question },
        ],
        temperature: HELPER_TEMPERATURE, maxTokens: HELPER_MAX_TOKENS, timeoutMs: HELPER_TIMEOUT_MS,
      })
    } catch {
      return json({ answer: 'I couldn’t answer just now. The written tutorial in this tab covers every step.' })
    }
    if ('skipped' in res) return json({ answer: 'I’m taking a break until tomorrow. The written tutorial in this tab covers every step.' })

    const checked = checkHelperAnswer(res.content ?? '')
    await rt.store.logAiRun({
      tenantId: a.tenantId, siteId, kind: 'helper', model: res.model, promptVersion: HELPER_PROMPT_VERSION,
      inputTokens: res.usage.inputTokens, outputTokens: res.usage.outputTokens, latencyMs: Date.now() - started,
      outcome: checked.ok ? 'ok' : 'invalid', toolCalls: 0,
    })
    if (!checked.ok) return json({ answer: HELPER_FALLBACK })
    if (checked.text.startsWith(CHANGE_HANDOFF)) return json({ answer: CHANGE_HANDOFF, chatPrefill: question })
    return json({ answer: checked.text })
  })
}
