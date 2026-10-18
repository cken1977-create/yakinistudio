import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseMentions, mentionSegments, dmOther, mergeMessages, totalUnread, looksLikeClientPii, chatFilePath, type ChatMessage } from '../model'

const people = [
  { user_id: 'u1', display_name: 'Carly', access_role: 'executive' },
  { user_id: 'u2', display_name: 'Carly Ann', access_role: 'operator' },
  { user_id: 'u3', display_name: 'Tyra', access_role: 'case_manager' },
]

test('mentions match known staff names, longest first, whole words only', () => {
  assert.deepEqual(parseMentions('hi @Carly Ann and @tyra!', people).sort(), ['u2', 'u3'])
  assert.deepEqual(parseMentions('email carly@vizionz.org', people), [])
  assert.deepEqual(parseMentions('@Carlyx', people), [])
  assert.deepEqual(parseMentions('@Carly can you', people), ['u1'])
})

test('mention segments for display', () => {
  assert.deepEqual(mentionSegments('ok @Tyra thanks', people), [
    { text: 'ok ', mention: false }, { text: '@Tyra', mention: true }, { text: ' thanks', mention: false }])
})

test('dm other party', () => {
  assert.equal(dmOther({ dm_key: 'a:b' }, 'a'), 'b')
  assert.equal(dmOther({ dm_key: 'a:b' }, 'b'), 'a')
  assert.equal(dmOther({ dm_key: null }, 'a'), null)
})

test('merging realtime and polled messages keeps order with no duplicates', () => {
  const m = (id: string, t: string, body = id): ChatMessage => ({ id, channel_id: 'c', author_id: null, author_name: null, body, mentions: [],
    attachment_path: null, attachment_name: null, attachment_size: null, attachment_mime: null, created_at: t, edited_at: null, deleted_at: null })
  const out = mergeMessages([m('a', '1'), m('b', '2')], [m('b', '2', 'edited'), m('c', '3')])
  assert.deepEqual(out.map((x) => x.id), ['a', 'b', 'c'])
  assert.equal(out[1].body, 'edited')
})

test('unread totals, PII hint and file paths', () => {
  assert.deepEqual(totalUnread([{ channel_id: 'a', unread: 2, mentions: 1 }, { channel_id: 'b', unread: 3, mentions: 0 }]), { unread: 5, mentions: 1 })
  assert.equal(looksLikeClientPii('her SSN is 123-45-6789'), true)
  assert.equal(looksLikeClientPii('lunch at noon?'), false)
  assert.equal(chatFilePath('c1', 'Flyer draft.pdf', 'r'), 'c1/r/Flyer-draft.pdf')
})
