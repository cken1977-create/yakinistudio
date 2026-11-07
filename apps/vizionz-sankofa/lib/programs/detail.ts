// Read-only program detail. Only fields that already exist on programs,
// cohorts, and enrollments. Viewing never writes.

export type ProgramRole = 'executive' | 'operator' | 'case_manager' | 'leadership_readonly' | null

const TABS = ['all', 'public', 'draft'] as const

export function canEditProgram(role: ProgramRole): boolean {
  return role === 'executive' || role === 'operator'
}

function filters(input: { q?: string | null; tab?: string | null }): URLSearchParams {
  const params = new URLSearchParams()
  const q = input.q?.trim()
  if (q) params.set('q', q)
  if (input.tab && input.tab !== 'all' && (TABS as readonly string[]).includes(input.tab)) {
    params.set('tab', input.tab)
  }
  return params
}

export function programListHref(input: { q?: string | null; tab?: string | null } = {}): string {
  const params = filters(input)
  const text = params.toString()
  return text ? `/admin/programs?${text}` : '/admin/programs'
}

export function programDetailHref(id: string, input: { q?: string | null; tab?: string | null } = {}): string {
  const params = filters(input)
  const text = params.toString()
  return `/admin/programs/${id}${text ? `?${text}` : ''}`
}

export function programEditHref(id: string, input: { q?: string | null; tab?: string | null } = {}): string {
  const params = filters(input)
  params.set('edit', id)
  return `/admin/programs?${params.toString()}`
}

export type ProgramText = {
  name: string
  short_name?: string | null
  is_public: boolean
  is_active?: boolean
  public_description?: string | null
  public_long_description?: string | null
  who_we_serve?: string | null
  eligibility_criteria?: string | null
  duration_description?: string | null
  primary_outcome_domains?: string[] | null
  apply_cta_label?: string | null
  apply_url?: string | null
  launched_at?: string | null
  retired_at?: string | null
}

const TEXT_FIELDS: { key: keyof ProgramText; label: string }[] = [
  { key: 'public_description', label: 'Description' },
  { key: 'public_long_description', label: 'Detail' },
  { key: 'who_we_serve', label: 'Who we serve' },
  { key: 'eligibility_criteria', label: 'Eligibility' },
  { key: 'duration_description', label: 'Duration' },
]

export function programTextSections(program: ProgramText): { label: string; value: string }[] {
  const sections: { label: string; value: string }[] = []
  for (const field of TEXT_FIELDS) {
    const value = program[field.key]
    if (typeof value === 'string' && value.trim()) sections.push({ label: field.label, value: value.trim() })
  }
  const domains = program.primary_outcome_domains?.map((item) => item.trim()).filter(Boolean) ?? []
  if (domains.length > 0) sections.push({ label: 'Outcome areas', value: domains.join(', ') })
  return sections
}

export function enrollmentEmptyCopy(role: ProgramRole, scope: 'program' | 'cohort' = 'program'): string {
  const where = scope === 'cohort' ? 'this cohort' : 'this program'
  if (role === 'case_manager') return `No one on your caseload is enrolled in ${where}.`
  return `No participants are enrolled in ${where}.`
}

export type EnrollmentRow = {
  cohort_id: string
  status: string
  participant: {
    id: string
    first_name: string
    last_name: string
    preferred_name?: string | null
    deleted_at?: string | null
  } | null
}

export function participantName(person: { first_name: string; last_name: string; preferred_name?: string | null }): string {
  const preferred = person.preferred_name?.trim()
  const legal = `${person.first_name} ${person.last_name}`.replace(/\s+/g, ' ').trim()
  return preferred ? `${preferred} (${legal})` : legal
}

export function visibleEnrollments(rows: EnrollmentRow[]): { cohortId: string; status: string; participantId: string; name: string }[] {
  return rows.flatMap((row) => {
    if (!row.participant || row.participant.deleted_at) return []
    return [{
      cohortId: row.cohort_id,
      status: row.status,
      participantId: row.participant.id,
      name: participantName(row.participant),
    }]
  })
}
