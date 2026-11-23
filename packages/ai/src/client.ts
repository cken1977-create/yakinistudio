/**
 * Minimal xAI chat-completions client (spec 8.2). Deliberately takes the API key as an
 * argument: only apps/builder/lib/server/ai.ts (marked server-only) reads XAI_API_KEY.
 * Never logs prompts, headers or the key. Check xAI docs at build time for the current
 * tool-calling parameters before Phase 1 relies on them.
 */
export const DEFAULT_XAI_MODEL = 'grok-4.20-0309-non-reasoning'
export const XAI_BASE_URL = 'https://api.x.ai/v1'

export type RawToolCall = { id: string; type: 'function'; function: { name: string; arguments: string } }
export type ChatMessage = { role: 'system' | 'user' | 'assistant' | 'tool'; content: string; tool_call_id?: string; tool_calls?: RawToolCall[] }
export type ToolDef = { type: 'function'; function: { name: string; description: string; parameters: Record<string, unknown> } }
export type ToolCall = { id: string; name: string; arguments: unknown }

export type ChatResult = {
  content: string | null
  toolCalls: ToolCall[]
  usage: { inputTokens: number; outputTokens: number }
  model: string
  latencyMs: number
}

export class AiError extends Error {
  constructor(public readonly code: 'timeout' | 'http' | 'bad_response' | 'bad_tool_args', message: string, public readonly status?: number) {
    super(message)
    this.name = 'AiError'
  }
}

export type ChatOptions = {
  temperature?: number
  apiKey: string
  model?: string
  messages: ChatMessage[]
  tools?: ToolDef[]
  toolChoice?: 'auto' | 'required' | { type: 'function'; function: { name: string } }
  timeoutMs?: number
  maxTokens?: number
  fetchImpl?: typeof fetch
}

export function parseToolCalls(raw: unknown): ToolCall[] {
  if (!Array.isArray(raw)) return []
  return raw.map((c) => {
    const fn = (c as { function?: { name?: unknown; arguments?: unknown } }).function
    const id = (c as { id?: unknown }).id
    if (typeof id !== 'string' || !fn || typeof fn.name !== 'string') throw new AiError('bad_response', 'Malformed tool call')
    let args: unknown = fn.arguments
    if (typeof args === 'string') {
      try { args = JSON.parse(args) } catch { throw new AiError('bad_tool_args', `Tool ${fn.name} sent arguments that are not JSON`) }
    }
    return { id, name: fn.name, arguments: args }
  })
}

export async function chat(o: ChatOptions): Promise<ChatResult> {
  if (!o.apiKey) throw new AiError('http', 'AI is not configured')
  const started = Date.now()
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), o.timeoutMs ?? 30_000)
  const f = o.fetchImpl ?? fetch
  try {
    const res = await f(`${XAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${o.apiKey}` },
      body: JSON.stringify({
        model: o.model || DEFAULT_XAI_MODEL,
        messages: o.messages,
        ...(o.tools ? { tools: o.tools, tool_choice: o.toolChoice ?? 'auto' } : {}),
        ...(o.maxTokens ? { max_tokens: o.maxTokens } : {}),
        ...(o.temperature !== undefined ? { temperature: o.temperature } : {}),
      }),
    })
    if (!res.ok) throw new AiError('http', `AI request failed (${res.status})`, res.status)
    const body = (await res.json()) as {
      model?: string
      choices?: { message?: { content?: string | null; tool_calls?: unknown } }[]
      usage?: { prompt_tokens?: number; completion_tokens?: number }
    }
    const msg = body.choices?.[0]?.message
    if (!msg) throw new AiError('bad_response', 'AI reply had no message')
    return {
      content: msg.content ?? null,
      toolCalls: parseToolCalls(msg.tool_calls),
      usage: { inputTokens: body.usage?.prompt_tokens ?? 0, outputTokens: body.usage?.completion_tokens ?? 0 },
      model: body.model ?? o.model ?? DEFAULT_XAI_MODEL,
      latencyMs: Date.now() - started,
    }
  } catch (e) {
    if ((e as { name?: string }).name === 'AbortError') throw new AiError('timeout', 'AI request timed out')
    throw e
  } finally {
    clearTimeout(timer)
  }
}
