// Time helpers. Momma Sally's is in Abilene, TX (US Central).
export const BIZ_TZ = 'America/Chicago'

function offsetMs(at: number, zone: string) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })
    .formatToParts(new Date(at)).filter((x) => x.type !== 'literal').map((x) => [x.type, Number(x.value)]))
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - at
}

/** UTC instant for a wall-clock time in the business time zone. */
export function zonedInstant(y: number, m: number, d: number, hour = 0, minute = 0, zone = BIZ_TZ): Date {
  const guess = Date.UTC(y, m - 1, d, hour, minute, 0)
  let t = guess - offsetMs(guess, zone)
  t = guess - offsetMs(t, zone)
  return new Date(t)
}

export function zonedParts(at: Date, zone = BIZ_TZ) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: zone, year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short' })
    .formatToParts(at).filter((x) => x.type !== 'literal').map((x) => [x.type, x.value]))
  return { y: Number(p.year), m: Number(p.month), d: Number(p.day), weekday: String(p.weekday) }
}

/** 10:00 AM business time, `days` days after `from`. Keeps follow-ups in daytime hours. */
export function daysLaterAt10(days: number, from = new Date()): Date {
  const p = zonedParts(from)
  return zonedInstant(p.y, p.m, p.d + days, 10, 0)
}

/** The Monday–Sunday week (business time) before the week containing `now`, or containing it. */
export function weekRange(which: 'last' | 'this', now = new Date()) {
  const p = zonedParts(now)
  const dow = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(p.weekday)
  const thisMonday = zonedInstant(p.y, p.m, p.d - dow, 0, 0)
  const mp = zonedParts(new Date(thisMonday.getTime() + 3600_000))
  const from = which === 'this' ? thisMonday : zonedInstant(mp.y, mp.m, mp.d - 7, 0, 0)
  const fp = zonedParts(new Date(from.getTime() + 3600_000))
  const to = zonedInstant(fp.y, fp.m, fp.d + 7, 0, 0)
  return { from, to }
}

export function fmtDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!iso) return '—'
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00Z`) : new Date(iso)
  return new Intl.DateTimeFormat('en-US', { timeZone: /^\d{4}-\d{2}-\d{2}$/.test(iso) ? 'UTC' : BIZ_TZ, ...opts }).format(d)
}

export function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-US', { timeZone: BIZ_TZ, month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(new Date(iso))
}
