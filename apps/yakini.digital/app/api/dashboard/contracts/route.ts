import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { rest } from '@/lib/esign/server'
import { adminSession, esc, sendEmail, unauthorized } from '@/lib/server/guard'
import { SIGN_BASE_URL, buildClientEmail, contractTitle } from '@/lib/dashboard/contracts'

// Admin-only contract list and create+send. Uses the server-only key; the browser never talks to Supabase.

const LIST_COLS = 'id,client_name,client_email,client_business,client_phone,contract_type,contract_title,status,signing_token,sent_at,viewed_at,signed_at,created_at,notes'
const TYPES = ['msa_sow', 'msa', 'sow', 'nda', 'custom']

export async function GET() {
  if (!(await adminSession())) return unauthorized()
  const r = await rest<unknown[]>(`contracts?select=${LIST_COLS}&order=created_at.desc`)
  if (!r.ok) {
    console.error('[dashboard] list failed', r.status, r.error?.message)
    return NextResponse.json({ error: 'Could not load contracts' }, { status: 500 })
  }
  return NextResponse.json({ contracts: r.data ?? [] })
}

const str = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max)

export async function POST(req: NextRequest) {
  const admin = await adminSession()
  if (!admin) return unauthorized()
  const b = await req.json().catch(() => null)
  if (!b || typeof b !== 'object') return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const f = {
    client_name: str(b.client_name, 120),
    client_email: str(b.client_email, 254).toLowerCase(),
    client_business: str(b.client_business, 160),
    client_phone: str(b.client_phone, 40),
    contract_type: TYPES.includes(b.contract_type) ? b.contract_type as string : 'custom',
    setup_fee: str(b.setup_fee, 40),
    monthly_retainer: str(b.monthly_retainer, 40),
    min_term: str(b.min_term, 40),
    services: Array.isArray(b.services) ? (b.services as unknown[]).map(s => str(s, 120)).filter(Boolean).slice(0, 30) : [],
    special_terms: str(b.special_terms, 4000),
    notes: str(b.notes, 4000),
  }
  if (!f.client_name || !f.client_business || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.client_email)) {
    return NextResponse.json({ error: 'Name, business and a valid email are required' }, { status: 400 })
  }

  const token = randomBytes(32).toString('hex')
  const title = contractTitle(f.contract_type, f.client_business)
  const now = new Date().toISOString()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const c = await rest<{ id: string }[]>('contracts', {
    method: 'POST',
    prefer: 'return=representation',
    body: {
      client_name: f.client_name, client_email: f.client_email, client_business: f.client_business, client_phone: f.client_phone,
      contract_type: f.contract_type, contract_title: title, status: 'sent', signing_token: token,
      token_expires_at: expiresAt, sent_at: now, notes: f.notes, sent_by: admin.e,
    },
  })
  const contract = c.ok ? (c.data ?? [])[0] : null
  if (!contract) {
    console.error('[dashboard] create failed', c.status, c.error?.message)
    return NextResponse.json({ error: 'Could not create the contract' }, { status: 500 })
  }

  const servicesList = f.services.length ? f.services.map(s => `• ${s}`).join('\n') : 'To be specified in project kickoff'
  const fields = [
    ['setup_fee', f.setup_fee], ['monthly_retainer', f.monthly_retainer], ['min_term', f.min_term],
    ['services', servicesList], ['special_terms', f.special_terms],
  ].map(([field_name, field_value]) => ({ contract_id: contract.id, field_name, field_value, prefilled: true }))
  const fr = await rest('contract_fields', { method: 'POST', body: fields, prefer: 'return=minimal' })
  if (!fr.ok) console.error('[dashboard] fields insert failed', fr.status, fr.error?.message)

  const signingLink = `${SIGN_BASE_URL}/${token}`
  const clientHtml = buildClientEmail({
    name: esc(f.client_name), business: esc(f.client_business), title: esc(title), signingLink,
    setupFee: esc(f.setup_fee), monthly: esc(f.monthly_retainer), services: f.services.map(esc), expiresAt,
  })
  const result = await sendEmail(f.client_email, `Your Yakini contract is ready to sign — ${f.client_business}`, clientHtml)
  const emailed = result === 'sent'

  await rest('contract_audit', {
    method: 'POST',
    prefer: 'return=minimal',
    body: { contract_id: contract.id, event: 'created', actor: admin.e, notes: emailed ? `Contract created and sent to ${f.client_email}` : `Contract created; email ${result} for ${f.client_email}` },
  })

  // Copy to Yakini, only when the client was actually emailed (never for test contracts).
  if (emailed) {
    await sendEmail('admin@yakini.digital', `Contract Sent — ${f.client_business}`,
      `<div style="font-family:Arial;padding:24px;background:#0A0A0A;color:#F8F5EF;max-width:500px;">
        <div style="color:#C8A84B;font-weight:700;font-size:18px;margin-bottom:16px;">Contract Sent ✓</div>
        <p style="color:#888;font-size:14px;margin-bottom:8px;"><b style="color:#F8F5EF;">${esc(f.client_name)}</b> — ${esc(f.client_business)}</p>
        <p style="color:#888;font-size:13px;margin-bottom:8px;">${esc(f.client_email)}</p>
        <p style="color:#888;font-size:13px;margin-bottom:16px;">Document: ${esc(title)}</p>
        <p style="color:#888;font-size:12px;">Sent by ${esc(admin.e)}</p>
      </div>`)
  }

  return NextResponse.json({ contract: { id: contract.id }, emailed, email_note: emailed ? null : result === 'skipped' ? 'test address' : 'email failed' })
}
