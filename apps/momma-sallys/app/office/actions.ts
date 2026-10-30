'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { funnel, type Lead } from '@/lib/funnel/db'
import { codeMatches, endSession, requireOwner, startSession } from '@/lib/funnel/owner'
import { sendQuote, stopSequence } from '@/lib/funnel/mailer'

const STAGES = ['inquiry', 'proposal_sent', 'tasting', 'booked', 'lost'] as const
const idOk = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f-]{36}$/.test(v)

export async function login(formData: FormData) {
  const code = String(formData.get('code') ?? '').trim()
  await new Promise((r) => setTimeout(r, 400))
  if (!code || !codeMatches(code)) redirect('/office?e=1')
  await startSession()
  redirect('/office')
}

export async function logout() {
  await endSession()
  redirect('/office')
}

export async function setStage(formData: FormData) {
  await requireOwner()
  const id = formData.get('id'), stage = String(formData.get('stage') ?? '')
  if (!idOk(id) || !(STAGES as readonly string[]).includes(stage)) return
  await funnel('set_stage', { id, stage, lost_reason: String(formData.get('lost_reason') ?? '').slice(0, 300) })
  if (stage === 'booked' || stage === 'lost') await stopSequence(id, `stage ${stage}`)
  revalidatePath(`/office/lead/${id}`)
  redirect(`/office/lead/${id}`)
}

export async function markReplied(formData: FormData) {
  await requireOwner()
  const id = formData.get('id')
  if (!idOk(id)) return
  await funnel('mark_replied', { id })
  await stopSequence(id, 'replied')
  redirect(`/office/lead/${id}`)
}

export async function saveQuote(formData: FormData) {
  await requireOwner()
  const id = formData.get('id')
  if (!idOk(id)) return
  const amt = String(formData.get('amount') ?? '').replace(/[$,\s]/g, '')
  const cents = amt ? Math.round(Number(amt) * 100) : null
  const dep = String(formData.get('deposit_url') ?? '').trim()
  if ((amt && !Number.isFinite(cents)) || (dep && !/^https:\/\/\S+$/.test(dep))) redirect(`/office/lead/${id}?e=quote`)
  await funnel('set_quote', { id, quote_amount_cents: cents == null ? '' : String(cents), quote_note: String(formData.get('note') ?? '').slice(0, 2000), deposit_url: dep })
  if (formData.get('send') === '1') {
    const got = await funnel<{ lead: Lead }>('get', { id })
    const res = await sendQuote(got.lead)
    if (res.status === 'sent') await funnel('quote_sent', { id })
    redirect(`/office/lead/${id}?q=${res.status}`)
  }
  redirect(`/office/lead/${id}?q=saved`)
}

export async function depositPaid(formData: FormData) {
  await requireOwner()
  const id = formData.get('id')
  if (!idOk(id)) return
  await funnel('deposit_paid', { id })
  redirect(`/office/lead/${id}`)
}
