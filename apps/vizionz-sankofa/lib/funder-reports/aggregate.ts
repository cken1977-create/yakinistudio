// VIZIONZ SANKOFA · funder report aggregation (pure; unit-tested)
//
// Input is the single participant entry (participants + services_delivered)
// already scoped by RLS to what the signed-in user may see. Output is
// aggregate, de-identified counts (brief §3: "Reporting: aggregate,
// de-identified data").

import { FUNDERS, SERVICE_COUNTY_LABELS, isServiceCounty, type Funder, type FunderKey, type ServiceCounty } from './funders'
import { inPeriod, mountainDate, type Period } from './period'

export type ReportParticipant = {
  id: string
  gender: string | null
  race_ethnicity: string[] | null
  primary_language: string | null
  veteran_status: boolean | null
  disability_status: boolean | null
  household_size: number | null
  intake_date: string | null
  current_stage?: string | null
  service_county?: string | null
}

export type ReportService = {
  participant_id: string
  service_type_id: string
  delivered_at: string
  units: number | string | null
  funder_key?: string | null
  service_county?: string | null
}

export type ServiceTypeInfo = { id: string; name: string; countable_unit: string | null }

/** From vs_report_flags(): birth year and masked Medicaid last-4 only. */
export type ReportFlags = { participant_id: string; dob_year: number | null; medicaid_last4: string | null }

export type CountRow = { label: string; count: number }
export type CountyKey = ServiceCounty | 'unspecified'

export type FunderReport = {
  funder: Funder
  period: Period
  participantsServed: number
  newParticipants: number
  services: number
  units: number
  byServiceType: { name: string; unit: string; services: number; units: number; participants: number }[]
  byCounty: { county: CountyKey; label: string; participants: number; services: number; units: number }[]
  byFunder: { key: FunderKey | 'untagged'; label: string; participants: number; services: number; units: number }[]
  stages: CountRow[]
  demographics: {
    gender: CountRow[]
    raceEthnicity: CountRow[]
    age: CountRow[]
    veteran: CountRow[]
    disability: CountRow[]
    language: CountRow[]
    household: CountRow[]
  }
  medicaid: { participantsWithId: number; participantsMissingId: number; servicesMissingId: number } | null
  /** Participant ids in the report (never rendered; used for the consented roster). */
  participantIds: string[]
}

export const STAGE_LABELS: Record<string, string> = {
  intake: 'Referral / intake',
  review: 'Review',
  consent_signed: 'Consent signed',
  enrolled: 'Enrolled',
  receiving_services: 'Receiving services',
  readiness_evaluation: 'Readiness evaluation',
  certified: 'Certified',
  exited: 'Exited',
}

const AGE_BANDS: [number, number, string][] = [
  [0, 17, 'Under 18'],
  [18, 24, '18–24'],
  [25, 34, '25–34'],
  [35, 44, '35–44'],
  [45, 54, '45–54'],
  [55, 64, '55–64'],
  [65, 200, '65 and over'],
]

export function ageBand(dobYear: number | null | undefined, asOfYear: number): string {
  if (!dobYear) return 'Not recorded'
  const age = asOfYear - dobYear
  const band = AGE_BANDS.find(([lo, hi]) => age >= lo && age <= hi)
  return band ? band[2] : 'Not recorded'
}

function num(v: number | string | null | undefined): number {
  const n = typeof v === 'string' ? Number(v) : v ?? 0
  return Number.isFinite(n) ? (n as number) : 0
}

function tally(values: string[], order?: string[]): CountRow[] {
  const m = new Map<string, number>()
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1)
  const rows = [...m.entries()].map(([label, count]) => ({ label, count }))
  if (order) return rows.sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label))
  return rows.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

function tidy(v: string | null | undefined): string {
  const t = (v ?? '').trim()
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : 'Not recorded'
}

function yesNo(v: boolean | null | undefined): string {
  return v === true ? 'Yes' : v === false ? 'No' : 'Not recorded'
}

function household(n: number | null | undefined): string {
  if (!n || n < 1) return 'Not recorded'
  if (n === 1) return '1 person'
  if (n <= 3) return '2–3 people'
  if (n <= 5) return '4–5 people'
  return '6 or more'
}

/** Service county: what was recorded on the service, else the participant's county. */
export function countyFor(s: ReportService, p: ReportParticipant | undefined): CountyKey {
  if (isServiceCounty(s.service_county)) return s.service_county
  if (p && isServiceCounty(p.service_county)) return p.service_county
  return 'unspecified'
}

/** Services that count toward this funder's report in the period. */
export function servicesForFunder(funder: Funder, services: ReportService[], period: Period): ReportService[] {
  return services.filter(
    (s) => inPeriod(mountainDate(s.delivered_at), period) && (funder.scope === 'all' || s.funder_key === funder.key),
  )
}

export function buildFunderReport(args: {
  funder: Funder
  period: Period
  participants: ReportParticipant[]
  services: ReportService[]
  serviceTypes: ServiceTypeInfo[]
  flags?: ReportFlags[]
  /** ACF only: participants whose intake fell in the period but have no service yet. */
  intakesInPeriod?: ReportParticipant[]
}): FunderReport {
  const { funder, period } = args
  const pById = new Map(args.participants.map((p) => [p.id, p]))
  for (const p of args.intakesInPeriod ?? []) if (!pById.has(p.id)) pById.set(p.id, p)
  const typeById = new Map(args.serviceTypes.map((t) => [t.id, t]))
  const flagById = new Map((args.flags ?? []).map((f) => [f.participant_id, f]))

  const svc = servicesForFunder(funder, args.services, period)
  const served = new Set(svc.map((s) => s.participant_id))
  // The fiscal sponsor also sees people who came in during the period.
  if (funder.scope === 'all') {
    for (const p of args.intakesInPeriod ?? []) if (p.intake_date && inPeriod(p.intake_date, period)) served.add(p.id)
  }
  const people = [...served].map((id) => pById.get(id)).filter((p): p is ReportParticipant => !!p)

  const byType = new Map<string, { name: string; unit: string; services: number; units: number; people: Set<string> }>()
  const byCounty = new Map<CountyKey, { people: Set<string>; services: number; units: number }>()
  const byFunder = new Map<string, { people: Set<string>; services: number; units: number }>()
  let units = 0
  let servicesMissingId = 0
  for (const s of svc) {
    const u = num(s.units)
    units += u
    const t = typeById.get(s.service_type_id)
    const tk = t?.id ?? 'unknown'
    const tr = byType.get(tk) ?? { name: t?.name ?? 'Unknown service', unit: t?.countable_unit ?? 'unit', services: 0, units: 0, people: new Set<string>() }
    tr.services += 1
    tr.units += u
    tr.people.add(s.participant_id)
    byType.set(tk, tr)

    const c = countyFor(s, pById.get(s.participant_id))
    const cr = byCounty.get(c) ?? { people: new Set<string>(), services: 0, units: 0 }
    cr.services += 1
    cr.units += u
    cr.people.add(s.participant_id)
    byCounty.set(c, cr)

    const fk = s.funder_key ?? 'untagged'
    const fr = byFunder.get(fk) ?? { people: new Set<string>(), services: 0, units: 0 }
    fr.services += 1
    fr.units += u
    fr.people.add(s.participant_id)
    byFunder.set(fk, fr)

    if (funder.key === 'medicaid' && !flagById.get(s.participant_id)?.medicaid_last4) servicesMissingId += 1
  }

  const asOfYear = Number(period.end.slice(0, 4))
  const countyOrder: CountyKey[] = ['bernalillo', 'lea', 'other', 'unspecified']
  const funderOrder = [...FUNDERS.map((f) => f.key as string), 'untagged']
  const withId = people.filter((p) => !!flagById.get(p.id)?.medicaid_last4).length

  return {
    funder,
    period,
    participantsServed: people.length,
    newParticipants: people.filter((p) => p.intake_date && inPeriod(p.intake_date, period)).length,
    services: svc.length,
    units,
    byServiceType: [...byType.values()]
      .map((t) => ({ name: t.name, unit: t.unit, services: t.services, units: t.units, participants: t.people.size }))
      .sort((a, b) => b.services - a.services || a.name.localeCompare(b.name)),
    byCounty: countyOrder
      .filter((c) => byCounty.has(c) || (funder.byCounty && c !== 'other' && c !== 'unspecified'))
      .map((c) => {
        const r = byCounty.get(c)
        return { county: c, label: SERVICE_COUNTY_LABELS[c], participants: r?.people.size ?? 0, services: r?.services ?? 0, units: r?.units ?? 0 }
      }),
    byFunder: funderOrder
      .filter((k) => byFunder.has(k))
      .map((k) => {
        const r = byFunder.get(k)!
        const f = FUNDERS.find((x) => x.key === k)
        return { key: k as FunderKey | 'untagged', label: f ? f.short : 'Not tagged to a funder', participants: r.people.size, services: r.services, units: r.units }
      }),
    stages: tally(
      people.map((p) => STAGE_LABELS[p.current_stage ?? ''] ?? 'Not recorded'),
      [...Object.values(STAGE_LABELS), 'Not recorded'],
    ),
    demographics: {
      gender: tally(people.map((p) => tidy(p.gender))),
      raceEthnicity: tally(people.flatMap((p) => (p.race_ethnicity && p.race_ethnicity.length ? p.race_ethnicity.map(tidy) : ['Not recorded']))),
      age: tally(people.map((p) => ageBand(flagById.get(p.id)?.dob_year, asOfYear)), [...AGE_BANDS.map((b) => b[2]), 'Not recorded']),
      veteran: tally(people.map((p) => yesNo(p.veteran_status)), ['Yes', 'No', 'Not recorded']),
      disability: tally(people.map((p) => yesNo(p.disability_status)), ['Yes', 'No', 'Not recorded']),
      language: tally(people.map((p) => tidy(p.primary_language))),
      household: tally(people.map((p) => household(p.household_size)), ['1 person', '2–3 people', '4–5 people', '6 or more', 'Not recorded']),
    },
    medicaid: funder.key === 'medicaid' ? { participantsWithId: withId, participantsMissingId: people.length - withId, servicesMissingId } : null,
    participantIds: people.map((p) => p.id),
  }
}

// ─── CSV ────────────────────────────────────────────────────────────

export function toCsv(rows: (string | number)[][]): string {
  return rows
    .map((r) =>
      r
        .map((v) => {
          let s = String(v)
          // Spreadsheet formula injection guard.
          if (/^[=+\-@]/.test(s) && typeof v === 'string') s = `'${s}`
          return `"${s.replace(/"/g, '""')}"`
        })
        .join(','),
    )
    .join('\r\n')
}

/** Aggregate, de-identified summary as CSV rows: section, measure, value(s). */
export function summaryCsvRows(r: FunderReport, scopeNote: string): (string | number)[][] {
  const rows: (string | number)[][] = [
    ['Section', 'Measure', 'Participants', 'Services', 'Units'],
    ['Report', r.funder.name, '', '', ''],
    ['Report', `Period ${r.period.start} to ${r.period.end}`, '', '', ''],
    ['Report', scopeNote, '', '', ''],
    ['Totals', 'Unduplicated participants served', r.participantsServed, '', ''],
    ['Totals', 'New participants (intake in period)', r.newParticipants, '', ''],
    ['Totals', 'Services delivered', '', r.services, r.units],
  ]
  if (r.funder.byCounty || r.byCounty.length > 1)
    for (const c of r.byCounty) rows.push(['Service county', c.label, c.participants, c.services, c.units])
  if (r.funder.scope === 'all') for (const f of r.byFunder) rows.push(['By funder', f.label, f.participants, f.services, f.units])
  for (const t of r.byServiceType) rows.push(['Service type', `${t.name} (${t.unit})`, t.participants, t.services, t.units])
  if (r.medicaid) {
    rows.push(['Medicaid', 'Participants with Medicaid ID on file', r.medicaid.participantsWithId, '', ''])
    rows.push(['Medicaid', 'Participants missing a Medicaid ID', r.medicaid.participantsMissingId, '', ''])
    rows.push(['Medicaid', 'Services for participants missing a Medicaid ID', '', r.medicaid.servicesMissingId, ''])
  }
  for (const s of r.stages) rows.push(['Current stage', s.label, s.count, '', ''])
  const d = r.demographics
  const demo: [string, CountRow[]][] = [
    ['Gender', d.gender],
    ['Race / ethnicity', d.raceEthnicity],
    ['Age', d.age],
    ['Veteran', d.veteran],
    ['Disability', d.disability],
    ['Primary language', d.language],
    ['Household size', d.household],
  ]
  for (const [section, list] of demo) for (const c of list) rows.push([section, c.label, c.count, '', ''])
  return rows
}
