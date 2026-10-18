import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lines, jdAckState, handbookState, latestVersion, onboardingChecklist, checklistProgress, hrFilePath } from '../model'

test('duties are split one per line, bullets stripped', () => {
  assert.deepEqual(lines('- Run intake\n• Keep notes\n\n  * Report monthly '), ['Run intake', 'Keep notes', 'Report monthly'])
  assert.deepEqual(lines(null), [])
})

test('job description acknowledgement goes stale when the version changes', () => {
  assert.equal(jdAckState({ acknowledged_at: null, acknowledged_version: null }, 1), 'pending')
  assert.equal(jdAckState({ acknowledged_at: '2026-10-17T00:00:00Z', acknowledged_version: 1 }, 1), 'acknowledged')
  assert.equal(jdAckState({ acknowledged_at: '2026-10-17T00:00:00Z', acknowledged_version: 1 }, 2), 'needs_reack')
})

test('handbook state is per latest version', () => {
  const vs = [
    { id: 'a', handbook_id: 'h', version: 1, body: 'x', storage_path: null, file_name: null, file_size: null, change_note: null, published_at: '' },
    { id: 'b', handbook_id: 'h', version: 2, body: 'y', storage_path: null, file_name: null, file_size: null, change_note: null, published_at: '' },
  ]
  const latest = latestVersion(vs, 'h')
  assert.equal(latest?.id, 'b')
  assert.equal(handbookState(null, undefined), 'no_version')
  assert.equal(handbookState(latest, undefined), 'unread')
  assert.equal(handbookState(latest, { version_id: 'b', user_id: 'u', read_at: 'x', signed_at: null, signed_name: null }), 'read')
  assert.equal(handbookState(latest, { version_id: 'b', user_id: 'u', read_at: 'x', signed_at: 'y', signed_name: 'U' }), 'signed')
})

test('onboarding checklist reflects invite, JD and handbook', () => {
  const o = { id: 'o', full_name: 'N', email: 'n@x.test', start_date: null, invite_id: 'i', user_id: null, job_description_id: 'j', handbook_id: 'h', status: 'open' as const, notes: null, created_at: '' }
  const items = onboardingChecklist({ onboarding: o, invite: { id: 'i', email: 'n@x.test', accepted_at: null, accepted_user_id: null, revoked_at: null },
    jdAssignment: null, jdVersion: 1, handbookLatest: null, handbookAck: undefined })
  assert.deepEqual(items.map((i) => [i.key, i.done]), [['invite', true], ['signin', false], ['jd', false], ['handbook', false]])
  assert.deepEqual(checklistProgress(items), { done: 1, total: 4 })
})

test('handbook file paths stay inside the handbook folder', () => {
  assert.equal(hrFilePath('abc', '../../etc/My Handbook (v2).pdf', 5), 'handbooks/abc/5-....etcMy-Handbook-v2.pdf')
})
