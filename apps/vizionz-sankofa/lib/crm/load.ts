// VIZIONZ SANKOFA · Office CRM: server-side loaders for record pages.
// Uses the caller's own Supabase client, so RLS scopes every row.

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  ACTIVITY_COLUMNS, ATTACHMENT_COLUMNS, TASK_COLUMNS,
  type ActivityRow, type AttachmentRow, type StaffMember, type SubjectType, type TaskRow, type TimelineEntry,
} from './model'

const METHOD_LABEL: Record<string, string> = {
  phone: 'call', email: 'email', in_person: 'meeting', video: 'meeting', home_visit: 'meeting',
  text: 'text', court: 'court', group_session: 'meeting', referral: 'referral',
}

export async function loadStaff(supabase: SupabaseClient): Promise<StaffMember[]> {
  const { data } = await supabase.rpc('vs_staff_directory')
  return (data ?? []) as StaffMember[]
}

export async function loadRecordCrm(supabase: SupabaseClient, type: SubjectType, id: string) {
  const [acts, notes, tasks, files] = await Promise.all([
    type === 'participant'
      ? Promise.resolve({ data: [] as ActivityRow[] })
      : supabase.from('vs_activities').select(ACTIVITY_COLUMNS).eq('subject_type', type).eq('subject_id', id)
          .order('occurred_at', { ascending: false }).order('created_at', { ascending: false }).limit(200),
    type === 'participant'
      ? supabase.from('case_notes').select('id, contact_method, subject, content, occurred_at, staff:staff_id(first_name, last_name)')
          .eq('participant_id', id).order('occurred_at', { ascending: false }).order('created_at', { ascending: false }).limit(200)
      : Promise.resolve({ data: [] as unknown[] }),
    supabase.from('vs_tasks').select(TASK_COLUMNS).eq('subject_type', type).eq('subject_id', id)
      .order('status', { ascending: true }).order('due_on', { ascending: true, nullsFirst: false }).limit(200),
    type === 'participant'
      ? Promise.resolve({ data: [] as AttachmentRow[] })
      : supabase.from('vs_attachments').select(ATTACHMENT_COLUMNS).eq('subject_type', type).eq('subject_id', id)
          .order('created_at', { ascending: false }),
  ])
  const timeline: TimelineEntry[] = [
    ...((acts.data ?? []) as unknown as ActivityRow[]).map((a) => ({
      id: a.id, source: 'activity' as const, kind: a.kind, summary: a.summary, details: a.details,
      occurred_at: a.occurred_at, author: a.logged_by_name, direction: a.direction,
    })),
    ...((notes.data ?? []) as unknown as Array<{ id: string; contact_method: string; subject: string | null; content: string; occurred_at: string;
      staff: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null }>).map((n) => {
      const s = Array.isArray(n.staff) ? n.staff[0] : n.staff
      return {
        id: n.id, source: 'case_note' as const, kind: METHOD_LABEL[n.contact_method] ?? 'note',
        summary: n.subject || n.content.slice(0, 140), details: n.content, occurred_at: n.occurred_at,
        author: s ? `${s.first_name} ${s.last_name}` : null,
      }
    }),
  ].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
  return {
    timeline,
    tasks: (tasks.data ?? []) as unknown as TaskRow[],
    attachments: (files.data ?? []) as unknown as AttachmentRow[],
  }
}

/** Display names for the records tasks point at (each lookup is RLS-scoped). */
export async function labelTaskSubjects<T extends TaskRow>(supabase: SupabaseClient, tasks: T[]): Promise<Array<T & { subject_label: string | null }>> {
  const ids = (t: SubjectType) => [...new Set(tasks.filter((x) => x.subject_type === t && x.subject_id).map((x) => x.subject_id as string))]
  const labels = new Map<string, string>()
  const jobs: Array<PromiseLike<void>> = []
  const add = (type: SubjectType, table: string, cols: string, label: (r: Record<string, string | null>) => string) => {
    const list = ids(type)
    if (!list.length) return
    jobs.push(supabase.from(table).select(cols).in('id', list).then(({ data }) => {
      for (const r of (data ?? []) as unknown as Array<Record<string, string | null>>) labels.set(`${type}:${r.id}`, label(r))
    }))
  }
  add('contact', 'vs_contacts', 'id, display_name', (r) => r.display_name ?? '')
  add('organization', 'organizations', 'id, name', (r) => r.name ?? '')
  add('grant', 'grants', 'id, name', (r) => r.name ?? '')
  add('donor', 'donors', 'id, display_name', (r) => r.display_name ?? '')
  add('participant', 'participants', 'id, first_name, last_name, preferred_name', (r) => `${r.preferred_name || r.first_name} ${r.last_name}`)
  await Promise.all(jobs)
  return tasks.map((t) => ({ ...t, subject_label: t.subject_type && t.subject_id ? labels.get(`${t.subject_type}:${t.subject_id}`) ?? null : null }))
}

/** Everything the RecordPanel needs for one record, with role-based switches. */
export async function loadPanel(
  supabase: SupabaseClient,
  user: { id: string },
  role: import('@/lib/supabase/auth').VsAccessRole | null,
  type: SubjectType,
  id: string,
  label: string,
) {
  const { canWriteSubject, isExecOrOp } = await import('./model')
  const [{ timeline, tasks, attachments }, staff] = await Promise.all([loadRecordCrm(supabase, type, id), loadStaff(supabase)])
  return {
    subject: { type, id, label },
    timeline,
    tasks,
    attachments,
    staff,
    currentUserId: user.id,
    canWrite: canWriteSubject(role, type),
    canAddTasks: canWriteSubject(role, type),
    canDeleteEntries: isExecOrOp(role),
    canRemoveAnyFile: isExecOrOp(role),
    canEditAnyTask: isExecOrOp(role),
  }
}
