import 'server-only'
import { signFormTime } from './request'
import { getRuntime } from './runtime'

/** The signed "form shown at" time for a public form (spam check, spec 11.3, 14.4), or null when not configured. */
export function freshFormStamp(): string | null {
  try { return signFormTime(Date.now(), getRuntime().ipPepper) } catch { return null }
}
