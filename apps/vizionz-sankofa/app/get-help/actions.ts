// VIZIONZ SANKOFA · /get-help · server actions
// Handles intake form submissions: validates server-side, writes to
// intake_requests table, fires operator notification via Resend.
//
// Substrate-honest discipline: the DB insert is the authoritative
// "request received" event. Email notification is best-effort —
// if Resend fails, the row still exists for operator review.

'use server'

import { createClient } from '@/lib/supabase/server'

const REQUEST_TYPE_VALUES = [
  'food_assistance',
  'family_support',
  'refugee_immigrant_services',
  'education',
  'housing',
  'other',
] as const

type RequestType = (typeof REQUEST_TYPE_VALUES)[number]

const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  food_assistance: 'Food assistance',
  family_support: 'Family support',
  refugee_immigrant_services: 'Refugee & immigrant services',
  education: 'Education support',
  housing: 'Housing',
  other: 'Other',
}

type IntakeSubmission = {
  full_name: string
  email: string
  phone: string | null
  request_type: string
  details: string | null
  consent_given: boolean
}

type ActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string }

function isValidEmail(value: string): boolean {
  // Pragmatic email check — accepts the shape, lets Resend reject bad ones
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function submitIntakeRequest(
  submission: IntakeSubmission
): Promise<ActionResult> {
  // ─── Server-side validation ─────────────────────────────────────────

  if (!submission.full_name || submission.full_name.length < 2) {
    return { ok: false, error: 'Please enter your full name.' }
  }

  if (!submission.email || !isValidEmail(submission.email)) {
    return { ok: false, error: 'Please enter a valid email address.' }
  }

  if (
    !submission.request_type ||
    !REQUEST_TYPE_VALUES.includes(submission.request_type as RequestType)
  ) {
    return { ok: false, error: 'Please select what we can help with.' }
  }

  if (!submission.consent_given) {
    return {
      ok: false,
      error:
        'Consent is required so we can reach out about your request.',
    }
  }

  // Length guards — protect the DB from oversize payloads
  if (submission.full_name.length > 200) {
    return { ok: false, error: 'Name is too long.' }
  }
  if (submission.email.length > 320) {
    return { ok: false, error: 'Email is too long.' }
  }
  if (submission.phone && submission.phone.length > 50) {
    return { ok: false, error: 'Phone number is too long.' }
  }
  if (submission.details && submission.details.length > 5000) {
    return {
      ok: false,
      error: 'Details are too long. Please summarize your situation.',
    }
  }

  // ─── DB insert ──────────────────────────────────────────────────────

  const supabase = await createClient()

  const { data: inserted, error: insertError } = await supabase
    .from('intake_requests')
    .insert({
      full_name: submission.full_name,
      email: submission.email,
      phone: submission.phone,
      request_type: submission.request_type,
      details: submission.details,
      consent_given: submission.consent_given,
    })
    .select('id')
    .single()

  if (insertError || !inserted) {
    console.error('Intake insert failed:', insertError)
    return {
      ok: false,
      error:
        'We couldn’t save your request right now. Please try again in a moment.',
    }
  }

  // ─── Operator notification (best-effort, non-blocking on failure) ───

  try {
    await sendOperatorNotification(submission, inserted.id)
  } catch (err) {
    // Email failed but the row landed. Log and continue — substrate truth
    // is in the DB, operators will see the request in /admin/intakes.
    console.error('Operator notification failed (row still saved):', err)
  }

  return { ok: true, id: inserted.id }
}

async function sendOperatorNotification(
  submission: IntakeSubmission,
  intakeId: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const recipientsRaw = process.env.INTAKE_NOTIFICATION_EMAILS

  if (!apiKey) {
    throw new Error('RESEND_API_KEY not configured')
  }
  if (!recipientsRaw) {
    throw new Error('INTAKE_NOTIFICATION_EMAILS not configured')
  }

  const recipients = recipientsRaw
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)

  if (recipients.length === 0) {
    throw new Error('No operator recipients configured')
  }

  const requestType = REQUEST_TYPE_LABELS[submission.request_type as RequestType] ?? submission.request_type
  const adminUrl = 'https://vizionz-sankofa-demo.vercel.app/admin/intakes'

  const html = `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background: #FAFAF8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0A0A0A;">
  <div style="max-width: 560px; margin: 0 auto; padding: 32px 24px;">
    <div style="height: 3px; background: linear-gradient(90deg, #CE1126 0%, #CE1126 33.33%, #0A0A0A 33.33%, #0A0A0A 66.66%, #007A33 66.66%, #007A33 100%); margin-bottom: 24px;"></div>

    <div style="font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #CE1126; margin-bottom: 8px; font-family: monospace;">
      New Intake Request
    </div>

    <h1 style="font-size: 22px; font-weight: 600; color: #0A0A0A; margin: 0 0 20px 0; font-family: Georgia, serif;">
      ${escapeHtml(submission.full_name)} reached out
    </h1>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid rgba(10,10,10,0.08); font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(10,10,10,0.55); width: 40%;">Looking for</td>
        <td style="padding: 8px 0; border-bottom: 1px solid rgba(10,10,10,0.08); font-size: 14px; color: #0A0A0A;">${escapeHtml(requestType)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid rgba(10,10,10,0.08); font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(10,10,10,0.55);">Email</td>
        <td style="padding: 8px 0; border-bottom: 1px solid rgba(10,10,10,0.08); font-size: 14px; color: #0A0A0A;"><a href="mailto:${escapeHtml(submission.email)}" style="color: #0A2548; text-decoration: none;">${escapeHtml(submission.email)}</a></td>
      </tr>
      ${submission.phone ? `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid rgba(10,10,10,0.08); font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(10,10,10,0.55);">Phone</td>
        <td style="padding: 8px 0; border-bottom: 1px solid rgba(10,10,10,0.08); font-size: 14px; color: #0A0A0A;"><a href="tel:${escapeHtml(submission.phone)}" style="color: #0A2548; text-decoration: none;">${escapeHtml(submission.phone)}</a></td>
      </tr>
      ` : ''}
    </table>

    ${submission.details ? `
    <div style="margin-bottom: 24px;">
      <div style="font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(10,10,10,0.55); margin-bottom: 8px;">What they shared</div>
      <div style="padding: 14px 16px; background: rgba(10,10,10,0.02); border-left: 3px solid rgba(10,10,10,0.15); font-size: 14px; line-height: 1.6; color: #0A0A0A; white-space: pre-wrap;">${escapeHtml(submission.details)}</div>
    </div>
    ` : ''}

    <a href="${adminUrl}" style="display: inline-block; padding: 14px 28px; font-size: 13px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #FFFFFF; background: #0A2548; border-radius: 2px; text-decoration: none;">
      Open admin queue
    </a>

    <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid rgba(10,10,10,0.08); font-size: 11px; line-height: 1.5; color: rgba(10,10,10,0.5); font-family: monospace;">
      Intake ID: ${intakeId}<br>
      Vizionz Sankofa Operations · Built by Yakini Digital
    </div>
  </div>
</body>
</html>
  `.trim()

  const text = [
    `New intake request from ${submission.full_name}`,
    ``,
    `Looking for: ${requestType}`,
    `Email: ${submission.email}`,
    submission.phone ? `Phone: ${submission.phone}` : null,
    ``,
    submission.details ? `What they shared:\n${submission.details}\n` : null,
    `Open admin queue: ${adminUrl}`,
    ``,
    `Intake ID: ${intakeId}`,
  ]
    .filter(Boolean)
    .join('\n')

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Vizionz Sankofa <hello@yakini.digital>',
      to: recipients,
      reply_to: submission.email,
      subject: `New intake — ${submission.full_name} (${requestType})`,
      html,
      text,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'unknown')
    throw new Error(`Resend returned ${response.status}: ${errorText}`)
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
