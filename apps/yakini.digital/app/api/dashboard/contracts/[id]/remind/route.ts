import { NextRequest, NextResponse } from 'next/server'
import { rest } from '@/lib/esign/server'
import { adminSession, esc, rateLimited, sendEmail, tooMany, unauthorized } from '@/lib/server/guard'
import { SIGN_BASE_URL, buildReminderEmail } from '@/lib/dashboard/contracts'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
type Row = { id: string; client_name: string; client_email: string; client_business: string; contract_title: string; signing_token: string | null; status: string }

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await adminSession()
  if (!admin) return unauthorized()
  const { id } = await ctx.params
  if (!UUID.test(id)) return NextResponse.json({ error: 'Bad id' }, { status: 400 })
  if (rateLimited(`remind:${id}`, 3, 60 * 60_000)) return tooMany()
  const r = await rest<Row[]>(`contracts?id=eq.${id}&select=id,client_name,client_email,client_business,contract_title,signing_token,status`)
  const c = r.ok ? (r.data ?? [])[0] : null
  if (!c || !c.signing_token) return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
  if (!['sent', 'viewed'].includes(c.status)) return NextResponse.json({ error: `Contract is ${c.status}; no reminder sent` }, { status: 409 })
  const html = buildReminderEmail({ name: esc(c.client_name), business: esc(c.client_business), title: esc(c.contract_title), signingLink: `${SIGN_BASE_URL}/${c.signing_token}` })
  const result = await sendEmail(c.client_email, `Reminder: Your Yakini contract is ready to sign — ${c.client_business}`, html)
  if (result === 'failed') return NextResponse.json({ error: 'Email failed' }, { status: 502 })
  await rest('contract_audit', { method: 'POST', prefer: 'return=minimal', body: { contract_id: id, event: 'reminder', actor: admin.e, notes: result === 'sent' ? 'Reminder emailed' : 'Reminder skipped (test address)' } })
  return NextResponse.json({ emailed: result === 'sent', email_note: result === 'skipped' ? 'test address' : null })
}
