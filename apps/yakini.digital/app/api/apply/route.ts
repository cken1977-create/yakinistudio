import { NextRequest, NextResponse } from 'next/server'
import { clientIp, isTestRecipient, rest } from '@/lib/esign/server'
import { offerLabel } from '@/lib/pricing'
import { esc, rateLimited, tooMany } from '@/lib/server/guard'

// ═════════════════════════════════════════════════════════════════════════
// YAKINI APPLICATION API
// File: apps/yakini.digital/app/api/apply/route.ts
//
// 1. Saves the partnership application to Supabase
// 2. Sends an applicant confirmation email
// 3. Sends an admin notification to admin@yakini.digital
// ═════════════════════════════════════════════════════════════════════════

const RESEND_API_KEY = process.env.RESEND_API_KEY!
const ADMIN_EMAIL = process.env.YAKINI_ADMIN_EMAIL || 'admin@yakini.digital'

export async function POST(req: NextRequest) {
  try {
    if (rateLimited(`apply:${clientIp(req.headers) ?? 'unknown'}`, 5, 60 * 60_000)) return tooMany()
    const data = await req.json()
    if (typeof data !== 'object' || data === null) return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    for (const [k, v] of Object.entries(data)) {
      if (v != null && typeof v !== 'string') return NextResponse.json({ error: `Bad field ${k}` }, { status: 400 })
      if (typeof v === 'string' && v.length > 5000) return NextResponse.json({ error: `${k} is too long` }, { status: 400 })
    }

    // Validate required fields
    if (!data.full_name || !data.email || !data.business_name || !data.industry) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    // HTML-escaped copy for the emails (the database gets the raw text).
    const view: Record<string, string> = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, esc(v)]))
    if (!/^https?:\/\//i.test(String(data.business_website ?? ''))) view.business_website = ''

    // 1. Save to database (server-only key; the table is not open to the public)
    const ins = await rest<{ id: string }[]>('partnership_applications', {
      method: 'POST',
      prefer: 'return=representation',
      body: {
        full_name: data.full_name,
        email: data.email.toLowerCase().trim(),
        phone: data.phone || null,
        role: data.role || null,
        business_name: data.business_name,
        business_website: data.business_website || null,
        industry: data.industry,
        revenue_range: data.revenue_range || null,
        location: data.location || null,
        tier_interest: data.tier_interest || null,
        timeline: data.timeline || null,
        current_pain: data.current_pain || null,
        biggest_outcome: data.biggest_outcome || null,
        referral_source: data.referral_source || null,
        why_yakini: data.why_yakini || null,
        additional: data.additional || null,
        status: 'new',
      },
    })
    const app = ins.ok ? (ins.data ?? [])[0] : null
    const insertErr = app ? null : (ins.error ?? { message: `status ${ins.status}` })

    if (insertErr || !app) {
      console.error('Insert error:', insertErr)
      return NextResponse.json({ error: 'Could not save application' }, { status: 500 })
    }

    // 2. Send applicant confirmation
    // Test submissions (reserved test domains) send no email at all.
    if (RESEND_API_KEY && !isTestRecipient(data.email)) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Yakini <hello@yakini.digital>',
            to: data.email,
            subject: 'Thanks, we have your details. Yakini',
            html: buildApplicantEmail(view),
          })
        })
      } catch (e) {
        console.error('Applicant email failed:', e)
      }

      // 3. Send admin notification
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Yakini Apply <hello@yakini.digital>',
            to: ADMIN_EMAIL,
            subject: `🔥 New Application: ${data.full_name} — ${data.business_name}`,
            html: buildAdminEmail(view, app.id),
          })
        })
      } catch (e) {
        console.error('Admin email failed:', e)
      }
    }

    return NextResponse.json({
      success: true,
      application_id: app.id,
    })
  } catch (error: unknown) {
    console.error('Apply error:', error)
    const message = error instanceof Error ? error.message : 'Application submission failed'
    return NextResponse.json({
      error: message
    }, { status: 500 })
  }
}

function buildApplicantEmail(data: Record<string, string>) {
  return `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #050E1F; color: #F4F1EB; padding: 0;">

      <!-- Header -->
      <div style="background: linear-gradient(135deg, #050E1F 0%, #0A1F3D 100%); padding: 40px 32px; text-align: center; border-bottom: 2px solid #C8A84B;">
        <div style="display: inline-block; width: 48px; height: 48px; border: 2px solid #C8A84B; line-height: 44px; font-size: 28px; font-style: italic; color: #C8A84B; margin-bottom: 16px;">Y</div>
        <h1 style="font-family: Georgia, serif; font-style: italic; font-size: 28px; font-weight: 400; color: #F4F1EB; margin: 0; letter-spacing: 0.02em;">Yakini</h1>
        <div style="font-size: 10px; letter-spacing: 0.3em; color: #C8A84B; margin-top: 8px; font-family: Arial, sans-serif;">SET UP WITH YOU · HERE TO STAY</div>
      </div>

      <!-- Body -->
      <div style="padding: 48px 32px;">
        <div style="font-size: 11px; letter-spacing: 0.3em; color: #C8A84B; margin-bottom: 16px; font-family: Arial, sans-serif; text-transform: uppercase; font-weight: 700;">WE HAVE YOUR DETAILS</div>

        <h2 style="font-family: Georgia, serif; font-size: 36px; font-weight: 400; color: #F4F1EB; margin: 0 0 24px; line-height: 1.1;">
          Thank you, <span style="font-style: italic; color: #C8A84B;">${data.full_name.split(' ')[0]}.</span>
        </h2>

        <p style="font-size: 16px; line-height: 1.7; color: #F4F1EB; margin-bottom: 24px;">
          Thanks for telling us about <strong style="color: #C8A84B;">${data.business_name}</strong>. Your details are with us.
        </p>

        <p style="font-size: 16px; line-height: 1.7; color: rgba(244, 241, 235, 0.7); margin-bottom: 32px;">
          A real person at Yakini reads every message. No sales sequence, no pressure.
        </p>

        <!-- Next steps box -->
        <div style="background: rgba(200, 168, 75, 0.06); border-left: 3px solid #C8A84B; padding: 24px; margin-bottom: 32px;">
          <div style="font-size: 11px; letter-spacing: 0.25em; color: #C8A84B; margin-bottom: 16px; font-family: Arial, sans-serif; text-transform: uppercase; font-weight: 700;">WHAT HAPPENS NEXT</div>

          <div style="margin-bottom: 16px; font-size: 15px; line-height: 1.7; color: #F4F1EB;">
            <strong style="color: #C8A84B;">1.</strong> We read what you sent.
          </div>
          <div style="margin-bottom: 16px; font-size: 15px; line-height: 1.7; color: #F4F1EB;">
            <strong style="color: #C8A84B;">2.</strong> We reach out to set up a call at a time that suits you.
          </div>
          <div style="font-size: 15px; line-height: 1.7; color: #F4F1EB;">
            <strong style="color: #C8A84B;">3.</strong> You get a written scope and quote before anything starts.
          </div>
        </div>

        <p style="font-size: 14px; line-height: 1.7; color: rgba(244, 241, 235, 0.7); margin-bottom: 32px; font-style: italic; font-family: Georgia, serif;">
          Keep an eye on this inbox.
        </p>

        <div style="text-align: center; margin: 40px 0;">
          <a href="https://yakini.digital/custom-builds" style="display: inline-block; background: #C8A84B; color: #050E1F; padding: 16px 32px; text-decoration: none; font-weight: 600; font-size: 14px; letter-spacing: 0.05em; font-family: Arial, sans-serif;">
            See custom builds →
          </a>
        </div>

        <p style="font-size: 13px; color: rgba(244, 241, 235, 0.5); margin-top: 32px; line-height: 1.6;">
          Questions in the meantime? Reply to this email or reach me directly at <a href="mailto:hello@yakini.digital" style="color: #C8A84B;">hello@yakini.digital</a>.
        </p>
      </div>

      <!-- Footer -->
      <div style="background: #000000; padding: 24px 32px; text-align: center; border-top: 1px solid rgba(255,255,255,0.08);">
        <div style="font-family: Georgia, serif; font-style: italic; font-size: 14px; color: rgba(244, 241, 235, 0.55); margin-bottom: 8px;">
          Set up with you. And we stay.
        </div>
        <div style="font-size: 11px; color: rgba(244, 241, 235, 0.4); letter-spacing: 0.05em;">
          Yakini · Part of the BRSA Holdings ecosystem
        </div>
      </div>
    </div>
  `
}

function buildAdminEmail(data: Record<string, string>, applicationId: string) {
  const planOrKit = offerLabel(data.tier_interest)

  return `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #fff; color: #1a1a1a;">

      <!-- Header -->
      <div style="background: #C8A84B; padding: 20px 32px;">
        <div style="font-size: 11px; letter-spacing: 0.3em; color: #050E1F; font-weight: 700; text-transform: uppercase;">🔥 NEW PARTNERSHIP APPLICATION</div>
      </div>

      <div style="padding: 32px;">
        <!-- Headline -->
        <h2 style="margin: 0 0 8px; font-size: 24px; color: #050E1F;">${data.full_name}</h2>
        <div style="color: #666; font-size: 14px; margin-bottom: 4px;">${data.role || 'Role not specified'} at <strong>${data.business_name}</strong></div>
        <div style="color: #888; font-size: 13px; margin-bottom: 24px;">${data.email} · ${data.phone || 'No phone'} · ${data.location || 'Location not specified'}</div>

        <!-- Quick facts -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; padding: 16px; background: #f5f3ed; border-left: 4px solid #C8A84B;">
          <div>
            <div style="font-size: 10px; letter-spacing: 0.2em; color: #888; font-weight: 700; text-transform: uppercase;">INDUSTRY</div>
            <div style="font-size: 14px; color: #050E1F; font-weight: 600; margin-top: 4px;">${data.industry}</div>
          </div>
          <div>
            <div style="font-size: 10px; letter-spacing: 0.2em; color: #888; font-weight: 700; text-transform: uppercase;">REVENUE</div>
            <div style="font-size: 14px; color: #050E1F; font-weight: 600; margin-top: 4px;">${data.revenue_range || 'Not provided'}</div>
          </div>
          <div>
            <div style="font-size: 10px; letter-spacing: 0.2em; color: #888; font-weight: 700; text-transform: uppercase;">PLAN OR PARTNER</div>
            <div style="font-size: 14px; color: #050E1F; font-weight: 600; margin-top: 4px;">${planOrKit}</div>
          </div>
          <div>
            <div style="font-size: 10px; letter-spacing: 0.2em; color: #888; font-weight: 700; text-transform: uppercase;">TIMELINE</div>
            <div style="font-size: 14px; color: #050E1F; font-weight: 600; margin-top: 4px;">${data.timeline || 'Not specified'}</div>
          </div>
        </div>

        ${data.business_website ? `
          <div style="margin-bottom: 16px;">
            <div style="font-size: 10px; letter-spacing: 0.2em; color: #888; font-weight: 700; text-transform: uppercase;">WEBSITE</div>
            <div style="font-size: 14px; margin-top: 4px;"><a href="${data.business_website}" style="color: #C8A84B;">${data.business_website}</a></div>
          </div>
        ` : ''}

        <!-- Pain -->
        <div style="margin-bottom: 24px;">
          <div style="font-size: 10px; letter-spacing: 0.2em; color: #888; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">WHAT'S BROKEN</div>
          <div style="background: #fafafa; padding: 16px; border-left: 3px solid #C8A84B; font-size: 14px; line-height: 1.6; color: #1a1a1a; white-space: pre-wrap;">${data.current_pain}</div>
        </div>

        <!-- Outcome -->
        <div style="margin-bottom: 24px;">
          <div style="font-size: 10px; letter-spacing: 0.2em; color: #888; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">DESIRED OUTCOME</div>
          <div style="background: #fafafa; padding: 16px; border-left: 3px solid #C8A84B; font-size: 14px; line-height: 1.6; color: #1a1a1a; white-space: pre-wrap;">${data.biggest_outcome}</div>
        </div>

        ${data.why_yakini ? `
          <div style="margin-bottom: 16px;">
            <div style="font-size: 10px; letter-spacing: 0.2em; color: #888; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">WHY YAKINI</div>
            <div style="font-size: 14px; line-height: 1.6; color: #1a1a1a; padding: 12px; background: #fafafa; white-space: pre-wrap;">${data.why_yakini}</div>
          </div>
        ` : ''}

        ${data.additional ? `
          <div style="margin-bottom: 16px;">
            <div style="font-size: 10px; letter-spacing: 0.2em; color: #888; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">ADDITIONAL CONTEXT</div>
            <div style="font-size: 14px; line-height: 1.6; color: #1a1a1a; padding: 12px; background: #fafafa; white-space: pre-wrap;">${data.additional}</div>
          </div>
        ` : ''}

        ${data.referral_source ? `
          <div style="margin-bottom: 16px; font-size: 13px; color: #555;">
            <strong>Referral source:</strong> ${data.referral_source}
          </div>
        ` : ''}

        <!-- Quick actions -->
        <div style="margin-top: 32px; padding: 20px; background: #050E1F; color: #F4F1EB;">
          <div style="font-size: 11px; letter-spacing: 0.2em; color: #C8A84B; font-weight: 700; margin-bottom: 12px; text-transform: uppercase;">QUICK ACTIONS</div>
          <div style="margin-bottom: 8px;">
            <a href="mailto:${data.email}" style="color: #C8A84B; text-decoration: none;">📧 Reply to ${data.email}</a>
          </div>
          ${data.phone ? `
            <div style="margin-bottom: 8px;">
              <a href="tel:${data.phone}" style="color: #C8A84B; text-decoration: none;">📞 Call ${data.phone}</a>
            </div>
          ` : ''}
          <div style="font-size: 11px; color: rgba(244, 241, 235, 0.5); margin-top: 12px;">Application ID: ${applicationId}</div>
        </div>
      </div>
    </div>
  `
          }
