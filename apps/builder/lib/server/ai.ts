import 'server-only'
import { chat, checkSpend, DEFAULT_XAI_MODEL, spendConfigFromEnv, type ChatOptions, type Usage } from '@yakini/ai'
import { serverEnv } from './env'

/**
 * The only place XAI_API_KEY is read. Phase 1 wires `todayUsage` to builder.ai_usage_today()
 * (service role) and records every call in builder.ai_runs (no prompt bodies).
 */
export async function runAi(opts: Omit<ChatOptions, 'apiKey' | 'model'>, todayUsage: Usage, worstCase: Usage) {
  const decision = checkSpend(todayUsage, worstCase, spendConfigFromEnv(process.env))
  if (!decision.allowed) return { ok: false as const, reason: decision.reason }
  const apiKey = serverEnv('XAI_API_KEY')
  if (!apiKey) return { ok: false as const, reason: 'not_configured' as const }
  const result = await chat({ ...opts, apiKey, model: serverEnv('XAI_MODEL') || DEFAULT_XAI_MODEL })
  return { ok: true as const, result }
}
