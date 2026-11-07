import { test } from 'node:test'
import assert from 'node:assert/strict'
import { photoCardText, visiblePhotoDate } from '../photo-display'

const uploaded = '2026-11-07T08:41:00.000Z'

test('an Events photo does not render its upload timestamp', () => {
  assert.equal(visiblePhotoDate({ eventDate: null, createdAt: uploaded }), null)
  assert.equal(visiblePhotoDate({ eventDate: '', createdAt: uploaded }), null)
  const text = photoCardText({ caption: 'Community fair', eventDate: null, createdAt: uploaded })
  assert.equal(text, 'Community fair')
  assert.equal(text.includes('2026'), false)
  assert.equal(text.includes('Nov'), false)
})

test('an event date someone entered can still be shown, and the upload time cannot', () => {
  const text = photoCardText({ caption: 'Food distribution', eventDate: '2026-05-09', createdAt: uploaded })
  assert.match(text, /May 9, 2026/)
  assert.match(text, /Food distribution/)
  assert.equal(text.includes('Nov'), false)
  assert.equal(text.includes(uploaded), false)
})
