import 'server-only'
import { chat, checkSpend, DEFAULT_XAI_MODEL, imageSpendConfigFromEnv, spendConfigFromEnv, xaiImageProvider, xaiVisionChecker, type ChatOptions, type ImageProvider, type Usage, type VisionChecker } from '@yakini/ai'
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

/**
 * The real image maker and checker (design D4), or null. Null unless AI_IMAGE_GENERATION_ENABLED=1,
 * an image dollar cap above 0 is set and the key exists: generation stays off until Clarence confirms
 * xAI's commercial terms and sets the cap.
 */
export function realImageProviders(): { provider: ImageProvider; checker: VisionChecker } | null {
  const cfg = imageSpendConfigFromEnv(process.env)
  const apiKey = serverEnv('XAI_API_KEY')
  if (!cfg.enabled || !(cfg.imageDailyUsdCap > 0) || !apiKey) return null
  return {
    provider: xaiImageProvider({ apiKey, model: serverEnv('XAI_IMAGE_MODEL') || undefined }),
    checker: xaiVisionChecker({ apiKey, model: serverEnv('XAI_VISION_MODEL') || serverEnv('XAI_MODEL') || DEFAULT_XAI_MODEL }),
  }
}
