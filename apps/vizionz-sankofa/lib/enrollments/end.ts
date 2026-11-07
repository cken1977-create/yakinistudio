// Ending an enrollment is not removing the person.
// The database function is the security check. These helpers only keep the
// confirmation copy and the button rules aligned with that function.

export type EnrollmentOutcome = 'completed' | 'withdrew'

export type EnrollmentEndCode =
  | 'ended'
  | 'already_ended'
  | 'not_found'
  | 'invalid'
  | 'conflict'
  | 'reason_required'

export type EnrollmentEndResult = {
  ok: boolean
  code: EnrollmentEndCode
  status?: string
  enrollment_id?: string
  participant_id?: string
  program_name?: string | null
  cohort_name?: string | null
  error?: string
}

export function enrollmentIsOpen(status: string): boolean {
  return status === 'enrolled' || status === 'active'
}

export function canSubmitEnrollmentEnd(outcome: EnrollmentOutcome, reason: string): boolean {
  if (outcome === 'withdrew') return reason.trim().length > 0
  return true
}

export function enrollmentEndCopy(input: {
  outcome: EnrollmentOutcome
  person: string
  program: string
}): { title: string; body: string; confirm: string; pending: string; success: string } {
  const place = input.program.trim() || 'this program'
  if (input.outcome === 'completed') {
    return {
      title: `Complete ${place}`,
      body: `Complete ${place} for ${input.person}. The enrollment stays on the record as completed. ${input.person} stays on the roster. This does not delete the person or close their tasks.`,
      confirm: 'Complete enrollment',
      pending: `Completing ${place}…`,
      success: `${place} is completed for ${input.person}. The enrollment was kept. ${input.person} is still on the roster.`,
    }
  }
  return {
    title: `Withdraw from ${place}`,
    body: `Withdraw ${input.person} from ${place}. The enrollment stays on the record as withdrew. ${input.person} stays on the roster. This does not delete the person or close their tasks.`,
    confirm: 'Withdraw from program',
    pending: `Withdrawing ${input.person} from ${place}…`,
    success: `${input.person} was withdrawn from ${place}. The enrollment was kept. ${input.person} is still on the roster.`,
  }
}

export function enrollmentEndMessage(result: EnrollmentEndResult, fallback: string): string {
  if (result.code === 'already_ended') return result.error || 'This enrollment is already ended. It was not changed.'
  if (!result.ok) return result.error || 'Nothing was changed.'
  return fallback
}
