import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pageHref, pageInfo, pageRange, parsePage } from '../pagination'
import { labelForAdminPath, sectionsForRole } from '../sections'

test('page parsing and ranges', () => {
  assert.equal(parsePage(undefined), 1)
  assert.equal(parsePage('0'), 1)
  assert.equal(parsePage('-3'), 1)
  assert.equal(parsePage('abc'), 1)
  assert.equal(parsePage('3'), 3)
  assert.deepEqual(pageRange(1, 25), { from: 0, to: 24 })
  assert.deepEqual(pageRange(3, 25), { from: 50, to: 74 })
})

test('page info clamps to the last page', () => {
  assert.deepEqual(pageInfo(9, 25, 60), { page: 3, pageSize: 25, from: 50, to: 59, pages: 3, total: 60 })
  assert.equal(pageInfo(1, 25, 0).pages, 1)
})

test('page links keep the filter', () => {
  assert.equal(pageHref('/admin/intakes', { filter: 'new' }, 2), '/admin/intakes?filter=new&page=2')
  assert.equal(pageHref('/admin/intakes', { filter: 'new', page: '2' }, 1), '/admin/intakes?filter=new')
  assert.equal(pageHref('/admin/intakes', {}, 1), '/admin/intakes')
})

test('reports for everyone; team for executives and operators', () => {
  const has = (role: Parameters<typeof sectionsForRole>[0], href: string) => sectionsForRole(role).some((s) => s.href === href)
  for (const r of ['executive', 'operator', 'case_manager', 'leadership_readonly'] as const) assert.ok(has(r, '/admin/reports'))
  assert.ok(has('executive', '/admin/team'))
  assert.ok(has('operator', '/admin/team'))
  assert.ok(!has('case_manager', '/admin/team'))
  assert.ok(!has('leadership_readonly', '/admin/team'))
  assert.ok(!has('case_manager', '/admin/obr'))
  assert.equal(labelForAdminPath('/admin/reports'), 'Funder Reports')
  assert.equal(labelForAdminPath('/admin/reports/housing_nm?period=ytd'), 'funder report')
  assert.equal(labelForAdminPath('/admin/profile'), 'My Profile')
  assert.equal(labelForAdminPath('/admin/team'), 'Team')
})
