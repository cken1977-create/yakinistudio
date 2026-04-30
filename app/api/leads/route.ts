import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { Lead } from '@/types'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const body: Lead = await req.json()

    // Validate required fields
    if (!body.name || !body.email || !body.service || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Save to Supabase
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leads')
      .insert([{
        name: body.name,
        email: body.email,
        company: body.company ?? null,
        service: body.service,
        budget: body.budget ?? null,
        message: body.message,
      }])
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to save lead' },
        { status: 500 }
      )
    }

    // Send notification email to Yakini
    await resend.emails.send({
      from: 'Yakini <onboarding@resend.dev>',
      to: 'cken1977@gmail.com',
      subject: `New Lead: ${body.name} — ${body.service}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
          <div style="border-left:4px solid #C9A84C;padding-left:20px;margin-bottom:32px;">
            <h1 style="font-size:24px;color:#141414;margin:0 0 4px;">
              New Inquiry — Yakini
            </h1>
            <p style="color:#888;margin:0;font-size:14px;">
              Submitted via yakini.digital
            </p>
          </div>

          <table style="width:100%;border-collapse:collapse;">
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:12px 0;color:#888;font-size:13px;width:120px;">Name</td>
              <td style="padding:12px 0;color:#141414;font-size:14px;font-weight:600;">
                ${body.name}
              </td>
            </tr>
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:12px 0;color:#888;font-size:13px;">Email</td>
              <td style="padding:12px 0;color:#141414;font-size:14px;">
                <a href="mailto:${body.email}" style="color:#C9A84C;">
                  ${body.email}
                </a>
              </td>
            </tr>
            ${body.company ? `
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:12px 0;color:#888;font-size:13px;">Company</td>
              <td style="padding:12px 0;color:#141414;font-size:14px;">
                ${body.company}
              </td>
            </tr>` : ''}
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:12px 0;color:#888;font-size:13px;">Service</td>
              <td style="padding:12px 0;color:#141414;font-size:14px;font-weight:600;">
                ${body.service}
              </td>
            </tr>
            ${body.budget ? `
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:12px 0;color:#888;font-size:13px;">Budget</td>
              <td style="padding:12px 0;color:#141414;font-size:14px;">
                ${body.budget}
              </td>
            </tr>` : ''}
            <tr>
              <td style="padding:12px 0;color:#888;font-size:13px;vertical-align:top;">
                Message
              </td>
              <td style="padding:12px 0;color:#141414;font-size:14px;line-height:1.6;">
                ${body.message}
              </td>
            </tr>
          </table>

          <div style="margin-top:32px;padding:20px;background:#f9f9f9;border-radius:4px;">
            <p style="margin:0;font-size:13px;color:#888;">
              Reply directly to 
              <a href="mailto:${body.email}" style="color:#C9A84C;">
                ${body.email}
              </a> 
              to respond to this inquiry.
            </p>
          </div>

          <div style="margin-top:32px;border-top:1px solid #eee;padding-top:20px;">
            <p style="margin:0;font-size:11px;color:#bbb;text-align:center;">
              Yakini — We build what you build on. — yakini.digital
            </p>
          </div>
        </div>
      `,
    })

    // Send confirmation email to client
    await resend.emails.send({
      from: 'Yakini <onboarding@resend.dev>',
      to: body.email,
      subject: `We received your inquiry, ${body.name.split(' ')[0]}.`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
          <div style="border-left:4px solid #C9A84C;padding-left:20px;margin-bottom:32px;">
            <h1 style="font-size:24px;color:#141414;margin:0 0 4px;">
              We'll be in touch within 24 hours.
            </h1>
            <p style="color:#888;margin:0;font-size:14px;">
              Yakini — Digital Infrastructure
            </p>
          </div>

          <p style="color:#444;font-size:15p
