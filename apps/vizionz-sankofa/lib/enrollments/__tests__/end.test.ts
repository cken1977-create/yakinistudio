import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canSubmitEnrollmentEnd, enrollmentEndCopy, enrollmentEndMessage, enrollmentIsOpen,
} from '../end'

test('only enrolled and active enrollments can be ended here', () => {
  assert.equal(enrollmentIsOpen('enrolled'), true)
  assert.equal(enrollmentIsOpen('active'), true)
  assert.equal(enrollmentIsOpen('completed'), false)
  assert.equal(enrollmentIsOpen('withdrew'), false)
  assert.equal(enrollmentIsOpen('transferred'), false)
})

test('withdraw needs a reason and complete does not', () => {
  assert.equal(canSubmitEnrollmentEnd('completed', ''), true)
  assert.equal(canSubmitEnrollmentEnd('withdrew', '   '), false)
  assert.equal(canSubmitEnrollmentEnd('withdrew', 'Moved away'), true)
})

test('the confirmation names the program and says the person stays', () => {
  const complete = enrollmentEndCopy({ outcome: 'completed', person: 'Amina Okonkwo', program: 'Housing Stability' })
  assert.match(complete.body, /Housing Stability/)
  assert.match(complete.body, /stays on the roster/)
  assert.match(complete.body, /does not delete the person/)
  assert.doesNotMatch(complete.confirm, /roster/)
  const withdraw = enrollmentEndCopy({ outcome: 'withdrew', person: 'Amina Okonkwo', program: 'Housing Stability' })
  assert.match(withdraw.confirm, /Withdraw from program/)
  assert.match(withdraw.body, /tasks/)
})

test('an already ended enrollment is not described as a new change', () => {
  assert.match(
    enrollmentEndMessage({ ok: true, code: 'already_ended', error: 'This enrollment is already ended. It was not changed.' }, 'done'),
    /was not changed/,
  )
})
