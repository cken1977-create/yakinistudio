import 'server-only'
import { DEFAULT_ROOT_DOMAIN } from '@/lib/publish/slug'
import { serverEnv } from './env'

/** Phase 3 settings (spec 17), read from env names with the spec's defaults. */
export type ReviewGateMode = 'override_or_flagged' | 'all_first_publishes' | 'flagged_only'

const int = (raw: string | undefined, def: number, min: number, max: number) => {
  const n = Number(raw)
  return Number.isInteger(n) && n >= min && n <= max ? n : def
}

export function phase3Settings() {
  const gate = serverEnv('REVIEW_GATE_MODE')
  return {
    rootDomain: (serverEnv('ROOT_DOMAIN') || DEFAULT_ROOT_DOMAIN).toLowerCase(),
    studioHost: (serverEnv('STUDIO_HOST') || 'studio.yakini.digital').toLowerCase(),
    reservedExtra: serverEnv('RESERVED_SUBDOMAINS'),
    reviewGate: (gate === 'all_first_publishes' || gate === 'flagged_only' ? gate : 'override_or_flagged') as ReviewGateMode,
    shareLinkDays: int(serverEnv('SHARE_LINK_TTL_DAYS'), 7, 1, 30),
    shareLinkMaxActive: 20,
    autoHoldReports: int(serverEnv('ABUSE_AUTO_HOLD_REPORTS'), 3, 1, 100),
    autoHoldWindowHours: int(serverEnv('ABUSE_AUTO_HOLD_WINDOW_HOURS'), 24, 1, 720),
  }
}

/** The studio's public origin, for links in emails and on client sites (Report this site). */
export function studioOrigin(): string {
  return process.env.NEXT_PUBLIC_STUDIO_ORIGIN || `https://${phase3Settings().studioHost}`
}
