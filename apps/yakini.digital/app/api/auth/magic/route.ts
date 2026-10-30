import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { rest, clientIp } from '@/lib/esign/server'
import { isAdminEmail, isRepEmail } from '@/lib/auth/session'
import { esc, ilikeExact, rateLimited, sendEmail, sha256Hex, siteUrl, tooMany } from '@/lib/server/guard'

// Emails a one-time login link (1 hour) to a known client, to an admin for /dashboard,
// or to a sales rep on REP_EMAILS for the Demo Library (/reps).
// Only the SHA-256 of the link's code is stored, so a leaked table row can't be used to log in.

const LOGIN_FROM = process.env.LOGIN_FROM_EMAIL?.trim() || 'Yakini <hello@yakini.digital>'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = String(body.email ?? '').trim().toLowerCase()
    const forDashboard = body.for === 'dashboard'
    const forReps = body.for === 'reps'
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }
    const ip = clientIp(req.headers) ?? 'unknown'
    if (rateLimited(`magic-ip:${ip}`, 10, 15 * 60_000) || rateLimited(`magic-email:${email}`, 3, 15 * 60_000)) return tooMany()

    let allowed = false
    if (forDashboard) {
      allowed = isAdminEmail(email)
    } else if (forReps) {
      allowed = isRepEmail(email)
    } else {
      const r = await rest<{ email: string }[]>(`clients?select=email&email=ilike.${ilikeExact(email)}&active=is.true&limit=1`)
      if (!r.ok) throw new Error(`clients lookup failed (${r.status})`)
      allowed = (r.data ?? []).length > 0
    }

    if (!allowed) {
      // Dashboard and reps: answer the same either way so the allow lists can't be probed.
      if (forDashboard || forReps) return NextResponse.json({ success: true })
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Per-email limit that survives across server instances.
    const since = new Date(Date.now() - 15 * 60_000).toISOString()
    const recent = await rest<{ id: string }[]>(`auth_tokens?select=id&email=eq.${encodeURIComponent(email)}&created_at=gte.${encodeURIComponent(since)}`)
    if (recent.ok && (recent.data ?? []).length >= 3) return tooMany()

    const code = randomBytes(32).toString('hex')
    const ins = await rest('auth_tokens', {
      method: 'POST',
      prefer: 'return=minimal',
      body: { email, token: `sha256:${await sha256Hex(code)}`, expires_at: new Date(Date.now() + 60 * 60_000).toISOString(), used: false },
    })
    if (!ins.ok) throw new Error(`token insert failed (${ins.status})`)

    const link = `${siteUrl(req.url)}/api/auth/verify?token=${code}${forDashboard ? '&to=dashboard' : forReps ? '&to=reps' : ''}`
    const title = forDashboard ? 'Yakini Dashboard' : forReps ? 'Yakini Demo Library' : 'Yakini Client Portal'
    const html = '<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:32px;background:#141414;color:#F5EFE3">' +
      `<div style="border-left:3px solid #C9A84C;padding-left:16px;margin-bottom:24px"><h1 style="font-size:20px;margin:0 0 4px;color:#F5EFE3">${esc(title)}</h1>` +
      '<p style="color:#C9A84C;margin:0;font-size:12px">Digital Infrastructure</p></div>' +
      '<p style="color:#A89880;font-size:15px;line-height:1.6">Click the button below to sign in. This link works once and expires in 1 hour.</p>' +
      `<a href="${esc(link)}" style="display:inline-block;margin:24px 0;background:#C9A84C;color:#141414;padding:14px 28px;text-decoration:none;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:600">Sign in</a>` +
      '<p style="color:#666;font-size:12px">If you did not ask for this, ignore this email.</p></div>'
    const result = await sendEmail(email, `Your ${title} sign-in link`, html, LOGIN_FROM)
    if (result === 'failed') return NextResponse.json({ error: 'Could not send the email. Try again shortly.' }, { status: 502 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Magic link error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
