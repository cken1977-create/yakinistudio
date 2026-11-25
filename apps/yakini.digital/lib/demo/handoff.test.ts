import assert from 'node:assert/strict'
import { test } from 'node:test'
import { handoffFields, handoffFromEnv, studioBuilds } from './handoff'

test('the hand-off is off unless the flag is on', () => {
  assert.equal(handoffFromEnv({}), null)
  assert.equal(handoffFromEnv({ BUILDER_HANDOFF_ENABLED: '0' }), null)
  assert.deepEqual(handoffFromEnv({ BUILDER_HANDOFF_ENABLED: '1' }), { action: 'https://studio.yakini.digital/start', describeUrl: 'https://studio.yakini.digital/new' })
})

test('only an https studio origin is used', () => {
  assert.equal(handoffFromEnv({ BUILDER_HANDOFF_ENABLED: 'true', BUILDER_STUDIO_ORIGIN: 'https://preview.example.dev/x' })!.action, 'https://preview.example.dev/start')
  assert.equal(handoffFromEnv({ BUILDER_HANDOFF_ENABLED: '1', BUILDER_STUDIO_ORIGIN: 'http://evil.example' })!.action, 'https://studio.yakini.digital/start')
  assert.equal(handoffFromEnv({ BUILDER_HANDOFF_ENABLED: '1', BUILDER_STUDIO_ORIGIN: 'javascript:alert(1)' })!.action, 'https://studio.yakini.digital/start')
})

test('only food truck and restaurant go to the studio for now', () => {
  assert.equal(studioBuilds('food-truck'), true)
  assert.equal(studioBuilds('restaurant'), true)
  assert.equal(studioBuilds('landlord'), true)
  assert.equal(studioBuilds('cannabis'), false)
  assert.equal(studioBuilds('service'), false)
  assert.equal(studioBuilds(undefined), false)
})

test('hidden fields carry the demo choices, with odd feature ids dropped', () => {
  const f = handoffFields({ website: ' https://mesa.example ', name: 'Mesa', kitId: 'food-truck', sizeId: 'small', items: ['online-menu', 'Bad Id!', 'catering'] })
  assert.deepEqual(f, [['sourceUrl', 'https://mesa.example'], ['businessName', 'Mesa'], ['kitId', 'food-truck'], ['sizeId', 'small'], ['features[]', 'online-menu'], ['features[]', 'catering']])
})
