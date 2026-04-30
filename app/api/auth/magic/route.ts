import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { Resend } from 'resend'
import { randomBytes } from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const supabase = createClient()

    // Check if email is an authorized client
    const { data: client } = await supabase
      .from('clients')
      .select('email')
      .eq('email', email)
      .single()

    if (!client) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      )
    }

    // Generate secure token
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Store token
    await supabase.from('auth_tokens').insert([{
      email,
      token,
      expires_at: expiresAt.toISOString(),
    }])

    // Send magic link via Resend
    const magicLink = 'https://yakini.digital/client/verify?token=' + token

    await resend.emails.send({
      from: 'Yakini <hello@yakini.digital>',
      to: email,
      subject: 'Your Yakini Client Portal Login Link',
      html: '<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:32px;background:#141414;color:#F5EFE3">' +
        '<div style="border-left:3px solid #C9A84C;padding-left:16px;margin-bottom:24px">' +
        '<h1 style="font-size:20px;margin:0 0 4px;color:#F5EFE3">Yakini Client Portal</h1>' +
        '<p style="color:#C9A84C;margin:0;font-size:12px">Digital Infrastructure</p>' +
        '</div>' +
        '<p style="color:#A89880;font-size:15px;line-height:1.6">Click the link below to access your client portal. This link expires in 1 hour.</p>' +
        '<a href="' + magicLink + '" style="display:inline-block;margin:24px 0;background:#C9A84C;color:#141414;padding:14px 28px;text-decoration:none;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:600">Access Portal</a>' +
        '<p style="color:#444;font-size:12px">If you did not request this link ignore this email.</p>' +
        '<div style="margin-top:32px;padding-top:16px;border-top:1px solid #2E2A24">' +
        '<p style="margin:0;font-size:10px;color:#444;text-align:center">Yakini — We build what you build on — yakini.digital</p>' +
        '</div></div>',
    })

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (err) {
    console.error('Magic link error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
