// Public website messages for Vizionz Sankofa.
// They are saved on intake_requests, which staff already review.
// This module never sends email. A saved row is the only success.

import { isIntakeRequestType, type IntakeRequestType } from '@/lib/programs/apply'

export type WebsiteKind = 'contact' | 'newsletter'

export type WebsiteMessage = {
  kind: WebsiteKind
  full_name: string
  email: string
  phone: string | null
  request_type: IntakeRequestType
  details: string
  consent_given: true
}

export type IntakeInsert = {
  id: string
  full_name: string
  email: string
  phone: string | null
  request_type: IntakeRequestType
  details: string
  consent_given: true
}

export type WebsiteSaveResult =
  | { ok: true; id: string; saved: true; emailSent: false }
  | { ok: false; error: string; saved: false; emailSent: false }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function requestTypeForService(service: string): IntakeRequestType {
  const text = service.toLowerCase()
  if (text.includes('food')) return 'food_assistance'
  if (text.includes('refugee') || text.includes('immigrant')) return 'refugee_immigrant_services'
  if (text.includes('housing') || text.includes('unsheltered')) return 'housing'
  if (text.includes('education') || text.includes('youth') || text.includes('mentor')) return 'education'
  if (text.includes('family') || text.includes('caregiver')) return 'family_support'
  return 'other'
}

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export function acceptWebsiteMessage(body: unknown): { ok: true; value: WebsiteMessage } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'The message was not readable. Nothing was saved.' }
  const input = body as Record<string, unknown>
  if (input.kind === 'newsletter') {
    const email = text(input.email, 320).toLowerCase()
    if (!EMAIL.test(email)) return { ok: false, error: 'Enter a valid email. Nothing was saved.' }
    return {
      ok: true,
      value: {
        kind: 'newsletter',
        full_name: 'Newsletter signup',
        email,
        phone: null,
        request_type: 'other',
        details: 'Newsletter signup from the website. No mailing list was joined and no email was sent.',
        consent_given: true,
      },
    }
  }

  const fullName = text(input.name, 200)
  const email = text(input.email, 320).toLowerCase()
  const phone = text(input.phone, 50)
  const service = text(input.service, 200)
  const message = text(input.message, 5000)
  if (fullName.length < 2) return { ok: false, error: 'Enter your name. Nothing was saved.' }
  if (!EMAIL.test(email)) return { ok: false, error: 'Enter a valid email. Nothing was saved.' }
  if (message.length < 2) return { ok: false, error: 'Enter a message. Nothing was saved.' }
  if (input.consent_given !== true) {
    return { ok: false, error: 'Consent is required so the team can read this message. Nothing was saved.' }
  }
  const requestType = requestTypeForService(service)
  if (!isIntakeRequestType(requestType)) return { ok: false, error: 'Choose a subject. Nothing was saved.' }
  const interest = service ? `Service interest: ${service}` : 'Service interest: not selected'
  return {
    ok: true,
    value: {
      kind: 'contact',
      full_name: fullName,
      email,
      phone: phone || null,
      request_type: requestType,
      details: `Website contact form.\n${interest}\n\n${message}`,
      consent_given: true,
    },
  }
}

export function intakeRow(message: WebsiteMessage, id: string): IntakeInsert {
  return {
    id,
    full_name: message.full_name,
    email: message.email,
    phone: message.phone,
    request_type: message.request_type,
    details: message.details,
    consent_given: true,
  }
}

export async function saveWebsiteMessage(
  body: unknown,
  insert: (row: IntakeInsert) => Promise<{ error: { message: string } | null }>,
  id = crypto.randomUUID(),
): Promise<WebsiteSaveResult> {
  const accepted = acceptWebsiteMessage(body)
  if (!accepted.ok) return { ok: false, error: accepted.error, saved: false, emailSent: false }
  const { error } = await insert(intakeRow(accepted.value, id))
  if (error) {
    return {
      ok: false,
      error: 'We could not save this. Nothing was sent. Please try again.',
      saved: false,
      emailSent: false,
    }
  }
  return { ok: true, id, saved: true, emailSent: false }
}

/** Shown after a real save. It does not claim an email was sent. */
export function savedMessage(result: WebsiteSaveResult, kind: WebsiteKind): string {
  if (!result.ok || !result.saved || result.emailSent) return ''
  if (kind === 'newsletter') {
    return 'Saved for the team. No email was sent, and this did not join an automatic mailing list.'
  }
  return `Saved. Reference ${result.id}. The team can see this on the request list. No email was sent.`
}
