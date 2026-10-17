// VIZIONZ SANKOFA · Office CRM: shared types, labels and pure helpers.
// No server imports, so server and client components (and unit tests) can
// use it. The database enforces access (RLS); these helpers only decide what
// to show.

import type { VsAccessRole } from '@/lib/supabase/auth'

export type SubjectType = 'contact' | 'organization' | 'grant' | 'donor' | 'participant'
export type TimelineSubject = Exclude<SubjectType, 'participant'>
export type ActivityKind = 'call' | 'email' | 'meeting' | 'note'
export type ContactKind = 'partner' | 'agency' | 'funder' | 'donor' | 'vendor' | 'volunteer' | 'other'
export type TaskStatus = 'open' | 'done' | 'cancelled'
export type TaskPriority = 'low' | 'normal' | 'high'

export const ACTIVITY_KIND_LABELS: Record<ActivityKind, string> = {
  call: 'Call', email: 'Email', meeting: 'Meeting', note: 'Note',
}
export const CONTACT_KIND_LABELS: Record<ContactKind, string> = {
  partner: 'Partner', agency: 'Agency', funder: 'Funder', donor: 'Donor',
  vendor: 'Vendor', volunteer: 'Volunteer', other: 'Other',
}
/** Contact kinds a case manager may see and edit (mirrors vs_crm_cm_contact_kind). */
export const CM_CONTACT_KINDS: ContactKind[] = ['partner', 'agency', 'volunteer', 'vendor', 'other']
export const PRIORITY_LABELS: Record<TaskPriority, string> = { low: 'Low', normal: 'Normal', high: 'High' }
export const SUBJECT_LABELS: Record<SubjectType, string> = {
  contact: 'Person', organization: 'Organization', grant: 'Grant', donor: 'Donor', participant: 'Client',
}

/** Map a timeline entry kind to the case_notes contact method for client contacts. */
export function caseNoteMethod(kind: ActivityKind): 'phone' | 'email' | 'in_person' {
  if (kind === 'email') return 'email'
  if (kind === 'meeting') return 'in_person'
  return 'phone'
}

export type ActivityRow = {
  id: string
  subject_type: TimelineSubject
  subject_id: string
  kind: ActivityKind
  direction: 'inbound' | 'outbound' | null
  summary: string
  details: string | null
  occurred_at: string
  duration_minutes: number | null
  logged_by: string
  logged_by_name: string | null
}
export const ACTIVITY_COLUMNS =
  'id, subject_type, subject_id, kind, direction, summary, details, occurred_at, duration_minutes, logged_by, logged_by_name'

export type TaskRow = {
  id: string
  title: string
  notes: string | null
  due_on: string | null
  remind_on: string | null
  priority: TaskPriority
  status: TaskStatus
  assigned_to: string
  subject_type: SubjectType | null
  subject_id: string | null
  created_by: string
  completed_at: string | null
  created_at: string
}
export const TASK_COLUMNS =
  'id, title, notes, due_on, remind_on, priority, status, assigned_to, subject_type, subject_id, created_by, completed_at, created_at'

export type AttachmentRow = {
  id: string
  subject_type: TimelineSubject
  subject_id: string
  storage_path: string
  file_name: string
  mime_type: string | null
  size_bytes: number | null
  note: string | null
  uploaded_by: string
  uploaded_by_name: string | null
  created_at: string
}
export const ATTACHMENT_COLUMNS =
  'id, subject_type, subject_id, storage_path, file_name, mime_type, size_bytes, note, uploaded_by, uploaded_by_name, created_at'
export const CRM_FILES_BUCKET = 'vs-crm-files'
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024

export type ContactRow = {
  id: string
  display_name: string
  first_name: string | null
  last_name: string | null
  kind: ContactKind
  title: string | null
  organization_id: string | null
  donor_id: string | null
  email: string | null
  phone: string | null
  notes: string | null
  archived_at: string | null
  updated_at: string
}
export const CONTACT_COLUMNS =
  'id, display_name, first_name, last_name, kind, title, organization_id, donor_id, email, phone, notes, archived_at, updated_at'

export type TimelineEntry = {
  id: string
  source: 'activity' | 'case_note'
  kind: string
  summary: string
  details: string | null
  occurred_at: string
  author: string | null
  direction?: string | null
}

export type StaffMember = { user_id: string; display_name: string; access_role: string }

// ─── Roles ──────────────────────────────────────────────────────────────────

export function canWriteCrm(role: VsAccessRole | null): boolean {
  return role === 'executive' || role === 'operator' || role === 'case_manager'
}
export function isExecOrOp(role: VsAccessRole | null): boolean {
  return role === 'executive' || role === 'operator'
}
/** Can this role write timeline / tasks / files on this kind of record? (UI hint; RLS decides.) */
export function canWriteSubject(role: VsAccessRole | null, type: SubjectType): boolean {
  if (isExecOrOp(role)) return true
  if (role === 'case_manager') return type === 'contact' || type === 'organization' || type === 'participant'
  return false
}

// ─── Links ──────────────────────────────────────────────────────────────────

export function subjectHref(type: SubjectType | 'task' | 'document', id: string): string {
  switch (type) {
    case 'contact': return `/admin/contacts/${id}`
    case 'organization': return `/admin/organizations/${id}`
    case 'grant': return `/admin/grants/${id}`
    case 'donor': return `/admin/donors/${id}`
    case 'participant': return `/admin/participants/${id}`
    case 'task': return `/admin/my-day?task=${id}`
    case 'document': return '/admin/documents'
  }
}

// ─── Dates (Mountain time; due dates are plain YYYY-MM-DD) ──────────────────

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export type TaskBucket = 'overdue' | 'today' | 'week' | 'later' | 'someday'
export const BUCKET_LABELS: Record<TaskBucket, string> = {
  overdue: 'Overdue', today: 'Today', week: 'Next 7 days', later: 'Later', someday: 'No due date',
}

/** Which My Day group an open task belongs in. A reminder date of today or earlier pulls it into Today. */
export function taskBucket(t: Pick<TaskRow, 'due_on' | 'remind_on'>, today: string): TaskBucket {
  if (t.due_on && t.due_on < today) return 'overdue'
  if (t.due_on === today) return 'today'
  if (t.remind_on && t.remind_on <= today) return 'today'
  if (!t.due_on) return 'someday'
  if (t.due_on <= addDays(today, 7)) return 'week'
  return 'later'
}

const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, normal: 1, low: 2 }

export function groupTasks<T extends Pick<TaskRow, 'due_on' | 'remind_on' | 'priority' | 'status' | 'title'>>(
  tasks: T[],
  today: string,
): Record<TaskBucket, T[]> {
  const out: Record<TaskBucket, T[]> = { overdue: [], today: [], week: [], later: [], someday: [] }
  for (const t of tasks) if (t.status === 'open') out[taskBucket(t, today)].push(t)
  for (const k of Object.keys(out) as TaskBucket[]) {
    out[k].sort((a, b) =>
      (a.due_on ?? '9999').localeCompare(b.due_on ?? '9999') ||
      PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
      a.title.localeCompare(b.title))
  }
  return out
}

// ─── Needs attention (executive / operator home) ────────────────────────────

export type AttentionItem = { key: string; tone: 'red' | 'amber' | 'navy'; label: string; detail: string; href: string }

export type AttentionInput = {
  today: string
  overdueTasks: Array<{ id: string; title: string; due_on: string; assignee: string }>
  grants: Array<{ id: string; name: string; status: string; application_due_at: string | null; next_report_due: string | null }>
  partnersOverdue: Array<{ id: string; name: string; next_touch_due: string }>
  agreementsExpiring: Array<{ organization_id: string; title: string; expires_on: string }>
  newIntakes: number
  staleClients: number
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(toIso + 'T12:00:00Z') - Date.parse(fromIso + 'T12:00:00Z')) / 86400000)
}

function when(today: string, d: string): string {
  const n = daysBetween(today, d)
  if (n === 0) return 'today'
  if (n === 1) return 'tomorrow'
  if (n === -1) return 'yesterday'
  return n < 0 ? `${-n} days ago` : `in ${n} days`
}

/** Everything an executive should look at today, most urgent first. */
export function needsAttention(i: AttentionInput, windowDays = 14): AttentionItem[] {
  const horizon = addDays(i.today, windowDays)
  const items: Array<AttentionItem & { rank: number; date: string }> = []
  for (const t of i.overdueTasks) {
    items.push({ key: `task-${t.id}`, tone: 'red', label: `Overdue task: ${t.title}`, detail: `${t.assignee} · due ${when(i.today, t.due_on)}`,
      href: subjectHref('task', t.id), rank: 0, date: t.due_on })
  }
  for (const g of i.grants) {
    if (g.application_due_at && ['drafting'].includes(g.status) && g.application_due_at <= horizon) {
      const late = g.application_due_at < i.today
      items.push({ key: `grant-app-${g.id}`, tone: late ? 'red' : 'amber', label: `Grant application: ${g.name}`,
        detail: `due ${when(i.today, g.application_due_at)}`, href: subjectHref('grant', g.id), rank: late ? 0 : 1, date: g.application_due_at })
    }
    if (g.next_report_due && g.status === 'awarded' && g.next_report_due <= horizon) {
      const late = g.next_report_due < i.today
      items.push({ key: `grant-rep-${g.id}`, tone: late ? 'red' : 'amber', label: `Funder report: ${g.name}`,
        detail: `due ${when(i.today, g.next_report_due)}`, href: subjectHref('grant', g.id), rank: late ? 0 : 1, date: g.next_report_due })
    }
  }
  for (const a of i.agreementsExpiring) {
    if (a.expires_on <= addDays(i.today, 30)) {
      items.push({ key: `mou-${a.organization_id}-${a.title}`, tone: 'amber', label: `Agreement expiring: ${a.title}`,
        detail: `expires ${when(i.today, a.expires_on)}`, href: `/admin/coalition/${a.organization_id}`, rank: 2, date: a.expires_on })
    }
  }
  for (const p of i.partnersOverdue) {
    if (p.next_touch_due < i.today) {
      items.push({ key: `touch-${p.id}`, tone: 'navy', label: `Partner check-in overdue: ${p.name}`,
        detail: `was due ${when(i.today, p.next_touch_due)}`, href: subjectHref('organization', p.id), rank: 3, date: p.next_touch_due })
    }
  }
  if (i.newIntakes > 0) {
    items.push({ key: 'intakes', tone: 'amber', label: `${i.newIntakes} new Get Help request${i.newIntakes === 1 ? '' : 's'}`,
      detail: 'waiting for review', href: '/admin/intakes', rank: 1, date: i.today })
  }
  if (i.staleClients > 0) {
    items.push({ key: 'stale', tone: 'navy', label: `${i.staleClients} active client${i.staleClients === 1 ? '' : 's'} with no contact in 14+ days`,
      detail: 'see Participants', href: '/admin/participants', rank: 3, date: i.today })
  }
  return items
    .sort((a, b) => a.rank - b.rank || a.date.localeCompare(b.date) || a.label.localeCompare(b.label))
    .map(({ rank: _r, date: _d, ...rest }) => rest)
}

// ─── Misc ───────────────────────────────────────────────────────────────────

export function safeFileName(name: string): string {
  const cleaned = name.normalize('NFKD').replace(/[^\w.\- ]+/g, '').replace(/\s+/g, '-').slice(-120)
  return cleaned || 'file'
}

export function attachmentPath(type: TimelineSubject, id: string, fileName: string, now = Date.now()): string {
  return `${type}/${id}/${now}-${safeFileName(fileName)}`
}

export function formatBytes(n: number | null | undefined): string {
  if (!n && n !== 0) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export function slugify(s: string): string {
  return s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 60) || 'org'
}
