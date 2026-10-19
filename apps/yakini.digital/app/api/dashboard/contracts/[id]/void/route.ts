import { NextRequest, NextResponse } from 'next/server'
import { rest } from '@/lib/esign/server'
import { adminSession, unauthorized } from '@/lib/server/guard'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await adminSession()
  if (!admin) return unauthorized()
  const { id } = await ctx.params
  if (!UUID.test(id)) return NextResponse.json({ error: 'Bad id' }, { status: 400 })
  // A signed contract stays signed; only unsigned ones can be voided.
  const r = await rest<{ id: string }[]>(`contracts?id=eq.${id}&status=neq.signed`, {
    method: 'PATCH', prefer: 'return=representation', body: { status: 'voided', voided_reason: 'Voided by Yakini' },
  })
  if (!r.ok || (r.data ?? []).length === 0) return NextResponse.json({ error: 'Could not void (not found or already signed)' }, { status: 409 })
  await rest('contract_audit', { method: 'POST', prefer: 'return=minimal', body: { contract_id: id, event: 'voided', actor: admin.e, notes: 'Voided from dashboard' } })
  return NextResponse.json({ ok: true })
}
