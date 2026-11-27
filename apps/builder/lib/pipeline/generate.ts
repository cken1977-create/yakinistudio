import {
  AiError, GENERATE_MAX_RETRIES, GENERATE_MAX_TOKENS, GENERATE_TEMPERATURE, GENERATE_TIMEOUT_MS, GEN_PROMPT_VERSION,
  generateSystemPrompt, generateUserMessage, retryMessages, submitSiteTool,
  type ChatMessage, type ChatOptions, type ChatResult, type GenerateInput,
} from '@yakini/ai'
import { checkAgainstKit, kitRules, type KitDefinition, type TemplateContext } from '@yakini/kits'
import { siteDocContentJsonSchema, validateContent, type SiteDocContent } from '@yakini/site-schema'
import { copyIssues, sanitizeContent, type SanitizeContext, type SanitizeReport } from './sanitize'

/** What the pipeline needs from the AI layer. `null` means the call was not made (spend cap, not configured). */
export type GenerateChat = (opts: Omit<ChatOptions, 'apiKey' | 'model'>) => Promise<ChatResult | { skipped: 'token_cap' | 'usd_cap' | 'bad_usage' | 'not_configured' }>

export type GenerateOutcome = 'ok' | 'invalid' | 'timeout' | 'error' | 'skipped'

export type GenerateResult = {
  outcome: GenerateOutcome
  content?: SiteDocContent
  report?: SanitizeReport
  attempts: number
  toolCalls: number
  usage: { inputTokens: number; outputTokens: number }
  latencyMs: number
  model: string | null
  promptVersion: string
  /** Last validation issues, kept for logs only (never shown to the prospect). */
  lastIssues: string[]
}

const SERVER_KEYS = new Set(['brand', 'integrations', 'schemaVersion', 'style'])

let cachedSchema: Record<string, unknown> | null = null
const toolSchema = () => (cachedSchema ??= siteDocContentJsonSchema())

/**
 * Fill a kit template with the business's content (spec 8.4/8.5, 5.2 step 4e-f): one model call,
 * then up to 2 retries that send the validation errors back. Every candidate must pass the
 * schema, the kit rules and the copy rules, then gets server-side clean-up. Anything else returns
 * a non-ok outcome and the caller falls back to the kit template. Never throws.
 */
export async function generateContent(args: {
  kit: KitDefinition
  input: Omit<GenerateInput, 'kitRules' | 'kitTemplate'>
  sanitize: Omit<SanitizeContext, 'kit'>
  chat: GenerateChat
  /** Wall-clock deadline (ms since epoch). No retry starts once less than `minAttemptMs` is left. */
  deadline: number
  /** The owner's industry, so the starting template is the one they'll see on a fallback. */
  industry?: TemplateContext['industry']
  minAttemptMs?: number
  now?: () => number
}): Promise<GenerateResult> {
  const now = args.now ?? Date.now
  const started = now()
  const kitTemplate = args.kit.template({ name: args.sanitize.businessName, phone: args.input.businessFacts.phone, city: args.input.businessFacts.city, ...(args.industry ? { industry: args.industry } : {}) })
  const messages: ChatMessage[] = [
    { role: 'system', content: generateSystemPrompt(args.kit.copyTone) },
    { role: 'user', content: generateUserMessage({ ...args.input, kitRules: kitRules(args.kit), kitTemplate }) },
  ]
  const result: GenerateResult = {
    outcome: 'invalid', attempts: 0, toolCalls: 0, usage: { inputTokens: 0, outputTokens: 0 }, latencyMs: 0,
    model: null, promptVersion: GEN_PROMPT_VERSION, lastIssues: [],
  }
  const finish = (r: GenerateResult) => ({ ...r, latencyMs: now() - started })

  for (let attempt = 0; attempt <= GENERATE_MAX_RETRIES; attempt++) {
    const left = args.deadline - now()
    if (attempt > 0 && left < (args.minAttemptMs ?? 20_000)) break
    result.attempts++
    let res: Awaited<ReturnType<GenerateChat>>
    try {
      res = await args.chat({
        messages,
        tools: [submitSiteTool(toolSchema())],
        toolChoice: 'required',
        temperature: GENERATE_TEMPERATURE,
        maxTokens: GENERATE_MAX_TOKENS,
        timeoutMs: Math.max(5_000, Math.min(GENERATE_TIMEOUT_MS, left)),
      })
    } catch (e) {
      return finish({ ...result, outcome: e instanceof AiError && e.code === 'timeout' ? 'timeout' : 'error' })
    }
    if ('skipped' in res) return finish({ ...result, outcome: 'skipped', lastIssues: [res.skipped] })
    result.model = res.model
    result.usage.inputTokens += res.usage.inputTokens
    result.usage.outputTokens += res.usage.outputTokens
    result.toolCalls += res.toolCalls.length

    const call = res.toolCalls.find((c) => c.name === 'submit_site')
    if (!call) {
      result.lastIssues = ['You must call submit_site with the complete site.']
      messages.push({ role: 'assistant', content: res.content ?? '' }, { role: 'user', content: result.lastIssues[0] })
      continue
    }
    // Brand, style, integrations and schemaVersion are the server's to set (spec 8.5). If the model sends
    // them anyway they are dropped here, unread, rather than costing a retry.
    const submitted = call.arguments && typeof call.arguments === 'object' && !Array.isArray(call.arguments)
      ? Object.fromEntries(Object.entries(call.arguments as Record<string, unknown>).filter(([k]) => !SERVER_KEYS.has(k)))
      : call.arguments
    const v = validateContent(submitted)
    let issues: string[] = v.ok ? [] : v.issues
    if (v.ok) issues = [...checkAgainstKit(v.content, args.kit), ...copyIssues(v.content)]
    if (v.ok && issues.length === 0) {
      const { content, report } = sanitizeContent(v.content, { ...args.sanitize, kit: args.kit })
      // Clean-up never makes content invalid, but check rather than trust it.
      const again = validateContent(content)
      if (again.ok) return finish({ ...result, outcome: 'ok', content: again.content, report, lastIssues: [] })
      issues = again.issues
    }
    result.lastIssues = issues
    messages.push(...retryMessages(call, issues))
  }
  return finish({ ...result, outcome: 'invalid' })
}
