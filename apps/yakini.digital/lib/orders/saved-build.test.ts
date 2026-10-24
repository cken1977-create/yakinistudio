import assert from 'node:assert/strict'
import test from 'node:test'
import { emptyDraft } from './logic.ts'
import { intakeTestMode, saveBuildDraft } from './submit.ts'
import {
  buildHasProgress,
  draftFromSaved,
  emailBuildPayload,
  parseSavedBuild,
  safeBuildToken,
  savedFromDraft,
} from './saved-build.ts'

test('a saved build keeps the business, features, add-ons, plan, and step', () => {
  const draft = emptyDraft('founding')
  draft.businessId = 'trades'
  draft.templateId = 'home-services'
  draft.featureIds = ['booking']
  draft.addonIds = ['whatsapp']
  draft.planTouched = true
  draft.contact.name = 'Ada'
  const saved = savedFromDraft(draft, 2)
  assert.equal(saved.step, 2)
  assert.deepEqual(saved.featureIds, ['booking'])
  assert.deepEqual(saved.addonIds, ['whatsapp'])
  const restored = draftFromSaved(parseSavedBuild(saved)!, 'operate')
  assert.equal(restored.businessId, 'trades')
  assert.equal(restored.planId, 'founding')
  assert.deepEqual(restored.addonIds, ['whatsapp'])
  assert.equal(buildHasProgress(saved), true)
})

test('an untouched suggested plan is not a saved build', () => {
  const draft = emptyDraft('founding')
  draft.planTouched = false
  const saved = savedFromDraft(draft, 0)
  assert.equal(buildHasProgress(saved), false)
})

test('a portal wrapper and a missing draft are read safely', () => {
  const wrapped = parseSavedBuild({ build: { businessId: 'salon', step: 9, featureIds: ['booking', 4] } })
  assert.equal(wrapped?.businessId, 'salon')
  assert.equal(wrapped?.step, 4)
  assert.deepEqual(wrapped?.featureIds, ['booking'])
  assert.equal(wrapped?.planTouched, false)
  assert.equal(parseSavedBuild({ ok: false }), null)
  assert.equal(parseSavedBuild(null), null)
  const implied = parseSavedBuild({ planId: 'grow' })
  assert.equal(implied?.planTouched, true)
})

test('emailing a build requires consent, a name, and an email', () => {
  const saved = savedFromDraft(emptyDraft(''), 1)
  assert.equal(emailBuildPayload(saved, 'Ada Owner', 'ada@theirbusiness.com', false), null)
  assert.equal(emailBuildPayload(saved, 'A', 'ada@theirbusiness.com', true), null)
  assert.equal(emailBuildPayload(saved, 'Ada Owner', 'not-an-email', true), null)
  const payload = emailBuildPayload(saved, ' Ada Owner ', 'ada@theirbusiness.com', true)
  assert.equal(payload?.consent, true)
  assert.equal(payload?.name, 'Ada Owner')
  assert.equal(payload?.email, 'ada@theirbusiness.com')
  assert.equal(payload?.build.step, 1)
})

test('a build token is a plain id, not a path', () => {
  assert.equal(safeBuildToken('abc_def-123'), 'abc_def-123')
  assert.equal(safeBuildToken('../secret'), null)
  assert.equal(safeBuildToken('short'), null)
  assert.equal(safeBuildToken(''), null)
})

test('preview does not post a build draft to the portal', async () => {
  assert.equal(intakeTestMode(), true)
  const saved = savedFromDraft(emptyDraft('founding'), 1)
  const payload = emailBuildPayload(saved, 'Ada Owner', 'ada@theirbusiness.com', true)
  const result = await saveBuildDraft(payload!)
  assert.deepEqual(result, { ok: true, testMode: true, sent: false })
})
