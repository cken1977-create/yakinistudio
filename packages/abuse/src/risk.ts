/**
 * Automated risk check (spec 14.8 #5). Deterministic rules, no outside service (R2).
 * Runs on every publish and every share-link creation (Phases 3+). Results are stored
 * by rule id in publish_reviews.risk_flags (no personal data).
 */
import { IMPERSONATION_DOMAINS, IMPERSONATION_NAMES, normalizeName } from './brands'

export type RiskInput = {
  businessName: string
  slug?: string
  sourceUrl?: string | null
  /** All visible text of the site (headings, body, buttons, form labels). */
  text: string
  hasOpenAbuseReport?: boolean
}

export type RiskFlag = { rule: 'impersonation_name' | 'impersonation_slug' | 'impersonation_source' | 'verification_phrase' | 'open_report'; match: string }

export const VERIFICATION_PHRASES = [
  'verify your account', 'confirm your password', 'update your payment', 'your account is suspended',
  'your account has been suspended', 'confirm your identity', 'enter your password', 'social security number',
  'card verification', 'login to continue', 'log in to continue', 'unusual activity', 'reset your password',
  'one-time code', 'routing number',
] as const

function hostOf(u: string | null | undefined): string | null {
  if (!u) return null
  try { return new URL(u.includes('://') ? u : `https://${u}`).hostname.toLowerCase().replace(/^www\./, '') } catch { return null }
}

export function riskCheck(input: RiskInput): RiskFlag[] {
  const flags: RiskFlag[] = []
  const name = normalizeName(input.businessName)
  const slug = input.slug ? normalizeName(input.slug.replace(/-/g, ' ')) : ''
  for (const brand of IMPERSONATION_NAMES) {
    const b = ` ${brand} `
    if (name.includes(b)) flags.push({ rule: 'impersonation_name', match: brand })
    if (slug && slug.includes(b)) flags.push({ rule: 'impersonation_slug', match: brand })
  }
  const host = hostOf(input.sourceUrl)
  if (host && IMPERSONATION_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))) {
    flags.push({ rule: 'impersonation_source', match: host })
  }
  const text = input.text.toLowerCase().replace(/\s+/g, ' ')
  for (const p of VERIFICATION_PHRASES) if (text.includes(p)) flags.push({ rule: 'verification_phrase', match: p })
  if (input.hasOpenAbuseReport) flags.push({ rule: 'open_report', match: 'open report' })
  return flags
}
