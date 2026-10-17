import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyArrival, previousFrom } from '../stack'
import { isActiveSection, labelForAdminPath, sectionsForRole } from '../sections'

test('list -> open item -> back -> open a different item', () => {
  let s: string[] = []
  s = applyArrival(s, '/admin').stack
  s = applyArrival(s, '/admin/participants').stack
  // filter typed on the list (replaceState) keeps one entry for the screen
  s = applyArrival(s, '/admin/participants?status=active&q=te').stack
  assert.deepEqual(s, ['/admin', '/admin/participants?status=active&q=te'])
  s = applyArrival(s, '/admin/participants/aaa').stack
  assert.equal(previousFrom(s, '/admin/participants/aaa'), '/admin/participants?status=active&q=te')
  const back = applyArrival(s, '/admin/participants?status=active&q=te')
  assert.equal(back.isBack, true)
  s = back.stack
  s = applyArrival(s, '/admin/participants/bbb').stack
  assert.equal(previousFrom(s, '/admin/participants/bbb'), '/admin/participants?status=active&q=te')
  assert.deepEqual(s, ['/admin', '/admin/participants?status=active&q=te', '/admin/participants/bbb'])
})

test('detail tab change replaces, so back still returns to the list', () => {
  let s = ['/admin/cohorts', '/admin/cohorts/c1']
  s = applyArrival(s, '/admin/participants/p1').stack
  s = applyArrival(s, '/admin/participants/p1?tab=services').stack
  assert.equal(previousFrom(s, '/admin/participants/p1?tab=services'), '/admin/cohorts/c1')
})

test('reload does not change the stack; no history means no previous', () => {
  const s = applyArrival(['/admin', '/admin/obr'], '/admin/obr')
  assert.deepEqual(s.stack, ['/admin', '/admin/obr'])
  assert.equal(s.isBack, false)
  assert.equal(previousFrom(['/admin/coalition/x'], '/admin/coalition/x'), null)
  assert.equal(previousFrom(['/admin', '/admin/obr'], '/admin/other'), null)
})

test('stack is capped', () => {
  let s: string[] = []
  for (let i = 0; i < 100; i++) s = applyArrival(s, `/admin/participants/${i}`).stack
  assert.equal(s.length, 40)
})

test('labels for back control and breadcrumbs', () => {
  assert.equal(labelForAdminPath('/admin'), 'Operations')
  assert.equal(labelForAdminPath('/admin/participants?status=active'), 'Participants')
  assert.equal(labelForAdminPath('/admin/participants/123'), 'participant')
  assert.equal(labelForAdminPath('/admin/coalition'), 'Coalition Partners')
  assert.equal(labelForAdminPath('/admin/coalition/abc?tab=checkins'), 'partner')
  assert.equal(labelForAdminPath('/admin/obr/abc'), 'OBR intake')
  assert.equal(labelForAdminPath('/admin/integrations/google/x/sheets'), 'Google Sheets')
})

test('section nav is role-aware and marks the active section', () => {
  const cm = sectionsForRole('case_manager').map((s) => s.href)
  assert.ok(cm.includes('/admin/participants'))
  assert.ok(!cm.includes('/admin/donors'))
  assert.ok(!cm.includes('/admin/obr'), 'case managers do not see OBR')
  assert.ok(sectionsForRole('leadership_readonly').some((s) => s.href === '/admin/obr'))
  assert.ok(sectionsForRole('operator').some((s) => s.href === '/admin/media'))
  assert.equal(sectionsForRole(null).every((s) => s.roles === 'all'), true)
  assert.equal(isActiveSection('/admin', '/admin/participants'), false)
  assert.equal(isActiveSection('/admin/participants', '/admin/participants/1'), true)
})
