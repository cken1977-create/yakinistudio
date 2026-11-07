'use server'

// Removal and restore go through the signed-in user's session and the
// database functions. Hiding the button is not the security check.

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAccessRole, requireOperatorOrEmployee } from '@/lib/supabase/auth'
import { canRemoveParticipant, type RemovalPreview } from '@/lib/participants/removal'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type ParticipantActionResult =
  | { ok: true; preview: RemovalPreview }
  | { ok: false; error: string }

function denied(): ParticipantActionResult {
  return { ok: false, error: 'Only an executive or operator can remove or restore a participant. Nothing was changed.' }
}

function explain(error: { code?: string; message: string }): string {
  if (error.code === '42501' || /only an executive or operator/i.test(error.message)) {
    return 'Only an executive or operator can remove or restore a participant. Nothing was changed.'
  }
  if (error.code === 'PGRST202' || /does not exist|schema cache/i.test(error.message)) {
    return 'Removing a participant is not available until the database update is applied. Nothing was changed.'
  }
  return error.message
}

async function gate(id: string): Promise<{ ok: true } | ParticipantActionResult> {
  const user = await requireOperatorOrEmployee()
  if (!canRemoveParticipant(getAccessRole(user))) return denied()
  if (!UUID.test(id)) return { ok: false, error: 'That participant was not found. Nothing was changed.' }
  return { ok: true }
}

function asPreview(data: unknown): RemovalPreview | null {
  if (!data || typeof data !== 'object') return null
  const row = data as RemovalPreview
  if (typeof row.ok !== 'boolean' || typeof row.code !== 'string') return null
  return row
}

export async function previewParticipantRemoval(id: string): Promise<ParticipantActionResult> {
  const allowed = await gate(id)
  if (!allowed.ok) return allowed
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('vs_participant_removal_preview', { p_id: id })
  if (error) return { ok: false, error: explain(error) }
  const preview = asPreview(data)
  if (!preview) return { ok: false, error: 'Could not review this participant. Nothing was changed.' }
  if (!preview.ok && preview.code === 'not_found') {
    return { ok: false, error: 'That participant was not found. Nothing was changed.' }
  }
  return { ok: true, preview }
}

export async function removeParticipant(id: string, expectedUpdatedAt: string, reason: string): Promise<ParticipantActionResult> {
  const allowed = await gate(id)
  if (!allowed.ok) return allowed
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('vs_soft_delete_participant', {
    p_id: id,
    p_expected_updated_at: expectedUpdatedAt,
    p_reason: reason.trim() || null,
  })
  if (error) return { ok: false, error: explain(error) }
  const preview = asPreview(data)
  if (!preview) return { ok: false, error: 'Could not remove this participant. Nothing was changed.' }
  if (preview.ok) {
    revalidatePath('/admin/participants')
    revalidatePath(`/admin/participants/${id}`)
    revalidatePath('/admin')
    revalidatePath('/admin/my-day')
  }
  return { ok: true, preview }
}

export async function restoreParticipant(id: string): Promise<ParticipantActionResult> {
  const allowed = await gate(id)
  if (!allowed.ok) return allowed
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('vs_restore_participant', { p_id: id })
  if (error) return { ok: false, error: explain(error) }
  const preview = asPreview(data)
  if (!preview) return { ok: false, error: 'Could not restore this participant. Nothing was changed.' }
  if (preview.ok) {
    revalidatePath('/admin/participants')
    revalidatePath(`/admin/participants/${id}`)
    revalidatePath('/admin')
    revalidatePath('/admin/my-day')
  }
  return { ok: true, preview }
}
