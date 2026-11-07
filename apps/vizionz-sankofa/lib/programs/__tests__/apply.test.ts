import assert from 'node:assert/strict'
import test from 'node:test'
import { applyHref, decideSupportFile, intakeFilePath, programNote, validateIntake } from '../apply'

const draft = {
  full_name: 'Amina Okonkwo',
  email: 'amina@example.test',
  phone: '',
  request_type: 'housing',
  details: 'Need a stable place.',
  consent_given: true,
}

test('Apply on a program card and detail page opens the intake form for that program', () => {
  assert.equal(applyHref({ slug: 'housing-stability', apply_url: null }), '/get-help?program=housing-stability')
  assert.equal(applyHref({ slug: 'housing-stability', apply_url: '' }), '/get-help?program=housing-stability')
  assert.equal(applyHref({ slug: 'housing-stability', apply_url: '#' }), '/get-help?program=housing-stability')
  assert.equal(applyHref({ slug: 'housing-stability', apply_url: '/programs/housing-stability' }), '/get-help?program=housing-stability')
  assert.equal(
    applyHref({ slug: 'housing-stability', apply_url: 'https://example.org/apply' }),
    'https://example.org/apply',
  )
})

test('an unknown program id is rejected and a valid request is accepted', () => {
  assert.match(validateIntake({ ...draft, full_name: 'A' }) ?? '', /full name/)
  assert.match(validateIntake({ ...draft, email: 'not-an-email' }) ?? '', /email/)
  assert.match(validateIntake({ ...draft, request_type: 'made-up' }) ?? '', /what we can help/)
  assert.match(validateIntake({ ...draft, consent_given: false }) ?? '', /Consent/)
  assert.equal(validateIntake(draft), null)
})

test('the program name is stored in the request text without dropping what the person wrote', () => {
  assert.equal(programNote('Housing Stability', 'Need a stable place.'), 'Applying for: Housing Stability\n\nNeed a stable place.')
  assert.equal(programNote('Housing Stability', 'Applying for: Housing Stability\n\nNeed a stable place.'), 'Applying for: Housing Stability\n\nNeed a stable place.')
})

test('supporting files are limited and a failed file does not change the path of another request', () => {
  assert.equal(decideSupportFile({ name: 'lease.pdf', type: 'application/pdf', size: 1000 }).ok, true)
  const bad = decideSupportFile({ name: 'notes.exe', type: 'application/octet-stream', size: 1000 })
  assert.equal(bad.ok, false)
  const big = decideSupportFile({ name: 'scan.jpg', type: 'image/jpeg', size: 11 * 1024 * 1024 })
  assert.equal(big.ok, false)
  assert.equal(intakeFilePath('11111111-1111-1111-1111-111111111111', 'Lease.PDF', 'abc'), '11111111-1111-1111-1111-111111111111/abc-lease.pdf')
  assert.notEqual(
    intakeFilePath('11111111-1111-1111-1111-111111111111', 'a.pdf', '1'),
    intakeFilePath('22222222-2222-2222-2222-222222222222', 'a.pdf', '1'),
  )
})
