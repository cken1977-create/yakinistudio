// Server-only: reads for the /dashboard/class admin view and its CSV export.
import { rest } from '@/lib/esign/server'
import { CLASS_SLUG } from './config'
import { tablesMissing } from './server'

export type AdminRow = {
  id: string; created_at: string; first_name: string; email: string; language: string; country: string | null
  source: string; utm_campaign: string | null; phone: string | null; sms_consent: boolean; started_at: string | null
  watched_at: string | null; unsubscribed_at: string | null; stage: string; timezone: string | null; referrer: string | null
  utm_source: string | null; utm_medium: string | null
}

export type Filters = { from?: string; to?: string; lang?: string; country?: string; source?: string }

const DAY = /^\d{4}-\d{2}-\d{2}$/

export function readFilters(sp: Record<string, string | string[] | undefined>): Filters {
  const one = (k: string) => { const v = sp[k]; return typeof v === 'string' ? v.trim() : undefined }
  const f: Filters = {}
  const from = one('from'), to = one('to'), lang = one('lang'), country = one('country')?.toUpperCase(), source = one('source')
  if (from && DAY.test(from)) f.from = from
  if (to && DAY.test(to)) f.to = to
  if (lang === 'en' || lang === 'es') f.lang = lang
  if (country && /^[A-Z]{2}$/.test(country)) f.country = country
  if (source && /^[a-z]{1,20}$/.test(source)) f.source = source
  return f
}

export function filterQuery(f: Filters): string {
  const q: string[] = [`class_slug=eq.${CLASS_SLUG}`]
  if (f.from) q.push(`created_at=gte.${f.from}T00:00:00Z`)
  if (f.to) q.push(`created_at=lt.${new Date(Date.parse(`${f.to}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10)}T00:00:00Z`)
  if (f.lang) q.push(`language=eq.${f.lang}`)
  if (f.country) q.push(`country=eq.${f.country}`)
  if (f.source) q.push(`source=eq.${f.source}`)
  return q.join('&')
}

const COLS = 'id,created_at,first_name,email,language,country,source,utm_source,utm_medium,utm_campaign,phone,sms_consent,started_at,watched_at,unsubscribed_at,stage,timezone,referrer'

/** Up to 10,000 rows, newest first. `missing` = migration not applied yet. */
export async function loadSignups(f: Filters): Promise<{ rows: AdminRow[]; missing: boolean; error?: string }> {
  try {
    const r = await rest<AdminRow[]>(`class_signups?${filterQuery(f)}&select=${COLS}&order=created_at.desc&limit=10000`)
    if (tablesMissing(r)) return { rows: [], missing: true }
    if (!r.ok) return { rows: [], missing: false, error: `load failed (${r.status})` }
    return { rows: r.data ?? [], missing: false }
  } catch (e) {
    return { rows: [], missing: false, error: (e as Error).message }
  }
}

export async function loadEmailStats(): Promise<Record<string, number>> {
  const r = await rest<{ status: string }[]>(`class_emails?select=status&limit=50000`)
  const out: Record<string, number> = {}
  if (r.ok) for (const e of r.data ?? []) out[e.status] = (out[e.status] ?? 0) + 1
  return out
}

const cell = (v: unknown) => {
  let s = v == null ? '' : String(v)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}` // stop spreadsheet formula injection
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(rows: AdminRow[]): string {
  const head = ['signed_up', 'first_name', 'email', 'language', 'country', 'source', 'utm_source', 'utm_medium', 'utm_campaign', 'phone', 'sms_consent', 'started', 'watched', 'unsubscribed', 'stage', 'timezone', 'referrer']
  const lines = rows.map((r) => [r.created_at, r.first_name, r.email, r.language, r.country, r.source, r.utm_source, r.utm_medium, r.utm_campaign, r.phone, r.sms_consent ? 'yes' : 'no', r.started_at, r.watched_at, r.unsubscribed_at, r.stage, r.timezone, r.referrer].map(cell).join(','))
  return '\uFEFF' + [head.join(','), ...lines].join('\r\n') + '\r\n'
}
