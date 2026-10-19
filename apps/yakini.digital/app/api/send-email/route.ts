import { NextRequest, NextResponse } from 'next/server'

const RESEND_API_KEY = process.env.RESEND_API_KEY

export async function POST(req: NextRequest) {
  if (!RESEND_API_KEY) return NextResponse.json({ error: 'Email is not configured' }, { status: 500 })
  try {
    const body = await req.json()
    const { to, subject, html, from } = body

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: from || 'Yakini Contracts <admin@yakini.digital>',
        to,
        subject,
        html
      })
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Resend error:', data)
      return NextResponse.json({ error: data }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Send email error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
