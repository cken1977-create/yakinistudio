import { NextRequest, NextResponse } from 'next/server'
import { rest, clientIp, isTestRecipient } from '@/lib/esign/server'
import { esc, rateLimited, tooMany } from '@/lib/server/guard'
import { Lead } from '@/types'
import { Resend } from 'resend'

// Verified Yakini sending domain (same sender /api/apply already uses), not the shared test sender.
const LEADS_FROM = 'Yakini <hello@yakini.digital>'

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

export async function POST(req: NextRequest) {
  try {
    if (rateLimited(`leads:${clientIp(req.headers) ?? 'unknown'}`, 5, 60 * 60_000)) return tooMany()
    const raw = await req.json()
    const cut = (v: unknown, n: number) => (v == null ? null : String(v).trim().slice(0, n))
    const body = {
      name: cut(raw.name, 120), email: cut(raw.email, 254), company: cut(raw.company, 160),
      service: cut(raw.service, 120), budget: cut(raw.budget, 60), message: cut(raw.message, 5000),
    } as Lead

    if (!body.name || !body.email || !body.service || !body.message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Server-only key: the leads table is not open to the public.
    const ins = await rest<unknown[]>('leads', {
      method: 'POST',
      prefer: 'return=representation',
      body: { name: body.name, email: body.email, company: body.company ?? null, service: body.service, budget: body.budget ?? null, message: body.message },
    })
    const data = ins.data
    if (!ins.ok) {
      console.error('Supabase error:', ins.status, ins.error?.message)
      return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 })
    }

    const resend = getResend()
    if (resend && !isTestRecipient(body.email)) await resend.emails.send({
      from: LEADS_FROM,
      to: 'cken1977@gmail.com',
      subject: ('New Lead: ' + body.name + ' — ' + body.service).replace(/[\r\n]+/g, ' ').slice(0, 200),
      html: '<div style="font-family:sans-serif;padding:32px"><h2>New Inquiry</h2><p><strong>Name:</strong> ' + esc(body.name) + '</p><p><strong>Email:</strong> ' + esc(body.email) + '</p><p><strong>Service:</strong> ' + esc(body.service) + '</p><p><strong>Budget:</strong> ' + esc(body.budget ?? 'Not specified') + '</p><p><strong>Message:</strong> ' + esc(body.message) + '</p></div>',
    })

    if (resend && !isTestRecipient(body.email)) await resend.emails.send({
      from: LEADS_FROM,
      to: body.email,
      subject: 'We received your inquiry.',
      html: '<div style="font-family:sans-serif;padding:32px"><h2>Hi ' + esc(body.name.split(' ')[0]) + ',</h2><p>We received your inquiry about ' + esc(body.service) + ' and will follow up within 24 hours.</p><p>— Yakini</p></div>',
    })

    return NextResponse.json({ success: true, data }, { status: 201 })

  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
