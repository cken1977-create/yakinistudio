import 'server-only'

/**
 * Server-only environment access (spec 17). Names only; values are set by Clarence in Vercel.
 * Never log or return these values.
 */
export const SERVER_ENV_NAMES = [
  'SUPABASE_SERVICE_ROLE_KEY', 'XAI_API_KEY', 'XAI_MODEL', 'ELEVENLABS_API_KEY', 'ELEVENLABS_VOICE_ID',
  'PAYPAL_ENV', 'PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_WEBHOOK_ID', 'RESEND_API_KEY', 'EMAIL_FROM', 'OPERATOR_EMAIL',
  'VERCEL_API_TOKEN', 'VERCEL_TEAM_ID', 'VERCEL_BUILDER_PROJECT_ID', 'VERCEL_PROJECT_DOMAIN_LIMIT',
  'ROOT_DOMAIN', 'STUDIO_HOST', 'DEMO_ORIGIN', 'PORTAL_ORIGIN', 'PORTAL_INTAKE_SIGNING_SECRET',
  'DRAFT_TOKEN_PEPPER', 'IP_HASH_PEPPER', 'CRON_SECRET', 'REVALIDATE_SECRET', 'INTERNAL_RENDER_SECRET',
  'RUNTIME_LINK_ENC_KEY', 'FLEET_CANARY_TENANT_ID', 'AI_EDITS_PER_HOUR_TRIAL', 'AI_EDITS_PER_HOUR_ACTIVE',
  'AI_DAILY_TOKEN_CAP', 'AI_GLOBAL_DAILY_USD_CAP', 'AI_PRICE_INPUT_PER_M_USD', 'AI_PRICE_OUTPUT_PER_M_USD',
  'PAST_DUE_GRACE_DAYS', 'RESERVED_SUBDOMAINS', 'BLOCKED_CATEGORIES', 'SHARE_LINK_TTL_DAYS',
  'ABUSE_AUTO_HOLD_REPORTS', 'ABUSE_AUTO_HOLD_WINDOW_HOURS', 'REVIEW_GATE_MODE', 'VISIT_COUNTING_ENABLED',
  'VISITOR_COUNTS_ENABLED', 'EXPORT_HTML_POLICY',
] as const
export type ServerEnvName = (typeof SERVER_ENV_NAMES)[number]

/** The value, trimmed: a space or newline pasted into a dashboard setting must not break it. Empty counts as unset. */
export function serverEnv(name: ServerEnvName): string | undefined {
  const v = process.env[name]?.trim()
  return v ? v : undefined
}

/** Which required names are missing (names only, safe to show an operator). */
export function missingEnv(names: readonly ServerEnvName[]): ServerEnvName[] {
  return names.filter((n) => serverEnv(n) === undefined)
}
