import { test } from 'node:test'
import assert from 'node:assert/strict'
import { eventListingDate, eventsMosaicLabel } from '../photo-display'

const uploaded = '2026-05-19T18:00:00.000Z'

test('the Events photo mosaic does not draw the shared May 19 date', () => {
  const photos = [
    { caption: 'Gathering', eventDate: null, createdAt: uploaded },
    { caption: 'Food distribution', eventDate: '2026-05-19', createdAt: uploaded },
    { caption: 'Workshop', eventDate: null, createdAt: uploaded },
    { caption: '', eventDate: '2026-05-19', createdAt: uploaded },
    { caption: 'Summit', eventDate: null, createdAt: uploaded },
  ]
  const labels = photos.map(eventsMosaicLabel)
  assert.deepEqual(labels, ['Gathering', 'Food distribution', 'Workshop', '', 'Summit'])
  for (const label of labels) {
    assert.equal(/may|2026|19/i.test(label), false)
  }
})

test('an event listing can still show its date, separate from the photo', () => {
  assert.equal(eventListingDate('2026-05-19'), 'May 19, 2026')
  assert.equal(eventListingDate(null), null)
  assert.equal(eventListingDate(''), null)
})
