// VIZIONZ SANKOFA · /admin/programs/[id]
// Read-only program. Opening this page does not update the program,
// its cohorts, or its enrollments. Edit is a separate link for
// executives and operators.

import type { CSSProperties } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AdminCrumbs } from '@/components/admin/nav/AdminCrumbs'
import { requireOperatorOrEmployee, getAccessRole } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { formatDateValue } from '@/lib/format/datetime'
import { COHORT_STATUS_LABELS, type CohortStatus } from '../../cohorts/types'
import {
  canEditProgram, enrollmentEmptyCopy, programEditHref, programListHref,
  programTextSections, visibleEnrollments, type EnrollmentRow, type ProgramText,
} from '@/lib/programs/detail'
import { applyHref } from '@/lib/programs/apply'
import type { ProgramRecord } from '../types'

export const dynamic = 'force-dynamic'

const ENROLLMENT_LABELS: Record<string, string> = {
  enrolled: 'Enrolled',
  active: 'Active',
  completed: 'Completed',
  withdrew: 'Withdrew',
  transferred: 'Transferred',
}

export default async function AdminProgramDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ q?: string; tab?: string }>
}) {
  const { id } = await params
  const filters = await searchParams
  const user = await requireOperatorOrEmployee()
  const role = getAccessRole(user)
  const back = programListHref(filters)
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('programs')
    .select(
      'id, slug, name, short_name, is_public, is_active, ' +
        'public_description, public_long_description, ' +
        'who_we_serve, eligibility_criteria, duration_description, ' +
        'apply_cta_label, apply_url, hero_image_url, icon_emoji, ' +
        'display_order, primary_outcome_domains, ' +
        'launched_at, retired_at, created_at, updated_at',
    )
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return (
      <div>
        <AdminCrumbs trail={[{ label: 'Programs', href: back }, { label: 'Program' }]} fallbackHref={back} fallbackLabel="Programs" />
        <h1 style={titleStyle}>Program</h1>
        <p role="alert" style={{ color: '#CE1126', fontSize: '15px' }}>
          Could not load this program. Nothing was changed.
        </p>
        <p><Link href={back} style={backLink}>Back to programs</Link></p>
      </div>
    )
  }
  if (!data) notFound()

  const program = data as unknown as ProgramRecord
  const sections = programTextSections(program as ProgramText)

  const { data: cohortData, error: cohortError } = await supabase
    .from('cohorts')
    .select('id, name, status, start_date, end_date, meeting_schedule, capacity, cohort_number')
    .eq('program_id', program.id)
    .order('start_date', { ascending: false })

  const cohorts = (cohortError ? [] : (cohortData ?? [])) as {
    id: string
    name: string
    status: CohortStatus
    start_date: string
    end_date: string | null
    meeting_schedule: string | null
    capacity: number | null
    cohort_number: number | null
  }[]

  let enrollmentRows: EnrollmentRow[] = []
  let enrollmentError = false
  if (cohorts.length > 0) {
    const ids = cohorts.map((cohort) => cohort.id)
    const withDeleted = 'id, cohort_id, status, participant:participant_id (id, first_name, last_name, preferred_name, deleted_at)'
    const plain = 'id, cohort_id, status, participant:participant_id (id, first_name, last_name, preferred_name)'
    let result: { data: unknown; error: { message: string } | null } = await supabase.from('enrollments').select(withDeleted).in('cohort_id', ids)
    if (result.error && /deleted_at/i.test(result.error.message)) {
      result = await supabase.from('enrollments').select(plain).in('cohort_id', ids)
    }
    if (result.error) enrollmentError = true
    else enrollmentRows = (result.data ?? []) as unknown as EnrollmentRow[]
  }
  const people = visibleEnrollments(enrollmentRows)
  const canEdit = canEditProgram(role)

  return (
    <div>
      <AdminCrumbs
        trail={[{ label: 'Programs', href: back }, { label: program.name }]}
        fallbackHref={back}
        fallbackLabel="Programs"
      />
      <p style={{ margin: '0 0 12px' }}>
        <Link href={back} style={backLink}>← Programs</Link>
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '28px', lineHeight: 1 }}>{program.icon_emoji ?? '📋'}</div>
        <h1 style={{ ...titleStyle, margin: 0 }}>{program.name}</h1>
        <StatusPill publicLive={program.is_public} />
        {!program.is_active && <StatusPill publicLive={false} label="Inactive" />}
      </div>
      {program.short_name && (
        <p style={{ margin: '0 0 16px', color: 'rgba(10,10,10,0.6)', fontSize: '14px' }}>{program.short_name}</p>
      )}
      <p style={{ fontSize: '14px', color: 'rgba(10,10,10,0.65)', marginTop: 0 }}>
        This is a read-only view. Opening it does not change the program.
      </p>
      {canEdit && (
        <p>
          <Link href={programEditHref(program.id, filters)} style={editLink}>Edit</Link>
        </p>
      )}

      <div style={{ display: 'grid', gap: '16px', maxWidth: '760px', marginTop: '20px' }}>
        {sections.length === 0 && (
          <p style={{ color: 'rgba(10,10,10,0.6)' }}>No description is saved for this program yet.</p>
        )}
        {sections.map((section) => (
          <section key={section.label}>
            <h2 style={labelStyle}>{section.label}</h2>
            <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{section.value}</p>
          </section>
        ))}
        {(program.launched_at || program.retired_at) && (
          <p style={{ fontSize: '14px', color: 'rgba(10,10,10,0.7)' }}>
            {program.launched_at ? `Launched ${formatDateValue(program.launched_at)}` : ''}
            {program.launched_at && program.retired_at ? ' · ' : ''}
            {program.retired_at ? `Retired ${formatDateValue(program.retired_at)}` : ''}
          </p>
        )}
        <p style={{ fontSize: '14px' }}>
          <a href={applyHref(program)} style={backLink}>
            {program.apply_cta_label?.trim() || 'Apply Now'}
          </a>
        </p>
      </div>

      <h2 style={{ ...titleStyle, fontSize: '26px', marginTop: '36px' }}>Cohorts</h2>
      {cohortError && <p role="alert" style={{ color: '#CE1126' }}>Cohorts could not be loaded. The program itself was not changed.</p>}
      {!cohortError && cohorts.length === 0 && <p style={{ color: 'rgba(10,10,10,0.65)' }}>No cohorts for this program yet.</p>}
      <div style={{ display: 'grid', gap: '12px' }}>
        {cohorts.map((cohort) => {
          const enrolled = people.filter((person) => person.cohortId === cohort.id)
          const when = [formatDateValue(cohort.start_date), cohort.end_date ? formatDateValue(cohort.end_date) : null].filter(Boolean).join(' – ')
          return (
            <article key={cohort.id} style={cardStyle}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                <Link href={`/admin/cohorts/${cohort.id}`} style={{ ...nameLink, fontSize: '18px' }}>{cohort.name}</Link>
                <span style={pill}>{COHORT_STATUS_LABELS[cohort.status] ?? cohort.status}</span>
              </div>
              <p style={{ margin: '8px 0 0', fontSize: '14px', color: 'rgba(10,10,10,0.7)' }}>
                {[when, cohort.meeting_schedule, cohort.capacity != null ? `Capacity ${cohort.capacity}` : null].filter(Boolean).join(' · ') || 'No schedule saved.'}
              </p>
              {enrollmentError ? (
                <p role="alert" style={{ color: '#CE1126', fontSize: '14px' }}>Participants could not be loaded.</p>
              ) : enrolled.length === 0 ? (
                <p style={{ fontSize: '14px', color: 'rgba(10,10,10,0.65)' }}>{enrollmentEmptyCopy(role, 'cohort')}</p>
              ) : (
                <ul style={{ margin: '10px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: '6px' }}>
                  {enrolled.map((person) => (
                    <li key={person.participantId}>
                      <Link href={`/admin/participants/${person.participantId}`} style={nameLink}>{person.name}</Link>
                      <span style={{ color: 'rgba(10,10,10,0.55)', fontSize: '13px' }}> · {ENROLLMENT_LABELS[person.status] ?? person.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}

function StatusPill({ publicLive, label }: { publicLive: boolean; label?: string }) {
  return (
    <span style={{ ...pill, background: publicLive ? 'rgba(0, 122, 51, 0.12)' : 'rgba(10, 10, 10, 0.08)', color: publicLive ? '#007A33' : 'rgba(10,10,10,0.55)' }}>
      {label ?? (publicLive ? 'Public' : 'Draft')}
    </span>
  )
}

const titleStyle: CSSProperties = {
  fontFamily: '"DM Serif Display", Georgia, serif',
  fontSize: '36px',
  fontWeight: 600,
  lineHeight: 1.15,
  color: '#0A0A0A',
}
const labelStyle: CSSProperties = {
  fontSize: '11px',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'rgba(10,10,10,0.5)',
  margin: '0 0 6px',
  fontFamily: 'ui-monospace, Menlo, monospace',
}
const backLink: CSSProperties = { color: '#0A2548', fontWeight: 600, textDecoration: 'none' }
const editLink: CSSProperties = {
  display: 'inline-block',
  padding: '8px 16px',
  border: '1px solid #0A0A0A',
  borderRadius: '6px',
  color: '#0A0A0A',
  textDecoration: 'none',
  fontSize: '13px',
  fontWeight: 600,
}
const nameLink: CSSProperties = { color: '#0A0A0A', fontWeight: 600, textDecoration: 'none', fontFamily: '"DM Serif Display", Georgia, serif' }
const cardStyle: CSSProperties = { border: '1px solid rgba(10,10,10,0.1)', borderRadius: '8px', padding: '16px 18px', background: '#FFFFFF' }
const pill: CSSProperties = {
  fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
  padding: '3px 8px', borderRadius: '4px', fontFamily: 'ui-monospace, Menlo, monospace',
}
