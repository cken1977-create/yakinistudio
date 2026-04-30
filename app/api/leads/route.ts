import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { Lead } from '@/types'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const body: Lead = await req.json()

    if (!body.name || !body.email || !body.service || !body.message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

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
      return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 })
    }

    await resend.emails.send({
      from: 'Yakini <onboarding@resend.dev>',
      to: 'cken1977@gmail.com',
      subject: 'New Lead: ' + body.name + ' — ' + body.service,
      html: '<div style="font-family:sans-serif;padding:32px"><h2>New Inquiry</h2><p><strong>Name:</strong> ' + body.name + '</p><p><strong>Email:</strong> ' + body.email + '</p><p><strong>Service:</strong> ' + body.service + '</p><p><strong>Budget:</strong> ' + (body.budget ?? 'Not specified') + '</p><p><strong>Message:</strong> ' + body.message + '</p></div>',
    })

    await resend.emails.send({
      from: 'Yakini <onboarding@resend.dev>',
      to: body.email,
      subject: 'We received your inquiry.',
      html: '<div style="font-family:sans-serif;padding:32px"><h2>Hi ' + body.name.split(' ')[0] + ',</h2><p>We received your inquiry about ' + body.service + ' and will follow up within 24 hours.</p><p>— Yakini</p></div>',
    })

    return NextResponse.json({ success: true, data }, { status: 201 })

  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
