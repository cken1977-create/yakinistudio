// Her business days run on Abilene time (US Central).
export const BUSINESS_TZ = 'America/Chicago'

export function todayInTz(tz = BUSINESS_TZ, now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function isIsoDate(s: string | undefined | null): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T12:00:00Z`))
}

export function formatWhen(ts: string | null | undefined, tz = BUSINESS_TZ): string {
  if (!ts) return '—'
  return new Intl.DateTimeFormat('en-US', { timeZone: tz, dateStyle: 'medium', timeStyle: 'short', timeZoneName: 'short' }).format(new Date(ts))
}
