'use server'

// Ending an enrollment uses the signed-in session and vs_end_enrollment.
// The button being visible is not the authorization check.

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireOperatorOrEmployee } from '@/lib/supabase/auth'
import {
  enrollmentEndCopy,
  enrollmentEndMessage,
  type EnrollmentEndResult,
  type EnrollmentOutcome,
} from '@/lib/enrollments/end'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type EndEnrollmentAction =
  | { ok: true; result: EnrollmentEndResult; message: string }
  | { ok: false; error: string }

function explain(error: { code?: string; message: string }): string {
  if (error.code === '42501' || /cannot change this enrollment/i.test(error.message)) {
    return 'You cannot change this enrollment. Nothing was changed.'
  }
  if (error.code === 'PGRST202' || /does not exist|schema cache/i.test(error.message)) {
    return 'Ending an enrollment is not available until the database update is applied. Nothing was changed.'
  }
  return error.message
}

export async function endEnrollment(input: {
  enrollmentId: string
  participantId: string
  outcome: EnrollmentOutcome
  expectedUpdatedAt: string
  reason: string
  person: string
  program: string
}): Promise<EndEnrollmentAction> {
  await requireOperatorOrEmployee()
  if (!UUID.test(input.enrollmentId) || !UUID.test(input.participantId)) {
    return { ok: false, error: 'That enrollment was not found. Nothing was changed.' }
  }
  if (input.outcome !== 'completed' && input.outcome !== 'withdrew') {
    return { ok: false, error: 'Choose complete or withdraw. Nothing was changed.' }
  }
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('vs_end_enrollment', {
    p_enrollment_id: input.enrollmentId,
    p_outcome: input.outcome,
    p_expected_updated_at: input.expectedUpdatedAt,
    p_reason: input.reason.trim() || null,
  })
  if (error) return { ok: false, error: explain(error) }
  const result = data as EnrollmentEndResult | null
  if (!result || typeof result.ok !== 'boolean' || typeof result.code !== 'string') {
    return { ok: false, error: 'Could not update this enrollment. Nothing was changed.' }
  }
  if (!result.ok) return { ok: false, error: result.error || 'Nothing was changed.' }
  revalidatePath(`/admin/participants/${input.participantId}`)
  revalidatePath('/admin/participants')
  const copy = enrollmentEndCopy({ outcome: input.outcome, person: input.person, program: input.program })
  return { ok: true, result, message: enrollmentEndMessage(result, copy.success) }
}
