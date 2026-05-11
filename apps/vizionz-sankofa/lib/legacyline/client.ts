// VIZIONZ SANKOFA · LegacylineClient
// Server-side adapter calling Legacyline's POST /participants endpoint.
//
// This is the first cross-organism integration in the BRSA stack.
// VS submits intake → operator promotes → Legacyline creates Subject.
// Substrate of the integrated-stack thesis.
//
// Auth model: Legacyline's actorFromRequest reads X-Actor header for
// attribution (no secret validation). VS sends X-Actor: vizionz-sankofa
// so the Legacyline audit trail records the organism source.
//
// Future hardening (TODO_FUTURE): Legacyline should validate X-Actor
// against an allowlist or require API key. Current shape works for
// pilot, acceptable risk during low-traffic phase.

const DEFAULT_TIMEOUT_MS = 15000

export type CreateParticipantInput = {
  first_name: string
  last_name: string
  dob: string // ISO 8601 date: YYYY-MM-DD
  email?: string | null
  phone?: string | null
  organization_id?: string | null
}

export type CreateParticipantResponse = {
  participant_id: string
  registry_id: string
  subject_number: string | null
  status: string
  organization_id: string | null
  created_at: string // RFC 3339
}

// Tagged error union — server action discriminates on .kind for UX
export type LegacylineError =
  | { kind: 'config_missing'; message: string }
  | { kind: 'validation'; message: string; field?: string }
  | { kind: 'http_error'; status: number; message: string; body?: string }
  | { kind: 'network'; message: string }
  | { kind: 'timeout'; message: string }
  | { kind: 'unexpected'; message: string }

export class LegacylineClientError extends Error {
  detail: LegacylineError

  constructor(detail: LegacylineError) {
    super(detail.message)
    this.name = 'LegacylineClientError'
    this.detail = detail
  }
}

// ─── Public surface ─────────────────────────────────────────────────

export async function createParticipant(
  input: CreateParticipantInput
): Promise<CreateParticipantResponse> {
  const config = readConfig()

  validateInput(input)

  const body: Record<string, string> = {
    first_name: input.first_name.trim(),
    last_name: input.last_name.trim(),
    dob: input.dob,
  }

  // Only include optional fields when present — Legacyline accepts empty
  // strings but sending only the keys with values keeps payloads honest
  if (input.email && input.email.trim()) body.email = input.email.trim()
  if (input.phone && input.phone.trim()) body.phone = input.phone.trim()
  if (input.organization_id && input.organization_id.trim()) {
    body.organization_id = input.organization_id.trim()
  }

  const url = `${config.apiUrl.replace(/\/$/, '')}/participants`

  const controller = new AbortController()
  const timeoutHandle = setTimeout(
    () => controller.abort(),
    config.timeoutMs
  )

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Actor': config.actor,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new LegacylineClientError({
        kind: 'timeout',
        message: `Legacyline did not respond within ${config.timeoutMs}ms`,
      })
    }
    throw new LegacylineClientError({
      kind: 'network',
      message: err instanceof Error ? err.message : 'Network error',
    })
  } finally {
    clearTimeout(timeoutHandle)
  }

  if (!response.ok) {
    const bodyText = await response.text().catch(() => '')
    throw new LegacylineClientError({
      kind: 'http_error',
      status: response.status,
      message: `Legacyline returned ${response.status}`,
      body: bodyText.slice(0, 500), // cap for safety
    })
  }

  let parsed: unknown
  try {
    parsed = await response.json()
  } catch {
    throw new LegacylineClientError({
      kind: 'unexpected',
      message: 'Legacyline returned non-JSON response',
    })
  }

  return assertParticipantResponse(parsed)
}

// ─── Helpers ────────────────────────────────────────────────────────

type Config = {
  apiUrl: string
  actor: string
  timeoutMs: number
}

function readConfig(): Config {
  const apiUrl = process.env.LEGACYLINE_API_URL
  const actor = process.env.LEGACYLINE_ACTOR

  if (!apiUrl) {
    throw new LegacylineClientError({
      kind: 'config_missing',
      message: 'LEGACYLINE_API_URL not configured',
    })
  }
  if (!actor) {
    throw new LegacylineClientError({
      kind: 'config_missing',
      message: 'LEGACYLINE_ACTOR not configured',
    })
  }

  const timeoutRaw = process.env.LEGACYLINE_TIMEOUT_MS
  const timeoutMs = timeoutRaw ? parseInt(timeoutRaw, 10) : DEFAULT_TIMEOUT_MS

  return {
    apiUrl,
    actor,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0
      ? timeoutMs
      : DEFAULT_TIMEOUT_MS,
  }
}

function validateInput(input: CreateParticipantInput): void {
  if (!input.first_name || input.first_name.trim().length < 1) {
    throw new LegacylineClientError({
      kind: 'validation',
      message: 'First name is required',
      field: 'first_name',
    })
  }
  if (!input.last_name || input.last_name.trim().length < 1) {
    throw new LegacylineClientError({
      kind: 'validation',
      message: 'Last name is required',
      field: 'last_name',
    })
  }
  if (!input.dob || input.dob.trim().length < 1) {
    throw new LegacylineClientError({
      kind: 'validation',
      message: 'Date of birth is required',
      field: 'dob',
    })
  }

  // DOB shape: YYYY-MM-DD (Legacyline accepts this format from form values)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dob.trim())) {
    throw new LegacylineClientError({
      kind: 'validation',
      message: 'Date of birth must be in YYYY-MM-DD format',
      field: 'dob',
    })
  }

  // Sanity-check the date itself is parseable
  const dobDate = new Date(input.dob.trim() + 'T00:00:00Z')
  if (Number.isNaN(dobDate.getTime())) {
    throw new LegacylineClientError({
      kind: 'validation',
      message: 'Date of birth is not a valid date',
      field: 'dob',
    })
  }

  // Reject future dates
  if (dobDate.getTime() > Date.now()) {
    throw new LegacylineClientError({
      kind: 'validation',
      message: 'Date of birth cannot be in the future',
      field: 'dob',
    })
  }

  // Reject absurd past dates (before 1900 — arbitrary but reasonable floor)
  if (dobDate.getUTCFullYear() < 1900) {
    throw new LegacylineClientError({
      kind: 'validation',
      message: 'Date of birth seems unreasonable (before 1900)',
      field: 'dob',
    })
  }
}

function assertParticipantResponse(
  raw: unknown
): CreateParticipantResponse {
  if (typeof raw !== 'object' || raw === null) {
    throw new LegacylineClientError({
      kind: 'unexpected',
      message: 'Legacyline response was not an object',
    })
  }

  const obj = raw as Record<string, unknown>

  const requiredString = (key: string): string => {
    const v = obj[key]
    if (typeof v !== 'string' || v.length === 0) {
      throw new LegacylineClientError({
        kind: 'unexpected',
        message: `Legacyline response missing required string field: ${key}`,
      })
    }
    return v
  }

  // Substrate-honest: subject_number is assigned later in Legacyline's
  // participant lifecycle, often null at creation time. Required at
  // creation: participant_id, registry_id, status, created_at.
  return {
    participant_id: requiredString('participant_id'),
    registry_id: requiredString('registry_id'),
    subject_number:
      typeof obj.subject_number === 'string' && obj.subject_number.length > 0
        ? obj.subject_number
        : null,
    status: requiredString('status'),
    organization_id:
      typeof obj.organization_id === 'string' && obj.organization_id.length > 0
        ? obj.organization_id
        : null,
    created_at: requiredString('created_at'),
  }
}

// ─── Convenience: pre-split full_name into first/last ──────────────
// Used by the UI to seed the promotion form. Operator can edit before submit.

export function splitFullNameForPromotion(fullName: string): {
  first_name: string
  last_name: string
} {
  const trimmed = fullName.trim().replace(/\s+/g, ' ')
  const parts = trimmed.split(' ')

  if (parts.length === 0 || parts[0] === '') {
    return { first_name: '', last_name: '' }
  }

  if (parts.length === 1) {
    return { first_name: parts[0], last_name: '' }
  }

  // Default heuristic: first token is first_name, everything else is last_name
  // (handles middle names, hyphenated last names, suffixes by keeping them
  // grouped with the surname rather than dropping them).
  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(' '),
  }
}
