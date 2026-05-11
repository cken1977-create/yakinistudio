// VIZIONZ SANKOFA · Admin media server actions
// Update + delete operations on media_items.
// Deletes also remove the underlying file from Supabase Storage.

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
// Wave 2.5: All media actions are operator-only by deliberate design.
// Media items appear on the public Vizionz Sankofa website — only Khadijah,
// Carly, and Clarence (full operators) decide what gets published. VS
// employees route here have read-only access via /admin/media's page-level
// gate, but cannot upload, edit, or delete. If that policy changes later,
// retag specific actions with requireOperatorOrEmployee.
import { requireOperator } from '@/lib/supabase/auth'

export async function updateMediaItem(
  id: string,
  updates: { caption?: string | null; event_date?: string | null }
) {
  await requireOperator()
  const supabase = await createClient()

  // Normalize empty strings to null so the DB stays clean
  const payload: Record<string, string | null> = {}
  if (updates.caption !== undefined) {
    payload.caption = updates.caption?.trim() || null
  }
  if (updates.event_date !== undefined) {
    payload.event_date = updates.event_date || null
  }

  const { error } = await supabase
    .from('media_items')
    .update(payload)
    .eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/admin/media')
  revalidatePath('/admin')
  return { ok: true }
}

export async function deleteMediaItem(id: string) {
  await requireOperator()
  const supabase = await createClient()

  // Get the storage_path so we can remove the underlying file
  const { data: item, error: fetchError } = await supabase
    .from('media_items')
    .select('storage_path')
    .eq('id', id)
    .single()

  if (fetchError || !item) {
    return { ok: false, error: fetchError?.message ?? 'Item not found' }
  }

  // Delete the file from storage first
  const { error: storageError } = await supabase.storage
    .from('media')
    .remove([item.storage_path])

  if (storageError) {
    // Storage delete failed — but we still try the DB delete so we don't
    // strand the row pointing at a soon-to-be-orphaned file.
    console.error('Storage delete failed:', storageError)
  }

  // Delete the row
  const { error: deleteError } = await supabase
    .from('media_items')
    .delete()
    .eq('id', id)

  if (deleteError) {
    return { ok: false, error: deleteError.message }
  }

  revalidatePath('/admin/media')
  revalidatePath('/admin')
  return { ok: true }
}
