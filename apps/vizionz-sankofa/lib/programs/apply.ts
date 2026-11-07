// Where "Apply" goes, and how a public request names its program.
// There is one application: /get-help. It does not have a separate form
// per program. Program-specific eligibility text is whatever was already
// saved on the program. No new questions are added here.

export const INTAKE_PATH = '/get-help'

const REQUEST_TYPES = [
  'food_assistance',
  'family_support',
  'refugee_immigrant_services',
  'education',
  'housing',
  'other',
] as const

export type IntakeRequestType = (typeof REQUEST_TYPES)[number]

export function isIntakeRequestType(value: string): value is IntakeRequestType {
  return (REQUEST_TYPES as readonly string[]).includes(value)
}

/** Apply opens the existing intake form for this program, unless staff saved a full external https address. */
export function applyHref(program: { slug: string; apply_url?: string | null }): string {
  const slug = program.slug.trim()
  const internal = `${INTAKE_PATH}?program=${encodeURIComponent(slug)}`
  const raw = program.apply_url?.trim() ?? ''
  if (!raw || raw === '#' || raw === INTAKE_PATH || raw.startsWith(`${INTAKE_PATH}?`)) return internal
  if (raw === `/programs/${slug}` || raw.startsWith('/programs/')) return internal
  if (/^https:\/\/[^\s]+$/i.test(raw)) return raw
  return internal
}

export type IntakeDraft = {
  full_name: string
  email: string
  phone: string
  request_type: string
  details: string
  consent_given: boolean
  program_slug?: string | null
}

export function validateIntake(draft: IntakeDraft): string | null {
  const name = draft.full_name.trim()
  if (name.length < 2) return 'Please enter your full name.'
  if (name.length > 200) return 'Name is too long.'
  const email = draft.email.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
    return 'Please enter a valid email address.'
  }
  if (draft.phone.trim().length > 50) return 'Phone number is too long.'
  if (!isIntakeRequestType(draft.request_type)) return 'Please select what we can help with.'
  if (draft.details.trim().length > 5000) return 'Details are too long. Please summarize your situation.'
  if (!draft.consent_given) return 'Consent is required so we can reach out about your request.'
  return null
}

export function programNote(programName: string, details: string): string {
  const note = `Applying for: ${programName.trim()}`
  const body = details.trim()
  if (!body) return note
  if (body.startsWith(note)) return body
  return `${note}\n\n${body}`
}

export const SUPPORT_FILE_MAX_BYTES = 10 * 1024 * 1024

const SUPPORT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  pdf: 'application/pdf',
}

export function decideSupportFile(file: { name: string; type: string; size: number }):
  | { ok: true; contentType: string }
  | { ok: false; reason: string } {
  if (file.size <= 0) return { ok: false, reason: `${file.name} is empty.` }
  if (file.size > SUPPORT_FILE_MAX_BYTES) {
    return { ok: false, reason: `${file.name} is over 10 MB. Choose a smaller JPG, PNG, or PDF.` }
  }
  const ext = file.name.split(/[/\\]/).pop()?.split('.').pop()?.toLowerCase() ?? ''
  const type = file.type.toLowerCase() === 'image/jpg' ? 'image/jpeg' : file.type.toLowerCase()
  const contentType = SUPPORT_TYPES[ext] || (Object.values(SUPPORT_TYPES).includes(type) ? type : '')
  if (!contentType) {
    return { ok: false, reason: `${file.name} must be a JPG, PNG, or PDF. Nothing else is stored with a request.` }
  }
  return { ok: true, contentType }
}

export function intakeFilePath(intakeId: string, fileName: string, unique: string): string {
  const safe = fileName.split(/[/\\]/).pop()!.toLowerCase().replace(/[^a-z0-9.\-_]/g, '-').replace(/-+/g, '-') || 'file'
  return `${intakeId}/${unique}-${safe}`
}
