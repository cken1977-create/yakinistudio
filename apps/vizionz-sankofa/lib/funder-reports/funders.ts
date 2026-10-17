// VIZIONZ SANKOFA · the six funders VS reports to (brief v3 + Housing NM update)
//
// Carly enters each participant and each service once. Every funder report
// is built from those same rows: a logged service carries a funder tag
// (services_delivered.funder_key) and a service county, and the report
// counts what was tagged to that funder. ACF is the fiscal sponsor, so its
// report covers all VS activity, with a breakdown by funder.

export const FUNDER_KEYS = ['acf', 'bernalillo_county', 'state_nm', 'city_abq', 'medicaid', 'housing_nm'] as const
export type FunderKey = (typeof FUNDER_KEYS)[number]

export type Funder = {
  key: FunderKey
  name: string
  short: string
  /** 'all' = every logged service (fiscal sponsor); 'tagged' = services tagged to this funder. */
  scope: 'all' | 'tagged'
  /** Split the report by service county (Bernalillo / Lea). */
  byCounty: boolean
  note: string
}

export const FUNDERS: Funder[] = [
  {
    key: 'acf',
    name: 'Albuquerque Community Foundation',
    short: 'ACF',
    scope: 'all',
    byCounty: false,
    note: 'Fiscal sponsor. Covers all VS activity in the period, with a breakdown by funder.',
  },
  { key: 'bernalillo_county', name: 'Bernalillo County', short: 'Bernalillo County', scope: 'tagged', byCounty: false, note: 'Services tagged to Bernalillo County.' },
  { key: 'state_nm', name: 'State of New Mexico', short: 'State of NM', scope: 'tagged', byCounty: false, note: 'Services tagged to the State of New Mexico.' },
  { key: 'city_abq', name: 'City of Albuquerque', short: 'City of Albuquerque', scope: 'tagged', byCounty: false, note: 'Services tagged to the City of Albuquerque.' },
  {
    key: 'medicaid',
    name: 'Medicaid',
    short: 'Medicaid',
    scope: 'tagged',
    byCounty: false,
    note: 'Services tagged to Medicaid, with Medicaid ID on file. Claims and billing are not built yet.',
  },
  {
    key: 'housing_nm',
    name: 'Housing New Mexico',
    short: 'Housing NM',
    scope: 'tagged',
    byCounty: true,
    note: 'Formerly NM Mortgage Finance Authority. VS is a Housing NM provider for Bernalillo and Lea counties; this report is split by service county.',
  },
]

export function funderByKey(key: string | null | undefined): Funder | null {
  return FUNDERS.find((f) => f.key === key) ?? null
}

export const SERVICE_COUNTIES = ['bernalillo', 'lea', 'other'] as const
export type ServiceCounty = (typeof SERVICE_COUNTIES)[number]

export const SERVICE_COUNTY_LABELS: Record<ServiceCounty | 'unspecified', string> = {
  bernalillo: 'Bernalillo County',
  lea: 'Lea County',
  other: 'Other county',
  unspecified: 'County not recorded',
}

export function isServiceCounty(v: unknown): v is ServiceCounty {
  return typeof v === 'string' && (SERVICE_COUNTIES as readonly string[]).includes(v)
}
export function isFunderKey(v: unknown): v is FunderKey {
  return typeof v === 'string' && (FUNDER_KEYS as readonly string[]).includes(v)
}
