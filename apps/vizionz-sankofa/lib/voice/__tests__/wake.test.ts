import assert from 'node:assert/strict'
import test from 'node:test'
import {
  EXPECTED_WAKE_PHRASE, WAKE_PAGE_LIMIT, activePhrase, matchWake, phraseGuidance,
  shouldUseOnDevice, wakeHeard, wakeOff, wakePress, wakeStartFailed, wakeStarted, wakeSupport,
} from '../wake'

const support = wakeSupport({ hasRecognition: true, isSecureContext: true })

test('Hey Sankofa is the phrase, and a following command is captured', () => {
  assert.equal(EXPECTED_WAKE_PHRASE, 'Hey Sankofa')
  assert.equal(activePhrase(null), 'Hey Sankofa')
  assert.equal(activePhrase('  '), 'Hey Sankofa')
  const alone = matchWake('Hey Sankofa')
  assert.equal(alone.matched && alone.command, '')
  const command = matchWake('Hey Sankofa, how many clients are enrolled?')
  assert.equal(command.matched && command.command, 'how many clients are enrolled')
  const spaced = matchWake('hey,   sankofa what is on my day')
  assert.equal(spaced.matched && spaced.command, 'what is on my day')
  assert.equal(matchWake('hello there').matched, false)
  assert.equal(matchWake('Sankofa').matched, false)
})

test('a different saved phrase is called out instead of pretending it is Hey Sankofa', () => {
  assert.equal(phraseGuidance('Hey Sankofa'), null)
  assert.match(phraseGuidance('Hey Assistant') ?? '', /not “Hey Sankofa”/)
})

test('pressing Wake shows a starting status and does not claim it is already listening', () => {
  const next = wakePress(wakeOff(), support, EXPECTED_WAKE_PHRASE)
  assert.equal(next.phase, 'starting')
  assert.match(next.message ?? '', /Turning the microphone on/)
  assert.doesNotMatch(next.message ?? '', /Listening for/)
  const live = wakeStarted(EXPECTED_WAKE_PHRASE)
  assert.match(live.message ?? '', /Listening for “Hey Sankofa”/)
  assert.match(live.message ?? '', new RegExp(WAKE_PAGE_LIMIT.slice(0, 24)))
  assert.match(live.message ?? '', /does not keep listening/)
})

test('a second press while starting turns Wake off instead of starting twice', () => {
  const starting = wakePress(wakeOff(), support, EXPECTED_WAKE_PHRASE)
  const again = wakePress(starting, support, EXPECTED_WAKE_PHRASE)
  assert.equal(again.phase, 'off')
  assert.match(again.message ?? '', /Wake is off/)
  assert.equal(again.command, null)
})

test('speech is visible before it is final, and Hey Sankofa with a command is asked', () => {
  const live = wakeStarted(EXPECTED_WAKE_PHRASE)
  const partial = wakeHeard(live, 'hey sankofa', false, EXPECTED_WAKE_PHRASE)
  assert.match(partial.view.message ?? '', /Hearing:/)
  assert.equal(partial.command, null)
  const asked = wakeHeard(live, 'Hey Sankofa how many clients', true, EXPECTED_WAKE_PHRASE)
  assert.equal(asked.command, 'how many clients')
  assert.match(asked.view.message ?? '', /Asking: how many clients/)
})

test('Hey Sankofa alone waits for the question and does not send the phrase', () => {
  const heard = wakeHeard(wakeStarted(EXPECTED_WAKE_PHRASE), 'Hey Sankofa', true, EXPECTED_WAKE_PHRASE)
  assert.equal(heard.command, null)
  assert.equal(heard.view.phase, 'awaiting-command')
  assert.match(heard.view.message ?? '', /Heard “Hey Sankofa”/)
  const follow = wakeHeard(heard.view, 'how many clients', true, EXPECTED_WAKE_PHRASE)
  assert.equal(follow.command, 'how many clients')
})

test('something other than the wake phrase is shown and not sent', () => {
  const heard = wakeHeard(wakeStarted(EXPECTED_WAKE_PHRASE), 'hello there', true, EXPECTED_WAKE_PHRASE)
  assert.equal(heard.command, null)
  assert.match(heard.view.message ?? '', /hello there/)
  assert.match(heard.view.message ?? '', /Hey Sankofa/)
})

test('a failed start is an error on screen, not a silent listening state', () => {
  for (const code of ['not-allowed', 'audio-capture', 'network', 'language-not-supported']) {
    const failed = wakeStartFailed(code)
    assert.equal(failed.phase, 'error')
    assert.equal(failed.command, null)
    assert.doesNotMatch(failed.message ?? '', /^Listening/)
    assert.match(failed.message ?? '', /type your question/i)
  }
  const none = wakeStartFailed('no-speech')
  assert.match(none.message ?? '', /No speech was heard/)
  assert.match(none.message ?? '', /Hey Sankofa/)
})

test('unsupported browser and a non-https page do not pretend the microphone started', () => {
  const browser = wakeSupport({ hasRecognition: false, isSecureContext: true })
  assert.equal(browser.ok, false)
  if (!browser.ok) assert.match(browser.message, /Type your question/)
  const insecure = wakeSupport({ hasRecognition: true, isSecureContext: false })
  assert.equal(insecure.ok, false)
  if (!insecure.ok) assert.match(insecure.message, /https/)
  const blocked = wakePress(wakeOff(), insecure, EXPECTED_WAKE_PHRASE)
  assert.equal(blocked.phase, 'error')
})

test('on-device recognition is not forced just because the switch exists', () => {
  assert.equal(shouldUseOnDevice('available'), true)
  assert.equal(shouldUseOnDevice('unavailable'), false)
  assert.equal(shouldUseOnDevice('downloadable'), false)
  assert.equal(shouldUseOnDevice(null), false)
  assert.equal(shouldUseOnDevice(undefined), false)
})
