import 'server-only'
import { funnel } from './db'
import { weekRange, fmtDate } from './time'
import { SOURCE_LABEL } from '@/config/funnel'

export type Weekly = {
  label: string
  visits: number
  visits_by_source: Record<string, number>
  leads: number
  leads_by_source: Record<string, number>
  quoted: number
  booked: number
  booked_cents: number
  lost: number
  open_pipeline: number
  median_reply_minutes: number | null
}

export async function weeklyNumbers(which: 'last' | 'this'): Promise<Weekly> {
  const { from, to } = weekRange(which)
  const r = await funnel<Omit<Weekly, 'label'>>('weekly', { from: from.toISOString(), to: to.toISOString(), exclude_test: process.env.VERCEL_ENV === 'production' })
  const label = `${fmtDate(from.toISOString(), { month: 'short', day: 'numeric' })} – ${fmtDate(new Date(to.getTime() - 3600_000).toISOString(), { month: 'short', day: 'numeric', year: 'numeric' })}`
  return { label, ...r }
}

const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : '—')
export const money = (c: number) => `$${(c / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
export const srcList = (o: Record<string, number>) =>
  Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${SOURCE_LABEL[k] ?? k} ${v}`).join(' · ') || 'none yet'
export function replyTime(m: number | null) {
  if (m == null) return 'not measured yet (mark leads as replied)'
  return m < 120 ? `${m} min` : `${Math.round(m / 60)} hr`
}

export function weeklyLines(w: Weekly) {
  return [
    `Visits to the catering page: ${w.visits} (${srcList(w.visits_by_source)})`,
    `Quote requests (leads): ${w.leads} (${srcList(w.leads_by_source)})`,
    `Visit → lead: ${pct(w.leads, w.visits)}`,
    `Quotes sent: ${w.quoted}`,
    `Booked: ${w.booked}${w.booked_cents ? ` (${money(w.booked_cents)} in quotes)` : ''}`,
    `Lost: ${w.lost}`,
    `Still open in the pipeline: ${w.open_pipeline}`,
    `Typical time to first reply: ${replyTime(w.median_reply_minutes)}`,
  ]
}
