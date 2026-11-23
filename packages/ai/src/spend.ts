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
    dailyUsdCap: num(env.AI_GLOBAL_DAILY_USD_CAP) ?? DEFAULT_DAILY_USD_CAP,
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
