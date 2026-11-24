import {
  EDIT_MAX_TOKENS, EDIT_MAX_TOOL_CALLS, EDIT_PROMPT_VERSION, EDIT_SYSTEM_PROMPT, EDIT_TEMPERATURE, EDIT_TIMEOUT_MS,
  EDIT_WHOLE_DOC_BYTES, OFF_LIMITS_REPLIES, editRetryMessages, editUserMessage, injectionHits, lintCopy, offLimitsTopic,
  type ChatMessage, type EditTurn, type ToolCall,
} from '@yakini/ai'
import { applyOps, describeOp, type EditContext, type EditOp } from '@yakini/edits'
import { kitDefinition, kitRules } from '@yakini/kits'
import type { SiteDoc } from '@yakini/site-schema'
import type { GenerateChat } from '@/lib/pipeline/generate'
import { allText } from '@/lib/pipeline/sanitize'
import { AskArgs, ReplyArgs, editTools } from './tools'

/**
 * Chat edits (spec 8.6-8.7, 10.4). Pipeline: model → tool calls → validate each → apply to a
 * copy → validate the whole site → copy lint → plain-English proposal. Nothing is saved here:
 * the owner taps Apply, and the editor saves it like any other change. One retry with the
 * validation error; after that the owner gets a plain message and the site is untouched.
 */
export const COULD_NOT = 'I couldn’t make that change. Try saying it another way, or click the text to edit it directly.'
export const PAUSED = 'Chat edits are paused until tomorrow. You can still click to edit anything.'

export type ChatEditInput = {
  doc: SiteDoc
  request: string
  selected: { pageId: string; sectionId: string } | null
  /** Page the owner is looking at (used when the site is too big to send whole). */
  pageId: string | null
  history: EditTurn[]
  ctx: EditContext
  chat: GenerateChat
}

export type ChatEditResult = (
  | { kind: 'proposal'; ops: EditOp[]; inverse: EditOp[]; lines: string[]; doc: SiteDoc; changed: string[] }
  | { kind: 'reply'; message: string }
  | { kind: 'question'; question: string; choices: string[] }
  | { kind: 'failed'; message: string }
  | { kind: 'paused'; message: string }
) & { meta: { attempts: number; toolCalls: number; inputTokens: number; outputTokens: number; model: string | null; latencyMs: number; promptVersion: string; outcome: 'ok' | 'invalid' | 'error' | 'skipped' | 'none' } }

const MAX_REQUEST = 1000

/** The doc as the model sees it: no brand or integrations (it can't change them anyway). */
function siteForModel(doc: SiteDoc, pageId: string | null): { site: unknown; scope: 'site' | 'page' } {
  const { brand: _brand, integrations: _integrations, ...rest } = doc
  void _brand; void _integrations
  if (new TextEncoder().encode(JSON.stringify(rest)).length <= EDIT_WHOLE_DOC_BYTES) return { site: rest, scope: 'site' }
  const page = doc.pages.find((p) => p.id === pageId) ?? doc.pages[0]
  return { site: { ...rest, pages: [page], otherPages: doc.pages.filter((p) => p.id !== page.id).map((p) => ({ id: p.id, title: p.title, slug: p.slug })) }, scope: 'page' }
}

/** Copy rules (8.8) on the new text only: banned words, and nothing copied from injection attempts. */
function copyProblems(ops: EditOp[], businessName: string): string | null {
  const name = businessName.toLowerCase()
  for (const s of allText(ops)) {
    const banned = lintCopy(s).filter((h) => !name.includes(h.term.toLowerCase()))
    if (banned.length) return `Do not write "${banned[0].term}" on the site`
    const inj = injectionHits(s)
    if (inj.length) return `Do not copy instructions into the site ("${inj[0]}")`
  }
  return null
}

export async function runChatEdit(input: ChatEditInput): Promise<ChatEditResult> {
  const started = Date.now()
  const meta: ChatEditResult['meta'] = { attempts: 0, toolCalls: 0, inputTokens: 0, outputTokens: 0, model: null, latencyMs: 0, promptVersion: EDIT_PROMPT_VERSION, outcome: 'none' }
  type Body = ChatEditResult extends infer R ? (R extends unknown ? Omit<R, 'meta'> : never) : never
  const done = (r: Body): ChatEditResult => ({ ...r, meta: { ...meta, latencyMs: Date.now() - started } }) as unknown as ChatEditResult

  const request = input.request.replace(/\s+/g, ' ').trim().slice(0, MAX_REQUEST)
  if (!request) return done({ kind: 'failed', message: 'Tell me what you’d like to change.' })

  // Brand, publishing, domains and billing are never chat edits (R6, 8.6): answer without the model.
  const topic = offLimitsTopic(request)
  if (topic) return done({ kind: 'reply', message: OFF_LIMITS_REPLIES[topic] })

  const kit = kitDefinition(input.doc.kitId)
  if (!kit) return done({ kind: 'failed', message: COULD_NOT })
  const { site, scope } = siteForModel(input.doc, input.pageId)
  const messages: ChatMessage[] = [
    { role: 'system', content: EDIT_SYSTEM_PROMPT },
    ...input.history.slice(-6).map((t) => ({ role: t.role, content: t.content.slice(0, 2000) })),
    { role: 'user', content: editUserMessage({ kitRules: JSON.stringify(kitRules(kit)), site, scope, selected: input.selected, request }) },
  ]

  let lastError = ''
  let lastCalls: ToolCall[] = []
  for (let attempt = 0; attempt < 2; attempt++) {
    meta.attempts++
    let res
    try {
      res = await input.chat({
        messages: attempt === 0 ? messages : [...messages, ...editRetryMessages(lastCalls, lastError)],
        tools: editTools(), toolChoice: 'required', temperature: EDIT_TEMPERATURE, maxTokens: EDIT_MAX_TOKENS, timeoutMs: EDIT_TIMEOUT_MS,
      })
    } catch {
      meta.outcome = 'error'
      return done({ kind: 'failed', message: COULD_NOT })
    }
    if ('skipped' in res) {
      meta.outcome = 'skipped'
      return done({ kind: 'paused', message: PAUSED })
    }
    meta.inputTokens += res.usage.inputTokens
    meta.outputTokens += res.usage.outputTokens
    meta.model = res.model
    meta.toolCalls += res.toolCalls.length
    const calls = res.toolCalls
    lastCalls = calls.length ? calls : [{ id: 'none', name: 'none', arguments: {} }]

    if (!calls.length) { lastError = 'You must call one of the tools'; continue }
    if (calls.length > EDIT_MAX_TOOL_CALLS) { lastError = `Use at most ${EDIT_MAX_TOOL_CALLS} tool calls`; continue }

    const ask = calls.find((c) => c.name === 'ask_clarifying_question')
    const reply = calls.find((c) => c.name === 'reply')
    const edits = calls.filter((c) => c !== ask && c !== reply)
    if (!edits.length) {
      if (ask) {
        const a = AskArgs.safeParse(ask.arguments)
        if (a.success) { meta.outcome = 'ok'; return done({ kind: 'question', question: a.data.question, choices: a.data.choices ?? [] }) }
        lastError = 'ask_clarifying_question: question must be 1-200 characters with at most 4 short choices'; continue
      }
      const r = ReplyArgs.safeParse(reply!.arguments)
      if (r.success) {
        const problem = copyProblems([{ op: 'update_business', field: 'tagline', value: r.data.message }], input.doc.business.name)
        if (!problem) { meta.outcome = 'ok'; return done({ kind: 'reply', message: r.data.message }) }
        lastError = problem; continue
      }
      lastError = 'reply: message must be 1-400 characters'; continue
    }

    const ops = edits.map((c) => ({ ...(c.arguments && typeof c.arguments === 'object' ? c.arguments : {}), op: c.name }))
    const applied = applyOps(input.doc, ops, input.ctx)
    if (!applied.ok) { lastError = applied.opIndex === null ? applied.error : `call ${applied.opIndex + 1} (${edits[applied.opIndex]?.name}): ${applied.error}`; continue }
    const problem = copyProblems(applied.applied, input.doc.business.name)
    if (problem) { lastError = problem; continue }

    meta.outcome = 'ok'
    return done({
      kind: 'proposal',
      ops: applied.applied,
      inverse: applied.inverse,
      lines: applied.applied.map((op) => describeOp(input.doc, op)),
      doc: applied.doc,
      changed: [...applied.changed],
    })
  }
  meta.outcome = 'invalid'
  return done({ kind: 'failed', message: COULD_NOT })
}
