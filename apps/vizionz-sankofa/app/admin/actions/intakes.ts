// VIZIONZ SANKOFA · Admin intake server actions
// Status updates, notes, contact tracking, eventual Legacyline promotion.
// All mutations require operator authentication.
//
// TODO Wave 2.5: Role-based access. Khadijah + Carly = 'operator' (full
// intake authority). VS employees = 'employee' (CRM read + limited update).
// This file's actions currently treat all authenticated users as full
// operators — restrict at the requireOperator helper when roles land.

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireOperator } from '@/lib/supabase/auth'

const INTAKE_STATUSES = [
  'new',
  'contacted',
  'in_progress',
  'resolved',
  'promoted_to_legacyline',
  'closed_no_response',
] as const

type IntakeStatus = (typeof INTAKE_STATUSES)[number]

function isValidStatus(value: string): value is IntakeStatus {
  return (INTAKE_STATUSES as readonly string[]).includes(value)
}

type ActionResult = { ok: true } | { ok: false; error: string }

// ─── Mark contacted ──────────────────────────────────────────────────
// Sets contacted_at timestamp + flips status to 'contacted' if still 'new'.
// Idempotent — safe to call twice (won't overwrite a later contacted_at).

export async function markIntakeContacted(id: string): Promise<ActionResult> {
  const user = await requireOperator()
  const supabase = await createClient()

  // Read current state to preserve fields we shouldn't clobber
  const { data: existing, error: fetchError } = await supabase
    .from('intake_requests')
    .select('status, contacted_at')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    return { ok: false, error: fetchError?.message ?? 'Intake not found' }
  }

  const updates: Record<string, string | null> = {}

  // Only set contacted_at if not already set
  if (!existing.contacted_at) {
    updates.contacted_at = new Date().toISOString()
  }

  // Promote 'new' to 'contacted', leave other statuses alone
  if (existing.status === 'new') {
    updates.status = 'contacted'
  }

  // Track who marked it contacted
  updates.assigned_to = user.id

  if (Object.keys(updates).length === 0) {
    return { ok: true }
  }

  const { error: updateError } = await supabase
    .from('intake_requests')
    .update(updates)
    .eq('id', id)

  if (updateError) {
    return { ok: false, error: updateError.message }
  }

  revalidatePath('/admin/intakes')
  revalidatePath('/admin')
  return { ok: true }
}

// ─── Update status ───────────────────────────────────────────────────

export async function updateIntakeStatus(
  id: string,
  newStatus: string
): Promise<ActionResult> {
  await requireOperator()

  if (!isValidStatus(newStatus)) {
    return { ok: false, error: 'Invalid status value' }
  }

  // Block promoting to Legacyline until Wave 2.3 wires the integration.
  // The UI button is visible-but-disabled; this is the server-side guard.
  if (newStatus === 'promoted_to_legacyline') {
    return {
      ok: false,
      error:
        'Legacyline promotion ships in Wave 2.3. Use a different status for now.',
    }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('intake_requests')
    .update({ status: newStatus })
    .eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/admin/intakes')
  revalidatePath('/admin')
  return { ok: true }
}

// ─── Save notes ──────────────────────────────────────────────────────

export async function saveIntakeNotes(
  id: string,
  notes: string
): Promise<ActionResult> {
  const user = await requireOperator()
  const supabase = await createClient()

  // Length guard
  if (notes.length > 10000) {
    return { ok: false, error: 'Notes too long. Please shorten.' }
  }

  const { error } = await supabase
    .from('intake_requests')
    .update({
      notes: notes.trim() || null,
      assigned_to: user.id,
    })
    .eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/admin/intakes')
  return { ok: true }
}

// ─── Delete intake (rare — spam cleanup) ─────────────────────────────

export async function deleteIntake(id: string): Promise<ActionResult> {
  await requireOperator()
  const supabase = await createClient()

  const { error } = await supabase
    .from('intake_requests')
    .delete()
    .eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/admin/intakes')
  revalidatePath('/admin')
  return { ok: true }
}
