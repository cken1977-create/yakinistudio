'use server'

// VIZIONZ SANKOFA · "+ Log contact" server action (case-manager home)
// Writes one case_notes row. RLS decides whether the signed-in user may
// write to this participant (case managers: own caseload only); the
// audit trigger records who did it.

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireOperatorOrEmployee } from '@/lib/supabase/auth'

const METHODS = ['in_person', 'phone', 'text', 'email', 'video', 'home_visit', 'court', 'group_session', 'referral'] as const

export type LogContactResult = { ok: true } | { ok: false; error: string }

export async function logContact(form: FormData): Promise<LogContactResult> {
  await requireOperatorOrEmployee()
  const supabase = await createClient()

  const participantId = String(form.get('participant_id') ?? '')
  const method = String(form.get('contact_method') ?? 'phone')
  const content = String(form.get('content') ?? '').trim()
  const nextAction = String(form.get('next_action') ?? '').trim()
  const nextDue = String(form.get('next_action_due') ?? '').trim()

  if (!participantId) return { ok: false, error: 'Choose a client.' }
  if (!(METHODS as readonly string[]).includes(method)) return { ok: false, error: 'Choose how you made contact.' }
  if (!content) return { ok: false, error: 'Add a short note.' }

  const { data: staffId, error: staffErr } = await supabase.rpc('vs_current_staff_id')
  if (staffErr || !staffId) {
    return { ok: false, error: 'Your login is not linked to a staff record yet. Ask Carly to link it.' }
  }

  const { error } = await supabase.from('case_notes').insert({
    participant_id: participantId,
    staff_id: staffId,
    contact_method: method,
    content: content.slice(0, 4000),
    next_action: nextAction || null,
    next_action_due: nextDue || null,
    occurred_at: new Date().toISOString(),
  })
  if (error) {
    return { ok: false, error: error.code === '42501' ? 'You can only log contacts for your own clients.' : error.message }
  }
  revalidatePath('/admin')
  return { ok: true }
}
