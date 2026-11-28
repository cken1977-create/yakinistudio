/**
 * Global AI spend cap (v1.1 addition). Every AI call checks today's usage across ALL
 * tenants before it runs; when the cap is reached the Builder falls back to the
 * kit template (generate) or a plain "try again later" (edit). Fails closed.
 *
 * Usage totals come from builder.ai_usage_today() (sums ai_runs). Rates are read from
 * env so internal costs never live in customer-facing code.
 */
export type SpendConfig = {
  /** AI_DAILY_TOKEN_CAP: input+output tokens per UTC day across all tenants. */
  dailyTokenCap: number
  /** AI_GLOBAL_DAILY_USD_CAP: optional USD cap per UTC day. */
  dailyUsdCap?: number
  /** AI_PRICE_INPUT_PER_M_USD / AI_PRICE_OUTPUT_PER_M_USD: needed for the USD cap. */
  inputPerMUsd?: number
  outputPerMUsd?: number
}

export const DEFAULT_DAILY_TOKEN_CAP = 2_000_000
export const DEFAULT_DAILY_USD_CAP = 10

function num(v: string | undefined): number | undefined {
  if (v === undefined || v.trim() === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

export function spendConfigFromEnv(env: Record<string, string | undefined>): SpendConfig {
  return {
    dailyTokenCap: num(env.AI_DAILY_TOKEN_CAP) ?? DEFAULT_DAILY_TOKEN_CAP,
    // Text gets the overall cap minus what is set aside for images, so images never eat the text budget.
    dailyUsdCap: textUsdCap(env),
    inputPerMUsd: num(env.AI_PRICE_INPUT_PER_M_USD),
    outputPerMUsd: num(env.AI_PRICE_OUTPUT_PER_M_USD),
  }
}

export type Usage = { inputTokens: number; outputTokens: number }
export type SpendDecision = { allowed: true } | { allowed: false; reason: 'token_cap' | 'usd_cap' | 'bad_usage' }

export function estimateUsd(u: Usage, c: SpendConfig): number | undefined {
  if (c.inputPerMUsd === undefined || c.outputPerMUsd === undefined) return undefined
  return (u.inputTokens * c.inputPerMUsd + u.outputTokens * c.outputPerMUsd) / 1_000_000
}

/** `next` is the worst-case size of the call about to run. */
export function checkSpend(today: Usage, next: Usage, c: SpendConfig): SpendDecision {
  const vals = [today.inputTokens, today.outputTokens, next.inputTokens, next.outputTokens]
  if (vals.some((v) => !Number.isFinite(v) || v < 0)) return { allowed: false, reason: 'bad_usage' }
  const total = { inputTokens: today.inputTokens + next.inputTokens, outputTokens: today.outputTokens + next.outputTokens }
  if (total.inputTokens + total.outputTokens > c.dailyTokenCap) return { allowed: false, reason: 'token_cap' }
  const usd = estimateUsd(total, c)
  if (c.dailyUsdCap !== undefined && usd !== undefined && usd > c.dailyUsdCap) return { allowed: false, reason: 'usd_cap' }
  return { allowed: true }
}

/**
 * Image spend (design D4, decided 2026-11-28): images have their own dollar cap inside the overall
 * AI cap (AI_GLOBAL_DAILY_USD_CAP). That amount is set aside for images, so images can never use up
 * the text budget and text can never use up the images'. Both fail closed. Images are off unless
 * AI_IMAGE_GENERATION_ENABLED=1 and AI_IMAGE_DAILY_USD_CAP is set above 0.
 */
export type ImageSpendConfig = { enabled: boolean; imageDailyUsdCap: number; overallDailyUsdCap: number }
export type ImageSpendDecision = { allowed: true } | { allowed: false; reason: 'off' | 'no_cap' | 'image_cap' | 'bad_usage' }

export function imageSpendConfigFromEnv(env: Record<string, string | undefined>): ImageSpendConfig {
  const overall = num(env.AI_GLOBAL_DAILY_USD_CAP) ?? DEFAULT_DAILY_USD_CAP
  return {
    enabled: env.AI_IMAGE_GENERATION_ENABLED === '1',
    // Never more than the overall cap.
    imageDailyUsdCap: Math.min(num(env.AI_IMAGE_DAILY_USD_CAP) ?? 0, overall),
    overallDailyUsdCap: overall,
  }
}

/** The text side's dollar cap: the overall cap minus the images' share when images are on. */
export function textUsdCap(env: Record<string, string | undefined>): number {
  const img = imageSpendConfigFromEnv(env)
  return img.enabled ? Math.max(0, img.overallDailyUsdCap - img.imageDailyUsdCap) : img.overallDailyUsdCap
}

/** `todayUsd` is what images have cost so far today; `nextUsd` the worst case of the call about to run. */
export function checkImageSpend(todayUsd: number, nextUsd: number, c: ImageSpendConfig): ImageSpendDecision {
  if (!c.enabled) return { allowed: false, reason: 'off' }
  if (!(c.imageDailyUsdCap > 0)) return { allowed: false, reason: 'no_cap' }
  if (![todayUsd, nextUsd].every((v) => Number.isFinite(v) && v >= 0)) return { allowed: false, reason: 'bad_usage' }
  if (todayUsd + nextUsd > c.imageDailyUsdCap) return { allowed: false, reason: 'image_cap' }
  return { allowed: true }
}
