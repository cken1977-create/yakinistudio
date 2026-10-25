// VIZIONZ SANKOFA · date and time display
// Vizionz Sankofa works in Albuquerque, so every timestamp is shown in
// Mountain time no matter where the server runs (Vercel runs in UTC).
// Date-only values (YYYY-MM-DD, e.g. an intake date or a due date) are
// calendar dates, not instants: they are shown exactly as stored, never
// shifted by a time zone, so they can't drift by a day.

export const VS_TIME_ZONE = 'America/Denver'

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

const DAY_OPTS: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
const DATETIME_OPTS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
}

export function isDateOnly(value: string): boolean {
  return DATE_ONLY.test(value)
}

/** A calendar date (or the Mountain-time date of a timestamp), e.g. "Jun 2, 2026". */
export function formatDateValue(
  value: string | Date | null | undefined,
  opts: Intl.DateTimeFormatOptions = DAY_OPTS,
): string {
  if (value == null || value === '') return ''
  if (typeof value === 'string' && isDateOnly(value)) {
    const [y, m, d] = value.split('-').map(Number)
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' })
  }
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-US', { ...opts, timeZone: VS_TIME_ZONE })
}

/** A moment in Mountain time, e.g. "Oct 25, 2026, 9:18 AM". Date-only values fall back to the plain date. */
export function formatDateTimeValue(
  value: string | Date | null | undefined,
  opts: Intl.DateTimeFormatOptions = DATETIME_OPTS,
): string {
  if (value == null || value === '') return ''
  if (typeof value === 'string' && isDateOnly(value)) return formatDateValue(value)
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('en-US', { ...opts, timeZone: VS_TIME_ZONE })
}

/** Today's date (YYYY-MM-DD) in Mountain time. */
export function todayInMountain(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: VS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}
