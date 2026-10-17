// VIZIONZ SANKOFA · load one funder report from the single participant entry.
// Server-only. Every query runs as the signed-in user, so RLS decides scope:
// executives / operators / leadership see everyone, a case manager sees
// only their own caseload. Nothing here uses the service-role key.

import { createClient } from '@/lib/supabase/server'
import type { Funder } from './funders'
import { queryBounds, type Period } from './period'
import { buildFunderReport, type FunderReport, type ReportFlags, type ReportParticipant, type ReportService, type ServiceTypeInfo } from './aggregate'

type Supa = Awaited<ReturnType<typeof createClient>>
type Err = { code?: string; message?: string } | null

const PARTICIPANT_COLS =
  'id, gender, race_ethnicity, primary_language, veteran_status, disability_status, household_size, intake_date, current_stage, service_county'
const SERVICE_COLS = 'participant_id, service_type_id, delivered_at, units, funder_key, service_county'

async function pageAll<T>(fetchPage: (from: number, to: number) => PromiseLike<{ data: unknown; error: Err }>): Promise<{ rows: T[]; error: Err }> {
  const size = 1000
  const rows: T[] = []
  for (let from = 0; from < 50_000; from += size) {
    const { data, error } = await fetchPage(from, from + size - 1)
    if (error) return { rows, error }
    const batch = (data ?? []) as T[]
    rows.push(...batch)
    if (batch.length < size) break
  }
  return { rows, error: null }
}

function chunks<T>(list: T[], n: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < list.length; i += n) out.push(list.slice(i, i + n))
  return out
}

export type ReportData = {
  participants: ReportParticipant[]
  services: ReportService[]
  serviceTypes: ServiceTypeInfo[]
  flags: ReportFlags[]
  intakes: ReportParticipant[]
}

/** Rows for one funder (or, with funder = null / scope 'all', every funder) in the period. */
export async function loadReportData(supabase: Supa, funder: Funder | null, period: Period): Promise<{ data: ReportData | null; error: Err }> {
  const b = queryBounds(period)
  const tagged = funder?.scope === 'tagged' ? funder.key : null
  const svc = await pageAll<ReportService>((from, to) => {
    let q = supabase.from('services_delivered').select(SERVICE_COLS).gte('delivered_at', b.gte).lt('delivered_at', b.lt)
    if (tagged) q = q.eq('funder_key', tagged)
    return q.order('delivered_at', { ascending: true }).range(from, to)
  })
  if (svc.error) return { data: null, error: svc.error }

  let intakes: ReportParticipant[] = []
  if (!tagged) {
    const r = await pageAll<ReportParticipant>((from, to) =>
      supabase.from('participants').select(PARTICIPANT_COLS).gte('intake_date', period.start).lte('intake_date', period.end).range(from, to),
    )
    if (r.error) return { data: null, error: r.error }
    intakes = r.rows
  }

  const ids = [...new Set(svc.rows.map((s) => s.participant_id))]
  const participants: ReportParticipant[] = []
  for (const part of chunks(ids, 200)) {
    const { data, error } = await supabase.from('participants').select(PARTICIPANT_COLS).in('id', part)
    if (error) return { data: null, error }
    participants.push(...((data ?? []) as ReportParticipant[]))
  }

  const allIds = [...new Set([...ids, ...intakes.map((p) => p.id)])]
  const flags: ReportFlags[] = []
  for (const part of chunks(allIds, 500)) {
    const { data, error } = await supabase.rpc('vs_report_flags', { p_ids: part })
    if (error) return { data: null, error }
    flags.push(...((data ?? []) as ReportFlags[]))
  }

  const { data: types } = await supabase.from('service_types').select('id, name, countable_unit')
  return {
    data: { participants, services: svc.rows, serviceTypes: (types ?? []) as ServiceTypeInfo[], flags, intakes },
    error: null,
  }
}

export function reportFrom(data: ReportData, funder: Funder, period: Period): FunderReport {
  return buildFunderReport({
    funder,
    period,
    participants: data.participants,
    services: data.services,
    serviceTypes: data.serviceTypes,
    flags: data.flags,
    intakesInPeriod: funder.scope === 'all' ? data.intakes : [],
  })
}

/** Participants in the report with an active share_funder consent (for the roster CSV). */
export async function consentedRoster(supabase: Supa, report: FunderReport, funder: Funder, period: Period) {
  const now = new Date().toISOString()
  const consented = new Set<string>()
  for (const part of chunks(report.participantIds, 200)) {
    const { data, error } = await supabase
      .from('vs_consents')
      .select('participant_id, expires_at')
      .eq('scope', 'share_funder')
      .is('revoked_at', null)
      .in('participant_id', part)
    if (error) return { people: [], services: [] as ReportService[], error }
    for (const c of (data ?? []) as { participant_id: string; expires_at: string | null }[])
      if (!c.expires_at || c.expires_at > now) consented.add(c.participant_id)
  }
  const ids = [...consented]
  const people: { id: string; first_name: string; last_name: string; service_county: string | null; intake_date: string | null }[] = []
  for (const part of chunks(ids, 200)) {
    const { data } = await supabase.from('participants').select('id, first_name, last_name, service_county, intake_date').in('id', part)
    people.push(...((data ?? []) as typeof people))
  }
  const b = queryBounds(period)
  const svc = await pageAll<ReportService>((from, to) => {
    let q = supabase.from('services_delivered').select(SERVICE_COLS).gte('delivered_at', b.gte).lt('delivered_at', b.lt).in('participant_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
    if (funder.scope === 'tagged') q = q.eq('funder_key', funder.key)
    return q.range(from, to)
  })
  return { people, services: svc.rows, error: svc.error }
}
