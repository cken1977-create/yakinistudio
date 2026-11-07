// Roster removal is reversible. These helpers decide what the screen may do.
// The database functions are the security boundary; this module only describes
// that behavior so the button, the tests, and the copy stay the same.

export type AccessRole = 'executive' | 'operator' | 'case_manager' | 'leadership_readonly' | null

export function canRemoveParticipant(role: AccessRole): boolean {
  return role === 'executive' || role === 'operator'
}

export type RemovalCode =
  | 'ready'
  | 'blocked'
  | 'already_removed'
  | 'not_found'
  | 'conflict'
  | 'removed'
  | 'restored'
  | 'already_active'

export type RemovalPreview = {
  ok: boolean
  code: RemovalCode
  semantics: 'reversible_roster_removal'
  participant?: {
    id: string
    first_name: string
    last_name: string
    preferred_name?: string | null
    status?: string
    updated_at?: string | null
    deleted_at?: string | null
  }
  counts?: Record<string, number>
  possible_duplicates?: { id: string; name: string; removed: boolean }[]
  error?: string
}

export function legalName(p: { first_name: string; last_name: string }): string {
  return `${p.first_name} ${p.last_name}`.replace(/\s+/g, ' ').trim()
}

export function participantDisplayName(p: {
  first_name: string
  last_name: string
  preferred_name?: string | null
}): string {
  const preferred = p.preferred_name?.trim()
  const legal = legalName(p)
  return preferred ? `${preferred} (${legal})` : legal
}

export function nameConfirmed(typed: string, expected: string): boolean {
  return expected.trim().length > 0 && typed.trim().toLowerCase() === expected.trim().toLowerCase()
}

export const REMOVAL_SEMANTICS =
  'This is a reversible removal from the active roster, not a permanent erase. The participant record stays in the database. Case notes, services, documents, assessments, family members, consents, enrollments, and the audit log are kept. An executive or operator can restore this participant.'

const PRESERVED: [string, string][] = [
  ['case_notes', 'Case notes'],
  ['services', 'Services'],
  ['enrollments', 'Program enrollments'],
  ['assessments', 'Assessments'],
  ['documents', 'Documents'],
  ['family_members', 'Family members'],
  ['consents', 'Consents'],
  ['addresses', 'Addresses'],
  ['identifiers', 'Identifiers'],
]

export function blockersFromCounts(counts: Record<string, number> | undefined): { key: string; label: string; count: number }[] {
  const out: { key: string; label: string; count: number }[] = []
  const enrollments = counts?.active_enrollments ?? 0
  const tasks = counts?.open_tasks ?? 0
  if (enrollments > 0) {
    out.push({
      key: 'active_enrollments',
      label: 'Active program enrollments. Withdraw or complete them first. They were not changed.',
      count: enrollments,
    })
  }
  if (tasks > 0) {
    out.push({
      key: 'open_tasks',
      label: 'Open tasks about this participant. Complete or cancel them first. They were not changed.',
      count: tasks,
    })
  }
  return out
}

export function preservedFromCounts(counts: Record<string, number> | undefined): { key: string; label: string; count: number }[] {
  return PRESERVED
    .map(([key, label]) => ({ key, label, count: counts?.[key] ?? 0 }))
    .filter((row) => row.count > 0)
}

export type RemovalPhase = 'closed' | 'loading' | 'confirm' | 'submitting' | 'success' | 'error'

export type RemovalView = {
  phase: RemovalPhase
  preview: RemovalPreview | null
  message: string | null
  /** How many times a removal request was actually started. */
  submissions: number
}

export function initialRemoval(): RemovalView {
  return { phase: 'closed', preview: null, message: null, submissions: 0 }
}

export type RemovalEvent =
  | { type: 'open' }
  | { type: 'preview'; preview: RemovalPreview }
  | { type: 'preview_failed'; message: string }
  | { type: 'cancel' }
  | { type: 'confirm'; typedName: string }
  | { type: 'result'; preview: RemovalPreview }
  | { type: 'retry' }

export function shouldSubmitRemoval(state: RemovalView, typedName: string): boolean {
  const person = state.preview?.participant
  if (state.phase !== 'confirm' || !person) return false
  if (state.preview?.code === 'blocked' || state.preview?.code === 'already_removed') return false
  if (blockersFromCounts(state.preview?.counts).length > 0) return false
  return nameConfirmed(typedName, legalName(person))
}

export function removalReducer(state: RemovalView, event: RemovalEvent): RemovalView {
  switch (event.type) {
    case 'open':
      if (state.phase === 'loading' || state.phase === 'submitting') return state
      return { phase: 'loading', preview: null, message: null, submissions: state.submissions }
    case 'preview':
      if (state.phase !== 'loading') return state
      if (!event.preview.ok && event.preview.code === 'not_found') {
        return { phase: 'error', preview: event.preview, message: 'That participant was not found. Nothing was changed.', submissions: state.submissions }
      }
      return { phase: 'confirm', preview: event.preview, message: null, submissions: state.submissions }
    case 'preview_failed':
      if (state.phase !== 'loading') return state
      return { phase: 'error', preview: null, message: event.message, submissions: state.submissions }
    case 'cancel':
      if (state.phase === 'submitting' || state.phase === 'loading') return state
      return { phase: 'closed', preview: null, message: null, submissions: state.submissions }
    case 'confirm':
      if (!shouldSubmitRemoval(state, event.typedName)) return state
      return { ...state, phase: 'submitting', submissions: state.submissions + 1 }
    case 'result': {
      if (state.phase !== 'submitting') return state
      const code = event.preview.code
      if (event.preview.ok && (code === 'removed' || code === 'already_removed' || code === 'restored' || code === 'already_active')) {
        return { phase: 'success', preview: event.preview, message: successMessage(event.preview), submissions: state.submissions }
      }
      return {
        phase: 'error',
        preview: event.preview,
        message: event.preview.error || 'Nothing was changed.',
        submissions: state.submissions,
      }
    }
    case 'retry':
      if (state.phase !== 'error') return state
      return { phase: 'loading', preview: null, message: null, submissions: state.submissions }
    default:
      return state
  }
}

function successMessage(preview: RemovalPreview): string {
  const name = preview.participant ? participantDisplayName(preview.participant) : 'This participant'
  if (preview.code === 'already_removed') return `${name} is already off the active roster. The record was not erased.`
  if (preview.code === 'restored' || preview.code === 'already_active') return `${name} is on the active roster.`
  return `${name} was removed from the active roster. The record was not erased and can be restored.`
}

export function removalStatusText(state: RemovalView, name: string): string | null {
  if (state.phase === 'loading') return `Checking ${name}…`
  if (state.phase === 'submitting') return `Removing ${name} from the active roster…`
  if (state.phase === 'success') return state.message
  if (state.phase === 'error') return state.message
  return null
}

const digits = (value: string | null | undefined) => (value ?? '').replace(/\D/g, '').slice(-10)

export function rosterDuplicateNotice(
  draft: { first_name: string; last_name: string; email?: string | null; phone_primary?: string | null },
  roster: { id: string; first_name: string; last_name: string; email?: string | null; phone_primary?: string | null }[],
  ignoreId?: string,
): string | null {
  const email = draft.email?.trim().toLowerCase() || ''
  const phone = digits(draft.phone_primary)
  const first = draft.first_name.trim().toLowerCase()
  const last = draft.last_name.trim().toLowerCase()
  const match = roster.find((p) => {
    if (ignoreId && p.id === ignoreId) return false
    if (email && p.email?.trim().toLowerCase() === email) return true
    if (phone.length >= 7 && digits(p.phone_primary) === phone) return true
    return first.length > 0 && last.length > 0 && p.first_name.trim().toLowerCase() === first && p.last_name.trim().toLowerCase() === last
  })
  if (!match) return null
  return `Another participant is already on the roster (${match.first_name} ${match.last_name}). Saving adds a separate record. It does not merge or remove anyone.`
}
