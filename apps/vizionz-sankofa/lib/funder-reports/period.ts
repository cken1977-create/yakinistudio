// Report periods, as Mountain-time calendar dates (VS is in Albuquerque).

export type PeriodPreset = 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'ytd' | 'last_year' | 'custom'

export type Period = { preset: PeriodPreset; start: string; end: string; label: string }

export const PERIOD_PRESETS: { key: PeriodPreset; label: string }[] = [
  { key: 'this_month', label: 'This month' },
  { key: 'last_month', label: 'Last month' },
  { key: 'this_quarter', label: 'This quarter' },
  { key: 'last_quarter', label: 'Last quarter' },
  { key: 'ytd', label: 'Year to date' },
  { key: 'last_year', label: 'Last year' },
  { key: 'custom', label: 'Custom' },
]

const ISO = /^\d{4}-\d{2}-\d{2}$/

/** A timestamp as a YYYY-MM-DD date in America/Denver. */
export function mountainDate(ts: string | Date): string {
  const d = typeof ts === 'string' ? new Date(ts) : ts
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Denver', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

function iso(y: number, m: number, d: number): string {
  // m is 1-based; Date.UTC handles month/day overflow.
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.toISOString().slice(0, 10)
}

function fmt(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })
}

export function resolvePeriod(
  params: { period?: string | null; from?: string | null; to?: string | null },
  today: string,
): Period {
  const [y, m] = today.split('-').map(Number)
  const q = Math.floor((m - 1) / 3)
  const preset = (PERIOD_PRESETS.some((p) => p.key === params.period) ? params.period : 'this_month') as PeriodPreset
  let start: string
  let end: string
  switch (preset) {
    case 'last_month':
      start = iso(y, m - 1, 1)
      end = iso(y, m, 0)
      break
    case 'this_quarter':
      start = iso(y, q * 3 + 1, 1)
      end = iso(y, q * 3 + 4, 0)
      break
    case 'last_quarter':
      start = iso(y, q * 3 - 2, 1)
      end = iso(y, q * 3 + 1, 0)
      break
    case 'ytd':
      start = iso(y, 1, 1)
      end = today
      break
    case 'last_year':
      start = iso(y - 1, 1, 1)
      end = iso(y - 1, 12, 31)
      break
    case 'custom': {
      const f = params.from && ISO.test(params.from) ? params.from : iso(y, m, 1)
      const t = params.to && ISO.test(params.to) ? params.to : today
      start = f <= t ? f : t
      end = f <= t ? t : f
      break
    }
    default:
      start = iso(y, m, 1)
      end = iso(y, m + 1, 0)
  }
  return { preset, start, end, label: `${fmt(start)} – ${fmt(end)}` }
}

/** UTC bounds wide enough to cover the Mountain-time period (filter exactly afterwards). */
export function queryBounds(p: Period): { gte: string; lt: string } {
  const [ys, ms, ds] = p.start.split('-').map(Number)
  const [ye, me, de] = p.end.split('-').map(Number)
  return {
    gte: new Date(Date.UTC(ys, ms - 1, ds - 1)).toISOString(),
    lt: new Date(Date.UTC(ye, me - 1, de + 2)).toISOString(),
  }
}

export function inPeriod(dateIso: string, p: Period): boolean {
  return dateIso >= p.start && dateIso <= p.end
}
