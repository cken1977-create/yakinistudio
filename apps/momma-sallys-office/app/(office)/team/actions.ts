'use server'
// Owner adds or removes crew logins. The member row is written as the owner
// (RLS: owner-only). The login itself is created with the service client so
// the crew member can request a sign-in link; it grants nothing by itself.
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireOwner } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function addCrew(form: FormData) {
  const me = await requireOwner()
  const email = String(form.get('email') ?? '').trim().toLowerCase()
  const name = String(form.get('display_name') ?? '').trim() || null
  if (!EMAIL.test(email)) redirect('/team?error=email')
  const db = await createClient()
  const { data: existing } = await db.from('ms_members').select('id,role,revoked_at').eq('email', email).maybeSingle()
  if (existing?.role === 'owner') redirect('/team?error=owner')
  if (existing) {
    await db.from('ms_members').update({ revoked_at: null, display_name: name ?? undefined }).eq('id', existing.id)
  } else {
    const { error } = await db.from('ms_members').insert({ email, display_name: name, role: 'crew', invited_by: (await db.auth.getUser()).data.user?.id ?? null })
    if (error) redirect('/team?error=save')
  }
  // Make sure a login exists so "email me a link" works (signups are off).
  const admin = createAdminClient()
  const { error: ce } = await admin.auth.admin.createUser({ email, email_confirm: true, user_metadata: { added_by: me.email } })
  if (ce && !/already|registered|exists/i.test(ce.message)) redirect('/team?error=login')
  revalidatePath('/team')
  redirect('/team?added=1')
}

export async function revokeMember(id: string) {
  await requireOwner()
  const db = await createClient()
  const { error } = await db.from('ms_members').update({ revoked_at: new Date().toISOString() }).eq('id', id).eq('role', 'crew')
  if (error) redirect('/team?error=revoke')
  revalidatePath('/team')
}
