import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  acceptWebsiteMessage, requestTypeForService, saveWebsiteMessage, savedMessage,
} from '../public-message'

const routeSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../../app/api/lead/route.ts'),
  'utf8',
)

test('a housing message is stored as a housing request and keeps the words they wrote', () => {
  const accepted = acceptWebsiteMessage({
    name: 'Nia Mensah',
    email: 'Nia.Mensah@example.test',
    phone: '505-555-0101',
    service: 'Housing Stability',
    message: 'Need a hotel voucher this week.',
    consent_given: true,
    notify_email: 'someone@example.test',
  })
  assert.equal(accepted.ok, true)
  if (!accepted.ok) return
  assert.equal(accepted.value.request_type, 'housing')
  assert.equal(accepted.value.email, 'nia.mensah@example.test')
  assert.match(accepted.value.details, /Need a hotel voucher this week/)
  assert.match(accepted.value.details, /Housing Stability/)
  assert.equal(JSON.stringify(accepted.value).includes('someone@example.test'), false)
})

test('service labels map onto the existing request types', () => {
  assert.equal(requestTypeForService('Refugee & Immigrant Services'), 'refugee_immigrant_services')
  assert.equal(requestTypeForService('Youth Mentorship & Education'), 'education')
  assert.equal(requestTypeForService('Family & Caregiver Support'), 'family_support')
  assert.equal(requestTypeForService('Unsheltered Outreach & Stabilization'), 'housing')
  assert.equal(requestTypeForService('Sankofa Center'), 'other')
  assert.equal(requestTypeForService(''), 'other')
})

test('missing consent, a bad email, or an empty message saves nothing', () => {
  assert.match(acceptWebsiteMessage({ name: 'Nia Mensah', email: 'nia.mensah@example.test', message: 'Hello there', consent_given: false }).ok ? '' : 'consent', /consent/)
  const bad = acceptWebsiteMessage({ name: 'Nia', email: 'not-an-email', message: 'Hello there', consent_given: true })
  assert.equal(bad.ok, false)
  const empty = acceptWebsiteMessage({ name: 'Nia Mensah', email: 'nia.mensah@example.test', message: ' ', consent_given: true })
  assert.equal(empty.ok, false)
})

test('a failed insert is not success and does not claim an email was sent', async () => {
  let calls = 0
  const result = await saveWebsiteMessage({
    name: 'Nia Mensah',
    email: 'nia.mensah@example.test',
    message: 'Hello there',
    consent_given: true,
  }, async () => {
    calls += 1
    return { error: { message: 'permission denied' } }
  }, '00000000-0000-0000-0000-00000000e901')
  assert.equal(calls, 1)
  assert.deepEqual(result, {
    ok: false,
    saved: false,
    emailSent: false,
    error: 'We could not save this. Nothing was sent. Please try again.',
  })
})

test('a saved contact returns the id and emailSent false', async () => {
  let stored: unknown = null
  const result = await saveWebsiteMessage({
    kind: 'contact',
    name: 'Nia Mensah',
    email: 'nia.mensah@example.test',
    service: 'Food distribution',
    message: 'Asking about Saturday.',
    consent_given: true,
  }, async (row) => {
    stored = row
    return { error: null }
  }, '00000000-0000-0000-0000-00000000e901')
  assert.equal(result.ok, true)
  assert.equal(result.emailSent, false)
  if (result.ok) assert.equal(savedMessage(result, 'contact').includes('00000000-0000-0000-0000-00000000e901'), true)
  assert.equal((stored as { request_type: string }).request_type, 'food_assistance')
  assert.equal((stored as { consent_given: boolean }).consent_given, true)
})

test('a newsletter signup is saved as a request, not described as a mailing list', async () => {
  const result = await saveWebsiteMessage(
    { kind: 'newsletter', email: 'reader@example.test' },
    async () => ({ error: null }),
    '00000000-0000-0000-0000-00000000e902',
  )
  assert.equal(result.ok && result.emailSent === false, true)
  if (result.ok) {
    const text = savedMessage(result, 'newsletter')
    assert.match(text, /No email was sent/)
    assert.equal(text.toLowerCase().includes('subscribed'), false)
  }
})

test('the website lead route does not call the shared mail handler', () => {
  assert.equal(routeSource.includes('handleLeadSubmission'), false)
  assert.equal(routeSource.includes('resend'), false)
  assert.equal(routeSource.includes('sendEmail'), false)
  assert.equal(routeSource.includes('notify_email'), false)
})
