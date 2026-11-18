// Holiday Giveaway (yakini.digital/holiday): shared rules for the page, the API and the dashboard.
// No prices or dollar amounts anywhere on this page (public Yakini site rule).

export const HOLIDAY_CAMPAIGN = 'holiday-2026'
export const HOLIDAY_PATH = '/holiday'
export const HOLIDAY_URL = 'https://yakini.digital/holiday'
export const HOLIDAY_NOTIFY_TO = 'clarence@yakini.digital'
export const HOLIDAY_DEADLINE_LABEL = 'December 15, 2026'
/** Submissions close at the end of Dec 15, 2026 in Mountain Time (MST, UTC-7). */
export const HOLIDAY_CLOSES_AT = Date.parse('2026-12-16T07:00:00Z')
export const HOLIDAY_SPOTS = 5
/** Plus one future founder (someone starting a business): registration, setup and the full build. */
export const HOLIDAY_FOUNDER_SPOTS = 1

export type HolidayType = 'apply' | 'nominate' | 'founder'
export const HOLIDAY_TYPES: HolidayType[] = ['apply', 'nominate', 'founder']
export const isHolidayType = (v: unknown): v is HolidayType => v === 'apply' || v === 'nominate' || v === 'founder'

export type HolidayInput = {
  type: HolidayType
  name: string
  business_name: string
  email: string
  phone: string
  location: string
  what_they_do: string
  why_help: string
  nominator_name: string
  nominator_email: string
  nominator_phone: string
  /** Founder form only: "This is me" (the future founder is filling it in). */
  self_nominated: boolean
}

export const LIMITS: Record<keyof Omit<HolidayInput, 'type' | 'self_nominated'>, number> = {
  name: 120, business_name: 160, email: 254, phone: 40, location: 160,
  what_they_do: 2000, why_help: 4000, nominator_name: 120, nominator_email: 254, nominator_phone: 40,
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneOk = (s: string) => s.replace(/\D/g, '').length >= 7 && s.length <= 40

export function holidayClosed(now = Date.now()) {
  return now >= HOLIDAY_CLOSES_AT
}

/** Returns field -> message for every problem; empty object when the entry is good. */
export function validateHoliday(v: HolidayInput): Partial<Record<keyof HolidayInput, string>> {
  const e: Partial<Record<keyof HolidayInput, string>> = {}
  const nom = v.type === 'nominate'
  const founder = v.type === 'founder'
  const self = founder && v.self_nominated
  const theirs = nom || (founder && !self) // someone else is filling it in
  if (!v.name.trim()) e.name = theirs ? (founder ? 'Add the future founder’s name.' : 'Add the name of the person you are nominating.') : 'Add your name.'
  if (!founder && !v.business_name.trim()) e.business_name = 'Add the business or organization name.'
  if (v.location.trim().length < 2) e.location = 'Add the city and state.'
  if (v.what_they_do.trim().length < 2) e.what_they_do = founder ? 'Tell us the business idea.' : theirs ? 'Tell us what they do.' : 'Tell us what you do.'
  if (v.why_help.trim().length < 10) e.why_help = 'A sentence or two about why the help matters.'
  if (v.email.trim() && !EMAIL_RE.test(v.email.trim())) e.email = 'That email doesn’t look right.'
  if (v.phone.trim() && !phoneOk(v.phone.trim())) e.phone = 'That phone number doesn’t look right.'
  if (theirs) {
    if (!v.email.trim() && !v.phone.trim()) e.email = 'Add their email or phone so we can reach them.'
    if (!v.nominator_name.trim()) e.nominator_name = 'Add your name.'
    if (!v.nominator_email.trim()) e.nominator_email = 'Add your email.'
    else if (!EMAIL_RE.test(v.nominator_email.trim())) e.nominator_email = 'That email doesn’t look right.'
    if (v.nominator_phone.trim() && !phoneOk(v.nominator_phone.trim())) e.nominator_phone = 'That phone number doesn’t look right.'
  } else {
    if (!v.email.trim()) e.email = 'Add an email we can reach you at.'
    if (!v.phone.trim()) e.phone = 'Add a phone number.'
  }
  for (const [k, max] of Object.entries(LIMITS)) {
    if (String(v[k as keyof HolidayInput] ?? '').length > max) e[k as keyof HolidayInput] = 'That’s a little long. Please shorten it.'
  }
  return e
}
