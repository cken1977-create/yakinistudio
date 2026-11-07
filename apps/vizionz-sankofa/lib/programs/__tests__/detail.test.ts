import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canEditProgram, enrollmentEmptyCopy, programDetailHref, programEditHref, programListHref,
  programTextSections, visibleEnrollments,
} from '../detail'

test('program links keep the list search and tab, and viewing is not an edit', () => {
  assert.equal(programListHref({}), '/admin/programs')
  assert.equal(programListHref({ q: ' housing ', tab: 'public' }), '/admin/programs?q=housing&tab=public')
  assert.equal(programListHref({ tab: 'nope' }), '/admin/programs')
  assert.equal(
    programDetailHref('prog-1', { q: 'housing', tab: 'draft' }),
    '/admin/programs/prog-1?q=housing&tab=draft',
  )
  const edit = programEditHref('prog-1', { q: 'housing', tab: 'public' })
  assert.equal(edit, '/admin/programs?q=housing&tab=public&edit=prog-1')
  assert.notEqual(programDetailHref('prog-1', { q: 'housing' }), edit)
})

test('only executives and operators get Edit', () => {
  assert.equal(canEditProgram('executive'), true)
  assert.equal(canEditProgram('operator'), true)
  assert.equal(canEditProgram('case_manager'), false)
  assert.equal(canEditProgram('leadership_readonly'), false)
  assert.equal(canEditProgram(null), false)
})

test('the read view uses only filled existing fields', () => {
  const sections = programTextSections({
    name: 'Housing Stability',
    is_public: true,
    public_description: '  Help with rent. ',
    public_long_description: '',
    who_we_serve: null,
    eligibility_criteria: 'Lives in New Mexico',
    duration_description: null,
    primary_outcome_domains: ['housing', ' '],
  })
  assert.deepEqual(sections.map((section) => section.label), ['Description', 'Eligibility', 'Outcome areas'])
  assert.equal(sections[0].value, 'Help with rent.')
  assert.equal(sections[2].value, 'housing')
})

test('enrollments stay inside what this person can see and skip removed participants', () => {
  const rows = visibleEnrollments([
    {
      cohort_id: 'c1',
      status: 'enrolled',
      participant: { id: 'p1', first_name: 'Amina', last_name: 'Okonkwo', preferred_name: null },
    },
    {
      cohort_id: 'c1',
      status: 'active',
      participant: { id: 'p2', first_name: 'Removed', last_name: 'Person', deleted_at: '2026-11-07' },
    },
    { cohort_id: 'c1', status: 'enrolled', participant: null },
  ])
  assert.deepEqual(rows, [{ cohortId: 'c1', status: 'enrolled', participantId: 'p1', name: 'Amina Okonkwo' }])
  assert.match(enrollmentEmptyCopy('case_manager'), /caseload/)
  assert.doesNotMatch(enrollmentEmptyCopy('executive'), /caseload/)
})
