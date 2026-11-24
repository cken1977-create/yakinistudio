import type { Business } from '@yakini/site-schema'

/**
 * The claim screen's business details (spec 5.4 step 4, 6 tenants.timezone): pure parsing so the
 * route and the tests share one definition. Everything is optional except the ownership checkbox.
 */
export const OWNERSHIP_TEXT = 'This is my business and I have the right to use its name, logo and content.'

export const US_TIME_ZONES = [
  { id: 'America/New_York', label: 'Eastern' },
  { id: 'America/Chicago', label: 'Central' },
  { id: 'America/Denver', label: 'Mountain' },
  { id: 'America/Phoenix', label: 'Arizona (no daylight saving)' },
  { id: 'America/Los_Angeles', label: 'Pacific' },
  { id: 'America/Anchorage', label: 'Alaska' },
  { id: 'Pacific/Honolulu', label: 'Hawaii' },
] as const
export type UsTimeZone = (typeof US_TIME_ZONES)[number]['id']
const ZONE_IDS = new Set<string>(US_TIME_ZONES.map((z) => z.id))
export const isUsTimeZone = (v: unknown): v is UsTimeZone => typeof v === 'string' && ZONE_IDS.has(v)

const EASTERN = 'CT DE DC FL GA IN KY ME MD MA MI NH NJ NY NC OH PA RI SC VT VA WV'
const CENTRAL = 'AL AR IL IA KS LA MN MS MO NE ND OK SD TN TX WI'
const MOUNTAIN = 'CO ID MT NM UT WY'
const PACIFIC = 'CA NV OR WA'
const STATE_ZONE: Record<string, UsTimeZone> = {
  ...Object.fromEntries(EASTERN.split(' ').map((s) => [s, 'America/New_York'])),
  ...Object.fromEntries(CENTRAL.split(' ').map((s) => [s, 'America/Chicago'])),
  ...Object.fromEntries(MOUNTAIN.split(' ').map((s) => [s, 'America/Denver'])),
  ...Object.fromEntries(PACIFIC.split(' ').map((s) => [s, 'America/Los_Angeles'])),
  AZ: 'America/Phoenix', AK: 'America/Anchorage', HI: 'Pacific/Honolulu',
}
export const US_STATES = Object.keys(STATE_ZONE).sort()

/** A best guess from the address; the owner can change it any time. El Paso keeps Mountain time. */
export function zoneForAddress(state: string | undefined, city: string | undefined): UsTimeZone | null {
  if (!state) return null
  if (state === 'TX' && city && /^el paso$/i.test(city.trim())) return 'America/Denver'
  return STATE_ZONE[state] ?? null
}

/** US numbers in any common shape ("(915) 555-0123", "915.555.0123", "+1 915 555 0123") → +1XXXXXXXXXX. */
export function normalizeUsPhone(raw: string): string | null {
  const digits = raw.replace(/[\s().-]/g, '')
  const m = /^(?:\+?1)?([2-9]\d{2}[2-9]\d{6})$/.exec(digits)
  return m ? `+1${m[1]}` : null
}

export const DAYS = [
  { id: 'mon', label: 'Monday' }, { id: 'tue', label: 'Tuesday' }, { id: 'wed', label: 'Wednesday' },
  { id: 'thu', label: 'Thursday' }, { id: 'fri', label: 'Friday' }, { id: 'sat', label: 'Saturday' }, { id: 'sun', label: 'Sunday' },
] as const

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/
const str = (f: FormData, k: string, max: number) => {
  const v = f.get(k)
  return typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : ''
}

export type ClaimFields = {
  attested: boolean
  phone?: string
  address?: NonNullable<Business['address']>
  hours?: NonNullable<Business['hours']>
  timezone: UsTimeZone | null
}
export type ClaimFieldError = 'attest' | 'phone' | 'address' | 'hours'

export const CLAIM_ERRORS: Record<ClaimFieldError | 'changed' | 'expired' | 'gone', string> = {
  attest: 'Please tick the box to confirm this is your business.',
  phone: 'That phone number doesn’t look right. Use a 10-digit US number, like 915-555-0123.',
  address: 'Please fill in the street, city, state and ZIP, or leave the whole address empty.',
  hours: 'Each open day needs an opening and a closing time. Tick “Closed” for days you’re closed.',
  changed: 'Your draft changed in another window while you were here. Please check your details and send them again.',
  expired: 'This draft has expired. Start a new one from the demo.',
  gone: 'We couldn’t find this draft in this browser.',
}

/** Parse the claim form. Returns the first problem, so the page can say exactly what to fix. */
export function parseClaimForm(f: FormData): { ok: true; value: ClaimFields } | { ok: false; error: ClaimFieldError } {
  if (f.get('attest') !== 'on') return { ok: false, error: 'attest' }

  const value: ClaimFields = { attested: true, timezone: null }
  const phoneRaw = str(f, 'phone', 40)
  if (phoneRaw) {
    const phone = normalizeUsPhone(phoneRaw)
    if (!phone) return { ok: false, error: 'phone' }
    value.phone = phone
  }

  const line1 = str(f, 'line1', 120), line2 = str(f, 'line2', 120), city = str(f, 'city', 80)
  const state = str(f, 'state', 2).toUpperCase(), postal = str(f, 'postal', 10)
  if (line1 || line2 || city || state || postal) {
    if (!line1 || !city || !STATE_ZONE[state] || !/^\d{5}(-\d{4})?$/.test(postal)) return { ok: false, error: 'address' }
    value.address = { line1, ...(line2 ? { line2 } : {}), city, region: state, postal, country: 'US' }
  }

  const hours: NonNullable<Business['hours']> = []
  for (const d of DAYS) {
    const closed = f.get(`${d.id}-closed`) === 'on'
    const open = str(f, `${d.id}-open`, 5), close = str(f, `${d.id}-close`, 5)
    if (closed) { hours.push({ day: d.id, closed: true }); continue }
    if (!open && !close) continue
    if (!HHMM.test(open) || !HHMM.test(close)) return { ok: false, error: 'hours' }
    hours.push({ day: d.id, open, close })
  }
  if (hours.length) value.hours = hours

  const tz = str(f, 'timezone', 40)
  value.timezone = isUsTimeZone(tz) ? tz : zoneForAddress(value.address?.region, value.address?.city)
  return { ok: true, value }
}
