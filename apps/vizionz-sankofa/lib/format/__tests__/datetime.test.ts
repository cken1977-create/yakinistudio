import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatDateValue, formatDateTimeValue, todayInMountain } from '../datetime'

test('date-only values are shown exactly as stored (no off-by-one)', () => {
  assert.equal(formatDateValue('2026-06-02'), 'Jun 2, 2026')
  assert.equal(formatDateValue('2026-01-01'), 'Jan 1, 2026')
})

test('timestamps are shown in Mountain time', () => {
  // 15:18 UTC on Oct 25 is 9:18 AM MDT
  assert.equal(formatDateTimeValue('2026-10-25T15:18:00Z'), 'Oct 25, 2026, 9:18 AM')
  // 03:00 UTC on Oct 26 is still Oct 25 in Albuquerque
  assert.equal(formatDateValue('2026-10-26T03:00:00Z'), 'Oct 25, 2026')
  // MST in winter
  assert.equal(formatDateTimeValue('2026-12-01T19:00:00Z'), 'Dec 1, 2026, 12:00 PM')
})

test('empty and invalid values', () => {
  assert.equal(formatDateValue(null), '')
  assert.equal(formatDateTimeValue(undefined), '')
  assert.equal(formatDateValue('not a date'), 'not a date')
})

test('today is the Mountain calendar date', () => {
  assert.equal(todayInMountain(new Date('2026-10-26T03:00:00Z')), '2026-10-25')
  assert.equal(todayInMountain(new Date('2026-10-26T07:00:00Z')), '2026-10-26')
})
