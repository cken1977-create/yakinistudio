import assert from 'node:assert/strict'
import test from 'node:test'
import {
  REMOVAL_SEMANTICS, blockersFromCounts, canRemoveParticipant, initialRemoval,
  legalName, nameConfirmed, preservedFromCounts, removalReducer, removalStatusText,
  rosterDuplicateNotice, shouldSubmitRemoval, type RemovalPreview,
} from '../removal'

const person = { id: 'p1', first_name: 'Amina', last_name: 'Okonkwo', preferred_name: null, updated_at: '2026-11-07T00:00:00.000Z' }

function ready(): RemovalPreview {
  return { ok: true, code: 'ready', semantics: 'reversible_roster_removal', participant: person, counts: { case_notes: 2, active_enrollments: 0, open_tasks: 0 } }
}

test('only executives and operators may remove a participant', () => {
  assert.equal(canRemoveParticipant('executive'), true)
  assert.equal(canRemoveParticipant('operator'), true)
  assert.equal(canRemoveParticipant('case_manager'), false)
  assert.equal(canRemoveParticipant('leadership_readonly'), false)
  assert.equal(canRemoveParticipant(null), false)
})

test('confirmation names the participant and describes a reversible removal', () => {
  assert.equal(legalName(person), 'Amina Okonkwo')
  assert.equal(nameConfirmed('  amina okonkwo ', legalName(person)), true)
  assert.equal(nameConfirmed('Amina', legalName(person)), false)
  assert.match(REMOVAL_SEMANTICS, /not a permanent erase/)
  assert.match(REMOVAL_SEMANTICS, /restore/)
  assert.equal(preservedFromCounts({ case_notes: 2, services: 0 })[0].label, 'Case notes')
})

test('active enrollments and open tasks block; other records are only reported', () => {
  const blocked = blockersFromCounts({ active_enrollments: 1, open_tasks: 2, case_notes: 4 })
  assert.deepEqual(blocked.map((row) => row.key), ['active_enrollments', 'open_tasks'])
  assert.equal(blockersFromCounts({ case_notes: 4 }).length, 0)
})

test('cancel closes the dialog and does not start a removal', () => {
  let state = removalReducer(initialRemoval(), { type: 'open' })
  state = removalReducer(state, { type: 'preview', preview: ready() })
  assert.equal(state.phase, 'confirm')
  state = removalReducer(state, { type: 'cancel' })
  assert.equal(state.phase, 'closed')
  assert.equal(state.submissions, 0)
})

test('confirmed removal starts once; a second click does not submit again', () => {
  let state = removalReducer(initialRemoval(), { type: 'open' })
  state = removalReducer(state, { type: 'preview', preview: ready() })
  assert.equal(shouldSubmitRemoval(state, 'Amina Okonkwo'), true)
  assert.equal(shouldSubmitRemoval(state, 'someone else'), false)
  state = removalReducer(state, { type: 'confirm', typedName: 'Amina Okonkwo' })
  assert.equal(state.phase, 'submitting')
  assert.equal(state.submissions, 1)
  assert.match(removalStatusText(state, 'Amina Okonkwo') ?? '', /Removing Amina Okonkwo/)
  const again = removalReducer(state, { type: 'confirm', typedName: 'Amina Okonkwo' })
  assert.equal(again, state)
  assert.equal(again.submissions, 1)
})

test('a blocked participant cannot be confirmed', () => {
  let state = removalReducer(initialRemoval(), { type: 'open' })
  state = removalReducer(state, {
    type: 'preview',
    preview: { ...ready(), code: 'blocked', counts: { active_enrollments: 1, case_notes: 3 } },
  })
  state = removalReducer(state, { type: 'confirm', typedName: 'Amina Okonkwo' })
  assert.equal(state.phase, 'confirm')
  assert.equal(state.submissions, 0)
})

test('success, already removed, and conflict stay explicit', () => {
  let state = removalReducer(initialRemoval(), { type: 'open' })
  state = removalReducer(state, { type: 'preview', preview: ready() })
  state = removalReducer(state, { type: 'confirm', typedName: 'Amina Okonkwo' })
  state = removalReducer(state, { type: 'result', preview: { ...ready(), ok: true, code: 'removed' } })
  assert.equal(state.phase, 'success')
  assert.match(state.message ?? '', /not erased/)

  let retry = removalReducer(initialRemoval(), { type: 'open' })
  retry = removalReducer(retry, { type: 'preview', preview: ready() })
  retry = removalReducer(retry, { type: 'confirm', typedName: 'Amina Okonkwo' })
  retry = removalReducer(retry, { type: 'result', preview: { ...ready(), ok: true, code: 'already_removed' } })
  assert.equal(retry.phase, 'success')
  assert.match(retry.message ?? '', /already off the active roster/)

  let conflict = removalReducer(initialRemoval(), { type: 'open' })
  conflict = removalReducer(conflict, { type: 'preview', preview: ready() })
  conflict = removalReducer(conflict, { type: 'confirm', typedName: 'Amina Okonkwo' })
  conflict = removalReducer(conflict, {
    type: 'result',
    preview: { ...ready(), ok: false, code: 'conflict', error: 'This participant changed. Close this and review them again before removing them.' },
  })
  assert.equal(conflict.phase, 'error')
  assert.match(conflict.message ?? '', /changed/)
  assert.equal(removalReducer(conflict, { type: 'retry' }).phase, 'loading')
})

test('duplicate warning names the other record and does not remove anyone', () => {
  const notice = rosterDuplicateNotice(
    { first_name: 'Amina', last_name: 'Okonkwo', email: 'amina@example.test' },
    [{ id: 'other', first_name: 'Amina', last_name: 'Okonkwo', email: 'amina@example.test' }],
  )
  assert.match(notice ?? '', /separate record/)
  assert.match(notice ?? '', /does not merge or remove/)
  assert.equal(rosterDuplicateNotice(
    { first_name: 'Amina', last_name: 'Okonkwo', email: 'amina@example.test' },
    [{ id: 'p1', first_name: 'Amina', last_name: 'Okonkwo', email: 'amina@example.test' }],
    'p1',
  ), null)
})
