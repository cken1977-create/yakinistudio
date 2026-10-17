import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  addDays, attachmentPath, canWriteSubject, caseNoteMethod, daysBetween, groupTasks, needsAttention,
  safeFileName, slugify, subjectHref, taskBucket,
} from '../model'

const today = '2026-10-17'

test('task buckets follow due and reminder dates', () => {
  assert.equal(taskBucket({ due_on: '2026-10-16', remind_on: null }, today), 'overdue')
  assert.equal(taskBucket({ due_on: today, remind_on: null }, today), 'today')
  assert.equal(taskBucket({ due_on: '2026-10-30', remind_on: today }, today), 'today')
  assert.equal(taskBucket({ due_on: '2026-10-24', remind_on: null }, today), 'week')
  assert.equal(taskBucket({ due_on: '2026-10-25', remind_on: null }, today), 'later')
  assert.equal(taskBucket({ due_on: null, remind_on: null }, today), 'someday')
})

test('groupTasks skips closed tasks and sorts by date then priority', () => {
  const g = groupTasks([
    { title: 'b', due_on: today, remind_on: null, priority: 'normal', status: 'open' },
    { title: 'a', due_on: today, remind_on: null, priority: 'high', status: 'open' },
    { title: 'done', due_on: today, remind_on: null, priority: 'high', status: 'done' },
  ], today)
  assert.deepEqual(g.today.map((t) => t.title), ['a', 'b'])
})

test('date helpers cross month ends', () => {
  assert.equal(addDays('2026-10-30', 3), '2026-11-02')
  assert.equal(daysBetween('2026-10-17', '2026-10-31'), 14)
})

test('needs attention puts overdue first and respects the window', () => {
  const items = needsAttention({
    today,
    overdueTasks: [{ id: 't1', title: 'Call ACF', due_on: '2026-10-15', assignee: 'Carly' }],
    grants: [
      { id: 'g1', name: 'City grant', status: 'drafting', application_due_at: '2026-10-20', next_report_due: null },
      { id: 'g2', name: 'Far grant', status: 'drafting', application_due_at: '2026-12-20', next_report_due: null },
      { id: 'g3', name: 'Housing NM', status: 'awarded', application_due_at: null, next_report_due: '2026-10-10' },
    ],
    partnersOverdue: [{ id: 'o1', name: 'UmojaABQ', next_touch_due: '2026-10-01' }],
    agreementsExpiring: [{ organization_id: 'o2', title: 'MOU', expires_on: '2026-11-01' }],
    newIntakes: 2,
    staleClients: 0,
  })
  const labels = items.map((i) => i.label)
  assert.ok(labels[0].startsWith('Overdue task') || labels[0].startsWith('Funder report'))
  assert.ok(labels.includes('Grant application: City grant'))
  assert.ok(!labels.some((l) => l.includes('Far grant')))
  assert.ok(labels.includes('2 new Get Help requests'))
  assert.equal(items.find((i) => i.label.includes('Housing NM'))?.tone, 'red')
  assert.equal(items.find((i) => i.label.includes('UmojaABQ'))?.href, '/admin/organizations/o1')
})

test('role hints match the database rules', () => {
  assert.equal(canWriteSubject('case_manager', 'donor'), false)
  assert.equal(canWriteSubject('case_manager', 'grant'), false)
  assert.equal(canWriteSubject('case_manager', 'organization'), true)
  assert.equal(canWriteSubject('leadership_readonly', 'contact'), false)
  assert.equal(canWriteSubject('operator', 'donor'), true)
})

test('links, file names, slugs, case note methods', () => {
  assert.equal(subjectHref('grant', 'x'), '/admin/grants/x')
  assert.equal(subjectHref('participant', 'p'), '/admin/participants/p')
  assert.equal(safeFileName('../../etc/pa ss?.pdf'), '....etcpa-ss.pdf')
  assert.ok(attachmentPath('contact', 'abc', 'My File.pdf', 5).startsWith('contact/abc/5-My-File.pdf'))
  assert.equal(slugify("God's Warehouse"), 'gods-warehouse')
  assert.equal(caseNoteMethod('meeting'), 'in_person')
  assert.equal(caseNoteMethod('call'), 'phone')
})
