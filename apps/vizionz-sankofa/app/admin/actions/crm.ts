'use server'

// VIZIONZ SANKOFA · Office CRM server actions
// Timeline entries, tasks, people and organizations. Every write goes through
// the signed-in user's own Supabase session, so row-level security decides
// what is allowed and the audit triggers record who did it. The role checks
// here only give friendlier messages; they are not the security boundary.

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireOperatorOrEmployee, getAccessRole } from '@/lib/supabase/auth'
import {
  CM_CONTACT_KINDS, caseNoteMethod, canWriteSubject, isExecOrOp, slugify,
  type ActivityKind, type ContactKind, type SubjectType, type TaskPriority, type TaskStatus,
} from '@/lib/crm/model'

export type CrmResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string }

const SUBJECTS: SubjectType[] = ['contact', 'organization', 'grant', 'donor', 'participant']
const KINDS: ActivityKind[] = ['call', 'email', 'meeting', 'note']
const CONTACT_KINDS: ContactKind[] = ['partner', 'agency', 'funder', 'donor', 'vendor', 'volunteer', 'other']
const PRIORITIES: TaskPriority[] = ['low', 'normal', 'high']
const STATUSES: TaskStatus[] = ['open', 'done', 'cancelled']
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DATE = /^\d{4}-\d{2}-\d{2}$/

const str = (fd: FormData, k: string, max = 4000) => String(fd.get(k) ?? '').trim().slice(0, max)
const optDate = (v: string) => (DATE.test(v) ? v : null)

function friendly(error: { code?: string; message: string }): string {
  if (error.code === '42501') return "You don't have permission to do that."
  if (error.code === '23503') return 'That record no longer exists.'
  return error.message
}

function revalidateSubject(type: string, id: string) {
  revalidatePath('/admin/my-day')
  revalidatePath('/admin')
  if (type === 'contact') revalidatePath(`/admin/contacts/${id}`)
  if (type === 'organization') revalidatePath(`/admin/organizations/${id}`)
  if (type === 'grant') revalidatePath(`/admin/grants/${id}`)
  if (type === 'donor') revalidatePath(`/admin/donors/${id}`)
  if (type === 'participant') revalidatePath(`/admin/participants/${id}`)
}

// ─── Timeline ───────────────────────────────────────────────────────────────

/** "+ Log": call / email / meeting / note on any record. Client contacts go to case_notes. */
export async function logActivity(fd: FormData): Promise<CrmResult> {
  const user = await requireOperatorOrEmployee()
  const role = getAccessRole(user)
  const subjectType = str(fd, 'subject_type') as SubjectType
  const subjectId = str(fd, 'subject_id')
  const kind = str(fd, 'kind') as ActivityKind
  const summary = str(fd, 'summary', 500)
  const details = str(fd, 'details')
  const direction = str(fd, 'direction')
  const occurredOn = optDate(str(fd, 'occurred_on'))
  const duration = Number(str(fd, 'duration_minutes')) || null

  if (!SUBJECTS.includes(subjectType) || !UUID.test(subjectId)) return { ok: false, error: 'Choose who or what this is about.' }
  if (!KINDS.includes(kind)) return { ok: false, error: 'Choose call, email, meeting or note.' }
  if (!summary) return { ok: false, error: 'Add a short summary.' }
  if (!canWriteSubject(role, subjectType)) return { ok: false, error: "You don't have permission to log on this record." }

  const supabase = await createClient()
  // Today's entries keep the real time; back-dated ones are noon Mountain that day.
  const occurredAt = occurredOn ? new Date(`${occurredOn}T12:00:00-06:00`).toISOString() : new Date().toISOString()

  if (subjectType === 'participant') {
    const { data: staffId } = await supabase.rpc('vs_current_staff_id')
    if (!staffId) return { ok: false, error: 'Your login is not linked to a staff record yet, so client contacts can’t be logged. Ask Carly to link it.' }
    const { error } = await supabase.from('case_notes').insert({
      participant_id: subjectId, staff_id: staffId, contact_method: caseNoteMethod(kind),
      subject: summary, content: details || summary, occurred_at: occurredAt, duration_minutes: duration,
    })
    if (error) return { ok: false, error: error.code === '42501' ? 'You can only log contacts for your own clients.' : friendly(error) }
  } else {
    const { error } = await supabase.from('vs_activities').insert({
      subject_type: subjectType, subject_id: subjectId, kind, summary, details: details || null,
      direction: direction === 'inbound' || direction === 'outbound' ? direction : null,
      occurred_at: occurredAt, duration_minutes: duration, logged_by: user.id,
    })
    if (error) return { ok: false, error: friendly(error) }
  }
  revalidateSubject(subjectType, subjectId)
  return { ok: true }
}

export async function deleteActivity(id: string): Promise<CrmResult> {
  const user = await requireOperatorOrEmployee()
  if (!isExecOrOp(getAccessRole(user))) return { ok: false, error: 'Only executives and operators can delete timeline entries.' }
  if (!UUID.test(id)) return { ok: false, error: 'Unknown entry.' }
  const supabase = await createClient()
  const { data, error } = await supabase.from('vs_activities').delete().eq('id', id).select('subject_type, subject_id')
  if (error) return { ok: false, error: friendly(error) }
  if (data?.[0]) revalidateSubject(data[0].subject_type, data[0].subject_id)
  return { ok: true }
}

// ─── Tasks ──────────────────────────────────────────────────────────────────

export async function createTask(fd: FormData): Promise<CrmResult<{ id: string }>> {
  const user = await requireOperatorOrEmployee()
  const role = getAccessRole(user)
  if (role === 'leadership_readonly' || !role) return { ok: false, error: 'Your role is read-only.' }
  const title = str(fd, 'title', 300)
  const assignedTo = str(fd, 'assigned_to') || user.id
  const subjectType = str(fd, 'subject_type') as SubjectType | ''
  const subjectId = str(fd, 'subject_id')
  const priority = (str(fd, 'priority') || 'normal') as TaskPriority
  if (!title) return { ok: false, error: 'Give the task a title.' }
  if (!UUID.test(assignedTo)) return { ok: false, error: 'Choose who it is for.' }
  if (!PRIORITIES.includes(priority)) return { ok: false, error: 'Unknown priority.' }
  if (subjectType && (!SUBJECTS.includes(subjectType) || !UUID.test(subjectId))) return { ok: false, error: 'Unknown record.' }

  const supabase = await createClient()
  const { data, error } = await supabase.from('vs_tasks').insert({
    title, notes: str(fd, 'notes') || null, due_on: optDate(str(fd, 'due_on')), remind_on: optDate(str(fd, 'remind_on')),
    priority, assigned_to: assignedTo, subject_type: subjectType || null, subject_id: subjectType ? subjectId : null,
    created_by: user.id,
  }).select('id').single()
  if (error || !data) return { ok: false, error: error ? friendly(error) : 'Could not save the task.' }
  if (subjectType) revalidateSubject(subjectType, subjectId)
  else revalidatePath('/admin/my-day')
  return { ok: true, data: { id: data.id as string } }
}

export async function updateTask(id: string, fd: FormData): Promise<CrmResult> {
  await requireOperatorOrEmployee()
  if (!UUID.test(id)) return { ok: false, error: 'Unknown task.' }
  const patch: Record<string, unknown> = {}
  if (fd.has('title')) { const t = str(fd, 'title', 300); if (!t) return { ok: false, error: 'Give the task a title.' }; patch.title = t }
  if (fd.has('notes')) patch.notes = str(fd, 'notes') || null
  if (fd.has('due_on')) patch.due_on = optDate(str(fd, 'due_on'))
  if (fd.has('remind_on')) patch.remind_on = optDate(str(fd, 'remind_on'))
  if (fd.has('priority')) { const p = str(fd, 'priority') as TaskPriority; if (!PRIORITIES.includes(p)) return { ok: false, error: 'Unknown priority.' }; patch.priority = p }
  if (fd.has('assigned_to')) { const a = str(fd, 'assigned_to'); if (!UUID.test(a)) return { ok: false, error: 'Choose who it is for.' }; patch.assigned_to = a }
  if (fd.has('status')) { const s = str(fd, 'status') as TaskStatus; if (!STATUSES.includes(s)) return { ok: false, error: 'Unknown status.' }; patch.status = s }
  const supabase = await createClient()
  const { data, error } = await supabase.from('vs_tasks').update(patch).eq('id', id).select('subject_type, subject_id')
  if (error) return { ok: false, error: friendly(error) }
  if (!data || data.length === 0) return { ok: false, error: "You can't change this task." }
  if (data[0].subject_type) revalidateSubject(data[0].subject_type, data[0].subject_id)
  else revalidatePath('/admin/my-day')
  return { ok: true }
}

export async function setTaskStatus(id: string, status: TaskStatus): Promise<CrmResult> {
  const fd = new FormData()
  fd.set('status', status)
  return updateTask(id, fd)
}

export async function deleteTask(id: string): Promise<CrmResult> {
  await requireOperatorOrEmployee()
  if (!UUID.test(id)) return { ok: false, error: 'Unknown task.' }
  const supabase = await createClient()
  const { data, error } = await supabase.from('vs_tasks').delete().eq('id', id).select('id')
  if (error) return { ok: false, error: friendly(error) }
  if (!data || data.length === 0) return { ok: false, error: "You can't delete this task. Mark it cancelled instead." }
  revalidatePath('/admin/my-day')
  return { ok: true }
}

// ─── People ─────────────────────────────────────────────────────────────────

function contactFields(fd: FormData) {
  const first = str(fd, 'first_name', 120)
  const last = str(fd, 'last_name', 120)
  const display = str(fd, 'display_name', 200) || [first, last].filter(Boolean).join(' ')
  const org = str(fd, 'organization_id')
  return {
    first_name: first || null, last_name: last || null, display_name: display,
    kind: (str(fd, 'kind') || 'partner') as ContactKind,
    title: str(fd, 'title', 200) || null,
    organization_id: UUID.test(org) ? org : null,
    email: str(fd, 'email', 200) || null,
    phone: str(fd, 'phone', 60) || null,
    notes: str(fd, 'notes') || null,
  }
}

export async function createContact(fd: FormData): Promise<CrmResult<{ id: string }>> {
  const user = await requireOperatorOrEmployee()
  const role = getAccessRole(user)
  const f = contactFields(fd)
  if (!f.display_name) return { ok: false, error: 'Add a name.' }
  if (!CONTACT_KINDS.includes(f.kind)) return { ok: false, error: 'Choose a type.' }
  if (role === 'case_manager' && !CM_CONTACT_KINDS.includes(f.kind)) return { ok: false, error: 'Funder and donor contacts are added by Carly or Khadijah.' }
  if (!canWriteSubject(role, 'contact')) return { ok: false, error: 'Your role is read-only.' }
  const supabase = await createClient()
  const { data, error } = await supabase.from('vs_contacts').insert(f).select('id').single()
  if (error || !data) return { ok: false, error: error ? friendly(error) : 'Could not save.' }
  revalidatePath('/admin/contacts')
  return { ok: true, data: { id: data.id as string } }
}

export async function updateContact(id: string, fd: FormData): Promise<CrmResult> {
  await requireOperatorOrEmployee()
  if (!UUID.test(id)) return { ok: false, error: 'Unknown person.' }
  const f = contactFields(fd)
  if (!f.display_name) return { ok: false, error: 'Add a name.' }
  if (!CONTACT_KINDS.includes(f.kind)) return { ok: false, error: 'Choose a type.' }
  const supabase = await createClient()
  const { data, error } = await supabase.from('vs_contacts').update(f).eq('id', id).select('id')
  if (error) return { ok: false, error: friendly(error) }
  if (!data || data.length === 0) return { ok: false, error: "You can't edit this person." }
  revalidatePath('/admin/contacts')
  revalidatePath(`/admin/contacts/${id}`)
  return { ok: true }
}

export async function setContactArchived(id: string, archived: boolean): Promise<CrmResult> {
  await requireOperatorOrEmployee()
  if (!UUID.test(id)) return { ok: false, error: 'Unknown person.' }
  const supabase = await createClient()
  const { data, error } = await supabase.from('vs_contacts')
    .update({ archived_at: archived ? new Date().toISOString() : null }).eq('id', id).select('id')
  if (error) return { ok: false, error: friendly(error) }
  if (!data || data.length === 0) return { ok: false, error: "You can't change this person." }
  revalidatePath('/admin/contacts')
  revalidatePath(`/admin/contacts/${id}`)
  return { ok: true }
}

// ─── Organizations ──────────────────────────────────────────────────────────

const ORG_KINDS = ['partner', 'funder', 'both', 'agency'] as const
const ORG_TYPES = ['federal', 'state', 'county', 'city', 'foundation', 'corporate', 'coalition', 'nonprofit', 'united_way', 'faith_based', 'other'] as const

export async function createOrganization(fd: FormData): Promise<CrmResult<{ id: string }>> {
  const user = await requireOperatorOrEmployee()
  if (!isExecOrOp(getAccessRole(user))) return { ok: false, error: 'Organizations are added by executives and operators.' }
  const name = str(fd, 'name', 200)
  const kind = str(fd, 'relationship_kind') as (typeof ORG_KINDS)[number]
  const type = (str(fd, 'type') || 'other') as (typeof ORG_TYPES)[number]
  if (!name) return { ok: false, error: 'Add a name.' }
  if (!ORG_KINDS.includes(kind)) return { ok: false, error: 'Choose partner, funder, both or agency.' }
  if (!ORG_TYPES.includes(type)) return { ok: false, error: 'Choose a type.' }
  const supabase = await createClient()
  const base = slugify(name)
  for (let i = 0; i < 5; i++) {
    const slug = i === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`
    const { data, error } = await supabase.from('organizations').insert({
      name, slug, relationship_kind: kind, type, status: 'active',
      website: str(fd, 'website', 300) || null, notes: str(fd, 'notes') || null,
      primary_contact_name: str(fd, 'primary_contact_name', 200) || null,
      primary_contact_email: str(fd, 'primary_contact_email', 200) || null,
      primary_contact_phone: str(fd, 'primary_contact_phone', 60) || null,
    }).select('id').single()
    if (!error && data) {
      revalidatePath('/admin/contacts')
      return { ok: true, data: { id: data.id as string } }
    }
    if (error && error.code !== '23505') return { ok: false, error: friendly(error) }
  }
  return { ok: false, error: 'An organization with that name already exists.' }
}

export async function setOrganizationNextTouch(id: string, date: string): Promise<CrmResult> {
  const user = await requireOperatorOrEmployee()
  if (!isExecOrOp(getAccessRole(user))) return { ok: false, error: 'Only executives and operators can change this.' }
  if (!UUID.test(id)) return { ok: false, error: 'Unknown organization.' }
  const supabase = await createClient()
  const { error } = await supabase.from('organizations').update({ next_touch_due: optDate(date) }).eq('id', id)
  if (error) return { ok: false, error: friendly(error) }
  revalidateSubject('organization', id)
  return { ok: true }
}
