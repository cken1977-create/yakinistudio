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
import {
  createParticipant,
  LegacylineClientError,
  type CreateParticipantInput,
  type LegacylineError,
} from '@/lib/legacyline/client'

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

// ─── Promote intake to Legacyline (Wave 2.3) ─────────────────────────
// Operator-mediated promotion (Path γ): operator supplies first_name,
// last_name, dob, and optional organization_id from their conversation
// with the intake submitter. We call Legacyline POST /participants,
// store the participant_id + registry_id back on the intake row, and
// flip status to 'promoted_to_legacyline'.
//
// On failure: status stays where it was, error message lands in
// legacyline_error column so the operator sees what went wrong inline.

export type PromoteIntakeInput = {
  first_name: string
  last_name: string
  dob: string // YYYY-MM-DD
  organization_id?: string | null
}

export type PromoteIntakeResult =
  | {
      ok: true
      participant_id: string
      registry_id: string
      subject_number: string
    }
  | { ok: false; error: string; field?: string; detail?: LegacylineError }

export async function promoteIntakeToLegacyline(
  intakeId: string,
  input: PromoteIntakeInput
): Promise<PromoteIntakeResult> {
  const user = await requireOperator()
  const supabase = await createClient()

  // Fetch the intake — need email/phone to send to Legacyline + guard
  // against double-promotion.
  const { data: intake, error: fetchError } = await supabase
    .from('intake_requests')
    .select('id, full_name, email, phone, status, legacyline_participant_id')
    .eq('id', intakeId)
    .single()

  if (fetchError || !intake) {
    return {
      ok: false,
      error: fetchError?.message ?? 'Intake not found',
    }
  }

  if (intake.legacyline_participant_id) {
    return {
      ok: false,
      error: `Already promoted to Legacyline (participant ${intake.legacyline_participant_id})`,
    }
  }

  // Build the Legacyline payload from operator-supplied fields + intake
  // contact info. Email/phone come from the original /get-help submission.
  const payload: CreateParticipantInput = {
    first_name: input.first_name,
    last_name: input.last_name,
    dob: input.dob,
    email: intake.email || null,
    phone: intake.phone || null,
    organization_id: input.organization_id || null,
  }

  let participant
  try {
    participant = await createParticipant(payload)
  } catch (err) {
    const detail =
      err instanceof LegacylineClientError
        ? err.detail
        : ({
            kind: 'unexpected' as const,
            message: err instanceof Error ? err.message : 'Unknown error',
          })

    // Record the failure on the intake so operator sees it inline next time
    const errMessage = detail.message ?? 'Promotion failed'
    await supabase
      .from('intake_requests')
      .update({ legacyline_error: errMessage })
      .eq('id', intakeId)

    revalidatePath('/admin/intakes')

    return {
      ok: false,
      error: errMessage,
      field: detail.kind === 'validation' ? detail.field : undefined,
      detail,
    }
  }

  // Success: write Legacyline IDs back to the intake row + flip status
  const { error: updateError } = await supabase
    .from('intake_requests')
    .update({
      legacyline_participant_id: participant.participant_id,
      legacyline_registry_id: participant.registry_id,
      legacyline_promoted_at: new Date().toISOString(),
      legacyline_error: null, // clear any prior error
      status: 'promoted_to_legacyline',
      assigned_to: user.id,
    })
    .eq('id', intakeId)

  if (updateError) {
    // Legacyline created the participant but we failed to record it.
    // Surface the error so the operator knows the IDs (in detail) and
    // can manually reconcile.
    return {
      ok: false,
      error: `Legacyline participant created (${participant.participant_id}) but VS update failed: ${updateError.message}. Contact engineering.`,
    }
  }

  revalidatePath('/admin/intakes')
  revalidatePath('/admin')

  return {
    ok: true,
    participant_id: participant.participant_id,
    registry_id: participant.registry_id,
    subject_number: participant.subject_number,
  }
}

