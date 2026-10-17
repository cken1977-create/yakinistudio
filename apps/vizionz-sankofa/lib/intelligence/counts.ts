// VIZIONZ SANKOFA · Intelligence · "How many …?" answered straight from SQL
//
// Simple count questions never go to an AI provider. They are parsed here
// and answered with a COUNT through the asker's own RLS-scoped client, so
// a case manager's answer only counts their caseload.

import type { SupabaseClient } from '@supabase/supabase-js'

export type CountEntity = 'participants' | 'intakes' | 'donors' | 'case_notes'
export type CountPeriod = 'today' | 'week' | 'month' | 'year'

export type CountQuestion = {
  entity: CountEntity
  stage?: string
  status?: string
  returningOnly?: boolean
  period?: CountPeriod
}

const STAGES: Array<[RegExp, string, string]> = [
  [/\bin (?:the )?review\b|\bunder review\b|\bbeing reviewed\b/, 'review', 'in review'],
  [/\bconsent(?:s)? signed\b|\bsigned consent\b/, 'consent_signed', 'with consent signed'],
  [/\benrolled\b/, 'enrolled', 'enrolled'],
  [/\b(?:receiving|getting) services\b/, 'receiving_services', 'receiving services'],
  [/\breadiness (?:evaluation|assessment)\b|\bbeing evaluated\b/, 'readiness_evaluation', 'in readiness evaluation'],
  [/\bcertified\b/, 'certified', 'certified'],
  [/\bexited\b|\bhave left\b/, 'exited', 'exited'],
  [/\bat intake\b|\bin intake\b/, 'intake', 'at intake'],
]

export function parseCountQuestion(raw: string): CountQuestion | null {
  const q = raw.toLowerCase().replace(/[?!.]+$/g, '').replace(/\s+/g, ' ').trim()
  if (!/^(?:how many|number of|count of|count)\b/.test(q)) return null
  if (q.length > 120) return null
  // Anything comparative or explanatory goes to the full Intelligence path.
  if (/\b(why|compare|versus|vs\.?|trend|percent|average|per |by |each|and|or|which|who)\b/.test(q)) return null

  let entity: CountEntity | null = null
  if (/\b(intakes?|requests?|applications?|get-help|referrals?)\b/.test(q)) entity = 'intakes'
  else if (/\b(donors?|givers?)\b/.test(q)) entity = 'donors'
  else if (/\b(contacts?|case notes?|notes|visits|calls)\b/.test(q)) entity = 'case_notes'
  else if (/\b(participants?|clients?|people|persons|individuals|families|caseload)\b/.test(q)) entity = 'participants'
  if (!entity) return null

  const out: CountQuestion = { entity }
  if (/\breturning\b|\bcame back\b|\bcome back\b/.test(q)) out.returningOnly = true
  if (entity === 'participants') {
    for (const [re, stage] of STAGES) if (re.test(q)) { out.stage = stage; break }
    if (!out.stage && /\bactive\b/.test(q)) out.status = 'active'
  }
  if (entity === 'intakes' && /\bnew\b/.test(q) && !/\bnew this\b/.test(q)) out.status = 'new'
  if (/\btoday\b/.test(q)) out.period = 'today'
  else if (/\bthis week\b|\blast 7 days\b/.test(q)) out.period = 'week'
  else if (/\bthis month\b|\blast 30 days\b/.test(q)) out.period = 'month'
  else if (/\bthis year\b/.test(q)) out.period = 'year'
  return out
}

function periodStart(p: CountPeriod, now = new Date()): string {
  const d = new Date(now)
  if (p === 'today') d.setHours(0, 0, 0, 0)
  else if (p === 'week') d.setTime(d.getTime() - 7 * 86400000)
  else if (p === 'month') d.setTime(d.getTime() - 30 * 86400000)
  else { d.setMonth(0, 1); d.setHours(0, 0, 0, 0) }
  return d.toISOString()
}

const PERIOD_LABEL: Record<CountPeriod, string> = {
  today: 'today', week: 'in the last 7 days', month: 'in the last 30 days', year: 'this year',
}

export async function answerCountQuestion(
  supabase: SupabaseClient,
  cq: CountQuestion,
  opts: { caseloadOnly: boolean }
): Promise<{ count: number; answer: string }> {
  const table = cq.entity === 'intakes' ? 'intake_requests' : cq.entity
  let q = supabase.from(table).select('*', { count: 'exact', head: true })
  if (cq.stage) q = q.eq('current_stage', cq.stage)
  if (cq.status) q = q.eq('status', cq.status)
  if (cq.returningOnly && (cq.entity === 'participants' || cq.entity === 'intakes')) q = q.eq('is_returning', true)
  if (cq.period) q = q.gte(cq.entity === 'case_notes' ? 'occurred_at' : 'created_at', periodStart(cq.period))
  const { count, error } = await q
  if (error) throw new Error(`count failed: ${error.message}`)
  const n = count ?? 0

  const noun = {
    participants: n === 1 ? 'client' : 'clients',
    intakes: n === 1 ? 'intake request' : 'intake requests',
    donors: n === 1 ? 'donor' : 'donors',
    case_notes: n === 1 ? 'logged contact' : 'logged contacts',
  }[cq.entity]
  const parts = [`${n.toLocaleString('en-US')}${cq.returningOnly ? ' returning' : ''}${cq.status === 'new' ? ' new' : cq.status === 'active' ? ' active' : ''} ${noun}`]
  if (cq.stage) parts.push(STAGES.find(([, s]) => s === cq.stage)?.[2] ?? cq.stage)
  if (cq.period) parts.push(PERIOD_LABEL[cq.period])
  const scope = opts.caseloadOnly && cq.entity !== 'donors' ? ' in your caseload' : ''
  return {
    count: n,
    answer: `${parts.join(' ')}${scope}. (Counted directly from VS records — no AI used.)`,
  }
}
