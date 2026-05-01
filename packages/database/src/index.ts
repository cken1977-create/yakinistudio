// ═════════════════════════════════════════════════════════════════════════
// YAKINI DATABASE PACKAGE
// ═════════════════════════════════════════════════════════════════════════
// Shared database utilities used by every client site.
//
// File location in monorepo:
//   packages/database/src/index.ts
//
// Includes:
//   - Supabase client factory
//   - Lead capture API handler
//   - Magic link auth API handlers
//   - TypeScript types matching Supabase tables
// ═════════════════════════════════════════════════════════════════════════

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ───────────────────────────────────────────────────────────────────────
// CONFIG
// ───────────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mxshsmknfqxwltucgezl.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const RESEND_API_KEY = process.env.RESEND_API_KEY || ''

// ───────────────────────────────────────────────────────────────────────
// TYPES — match Supabase tables exactly
// ───────────────────────────────────────────────────────────────────────
export type Lead = {
  id: string
  client_id: string         // Which Yakini client this lead belongs to
  business: string
  name: string
  email: string
  phone?: string
  service?: string
  message: string
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
  source?: string           // e.g., 'website', 'referral'
  notes?: string
  created_at: string
  updated_at: string
}

export type Project = {
  id: string
  client_id: string         // Yakini's client (the business owner)
  customer_id?: string      // Optional — the end customer in the portal
  title: string
  status: 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold'
  description?: string
  start_date?: string
  due_date?: string
  progress: number          // 0-100
  notes?: string
  created_at: string
  updated_at: string
}

export type Invoice = {
  id: string
  client_id: string
  customer_id?: string
  project_id?: string
  invoice_number: string
  amount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  due_date: string
  paid_date?: string
  description?: string
  payment_link?: string
  created_at: string
}

export type AuthToken = {
  id: string
  email: string
  token: string
  client_id: string
  expires_at: string
  used: boolean
  created_at: string
}

// ───────────────────────────────────────────────────────────────────────
// SUPABASE CLIENT FACTORIES
// ───────────────────────────────────────────────────────────────────────

// Browser client — uses anon key, respects RLS
export function createBrowserClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true }
  })
}

// Server client — uses service role key, bypasses RLS for admin operations
export function createServerClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
  })
}

// ═════════════════════════════════════════════════════════════════════════
// API ROUTE HANDLERS
// ═════════════════════════════════════════════════════════════════════════
// These get used in Next.js API routes:
//   apps/[client]/app/api/lead/route.ts
//   apps/[client]/app/api/auth/magic/route.ts
//   apps/[client]/app/api/auth/verify/route.ts
// ═════════════════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────────────
// LEAD CAPTURE
// ───────────────────────────────────────────────────────────────────────
export async function handleLeadSubmission(payload: {
  client_id: string
  business: string
  name: string
  email: string
  phone?: string
  service?: string
  message: string
  notify_email: string
}) {
  const supabase = createServerClient()

  // 1 — Insert lead into Supabase
  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      client_id: payload.client_id,
      business: payload.business,
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone?.trim() || null,
      service: payload.service?.trim() || null,
      message: payload.message.trim(),
      status: 'new',
      source: 'website',
    })
    .select()
    .single()

  if (error || !lead) {
    return { success: false, error: error?.message || 'Insert failed' }
  }

  // 2 — Notify the client business owner
  await sendEmail({
    to: payload.notify_email,
    from: 'Yakini Leads <hello@yakini.digital>',
    subject: `New lead from your website — ${payload.name}`,
    html: buildClientLeadEmail({
      business: payload.business,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      service: payload.service,
      message: payload.message,
    }),
  })

  // 3 — Notify Yakini for tracking
  await sendEmail({
    to: 'hello@yakini.digital',
    from: 'Yakini Platform <hello@yakini.digital>',
    subject: `New ${payload.business} lead — ${payload.name}`,
    html: buildYakiniLeadEmail({
      client_id: payload.client_id,
      business: payload.business,
      name: payload.name,
      email: payload.email,
      service: payload.service,
    }),
  })

  // 4 — Send confirmation to lead
  await sendEmail({
    to: payload.email,
    from: `${payload.business} <hello@yakini.digital>`,
    subject: `Thanks for reaching out, ${payload.name.split(' ')[0]}`,
    html: buildLeadConfirmationEmail({
      name: payload.name,
      business: payload.business,
    }),
  })

  return { success: true, lead }
}

// ───────────────────────────────────────────────────────────────────────
// MAGIC LINK AUTH — Request
// ───────────────────────────────────────────────────────────────────────
export async function handleMagicLinkRequest(payload: {
  email: string
  client_id: string
  portal_url: string  // e.g., 'https://chefjada.com/portal'
}) {
  const supabase = createServerClient()

  // Generate token
  const tokenBytes = new Uint8Array(32)
  crypto.getRandomValues(tokenBytes)
  const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('')

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 min expiry

  // Store token
  const { error } = await supabase
    .from('auth_tokens')
    .insert({
      email: payload.email.toLowerCase().trim(),
      token,
      client_id: payload.client_id,
      expires_at: expiresAt,
      used: false,
    })

  if (error) {
    return { success: false, error: error.message }
  }

  // Send magic link email
  const magicLink = `${payload.portal_url}?token=${token}`

  await sendEmail({
    to: payload.email,
    from: 'Yakini Portal <hello@yakini.digital>',
    subject: `Your sign-in link`,
    html: buildMagicLinkEmail({ magicLink }),
  })

  return { success: true }
}

// ───────────────────────────────────────────────────────────────────────
// MAGIC LINK AUTH — Verify
// ───────────────────────────────────────────────────────────────────────
export async function handleMagicLinkVerify(payload: {
  token: string
  client_id: string
}) {
  const supabase = createServerClient()

  const { data: authToken, error } = await supabase
    .from('auth_tokens')
    .select('*')
    .eq('token', payload.token)
    .eq('client_id', payload.client_id)
    .eq('used', false)
    .single()

  if (error || !authToken) {
    return { success: false, error: 'Invalid or expired link' }
  }

  if (new Date(authToken.expires_at) < new Date()) {
    return { success: false, error: 'Link has expired. Request a new one.' }
  }

  // Mark token as used
  await supabase
    .from('auth_tokens')
    .update({ used: true })
    .eq('id', authToken.id)

  return { success: true, email: authToken.email }
}

// ═════════════════════════════════════════════════════════════════════════
// EMAIL HELPERS
// ═════════════════════════════════════════════════════════════════════════

async function sendEmail({ to, from, subject, html }: {
  to: string
  from: string
  subject: string
  html: string
}) {
  if (!RESEND_API_KEY) return

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({ from, to, subject, html }),
    })
  } catch (e) {
    console.error('Email send failed:', e)
  }
}

// ═════════════════════════════════════════════════════════════════════════
// EMAIL TEMPLATES
// ═════════════════════════════════════════════════════════════════════════

function emailWrapper(content: string, footer = 'Powered by Yakini Digital Infrastructure') {
  return `
    <!DOCTYPE html>
    <html><body style="margin:0;padding:0;background:#F4F1EB;font-family:Georgia,serif;">
      <div style="max-width:600px;margin:0 auto;background:white;">
        <div style="background:#1A3A5C;padding:24px 32px;">
          <div style="font-family:Arial,sans-serif;font-weight:700;font-size:18px;color:white;letter-spacing:2px;">YAKINI</div>
          <div style="background:#C8A84B;height:2px;margin-top:16px;width:40px;"></div>
        </div>
        <div style="padding:40px 32px;">${content}</div>
        <div style="background:#0F2540;padding:20px 32px;text-align:center;">
          <p style="font-family:Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.5);margin:0;">
            ${footer}
          </p>
        </div>
      </div>
    </body></html>
  `
}

function buildClientLeadEmail({ business, name, email, phone, service, message }: any) {
  return emailWrapper(`
    <div style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;color:#C8A84B;letter-spacing:2px;margin-bottom:12px;">
      NEW LEAD · ${business.toUpperCase()}
    </div>
    <h2 style="font-family:Georgia,serif;font-size:28px;color:#1A3A5C;margin:0 0 24px;font-weight:500;">
      ${name} just reached out.
    </h2>
    <div style="background:#F8F5EF;border-left:3px solid #C8A84B;padding:20px 24px;margin-bottom:24px;">
      <table style="width:100%;font-family:Arial,sans-serif;font-size:14px;">
        <tr><td style="padding:6px 0;color:#888;width:90px;">Name</td><td style="color:#333;font-weight:500;">${name}</td></tr>
        <tr><td style="padding:6px 0;color:#888;">Email</td><td style="color:#333;"><a href="mailto:${email}" style="color:#1A3A5C;">${email}</a></td></tr>
        ${phone ? `<tr><td style="padding:6px 0;color:#888;">Phone</td><td style="color:#333;"><a href="tel:${phone}" style="color:#1A3A5C;">${phone}</a></td></tr>` : ''}
        ${service ? `<tr><td style="padding:6px 0;color:#888;">Interest</td><td style="color:#333;">${service}</td></tr>` : ''}
      </table>
    </div>
    <div style="background:white;border:1px solid #E0DBD0;padding:20px;margin-bottom:24px;">
      <div style="font-family:Arial,sans-serif;font-size:9px;font-weight:700;color:#888;letter-spacing:2px;margin-bottom:10px;">MESSAGE</div>
      <p style="font-size:15px;line-height:1.7;color:#333;margin:0;">${message.replace(/\n/g, '<br/>')}</p>
    </div>
    <a href="mailto:${email}?subject=Re: Your inquiry to ${business}" style="display:inline-block;background:#1A3A5C;color:white;padding:14px 28px;text-decoration:none;font-family:Arial,sans-serif;font-size:12px;letter-spacing:1px;font-weight:600;">REPLY TO ${name.split(' ')[0].toUpperCase()}</a>
  `)
}

function buildYakiniLeadEmail({ client_id, business, name, email, service }: any) {
  return emailWrapper(`
    <div style="font-family:Arial,sans-serif;font-size:14px;color:#333;">
      <strong>New lead captured.</strong>
    </div>
    <table style="width:100%;font-family:Arial,sans-serif;font-size:13px;margin-top:20px;">
      <tr><td style="padding:6px 0;color:#888;width:120px;">Client</td><td>${business} (${client_id})</td></tr>
      <tr><td style="padding:6px 0;color:#888;">Lead Name</td><td>${name}</td></tr>
      <tr><td style="padding:6px 0;color:#888;">Email</td><td>${email}</td></tr>
      ${service ? `<tr><td style="padding:6px 0;color:#888;">Service</td><td>${service}</td></tr>` : ''}
    </table>
  `, 'Yakini Platform · Internal notification')
}

function buildLeadConfirmationEmail({ name, business }: any) {
  return emailWrapper(`
    <h2 style="font-family:Georgia,serif;font-size:28px;color:#1A3A5C;margin:0 0 16px;font-weight:500;">
      Thanks, ${name.split(' ')[0]}.
    </h2>
    <p style="font-size:16px;line-height:1.7;color:#444;margin:0 0 16px;">
      Your message reached <strong>${business}</strong>. We'll be in touch within 24 hours.
    </p>
    <p style="font-size:14px;line-height:1.7;color:#888;margin:0;">
      In the meantime, feel free to reply directly to this email if you have additional questions.
    </p>
  `, `${business} · Powered by Yakini`)
}

function buildMagicLinkEmail({ magicLink }: { magicLink: string }) {
  return emailWrapper(`
    <h2 style="font-family:Georgia,serif;font-size:26px;color:#1A3A5C;margin:0 0 16px;font-weight:500;">
      Your sign-in link is ready.
    </h2>
    <p style="font-size:15px;line-height:1.7;color:#555;margin:0 0 28px;">
      Click the button below to sign in. This link expires in 30 minutes.
    </p>
    <a href="${magicLink}" style="display:inline-block;background:#1A3A5C;color:white;padding:16px 36px;text-decoration:none;font-family:Arial,sans-serif;font-size:13px;letter-spacing:1.5px;font-weight:600;margin-bottom:24px;">
      SIGN IN →
    </a>
    <p style="font-size:12px;color:#999;margin-top:24px;line-height:1.6;">
      If you didn't request this link, you can safely ignore this email.
    </p>
  `)
      }
    
