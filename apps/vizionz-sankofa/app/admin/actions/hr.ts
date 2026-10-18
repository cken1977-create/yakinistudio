'use server'

// VIZIONZ SANKOFA · Staff records server actions (job descriptions, handbooks,
// onboarding). Writes run in the signed-in user's own Supabase session, so RLS
// decides and the audit triggers record who did it. Acknowledgements and
// signatures go only through the database functions built for them.

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireOperatorOrEmployee, getAccessRole } from '@/lib/supabase/auth'

export type HrResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DATE = /^\d{4}-\d{2}-\d{2}$/
const ROLES = ['executive', 'operator', 'case_manager', 'leadership_readonly'] as const
const str = (fd: FormData, k: string, max = 8000) => String(fd.get(k) ?? '').trim().slice(0, max)
const opt = (v: string) => (v ? v : null)

function friendly(error: { code?: string; message: string }): string {
  if (error.code === '42501') return "You don't have permission to do that."
  if (error.code === '23503') return 'That record no longer exists.'
  if (error.code === '23505') return 'That is already assigned or already exists.'
  return error.message
}

async function manager() {
  const user = await requireOperatorOrEmployee()
  const role = getAccessRole(user)
  if (role !== 'executive' && role !== 'operator') return { user, error: 'Only executives and operators manage staff records.' as const }
  return { user, error: null }
}

function refresh() {
  revalidatePath('/admin/hr')
  revalidatePath('/admin/profile')
}

// ─── Job descriptions ───────────────────────────────────────────────────────

export async function saveJobDescription(fd: FormData): Promise<HrResult<{ id: string }>> {
  const { error: denied } = await manager()
  if (denied) return { ok: false, error: denied }
  const id = str(fd, 'id')
  const row = {
    title: str(fd, 'title', 200),
    summary: opt(str(fd, 'summary')),
    duties: opt(str(fd, 'duties')),
    qualifications: opt(str(fd, 'qualifications')),
    reports_to: opt(str(fd, 'reports_to', 200)),
  }
  if (!row.title) return { ok: false, error: 'Give the job a title.' }
  const supabase = await createClient()
  const q = id && UUID.test(id)
    ? supabase.from('vs_job_descriptions').update(row).eq('id', id).select('id').single()
    : supabase.from('vs_job_descriptions').insert(row).select('id').single()
  const { data, error } = await q
  if (error) return { ok: false, error: friendly(error) }
  refresh()
  return { ok: true, data: { id: data.id as string } }
}

export async function setJobDescriptionArchived(id: string, archived: boolean): Promise<HrResult> {
  const { error: denied } = await manager()
  if (denied) return { ok: false, error: denied }
  if (!UUID.test(id)) return { ok: false, error: 'Unknown job description.' }
  const supabase = await createClient()
  const { error } = await supabase.from('vs_job_descriptions').update({ archived_at: archived ? new Date().toISOString() : null }).eq('id', id)
  if (error) return { ok: false, error: friendly(error) }
  refresh()
  return { ok: true }
}

/** Assign to a staff member ("user:<uuid>") or an open invite ("invite:<uuid>"). Ends their previous JD. */
export async function assignJobDescription(jobDescriptionId: string, who: string): Promise<HrResult> {
  const { error: denied } = await manager()
  if (denied) return { ok: false, error: denied }
  const [kind, id] = who.split(':')
  if (!UUID.test(jobDescriptionId) || !id || !UUID.test(id) || (kind !== 'user' && kind !== 'invite')) return { ok: false, error: 'Pick a person.' }
  const supabase = await createClient()
  const col = kind === 'user' ? 'user_id' : 'invite_id'
  const now = new Date().toISOString()
  const { error: endErr } = await supabase.from('vs_jd_assignments').update({ ended_at: now }).eq(col, id).is('ended_at', null)
  if (endErr) return { ok: false, error: friendly(endErr) }
  const { error } = await supabase.from('vs_jd_assignments').insert({ job_description_id: jobDescriptionId, [col]: id })
  if (error) return { ok: false, error: friendly(error) }
  refresh()
  return { ok: true }
}

export async function endJdAssignment(assignmentId: string): Promise<HrResult> {
  const { error: denied } = await manager()
  if (denied) return { ok: false, error: denied }
  if (!UUID.test(assignmentId)) return { ok: false, error: 'Unknown assignment.' }
  const supabase = await createClient()
  const { error } = await supabase.from('vs_jd_assignments').update({ ended_at: new Date().toISOString() }).eq('id', assignmentId)
  if (error) return { ok: false, error: friendly(error) }
  refresh()
  return { ok: true }
}

/** Staff: "I have read my job description." */
export async function acknowledgeJobDescription(assignmentId: string): Promise<HrResult> {
  await requireOperatorOrEmployee()
  if (!UUID.test(assignmentId)) return { ok: false, error: 'Unknown assignment.' }
  const supabase = await createClient()
  const { error } = await supabase.rpc('vs_acknowledge_job_description', { p_assignment: assignmentId })
  if (error) return { ok: false, error: friendly(error) }
  refresh()
  return { ok: true }
}

// ─── Handbooks ─────────────────────────────────────────────────────────────

export async function createHandbook(fd: FormData): Promise<HrResult<{ id: string }>> {
  const { error: denied } = await manager()
  if (denied) return { ok: false, error: denied }
  const title = str(fd, 'title', 200)
  if (!title) return { ok: false, error: 'Give the handbook a title.' }
  const supabase = await createClient()
  const { data, error } = await supabase.from('vs_handbooks').insert({ title, description: opt(str(fd, 'description', 1000)) }).select('id').single()
  if (error) return { ok: false, error: friendly(error) }
  refresh()
  return { ok: true, data: { id: data.id as string } }
}

/** Publish a new version: written text, or a file already uploaded to vs-hr-files. */
export async function publishHandbookVersion(input: {
  handbookId: string; body?: string; changeNote?: string
  file?: { path: string; name: string; size: number; mime: string }
}): Promise<HrResult> {
  const { error: denied } = await manager()
  if (denied) return { ok: false, error: denied }
  if (!UUID.test(input.handbookId)) return { ok: false, error: 'Unknown handbook.' }
  const body = (input.body ?? '').trim().slice(0, 200000)
  if (!body && !input.file) return { ok: false, error: 'Write the handbook text or attach a file.' }
  if (input.file && !input.file.path.startsWith(`handbooks/${input.handbookId}/`)) return { ok: false, error: 'File is in the wrong folder.' }
  const supabase = await createClient()
  const { error } = await supabase.from('vs_handbook_versions').insert({
    handbook_id: input.handbookId,
    body: body || null,
    change_note: (input.changeNote ?? '').trim().slice(0, 500) || null,
    storage_path: input.file?.path ?? null,
    file_name: input.file?.name.slice(0, 200) ?? null,
    file_size: input.file?.size ?? null,
    mime_type: input.file?.mime.slice(0, 100) ?? null,
  })
  if (error) return { ok: false, error: friendly(error) }
  refresh()
  return { ok: true }
}

export async function assignHandbook(handbookId: string, who: string): Promise<HrResult> {
  const { error: denied } = await manager()
  if (denied) return { ok: false, error: denied }
  const [kind, id] = who.split(':')
  if (!UUID.test(handbookId) || !id || !UUID.test(id) || (kind !== 'user' && kind !== 'invite')) return { ok: false, error: 'Pick a person.' }
  const supabase = await createClient()
  const { error } = await supabase.from('vs_handbook_assignments').insert({ handbook_id: handbookId, [kind === 'user' ? 'user_id' : 'invite_id']: id })
  if (error) return { ok: false, error: friendly(error) }
  refresh()
  return { ok: true }
}

export async function endHandbookAssignment(assignmentId: string): Promise<HrResult> {
  const { error: denied } = await manager()
  if (denied) return { ok: false, error: denied }
  if (!UUID.test(assignmentId)) return { ok: false, error: 'Unknown assignment.' }
  const supabase = await createClient()
  const { error } = await supabase.from('vs_handbook_assignments').update({ ended_at: new Date().toISOString() }).eq('id', assignmentId)
  if (error) return { ok: false, error: friendly(error) }
  refresh()
  return { ok: true }
}

export async function markHandbookRead(versionId: string): Promise<HrResult> {
  await requireOperatorOrEmployee()
  if (!UUID.test(versionId)) return { ok: false, error: 'Unknown handbook version.' }
  const supabase = await createClient()
  const { error } = await supabase.rpc('vs_handbook_mark_read', { p_version: versionId })
  if (error) return { ok: false, error: friendly(error) }
  revalidatePath('/admin/profile')
  return { ok: true }
}

export async function signHandbook(versionId: string, signedName: string): Promise<HrResult> {
  await requireOperatorOrEmployee()
  if (!UUID.test(versionId)) return { ok: false, error: 'Unknown handbook version.' }
  if (!signedName.trim()) return { ok: false, error: 'Type your full name to sign.' }
  const supabase = await createClient()
  const { error } = await supabase.rpc('vs_handbook_sign', { p_version: versionId, p_signed_name: signedName.trim() })
  if (error) return { ok: false, error: friendly(error) }
  refresh()
  return { ok: true }
}

// ─── Onboarding ────────────────────────────────────────────────────────────

/** New hire: save the invite (same as Team), then bundle JD + handbook. No email is sent here. */
export async function createOnboarding(fd: FormData): Promise<HrResult<{ id: string }>> {
  const { error: denied } = await manager()
  if (denied) return { ok: false, error: denied }
  const fullName = str(fd, 'full_name', 200)
  const email = str(fd, 'email', 254).toLowerCase()
  const accessRole = str(fd, 'access_role')
  const jdId = str(fd, 'job_description_id')
  const handbookId = str(fd, 'handbook_id')
  const startDate = str(fd, 'start_date')
  if (!fullName) return { ok: false, error: 'Enter the new hire\'s name.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Enter a valid email address.' }
  if (!(ROLES as readonly string[]).includes(accessRole)) return { ok: false, error: 'Pick a role.' }
  const supabase = await createClient()

  const { data: existing } = await supabase.from('vs_invites').select('id').eq('email', email).is('accepted_at', null).is('revoked_at', null).maybeSingle()
  let inviteId = existing?.id as string | undefined
  if (!inviteId) {
    const { data: inv, error: invErr } = await supabase.from('vs_invites')
      .insert({ email, display_name: fullName, access_role: accessRole }).select('id').single()
    if (invErr) return { ok: false, error: friendly(invErr) }
    inviteId = inv.id as string
  }
  const { data, error } = await supabase.from('vs_onboarding').insert({
    full_name: fullName, email, invite_id: inviteId,
    start_date: DATE.test(startDate) ? startDate : null,
    job_description_id: UUID.test(jdId) ? jdId : null,
    handbook_id: UUID.test(handbookId) ? handbookId : null,
    notes: opt(str(fd, 'notes', 2000)),
  }).select('id').single()
  if (error) return { ok: false, error: friendly(error) }
  if (UUID.test(jdId)) {
    const { error: e } = await supabase.from('vs_jd_assignments').insert({ job_description_id: jdId, invite_id: inviteId })
    if (e && e.code !== '23505') return { ok: false, error: friendly(e) }
  }
  if (UUID.test(handbookId)) {
    const { error: e } = await supabase.from('vs_handbook_assignments').insert({ handbook_id: handbookId, invite_id: inviteId })
    if (e && e.code !== '23505') return { ok: false, error: friendly(e) }
  }
  refresh()
  revalidatePath('/admin/team')
  return { ok: true, data: { id: data.id as string } }
}

export async function setOnboardingStatus(id: string, status: 'open' | 'complete' | 'cancelled'): Promise<HrResult> {
  const { error: denied } = await manager()
  if (denied) return { ok: false, error: denied }
  if (!UUID.test(id) || !['open', 'complete', 'cancelled'].includes(status)) return { ok: false, error: 'Unknown checklist.' }
  const supabase = await createClient()
  const { error } = await supabase.from('vs_onboarding').update({ status }).eq('id', id)
  if (error) return { ok: false, error: friendly(error) }
  refresh()
  return { ok: true }
}
